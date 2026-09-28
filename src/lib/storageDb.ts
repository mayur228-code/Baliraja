/**
 * BALIRAJA KRISHI SEVA KENDRA — Persistent IndexedDB Storage Adapter
 * 
 * Provides high-capacity, robust client storage for dynamic database entries,
 * high-resolution field visit photographs, farmer results, products, and categories.
 * Overcomes localStorage's 5MB origin limit and provides seamless cross-tab syncing.
 */

const DB_NAME = 'baliraja_content_db_v1';
const DB_VERSION = 1;
const STORE_NAME = 'content_store';
const CONTENT_KEY = 'main_content';
const SYNC_CHANNEL_NAME = 'baliraja_content_sync_channel';

// Unique instance ID for current window / session to prevent self-sync race conditions
export const CLIENT_INSTANCE_ID = 'client_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);

export async function getStoredContentFromDb<T>(): Promise<T | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return null;

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const getReq = store.get(CONTENT_KEY);
          getReq.onsuccess = () => {
            resolve((getReq.result as T) || null);
          };
          getReq.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveStoredContentToDb<T>(data: T): Promise<boolean> {
  if (typeof window === 'undefined' || !window.indexedDB) return false;

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const putReq = store.put(data, CONTENT_KEY);
          putReq.onsuccess = () => {
            broadcastContentChange(CLIENT_INSTANCE_ID);
            resolve(true);
          };
          putReq.onerror = () => resolve(false);
        } catch {
          resolve(false);
        }
      };

      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export function broadcastContentChange(senderId: string = CLIENT_INSTANCE_ID): void {
  if (typeof window === 'undefined') return;
  try {
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      bc.postMessage({ type: 'CONTENT_UPDATED', senderId, timestamp: Date.now() });
      bc.close();
    }
    // Also trigger custom window event for other listeners
    window.dispatchEvent(
      new CustomEvent('baliraja_content_updated', {
        detail: { senderId, timestamp: Date.now() }
      })
    );
  } catch {
    // ignore
  }
}

export function subscribeToContentSync(onUpdate: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let bc: BroadcastChannel | null = null;
  if ('BroadcastChannel' in window) {
    try {
      bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      bc.onmessage = (event) => {
        if (event.data?.type === 'CONTENT_UPDATED') {
          // Ignore sync notifications initiated by this exact client instance to prevent race conditions
          if (event.data.senderId !== CLIENT_INSTANCE_ID) {
            onUpdate();
          }
        }
      };
    } catch {
      // ignore
    }
  }

  const handleCustomEvent = (e: Event) => {
    const customEvt = e as CustomEvent<{ senderId?: string; timestamp?: number }>;
    if (customEvt.detail?.senderId !== CLIENT_INSTANCE_ID) {
      onUpdate();
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key?.startsWith('baliraja_')) {
      onUpdate();
    }
  };

  window.addEventListener('baliraja_content_updated', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    if (bc) {
      bc.close();
    }
    window.removeEventListener('baliraja_content_updated', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
