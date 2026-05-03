import { vaultCrypto } from './crypto';
import { Logger } from '../logger';

const DB_NAME = 'SovereignVault_Data';
const DB_VERSION = 1;

export interface EncryptedRecord {
  id: string;
  iv: Uint8Array;
  content: ArrayBuffer;
  updatedAt: number;
}

export type StoreName = 'projects' | 'assets' | 'settings' | 'action_queue';

class SovereignDB {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    this.init();
  }

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Define Stores
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('assets')) {
          db.createObjectStore('assets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        // Offline Action Queue (Mutation Outbox)
        if (!db.objectStoreNames.contains('action_queue')) {
          const queueStore = db.createObjectStore('action_queue', { keyPath: 'id', autoIncrement: true });
          queueStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
        Logger.info('[Vault] SovereignDB Connected.');
      };

      request.onerror = () => {
        Logger.error('[Vault] DB Open Error:', request.error);
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // --- Generic CRUD Operations ---

  // Stores secure encrypted data
  async putSecure<T extends { id: string }>(storeName: StoreName, data: T): Promise<void> {
    const db = await this.init();
    
    // Encrypt content
    const { iv, content } = await vaultCrypto.encrypt(data);
    
    const record: EncryptedRecord = {
      id: data.id,
      iv,
      content,
      updatedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Retrieves and decrypts data
  async getSecure<T>(storeName: StoreName, id: string): Promise<T | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      
      req.onsuccess = async () => {
        const record = req.result as EncryptedRecord;
        if (!record) {
            resolve(null);
            return;
        }
        try {
            const data = await vaultCrypto.decrypt<T>(record.iv, record.content);
            resolve(data);
        } catch (_e) {
            Logger.error('[Vault] Decryption failed for record:', id);
            resolve(null); // Or reject
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getAllSecure<T>(storeName: StoreName): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = async () => {
        const records = req.result as EncryptedRecord[];
        if (!records) {
            resolve([]);
            return;
        }
        try {
            const decryptedItems = await Promise.all(
                records.map(rec => vaultCrypto.decrypt<T>(rec.iv, rec.content))
            );
            resolve(decryptedItems);
        } catch (_e) {
             Logger.error('[Vault] Bulk decryption failed');
             resolve([]);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  // Plain storage (for settings or non-sensitive data)
  async put<T>(storeName: StoreName, data: T): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(data);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async get<T>(storeName: StoreName, key: string): Promise<T | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
  }
  
  async delete(storeName: StoreName, id: string): Promise<void> {
     const db = await this.init();
     return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
     });
  }
}

export const sovereignDB = new SovereignDB();
