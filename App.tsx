
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MantineProvider, createTheme, Box, Stack, Group, Text, ActionIcon, Tooltip } from '@mantine/core';
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
    Logo, IconSettings, IconUser, IconLibrary, IconQuote, IconUpload, IconLayoutGrid, IconLayoutList, IconSpinner
} from './components/icons';
import * as db from './db';
import { supabase } from './supabase';
import type { Book, Quote, Theme, ThemeFont, GenerationStatus, ReadingActivity } from './types';
import { parseEpub } from './epubParser';
import { GoogleGenAI, Modality } from "@google/genai";

const mantineTheme = createTheme({
  primaryColor: 'cyan',
  fontFamily: 'Inter, sans-serif',
  headings: { fontFamily: 'Inter, sans-serif', fontWeight: '900' },
});

const FONTS: ThemeFont[] = [
    { name: 'Serif', sans: 'Inter', serif: 'Lora' },
    { name: 'Sans', sans: 'Inter', serif: 'Inter' },
    { name: 'Mono', sans: 'JetBrains Mono', serif: 'JetBrains Mono' }
];

export const THEMES: { [key: string]: Theme } = {
    light: {
        id: 'light', name: 'Light',
        colors: {
            'primary': '#00d1ff', 'secondary': '#ff007a', 'background': '#fdfdfd',
            'surface': '#ffffff', 'primary-text': '#000000', 'secondary-text': '#4a4a4a', 
            'muted-text': '#666666', 'border-color': '#000000'
        },
        font: FONTS[1], fontSize: 1.1, lineHeight: 1.6, texture: 'none', readingMode: 'scroll'
    },
    cyber: {
        id: 'cyber', name: 'Bright',
        colors: {
            'primary': '#f0ff00', 'secondary': '#00ff85', 'background': '#ffffff',
            'surface': '#f9f9f9', 'primary-text': '#111111', 'secondary-text': '#333333', 
            'muted-text': '#555555', 'border-color': '#111111'
        },
        font: FONTS[0], fontSize: 1.1, lineHeight: 1.6, texture: 'none', readingMode: 'scroll'
    },
    monolith: {
        id: 'monolith', name: 'Dark',
        colors: {
            'primary': '#0080ff', 'secondary': '#ffffff', 'background': '#000000',
            'surface': '#0a0a0a', 'primary-text': '#ffffff', 'secondary-text': '#d1d1d1', 
            'muted-text': '#a1a1aa', 'border-color': '#333333'
        },
        font: FONTS[0], fontSize: 1.1, lineHeight: 1.6, texture: 'none', readingMode: 'scroll'
    },
    sepia: {
        id: 'sepia', name: 'Paper',
        colors: {
            'primary': '#78350f', 'secondary': '#451a03', 'background': '#fdf6e3',
            'surface': '#f5efdc', 'primary-text': '#451a03', 'secondary-text': '#5d3d2a', 
            'muted-text': '#7a5a4a', 'border-color': '#451a03'
        },
        font: FONTS[0], fontSize: 1.1, lineHeight: 1.8, texture: 'none', readingMode: 'scroll'
    }
};

const App: React.FC = () => {
  const [library, setLibrary] = useState<Book[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'quotes' | 'profile' | 'settings'>('library');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); 
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [summaryBook, setSummaryBook] = useState<Book | null>(null);
  const [toast, setToast] = useState<{ message: string; action?: { label: string; onClick: () => void } } | null>(null);
  const [theme, setTheme] = useState<Theme>(THEMES.light);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [generationStatuses, setGenerationStatuses] = useState<Record<string, GenerationStatus>>({});
  const [activity, setActivity] = useState<ReadingActivity[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    try {
      const [localBooks, localQuotes, localActivity] = await Promise.all([
          db.getBooks(), db.getQuotes(), db.getActivity()
      ]);
      setLibrary(localBooks);
      setQuotes(localQuotes);
      setActivity(localActivity);
      
      const { data } = await supabase.auth.getUser();
      if (data.user) setUser(data.user);
    } catch (e) {
      console.error("Failed to load local data", e);
    }
  }, []);

  useEffect(() => { 
    loadData(); 
    const savedTheme = localStorage.getItem('zizhi-theme');
    if (savedTheme) { try { setTheme(JSON.parse(savedTheme)); } catch(e) {} }
  }, [loadData]);

  const sortedLibrary = useMemo(() => {
    return [...library].sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0));
  }, [library]);

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
        const newBook = await parseEpub(file);
        newBook.lastOpened = Date.now();
        await db.saveBook(newBook);
        setLibrary(prev => [newBook, ...prev]);
        setToast({ message: `Uploaded: ${newBook.title}` });
    } catch (err) {
        setToast({ message: "Upload failed." });
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerateSummary = async (bookId: string) => {
    const book = library.find(b => b.id === bookId);
    if (!book) return;

    setGenerationStatuses(prev => ({ ...prev, [bookId]: { stage: 'analyzing', progress: 0.2, currentAction: 'Reading book...' } }));

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const scriptResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Summarize "${book.title}" by ${book.author}. Focus on the core message.`,
        });

        const script = scriptResponse.text;
        setGenerationStatuses(prev => ({ ...prev, [bookId]: { stage: 'synthesizing', progress: 0.6, currentAction: 'Generating audio...' } }));

        const ttsResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: script }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
            },
        });

        const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("Audio generation failed");

        const audioUrl = `data:audio/pcm;base64,${base64Audio}`;
        const updatedBook = { ...book, summaryScript: script, audioSummaryUrl: audioUrl };
        await db.saveBook(updatedBook);
        setLibrary(prev => prev.map(b => b.id === bookId ? updatedBook : b));
        setToast({ message: "Summary generated!" });
    } catch (err) {
        setToast({ message: "Failed to summarize." });
    } finally {
        setGenerationStatuses(prev => {
            const next = { ...prev };
            delete next[bookId];
            return next;
        });
    }
  };

  const NavItem = ({ tab, icon: Icon, label, desktopLabel }: { tab: typeof activeTab; icon: any; label: string; desktopLabel?: string }) => {
    const isActive = activeTab === tab;
    return (
        <Stack gap={4} align="center" className={`cursor-pointer transition-all duration-200 group w-full md:w-auto ${isActive ? 'text-[var(--color-primary-text)]' : 'text-[var(--color-muted-text)] hover:text-[var(--color-primary-text)]'}`} onClick={() => setActiveTab(tab)}>
            <Box className={`relative flex items-center justify-center w-10 h-10 md:w-full md:px-6 md:py-6 transition-all border-2 ${isActive ? 'bg-[var(--color-primary)] border-[var(--color-border-color)] md:translate-x-1 shadow-[4px_4px_0px_var(--color-border-color)]' : 'border-transparent'}`} style={{ borderRadius: '0px' }}>
                <Group gap="md" wrap="nowrap" className="w-full justify-center md:justify-start">
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    {desktopLabel && <Text className="hidden md:block text-[13px] font-black uppercase tracking-widest">{desktopLabel}</Text>}
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
      '--font-sans': theme.font.sans,
  } as React.CSSProperties;

  return (
    <MantineProvider theme={mantineTheme} defaultColorScheme={theme.colors.background === '#000000' ? 'dark' : 'light'}>
      <Box style={appStyles} className="relative h-[100dvh] w-full overflow-hidden transition-colors duration-300 flex flex-col md:flex-row" bg="var(--color-background)">
        
        {/* Sidebar (Desktop/Tablet) */}
        <aside className="hidden md:flex w-64 lg:w-72 bg-[var(--color-surface)] border-r-4 border-[var(--color-border-color)] flex-col z-[150] shadow-[4px_0_0_rgba(0,0,0,0.02)]">
            <div className="p-8 border-b-4 border-[var(--color-border-color)]">
                <Logo className="h-6 w-auto text-[var(--color-primary-text)]" />
            </div>
            <nav className="flex-1 p-6 space-y-4">
                <NavItem tab="library" icon={IconLibrary} label="Library" desktopLabel="Library" />
                <NavItem tab="quotes" icon={IconQuote} label="Quotes" desktopLabel="Quotes" />
                <NavItem tab="profile" icon={IconUser} label="Profile" desktopLabel="Profile" />
                <NavItem tab="settings" icon={IconSettings} label="Settings" desktopLabel="Settings" />
            </nav>
            <div className="p-8 border-t-2 border-[var(--color-border-color)] opacity-50">
                <Text className="text-[10px] font-black uppercase tracking-tighter">Zizhi Reader v4.2</Text>
            </div>
        </aside>

        <Box className="flex-1 flex flex-col h-full overflow-hidden relative">
            <header className="h-16 md:h-20 bg-[var(--color-surface)] z-[100] px-8 flex items-center justify-between border-b-4 border-[var(--color-border-color)]">
                <div className="md:hidden">
                    <Logo className="h-4 w-auto text-[var(--color-primary-text)]" />
                </div>
                <div className="hidden md:flex items-center gap-10">
                   <Text className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted-text)]">Status: Active</Text>
                   <Text className="text-[10px] font-black uppercase tracking-widest text-pink-500">Streak: {streak} Days</Text>
                </div>
                <Group gap="sm">
                    <ActionIcon 
                      variant="subtle" 
                      color="gray" 
                      size="lg" 
                      onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} 
                      className="border-2 border-[var(--color-border-color)] rounded-none shadow-[2px_2px_0_var(--color-border-color)] bg-[var(--color-surface)]"
                      title={viewMode === 'grid' ? "List View" : "Grid View"}
                    >
                        {viewMode === 'grid' ? <IconLayoutList className="w-5 h-5 text-black" /> : <IconLayoutGrid className="w-5 h-5 text-black" />}
                    </ActionIcon>
                    {/* Extra profile icons removed as requested */}
                </Group>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar pb-32 md:pb-12">
                <Box className="max-w-7xl mx-auto px-6 py-6 h-full">
                    {activeTab === 'library' && (
                        <Library 
                            books={sortedLibrary} theme={theme}
                            onBookSelect={(id) => setSelectedBook(library.find(b => b.id === id) || null)} 
                            isLoading={isUploading} 
                            error={null} 
                            onDelete={async (id) => { 
                                if(window.confirm("Delete this book? This action cannot be undone.")) { 
                                    await db.deleteBook(id); 
                                    setLibrary(prev => prev.filter(b => b.id !== id)); 
                                } 
                            }} 
                            onGenerateSummary={handleGenerateSummary} 
                            generationStatuses={generationStatuses} 
                            onViewSummary={(id) => setSummaryBook(library.find(b => b.id === id) || null)} 
                            viewMode={viewMode} 
                        />
                    )}
                    {activeTab === 'quotes' && <QuotesView theme={theme} quotes={quotes} library={library} onDelete={(id) => { db.deleteQuote(id).then(() => setQuotes(prev => prev.filter(q => q.id !== id))); }} onGoToQuote={(q) => setSelectedBook(library.find(b => b.id === q.bookId) || null)} />}
                    {activeTab === 'profile' && <ProfileView user={user} streak={streak} library={library} onShowAuth={() => setShowAuth(true)} activity={activity} onSignOut={async () => { await supabase.auth.signOut(); setUser(null); }} />}
                    {activeTab === 'settings' && <SettingsView currentTheme={theme} onThemeChange={(t) => { setTheme(t); localStorage.setItem('zizhi-theme', JSON.stringify(t)); }} themes={THEMES} fonts={FONTS} textures={{}} />}
                </Box>
            </main>

            {/* Desktop FAB (Tablet/Laptop/Desktop) */}
            <Box className="hidden md:block fixed bottom-12 right-12 z-[250]">
                <input type="file" ref={fileInputRef} onChange={handleUpload} accept=".epub" className="hidden" />
                <Tooltip label="Upload Book" position="left" withArrow color="black" offset={15}>
                    <ActionIcon size={80} className="bg-yellow-400 border-4 border-black shadow-[8px_8px_0_black] hover:translate-y-[-2px] hover:shadow-[10px_10px_0_black] active:translate-y-[2px] active:shadow-none transition-all rounded-none" onClick={() => fileInputRef.current?.click()}>
                        {isUploading ? <IconSpinner className="w-10 h-10 text-black" /> : <IconUpload className="w-10 h-10 text-black" />}
                    </ActionIcon>
                </Tooltip>
            </Box>
        </Box>

        {/* Mobile Navigation (Bottom Nav) - Preserved as "Perfect" Mobile Version */}
        <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] h-20 flex items-center justify-around z-[200] border-t-4 border-[var(--color-border-color)] md:hidden">
            <NavItem tab="library" icon={IconLibrary} label="Library" />
            <NavItem tab="quotes" icon={IconQuote} label="Quotes" />
            
            <Box className="relative -top-6">
                <input type="file" ref={fileInputRef} onChange={handleUpload} accept=".epub" className="hidden" />
                <ActionIcon size={72} className="bg-yellow-400 border-4 border-black shadow-[6px_6px_0_black] rounded-none" onClick={() => fileInputRef.current?.click()}>
                    {isUploading ? <IconSpinner className="w-8 h-8 text-black" /> : <IconUpload className="w-8 h-8 text-black" />}
                </ActionIcon>
            </Box>

            <NavItem tab="profile" icon={IconUser} label="Profile" />
            <NavItem tab="settings" icon={IconSettings} label="Settings" />
        </nav>

        {selectedBook && (
            <ReaderView 
                book={selectedBook} theme={theme} onClose={() => setSelectedBook(null)} 
                onUpdateProgress={async (bid, ci, st, ts, gp) => {
                    const bidx = library.findIndex(b => b.id === bid);
                    if (bidx === -1) return;
                    const updated = { ...library[bidx], progress: gp, lastScrollTop: st, readingTime: (library[bidx].readingTime || 0) + ts, lastOpened: Date.now() };
                    await db.saveBook(updated); 
                    setLibrary(prev => prev.map(b => b.id === bid ? updated : b));
                    await db.logActivity(ts);
                }} 
                onSaveQuote={async (t, c) => {
                    const nq: Quote = { id: crypto.randomUUID(), text: t, bookTitle: selectedBook.title, author: selectedBook.author, bookId: selectedBook.id, location: c, createdAt: Date.now() };
                    await db.saveQuote(nq); setQuotes(prev => [nq, ...prev]); setToast({ message: "Quote saved." });
                }} 
                onSearch={(q) => { setSearchQuery(q); setToast({ message: `Searching: ${q}` }); }} 
            />
        )}
        
        {summaryBook && <SummaryView book={summaryBook} onClose={() => setSummaryBook(null)} />}
        {searchQuery && <SearchSidebar query={searchQuery} onClose={() => setSearchQuery(null)} />}
        {showAuth && <AuthView onClose={() => setShowAuth(false)} onLogin={(u) => setUser(u)} />}
        {toast && <Toast message={toast.message} action={toast.action} onClose={() => setToast(null)} />}
      </Box>
    </MantineProvider>
  );
};

export default App;
