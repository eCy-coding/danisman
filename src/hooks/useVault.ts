import { useState, useEffect, useCallback } from 'react';
import { sovereignDB, StoreName } from '../lib/vault/db';
import { sovereignSync, VaultStore } from '../lib/vault/sync';
import { Logger } from '../lib/logger';

export function useVault<T extends { id: string }>(store: StoreName) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Assuming secure storage for projects/assets
      // For general settings we might use simple get, but let's default to secure for now or check store type
      let items: T[] = [];
      if (store === 'settings') {
         // Settings implies key-value mostly, handling array fetch for generic store might be different
         // For now, let's assume 'projects' or 'assets' uses secure getAll
         // For settings, you usually fetch by key. This hook is designed for lists.
         // Let's implement getAllSecure first.
      }
      
      items = await sovereignDB.getAllSecure<T>(store);
      setData(items);
      setLoading(false);
    } catch (err) {
      Logger.error(`[Vault] Fetch error for ${store}:`, err);
      setError(err as Error);
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    fetchData();

    // Subscribe to sync events
    const unsubscribe = sovereignSync.subscribe((msg) => {
      if (msg.store === store) {
        Logger.info(`[Vault] Sync triggered for ${store}`);
        fetchData();
      }
    });

    return () => unsubscribe();
  }, [fetchData, store]);

  // CRUD Helpers
  const add = async (item: T) => {
    try {
      await sovereignDB.putSecure(store, item);
      sovereignSync.publish(store as VaultStore, 'CREATE', item.id);
      await fetchData(); // Optimistic update or immediate re-fetch
    } catch (err) {
      Logger.error('[Vault] Add failed:', err);
      throw err;
    }
  };

  const update = async (item: T) => {
    try {
      await sovereignDB.putSecure(store, item);
      sovereignSync.publish(store as VaultStore, 'UPDATE', item.id);
      await fetchData();
    } catch (err) {
        Logger.error('[Vault] Update failed:', err);
        throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      await sovereignDB.delete(store, id);
      sovereignSync.publish(store as VaultStore, 'DELETE', id);
      await fetchData();
    } catch (err) {
        Logger.error('[Vault] Delete failed:', err);
        throw err;
    }
  };

  return { data, loading, error, add, update, remove, refresh: fetchData };
}
