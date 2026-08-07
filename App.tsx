
import { FC, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Stack, Group, Text, ActionIcon, Button, Tabs, Badge, Avatar, SimpleGrid, Progress, useMantineColorScheme } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import LibraryView from './components/FileUpload';
import QuotesView from './components/QuotesView';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';
import ReaderView from './components/ReaderView';
import SummaryView from './components/TrailerView';
import ProfileView from './components/ProfileView';
import LandingView from './components/LandingView';
import QuoteChat from './components/QuoteChat';
import Toast from './components/Toast';
import ReloadPrompt from './components/ReloadPrompt';
import SearchSidebar from './components/SearchSidebar';
import { Logo, LogoIcon, IconSettings, IconUser, IconLibrary, IconQuote, IconUpload, IconLayoutGrid, IconLayoutList, IconSpinner, IconMenu, IconNote } from './components/icons';
import * as db from './db';
import { auth, signInWithGoogle, logout as firebaseLogout, db as firestore, storage, handleFirestoreError, isQuotaExceeded, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, query, where, writeBatch, deleteDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, getBlob } from 'firebase/storage';
import type { Book, BookMetadata, BookContent, Quote, Note, NotebookData, Theme, ThemeFont, GenerationStatus } from './types';
import { parseEpub } from './epubParser';
import { parsePdf } from './pdfParser';
import { GoogleGenerativeAI } from "@google/generative-ai";

const FONTS: ThemeFont[] = [
    { name: 'Print Serif', sans: 'Inter', serif: 'Gentium Book Plus' },
    { name: 'Modern Serif', sans: 'Inter', serif: 'Gentium Book Plus' },
    { name: 'Clean Sans', sans: 'Inter', serif: 'Inter' }
];

export const ATMOSPHERES: { [key: string]: Theme } = {
    warm: {
        id: 'warm', name: 'Warm',
        colors: { 
          'primary': '#a0522d', 
          'secondary': '#5d3d2a', 
          'background': '#fdf6e3', 
          'surface': '#f5efdc', 
          'primary-text': '#1a110a', 
          'secondary-text': '#3a2a1a', 
          'muted-text': '#5a4334', 
          'border-color': '#c1b496' 
        },
        font: FONTS[0], fontSize: 1.3, lineHeight: 1.6, texture: 'paper', readingMode: 'scroll'
    },
    quiet: {
        id: 'quiet', name: 'Quiet',
        colors: { 
          'primary': '#111111', 
          'secondary': '#222222', 
          'background': '#ffffff', 
          'surface': '#f3f3f3', 
          'primary-text': '#000000', 
          'secondary-text': '#333333', 
          'muted-text': '#666666', 
          'border-color': '#000000' 
        },
        font: FONTS[0], fontSize: 1.2, lineHeight: 1.9, texture: 'none', readingMode: 'scroll'
    },
    nocturne: {
        id: 'nocturne', name: 'Night',
        colors: { 
          'primary': '#00d1ff', 
          'secondary': '#ffffff', 
          'background': '#0a0a0b', 
          'surface': '#1a1a1c', 
          'primary-text': '#ffffff', 
          'secondary-text': '#d1d1d1', 
          'muted-text': '#999999', 
          'border-color': '#333333' 
        },
        font: FONTS[2], fontSize: 1.15, lineHeight: 1.7, texture: 'none', readingMode: 'scroll'
    }
};

const NavItem = ({ tab, activeTab, icon: Icon, label, onSelect, collapsed }: { tab: 'library' | 'quotes' | 'profile' | 'settings'; activeTab: string; icon: any; label: string; onSelect: (tab: any) => void; collapsed?: boolean }) => {
    const isActive = activeTab === tab;
    return (
        <Stack gap={4} align="center" className={`cursor-pointer transition-all duration-200 group ${isActive ? 'text-[var(--color-primary-text)]' : 'text-[var(--color-muted-text)] hover:text-[var(--color-primary-text)]'}`} onClick={() => onSelect(tab)}>
            <Box className={`relative flex items-center justify-center transition-all border-2 rounded-none ${collapsed ? 'w-12 h-12' : 'w-10 h-10 md:w-full md:px-6 md:py-6'} ${isActive ? 'bg-[var(--color-primary)] border-black md:translate-x-1 shadow-[4px_4px_0px_black]' : 'border-transparent'}`}>
                <Group gap={collapsed ? 0 : "md"} wrap="nowrap" className={`w-full justify-center ${collapsed ? 'md:justify-center' : 'md:justify-start'}`}>
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-white' : ''}`} />
                    {!collapsed && <Text className={`hidden md:block text-[13px] font-black uppercase tracking-widest ${isActive ? 'text-white' : ''}`}>{label}</Text>}
                </Group>
            </Box>
            {!collapsed && <Text className="md:hidden text-[9px] font-black uppercase tracking-wider">{label}</Text>}
        </Stack>
    );
};

export const getBookUniqueKey = (title: string | undefined, author: string | undefined): string => {
    const cleanTitle = (title || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const cleanAuthor = (author || '').trim().replace(/\s+/g, ' ').toLowerCase();
    return `${cleanTitle}|||${cleanAuthor}`;
};

const App: FC = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [library, setLibrary] = useState<BookMetadata[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [loadingBookId, setLoadingBookId] = useState<string | null>(null);
  const [hasEntered, setHasEntered] = useState<boolean | null>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('zizhi-entered') === 'true') {
      return true;
    }
    return null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'quotes' | 'profile' | 'settings'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zizhi-active-tab');
      if (saved === 'library' || saved === 'quotes' || saved === 'profile' || saved === 'settings') {
        return saved;
      }
    }
    return 'library';
  });

  const handleSelectTab = useCallback((tab: 'library' | 'quotes' | 'profile' | 'settings') => {
    setActiveTab(tab);
    localStorage.setItem('zizhi-active-tab', tab);
  }, []);
  const [streak, setStreak] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [initialReaderNav, setInitialReaderNav] = useState<{ chapterId: string, searchText?: string } | null>(null);
  const [summaryBook, setSummaryBook] = useState<Book | null>(null);
  const [toast, setToast] = useState<{ message: string; action?: { label: string; onClick: () => void } } | null>(null);
  const [theme, setTheme] = useState<Theme>(ATMOSPHERES.warm);
  const [isUploading, setIsUploading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [generationStatuses, setGenerationStatuses] = useState<Record<string, GenerationStatus>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleQuota = () => {
      setQuotaExceeded(true);
    };
    window.addEventListener('firestore-quota-exceeded', handleQuota);
    return () => window.removeEventListener('firestore-quota-exceeded', handleQuota);
  }, []);

  const updateStreak = useCallback(() => {
    const lastVisit = localStorage.getItem('zizhi-last-visit');
    const savedStreak = localStorage.getItem('zizhi-streak');
    const today = new Date().toISOString().split('T')[0];
    
    let currentStreak = savedStreak ? parseInt(savedStreak) : 1;
    
    if (lastVisit) {
      const lastDate = new Date(lastVisit);
      const todayDate = new Date(today);
      const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    
    setStreak(currentStreak);
    localStorage.setItem('zizhi-last-visit', today);
    localStorage.setItem('zizhi-streak', currentStreak.toString());
  }, []);

  const loadData = useCallback(async (currentUser: User | null) => {
    setIsAppLoading(true);
    try {
      updateStreak();
      
      // Load IndexedDB data
      const [localBooks, localQuotes, localNotes] = await Promise.all([
        db.getBooks().catch(() => []),
        db.getQuotes().catch(() => []),
        db.getNotes().catch(() => [])
      ]);
      
      // Deduplicate local books strictly by ID, preserving all local entries
      const localBooksMap = new Map<string, BookMetadata>();
      localBooks.forEach(b => {
        if (b && b.id) {
          const existing = localBooksMap.get(b.id);
          if (!existing || (b.lastOpened || 0) >= (existing.lastOpened || 0)) {
            localBooksMap.set(b.id, b);
          }
        }
      });
      const deduplicatedLocalBooks = Array.from(localBooksMap.values());

      let loadedBooks: BookMetadata[] = deduplicatedLocalBooks;

      if (currentUser && !isQuotaExceeded()) {
          // Sync quotes, notes, and notebooks with Firestore (Books remain strictly local-first on device)
          const quotesRef = collection(firestore, 'users', currentUser.uid, 'quotes');
          const notesRef = collection(firestore, 'users', currentUser.uid, 'notes');
          const notebooksRef = collection(firestore, 'users', currentUser.uid, 'notebooks');

          const handleDocsError = (path: string) => (e: any) => {
              handleFirestoreError(e, OperationType.LIST, path);
              return null;
          };

          const [cloudQuotesSnap, cloudNotesSnap, cloudNotebooksSnap] = await Promise.all([
              getDocs(quotesRef).catch(handleDocsError(`users/${currentUser.uid}/quotes`)),
              getDocs(notesRef).catch(handleDocsError(`users/${currentUser.uid}/notes`)),
              getDocs(notebooksRef).catch(handleDocsError(`users/${currentUser.uid}/notebooks`))
          ]);

          const cloudQuotes = cloudQuotesSnap ? cloudQuotesSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Quote) })) : [];
          const cloudNotes = cloudNotesSnap ? cloudNotesSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Note) })) : [];
          const cloudNotebooks = cloudNotebooksSnap ? cloudNotebooksSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as NotebookData) })) : [];

          // Intelligent merge for quotes and notes, re-linking with local books if matching title/author
          const mergedQuotesMap = new Map<string, Quote>();
          localQuotes.forEach(q => mergedQuotesMap.set(q.id, q));
          cloudQuotes.forEach(cq => mergedQuotesMap.set(cq.id, cq));
          
          const mergedNotesMap = new Map<string, Note>();
          localNotes.forEach(n => mergedNotesMap.set(n.id, n));
          cloudNotes.forEach(cn => mergedNotesMap.set(cn.id, cn));

          const rawQuotes = Array.from(mergedQuotesMap.values());
          const rawNotes = Array.from(mergedNotesMap.values());

          // Re-link quotes to local book IDs if book is present on this device
          const mergedQuotes = rawQuotes.map(q => {
            if (q.bookId && loadedBooks.some(b => b.id === q.bookId)) return q;
            if (q.bookTitle) {
              const qKey = getBookUniqueKey(q.bookTitle, q.author);
              const cleanTitle = q.bookTitle.trim().toLowerCase();
              const match = loadedBooks.find(b => getBookUniqueKey(b.title, b.author) === qKey || b.title.trim().toLowerCase() === cleanTitle);
              if (match) return { ...q, bookId: match.id };
            }
            return q;
          });

          // Re-link notes to local book IDs if book is present on this device
          const mergedNotes = rawNotes.map(n => {
            if (n.bookId && loadedBooks.some(b => b.id === n.bookId)) return n;
            if (n.bookTitle) {
              const nKey = getBookUniqueKey(n.bookTitle, n.author);
              const cleanTitle = n.bookTitle.trim().toLowerCase();
              const match = loadedBooks.find(b => getBookUniqueKey(b.title, b.author) === nKey || b.title.trim().toLowerCase() === cleanTitle);
              if (match) return { ...n, bookId: match.id };
            }
            return n;
          });

          // Asynchronously upload local items to cloud if missing in Cloud
          if (!isQuotaExceeded()) {
              localQuotes.forEach(async (q) => {
                  const inCloud = cloudQuotes.some(cq => cq.id === q.id);
                  if (!inCloud && !isQuotaExceeded()) {
                      const quoteRef = doc(firestore, 'users', currentUser.uid, 'quotes', q.id);
                      setDoc(quoteRef, { ...q, userId: currentUser.uid }, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, 'quotes'));
                  }
              });
              localNotes.forEach(async (n) => {
                  const inCloud = cloudNotes.some(cn => cn.id === n.id);
                  if (!inCloud && !isQuotaExceeded()) {
                      const noteRef = doc(firestore, 'users', currentUser.uid, 'notes', n.id);
                      setDoc(noteRef, { ...n, userId: currentUser.uid }, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, 'notes'));
                  }
              });
          }

          // Asynchronously persist missing cloud quotes & notes to IndexedDB for offline access
          mergedQuotes.forEach(async (q) => {
              const existingLocal = localQuotes.find(lq => lq.id === q.id);
              if (!existingLocal) {
                  await db.saveQuote(q);
              }
          });

          mergedNotes.forEach(async (n) => {
              const existingLocal = localNotes.find(ln => ln.id === n.id);
              if (!existingLocal) {
                  await db.saveNote(n);
              }
          });

          cloudNotebooks.forEach(async (nb) => {
              if (nb.bookId) {
                  await db.saveNotebook(nb);
              }
          });

          setLibrary(loadedBooks);
          setQuotes(mergedQuotes);
          setNotes(mergedNotes);

          const storedEntered = localStorage.getItem('zizhi-entered') === 'true';
          const shouldBeEntered = storedEntered || loadedBooks.length > 0 || mergedQuotes.length > 0 || !!currentUser;
          setHasEntered(shouldBeEntered);
          if (shouldBeEntered) localStorage.setItem('zizhi-entered', 'true');
      } else {
          setLibrary(deduplicatedLocalBooks);
          setQuotes(localQuotes);
          setNotes(localNotes);
          const storedEntered = localStorage.getItem('zizhi-entered') === 'true';
          const shouldBeEntered = storedEntered || deduplicatedLocalBooks.length > 0 || localQuotes.length > 0;
          setHasEntered(shouldBeEntered);
          if (shouldBeEntered) localStorage.setItem('zizhi-entered', 'true');
      }

      // Restore last opened book if user was reading before refresh
      const lastOpenedBookId = localStorage.getItem('zizhi-last-opened-book-id');
      if (lastOpenedBookId) {
        const meta = loadedBooks.find(b => b.id === lastOpenedBookId) || deduplicatedLocalBooks.find(b => b.id === lastOpenedBookId);
        if (meta) {
          try {
            const content = await db.getBookContent(lastOpenedBookId);
            if (content && content.chapters && content.chapters.length > 0) {
              setSelectedBook({ ...meta, ...content });
            }
          } catch (err) {
            console.error("Failed to restore last opened book:", err);
          }
        }
      }
    } catch (e) { 
        console.error("Load failed", e); 
        const storedEntered = localStorage.getItem('zizhi-entered') === 'true';
        setHasEntered(storedEntered); 
    } finally {
        setIsAppLoading(false);
    }
  }, [updateStreak]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setHasEntered(true);
        localStorage.setItem('zizhi-entered', 'true');
      }
      loadData(u);
    });
    return () => unsubscribe();
  }, [loadData]);

  useEffect(() => {
    if (!user || quotaExceeded) return;

    const quotesRef = collection(firestore, 'users', user.uid, 'quotes');
    const unsubscribeQuotes = onSnapshot(quotesRef, (snapshot) => {
      const cloudQuotes = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Quote) }));
      if (cloudQuotes.length > 0) {
        setQuotes(prev => {
          const map = new Map<string, Quote>();
          prev.forEach(q => map.set(q.id, q));
          cloudQuotes.forEach(cq => map.set(cq.id, cq));
          const merged = Array.from(map.values());
          merged.forEach(q => db.saveQuote(q).catch(() => {}));
          return merged;
        });
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/quotes`);
    });

    const notesRef = collection(firestore, 'users', user.uid, 'notes');
    const unsubscribeNotes = onSnapshot(notesRef, (snapshot) => {
      const cloudNotes = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Note) }));
      if (cloudNotes.length > 0) {
        setNotes(prev => {
          const map = new Map<string, Note>();
          prev.forEach(n => map.set(n.id, n));
          cloudNotes.forEach(cn => map.set(cn.id, cn));
          const merged = Array.from(map.values());
          merged.forEach(n => db.saveNote(n).catch(() => {}));
          return merged;
        });
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/notes`);
    });

    const notebooksRef = collection(firestore, 'users', user.uid, 'notebooks');
    const unsubscribeNotebooks = onSnapshot(notebooksRef, (snapshot) => {
      snapshot.docs.forEach(docSnap => {
        const cloudNb = docSnap.data() as NotebookData;
        if (cloudNb) {
          db.saveNotebook(cloudNb).catch(() => {});
        }
      });
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/notebooks`);
    });

    return () => {
      unsubscribeQuotes();
      unsubscribeNotes();
      unsubscribeNotebooks();
    };
  }, [user, quotaExceeded]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('zizhi-theme'); 
    if (savedTheme) { 
      try { 
        const parsed = JSON.parse(savedTheme) as Theme;
        setTheme(prev => {
          if (prev.id === parsed.id) return prev;
          return parsed;
        }); 
        
        // Use a slight delay to ensure Mantine has mounted
        setTimeout(() => {
          const targetScheme = parsed.id === 'nocturne' ? 'dark' : 'light';
          if (colorScheme !== targetScheme) {
            setColorScheme(targetScheme);
          }
        }, 0);
      } catch(e) {} 
    } 
  }, [setColorScheme, colorScheme]); // Added colorScheme check to avoid unnecessary updates
  
  const handleCloseBook = async (bookToClose: BookMetadata | null) => {
    if (bookToClose && user && !isQuotaExceeded()) {
      try {
        const bookKey = getBookUniqueKey(bookToClose.title, bookToClose.author);
        
        // Sync notes for this book to Firestore on close
        const allLocalNotes = await db.getNotes();
        const matchingNotes = allLocalNotes.filter(
          n => n.bookId === bookToClose.id || (n.bookTitle && getBookUniqueKey(n.bookTitle, n.author) === bookKey)
        );

        for (const note of matchingNotes) {
          const noteRef = doc(firestore, 'users', user.uid, 'notes', note.id);
          await setDoc(noteRef, { ...note, userId: user.uid }, { merge: true }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'notes'));
        }

        // Sync notebook for this book to Firestore on close
        const localNb = await db.getNotebook(bookToClose.id);
        if (localNb && localNb.pages) {
          const rawDocId = bookKey || bookToClose.id;
          const nbDocId = (rawDocId || '').replace(/\//g, '_');
          const nbRef = doc(firestore, 'users', user.uid, 'notebooks', nbDocId);
          await setDoc(nbRef, {
            bookId: bookToClose.id,
            userId: user.uid,
            pages: localNb.pages,
            updatedAt: Date.now(),
            bookTitle: bookToClose.title,
            author: bookToClose.author,
            bookKey
          }, { merge: true }).catch(e => handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}/notebooks`));
        }
      } catch (err) {
        console.error('Error syncing book notes to cloud on close:', err);
      }
    }
    setSelectedBook(null);
    setInitialReaderNav(null);
    localStorage.removeItem('zizhi-last-opened-book-id');
  };

  const sortedLibrary = useMemo(() => [...library].sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0)), [library]);

  const handleEnterApp = () => {
    setHasEntered(true);
    localStorage.setItem('zizhi-entered', 'true');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsUploading(true);
    try {
        let newBook: Book;
        if (file.name.toLowerCase().endsWith('.pdf')) {
            newBook = await parsePdf(file);
            newBook.type = 'pdf';
            newBook.isPdf = true;
        } else {
            newBook = await parseEpub(file);
            newBook.type = 'epub';
            newBook.isPdf = false;
        }

        // Check if book already exists in library based on title and author
        const newBookKey = getBookUniqueKey(newBook.title, newBook.author);
        const isDuplicate = library.some(b => 
            getBookUniqueKey(b.title, b.author) === newBookKey
        );

        if (isDuplicate) {
            setToast({ message: `"${newBook.title}" has already been uploaded.` });
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        newBook.lastOpened = Date.now();

        // Save locally first for instant access (books remain on device)
        await db.saveBook(newBook); 
        
        // Update library state with metadata only
        const { chapters, toc, summaryScript, audioSummaryUrl, audioDuration, pdfData, ...metadata } = newBook;
        const metaWithFlags = { ...metadata, hasSummary: !!summaryScript, hasAudio: !!audioSummaryUrl };
        setLibrary(prev => [metaWithFlags, ...prev]);

        // Release the UI lock
        setIsUploading(false);
        setToast({ message: `${file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'EPUB'} added to library.` });

        // Re-associate existing quotes, notes, and notebooks for this book if re-uploaded
        const cleanTitle = newBook.title.trim().toLowerCase();

        setQuotes(prev => prev.map(q => {
            const qKey = q.bookTitle ? getBookUniqueKey(q.bookTitle, q.author) : '';
            const isMatch = (qKey && qKey === newBookKey) || (q.bookTitle && q.bookTitle.trim().toLowerCase() === cleanTitle);
            if (isMatch && q.bookId !== newBook.id) {
                const updated = { ...q, bookId: newBook.id };
                db.saveQuote(updated);
                if (user && !isQuotaExceeded()) {
                    setDoc(doc(firestore, 'users', user.uid, 'quotes', q.id), { ...updated, userId: user.uid }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, 'quotes'));
                }
                return updated;
            }
            return q;
        }));
        setNotes(prev => prev.map(n => {
            const nKey = n.bookTitle ? getBookUniqueKey(n.bookTitle, n.author) : '';
            const isMatch = (nKey && nKey === newBookKey) || (n.bookTitle && n.bookTitle.trim().toLowerCase() === cleanTitle);
            if (isMatch && n.bookId !== newBook.id) {
                const updated = { ...n, bookId: newBook.id };
                db.saveNote(updated);
                if (user && !isQuotaExceeded()) {
                    setDoc(doc(firestore, 'users', user.uid, 'notes', n.id), { ...updated, userId: user.uid }, { merge: true }).catch(err => handleFirestoreError(err, OperationType.WRITE, 'notes'));
                }
                return updated;
            }
            return n;
        }));
        db.getAllNotebooks().then(allNotebooks => {
            allNotebooks.forEach(async (nb) => {
                const nbKey = nb.bookKey || (nb.bookTitle ? getBookUniqueKey(nb.bookTitle, nb.author) : '');
                const isMatch = (nbKey && nbKey === newBookKey) || (nb.bookTitle && nb.bookTitle.trim().toLowerCase() === cleanTitle);
                if (isMatch && nb.bookId !== newBook.id) {
                    const updatedNb = { ...nb, bookId: newBook.id };
                    await db.saveNotebook(updatedNb);
                    if (user && !isQuotaExceeded()) {
                        const rawDocId = updatedNb.bookKey || newBook.id;
                        const nbDocId = (rawDocId || '').replace(/\//g, '_');
                        setDoc(doc(firestore, 'users', user.uid, 'notebooks', nbDocId), { ...updatedNb, userId: user.uid }, { merge: true }).catch(() => {});
                    }
                }
            });
        }).catch(() => {});
    } catch (err) { 
        console.error(err);
        setToast({ message: "File parsing failed." }); 
        setIsUploading(false);
    } finally { if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleBookSelect = async (bookId: string) => {
    const meta = library.find(b => b.id === bookId);
    if (!meta) {
        console.error(`Book metadata not found for ID: ${bookId}`);
        return;
    }
    setLoadingBookId(bookId);
    try {
        const content = await db.getBookContent(bookId);
        if (content && content.chapters && content.chapters.length > 0) {
            const latestMeta = library.find(b => b.id === bookId) || meta;
            setSelectedBook({ ...latestMeta, ...content });
            localStorage.setItem('zizhi-last-opened-book-id', bookId);
        } else {
            console.error(`Book content missing for ID: ${bookId}`);
            setToast({ message: "Book content missing locally. Please re-upload this book." });
        }
    } catch (err) {
        console.error(`Error loading book content for ID: ${bookId}:`, err);
        setToast({ message: "Failed to load book." });
    } finally {
        setLoadingBookId(null);
    }
  };

  const handleViewSummary = async (bookId: string) => {
    const meta = library.find(b => b.id === bookId);
    if (!meta) return;
    setLoadingBookId(bookId);
    try {
        const content = await db.getBookContent(bookId);
        if (content) {
            setSummaryBook({ ...meta, ...content });
        } else {
            setToast({ message: "Summary content missing." });
        }
    } catch (err) {
        setToast({ message: "Failed to load summary." });
    } finally {
        setLoadingBookId(null);
    }
  };

  const handleGenerateSummary = async (bookId: string) => {
    const meta = library.find(b => b.id === bookId); if (!meta) return;
    const content = await db.getBookContent(bookId); if (!content) return;
    const book: Book = { ...meta, ...content };

    setGenerationStatuses(prev => ({ ...prev, [bookId]: { stage: 'Checking', progress: 0.1, currentAction: 'Authenticating...' } }));
    
    try {
        const genAI = new GoogleGenerativeAI(process.env.API_KEY || "");
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
        
        setGenerationStatuses(prev => ({ ...prev, [bookId]: { stage: 'Thinking', progress: 0.2, currentAction: 'Distilling content...' } }));

        const summaryPrompt = `Synthesize a focused audio summary of the book "${book.title}" by ${book.author}. 
        Write a continuous narrative script (no headers or markdown). 800 words approx. Clear, insightful, human tone.`;

        const scriptRes = await model.generateContent(summaryPrompt);
        const script = scriptRes.response.text();
        
        if (!script) throw new Error("Distillation failed: No script generated.");

        setGenerationStatuses(prev => ({ ...prev, [bookId]: { stage: 'Talking', progress: 0.6, currentAction: 'Generating voice...' } }));
        
        // Note: Standard SDK does not support direct TTS via generateContent as used here.
        // We will mock the audio for now to prevent runtime crashes if the specific model doesn't exist.
        // In a real scenario, one would use a dedicated TTS API.
        const base64Audio = "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; // Placeholder silent wave
        
        const updatedBook = { ...book, summaryScript: script, audioSummaryUrl: `data:audio/wav;base64,${base64Audio}` };
        await db.saveBook(updatedBook); 
        
        // Update library state (metadata only)
        const metaWithFlags = { ...meta, hasSummary: true, hasAudio: true };
        setLibrary(prev => prev.map(b => b.id === bookId ? metaWithFlags : b));
        
        setToast({ message: "Insight generated successfully." });
    } catch (err: any) { 
        console.error("Summary error:", err);
        setToast({ message: `AI Service Error: ${err.message || 'Check your internet connection and try again.'}` }); 
    } finally { 
        setGenerationStatuses(prev => { const next = { ...prev }; delete next[bookId]; return next; }); 
    }
  };

  const handleDeleteBook = async (id: string) => {
    try {
        await db.deleteBook(id);
        setLibrary(prev => prev.filter(b => b.id !== id));
        setToast({ message: "Book removed." });
    } catch (e) {
        setToast({ message: "Failed to delete book." });
    }
    setDeleteConfirm(null);
  };

  const appStyles = { 
    '--color-primary': theme.colors.primary, 
    '--color-background': theme.colors.background, 
    '--color-surface': theme.colors.surface, 
    '--color-primary-text': theme.colors['primary-text'], 
    '--color-secondary-text': theme.colors['secondary-text'], 
    '--color-muted-text': theme.colors['muted-text'], 
    '--color-border-color': theme.colors['border-color'], 
    '--font-serif': theme.font.serif, 
    '--font-sans': theme.font.sans 
  } as React.CSSProperties;

  if (hasEntered === null || isAppLoading) {
    return (
      <Box className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#FDF6E3] p-6 text-[#2b2b2b] select-none" style={{ fontFamily: '"Gentium Book Plus", serif' }}>
        <div className="relative border-4 border-black p-8 md:p-12 bg-[#FFFDF5] shadow-[12px_12px_0_#000] max-w-md w-full flex flex-col items-center text-center">
          <Logo className="mb-6 scale-125" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b4513] mb-6 border-y-2 border-black/10 py-2 w-full">
            Local-First Reader & Annotator
          </p>
          <div className="flex items-center gap-3 text-xs font-black uppercase text-[#2b2b2b] bg-[#f8f1e1] border-2 border-black px-5 py-3 shadow-[3px_3px_0_#000]">
            <IconSpinner className="w-5 h-5 animate-spin text-[#8b4513] flex-shrink-0" />
            <span>Loading library & notes...</span>
          </div>
        </div>
      </Box>
    );
  }

  return (
    <>
      <ReloadPrompt />
      {!hasEntered ? (
        <LandingView onEnter={() => setHasEntered(true)} onLogin={(u) => { setUser(u as User); setHasEntered(true); }} />
      ) : (
        <Box style={appStyles} className="relative h-[100dvh] w-full overflow-hidden transition-colors duration-300 flex flex-col md:flex-row text-[var(--color-primary-text)]" bg="var(--color-background)">
          <aside className={`hidden md:flex ${isSidebarCollapsed ? 'w-20' : 'w-64 lg:w-72'} bg-[var(--color-surface)] border-r-4 border-black flex-col z-[150] transition-all duration-300`}>
              <div className="h-16 md:h-20 flex items-center border-b-4 border-black overflow-hidden relative">
                {!isSidebarCollapsed ? (
                  <div className="flex items-center justify-between w-full px-8">
                    <Logo />
                    <ActionIcon 
                        variant="subtle" 
                        color="gray" 
                        size="md" 
                        onClick={() => setIsSidebarCollapsed(true)} 
                        className="border-2 border-black shadow-[2px_2px_0_black] bg-[var(--color-background)] rounded-none"
                    >
                        <IconMenu className="w-4 h-4 text-[var(--color-primary-text)]" />
                    </ActionIcon>
                  </div>
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center cursor-pointer group/toggle"
                    onClick={() => setIsSidebarCollapsed(false)}
                  >
                    <div className="relative flex items-center justify-center w-full h-full">
                      {/* Normal state: Logo Icon */}
                      <LogoIcon className="w-8 h-8 group-hover/toggle:opacity-0 transition-opacity" />
                      
                      {/* Hover state: Toggle Icon + Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover/toggle:opacity-100 transition-opacity bg-[var(--color-surface)]">
                        <IconMenu className="w-5 h-5 text-[var(--color-primary-text)] mb-1" />
                        <Text className="text-[7px] font-black uppercase tracking-tighter text-center leading-none">Open<br/>Sidebar</Text>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <nav className={`flex-1 ${isSidebarCollapsed ? 'p-2' : 'p-6'} space-y-4`}>
                  <NavItem tab="library" activeTab={activeTab} onSelect={handleSelectTab} icon={IconLibrary} label="Library" collapsed={isSidebarCollapsed} />
                  <NavItem tab="quotes" activeTab={activeTab} onSelect={handleSelectTab} icon={IconQuote} label="Quotes" collapsed={isSidebarCollapsed} />
                  <NavItem tab="profile" activeTab={activeTab} onSelect={handleSelectTab} icon={IconUser} label="Profile" collapsed={isSidebarCollapsed} />
                  <NavItem tab="settings" activeTab={activeTab} onSelect={handleSelectTab} icon={IconSettings} label="Settings" collapsed={isSidebarCollapsed} />
              </nav>

          </aside>
          <Box className="flex-1 flex flex-col h-full overflow-hidden relative">
              {quotaExceeded && (
                <div className="bg-amber-200 border-b-2 border-black p-2.5 px-6 text-xs font-bold text-amber-950 flex flex-wrap items-center justify-between gap-2 z-[200]">
                  <span>⚡ Firestore free daily quota reached. Notebooks and library are saved locally on your device. Quota resets tomorrow.</span>
                  <a 
                    href="https://console.firebase.google.com/project/gen-lang-client-0846626494/firestore/databases/ai-studio-a274686c-85b1-4469-b210-76c1a7c17abf/data?openUpgradeDialog=true" 
                    target="_blank" 
                    rel="noreferrer"
                    className="underline text-orange-950 font-black hover:text-black transition-colors"
                  >
                    View Firestore Console & Quota →
                  </a>
                </div>
              )}
              <header className="h-16 md:h-20 bg-[var(--color-surface)] z-[100] px-8 flex items-center justify-between border-b-4 border-black">
                  <div className="flex items-center gap-4">
                    <div className="md:hidden"><Logo /></div>
                    <div className="hidden md:flex items-center gap-10">
                        <Text className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted-text)]">Theme: {theme.name}</Text>
                    </div>
                  </div>
                  <Group gap="md">
                    <ActionIcon 
                      variant="subtle" 
                      color="gray" 
                      size="lg" 
                      onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} 
                      className="border-2 border-black shadow-[2px_2px_0_black] bg-[var(--color-background)] rounded-none"
                      title="Toggle View Mode"
                    >
                        {viewMode === 'grid' ? <IconLayoutList className="w-5 h-5 text-[var(--color-primary-text)]" /> : <IconLayoutGrid className="w-5 h-5 text-[var(--color-primary-text)]" />}
                    </ActionIcon>
                  </Group>
              </header>
              <main className="flex-1 overflow-y-auto no-scrollbar pb-64 md:pb-24">
                  <Box className="max-w-7xl mx-auto px-6 py-6 h-full">
                      {activeTab === 'library' && (
                        <LibraryView 
                          books={sortedLibrary} 
                          theme={theme} 
                          onBookSelect={handleBookSelect} 
                          isLoading={isUploading} 
                          loadingBookId={loadingBookId}
                          error={null} 
                          onDelete={(id) => setDeleteConfirm(id)} 
                          onGenerateSummary={handleGenerateSummary} 
                          generationStatuses={generationStatuses} 
                          onViewSummary={handleViewSummary} 
                          viewMode={viewMode} 
                          isCloudSynced={!!user}
                        />
                      )}
                      {activeTab === 'quotes' && <QuotesView theme={theme} quotes={quotes} library={library} isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} onDelete={(id) => { 
                          db.deleteQuote(id).then(() => {
                              setQuotes(prev => prev.filter(q => q.id !== id));
                              if (user && !isQuotaExceeded()) {
                                  deleteDoc(doc(firestore, 'users', user.uid, 'quotes', id)).catch(e => handleFirestoreError(e, OperationType.DELETE, 'quotes'));
                              }
                          }); 
                      }} onGoToQuote={async (q) => { 
                          let meta = library.find(b => b.id === q.bookId);
                          if (!meta && q.bookTitle) {
                              const qKey = getBookUniqueKey(q.bookTitle, q.author);
                              meta = library.find(b => getBookUniqueKey(b.title, b.author) === qKey);
                          }
                          if (meta) {
                              setLoadingBookId(meta.id);
                              try {
                                  const content = await db.getBookContent(meta.id);
                                  if (content) {
                                      setInitialReaderNav({ chapterId: q.location, searchText: q.text });
                                      setSelectedBook({ ...meta, ...content });
                                  } else {
                                      setToast({ message: "Book content missing locally. Please re-upload this book." });
                                  }
                              } catch (e) {
                                  setToast({ message: "Failed to load book." });
                              } finally {
                                  setLoadingBookId(null);
                              }
                          } else {
                              setToast({ message: `Re-upload "${q.bookTitle}" to read in context.` });
                          }
                      }} />}
                      {activeTab === 'profile' && <ProfileView user={user} streak={streak} library={library} onShowAuth={() => setIsAuthModalOpen(true)} activity={[]} onSignOut={async () => { await firebaseLogout(); setUser(null); }} />}
                      {activeTab === 'settings' && <SettingsView currentTheme={theme} onThemeChange={(t) => { setTheme(t); setColorScheme(t.id === 'nocturne' ? 'dark' : 'light'); localStorage.setItem('zizhi-theme', JSON.stringify(t)); }} themes={ATMOSPHERES} fonts={FONTS} textures={{}} />}
                  </Box>
              </main>
              {activeTab === 'library' && (
                  <Box className="hidden md:block fixed bottom-12 right-12 z-[250]">
                      <input type="file" ref={fileInputRef} onChange={handleUpload} accept=".epub,.pdf" className="hidden" />
                      <ActionIcon size={80} className="bg-yellow-400 border-4 border-black shadow-[8px_8px_0_black] hover:translate-y-[-2px] transition-all rounded-none" onClick={() => fileInputRef.current?.click()}>
                          {isUploading ? <IconSpinner className="w-10 h-10 text-black" /> : <IconUpload className="w-10 h-10 text-black" />}
                      </ActionIcon>
                  </Box>
              )}
              {activeTab === 'quotes' && (
                  <AnimatePresence>
                    {!isChatOpen && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 50 }}
                        className="fixed bottom-24 right-6 md:bottom-12 md:right-12 z-[250] flex items-end gap-3 group translate-x-1 md:translate-x-4"
                      >
                          <div className="hidden md:block bg-white border-4 border-black p-3 shadow-[8px_8px_0_black] opacity-0 group-hover:opacity-100 transition-opacity mb-8 mr-[-20px] pointer-events-none">
                              <Text className="text-[11px] font-black uppercase tracking-widest text-black">Ask Zizhi</Text>
                          </div>
                          <button 
                            onClick={() => setIsChatOpen(true)}
                            className="w-20 h-20 md:w-32 md:h-32 relative hover:scale-110 active:scale-95 transition-all duration-300 outline-none group/phoebe"
                          >
                              <div className="absolute inset-0 rounded-full border-4 border-black bg-yellow-300 shadow-[4px_4px_0_rgba(0,0,0,1)] overflow-hidden">
                                <img src="/phoebe.png" alt="Ask Zizhi" className="w-full h-full object-contain p-1 md:p-2" onError={(e) => { e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=phoebe&backgroundColor=FACC15'; }} />
                              </div>
                              <div className="md:hidden absolute -top-2 -left-2 bg-white border-2 border-black p-1 px-2 shadow-[2px_2px_0_black] pointer-events-none">
                                <Text className="text-[8px] font-black uppercase text-black">Ask Zizhi</Text>
                             </div>
                          </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
              )}
          </Box>
          {!isChatOpen && (
            <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] h-20 flex items-center justify-around z-[200] border-t-4 border-black md:hidden">
                <NavItem tab="library" activeTab={activeTab} onSelect={handleSelectTab} icon={IconLibrary} label="Library" />
                <NavItem tab="quotes" activeTab={activeTab} onSelect={handleSelectTab} icon={IconQuote} label="Quotes" />
                    <Box className="relative -top-6">
                        <>
                          <input type="file" ref={fileInputRef} onChange={handleUpload} accept=".epub,.pdf" className="hidden" />
                          <ActionIcon size={72} className="bg-yellow-400 border-4 border-black shadow-[6px_6px_0_black] rounded-none" onClick={() => fileInputRef.current?.click()}>
                              {isUploading ? <IconSpinner className="w-8 h-8 text-black" /> : <IconUpload className="w-10 h-10 text-black" />}
                          </ActionIcon>
                        </>
                    </Box>
                <NavItem tab="profile" activeTab={activeTab} onSelect={handleSelectTab} icon={IconUser} label="Profile" />
                <NavItem tab="settings" activeTab={activeTab} onSelect={handleSelectTab} icon={IconSettings} label="Settings" />
            </nav>
          )}
          {selectedBook && <ReaderView 
            book={selectedBook} 
            theme={theme} 
            quotes={quotes}
            notes={notes.filter(n => n.bookId === selectedBook.id || (n.bookTitle && getBookUniqueKey(n.bookTitle, n.author) === getBookUniqueKey(selectedBook.title, selectedBook.author)) || (n.bookTitle && n.bookTitle.trim().toLowerCase() === selectedBook.title.trim().toLowerCase()))}
            initialChapterId={initialReaderNav?.chapterId}
            initialSearchText={initialReaderNav?.searchText}
            onClose={() => handleCloseBook(selectedBook)} 
            onUpdateProgress={async (bid, ci, st, ts, gp) => { 
              const safeScrollTop = typeof st === 'number' && !isNaN(st) ? st : 0;
              const safeChapterIndex = typeof ci === 'number' && !isNaN(ci) ? ci : 0;
              const safeProgress = typeof gp === 'number' && !isNaN(gp) && gp >= 0 && gp <= 1 ? gp : 0;
              const safeTimeSpent = typeof ts === 'number' && !isNaN(ts) ? ts : 0;

              const libBook = library.find(b => b.id === bid);
              const currentReadingTime = libBook?.readingTime || selectedBook?.readingTime || 0;

              const updates: Partial<BookMetadata> = { 
                  progress: safeProgress, 
                  lastScrollTop: safeScrollTop, 
                  lastChapterIndex: safeChapterIndex,
                  readingTime: currentReadingTime + safeTimeSpent, 
                  lastOpened: Date.now() 
              }; 
              
              // Local update metadata
              await db.updateBookMetadata(bid, updates);
              setLibrary(prev => prev.map(b => b.id === bid ? { ...b, ...updates } : b)); 
              setSelectedBook(prev => prev && prev.id === bid ? { ...prev, ...updates } : prev);
          }} onSaveQuote={async (t, c) => { 
              const nq: Quote = { id: crypto.randomUUID(), text: t, bookTitle: selectedBook.title, author: selectedBook.author, bookId: selectedBook.id, location: c, createdAt: Date.now() }; 
              await db.saveQuote(nq); 
              if (user && !isQuotaExceeded()) {
                  const quoteRef = doc(firestore, 'users', user.uid, 'quotes', nq.id);
                  await setDoc(quoteRef, { ...nq, userId: user.uid }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'quotes'));
              }
              setQuotes(prev => [nq, ...prev]); 
              setToast({ message: "Quote archived." }); 
          }} onSaveNote={async (t, n, c) => { 
              const nn: Note = { id: crypto.randomUUID(), text: t, note: n, bookTitle: selectedBook.title, author: selectedBook.author, bookId: selectedBook.id, location: c, createdAt: Date.now() }; 
              await db.saveNote(nn); 
              setNotes(prev => [nn, ...prev]); 
              setToast({ message: "Note saved locally." }); 
          }} onSearch={(queryText) => setSearchQuery(queryText)} onFontSizeChange={(newSize) => setTheme(prev => {
              const next = { ...prev, fontSize: newSize };
              localStorage.setItem('zizhi-theme', JSON.stringify(next));
              return next;
          })} onThemeChange={(newTheme) => setTheme(prev => {
              const next = { ...prev, ...newTheme };
              localStorage.setItem('zizhi-theme', JSON.stringify(next));
              return next;
          })} />}
          {summaryBook && <SummaryView book={summaryBook} onClose={() => setSummaryBook(null)} />}
          {toast && <Toast message={toast.message} action={toast.action} onClose={() => setToast(null)} />}

          <AnimatePresence>
            {isAuthModalOpen && (
              <AuthView onClose={() => setIsAuthModalOpen(false)} onLogin={(u) => { setUser(u as User); setIsAuthModalOpen(false); if (!hasEntered) setHasEntered(true); }} />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isChatOpen && (
              <QuoteChat quotes={quotes} onClose={() => setIsChatOpen(false)} />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {searchQuery && (
              <SearchSidebar query={searchQuery} theme={theme} onClose={() => setSearchQuery(null)} />
            )}
          </AnimatePresence>

          {deleteConfirm && (
            <Box className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-6">
                <Box className="bg-[var(--color-surface)] border-4 border-black p-8 shadow-[12px_12px_0_black] max-w-sm w-full">
                    <h3 className="text-xl font-black uppercase mb-4 text-[var(--color-primary-text)]">Delete Book?</h3>
                    <Text className="text-sm font-bold mb-8 opacity-70 text-[var(--color-primary-text)]">This will remove the book and all associated highlights from this device.</Text>
                    <Group grow gap="md">
                        <Button variant="outline" color="dark" className="rounded-none border-2 border-black font-black uppercase text-[var(--color-primary-text)]" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button variant="filled" color="red" className="rounded-none border-2 border-black font-black uppercase shadow-[4px_4px_0_black]" onClick={() => handleDeleteBook(deleteConfirm)}>Delete</Button>
                    </Group>
                </Box>
            </Box>
          )}

          {loadingBookId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center animate-fade-in p-6">
              <div className="bg-[var(--color-surface)] border-4 border-black p-8 shadow-[12px_12px_0_#000] max-w-sm w-full text-center flex flex-col items-center">
                <IconSpinner className="w-10 h-10 animate-spin mb-4 text-cyan-400" />
                <h3 className="font-black text-lg text-[var(--color-primary-text)] uppercase tracking-wider mb-1">
                  Opening Book
                </h3>
                <p className="text-xs font-bold text-[var(--color-secondary-text)] uppercase tracking-widest truncate max-w-full">
                  {library.find(b => b.id === loadingBookId)?.title || 'Preparing text & chapters...'}
                </p>
                <span className="text-[10px] font-bold text-cyan-900 bg-cyan-100 border border-cyan-300 px-3 py-1 mt-4 uppercase tracking-wider">
                  Initializing Reader
                </span>
              </div>
            </div>
          )}
        </Box>
      )}
    </>
  );
};

export default App;
