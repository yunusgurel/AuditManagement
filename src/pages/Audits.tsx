import { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, Building2, FileText } from 'lucide-react';
import { supabase, Audit, Client, Task, FormTemplate } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type AuditWithDetails = Audit & {
  clients?: Client;
  tasks?: Task;
  form_templates?: FormTemplate;
};

export default function Audits() {
  const { profile, user } = useAuth();
  const [audits, setAudits] = useState<AuditWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'draft' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('*, clients(*), tasks(*), form_templates(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAudits(data?.map(audit => ({
        ...audit,
        clients: audit.clients,
        tasks: audit.tasks,
        form_templates: audit.form_templates
      })) || []);
    } catch (err) {
      console.error('Error loading audits:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAudits = audits.filter(audit => filter === 'all' || audit.status === filter);

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Audits</h1>
          <p className="text-slate-600 mt-1">Manage audit processes and forms</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus size={20} />
          <span>Start Audit</span>
        </button>
      </div>

      <div className="flex gap-2">
        {(['all', 'draft', 'in_progress', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg transition ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-slate-600">Loading audits...</p>
        </div>
      ) : filteredAudits.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <ClipboardCheck size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600">No audits found. Start a new audit to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAudits.map((audit) => (
            <div key={audit.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <ClipboardCheck size={24} className="text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {audit.clients?.name || 'Audit'}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {audit.form_templates?.name || 'No template'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {audit.clients && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building2 size={16} />
                        <span>{audit.clients.name}</span>
                      </div>
                    )}
                    {audit.form_templates && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <FileText size={16} />
                        <span>{audit.form_templates.template_type}</span>
                      </div>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[audit.status]}`}>
                      {audit.status.replace('_', ' ').charAt(0).toUpperCase() + audit.status.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AuditModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadAudits();
          }}
          userId={user?.id}
        />
      )}
    </div>
  );
}

function AuditModal({
  onClose,
  onSuccess,
  userId,
}: {
  onClose: () => void;
  onSuccess: () => void;
  userId?: string;
}) {
  const [clientId, setClientId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [clientsRes, tasksRes, templatesRes] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('form_templates').select('*'),
    ]);

    setClients(clientsRes.data || []);
    setTasks(tasksRes.data || []);
    setTemplates(templatesRes.data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.from('audits').insert([
        {
          client_id: clientId || null,
          task_id: taskId || null,
          form_template_id: templateId || null,
          status: 'draft',
          form_data: {},
          created_by: userId,
        },
      ]);

      if (error) throw error;
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create audit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Start New Audit</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select client...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Related Task (Optional)</label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select task...</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Form Template</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.template_type})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Start Audit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
