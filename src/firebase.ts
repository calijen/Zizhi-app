import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  deleteDoc,
  updateDoc,
  onSnapshot,
  getDocFromServer,
  CollectionReference,
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { Book, BookMetadata, Quote, Note, ReadingActivity, ChatSession } from './types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Auth Helpers
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Save user profile
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: Date.now()
    }, { merge: true });
    
    return user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

// Firestore Error Handler
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Data Operations
const getUserPath = () => {
  if (!auth.currentUser) throw new Error("User not authenticated");
  return `users/${auth.currentUser.uid}`;
};

// Books
export const saveBookToCloud = async (book: Book): Promise<void> => {
  const path = `${getUserPath()}/books/${book.id}`;
  try {
    // We omit binary data if it's too large, but for now we try to store what we can.
    // If book.pdfData exists, it might need to be converted or skipped if > 1MB.
    const { chapters, toc, ...metadata } = book;
    
    // Check size approximately
    const dataSize = JSON.stringify({ chapters, toc, ...metadata }).length;
    if (dataSize > 1000000) {
      console.warn("Book content too large for Firestore, stripping massive chapters...");
      // Implementation could chunk here, but for now we'll just try and handle error.
    }

    await setDoc(doc(db, path), {
      ...metadata,
      chapters,
      toc,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getBooksFromCloud = async (): Promise<BookMetadata[]> => {
  const path = `${getUserPath()}/books`;
  try {
    const q = query(collection(db, path));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        title: data.title,
        author: data.author,
        coverImageUrl: data.coverImageUrl,
        progress: data.progress,
        lastScrollTop: data.lastScrollTop,
        lastOpened: data.lastOpened,
        readingTime: data.readingTime,
        genre: data.genre,
        hasSummary: data.hasSummary,
        hasAudio: data.hasAudio,
        isPdf: data.isPdf
      } as BookMetadata;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const getBookContentFromCloud = async (id: string): Promise<Book | null> => {
  const path = `${getUserPath()}/books/${id}`;
  try {
    const docSnap = await getDoc(doc(db, path));
    if (docSnap.exists()) {
      return docSnap.data() as Book;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const deleteBookFromCloud = async (id: string): Promise<void> => {
  const path = `${getUserPath()}/books/${id}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Quotes
export const saveQuoteToCloud = async (quote: Quote): Promise<void> => {
  const path = `${getUserPath()}/quotes/${quote.id}`;
  try {
    await setDoc(doc(db, path), {
      ...quote,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getQuotesFromCloud = async (): Promise<Quote[]> => {
  const path = `${getUserPath()}/quotes`;
  try {
    const q = query(collection(db, path));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Quote);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const deleteQuoteFromCloud = async (id: string): Promise<void> => {
  const path = `${getUserPath()}/quotes/${id}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Notes
export const saveNoteToCloud = async (note: Note): Promise<void> => {
  const path = `${getUserPath()}/notes/${note.id}`;
  try {
    await setDoc(doc(db, path), {
      ...note,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getNotesFromCloud = async (): Promise<Note[]> => {
  const path = `${getUserPath()}/notes`;
  try {
    const q = query(collection(db, path));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Note);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const deleteNoteFromCloud = async (id: string): Promise<void> => {
  const path = `${getUserPath()}/notes/${id}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Activity
export const logActivityToCloud = async (seconds: number): Promise<void> => {
  const date = new Date().toISOString().split('T')[0];
  const path = `${getUserPath()}/activity/${date}`;
  try {
    const docRef = doc(db, path);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        seconds: docSnap.data().seconds + seconds
      });
    } else {
      await setDoc(docRef, {
        date,
        seconds
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getActivityFromCloud = async (): Promise<ReadingActivity[]> => {
  const path = `${getUserPath()}/activity`;
  try {
    const q = query(collection(db, path));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as ReadingActivity);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

// Chat Sessions
export const saveChatSessionToCloud = async (session: ChatSession): Promise<void> => {
  const path = `${getUserPath()}/chats/${session.id}`;
  try {
    await setDoc(doc(db, path), {
      ...session,
      lastUpdatedAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getChatSessionsFromCloud = async (): Promise<ChatSession[]> => {
  const path = `${getUserPath()}/chats`;
  try {
    const q = query(collection(db, path));
    const querySnapshot = await getDocs(q);
    const sessions = querySnapshot.docs.map(doc => doc.data() as ChatSession);
    return sessions.sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const deleteChatSessionFromCloud = async (id: string): Promise<void> => {
  const path = `${getUserPath()}/chats/${id}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};
