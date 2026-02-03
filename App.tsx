
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import Library, { BookCardData } from './components/FileUpload';
import QuotesView from './components/QuotesView';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';
import ReaderView from './components/ReaderView';
import SearchSidebar from './components/SearchSidebar';
import Toast from './components/Toast';
import { 
    Logo, IconSettings, IconUser, IconLibrary, IconQuote, IconCloud, IconUpload, IconSpinner
} from './components/icons';
import * as db from './db';
import { supabase, isSupabaseConfigured } from './supabase';
import type { Book, Quote, Theme, ThemeFont } from './types';
import { parseEpub } from './epubParser';

export interface GenerationStatus {
    stage: 'script' | 'audio' | 'none';
    progress: number;
    currentAction: string;
}

const FONTS: ThemeFont[] = [
    { name: 'Modern', sans: 'Inter', serif: 'Lora' },
    { name: 'Classic', sans: 'Helvetica Neue', serif: 'Georgia' },
    { name: 'Humanist', sans: 'Nunito', serif: 'Merriweather' },
    { name: 'Geometric', sans: 'Montserrat', serif: 'Roboto Slab' },
    { name: 'System', sans: '-apple-system, BlinkMacSystemFont, Segoe UI', serif: 'Times New Roman' }
];

export const THEMES: { [key: string]: Theme } = {
    modern: {
        name: 'Modern',
        colors: {
            'primary': '#2563eb', 'secondary': '#3b82f6', 'background': '#ffffff',
            'primary-text': '#111827', 'secondary-text': '#4b5563', 'border-color': '#e5e7eb'
        },
        font: FONTS[0], fontSize: 1.1, lineHeight: 1.7, texture: 'none'
    },
    dark: {
        name: 'Dark',
        colors: {
            'primary': '#38bdf8', 'secondary': '#818cf8', 'background': '#0f172a',
            'primary-text': '#f8fafc', 'secondary-text': '#94a3b8', 'border-color': '#1e293b'
        },
        font: FONTS[0], fontSize: 1.1, lineHeight: 1.7, texture: 'none'
    },
    sepia: {
        name: 'Sepia',
        colors: {
            'primary': '#b58900', 'secondary': '#cb4b16', 'background': '#fdf6e3',
            'primary-text': '#586e75', 'secondary-text': '#839496', 'border-color': '#eee8d5'
        },
        font: FONTS[1], fontSize: 1.1, lineHeight: 1.7, texture: 'paper'
    },
    vintage: {
        name: 'Vintage',
        colors: {
            'primary': '#8b4513', 'secondary': '#2c1810', 'background': '#fcf5e5',
            'primary-text': '#2c1810', 'secondary-text': '#5d4037', 'border-color': '#d7ccc8'
        },
        font: FONTS[2], fontSize: 1.1, lineHeight: 1.7, texture: 'paper'
    }
};

const App: React.FC = () => {
  const [library, setLibrary] = useState<Book[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'quotes' | 'profile' | 'settings'>('library');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [theme, setTheme] = useState<Theme>(THEMES.modern);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('zizhi-theme');
    if (saved) {
      try { setTheme(JSON.parse(saved)); } catch(e) {}
    }
  }, []);

  const fetchCloudData = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured()) return;
    setIsSyncing(true);
    try {
      const { data: cloudBooks, error: bookError } = await supabase!
        .from('books_metadata')
        .select('*')
        .eq('user_id', userId);
      
      if (bookError) throw bookError;

      const { data: cloudQuotes, error: quoteError } = await supabase!
        .from('quotes')
        .select('*')
        .eq('user_id', userId);
        
      if (quoteError) throw quoteError;

      const localBooks = await db.getBooks();

      if (cloudQuotes) {
          const formattedQuotes: Quote[] = cloudQuotes.map(q => ({
              id: q.id,
              text: q.text,
              bookTitle: q.book_title,
              author: q.author,
              bookId: q.book_id,
              location: q.location
          }));
          setQuotes(formattedQuotes);
          for (const q of formattedQuotes) await db.saveQuote(q);
      }

      const updatedLibrary = [...localBooks];
      for (const cb of cloudBooks || []) {
        const localIdx = updatedLibrary.findIndex(b => b.id === cb.id);
        if (localIdx > -1) {
          if (cb.progress > updatedLibrary[localIdx].progress) {
            updatedLibrary[localIdx].progress = cb.progress;
            updatedLibrary[localIdx].lastOpened = cb.last_opened;
            await db.saveBook(updatedLibrary[localIdx]);
          }
        }
      }
      setLibrary(updatedLibrary);
      setLastSyncTime(new Date());
    } catch (err: any) {
      console.error('Cloud Sync Issue:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const checkSession = async () => {
        try {
            const { data: { session } } = await supabase!.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                fetchCloudData(session.user.id);
            }
        } catch (err) {}
    };
    checkSession();
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) fetchCloudData(newUser.id);
    });
    return () => subscription.unsubscribe();
  }, [fetchCloudData]);

  useEffect(() => {
    const loadLocalData = async () => {
        const [localBooks, localQuotes] = await Promise.all([db.getBooks(), db.getQuotes()]);
        setLibrary(localBooks);
        setQuotes(localQuotes);
    };
    loadLocalData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      try {
          const newBook = await parseEpub(file);
          await db.saveBook(newBook);
          setLibrary(prev => [newBook, ...prev]);
          if (user && isSupabaseConfigured()) {
            await supabase!.from('books_metadata').upsert({
              id: newBook.id, user_id: user.id, title: newBook.title, author: newBook.author,
              cover_image_url: newBook.coverImageUrl, progress: 0, last_opened: Date.now()
            }).catch(e => console.warn("Background cloud update failed:", e));
          }
          setToast({ message: `"${newBook.title}" added to library.` });
          setActiveTab('library');
      } catch (err: any) {
          setToast({ message: "Failed to open book. Ensure it is a valid EPUB." });
      } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleApplyTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('zizhi-theme', JSON.stringify(newTheme));
    setToast({ message: "Settings saved successfully." });
  };

  // Fix: Implemented handleUpdateProgress to track and persist reading status
  const handleUpdateProgress = (bookId: string, chapterIndex: number, scrollTop: number) => {
    setLibrary(prev => prev.map(book => {
      if (book.id === bookId) {
        const progress = Math.min(1, (chapterIndex + 1) / (book.chapters.length || 1));
        const updated = { ...book, progress, lastScrollTop: scrollTop, lastOpened: Date.now() };
        db.saveBook(updated);
        
        if (user && isSupabaseConfigured()) {
          supabase!.from('books_metadata').update({ 
            progress: progress, 
            last_opened: updated.lastOpened 
          }).eq('id', bookId).eq('user_id', user.id).catch(err => console.error("Cloud progress update failed:", err));
        }
        return updated;
      }
      return book;
    }));
  };

  // Fix: Implemented handleSaveQuote to allow users to save highlights to their collection
  const handleSaveQuote = async (text: string, chapterId: string) => {
    if (!selectedBook) return;
    const newQuote: Quote = {
      id: crypto.randomUUID(),
      text,
      bookTitle: selectedBook.title,
      author: selectedBook.author,
      bookId: selectedBook.id,
      location: chapterId
    };
    
    await db.saveQuote(newQuote);
    setQuotes(prev => [newQuote, ...prev]);
    
    if (user && isSupabaseConfigured()) {
      await supabase!.from('quotes').insert({
        id: newQuote.id,
        user_id: user.id,
        text: newQuote.text,
        book_title: newQuote.bookTitle,
        author: newQuote.author,
        book_id: newQuote.bookId,
        location: newQuote.location
      }).catch(err => console.error("Cloud quote sync failed:", err));
    }
    
    setToast({ message: "Quote saved successfully." });
  };

  const appStyles = {
      '--color-primary': theme.colors.primary,
      '--color-background': theme.colors.background,
      '--color-primary-text': theme.colors['primary-text'],
      '--color-secondary-text': theme.colors['secondary-text'],
      '--color-border-color': theme.colors['border-color']
  } as React.CSSProperties;

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--color-background)]" style={appStyles}>
      <header className="flex-none h-16 border-b border-[var(--color-border-color)] flex items-center justify-between px-6 z-40 bg-[var(--color-background)]">
          <Logo className="h-8 w-auto text-[var(--color-primary-text)]" />
          <div className="flex items-center gap-3">
              {isSyncing && <IconCloud className="w-4 h-4 text-[var(--color-primary)] animate-pulse" />}
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${activeTab === 'profile' ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] ring-offset-2' : 'border-[var(--color-border-color)]'}`}
              >
                  <IconUser className={`w-5 h-5 ${user ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`} />
              </button>
          </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 relative">
          <div className="max-w-7xl mx-auto h-full">
            {activeTab === 'library' && (
                <Library books={library} onBookSelect={(id) => setSelectedBook(library.find(b => b.id === id) || null)} 
                         isLoading={isUploading} error={null} onDelete={async (id) => { await db.deleteBook(id); setLibrary(prev => prev.filter(b => b.id !== id)); }} onGenerateSummary={() => {}} 
                         generationStatuses={{}} onViewSummary={() => {}} generatingSummaryForBookId={null} />
            )}
            {activeTab === 'quotes' && (
                <QuotesView quotes={quotes} onDelete={async (id) => { await db.deleteQuote(id); setQuotes(prev => prev.filter(q => q.id !== id)); }} onShare={() => {}} onGenerateImage={() => {}} onGoToQuote={() => {}} />
            )}
            {activeTab === 'profile' && (
                <div className="p-8 max-w-md mx-auto flex flex-col items-center text-center animate-fade-in">
                    <div className="w-24 h-24 rounded-full bg-[rgba(var(--color-primary-rgb),0.1)] flex items-center justify-center mb-6">
                        <IconUser className="w-12 h-12 text-[var(--color-primary)]" />
                    </div>
                    <h2 className="text-2xl font-bold font-serif mb-2">{user?.email || 'Guest Reader'}</h2>
                    <p className="text-[var(--color-secondary-text)] mb-10">
                        {user ? 'Signed in with Cloud Sync' : 'Sign in to keep your library in sync.'}
                    </p>
                    {!user ? (
                        <button onClick={() => setShowAuth(true)} className="w-full py-4 bg-[var(--color-primary)] text-white font-bold rounded-xl shadow-lg">Sign In</button>
                    ) : (
                        <button onClick={() => { supabase?.auth.signOut(); setUser(null); }} className="w-full py-4 border border-[var(--color-border-color)] text-[var(--color-primary-text)] font-bold rounded-xl">Sign Out</button>
                    )}
                </div>
            )}
            {activeTab === 'settings' && <SettingsView currentTheme={theme} onThemeChange={handleApplyTheme} themes={THEMES} fonts={FONTS} textures={{}} />}
          </div>
      </main>

      {/* Raised Bottom Navigation with labels */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[var(--color-background)] border-t border-[var(--color-border-color)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 px-2 flex items-center justify-around">
          <button onClick={() => setActiveTab('library')} className={`flex flex-col items-center gap-1 min-w-[64px] ${activeTab === 'library' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`}>
              <IconLibrary className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Library</span>
          </button>
          <button onClick={() => setActiveTab('quotes')} className={`flex flex-col items-center gap-1 min-w-[64px] ${activeTab === 'quotes' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`}>
              <IconQuote className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Quotes</span>
          </button>
          
          <div className="relative -top-6">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".epub" className="hidden" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-16 h-16 bg-[var(--color-primary)] text-white rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.2)] border-4 border-[var(--color-background)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
              >
                  {isUploading ? <IconSpinner className="w-7 h-7" /> : <IconUpload className="w-7 h-7" />}
              </button>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-secondary-text)]">Upload</span>
          </div>

          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 min-w-[64px] ${activeTab === 'profile' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`}>
              <IconUser className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Profile</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 min-w-[64px] ${activeTab === 'settings' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`}>
              <IconSettings className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Settings</span>
          </button>
      </nav>

      {selectedBook && <ReaderView book={selectedBook} theme={theme} onClose={() => setSelectedBook(null)} onUpdateProgress={handleUpdateProgress} onSaveQuote={handleSaveQuote} onSearch={(query) => setSearchQuery(query)} />}
      {showAuth && <AuthView onClose={() => setShowAuth(false)} onLogin={(u) => { setUser(u); fetchCloudData(u.id); }} />}
      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;
