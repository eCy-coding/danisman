// Sovereign Vault Crypto Engine
// Uses Web Crypto API (AES-GCM) for client-side encryption.

import { Logger } from '../logger';

const KEY_STORAGE_NAME = 'sovereign-master-key';
const DB_NAME = 'SovereignVault_KeyStore';
const STORE_NAME = 'keys';

export class VaultCrypto {
  private key: CryptoKey | null = null;

  // Initialize: Get existing key or generate new one
  async init(): Promise<void> {
    if (this.key) return;

    try {
      this.key = await this.retrieveKey();
      if (!this.key) {
        Logger.info('[Vault] Generating new Master Key...');
        this.key = await this.generateKey();
        await this.storeKey(this.key);
      }
    } catch (e) {
      console.error('[Vault] Crypto Init Failed:', e);
      throw e;
    }
  }

  // Encrypt data (JSON -> Encrypted Buffer)
  async encrypt<T>(data: T): Promise<{ iv: Uint8Array; content: ArrayBuffer }> {
    if (!this.key) await this.init();

    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    const content = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      this.key!,
      encodedData
    );

    return { iv, content };
  }

  // Decrypt data (Encrypted Buffer -> JSON)
  async decrypt<T>(iv: Uint8Array, content: ArrayBuffer): Promise<T> {
    if (!this.key) await this.init();

    try {
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        this.key!,
        content
      );

      const decoded = new TextDecoder().decode(decrypted);
      return JSON.parse(decoded) as T;
    } catch (e) {
      console.error('[Vault] Decryption Failed:', e);
      throw new Error('Decryption failed. Key mismatch or corrupted data.');
    }
  }

  // --- Internal Key Management (Raw IndexedDB for Key Storage) ---

  private async generateKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      false, // non-extractable (security feature)
      ['encrypt', 'decrypt']
    );
  }

  private openKeyDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async storeKey(key: CryptoKey): Promise<void> {
    const db = await this.openKeyDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(key, KEY_STORAGE_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async retrieveKey(): Promise<CryptoKey | null> {
    const db = await this.openKeyDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_STORAGE_NAME);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }
}

export const vaultCrypto = new VaultCrypto();
