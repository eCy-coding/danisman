export type VaultEventType = 'UPDATE' | 'DELETE' | 'CREATE';
export type VaultStore = 'projects' | 'assets' | 'settings';

export interface SyncMessage {
  type: VaultEventType;
  store: VaultStore;
  id?: string;
  timestamp: number;
}

class SovereignSync {
  private channel: BroadcastChannel | null = null;
  private listeners: ((msg: SyncMessage) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('sovereign-sync');
      this.channel.onmessage = (event) => {
        this.notifyListeners(event.data);
      };
    }
  }

  public publish(store: VaultStore, type: VaultEventType, id?: string) {
    if (!this.channel) return;
    const msg: SyncMessage = {
      type,
      store,
      id,
      timestamp: Date.now(),
    };
    this.channel.postMessage(msg);
  }

  public subscribe(callback: (msg: SyncMessage) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(msg: SyncMessage) {
    this.listeners.forEach((cb) => cb(msg));
  }
}

export const sovereignSync = new SovereignSync();
