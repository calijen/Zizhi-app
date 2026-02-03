
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Library from './components/FileUpload';
import QuotesView from './components/QuotesView';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';
import ReaderView from './components/ReaderView';
import SearchSidebar from './components/SearchSidebar';
import Toast from './components/Toast';
import { 
    Logo, IconSettings, IconUser, IconLibrary, IconQuote, IconUpload, IconSpinner
} from './components/icons';
import * as db from './db';
import { supabase, isSupabaseConfigured } from './supabase';
import type { Book, Quote, Theme, ThemeFont } from './types';
import { parseEpub } from './epubParser';

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
        font: FONTS[0], fontSize: 1.1, lineHeight: 1.7, texture: 'none', readingMode: 'scroll'
    },
    dark: {
        name: 'Dark',
        colors: {
            'primary': '#38bdf8', 'secondary': '#818cf8', 'background': '#0f172a',
            'primary-text': '#f8fafc', 'secondary-text': '#94a3b8', 'border-color': '#1e293b'
        },
        font: FONTS[0], fontSize: 1.1, lineHeight: 1.7, texture: 'none', readingMode: 'scroll'
    },
    sepia: {
        name: 'Sepia',
        colors: {
            'primary': '#704214', 'secondary': '#966032', 'background': '#fdf6e3',
            'primary-text': '#433422', 'secondary-text': '#657b83', 'border-color': '#eee8d5'
        },
        font: FONTS[1], fontSize: 1.1, lineHeight: 1.7, texture: 'paper', readingMode: 'scroll'
    }
};

const App: React.FC = () => {
  const [library, setLibrary] = useState<Book[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'quotes' | 'profile' | 'settings'>('library');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [theme, setTheme] = useState<Theme>(THEMES.modern);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
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
      const [booksRes, quotesRes] = await Promise.all([
        supabase.from('books_metadata').select('*').eq('user_id', userId),
        supabase.from('quotes').select('*').eq('user_id', userId)
      ]);
      
      if (booksRes.error) throw booksRes.error;
      if (quotesRes.error) throw quotesRes.error;

      const cloudBooks = booksRes.data || [];
      const cloudQuotes = quotesRes.data || [];
      const localBooks = await db.getBooks();
      
      if (cloudQuotes.length > 0) {
          const formattedQuotes: Quote[] = cloudQuotes.map(q => ({
              id: q.id, text: q.text, bookTitle: q.book_title, author: q.author, bookId: q.book_id, location: q.location
          }));
          setQuotes(formattedQuotes);
          for (const q of formattedQuotes) await db.saveQuote(q);
      }

      const updatedLibrary = [...localBooks];
      for (const cb of cloudBooks) {
        const localIdx = updatedLibrary.findIndex(b => b.id === cb.id);
        if (localIdx > -1) {
            let changed = false;
            if (cb.progress > updatedLibrary[localIdx].progress) {
                updatedLibrary[localIdx].progress = cb.progress;
                changed = true;
            }
            if (cb.reading_time > (updatedLibrary[localIdx].readingTime || 0)) {
                updatedLibrary[localIdx].readingTime = cb.reading_time;
                changed = true;
            }
            if (changed) await db.saveBook(updatedLibrary[localIdx]);
        } else {
            const newBook: Book = {
                id: cb.id,
                title: cb.title,
                author: cb.author,
                progress: cb.progress,
                readingTime: cb.reading_time || 0,
                coverImageUrl: cb.cover_image_base64 || null,
                chapters: cb.chapters || [],
                toc: [],
                lastScrollTop: 0,
                lastOpened: Date.now()
            };
            updatedLibrary.push(newBook);
            await db.saveBook(newBook);
        }
      }
      setLibrary(updatedLibrary);
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
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.user) {
          setUser(session.user);
          fetchCloudData(session.user.id);
        }
      } catch (err: any) {}
    };
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchCloudData(session.user.id);
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
            await supabase.from('books_metadata').upsert({
              id: newBook.id, 
              user_id: user.id, 
              title: newBook.title, 
              author: newBook.author, 
              progress: 0,
              chapters: newBook.chapters,
              cover_image_base64: newBook.coverImageUrl,
              reading_time: 0
            }).catch(() => {});
          }
          setToast({ message: `"${newBook.title}" uploaded.` });
          setActiveTab('library');
      } catch (err) {
          setToast({ message: "Failed to upload EPUB." });
      } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleUpdateProgress = useCallback(async (bookId: string, chapterIndex: number, scrollTop: number, timeSpent: number) => {
    setLibrary(prev => {
        const idx = prev.findIndex(b => b.id === bookId);
        if (idx === -1) return prev;
        const book = prev[idx];
        const progress = (chapterIndex + 1) / (book.chapters.length || 1);
        const updatedBook = { 
            ...book, 
            progress: Math.max(book.progress, progress), 
            lastScrollTop: scrollTop,
            readingTime: (book.readingTime || 0) + timeSpent
        };
        db.saveBook(updatedBook);
        if (user && isSupabaseConfigured()) {
            supabase.from('books_metadata').upsert({ 
                id: bookId, 
                user_id: user.id, 
                progress: updatedBook.progress,
                reading_time: updatedBook.readingTime
            }).catch(() => {});
        }
        const next = [...prev];
        next[idx] = updatedBook;
        return next;
    });
  }, [user]);

  const handleSaveQuote = useCallback(async (text: string, chapterId: string) => {
    if (!selectedBook) return;
    const newQuote: Quote = { id: crypto.randomUUID(), text, bookTitle: selectedBook.title, author: selectedBook.author, bookId: selectedBook.id, location: chapterId };
    await db.saveQuote(newQuote);
    setQuotes(prev => [newQuote, ...prev]);
    setToast({ message: 'Quote saved to collection' });
    if (user && isSupabaseConfigured()) {
        supabase.from('quotes').insert({ id: newQuote.id, user_id: user.id, text, book_title: newQuote.bookTitle, author: newQuote.author, book_id: newQuote.bookId, location: chapterId }).catch(() => {});
    }
  }, [selectedBook, user]);

  const stats = useMemo(() => {
    const totalSeconds = library.reduce((acc, book) => acc + (book.readingTime || 0), 0);
    const totalHours = (totalSeconds / 3600).toFixed(1);
    const booksUploaded = library.length;
    const booksFinished = library.filter(b => b.progress >= 0.99).length;
    return { totalHours, booksUploaded, booksFinished };
  }, [library]);

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
              {isSyncing && <IconSpinner className="w-4 h-4 text-[var(--color-primary)]" />}
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${activeTab === 'profile' ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]' : 'border-[var(--color-border-color)]'}`}
              >
                  <IconUser className={`w-5 h-5 ${user ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`} />
              </button>
          </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
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
                <div className="p-8 max-w-4xl mx-auto flex flex-col items-center animate-fade-in">
                    <div className="w-24 h-24 rounded-full bg-black/5 flex items-center justify-center mb-6 relative group">
                        {user ? (
                           <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                               {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
                           </div>
                        ) : (
                           <IconUser className="w-12 h-12 text-[var(--color-primary-text)] opacity-40" />
                        )}
                        {user && (
                            <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-[var(--color-background)] shadow-sm" />
                        )}
                    </div>
                    
                    <h2 className="text-2xl font-bold font-serif mb-2 text-[var(--color-primary-text)]">
                        {user ? (user.user_metadata?.full_name || user.email) : 'Guest Reader'}
                    </h2>
                    
                    <div className="mb-10 w-full">
                        {user ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                                <div className="bg-orange-50 border border-orange-100 rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-sm">
                                    <div className="w-16 h-16 bg-orange-200/50 rounded-2xl flex items-center justify-center mb-4">
                                        <svg viewBox="0 0 24 24" className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                                        </svg>
                                    </div>
                                    <span className="text-4xl font-bold text-orange-700 mb-1">{stats.totalHours}</span>
                                    <span className="text-[11px] font-black uppercase tracking-widest text-orange-600/60">Hours Read</span>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-sm">
                                    <div className="w-16 h-16 bg-blue-200/50 rounded-2xl flex items-center justify-center mb-4">
                                        <svg viewBox="0 0 24 24" className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                                        </svg>
                                    </div>
                                    <span className="text-4xl font-bold text-blue-700 mb-1">{stats.booksUploaded}</span>
                                    <span className="text-[11px] font-black uppercase tracking-widest text-blue-600/60">Books Uploaded</span>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-sm">
                                    <div className="w-16 h-16 bg-emerald-200/50 rounded-2xl flex items-center justify-center mb-4">
                                        <svg viewBox="0 0 24 24" className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" /><path d="M12 15l-3-3 1.5-1.5L12 12l4.5-4.5L18 9l-6 6Z" />
                                        </svg>
                                    </div>
                                    <span className="text-4xl font-bold text-emerald-700 mb-1">{stats.booksFinished}</span>
                                    <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600/60">Finished</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-10 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-[3rem] border-2 border-dashed border-[var(--color-border-color)] text-center mb-10">
                                <h3 className="text-xl font-bold text-[var(--color-primary-text)] mb-3">Unlock Insights</h3>
                                <p className="text-sm text-[var(--color-secondary-text)] mb-8">Sign in to track your reading journey and sync across devices.</p>
                                <button onClick={() => setShowAuth(true)} className="px-8 py-3 bg-[var(--color-primary)] text-white font-bold rounded-full">Get Started</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {activeTab === 'settings' && (
                <SettingsView 
                    currentTheme={theme} 
                    onThemeChange={(t) => { setTheme(t); localStorage.setItem('zizhi-theme', JSON.stringify(t)); }} 
                    themes={THEMES} 
                    fonts={FONTS} 
                    textures={{}} 
                />
            )}
          </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[var(--color-background)] border-t border-[var(--color-border-color)] shadow-2xl z-40 px-2 flex items-center justify-around">
          <button onClick={() => setActiveTab('library')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'library' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`}>
              <IconLibrary className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Library</span>
          </button>
          <button onClick={() => setActiveTab('quotes')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'quotes' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`}>
              <IconQuote className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Quotes</span>
          </button>
          <div className="relative -top-6">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".epub" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-16 h-16 bg-[var(--color-primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                  <IconUpload className="w-7 h-7" />
              </button>
          </div>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`}>
              <IconUser className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Profile</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`}>
              <IconSettings className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Settings</span>
          </button>
      </nav>

      {selectedBook && (
        <ReaderView 
          book={selectedBook} 
          theme={theme} 
          onClose={() => setSelectedBook(null)} 
          onUpdateProgress={handleUpdateProgress} 
          onSaveQuote={handleSaveQuote} 
          onSearch={(q) => setSearchQuery(q)} 
        />
      )}
      {searchQuery && <SearchSidebar query={searchQuery} onClose={() => setSearchQuery(null)} />}
      {showAuth && <AuthView onClose={() => setShowAuth(false)} onLogin={(u) => { setUser(u); if (u) fetchCloudData(u.id); }} />}
      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;
