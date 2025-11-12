import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Trash2, Plus } from 'lucide-react';
import { supabase, Checklist, ChecklistItem, Client } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type ChecklistWithItems = Checklist & {
  items?: ChecklistItem[];
  clients?: Client;
};

export default function Checklists() {
  const { user } = useAuth();
  const [checklists, setChecklists] = useState<ChecklistWithItems[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [showNewChecklistModal, setShowNewChecklistModal] = useState(false);

  useEffect(() => {
    loadChecklists();
    loadClients();
  }, []);

  const loadChecklists = async () => {
    try {
      const { data, error } = await supabase
        .from('checklists')
        .select('*, checklist_items(*), clients(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const formattedData = data?.map(checklist => ({
        ...checklist,
        items: checklist.checklist_items,
        clients: checklist.clients
      })) || [];

      setChecklists(formattedData);
      if (formattedData.length > 0) {
        setSelectedChecklist(formattedData[0]);
      }
    } catch (err) {
      console.error('Error loading checklists:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    const { data } = await supabase.from('clients').select('*');
    setClients(data || []);
  };

  const handleToggleItem = async (itemId: string, isChecked: boolean) => {
    try {
      const { error } = await supabase
        .from('checklist_items')
        .update({
          is_checked: !isChecked,
          checked_by: !isChecked ? user?.id : null,
          checked_at: !isChecked ? new Date().toISOString() : null,
        })
        .eq('id', itemId);

      if (error) throw error;
      await loadChecklists();
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const handleAddItem = async () => {
    if (!newItemText.trim() || !selectedChecklist) return;

    try {
      const maxOrder = Math.max(
        0,
        ...(selectedChecklist.items?.map(i => i.order_index) || [])
      );

      const { error } = await supabase.from('checklist_items').insert([
        {
          checklist_id: selectedChecklist.id,
          description: newItemText,
          is_checked: false,
          order_index: maxOrder + 1,
        },
      ]);

      if (error) throw error;
      setNewItemText('');
      await loadChecklists();
    } catch (err) {
      console.error('Error adding item:', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Bu öğeyi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      await loadChecklists();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-slate-600">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Denetim Kontrol Listeleri</h1>
          <p className="text-slate-600 mt-1">Denetim ilerleme durumunu takip edin</p>
        </div>
        <button
          onClick={() => setShowNewChecklistModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus size={20} />
          <span>Yeni Kontrol Listesi</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-2 max-h-[600px] overflow-y-auto">
            {checklists.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-4">Kontrol listesi yok</p>
            ) : (
              checklists.map((checklist) => (
                <button
                  key={checklist.id}
                  onClick={() => setSelectedChecklist(checklist)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    selectedChecklist?.id === checklist.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <p className="font-medium truncate">{checklist.title}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {checklist.clients?.name || 'İsim yok'}
                  </p>
                  <p className="text-xs mt-1 opacity-75">
                    {checklist.items?.filter(i => i.is_checked).length || 0}/
                    {checklist.items?.length || 0} tamamlandı
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedChecklist ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {selectedChecklist.title}
              </h2>
              <p className="text-slate-600 mb-6">
                {selectedChecklist.clients?.name || 'İsim yok'}
              </p>

              <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto">
                {selectedChecklist.items && selectedChecklist.items.length > 0 ? (
                  selectedChecklist.items
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition"
                      >
                        <button
                          onClick={() => handleToggleItem(item.id, item.is_checked)}
                          className="flex-shrink-0 transition"
                        >
                          {item.is_checked ? (
                            <CheckCircle2 size={24} className="text-green-600" />
                          ) : (
                            <Circle size={24} className="text-slate-400 hover:text-slate-600" />
                          )}
                        </button>
                        <span
                          className={`flex-1 ${
                            item.is_checked
                              ? 'line-through text-slate-500'
                              : 'text-slate-900'
                          }`}
                        >
                          {item.description}
                        </span>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="flex-shrink-0 text-red-600 hover:text-red-700 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                ) : (
                  <p className="text-slate-600 text-center py-8">Kontrol listesi öğesi yok</p>
                )}
              </div>

              <div className="flex gap-2 pt-6 border-t border-slate-200">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddItem();
                    }
                  }}
                  placeholder="Yeni öğe ekleyin..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <Plus size={20} />
                </button>
              </div>

              {selectedChecklist.items && selectedChecklist.items.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">İlerleme</span>
                    <span className="text-sm font-bold text-blue-600">
                      %
                      {Math.round(
                        (selectedChecklist.items.filter(i => i.is_checked).length /
                          selectedChecklist.items.length) *
                          100
                      )}
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (selectedChecklist.items.filter(i => i.is_checked).length /
                            selectedChecklist.items.length) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <p className="text-slate-600">Kontrol listesi seçin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
