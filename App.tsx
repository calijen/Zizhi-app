
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MantineProvider, createTheme, Box, Stack, Group, Text, ActionIcon } from '@mantine/core';
import Library from './components/FileUpload';
import QuotesView from './components/QuotesView';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';
import ReaderView from './components/ReaderView';
import SummaryView from './components/TrailerView';
import ProfileView from './components/ProfileView';
import LandingView from './components/LandingView';
import Toast from './components/Toast';
import { Logo, IconSettings, IconUser, IconLibrary, IconQuote, IconUpload, IconLayoutGrid, IconLayoutList, IconSpinner } from './components/icons';
import * as db from './db';
import { supabase } from './supabase';
import type { Book, Quote, Theme, ThemeFont, GenerationStatus } from './types';
import { parseEpub } from './epubParser';
import { GoogleGenAI, Modality } from "@google/genai";

const mantineTheme = createTheme({
  primaryColor: 'cyan',
  fontFamily: 'Inter, sans-serif',
  headings: { fontFamily: 'Inter, sans-serif', fontWeight: '900' },
});

const FONTS: ThemeFont[] = [
    { name: 'Print Serif', sans: 'Inter', serif: 'EB Garamond' },
    { name: 'Modern Serif', sans: 'Inter', serif: 'Lora' },
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

const App: React.FC = () => {
  const [library, setLibrary] = useState<Book[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [hasEntered, setHasEntered] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'library' | 'quotes' | 'profile' | 'settings'>('library');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [summaryBook, setSummaryBook] = useState<Book | null>(null);
  const [toast, setToast] = useState<{ message: string; action?: { label: string; onClick: () => void } } | null>(null);
  const [theme, setTheme] = useState<Theme>(ATMOSPHERES.warm);
  const [isUploading, setIsUploading] = useState(false);
  const [generationStatuses, setGenerationStatuses] = useState<Record<string, GenerationStatus>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    try {
      const [localBooks, localQuotes] = await Promise.all([db.getBooks(), db.getQuotes()]);
      setLibrary(localBooks); 
      setQuotes(localQuotes);
      
      const savedHasEntered = localStorage.getItem('zizhi-entered');
      if (localBooks.length > 0 || savedHasEntered === 'true') {
        setHasEntered(true);
      } else {
        setHasEntered(false);
      }

      const { data } = await supabase.auth.getUser();
      if (data.user) setUser(data.user);
    } catch (e) { console.error("Load failed", e); }
  }, []);

  useEffect(() => { 
    loadData(); 
    const savedTheme = localStorage.getItem('zizhi-theme'); 
    if (savedTheme) { try { setTheme(JSON.parse(savedTheme)); } catch(e) {} } 
  }, [loadData]);
  
  const sortedLibrary = useMemo(() => [...library].sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0)), [library]);

  const handleEnterApp = () => {
    setHasEntered(true);
    localStorage.setItem('zizhi-entered', 'true');
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsUploading(true);
    try {
        const newBook = await parseEpub(file); newBook.lastOpened = Date.now();
        await db.saveBook(newBook); setLibrary(prev => [newBook, ...prev]);
        setToast({ message: "Book added to your library." });
    } catch (err) { setToast({ message: "EPUB parsing failed." }); } finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleGenerateSummary = async (bookId: string) => {
    const book = library.find(b => b.id === bookId); if (!book) return;
    setGenerationStatuses(prev => ({ ...prev, [bookId]: { stage: 'Checking', progress: 0.1, currentAction: 'Authenticating...' } }));
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        setGenerationStatuses(prev => ({ ...prev, [bookId]: { stage: 'Thinking', progress: 0.2, currentAction: 'Distilling content...' } }));

        const summaryPrompt = `Synthesize a focused audio summary of the book "${book.title}" by ${book.author}. 
        Write a continuous narrative script (no headers or markdown). 800 words approx. Clear, insightful, human tone.`;

        const scriptRes = await ai.models.generateContent({ 
            model: 'gemini-3-flash-preview', 
            contents: summaryPrompt 
        });
        const script = scriptRes.text || "";
        
        if (!script) throw new Error("Distillation failed: No script generated.");

        setGenerationStatuses(prev => ({ ...prev, [bookId]: { stage: 'Talking', progress: 0.6, currentAction: 'Generating voice...' } }));
        
        const ttsRes = await ai.models.generateContent({ 
            model: "gemini-2.5-flash-preview-tts", 
            contents: [{ parts: [{ text: script }] }], 
            config: { 
                responseModalities: [Modality.AUDIO], 
                speechConfig: { 
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
                } 
            } 
        });
        
        const base64Audio = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("Synthesis failed: Audio data empty.");
        
        const updatedBook = { ...book, summaryScript: script, audioSummaryUrl: `data:audio/pcm;base64,${base64Audio}` };
        await db.saveBook(updatedBook); 
        setLibrary(prev => prev.map(b => b.id === bookId ? updatedBook : b));
        setToast({ message: "Insight generated successfully." });
    } catch (err: any) { 
        console.error("Summary error:", err);
        setToast({ message: `AI Service Error: ${err.message || 'Check your internet connection and try again.'}` }); 
    } finally { 
        setGenerationStatuses(prev => { const next = { ...prev }; delete next[bookId]; return next; }); 
    }
  };

  const NavItem = ({ tab, icon: Icon, label }: { tab: typeof activeTab; icon: any; label: string }) => {
    const isActive = activeTab === tab;
    return (
        <Stack gap={4} align="center" className={`cursor-pointer transition-all duration-200 group w-full md:w-auto ${isActive ? 'text-[var(--color-primary-text)]' : 'text-[var(--color-muted-text)] hover:text-[var(--color-primary-text)]'}`} onClick={() => setActiveTab(tab)}>
            <Box className={`relative flex items-center justify-center w-10 h-10 md:w-full md:px-6 md:py-6 transition-all border-2 ${isActive ? 'bg-[var(--color-primary)] border-black md:translate-x-1 shadow-[4px_4px_0px_black]' : 'border-transparent'}`}>
                <Group gap="md" wrap="nowrap" className="w-full justify-center md:justify-start">
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-white' : ''}`} />
                    <Text className={`hidden md:block text-[13px] font-black uppercase tracking-widest ${isActive ? 'text-white' : ''}`}>{label}</Text>
                </Group>
            </Box>
            <Text className="md:hidden text-[10px] font-black uppercase tracking-widest">{label}</Text>
        </Stack>
    );
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

  if (hasEntered === null) return null;

  return (
    <MantineProvider theme={mantineTheme} defaultColorScheme={theme.id === 'nocturne' ? 'dark' : 'light'}>
      {!hasEntered ? (
        <LandingView onEnter={handleEnterApp} />
      ) : (
        <Box style={appStyles} className="relative h-[100dvh] w-full overflow-hidden transition-colors duration-300 flex flex-col md:flex-row text-[var(--color-primary-text)]" bg="var(--color-background)">
          <aside className="hidden md:flex w-64 lg:w-72 bg-[var(--color-surface)] border-r-4 border-black flex-col z-[150]">
              <div className="p-8 border-b-4 border-black"><Logo className="h-6 w-auto text-[var(--color-primary-text)]" /></div>
              <nav className="flex-1 p-6 space-y-4">
                  <NavItem tab="library" icon={IconLibrary} label="Library" />
                  <NavItem tab="quotes" icon={IconQuote} label="Quotes" />
                  <NavItem tab="profile" icon={IconUser} label="Profile" />
                  <NavItem tab="settings" icon={IconSettings} label="Settings" />
              </nav>
              <div className="p-8 border-t-2 border-black opacity-30"><Text className="text-[10px] font-black uppercase text-[var(--color-primary-text)]">Zizhi v4.2</Text></div>
          </aside>
          <Box className="flex-1 flex flex-col h-full overflow-hidden relative">
              <header className="h-16 md:h-20 bg-red-500 z-[100] px-8 flex items-center justify-between border-b-4 border-black">
                  <div className="md:hidden"><Logo className="h-4 w-auto text-[var(--color-primary-text)]" /></div>
                  <div className="hidden md:flex items-center gap-10">
                      <Text className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted-text)]">Theme: {theme.name} v5.0</Text>
                      {user && <Box className="bg-cyan-400 px-3 py-1 border-2 border-black shadow-[2px_2px_0_black]"><Text className="text-[9px] font-black uppercase text-black">Cloud Sync Active</Text></Box>}
                  </div>
                  <ActionIcon variant="subtle" color="gray" size="lg" onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} className="border-2 border-black shadow-[2px_2px_0_black] bg-[var(--color-background)]">
                      {viewMode === 'grid' ? <IconLayoutList className="w-5 h-5 text-[var(--color-primary-text)]" /> : <IconLayoutGrid className="w-5 h-5 text-[var(--color-primary-text)]" />}
                  </ActionIcon>
              </header>
              <main className="flex-1 overflow-y-auto no-scrollbar pb-64 md:pb-24">
                  <Box className="max-w-7xl mx-auto px-6 py-6 h-full">
                      {activeTab === 'library' && <Library books={sortedLibrary} theme={theme} onBookSelect={(id) => setSelectedBook(library.find(b => b.id === id) || null)} isLoading={isUploading} error={null} onDelete={async (id) => { if(window.confirm("Delete book?")) { await db.deleteBook(id); setLibrary(prev => prev.filter(b => b.id !== id)); } }} onGenerateSummary={handleGenerateSummary} generationStatuses={generationStatuses} onViewSummary={(id) => setSummaryBook(library.find(b => b.id === id) || null)} viewMode={viewMode} />}
                      {activeTab === 'quotes' && <QuotesView theme={theme} quotes={quotes} library={library} onDelete={(id) => { db.deleteQuote(id).then(() => setQuotes(prev => prev.filter(q => q.id !== id))); }} onGoToQuote={(q) => setSelectedBook(library.find(b => b.id === q.bookId) || null)} />}
                      {activeTab === 'profile' && <ProfileView user={user} streak={0} library={library} onShowAuth={() => setShowAuth(true)} activity={[]} onSignOut={async () => { await supabase.auth.signOut(); setUser(null); }} />}
                      {activeTab === 'settings' && <SettingsView currentTheme={theme} onThemeChange={(t) => { setTheme(t); localStorage.setItem('zizhi-theme', JSON.stringify(t)); }} themes={ATMOSPHERES} fonts={FONTS} textures={{}} />}
                  </Box>
              </main>
              <Box className="hidden md:block fixed bottom-12 right-12 z-[250]"><input type="file" ref={fileInputRef} onChange={handleUpload} accept=".epub" className="hidden" /><ActionIcon size={80} className="bg-yellow-400 border-4 border-black shadow-[8px_8px_0_black] hover:translate-y-[-2px] transition-all rounded-none" onClick={() => fileInputRef.current?.click()}>{isUploading ? <IconSpinner className="w-10 h-10 text-black" /> : <IconUpload className="w-10 h-10 text-black" />}</ActionIcon></Box>
          </Box>
          <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] h-20 flex items-center justify-around z-[200] border-t-4 border-black md:hidden">
              <NavItem tab="library" icon={IconLibrary} label="Library" /><NavItem tab="quotes" icon={IconQuote} label="Quotes" />
              <Box className="relative -top-6"><input type="file" ref={fileInputRef} onChange={handleUpload} accept=".epub" className="hidden" /><ActionIcon size={72} className="bg-yellow-400 border-4 border-black shadow-[6px_6px_0_black] rounded-none" onClick={() => fileInputRef.current?.click()}>{isUploading ? <IconSpinner className="w-8 h-8 text-black" /> : <IconUpload className="w-8 h-8 text-black" />}</ActionIcon></Box>
              <NavItem tab="profile" icon={IconUser} label="Profile" /><NavItem tab="settings" icon={IconSettings} label="Settings" />
          </nav>
          {selectedBook && <ReaderView book={selectedBook} theme={theme} onClose={() => setSelectedBook(null)} onUpdateProgress={async (bid, ci, st, ts, gp) => { const bidx = library.findIndex(b => b.id === bid); if (bidx === -1) return; const updated = { ...library[bidx], progress: gp, lastScrollTop: st, readingTime: (library[bidx].readingTime || 0) + ts, lastOpened: Date.now() }; await db.saveBook(updated); setLibrary(prev => prev.map(b => b.id === bid ? updated : b)); }} onSaveQuote={async (t, c) => { const nq: Quote = { id: crypto.randomUUID(), text: t, bookTitle: selectedBook.title, author: selectedBook.author, bookId: selectedBook.id, location: c, createdAt: Date.now() }; await db.saveQuote(nq); setQuotes(prev => [nq, ...prev]); setToast({ message: "Quote archived." }); }} onSearch={() => {}} />}
          {summaryBook && <SummaryView book={summaryBook} onClose={() => setSummaryBook(null)} />}
          {showAuth && <AuthView onClose={() => setShowAuth(false)} onLogin={(u) => setUser(u)} />}
          {toast && <Toast message={toast.message} action={toast.action} onClose={() => setToast(null)} />}
        </Box>
      )}
    </MantineProvider>
  );
};

export default App;
