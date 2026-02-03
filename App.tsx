
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Library from './components/FileUpload';
import QuotesView from './components/QuotesView';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';
import ReaderView from './components/ReaderView';
import SearchSidebar from './components/SearchSidebar';
import Toast from './components/Toast';
import { 
    Logo, IconSettings, IconUser, IconLibrary, IconQuote, IconCloud, IconUpload, IconSpinner, IconClose
} from './components/icons';
import * as db from './db';
import { supabase, isSupabaseConfigured } from './supabase';
import type { Book, Quote, Theme, ThemeFont, GenerationStatus } from './types';
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
            'primary': '#704214', 'secondary': '#966032', 'background': '#fdf6e3',
            'primary-text': '#433422', 'secondary-text': '#657b83', 'border-color': '#eee8d5'
        },
        font: FONTS[1], fontSize: 1.1, lineHeight: 1.7, texture: 'paper'
    },
    vintage: {
        name: 'Vintage',
        colors: {
            'primary': '#5d4037', 'secondary': '#3e2723', 'background': '#f4ead5',
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
        if (localIdx > -1 && cb.progress > updatedLibrary[localIdx].progress) {
            updatedLibrary[localIdx].progress = cb.progress;
            await db.saveBook(updatedLibrary[localIdx]);
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
              id: newBook.id, user_id: user.id, title: newBook.title, author: newBook.author, progress: 0
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

  const handleUpdateProgress = useCallback(async (bookId: string, chapterIndex: number, scrollTop: number) => {
    setLibrary(prev => {
        const idx = prev.findIndex(b => b.id === bookId);
        if (idx === -1) return prev;
        const book = prev[idx];
        const progress = (chapterIndex + 1) / (book.chapters.length || 1);
        const updatedBook = { ...book, progress: Math.max(book.progress, progress), lastScrollTop: scrollTop };
        db.saveBook(updatedBook);
        if (user && isSupabaseConfigured()) {
            supabase.from('books_metadata').upsert({ id: bookId, user_id: user.id, progress: updatedBook.progress }).catch(() => {});
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
                <div className="p-8 max-w-md mx-auto flex flex-col items-center text-center animate-fade-in">
                    <div className="w-24 h-24 rounded-full bg-black/5 flex items-center justify-center mb-6 relative">
                        <IconUser className="w-12 h-12 text-[var(--color-primary-text)] opacity-40" />
                        {user && (
                            <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-[var(--color-background)] shadow-sm" />
                        )}
                    </div>
                    
                    <h2 className="text-2xl font-bold font-serif mb-2">
                        {user ? (user.user_metadata?.full_name || user.email) : 'Guest Reader'}
                    </h2>
                    
                    <div className="mb-10 w-full">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 bg-black/5 border border-[var(--color-border-color)]">
                             <span className={`w-2 h-2 rounded-full ${user ? 'bg-green-500' : 'bg-gray-300'}`} />
                             {user ? 'Reading Remotely' : 'Local Library Only'}
                        </div>

                        <div className="p-8 bg-black/5 rounded-3xl border border-[var(--color-border-color)] text-center">
                            <h3 className="text-sm font-bold text-[var(--color-primary-text)] mb-2">
                                {user ? 'Sync Active' : 'Remote Reading'}
                            </h3>
                            <p className="text-sm leading-relaxed text-[var(--color-secondary-text)]">
                                {user 
                                  ? 'Your reading progress and quotes are being synced across your devices.' 
                                  : 'Join Zizhi to sync your library across devices and back up your data safely.'}
                            </p>
                        </div>
                    </div>

                    {!user ? (
                        <button 
                            onClick={() => setShowAuth(true)} 
                            className="w-full py-4 bg-[var(--color-primary)] text-white font-bold rounded-2xl shadow-xl hover:opacity-90 active:scale-95 transition-all"
                        >
                            Sign In / Join Zizhi
                        </button>
                    ) : (
                        <div className="w-full space-y-4">
                            <button 
                                onClick={() => fetchCloudData(user.id)} 
                                className="w-full py-3 border border-[var(--color-border-color)] text-[var(--color-primary-text)] font-bold rounded-xl active:scale-95 transition-all"
                            >
                                Sync Now
                            </button>
                            <button 
                                onClick={() => { supabase.auth.signOut(); setUser(null); }} 
                                className="w-full py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            )}
            {activeTab === 'settings' && <SettingsView currentTheme={theme} onThemeChange={(t) => { setTheme(t); localStorage.setItem('zizhi-theme', JSON.stringify(t)); }} themes={THEMES} fonts={FONTS} textures={{}} />}
          </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[var(--color-background)] border-t border-[var(--color-border-color)] shadow-2xl z-40 px-2 flex items-center justify-around">
          <button onClick={() => setActiveTab('library')} className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${activeTab === 'library' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`}>
              <IconLibrary className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Library</span>
          </button>
          <button onClick={() => setActiveTab('quotes')} className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${activeTab === 'quotes' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`}>
              <IconQuote className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Quotes</span>
          </button>
          
          <div className="relative -top-6">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".epub" className="hidden" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-16 h-16 bg-[var(--color-primary)] text-white rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.25)] border-4 border-[var(--color-background)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
              >
                  {isUploading ? <IconSpinner className="w-7 h-7" /> : <IconUpload className="w-7 h-7" />}
              </button>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-secondary-text)]">Upload</span>
          </div>

          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${activeTab === 'profile' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`}>
              <IconUser className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Profile</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${activeTab === 'settings' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`}>
              <IconSettings className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Settings</span>
          </button>
      </nav>

      {selectedBook && <ReaderView book={selectedBook} theme={theme} onClose={() => setSelectedBook(null)} onUpdateProgress={handleUpdateProgress} onSaveQuote={handleSaveQuote} onSearch={(q) => setSearchQuery(q)} />}
      {searchQuery && <SearchSidebar query={searchQuery} onClose={() => setSearchQuery(null)} />}
      {showAuth && <AuthView onClose={() => setShowAuth(false)} onLogin={(u) => { setUser(u); if (u) fetchCloudData(u.id); }} />}
      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;
