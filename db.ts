import type { Book, BookMetadata, BookContent, Quote, Note, ReadingActivity, ChatSession, NotebookData } from './types';

const DB_NAME = 'ZizhiDB';
const DB_VERSION = 10; 
const BOOK_STORE = 'books';
const CONTENT_STORE = 'book_contents';
const QUOTE_STORE = 'quotes';
const NOTE_STORE = 'notes';
const ACTIVITY_STORE = 'reading_activity';
const CHAT_STORE = 'chat_sessions';
const NOTEBOOK_STORE = 'notebooks';

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (e) => {
      dbPromise = null;
      console.error('Error opening IndexedDB:', (e.target as any)?.error);
      reject((e.target as any)?.error || 'Error opening database');
    };
    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        dbPromise = null;
      };
      resolve(dbInstance);
    };
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(BOOK_STORE)) {
        db.createObjectStore(BOOK_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CONTENT_STORE)) {
        db.createObjectStore(CONTENT_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(QUOTE_STORE)) {
        db.createObjectStore(QUOTE_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(NOTE_STORE)) {
        db.createObjectStore(NOTE_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ACTIVITY_STORE)) {
        db.createObjectStore(ACTIVITY_STORE, { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains(CHAT_STORE)) {
        db.createObjectStore(CHAT_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(NOTEBOOK_STORE)) {
        db.createObjectStore(NOTEBOOK_STORE, { keyPath: 'bookId' });
      }
    };
  });

  return dbPromise;
};

export const saveBook = async (book: Book): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
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
        
        transaction.oncomplete = () => {
            console.log(`Book ${book.id} saved successfully`);
            resolve();
        };
        transaction.onerror = (event) => {
            console.error(`Transaction error saving book ${book.id}:`, (event.target as any).error);
            reject((event.target as any).error);
        };
        transaction.onabort = (event) => {
            console.error(`Transaction aborted saving book ${book.id}:`, (event.target as any).error);
            reject((event.target as any).error);
        };
    } catch (err) {
        console.error(`Error in saveBook for ${book.id}:`, err);
        reject(err);
    }
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

export const updateBookMetadata = async (id: string, updates: Partial<BookMetadata>): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BOOK_STORE, 'readwrite');
        const store = transaction.objectStore(BOOK_STORE);
        const request = store.get(id);
        request.onsuccess = () => {
            const existing = request.result;
            if (existing) {
                store.put({ ...existing, ...updates });
            }
        };
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
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

export const saveChatSession = async (session: ChatSession): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHAT_STORE, 'readwrite');
        const request = transaction.objectStore(CHAT_STORE).put(session);
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
    });
};

export const getChatSessions = async (): Promise<ChatSession[]> => {
    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(CHAT_STORE, 'readonly');
        const request = transaction.objectStore(CHAT_STORE).getAll();
        request.onsuccess = (e) => {
            const sessions = (e.target as any).result as ChatSession[];
            resolve(sessions.sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt));
        };
    });
};

export const deleteChatSession = async (id: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHAT_STORE, 'readwrite');
        const request = transaction.objectStore(CHAT_STORE).delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
    });
};

export const saveNotebook = async (notebook: NotebookData): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(NOTEBOOK_STORE, 'readwrite');
        const request = transaction.objectStore(NOTEBOOK_STORE).put(notebook);
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
    });
};

export const getNotebook = async (bookId: string): Promise<NotebookData | null> => {
    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(NOTEBOOK_STORE, 'readonly');
        const request = transaction.objectStore(NOTEBOOK_STORE).get(bookId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
    });
};

export const getAllNotebooks = async (): Promise<NotebookData[]> => {
    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(NOTEBOOK_STORE, 'readonly');
        const request = transaction.objectStore(NOTEBOOK_STORE).getAll();
        request.onsuccess = (e) => resolve((e.target as any).result || []);
        request.onerror = () => resolve([]);
    });
};

