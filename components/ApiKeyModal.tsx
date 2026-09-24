import React, { useState } from 'react';
import { Key, X, Loader, ExternalLink, Trash2 } from 'lucide-react';
import { validateApiKey } from '../services/geminiService';
import { GEMINI_KEY_URL, getGeminiApiKey, setGeminiApiKey } from '../services/apiKeyStore';

interface ApiKeyModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, onSaved }) => {
  const hasSavedKey = getGeminiApiKey().length > 0;
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!apiKey.trim()) {
      setError('Please enter a Gemini API key.');
      return;
    }
    setIsValidating(true);
    try {
      const validation = await validateApiKey(apiKey.trim());
      if (!validation.valid) {
        setError(validation.error || 'Invalid API Key');
        return;
      }
      setGeminiApiKey(apiKey.trim());
      onSaved();
      onClose();
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    setGeminiApiKey(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-space-950 border border-space-700 rounded-2xl shadow-2xl p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">Gemini API Key</h3>
            <p className="text-sm text-gray-400 mt-1">
              AI responses and node labels use your own Gemini API key.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <div className="text-xs rounded-lg border border-space-800 bg-space-900/60 p-3 text-gray-400 space-y-1">
          <div>Status: {hasSavedKey
            ? <span className="text-emerald-400 font-medium">key saved in this browser</span>
            : <span className="text-amber-400 font-medium">no key – AI features are disabled</span>}
          </div>
          <div>The key is stored only in this browser (localStorage) and is sent directly to Google. It is never sent to this app's server.</div>
        </div>

        <div className="space-y-2">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key size={16} className="text-gray-500 group-focus-within:text-nebula-400 transition-colors" />
            </div>
            <input
              type="password"
              value={apiKey}
              autoComplete="off"
              onChange={e => { setApiKey(e.target.value); setError(null); }}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              placeholder={hasSavedKey ? 'Enter a new key to replace the saved one' : 'Enter your API Key...'}
              className={`w-full bg-space-900 border rounded-xl py-3 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 ${
                error ? 'border-red-500 focus:ring-red-500' : 'border-space-700 focus:border-nebula-500 focus:ring-nebula-500'
              }`}
            />
          </div>
          {error && <div className="text-xs text-red-300">{error}</div>}
          <a
            href={GEMINI_KEY_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-nebula-400 hover:text-nebula-500"
          >
            Get a free API key from Google AI Studio <ExternalLink size={12} />
          </a>
        </div>

        <div className="flex items-center justify-between gap-2">
          {hasSavedKey ? (
            <button
              onClick={handleRemove}
              className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg text-gray-400 hover:text-red-300 hover:bg-space-800"
            >
              <Trash2 size={14} /> Remove key
            </button>
          ) : <span />}
          <button
            onClick={handleSave}
            disabled={isValidating}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-nebula-600 hover:bg-nebula-500 text-white disabled:opacity-50"
          >
            {isValidating ? <><Loader size={14} className="animate-spin" /> Validating...</> : 'Validate & Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
