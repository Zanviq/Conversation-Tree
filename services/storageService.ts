import { Session } from '../types';
import { apiFetch } from './apiClient';

export type StorageMode = 'browser' | 'server';

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

// Server Adapter: conversations are stored per user in PostgreSQL through the backend API.
// The app hands over the full session list on every state change (including each streamed chunk),
// so this adapter only sends conversations that actually changed, throttled and in order.
interface ServerSettings {
  activeConversationId: string | null;
  chatModel: string | null;
  labelModel: string | null;
}

const MODEL_SETTING_KEYS: Record<string, 'chatModel' | 'labelModel'> = {
  cosmic_chat_model: 'chatModel',
  cosmic_label_model: 'labelModel',
};

export class ServerStorageAdapter implements StorageAdapter {
  private readonly FLUSH_DELAY_MS = 800;

  private loading: Promise<void> | null = null;
  private loaded = false;
  private sessions: Session[] = [];
  private settings: ServerSettings = { activeConversationId: null, chatModel: null, labelModel: null };

  // Last JSON sent to (or received from) the server, per conversation id
  private synced = new Map<string, string>();
  private latest: Session[] | null = null;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private queue: Promise<void> = Promise.resolve();

  isReady(): boolean {
    return this.loaded;
  }

  private ensureLoaded(): Promise<void> {
    if (!this.loading) {
      this.loading = (async () => {
        const [{ sessions }, settings] = await Promise.all([
          apiFetch<{ sessions: Session[] }>('/conversations'),
          apiFetch<ServerSettings>('/settings'),
        ]);
        this.sessions = sessions;
        this.settings = settings;
        this.synced = new Map(sessions.map(s => [s.id, JSON.stringify(s)]));
        this.loaded = true;
      })().catch(e => {
        this.loading = null;
        throw e;
      });
    }
    return this.loading;
  }

  // Serialize writes so a conversation is created before anything refers to it
  private enqueue(task: () => Promise<void>): Promise<void> {
    const run = this.queue.then(task);
    this.queue = run.catch(() => {});
    return run;
  }

  private flushSessions(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    return this.enqueue(async () => {
      const sessions = this.latest;
      if (!sessions) return;
      this.latest = null;

      const currentIds = new Set(sessions.map(s => s.id));
      for (const session of sessions) {
        const json = JSON.stringify(session);
        if (this.synced.get(session.id) === json) continue;
        await apiFetch(`/conversations/${session.id}`, { method: 'PUT', body: json });
        this.synced.set(session.id, json);
      }
      for (const id of Array.from(this.synced.keys())) {
        if (currentIds.has(id)) continue;
        await apiFetch(`/conversations/${id}`, { method: 'DELETE' });
        this.synced.delete(id);
      }
    });
  }

  private saveSettings(patch: Partial<ServerSettings>): Promise<void> {
    return this.enqueue(async () => {
      this.settings = await apiFetch<ServerSettings>('/settings', {
        method: 'PUT',
        body: JSON.stringify(patch),
      });
    });
  }

  async saveSessions(sessions: Session[]): Promise<void> {
    // Ignore saves until the user's data has been loaded, so the initial empty state never overwrites it
    if (!this.loaded) return;
    this.latest = sessions;
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushSessions().catch(e => console.error('Failed to sync conversations', e));
      }, this.FLUSH_DELAY_MS);
    }
  }

  async loadSessions(): Promise<Session[]> {
    await this.ensureLoaded();
    return this.sessions;
  }

  async saveActiveId(id: string | null): Promise<void> {
    if (!this.loaded || id === this.settings.activeConversationId) return;
    // The active conversation must exist on the server first
    await this.flushSessions();
    if (id && !this.synced.has(id)) return;
    await this.saveSettings({ activeConversationId: id });
  }

  async loadActiveId(): Promise<string | null> {
    await this.ensureLoaded();
    return this.settings.activeConversationId;
  }

  async saveModel(modelKey: string, modelValue: string): Promise<void> {
    const field = MODEL_SETTING_KEYS[modelKey];
    if (!this.loaded || !field || this.settings[field] === modelValue) return;
    await this.saveSettings({ [field]: modelValue });
  }

  async loadModel(modelKey: string): Promise<string | null> {
    await this.ensureLoaded();
    const field = MODEL_SETTING_KEYS[modelKey];
    return field ? this.settings[field] : null;
  }

  async clear(): Promise<void> {
    // Sends pending changes, then drops the in-memory cache (e.g. on logout). Server data is kept.
    if (this.loaded) {
      await this.flushSessions().catch(e => console.error('Failed to sync conversations', e));
    }
    this.loading = null;
    this.loaded = false;
    this.sessions = [];
    this.synced.clear();
    this.settings = { activeConversationId: null, chatModel: null, labelModel: null };
  }
}

// Singleton instances to maintain state across adapter recreations
let browserAdapter: BrowserStorageAdapter | null = null;
let serverAdapter: ServerStorageAdapter | null = null;

// Factory to get storage adapter (singleton pattern)
export const getStorageAdapter = (mode: StorageMode): StorageAdapter => {
  if (mode === 'server') {
    if (!serverAdapter) {
      serverAdapter = new ServerStorageAdapter();
    }
    return serverAdapter;
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
    return mode || 'server';
  } catch {
    return 'server';
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
