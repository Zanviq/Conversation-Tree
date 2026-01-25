import { Session } from '../types';

export type StorageMode = 'browser' | 'local';

export interface StorageAdapter {
  saveSessions(sessions: Session[]): Promise<void>;
  loadSessions(): Promise<Session[]>;
  saveActiveId(id: string | null): Promise<void>;
  loadActiveId(): Promise<string | null>;
  saveModel(modelKey: string, modelValue: string): Promise<void>;
  loadModel(modelKey: string): Promise<string | null>;
  clear(): Promise<void>;
  isReady(): boolean;
}

// Browser LocalStorage Adapter
export class BrowserStorageAdapter implements StorageAdapter {
  private readonly SESSIONS_KEY = 'cosmic_fork_sessions';
  private readonly ACTIVE_ID_KEY = 'cosmic_fork_active_id';
  private readonly MODELS_KEY = 'cosmic_models';

  isReady(): boolean {
    return true;
  }

  async saveSessions(sessions: Session[]): Promise<void> {
    try {
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions to browser storage', e);
      throw e;
    }
  }

  async loadSessions(): Promise<Session[]> {
    try {
      const saved = localStorage.getItem(this.SESSIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load sessions from browser storage', e);
      return [];
    }
  }

  async saveActiveId(id: string | null): Promise<void> {
    try {
      if (id) {
        localStorage.setItem(this.ACTIVE_ID_KEY, id);
      } else {
        localStorage.removeItem(this.ACTIVE_ID_KEY);
      }
    } catch (e) {
      console.error('Failed to save active ID to browser storage', e);
      throw e;
    }
  }

  async loadActiveId(): Promise<string | null> {
    try {
      return localStorage.getItem(this.ACTIVE_ID_KEY) || null;
    } catch (e) {
      console.error('Failed to load active ID from browser storage', e);
      return null;
    }
  }

  async saveModel(modelKey: string, modelValue: string): Promise<void> {
    try {
      localStorage.setItem(modelKey, modelValue);
    } catch (e) {
      console.error('Failed to save model to browser storage', e);
      throw e;
    }
  }

  async loadModel(modelKey: string): Promise<string | null> {
    try {
      return localStorage.getItem(modelKey) || null;
    } catch (e) {
      console.error('Failed to load model from browser storage', e);
      return null;
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(this.SESSIONS_KEY);
      localStorage.removeItem(this.ACTIVE_ID_KEY);
    } catch (e) {
      console.error('Failed to clear browser storage', e);
      throw e;
    }
  }
}

// Local File Adapter using Backend API
export class LocalFileStorageAdapter implements StorageAdapter {
  isReady(): boolean {
    return true; // Always ready since we use backend API
  }

  private async writeFile(fileName: string, data: string): Promise<void> {
    try {
      const response = await fetch(`/api/storage/${fileName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: data })
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to write file');
      }
      console.log(`✅ Saved: ${fileName}`);
    } catch (e) {
      console.error(`❌ Failed to write file ${fileName}:`, e);
      throw e;
    }
  }

  private async readFile(fileName: string): Promise<string | null> {
    try {
      const response = await fetch(`/api/storage/${fileName}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        console.log(`ℹ️  File not found: ${fileName}`);
        return null;
      }

      console.log(`✅ Loaded: ${fileName}`);
      return result.data;
    } catch (e) {
      console.error(`❌ Failed to read file ${fileName}:`, e);
      throw e;
    }
  }

  async saveSessions(sessions: Session[]): Promise<void> {
    try {
      await this.writeFile('sessions.json', JSON.stringify(sessions, null, 2));
    } catch (e) {
      console.error('Failed to save sessions:', e);
      throw e;
    }
  }

  async loadSessions(): Promise<Session[]> {
    try {
      const data = await this.readFile('sessions.json');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load sessions:', e);
      return [];
    }
  }

  async saveActiveId(id: string | null): Promise<void> {
    try {
      if (id) {
        await this.writeFile('active-id.txt', id);
      }
    } catch (e) {
      console.error('Failed to save active ID:', e);
      throw e;
    }
  }

  async loadActiveId(): Promise<string | null> {
    try {
      return await this.readFile('active-id.txt');
    } catch (e) {
      console.error('Failed to load active ID:', e);
      return null;
    }
  }

  async saveModel(modelKey: string, modelValue: string): Promise<void> {
    try {
      const fileName = `model-${modelKey}.txt`;
      await this.writeFile(fileName, modelValue);
    } catch (e) {
      console.error(`Failed to save model ${modelKey}:`, e);
      throw e;
    }
  }

  async loadModel(modelKey: string): Promise<string | null> {
    try {
      const fileName = `model-${modelKey}.txt`;
      return await this.readFile(fileName);
    } catch (e) {
      console.error(`Failed to load model ${modelKey}:`, e);
      return null;
    }
  }

  async clear(): Promise<void> {
    // Not implemented for API-based storage
    console.log('ℹ️  Clear operation not implemented for API-based storage');
  }

  resetDirectory(): void {
    // Not needed for API-based storage
  }
}

// Singleton instances to maintain state across adapter recreations
let browserAdapter: BrowserStorageAdapter | null = null;
let localAdapter: LocalFileStorageAdapter | null = null;

// Factory to get storage adapter (singleton pattern)
export const getStorageAdapter = (mode: StorageMode): StorageAdapter => {
  if (mode === 'local') {
    if (!localAdapter) {
      localAdapter = new LocalFileStorageAdapter();
    }
    return localAdapter;
  }
  if (!browserAdapter) {
    browserAdapter = new BrowserStorageAdapter();
  }
  return browserAdapter;
};

// Get stored storage mode
export const getStorageMode = (): StorageMode => {
  try {
    const mode = localStorage.getItem('cosmic_storage_mode') as StorageMode | null;
    return mode || 'local';  // Changed default to 'local'
  } catch {
    return 'local';
  }
};

// Set storage mode
export const setStorageMode = (mode: StorageMode): void => {
  try {
    localStorage.setItem('cosmic_storage_mode', mode);
  } catch (e) {
    console.error('Failed to save storage mode', e);
  }
};
