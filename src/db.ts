import type { Book, BookMetadata, BookContent, Quote, Note, ReadingActivity, ChatSession } from './types';
import * as firebase from './firebase';
import { auth } from './firebase';

const DB_NAME = 'ZizhiDB';
const DB_VERSION = 8; 
const BOOK_STORE = 'books';
const CONTENT_STORE = 'book_contents';
const QUOTE_STORE = 'quotes';
const NOTE_STORE = 'notes';
const ACTIVITY_STORE = 'reading_activity';
const CHAT_STORE = 'chat_sessions';

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
      if (!dbInstance.objectStoreNames.contains(CHAT_STORE)) {
        dbInstance.createObjectStore(CHAT_STORE, { keyPath: 'id' });
      }
    };
  });
};

export const saveBook = async (book: Book): Promise<void> => {
  // Sync to Cloud
  if (auth.currentUser) {
    try {
      await firebase.saveBookToCloud(book);
    } catch (e) {
      console.error("Cloud sync failed (saveBook)", e);
    }
  }

  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
        const transaction = db.transaction([BOOK_STORE, CONTENT_STORE], 'readwrite');
        
        const { chapters, toc, summaryScript, audioSummaryUrl, audioDuration, pdfData, ...metadata } = book;
        const content = { id: book.id, chapters, toc, summaryScript, audioSummaryUrl, audioDuration, pdfData };
        
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
        transaction.onerror = (event) => reject((event.target as any).error);
    } catch (err) {
        reject(err);
    }
  });
};

export const getBooks = async (): Promise<BookMetadata[]> => {
    // If logged in, we could merge or take cloud as truth. 
    // For simplicity, we try cloud if online, otherwise local.
    if (auth.currentUser) {
        try {
            const cloudBooks = await firebase.getBooksFromCloud();
            if (cloudBooks.length > 0) return cloudBooks;
        } catch (e) {
            console.error("Cloud fetch failed (getBooks)", e);
        }
    }

    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(BOOK_STORE, 'readonly');
        transaction.objectStore(BOOK_STORE).getAll().onsuccess = (e) => resolve((e.target as any).result);
    });
};

export const getBookContent = async (id: string): Promise<BookContent | null> => {
    if (auth.currentUser) {
        try {
            const cloudContent = await firebase.getBookContentFromCloud(id);
            if (cloudContent) return cloudContent;
        } catch (e) {
            console.error("Cloud fetch failed (getBookContent)", e);
        }
    }

    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(CONTENT_STORE, 'readonly');
        const request = transaction.objectStore(CONTENT_STORE).get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
    });
};

export const deleteBook = async (id: string): Promise<void> => {
    if (auth.currentUser) {
        try {
            await firebase.deleteBookFromCloud(id);
        } catch (e) {
            console.error("Cloud sync failed (deleteBook)", e);
        }
    }

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
    if (auth.currentUser) {
        try {
            await firebase.saveQuoteToCloud(quote);
        } catch (e) {
            console.error("Cloud sync failed (saveQuote)", e);
        }
    }

    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(QUOTE_STORE, 'readwrite');
        const request = transaction.objectStore(QUOTE_STORE).put(quote);
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
    });
};

export const getQuotes = async (): Promise<Quote[]> => {
    if (auth.currentUser) {
        try {
            const cloudQuotes = await firebase.getQuotesFromCloud();
            if (cloudQuotes.length > 0) return cloudQuotes;
        } catch (e) {
            console.error("Cloud fetch failed (getQuotes)", e);
        }
    }

    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(QUOTE_STORE, 'readonly');
        transaction.objectStore(QUOTE_STORE).getAll().onsuccess = (e) => resolve((e.target as any).result);
    });
};

export const deleteQuote = async (id: string): Promise<void> => {
    if (auth.currentUser) {
        try {
            await firebase.deleteQuoteFromCloud(id);
        } catch (e) {
            console.error("Cloud sync failed (deleteQuote)", e);
        }
    }

    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(QUOTE_STORE, 'readwrite');
        const request = transaction.objectStore(QUOTE_STORE).delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
    });
};

export const saveNote = async (note: Note): Promise<void> => {
    if (auth.currentUser) {
        try {
            await firebase.saveNoteToCloud(note);
        } catch (e) {
            console.error("Cloud sync failed (saveNote)", e);
        }
    }

    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(NOTE_STORE, 'readwrite');
        const request = transaction.objectStore(NOTE_STORE).put(note);
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
    });
};

export const getNotes = async (): Promise<Note[]> => {
    if (auth.currentUser) {
        try {
            const cloudNotes = await firebase.getNotesFromCloud();
            if (cloudNotes.length > 0) return cloudNotes;
        } catch (e) {
            console.error("Cloud fetch failed (getNotes)", e);
        }
    }

    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(NOTE_STORE, 'readonly');
        transaction.objectStore(NOTE_STORE).getAll().onsuccess = (e) => resolve((e.target as any).result);
    });
};

export const deleteNote = async (id: string): Promise<void> => {
    if (auth.currentUser) {
        try {
            await firebase.deleteNoteFromCloud(id);
        } catch (e) {
            console.error("Cloud sync failed (deleteNote)", e);
        }
    }

    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(NOTE_STORE, 'readwrite');
        const request = transaction.objectStore(NOTE_STORE).delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
    });
};

export const logActivity = async (seconds: number): Promise<void> => {
    if (auth.currentUser) {
        try {
            await firebase.logActivityToCloud(seconds);
        } catch (e) {
            console.error("Cloud sync failed (logActivity)", e);
        }
    }

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
    if (auth.currentUser) {
        try {
            const cloudActivity = await firebase.getActivityFromCloud();
            if (cloudActivity.length > 0) return cloudActivity;
        } catch (e) {
            console.error("Cloud fetch failed (getActivity)", e);
        }
    }

    const db = await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(ACTIVITY_STORE, 'readonly');
        transaction.objectStore(ACTIVITY_STORE).getAll().onsuccess = (e) => resolve((e.target as any).result);
    });
};

export const saveChatSession = async (session: ChatSession): Promise<void> => {
    if (auth.currentUser) {
        try {
            await firebase.saveChatSessionToCloud(session);
        } catch (e) {
            console.error("Cloud sync failed (saveChatSession)", e);
        }
    }

    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHAT_STORE, 'readwrite');
        const request = transaction.objectStore(CHAT_STORE).put(session);
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
    });
};

export const getChatSessions = async (): Promise<ChatSession[]> => {
    if (auth.currentUser) {
        try {
            const cloudChats = await firebase.getChatSessionsFromCloud();
            if (cloudChats.length > 0) return cloudChats;
        } catch (e) {
            console.error("Cloud fetch failed (getChatSessions)", e);
        }
    }

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
    if (auth.currentUser) {
        try {
            await firebase.deleteChatSessionFromCloud(id);
        } catch (e) {
            console.error("Cloud sync failed (deleteChatSession)", e);
        }
    }

    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHAT_STORE, 'readwrite');
        const request = transaction.objectStore(CHAT_STORE).delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
    });
};
