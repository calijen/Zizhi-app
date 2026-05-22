
import { FC, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, Stack, Group, Text, ActionIcon, Button, Tabs, Badge, Avatar, SimpleGrid, Progress, useMantineColorScheme } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import LibraryView from './components/FileUpload';
import QuotesView from './components/QuotesView';
import NotesView from './components/NotesView';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';
import ReaderView from './components/ReaderView';
import SummaryView from './components/TrailerView';
import ProfileView from './components/ProfileView';
import LandingView from './components/LandingView';
import QuoteChat from './components/QuoteChat';
import Toast from './components/Toast';
import ReloadPrompt from './components/ReloadPrompt';
import { Logo, LogoIcon, IconSettings, IconUser, IconLibrary, IconQuote, IconUpload, IconLayoutGrid, IconLayoutList, IconSpinner, IconMenu, IconNote } from './components/icons';
import * as db from './db';
import { auth, signInWithGoogle, logout as firebaseLogout, db as firestore, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, query, where, writeBatch, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import type { Book, BookMetadata, BookContent, Quote, Note, Theme, ThemeFont, GenerationStatus } from './types';
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

const NavItem = ({ tab, activeTab, icon: Icon, label, onSelect, collapsed }: { tab: 'library' | 'quotes' | 'notes' | 'profile' | 'settings'; activeTab: string; icon: any; label: string; onSelect: (tab: any) => void; collapsed?: boolean }) => {
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

const App: FC = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [library, setLibrary] = useState<BookMetadata[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [hasEntered, setHasEntered] = useState<boolean | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'quotes' | 'notes' | 'profile' | 'settings'>('library');
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    try {
      updateStreak();
      
      // Load IndexedDB data
      const [localBooks, localQuotes, localNotes] = await Promise.all([
        db.getBooks().catch(() => []),
        db.getQuotes().catch(() => []),
        db.getNotes().catch(() => [])
      ]);
      
      if (currentUser) {
          // Sync with Firestore
          const booksRef = collection(firestore, 'users', currentUser.uid, 'books');
          const quotesRef = collection(firestore, 'users', currentUser.uid, 'quotes');
          const notesRef = collection(firestore, 'users', currentUser.uid, 'notes');

          const [cloudBooksSnap, cloudQuotesSnap, cloudNotesSnap] = await Promise.all([
              getDocs(booksRef),
              getDocs(quotesRef),
              getDocs(notesRef)
          ]);

          const cloudBooks = cloudBooksSnap.docs.map(doc => doc.data() as BookMetadata);
          const cloudQuotes = cloudQuotesSnap.docs.map(doc => doc.data() as Quote);
          const cloudNotes = cloudNotesSnap.docs.map(doc => doc.data() as Note);

          // Intelligent merge for books
          const mergedBooksMap = new Map<string, BookMetadata>();
          localBooks.forEach(b => mergedBooksMap.set(b.id, b));
          cloudBooks.forEach(cb => {
              const existing = mergedBooksMap.get(cb.id);
              if (!existing || (cb.lastOpened || 0) > (existing.lastOpened || 0)) {
                  mergedBooksMap.set(cb.id, { ...existing, ...cb });
                  // If cloud is newer, reflect in local DB (metadata only)
                  if (!existing || (cb.lastOpened || 0) > (existing.lastOpened || 0)) {
                      (async () => {
                          const content = await db.getBookContent(cb.id);
                          if (content) {
                              await db.saveBook({ ...cb, ...content });
                          }
                      })();
                  }
              }
          });
          const mergedBooks = Array.from(mergedBooksMap.values());

          // Intelligent merge for quotes/notes
          const mergedQuotesMap = new Map<string, Quote>();
          localQuotes.forEach(q => mergedQuotesMap.set(q.id, q));
          cloudQuotes.forEach(cq => mergedQuotesMap.set(cq.id, cq));
          
          const mergedNotesMap = new Map<string, Note>();
          localNotes.forEach(n => mergedNotesMap.set(n.id, n));
          cloudNotes.forEach(cn => mergedNotesMap.set(cn.id, cn));

          setLibrary(mergedBooks);
          setQuotes(Array.from(mergedQuotesMap.values()));
          setNotes(Array.from(mergedNotesMap.values()));
          
          if (mergedBooks.length > 0) {
              setHasEntered(true);
          } else {
              setHasEntered(false);
          }
      } else {
          setLibrary(localBooks);
          setQuotes(localQuotes);
          setNotes(localNotes);
          
          if (localBooks.length > 0) {
              setHasEntered(true);
          } else {
              setHasEntered(false);
          }
      }
    } catch (e) { 
        console.error("Load failed", e); 
        setHasEntered(false); 
    }
  }, [updateStreak]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      loadData(u);
      if (!u) {
          setHasEntered(false);
          localStorage.removeItem('zizhi-entered');
      }
    });
    return () => unsubscribe();
  }, [loadData]);

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
        newBook.lastOpened = Date.now();

        // Save locally first for instant access
        await db.saveBook(newBook); 
        
        // Update library state with metadata only
        const { chapters, toc, summaryScript, audioSummaryUrl, audioDuration, pdfData, ...metadata } = newBook;
        const metaWithFlags = { ...metadata, hasSummary: !!summaryScript, hasAudio: !!audioSummaryUrl };
        setLibrary(prev => [metaWithFlags, ...prev]);
        
        // Release the UI lock
        setIsUploading(false);
        setToast({ message: `${file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'EPUB'} added to library.` });

        // Handle cloud sync in background
        if (user) {
            (async () => {
                try {
                    const storageRef = ref(getStorage(), `users/${user.uid}/books/${newBook.id}/${file.name}`);
                    await uploadBytesResumable(storageRef, file);
                    const fileUrl = await getDownloadURL(storageRef);
                    
                    const bookRef = doc(firestore, 'users', user.uid, 'books', newBook.id);
                    await setDoc(bookRef, { ...metadata, userId: user.uid, fileUrl, createdAt: Date.now() });
                } catch (err) {
                    console.error("Background cloud sync failed", err);
                }
            })();
        }
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
    try {
        let content = await db.getBookContent(bookId);
        
        if (!content && meta.fileUrl) {
            setToast({ message: "Syncing book content from cloud..." });
            try {
                const response = await fetch(meta.fileUrl);
                const blob = await response.blob();
                const file = new File([blob], meta.title, { type: meta.type === 'pdf' ? 'application/pdf' : 'application/epub+zip' });
                
                let downloadedBook: Book;
                if (meta.type === 'pdf') {
                    downloadedBook = await parsePdf(file);
                } else {
                    downloadedBook = await parseEpub(file);
                }
                
                // Ensure ID matches the original sync ID
                downloadedBook.id = meta.id;
                const { chapters, toc, summaryScript, audioSummaryUrl, audioDuration, pdfData } = downloadedBook;
                content = { id: meta.id, chapters, toc, summaryScript, audioSummaryUrl, audioDuration, pdfData };
                
                // Save locally
                await db.saveBook({ ...meta, ...content });
                setToast({ message: "Book downloaded and synced." });
            } catch (downloadErr) {
                console.error("Failed to download cloud content", downloadErr);
                setToast({ message: "Failed to download book content." });
                return;
            }
        }

        if (content) {
            setSelectedBook({ ...meta, ...content });
        } else {
            console.error(`Book content missing for ID: ${bookId}`);
            setToast({ message: "Book content missing locally." });
        }
    } catch (err) {
        console.error(`Error loading book content for ID: ${bookId}:`, err);
        setToast({ message: "Failed to load book." });
    }
  };

  const handleViewSummary = async (bookId: string) => {
    const meta = library.find(b => b.id === bookId);
    if (!meta) return;
    const content = await db.getBookContent(bookId);
    if (content) {
        setSummaryBook({ ...meta, ...content });
    } else {
        setToast({ message: "Summary content missing." });
    }
  };

  const handleGenerateSummary = async (bookId: string) => {
    const meta = library.find(b => b.id === bookId); if (!meta) return;
    const content = await db.getBookContent(bookId); if (!content) return;
    const book: Book = { ...meta, ...content };

    setGenerationStatuses(prev => ({ ...prev, [bookId]: { stage: 'Checking', progress: 0.1, currentAction: 'Authenticating...' } }));
    
    try {
        const genAI = new GoogleGenerativeAI(process.env.API_KEY || "");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
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

        // Sync flags to Firestore in background
        if (user) {
            const bookRef = doc(firestore, 'users', user.uid, 'books', bookId);
            setDoc(bookRef, { hasSummary: true, hasAudio: true }, { merge: true }).catch(err => console.error("Cloud status sync failed", err));
        }
        
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
        if (user) {
            // Delete from Firestore
            const bookRef = doc(firestore, 'users', user.uid, 'books', id);
            await deleteDoc(bookRef).catch(e => console.error("Firestore delete failed", e));
            
            // Note: Storage deletion would require the filename/path which we should store in metadata
            // For now, we prioritize cleaning firestore.
        }
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

  if (hasEntered === null) {
    return (
      <Box className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#fdf6e3]" style={{ fontFamily: '"Gentium Book Plus", serif' }}>
          <Logo className="mb-8 scale-125" />
          <Group gap="xs">
              <IconSpinner className="w-5 h-5 text-[#a0522d] animate-spin" />
              <Text className="text-[10px] font-black uppercase tracking-widest text-[#a0522d]">Initializing Reading Room...</Text>
          </Group>
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
                  <NavItem tab="library" activeTab={activeTab} onSelect={setActiveTab} icon={IconLibrary} label="Library" collapsed={isSidebarCollapsed} />
                  <NavItem tab="quotes" activeTab={activeTab} onSelect={setActiveTab} icon={IconQuote} label="Quotes" collapsed={isSidebarCollapsed} />
                  <NavItem tab="notes" activeTab={activeTab} onSelect={setActiveTab} icon={IconNote} label="Notes" collapsed={isSidebarCollapsed} />
                  <NavItem tab="profile" activeTab={activeTab} onSelect={setActiveTab} icon={IconUser} label="Profile" collapsed={isSidebarCollapsed} />
                  <NavItem tab="settings" activeTab={activeTab} onSelect={setActiveTab} icon={IconSettings} label="Settings" collapsed={isSidebarCollapsed} />
              </nav>
              <div className={`${isSidebarCollapsed ? 'p-2' : 'p-8'} border-t-2 border-black opacity-30 overflow-hidden whitespace-nowrap`}>
                <Text className="text-[10px] font-black uppercase text-[var(--color-primary-text)]">{isSidebarCollapsed ? 'v4.2' : 'Zizhi v4.2'}</Text>
              </div>
          </aside>
          <Box className="flex-1 flex flex-col h-full overflow-hidden relative">
              <header className="h-16 md:h-20 bg-[var(--color-surface)] z-[100] px-8 flex items-center justify-between border-b-4 border-black">
                  <div className="flex items-center gap-4">
                    <div className="md:hidden"><Logo /></div>
                    <div className="hidden md:flex items-center gap-10">
                        <Text className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted-text)]">Theme: {theme.name} v5.0</Text>
                        {user && <Box className="bg-cyan-400 px-3 py-1 border-2 border-black shadow-[2px_2px_0_black]"><Text className="text-[9px] font-black uppercase text-black">Cloud Sync Active</Text></Box>}
                    </div>
                  </div>
                  <Group gap="md">
                    <ActionIcon 
                      variant="subtle" 
                      color="gray" 
                      size="lg" 
                      onClick={() => setActiveTab('settings')} 
                      className="md:hidden border-2 border-black shadow-[2px_2px_0_black] bg-[var(--color-background)] rounded-none"
                    >
                        <IconSettings className="w-5 h-5 text-[var(--color-primary-text)]" />
                    </ActionIcon>
                    <ActionIcon 
                      variant="subtle" 
                      color="gray" 
                      size="lg" 
                      onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} 
                      className="hidden md:flex border-2 border-black shadow-[2px_2px_0_black] bg-[var(--color-background)] rounded-none"
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
                          error={null} 
                          onDelete={(id) => setDeleteConfirm(id)} 
                          onGenerateSummary={handleGenerateSummary} 
                          generationStatuses={generationStatuses} 
                          onViewSummary={handleViewSummary} 
                          viewMode={viewMode} 
                          isCloudSynced={!!user}
                        />
                      )}
                      {activeTab === 'quotes' && <QuotesView theme={theme} quotes={quotes} library={library} isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} onDelete={(id) => { db.deleteQuote(id).then(() => setQuotes(prev => prev.filter(q => q.id !== id))); }} onGoToQuote={async (q) => { 
                          const meta = library.find(b => b.id === q.bookId);
                          if (meta) {
                              const content = await db.getBookContent(q.bookId);
                              if (content) {
                                  setInitialReaderNav({ chapterId: q.location, searchText: q.text });
                                  setSelectedBook({ ...meta, ...content });
                              }
                          }
                      }} />}
                      {activeTab === 'notes' && <NotesView theme={theme} notes={notes} library={library} onDelete={(id) => { db.deleteNote(id).then(() => setNotes(prev => prev.filter(n => n.id !== id))); }} onGoToNote={async (n) => { 
                          const meta = library.find(b => b.id === n.bookId);
                          if (meta) {
                              const content = await db.getBookContent(n.bookId);
                              if (content) {
                                  setInitialReaderNav({ chapterId: n.location, searchText: n.text });
                                  setSelectedBook({ ...meta, ...content });
                              }
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
                <NavItem tab="library" activeTab={activeTab} onSelect={setActiveTab} icon={IconLibrary} label="Library" />
                <NavItem tab="quotes" activeTab={activeTab} onSelect={setActiveTab} icon={IconQuote} label="Quotes" />
                    <Box className="relative -top-6">
                        <>
                          <input type="file" ref={fileInputRef} onChange={handleUpload} accept=".epub,.pdf" className="hidden" />
                          <ActionIcon size={72} className="bg-yellow-400 border-4 border-black shadow-[6px_6px_0_black] rounded-none" onClick={() => fileInputRef.current?.click()}>
                              {isUploading ? <IconSpinner className="w-8 h-8 text-black" /> : <IconUpload className="w-10 h-10 text-black" />}
                          </ActionIcon>
                        </>
                    </Box>
                <NavItem tab="notes" activeTab={activeTab} onSelect={setActiveTab} icon={IconNote} label="Notes" />
                <NavItem tab="profile" activeTab={activeTab} onSelect={setActiveTab} icon={IconUser} label="Profile" />
            </nav>
          )}
          {selectedBook && <ReaderView 
            book={selectedBook} 
            theme={theme} 
            quotes={quotes.filter(q => q.bookId === selectedBook.id)}
            notes={notes.filter(n => n.bookId === selectedBook.id)}
            initialChapterId={initialReaderNav?.chapterId}
            initialSearchText={initialReaderNav?.searchText}
            onClose={() => { setSelectedBook(null); setInitialReaderNav(null); }} 
            onUpdateProgress={async (bid, ci, st, ts, gp) => { 
              const bidx = library.findIndex(b => b.id === bid); 
              if (bidx === -1) return; 
              
              const updates: Partial<BookMetadata> = { 
                  progress: gp, 
                  lastScrollTop: st, 
                  readingTime: (library[bidx].readingTime || 0) + ts, 
                  lastOpened: Date.now() 
              }; 
              
              // Local update metadata only
              await db.updateBookMetadata(bid, updates);
              setLibrary(prev => prev.map(b => b.id === bid ? { ...b, ...updates } : b)); 
              
              // Sync metadata to Firestore in background - Only send changed fields to avoid size limits 
              // Include id and title to satisfy isValidBook rule in case of a create/upsert
              if (user) {
                  const bookRef = doc(firestore, 'users', user.uid, 'books', bid);
                  setDoc(bookRef, { 
                      ...updates, 
                      id: bid, 
                      title: library[bidx].title,
                      userId: user.uid 
                  }, { merge: true }).catch(err => {
                      try {
                          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/books/${bid}`);
                      } catch (e) {
                          console.error("Cloud sync failed", e);
                      }
                  });
              }
          }} onSaveQuote={async (t, c) => { 
              const nq: Quote = { id: crypto.randomUUID(), text: t, bookTitle: selectedBook.title, author: selectedBook.author, bookId: selectedBook.id, location: c, createdAt: Date.now() }; 
              await db.saveQuote(nq); 
              if (user) {
                  const quoteRef = doc(firestore, 'users', user.uid, 'quotes', nq.id);
                  await setDoc(quoteRef, { ...nq, userId: user.uid }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'quotes'));
              }
              setQuotes(prev => [nq, ...prev]); 
              setToast({ message: "Quote archived." }); 
          }} onSaveNote={async (t, n, c) => { 
              const nn: Note = { id: crypto.randomUUID(), text: t, note: n, bookTitle: selectedBook.title, author: selectedBook.author, bookId: selectedBook.id, location: c, createdAt: Date.now() }; 
              await db.saveNote(nn); 
              if (user) {
                  const noteRef = doc(firestore, 'users', user.uid, 'notes', nn.id);
                  await setDoc(noteRef, { ...nn, userId: user.uid }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'notes'));
              }
              setNotes(prev => [nn, ...prev]); 
              setToast({ message: "Note saved." }); 
          }} onSearch={() => {}} onFontSizeChange={(newSize) => setTheme(prev => {
              const next = { ...prev, fontSize: newSize };
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
        </Box>
      )}
    </>
  );
};

export default App;
