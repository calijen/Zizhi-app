import type { Book } from './types';

const DB_NAME = 'ZizhiDB';
const DB_VERSION = 1;
const STORE_NAME = 'books';

let db: IDBDatabase;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject('Error opening database');
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveBook = async (book: Book): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    // We remove fields that can't be cloned for storage
    const { coverImageUrl, chapters, toc, audioTrailerUrl, ...storableBook } = book;
    
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(storableBook);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error saving book: ' + request.error);
  });
};

export const getBooks = async (): Promise<Book[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Error getting books');
    });
};

export const deleteBook = async (id: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Error deleting book');
    });
};
