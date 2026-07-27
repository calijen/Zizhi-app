
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, onSnapshot, Timestamp, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google', error);
    throw error;
  }
};

export const logout = () => signOut(auth);

// Helper for error handling as per guidelines
export enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
}

export interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
        userId?: string | null;
        email?: string | null;
        emailVerified?: boolean | null;
    }
}

let quotaExceededFlag = false;

export function setQuotaExceeded() {
    quotaExceededFlag = true;
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('firestore-quota-exceeded'));
    }
}

export function isQuotaExceeded(): boolean {
    return quotaExceededFlag;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const message = error instanceof Error ? error.message : String(error);
    const isQuotaError = message.toLowerCase().includes('quota') || message.toLowerCase().includes('resource-exhausted');

    const errInfo: FirestoreErrorInfo = {
        error: message,
        authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
            emailVerified: auth.currentUser?.emailVerified,
        },
        operationType,
        path
    };

    if (isQuotaError) {
        quotaExceededFlag = true;
        console.warn('Firestore daily quota limit reached. Falling back to local IndexedDB storage.');
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('firestore-quota-exceeded', { detail: { message } }));
        }
        return;
    }

    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
}
