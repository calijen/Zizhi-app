import type { Book, BookMetadata, BookContent, Quote, Note, ReadingActivity } from './types';

const DB_NAME = 'ZizhiDB';
const DB_VERSION = 6; 
const BOOK_STORE = 'books';
const CONTENT_STORE = 'book_contents';
const QUOTE_STORE = 'quotes';
const NOTE_STORE = 'notes';
const ACTIVITY_STORE = 'reading_activity';

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
      if (!dbInstance.objectStoreNames.contains(CONTENT_STORE)) {
        dbInstance.createObjectStore(CONTENT_STORE, { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(QUOTE_STORE)) {
        dbInstance.createObjectStore(QUOTE_STORE, { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(NOTE_STORE)) {
        dbInstance.createObjectStore(NOTE_STORE, { keyPath: 'id' });
      }
      if (!dbInstance.objectStoreNames.contains(ACTIVITY_STORE)) {
        dbInstance.createObjectStore(ACTIVITY_STORE, { keyPath: 'date' });
      }
    };
  });
};

export const saveBook = async (book: Book): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([BOOK_STORE, CONTENT_STORE], 'readwrite');
    
    // Extract metadata
    const { chapters, toc, summaryScript, audioSummaryUrl, audioDuration, pdfData, ...metadata } = book;
    const content = { id: book.id, chapters, toc, summaryScript, audioSummaryUrl, audioDuration, pdfData };
    
    // Add flags to metadata
    const metadataWithFlags = {
        ...metadata,
        hasSummary: !!summaryScript,
        hasAudio: !!audioSummaryUrl
    };

    const bookStore = transaction.objectStore(BOOK_STORE);
    const contentStore = transaction.objectStore(CONTENT_STORE);
    
    bookStore.put(metadataWithFlags);
    contentStore.put(content);
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject();
  });
};

export const getBooks = async (): Promise<BookMetadata[]> => {
    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(BOOK_STORE, 'readonly');
        transaction.objectStore(BOOK_STORE).getAll().onsuccess = (e) => resolve((e.target as any).result);
    });
};

export const getBookContent = async (id: string): Promise<BookContent | null> => {
    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(CONTENT_STORE, 'readonly');
        const request = transaction.objectStore(CONTENT_STORE).get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
    });
};

export const deleteBook = async (id: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([BOOK_STORE, CONTENT_STORE], 'readwrite');
        transaction.objectStore(BOOK_STORE).delete(id);
        transaction.objectStore(CONTENT_STORE).delete(id);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject();
    });
};

export const saveQuote = async (quote: Quote): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(QUOTE_STORE, 'readwrite');
        const request = transaction.objectStore(QUOTE_STORE).put(quote);
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
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
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(QUOTE_STORE, 'readwrite');
        const request = transaction.objectStore(QUOTE_STORE).delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
    });
};

export const saveNote = async (note: Note): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(NOTE_STORE, 'readwrite');
        const request = transaction.objectStore(NOTE_STORE).put(note);
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
    });
};

export const getNotes = async (): Promise<Note[]> => {
    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(NOTE_STORE, 'readonly');
        transaction.objectStore(NOTE_STORE).getAll().onsuccess = (e) => resolve((e.target as any).result);
    });
};

export const deleteNote = async (id: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(NOTE_STORE, 'readwrite');
        const request = transaction.objectStore(NOTE_STORE).delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
    });
};

export const logActivity = async (seconds: number): Promise<void> => {
    const db = await initDB();
    const date = new Date().toISOString().split('T')[0];
    return new Promise((resolve) => {
        const transaction = db.transaction(ACTIVITY_STORE, 'readwrite');
        const store = transaction.objectStore(ACTIVITY_STORE);
        const request = store.get(date);
        request.onsuccess = () => {
            const existing = request.result as ReadingActivity;
            if (existing) {
                existing.seconds += seconds;
                store.put(existing).onsuccess = () => resolve();
            } else {
                store.put({ date, seconds }).onsuccess = () => resolve();
            }
        };
    });
};

export const getActivity = async (): Promise<ReadingActivity[]> => {
    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(ACTIVITY_STORE, 'readonly');
        transaction.objectStore(ACTIVITY_STORE).getAll().onsuccess = (e) => resolve((e.target as any).result);
    });
};