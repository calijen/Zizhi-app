
import type { Book, Quote } from './types';

const DB_NAME = 'ZizhiDB';
const DB_VERSION = 3; // Bump version for quotes store
const BOOK_STORE = 'books';
const QUOTE_STORE = 'quotes';

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
      if (!dbInstance.objectStoreNames.contains(BOOK_STORE)) {
        dbInstance.createObjectStore(BOOK_STORE, { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(QUOTE_STORE)) {
        dbInstance.createObjectStore(QUOTE_STORE, { keyPath: 'id' });
      }
    };
  });
};

export const saveBook = async (book: Book): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BOOK_STORE, 'readwrite');
    const store = transaction.objectStore(BOOK_STORE);
    store.put(book).onsuccess = () => resolve();
  });
};

export const getBooks = async (): Promise<Book[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BOOK_STORE, 'readonly');
        db.transaction(BOOK_STORE, 'readonly').objectStore(BOOK_STORE).getAll().onsuccess = (e) => resolve((e.target as any).result);
    });
};

export const deleteBook = async (id: string): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(BOOK_STORE, 'readwrite');
    transaction.objectStore(BOOK_STORE).delete(id);
};

export const saveQuote = async (quote: Quote): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(QUOTE_STORE, 'readwrite');
        transaction.objectStore(QUOTE_STORE).put(quote).onsuccess = () => resolve();
    });
};

export const getQuotes = async (): Promise<Quote[]> => {
    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(QUOTE_STORE, 'readonly');
        transaction.objectStore(QUOTE_STORE).getAll().onsuccess = (e) => resolve((e.target as any).result);
    });
};

export const deleteQuote = async (id: string): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(QUOTE_STORE, 'readwrite');
    transaction.objectStore(QUOTE_STORE).delete(id);
};
