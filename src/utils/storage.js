import { HANDLE_DB_NAME, HANDLE_STORE, SESSION_BUFFER_KEY, DEFAULT_FILE_DATA } from '../constants';

export const openHandleDB = () => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('No IDB'));
    const req = window.indexedDB.open(HANDLE_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(HANDLE_STORE)) {
        db.createObjectStore(HANDLE_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const rememberFileHandle = async (handle) => {
  try {
    const db = await openHandleDB();
    return new Promise((resolve) => {
      const tx = db.transaction(HANDLE_STORE, 'readwrite');
      tx.objectStore(HANDLE_STORE).put(handle, 'lastFileHandle');
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
};

export const getRememberedFileHandle = async () => {
  try {
    const db = await openHandleDB();
    return new Promise((resolve) => {
      const tx = db.transaction(HANDLE_STORE, 'readonly');
      const req = tx.objectStore(HANDLE_STORE).get('lastFileHandle');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
};

export const clearRememberedFileHandle = async () => {
  try {
    const db = await openHandleDB();
    const tx = db.transaction(HANDLE_STORE, 'readwrite');
    tx.objectStore(HANDLE_STORE).delete('lastFileHandle');
  } catch (e) {}
};

export const loadInitialBuffer = () => {
  try {
    const cached = localStorage.getItem(SESSION_BUFFER_KEY);
    if (cached) return { ...DEFAULT_FILE_DATA, ...JSON.parse(cached) };
  } catch (e) {}
  return DEFAULT_FILE_DATA;
};