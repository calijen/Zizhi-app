import type { Book } from '../types';

const DB_NAME = 'zizhi-library';
const DB_VERSION = 1;
const STORE_NAME = 'books';

let db: IDBDatabase;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Database error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const getBooks = (): Promise<Book[]> => {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const addBook = (book: Book): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(book);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const updateBook = (book: Book): Promise<void> => {
    return addBook(book); // put() handles both create and update
}

export const deleteBook = (bookId: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(bookId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};
