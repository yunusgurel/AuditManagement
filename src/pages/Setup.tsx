import { useState } from 'react';
import { Loader } from 'lucide-react';

type SetupProps = {
  onComplete: () => void;
};

export default function Setup({ onComplete }: SetupProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleCreateDemoData = async () => {
    setLoading(true);
    setError('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-demo-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create demo data');
      }

      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Audit Management</h1>
          <p className="text-slate-600">Hoş geldiniz</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-700 font-medium">Demo hesabı oluşturuldu!</p>
            <p className="text-sm text-slate-600">Giriş yapılıyor...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-slate-700 mb-3 font-medium">Demo Hesap Bilgileri:</p>
              <div className="bg-white rounded p-3 text-sm font-mono text-slate-900 space-y-2">
                <div>
                  <p className="text-slate-600">Email:</p>
                  <p className="text-blue-600 font-semibold">yunus@demo.com</p>
                </div>
                <div>
                  <p className="text-slate-600">Şifre:</p>
                  <p className="text-blue-600 font-semibold">123</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleCreateDemoData}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader size={20} className="animate-spin" />}
              <span>{loading ? 'Hazırlanıyor...' : 'Demo Verilerini Yükle'}</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-600">veya</span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-600">
              Demo verilerini kullanmak istemiyorsanız, doğrudan{' '}
              <button
                onClick={onComplete}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                giriş yapabilirsiniz
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
