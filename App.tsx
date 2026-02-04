
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
import { GoogleGenAI, Type } from "@google/genai";

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

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
};

const App: React.FC = () => {
  const [library, setLibrary] = useState<Book[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'quotes' | 'profile' | 'settings'>('library');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [targetChapterId, setTargetChapterId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [theme, setTheme] = useState<Theme>(THEMES.modern);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [streakMode, setStreakMode] = useState<'daily' | 'weekly'>('daily');
  const [detectedGenres, setDetectedGenres] = useState<{ genre: string; score: number }[]>([]);
  const [isAnalyzingGenres, setIsAnalyzingGenres] = useState(false);
  
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

  const analyzeGenres = async () => {
      if (library.length === 0) return;
      setIsAnalyzingGenres(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const bookList = library.map(b => `"${b.title}" by ${b.author}`).join(', ');
          
          const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: `Analyze this reading list and identify the top 5 most frequent genres or themes. For each genre, estimate a 'mastery score' from 1-100 based on the volume. Return exactly 5 items in JSON. List of books: ${bookList}`,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              genre: { type: Type.STRING },
                              score: { type: Type.NUMBER }
                          },
                          required: ["genre", "score"]
                      }
                  }
              }
          });
          
          const result = JSON.parse(response.text);
          setDetectedGenres(result);
      } catch (err) {
          console.error("Genre analysis failed", err);
      } finally {
          setIsAnalyzingGenres(false);
      }
  };

  useEffect(() => {
    if (library.length > 0 && activeTab === 'profile' && detectedGenres.length === 0 && !isAnalyzingGenres) {
        analyzeGenres();
    }
  }, [library, activeTab]);

  const sortedLibrary = useMemo(() => {
      return [...library].sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0));
  }, [library]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      try {
          const newBook = await parseEpub(file);
          newBook.lastOpened = Date.now();
          await db.saveBook(newBook);
          setLibrary(prev => [newBook, ...prev]);
          if (user && isSupabaseConfigured()) {
            try {
              await supabase.from('books_metadata').upsert({
                id: newBook.id, 
                user_id: user.id, 
                title: newBook.title, 
                author: newBook.author, 
                progress: 0,
                chapters: newBook.chapters,
                cover_image_base64: newBook.coverImageUrl,
                reading_time: 0
              });
            } catch (err) {
              console.error("Cloud upload error", err);
            }
          }
          setToast({ message: `"${newBook.title}" added to your shelf.` });
          setActiveTab('library');
          setDetectedGenres([]); 
      } catch (err) {
          console.error("Upload error", err);
          setToast({ message: "Unable to process EPUB." });
      } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const openBook = useCallback((bookId: string, chapterId?: string) => {
      const book = library.find(b => b.id === bookId);
      if (book) {
          const updatedBook = { ...book, lastOpened: Date.now() };
          setSelectedBook(updatedBook);
          setTargetChapterId(chapterId || null);
          setLibrary(prev => prev.map(b => b.id === bookId ? updatedBook : b));
          db.saveBook(updatedBook);
      }
  }, [library]);

  const handleUpdateProgress = useCallback(async (bookId: string, chapterIndex: number, scrollTop: number, timeSpent: number) => {
    let updatedBook: Book | null = null;
    
    setLibrary(prev => {
        const idx = prev.findIndex(b => b.id === bookId);
        if (idx === -1) return prev;
        const book = prev[idx];
        const progress = (chapterIndex + 1) / (book.chapters.length || 1);
        updatedBook = { 
            ...book, 
            progress: Math.max(book.progress, progress), 
            lastScrollTop: scrollTop,
            readingTime: (book.readingTime || 0) + timeSpent,
            lastOpened: Date.now()
        };
        const next = [...prev];
        next[idx] = updatedBook;
        return next;
    });

    if (updatedBook) {
        await db.saveBook(updatedBook);
        if (user && isSupabaseConfigured()) {
            try {
                await supabase.from('books_metadata').upsert({ 
                    id: bookId, 
                    user_id: user.id, 
                    progress: updatedBook.progress,
                    reading_time: updatedBook.readingTime
                });
            } catch (err) {
                console.error("Sync error", err);
            }
        }
    }
  }, [user]);

  const handleSaveQuote = useCallback(async (text: string, chapterId: string) => {
    if (!selectedBook) return;
    const newQuote: Quote = { id: crypto.randomUUID(), text, bookTitle: selectedBook.title, author: selectedBook.author, bookId: selectedBook.id, location: chapterId };
    await db.saveQuote(newQuote);
    setQuotes(prev => [newQuote, ...prev]);
    setToast({ message: 'Insight saved to your quotes.' });
    if (user && isSupabaseConfigured()) {
        try {
            await supabase.from('quotes').insert({ id: newQuote.id, user_id: user.id, text, book_title: newQuote.bookTitle, author: newQuote.author, book_id: newQuote.bookId, location: chapterId });
        } catch (err) {
            console.error("Cloud quote error", err);
        }
    }
  }, [selectedBook, user]);

  const stats = useMemo(() => {
    const totalSeconds = library.reduce((acc, book) => acc + (book.readingTime || 0), 0);
    const totalHours = (totalSeconds / 3600).toFixed(1);
    const booksUploaded = library.length;
    return { totalHours, totalSeconds, booksUploaded };
  }, [library]);

  const recentlyOpened = useMemo(() => {
    return sortedLibrary.filter(b => b.progress > 0).slice(0, 5);
  }, [sortedLibrary]);

  const appStyles = {
      '--color-primary': theme.colors.primary,
      '--color-primary-rgb': hexToRgb(theme.colors.primary),
      '--color-background': theme.colors.background,
      '--color-primary-text': theme.colors['primary-text'],
      '--color-secondary-text': theme.colors['secondary-text'],
      '--color-border-color': theme.colors['border-color'],
      '--font-serif': theme.font.serif,
      '--font-sans': theme.font.sans,
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
                <Library books={sortedLibrary} onBookSelect={openBook} 
                         isLoading={isUploading} error={null} onDelete={async (id) => { await db.deleteBook(id); setLibrary(prev => prev.filter(b => b.id !== id)); }} onGenerateSummary={() => {}} 
                         generationStatuses={{}} onViewSummary={() => {}} generatingSummaryForBookId={null} />
            )}
            {activeTab === 'quotes' && (
                <QuotesView quotes={quotes} onDelete={async (id) => { await db.deleteQuote(id); setQuotes(prev => prev.filter(q => q.id !== id)); }} onShare={() => {}} onGenerateImage={() => {}} onGoToQuote={(q) => openBook(q.bookId, q.location)} />
            )}
            {activeTab === 'profile' && (
                <div className={`p-6 min-h-full relative animate-fade-in text-[var(--color-primary-text)]`}>
                    {!user ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-24 h-24 mb-6 rounded-full border-2 border-dashed border-[var(--color-border-color)] flex items-center justify-center">
                                <IconUser className="w-12 h-12 opacity-20" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4 theme-serif">Join the Journey</h2>
                            <p className="text-[var(--color-secondary-text)] mb-8 max-w-xs">Create an account to track your milestones and sync your library across devices.</p>
                            <button onClick={() => setShowAuth(true)} className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all">Get Started</button>
                        </div>
                    ) : (
                        <div className="max-w-xl mx-auto space-y-12 pb-10">
                            {/* Profile Header */}
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-3xl font-bold theme-serif mb-1">Your Journey</h2>
                                    <p className="text-sm opacity-60 font-medium">Reading Insights & Milestones</p>
                                </div>
                                <div className="text-right">
                                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-black text-xl border border-[var(--color-primary)]/20 shadow-sm">
                                        {(user.user_metadata?.full_name || user.email)[0].toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            {/* Circular Reading Time Animation */}
                            <div className="relative flex flex-col items-center py-4">
                                <div className="w-72 h-72 rounded-full border border-[var(--color-border-color)] flex items-center justify-center relative bg-[var(--color-primary)]/[0.02] shadow-[inset_0_0_20px_rgba(var(--color-primary-rgb),0.05)]">
                                    <div className="absolute inset-0 border-t border-[var(--color-primary)] rounded-full animate-spin [animation-duration:15s] opacity-20"></div>
                                    <div className="absolute inset-4 border-b border-[var(--color-primary)] rounded-full animate-spin [animation-duration:25s] [animation-direction:reverse] opacity-10"></div>
                                    
                                    <div className="text-center z-10">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-3">Time Invested</p>
                                        <div className="flex items-end justify-center gap-1 h-12 mb-4">
                                            {[1,2,3,4,5,6,5,4,3,2,1].map((h, i) => (
                                                <div key={i} className="w-1.5 bg-[var(--color-primary)] rounded-full opacity-60" style={{ height: `${h * 10}%`, animation: `wave 1.5s ease-in-out infinite ${i * 0.1}s` }}></div>
                                            ))}
                                        </div>
                                        <div className="text-6xl font-black theme-serif text-[var(--color-primary-text)]">{stats.totalHours}</div>
                                        <p className="text-sm font-medium opacity-60 mt-1">Hours Reading</p>
                                    </div>
                                </div>
                            </div>

                            {/* Primary Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-3xl bg-[var(--color-primary)]/[0.03] border border-[var(--color-border-color)] shadow-sm">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-4">Books in Shelf</p>
                                    <div className="text-4xl font-black theme-serif">{stats.booksUploaded}</div>
                                    <p className="text-xs opacity-50 mt-1 font-medium">Stories Captured</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-[var(--color-primary)]/[0.03] border border-[var(--color-border-color)] shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Active Pulse</p>
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        </div>
                                        <div className="text-4xl font-black theme-serif">3</div>
                                        <p className="text-xs opacity-50 mt-1 font-medium">Daily Streak</p>
                                    </div>
                                    <div className="flex p-0.5 bg-[var(--color-primary)]/[0.05] rounded-lg mt-4">
                                        <button onClick={() => setStreakMode('daily')} className={`flex-1 text-[9px] font-bold py-1.5 rounded-md transition-all ${streakMode === 'daily' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'opacity-40'}`}>Daily</button>
                                        <button onClick={() => setStreakMode('weekly')} className={`flex-1 text-[9px] font-bold py-1.5 rounded-md transition-all ${streakMode === 'weekly' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'opacity-40'}`}>Weekly</button>
                                    </div>
                                </div>
                            </div>

                            {/* AI Genre Mastery */}
                            <div className="p-8 rounded-[2.5rem] bg-[var(--color-primary)]/[0.02] border border-[var(--color-border-color)]">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-lg font-bold theme-serif">Genre Mastery</h3>
                                    {isAnalyzingGenres ? (
                                        <IconSpinner className="w-4 h-4 text-[var(--color-primary)] opacity-40" />
                                    ) : (
                                        <button onClick={analyzeGenres} className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] hover:underline opacity-60">Recalculate</button>
                                    )}
                                </div>
                                <div className="space-y-6">
                                    {detectedGenres.length > 0 ? detectedGenres.map((item, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between text-sm font-medium mb-2">
                                                <span className="capitalize">{item.genre}</span>
                                                <span className="opacity-40 text-xs">{item.score}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-[var(--color-primary)]/[0.05] rounded-full overflow-hidden">
                                                <div className="h-full bg-[var(--color-primary)] transition-all duration-1000" style={{ width: `${item.score}%` }}></div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-8 text-center text-sm opacity-40 italic">
                                            {isAnalyzingGenres ? "Exploring patterns..." : "Scan your library to see your genre mastery."}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Milestones Horizontal Carousel */}
                            <div>
                                <h3 className="text-lg font-bold theme-serif mb-6 px-1">Recent Reads</h3>
                                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                    {recentlyOpened.length > 0 ? recentlyOpened.map(book => (
                                        <div key={book.id} className="flex-none w-32 group cursor-pointer" onClick={() => openBook(book.id)}>
                                            <div className="aspect-[2/3] rounded-2xl border border-[var(--color-border-color)] mb-3 overflow-hidden shadow-sm transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                                                {book.coverImageUrl ? (
                                                    <img src={book.coverImageUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-[var(--color-primary)]/[0.05] flex items-center justify-center p-3 text-center text-[10px] font-bold">{book.title}</div>
                                                )}
                                            </div>
                                            <div className="text-[10px] font-bold truncate opacity-80 uppercase tracking-wider">{book.title}</div>
                                        </div>
                                    )) : (
                                        <div className="w-full py-12 text-center rounded-3xl border border-dashed border-[var(--color-border-color)] opacity-30 text-sm italic">Open a book to start tracking milestones.</div>
                                    )}
                                </div>
                            </div>

                            {/* Bottom Actions */}
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <button 
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({
                                                title: 'My Reading Journey',
                                                text: `I've read ${stats.booksUploaded} books for a total of ${stats.totalHours} hours on Zizhi!`,
                                                url: window.location.origin
                                            }).catch(() => {});
                                        } else {
                                            setToast({ message: "Sharing is not supported on this device." });
                                        }
                                    }} 
                                    className="py-4 bg-[var(--color-primary)] text-white rounded-2xl font-bold shadow-lg shadow-[rgba(var(--color-primary-rgb),0.2)] active:scale-95 transition-all"
                                >Share Journey</button>
                                <button onClick={() => { supabase.auth.signOut(); setUser(null); }} className="py-4 bg-transparent border border-[var(--color-border-color)] text-[var(--color-secondary-text)] rounded-2xl font-bold hover:bg-black/5 active:scale-95 transition-all">Sign Out</button>
                            </div>
                        </div>
                    )}
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
              <IconUser className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Journey</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)]'}`}>
              <IconSettings className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Settings</span>
          </button>
      </nav>

      {selectedBook && (
        <ReaderView 
          book={selectedBook} 
          theme={theme} 
          initialChapterId={targetChapterId}
          onClose={() => { setSelectedBook(null); setTargetChapterId(null); }} 
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
