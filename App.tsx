import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Library from './components/FileUpload';
import QuotesView from './components/QuotesView';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';
import ReaderView from './components/ReaderView';
import SearchSidebar from './components/SearchSidebar';
import SummaryView from './components/TrailerView';
import ProfileView from './components/ProfileView';
import Toast from './components/Toast';
import { 
    Logo, IconSettings, IconUser, IconLibrary, IconQuote, IconUpload, IconSpinner, IconLayoutGrid, IconLayoutList, IconMicrophone, IconClose
} from './components/icons';
import * as db from './db';
import { supabase, isSupabaseConfigured } from './supabase';
import type { Book, Quote, Theme, ThemeFont, GenerationStatus, ReadingActivity } from './types';
import { parseEpub } from './epubParser';
import { GoogleGenAI, Modality } from "@google/genai";

const FONTS: ThemeFont[] = [
    { name: 'Inter & Lora', sans: 'Inter', serif: 'Lora' },
    { name: 'Inter & Crimson', sans: 'Inter', serif: 'Crimson Pro' },
    { name: 'Inter & Literata', sans: 'Inter', serif: 'Literata' }
];

export const THEMES: { [key: string]: Theme } = {
    modern: {
        id: 'modern', name: 'Modern',
        colors: {
            'primary': '#6366F1', 'secondary': '#22C55E', 'background': '#FFFFFF',
            'surface': '#F8FAFC', 'primary-text': '#000000', 'secondary-text': '#1F2937', 
            'muted-text': '#4B5563', 'border-color': '#CBD5E1'
        },
        font: FONTS[0], fontSize: 1.1, lineHeight: 1.6, texture: 'none', readingMode: 'scroll'
    },
    dark: {
        id: 'dark', name: 'Dark',
        colors: {
            'primary': '#818CF8', 'secondary': '#A3E635', 'background': '#0F172A',
            'surface': '#1E293B', 'primary-text': '#F1F5F9', 'secondary-text': '#94A3B8',
            'muted-text': '#475569', 'border-color': '#334155'
        },
        font: FONTS[0], fontSize: 1.1, lineHeight: 1.6, texture: 'none', readingMode: 'scroll'
    },
    sepia: {
        id: 'sepia', name: 'Sepia',
        colors: {
            'primary': '#84543C', 'secondary': '#5E7D4E', 'background': '#F4ECD8',
            'surface': '#EDE3CC', 'primary-text': '#2C1B1B', 'secondary-text': '#4D3B3B', 
            'muted-text': '#705C5C', 'border-color': '#C9BBA5'
        },
        font: FONTS[1], fontSize: 1.1, lineHeight: 1.7, texture: 'paper', readingMode: 'scroll'
    }
};

const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
};

function createWavBlob(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, pcmData.length, true);
    return new Blob([header, pcmData], { type: 'audio/wav' });
}

const App: React.FC = () => {
  const [library, setLibrary] = useState<Book[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'quotes' | 'profile' | 'settings'>('library');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [summaryBook, setSummaryBook] = useState<Book | null>(null);
  const [targetChapterId, setTargetChapterId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; action?: { label: string; onClick: () => void } } | null>(null);
  const [theme, setTheme] = useState<Theme>(THEMES.modern);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [generationStatuses, setGenerationStatuses] = useState<Record<string, GenerationStatus>>({});
  const [showGenerationOverlay, setShowGenerationOverlay] = useState(false);
  const [activity, setActivity] = useState<ReadingActivity[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const NavItem = ({ tab, icon: Icon, label }: { tab: 'library' | 'quotes' | 'profile' | 'settings'; icon: React.FC<{ className?: string }>; label: string }) => {
    const isActive = activeTab === tab;
    return (
        <button 
            onClick={() => setActiveTab(tab)} 
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-text)] opacity-40 hover:opacity-100'}`}
        >
            <Icon className="w-6 h-6" />
            <span className="text-[9px] font-black tracking-widest uppercase">{label}</span>
            {isActive && <div className="w-1 h-1 bg-[var(--color-primary)] rounded-full mt-0.5" />}
        </button>
    );
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('zizhi-theme');
    if (savedTheme) { try { setTheme(JSON.parse(savedTheme)); } catch(e) {} }
    const savedMode = localStorage.getItem('zizhi-view-mode');
    if (savedMode) setViewMode(savedMode as any);
  }, []);

  const loadData = async () => {
    const [localBooks, localQuotes, localActivity] = await Promise.all([
        db.getBooks(), db.getQuotes(), db.getActivity()
    ]);
    setLibrary(localBooks);
    setQuotes(localQuotes);
    setActivity(localActivity);
  };

  useEffect(() => { loadData(); }, []);

  const streak = useMemo(() => {
    if (!activity || activity.length === 0) return 0;
    const sortedDates = [...activity].map(a => a.date).sort((a, b) => b.localeCompare(a));
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0;
    
    let currentStreak = 0;
    let expectedDate = new Date(sortedDates[0]);
    const dateSet = new Set(sortedDates);
    
    while (dateSet.has(expectedDate.toISOString().split('T')[0])) {
      currentStreak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    }
    return currentStreak;
  }, [activity]);

  const handleDeleteBook = useCallback(async (id: string) => {
    const book = library.find(b => b.id === id);
    if (!book) return;
    
    const confirmDelete = window.confirm(`Are you sure you want to remove "${book.title}" from your shelf?`);
    if (confirmDelete) {
      try {
        await db.deleteBook(id);
        setLibrary(prev => prev.filter(b => b.id !== id));
        setToast({ message: "Book removed from shelf." });
      } catch (err) {
        setToast({ message: "Error removing book." });
      }
    }
  }, [library]);

  const handleDeleteQuote = useCallback(async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this quote?");
    if (confirmDelete) {
      try {
        await db.deleteQuote(id);
        setQuotes(prev => prev.filter(q => q.id !== id));
        setToast({ message: "Quote deleted." });
      } catch (err) {
        setToast({ message: "Error deleting quote." });
      }
    }
  }, []);

  const handleGenerateSummary = async (bookId: string) => {
      const book = library.find(b => b.id === bookId);
      if (!book || generationStatuses[bookId]) return;
      
      setShowGenerationOverlay(true);
      setGenerationStatuses(prev => ({ ...prev, [bookId]: { stage: 'text', progress: 5, currentAction: 'Performing editorial synthesis...' } }));
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const combinedText = book.chapters.slice(0, 30).map(c => c.textContent).join('\n').slice(0, 45000);
          
          setGenerationStatuses(prev => ({ ...prev, [bookId]: { stage: 'text', progress: 15, currentAction: 'Identifying core narrative spine...' } }));
          
          const textResponse = await ai.models.generateContent({
              model: "gemini-3-pro-preview",
              contents: `You are a sharp editor creating an editorial summary for "${book.title}" by ${book.author}. Goal: 1800-2200 words script. Use 5-8 titled sections. Narrative voice: Opinionated, intelligent, fair. Synthesis of entire book. TEXT: ${combinedText}`,
              config: { thinkingConfig: { thinkingBudget: 24000 } }
          });
          
          const summaryScript = textResponse.text;
          setGenerationStatuses(prev => ({ ...prev, [bookId]: { stage: 'audio', progress: 50, currentAction: 'Finalizing vocal orchestration...' } }));
          
          const audioResponse = await ai.models.generateContent({
              model: "gemini-2.5-flash-preview-tts",
              contents: [{ parts: [{ text: `Narrate with warm, thoughtful editorial gravitas: ${summaryScript}` }] }],
              config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
              },
          });
          
          const base64Audio = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
              const pcmData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
              const audioBlob = createWavBlob(pcmData, 24000);
              const audioUrl = URL.createObjectURL(audioBlob); 
              const updatedBook = { ...book, summaryScript, audioSummaryUrl: audioUrl }; 
              await db.saveBook(updatedBook);
              setLibrary(prev => prev.map(b => b.id === bookId ? updatedBook : b));
              setGenerationStatuses({});
              setShowGenerationOverlay(false);
              setSummaryBook(updatedBook);
          }
      } catch (err) { 
          setToast({ message: "Editorial synthesis failed." }); 
          setGenerationStatuses({});
          setShowGenerationOverlay(false);
      }
  };

  const handleUpdateProgress = useCallback(async (bookId: string, chapterIndex: number, scrollTop: number, timeSpent: number) => {
    let updatedBook: Book | null = null;
    if (timeSpent > 0) { await db.logActivity(timeSpent); setActivity(await db.getActivity()); }
    setLibrary(prev => {
        const idx = prev.findIndex(b => b.id === bookId);
        if (idx === -1) return prev;
        const book = prev[idx];
        const progress = (chapterIndex + 1) / (book.chapters.length || 1);
        updatedBook = { ...book, progress: Math.max(book.progress || 0, progress), lastScrollTop: scrollTop, readingTime: (book.readingTime || 0) + timeSpent, lastOpened: Date.now() };
        const next = [...prev]; next[idx] = updatedBook; return next;
    });
    if (updatedBook) {
        await db.saveBook(updatedBook);
    }
  }, []);

  const handleSaveQuote = useCallback(async (text: string, chapterId: string) => {
    if (!selectedBook) return;
    const newQuote: Quote = { id: crypto.randomUUID(), text, bookTitle: selectedBook.title, author: selectedBook.author, bookId: selectedBook.id, location: chapterId, createdAt: Date.now() };
    await db.saveQuote(newQuote);
    setQuotes(prev => [newQuote, ...prev]);
    setToast({ message: "Insight captured." });
  }, [selectedBook]);

  const appStyles = {
      '--color-primary': theme.colors.primary,
      '--color-primary-rgb': hexToRgb(theme.colors.primary),
      '--color-background': theme.colors.background,
      '--color-surface': theme.colors.surface,
      '--color-primary-text': theme.colors['primary-text'],
      '--color-secondary-text': theme.colors['secondary-text'],
      '--color-border-color': theme.colors['border-color'],
      '--font-serif': theme.font.serif,
      '--font-sans': theme.font.sans,
  } as React.CSSProperties;

  const activeGeneration = useMemo(() => Object.values(generationStatuses)[0], [generationStatuses]);

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--color-background)] overflow-hidden" style={appStyles}>
      <header className="flex-none h-16 border-b border-[var(--color-border-color)] flex items-center justify-between px-6 z-40 bg-[var(--color-background)]">
          <Logo className="h-7 w-auto text-[var(--color-primary-text)]" />
          <div className="flex items-center gap-3">
              {activeTab === 'library' && library.length > 0 && (
                  <button onClick={() => { setViewMode(v => v === 'grid' ? 'list' : 'grid'); localStorage.setItem('zizhi-view-mode', viewMode === 'grid' ? 'list' : 'grid'); }} className="p-2 text-[var(--color-secondary-text)] hover:bg-black/5 rounded-full">
                      {viewMode === 'grid' ? <IconLayoutList className="w-5 h-5" /> : <IconLayoutGrid className="w-5 h-5" />}
                  </button>
              )}
              {isSyncing && <IconSpinner className="w-4 h-4 text-[var(--color-primary)]" />}
          </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
          <div className="max-w-7xl mx-auto h-full text-[var(--color-primary-text)]">
            {activeTab === 'library' && (
                <Library books={library} onBookSelect={(id) => setSelectedBook(library.find(b => b.id === id) || null)} isLoading={isUploading} error={null} onDelete={handleDeleteBook} onGenerateSummary={handleGenerateSummary} generationStatuses={generationStatuses} onViewSummary={(id) => { setSummaryBook(library.find(b => b.id === id) || null); setShowGenerationOverlay(false); }} viewMode={viewMode} />
            )}
            {activeTab === 'quotes' && <QuotesView theme={theme} quotes={quotes} onDelete={handleDeleteQuote} onGoToQuote={(q) => setSelectedBook(library.find(b => b.id === q.bookId) || null)} />}
            {activeTab === 'profile' && <ProfileView user={user} streak={streak} library={library} onShowAuth={() => setShowAuth(true)} activity={activity} />}
            {activeTab === 'settings' && <SettingsView currentTheme={theme} onThemeChange={(t) => { setTheme(t); localStorage.setItem('zizhi-theme', JSON.stringify(t)); }} themes={THEMES} fonts={FONTS} textures={{}} />}
          </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[var(--color-background)] border-t border-[var(--color-border-color)] z-40 flex items-center justify-around px-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <NavItem tab="library" icon={IconLibrary} label="LIBRARY" />
          <NavItem tab="quotes" icon={IconQuote} label="QUOTES" />
          <div className="relative -top-8 flex flex-col items-center">
              <input type="file" ref={fileInputRef} onChange={async (e) => { 
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploading(true);
                try {
                    const newBook = await parseEpub(file);
                    newBook.lastOpened = Date.now();
                    await db.saveBook(newBook);
                    setLibrary(prev => [newBook, ...prev]);
                    setToast({ message: `"${newBook.title}" synchronized.` });
                } catch (err) { setToast({ message: "Parse failure." }); } 
                finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
              }} accept=".epub" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-16 h-16 bg-[var(--color-primary)] text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all duration-300 transform"><IconUpload className="w-7 h-7" /></button>
          </div>
          <NavItem tab="profile" icon={IconUser} label="JOURNEY" />
          <NavItem tab="settings" icon={IconSettings} label="CONFIG" />
      </nav>

      {showGenerationOverlay && activeGeneration && (
          <div className="fixed inset-0 z-[300] bg-black text-white flex flex-col items-center justify-center p-8 animate-fade-in">
              <button onClick={() => setShowGenerationOverlay(false)} className="absolute top-8 right-8 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                <IconClose className="w-6 h-6" />
              </button>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
              <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
                  <div className="mb-12 relative">
                      <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center">
                          <IconMicrophone className="w-10 h-10 text-indigo-400 animate-pulse" />
                      </div>
                      <div className="absolute inset-0 w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h2 className="text-3xl font-black theme-serif italic mb-4 leading-tight">Masterclass Synthesis</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 mb-12">Step {activeGeneration.stage === 'text' ? '1/2' : '2/2'}</p>
                  <div className="w-full space-y-4">
                      <p className="text-lg font-medium opacity-80 min-h-[3.5rem]">{activeGeneration.currentAction}</p>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${activeGeneration.progress}%` }} />
                      </div>
                  </div>
              </div>
          </div>
      )}

      {selectedBook && <ReaderView book={selectedBook} theme={theme} initialChapterId={targetChapterId} onClose={() => setSelectedBook(null)} onUpdateProgress={handleUpdateProgress} onSaveQuote={handleSaveQuote} onSearch={setSearchQuery} />}
      {summaryBook && <SummaryView book={summaryBook} onClose={() => setSummaryBook(null)} />}
      {searchQuery && <SearchSidebar query={searchQuery} onClose={() => setSearchQuery(null)} />}
      {showAuth && <AuthView onClose={() => setShowAuth(false)} onLogin={(u) => { setUser(u); }} />}
      {toast && <Toast message={toast.message} action={toast.action} onClose={() => setToast(null)} />}
    </div>
  );
};
export default App;