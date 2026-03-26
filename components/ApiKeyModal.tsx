
import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { getUserApiKey, setUserApiKey, clearUserApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const currentKey = getUserApiKey();
    if (currentKey) {
      setApiKey(currentKey);
      setSaved(true);
    }
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      setUserApiKey(apiKey.trim());
      setSaved(true);
      alert('Đã lưu API Key thành công!');
      onClose();
    }
  };

  const handleClear = () => {
    if (confirm('Bạn có chắc chắn muốn xóa API Key này không?')) {
      clearUserApiKey();
      setApiKey('');
      setSaved(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <Key className="text-yellow-400" size={24} />
            <h2 className="text-xl font-black uppercase tracking-wide">Cài đặt Gemini API</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <p className="text-sm text-indigo-800 font-medium leading-relaxed">
              Nhập API Key của riêng bạn để sử dụng không giới hạn và tốc độ cao hơn. 
              Key được lưu cục bộ trên trình duyệt của bạn (LocalStorage).
            </p>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-black text-indigo-600 uppercase tracking-widest mt-2 block hover:underline"
            >
              Lấy API Key tại đây &rarr;
            </a>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Google Gemini API Key</label>
            <div className="relative">
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setSaved(false); }}
                className={`w-full p-4 border-2 rounded-xl font-mono text-sm outline-none transition-all ${saved ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 focus:border-indigo-500'}`}
                placeholder="AIzaSy..."
              />
              {saved && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                  <CheckCircle size={20} />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {saved && (
              <button 
                onClick={handleClear}
                className="px-4 py-3 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                <Trash2 size={18} /> Xóa Key
              </button>
            )}
            <button 
              onClick={handleSave}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all"
            >
              {saved ? 'Cập nhật Key' : 'Lưu cài đặt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
