import { useState, useEffect, useRef } from 'react';
import { Folder as FolderIcon, File, Building2, FolderPlus, FileUp, X, Download, Trash2 } from 'lucide-react';
import { supabase, Client, Folder, Document } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type FolderWithClient = Folder & { clients?: Client };

export default function DocumentsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [folders, setFolders] = useState<FolderWithClient[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [uploadingFolderId, setUploadingFolderId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadFolders();
    }
  }, [selectedClientId]);

  useEffect(() => {
    if (selectedFolderId) {
      loadDocuments();
    } else {
      setDocuments([]);
    }
  }, [selectedFolderId]);

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
      setSelectedFolderId('');
    } catch (err) {
      console.error('Error loading folders:', err);
    }
  };

  const loadDocuments = async () => {
    if (!selectedFolderId) return;
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('folder_id', selectedFolderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, folderId: string) => {
    const files = e.currentTarget.files;
    if (!files) return;

    const allowedTypes = ['.txt', '.doc', '.docx', '.xls', '.xlsx', '.csv'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!allowedTypes.includes(fileExtension)) {
        alert(`Invalid file type: ${file.name}. Only .txt, .doc, .docx, .xls, .xlsx, .csv are allowed.`);
        continue;
      }

      setUploadingFolderId(folderId);
      setUploadProgress(0);

      try {
        const fileBuffer = await file.arrayBuffer();
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `documents/${folderId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, fileBuffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('documents')
          .insert([{
            filename: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: filePath,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            folder_id: folderId,
          }]);

        if (dbError) throw dbError;

        setUploadProgress(100);
        setTimeout(() => {
          setUploadingFolderId(null);
          setUploadProgress(0);
          loadDocuments();
        }, 500);
      } catch (err) {
        console.error('Error uploading file:', err);
        alert('Error uploading file. Please try again.');
        setUploadingFolderId(null);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (docId: string, storagePath: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([storagePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);

      if (dbError) throw dbError;

      loadDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Error deleting document. Please try again.');
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Error downloading document. Please try again.');
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  const folderTypes = [
    { type: 'meeting_notes', label: 'Meeting Notes', icon: '📝' },
    { type: 'working_papers', label: 'Working Papers', icon: '📄' },
    { type: 'contracts', label: 'Contracts', icon: '📋' },
    { type: 'evidence', label: 'Evidence', icon: '🗂️' },
  ];

  const getFoldersByType = (type: string) => {
    return folders.filter(f => f.folder_type === type);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('word')) return '📄';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('text')) return '📝';
    return '📎';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Document Management</h1>
        <p className="text-slate-600 mt-1">Organize and manage client documents</p>
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
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
                  >
                    <FolderPlus size={16} />
                    <span>Add Folder</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {getFoldersByType(type).map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={`flex items-center gap-3 p-3 border rounded-lg transition ${
                        selectedFolderId === folder.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <FolderIcon size={24} className="text-blue-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-900 truncate">{folder.name}</span>
                    </button>
                  ))}
                  {getFoldersByType(type).length === 0 && (
                    <div className="col-span-full text-center py-8 text-slate-500 text-sm">
                      No folders yet
                    </div>
                  )}
                </div>
              </div>
            ))}

            {selectedFolder && (
              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Documents in <span className="text-blue-600">{selectedFolder.name}</span>
                  </h3>
                </div>

                <div className="mb-6 p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 transition cursor-pointer relative"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.doc,.docx,.xls,.xlsx,.csv"
                    onChange={(e) => handleFileSelect(e, selectedFolder.id)}
                    className="hidden"
                  />

                  {uploadingFolderId === selectedFolder.id ? (
                    <div className="text-center">
                      <div className="mb-3">
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm">Uploading {uploadProgress}%</p>
                    </div>
                  ) : (
                    <>
                      <FileUp size={48} className="mx-auto text-slate-400 mb-3" />
                      <p className="text-slate-600 mb-2">Upload documents</p>
                      <p className="text-sm text-slate-500">Supported: .txt, .doc, .docx, .xls, .xlsx, .csv</p>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  {documents.length > 0 ? (
                    documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{getFileIcon(doc.file_type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">{doc.filename}</p>
                            <p className="text-sm text-slate-500">{formatFileSize(doc.file_size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadDocument(doc)}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Download"
                          >
                            <Download size={20} />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id, doc.storage_path)}
                            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <p>No documents in this folder</p>
                    </div>
                  )}
                </div>
              </div>
            )}
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
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('folders').insert([
        {
          client_id: clientId,
          name,
          folder_type: folderType,
          created_by: user.id,
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Create Folder</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X size={24} />
          </button>
        </div>

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
              placeholder="Enter folder name"
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
