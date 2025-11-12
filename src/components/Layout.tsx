import { useState } from 'react';
import { LogOut, Menu, X, Users, Building2, FileText, ListTodo, ClipboardCheck, Folder, BarChart3, User, CheckSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type LayoutProps = {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
};

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, adminOnly: false },
    { id: 'clients', label: 'Clients', icon: Building2, adminOnly: isAdmin },
    { id: 'users', label: 'User Management', icon: Users, adminOnly: true },
    { id: 'tasks', label: 'Tasks', icon: ListTodo, adminOnly: false },
    { id: 'audits', label: 'Audits', icon: ClipboardCheck, adminOnly: false },
    { id: 'checklists', label: 'Checklists', icon: CheckSquare, adminOnly: false },
    { id: 'templates', label: 'Form Templates', icon: FileText, adminOnly: isAdmin },
    { id: 'documents', label: 'Documents', icon: Folder, adminOnly: false },
    { id: 'profile', label: 'Profile', icon: User, adminOnly: false },
  ].filter(item => !item.adminOnly || isAdmin);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-bold text-slate-900">Audit Management</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-40
            w-64 bg-white border-r border-slate-200
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-slate-200 hidden lg:block">
              <h1 className="text-2xl font-bold text-slate-900">Audit Management</h1>
              <p className="text-sm text-slate-600 mt-1">{profile?.full_name}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {profile?.role === 'admin' ? 'Administrator' : 'Team Member'}
              </span>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg transition
                      ${isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-100'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
