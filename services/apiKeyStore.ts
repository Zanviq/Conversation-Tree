import { useSyncExternalStore } from 'react';

// The Gemini API key is entered by the user and kept only in this browser's localStorage.
// It is sent directly from the browser to Google and never to this app's server.

const STORAGE_KEY = 'GEMINI_API_KEY';
export const GEMINI_KEY_URL = 'https://aistudio.google.com/apikey';

const listeners = new Set<() => void>();

export const getGeminiApiKey = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

export const setGeminiApiKey = (key: string | null) => {
  try {
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to update API key in browser storage', e);
  }
  listeners.forEach((l) => l());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
};

export const useGeminiApiKey = () => useSyncExternalStore(subscribe, getGeminiApiKey);
