import { useState, useEffect } from 'react';
import { Building2, ListTodo, ClipboardCheck, Users, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Stats = {
  clients: number;
  tasks: { total: number; pending: number; in_progress: number; completed: number };
  audits: { total: number; draft: number; in_progress: number; completed: number };
  users: number;
};

type DashboardProps = {
  onNavigate?: (page: string) => void;
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    clients: 0,
    tasks: { total: 0, pending: 0, in_progress: 0, completed: 0 },
    audits: { total: 0, draft: 0, in_progress: 0, completed: 0 },
    users: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [clientsRes, tasksRes, auditsRes, usersRes] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('tasks').select('status'),
        supabase.from('audits').select('status'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      const taskData = tasksRes.data || [];
      const auditData = auditsRes.data || [];

      setStats({
        clients: clientsRes.count || 0,
        tasks: {
          total: taskData.length,
          pending: taskData.filter(t => t.status === 'pending').length,
          in_progress: taskData.filter(t => t.status === 'in_progress').length,
          completed: taskData.filter(t => t.status === 'completed').length,
        },
        audits: {
          total: auditData.length,
          draft: auditData.filter(a => a.status === 'draft').length,
          in_progress: auditData.filter(a => a.status === 'in_progress').length,
          completed: auditData.filter(a => a.status === 'completed').length,
        },
        users: usersRes.count || 0,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back, {profile?.full_name}</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-slate-600">Loading statistics...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 size={24} className="text-blue-600" />
                </div>
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{stats.clients}</h3>
              <p className="text-slate-600 text-sm">Total Clients</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ListTodo size={24} className="text-green-600" />
                </div>
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{stats.tasks.total}</h3>
              <p className="text-slate-600 text-sm">Total Tasks</p>
              <div className="mt-3 flex gap-2 text-xs">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                  {stats.tasks.pending} Pending
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {stats.tasks.in_progress} Active
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ClipboardCheck size={24} className="text-orange-600" />
                </div>
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{stats.audits.total}</h3>
              <p className="text-slate-600 text-sm">Total Audits</p>
              <div className="mt-3 flex gap-2 text-xs">
                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded">
                  {stats.audits.draft} Draft
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {stats.audits.in_progress} Active
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Users size={24} className="text-slate-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{stats.users}</h3>
              <p className="text-slate-600 text-sm">Team Members</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Hızlı İşlemler</h2>
              <div className="space-y-3">
                <button
                  onClick={() => onNavigate?.('tasks')}
                  className="w-full text-left px-4 py-3 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
                >
                  <div className="font-medium text-slate-900">Yeni Görev Oluştur</div>
                  <div className="text-sm text-slate-600">Takım üyelerine iş atayın</div>
                </button>
                <button
                  onClick={() => onNavigate?.('audits')}
                  className="w-full text-left px-4 py-3 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
                >
                  <div className="font-medium text-slate-900">Denetim Başlat</div>
                  <div className="text-sm text-slate-600">Yeni bir denetim süreci başlayın</div>
                </button>
                {profile?.role === 'admin' && (
                  <button
                    onClick={() => onNavigate?.('clients')}
                    className="w-full text-left px-4 py-3 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
                  >
                    <div className="font-medium text-slate-900">Müşteri Ekle</div>
                    <div className="text-sm text-slate-600">Yeni bir müşteri kaydı oluşturun</div>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Son Aktiviteler</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">Sistem başarıyla başlatıldı</p>
                    <p className="text-xs text-slate-500">Denetim Yönetim Sistemi'ne hoş geldiniz</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
