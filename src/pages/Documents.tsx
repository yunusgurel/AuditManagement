import { useState, useEffect } from 'react';
import { Folder as FolderIcon, File, Building2, FolderPlus, FileUp } from 'lucide-react';
import { supabase, Client, Folder } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type FolderWithClient = Folder & { clients?: Client };

export default function Documents() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [folders, setFolders] = useState<FolderWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadFolders();
    }
  }, [selectedClientId]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(data || []);
      if (data && data.length > 0) {
        setSelectedClientId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*, clients(*)')
        .eq('client_id', selectedClientId)
        .is('parent_id', null);

      if (error) throw error;
      setFolders(data?.map(folder => ({
        ...folder,
        clients: folder.clients
      })) || []);
    } catch (err) {
      console.error('Error loading folders:', err);
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const folderTypes = [
    { type: 'meeting_notes', label: 'Meeting Notes', icon: '📝' },
    { type: 'working_papers', label: 'Working Papers', icon: '📄' },
    { type: 'contracts', label: 'Contracts', icon: '📋' },
    { type: 'evidence', label: 'Evidence', icon: '🗂️' },
  ];

  const getFoldersByType = (type: string) => {
    return folders.filter(f => f.folder_type === type);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Document Management</h1>
          <p className="text-slate-600 mt-1">Organize and manage client documents</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <Building2 size={24} className="text-slate-600" />
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {selectedClient && (
          <div className="space-y-6">
            {folderTypes.map(({ type, label, icon }) => (
              <div key={type} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <span>{icon}</span>
                    <span>{label}</span>
                  </h3>
                  <button
                    onClick={() => setShowCreateFolder(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <FolderPlus size={16} />
                    <span>Add Folder</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {getFoldersByType(type).map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                    >
                      <FolderIcon size={24} className="text-blue-600" />
                      <span className="text-sm font-medium text-slate-900">{folder.name}</span>
                    </div>
                  ))}
                  {getFoldersByType(type).length === 0 && (
                    <div className="col-span-full text-center py-8 text-slate-500 text-sm">
                      No folders yet
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="mt-6 p-6 border-2 border-dashed border-slate-300 rounded-lg text-center hover:border-blue-500 transition cursor-pointer">
              <FileUp size={48} className="mx-auto text-slate-400 mb-3" />
              <p className="text-slate-600 mb-2">Upload documents</p>
              <p className="text-sm text-slate-500">Click to select files or drag and drop</p>
            </div>
          </div>
        )}
      </div>

      {showCreateFolder && selectedClientId && (
        <CreateFolderModal
          clientId={selectedClientId}
          onClose={() => setShowCreateFolder(false)}
          onSuccess={() => {
            setShowCreateFolder(false);
            loadFolders();
          }}
        />
      )}
    </div>
  );
}

function CreateFolderModal({
  clientId,
  onClose,
  onSuccess,
}: {
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [folderType, setFolderType] = useState<Folder['folder_type']>('working_papers');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.from('folders').insert([
        {
          client_id: clientId,
          name,
          folder_type: folderType,
          created_by: user?.id,
        },
      ]);

      if (error) throw error;
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Folder</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Folder Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Folder Type *</label>
            <select
              value={folderType}
              onChange={(e) => setFolderType(e.target.value as Folder['folder_type'])}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="meeting_notes">Meeting Notes</option>
              <option value="working_papers">Working Papers</option>
              <option value="contracts">Contracts</option>
              <option value="evidence">Evidence</option>
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
              {loading ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
