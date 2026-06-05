
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Box, Group, Stack, Text, ActionIcon, ScrollArea, Transition, Loader, Center } from '@mantine/core';
import type { Book, Chapter, Theme, Quote, Note } from '../types';
import { IconChevronLeft, IconMenu, IconClose, IconPlus, IconMinus, IconSettings } from './icons';
import TextSelectionPopup from './TextSelectionPopup';
import PdfPage from './PdfPage';
import ShareDialog from './ShareDialog';

declare const pdfjsLib: any;

interface ReaderViewProps {
    book: Book;
    theme: Theme;
    quotes: Quote[];
    notes: Note[];
    initialChapterId?: string | null;
    initialSearchText?: string | null;
    onClose: () => void;
    onUpdateProgress: (bookId: string, chapterIndex: number, scrollTop: number, timeSpent: number, granularProgress: number) => void;
    onSaveQuote: (text: string, chapterId: string) => void;
    onSaveNote: (text: string, note: string, chapterId: string) => void;
    onSearch: (query: string) => void;
    onFontSizeChange?: (newSize: number) => void;
    onThemeChange?: (newTheme: Theme) => void;
}

const ChapterContent = memo(({ html, id, className }: { html: string, id: string, className: string }) => (
    <div dangerouslySetInnerHTML={{ __html: html }} className={className} />
));

const FONTS_INLINE = [
    { name: 'Print Serif', sans: 'Inter', serif: 'Gentium Book Plus' },
    { name: 'Modern Serif', sans: 'Inter', serif: 'Gentium Book Plus' },
    { name: 'Clean Sans', sans: 'Inter', serif: 'Inter' }
];

const ATMOSPHERES_INLINE = [
    {
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
        font: FONTS_INLINE[0], fontSize: 1.3, lineHeight: 1.6, texture: 'paper', readingMode: 'scroll' as const
    },
    {
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
        font: FONTS_INLINE[0], fontSize: 1.2, lineHeight: 1.9, texture: 'none', readingMode: 'scroll' as const
    },
    {
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
        font: FONTS_INLINE[2], fontSize: 1.15, lineHeight: 1.7, texture: 'none', readingMode: 'scroll' as const
    }
];

const ReaderView: React.FC<ReaderViewProps> = ({ book, theme, quotes, notes, initialChapterId, initialSearchText, onClose, onUpdateProgress, onSaveQuote, onSaveNote, onSearch, onFontSizeChange, onThemeChange }) => {
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const [showReaderSettings, setShowReaderSettings] = useState(false);
    const [showToc, setShowToc] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'chapters' | 'highlights'>('chapters');
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1280);
    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(window.innerWidth >= 1280);
    const [selection, setSelection] = useState<{ text: string, rect: DOMRect } | null>(null);
    const [noteInput, setNoteInput] = useState<{ text: string } | null>(null);
    const [noteValue, setNoteValue] = useState('');
    const [showShareDialog, setShowShareDialog] = useState<string | null>(null);
    const [scrollProgress, setScrollProgress] = useState(book.progress || 0);
    const [isInitialScrollDone, setIsInitialScrollDone] = useState(false);
    const [pdfDocument, setPdfDocument] = useState<any>(null);
    const [isPdfLoading, setIsPdfLoading] = useState(book.isPdf);
    const [pdfScale, setPdfScale] = useState(window.innerWidth < 768 ? 1.5 : 2.0);
    
    const [ephemeralFontSize, setEphemeralFontSize] = useState<number | null>(null);
    
    const scrollViewportRef = useRef<HTMLDivElement>(null);
    const lastUpdateRef = useRef<number>(Date.now());
    const touchStartDistRef = useRef<number | null>(null);
    const initialTouchFontSizeRef = useRef<number>(theme.fontSize);

    useEffect(() => {
        if (book.isPdf && book.pdfData && typeof pdfjsLib !== 'undefined') {
            setIsPdfLoading(true);
            const loadingTask = pdfjsLib.getDocument({ 
                data: book.pdfData,
                disableAutoFetch: true,
                disableStream: true
            });
            loadingTask.promise.then((pdf: any) => {
                setPdfDocument(pdf);
                setIsPdfLoading(false);
            }).catch((err: any) => {
                console.error("Error loading PDF document:", err);
                setIsPdfLoading(false);
            });
        }
    }, [book.isPdf, book.pdfData]);

    useEffect(() => {
        const viewport = scrollViewportRef.current;
        if (!viewport) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (book.isPdf) {
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    setPdfScale(prev => Math.min(4, Math.max(0.5, prev + delta)));
                } else {
                    const delta = e.deltaY > 0 ? -0.05 : 0.05;
                    onFontSizeChange?.(Math.min(3, Math.max(0.5, theme.fontSize + delta)));
                }
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                const dist = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                touchStartDistRef.current = dist;
                initialTouchFontSizeRef.current = ephemeralFontSize ?? theme.fontSize;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2 && touchStartDistRef.current !== null) {
                e.preventDefault();
                const dist = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                
                const ratio = dist / touchStartDistRef.current;
                
                if (book.isPdf) {
                    const newScale = Math.min(4, Math.max(0.5, pdfScale * ratio));
                    setPdfScale(newScale);
                } else {
                    const newSize = Math.min(3, Math.max(0.5, initialTouchFontSizeRef.current * ratio));
                    setEphemeralFontSize(newSize);
                }
            }
        };

        const handleTouchEnd = () => {
            if (touchStartDistRef.current !== null && ephemeralFontSize !== null) {
                onFontSizeChange?.(ephemeralFontSize);
            }
            touchStartDistRef.current = null;
            setEphemeralFontSize(null);
        };

        viewport.addEventListener('wheel', handleWheel, { passive: false });
        viewport.addEventListener('touchstart', handleTouchStart, { passive: false });
        viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
        viewport.addEventListener('touchend', handleTouchEnd);
        viewport.addEventListener('touchcancel', handleTouchEnd);

        return () => {
            viewport.removeEventListener('wheel', handleWheel);
            viewport.removeEventListener('touchstart', handleTouchStart);
            viewport.removeEventListener('touchmove', handleTouchMove);
            viewport.removeEventListener('touchend', handleTouchEnd);
            viewport.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [book.isPdf, theme.fontSize, onFontSizeChange, pdfScale, ephemeralFontSize]);

    const navigateToChapter = (idx: number) => {
        const chapter = book.chapters[idx];
        const elementId = book.isPdf ? `pdf-page-${idx + 1}` : `chapter-${chapter.id.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const element = document.getElementById(elementId);
        if (element && scrollViewportRef.current) {
            const viewport = scrollViewportRef.current;
            const containerRect = viewport.getBoundingClientRect();
            const targetRect = element.getBoundingClientRect();
            const scrollOffset = targetRect.top - containerRect.top + viewport.scrollTop;
            
            // Set index immediately when navigating
            setCurrentChapterIndex(idx);
            viewport.scrollTo({ top: scrollOffset - 20, behavior: 'smooth' });
            setShowToc(false);
        }
    };

    const navigateToHighlight = useCallback((locationId: string, searchText?: string) => {
        const chapterId = book.isPdf ? `pdf-page-${parseInt(locationId.split('-').pop() || '1')}` : `chapter-${locationId.replace(/[^a-zA-Z0-9]/g, '-')}`;
        let chapterElement = document.getElementById(chapterId);
        
        if (scrollViewportRef.current) {
            let targetElement: HTMLElement | null = chapterElement;
            let foundInTarget = false;
            
            if (!book.isPdf && searchText) {
                // Try to find in target chapter first if it exists
                if (chapterElement) {
                    const elements = chapterElement.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6');
                    for (const el of Array.from(elements)) {
                        if (el.textContent?.toLowerCase().includes(searchText.toLowerCase())) {
                            targetElement = el as HTMLElement;
                            foundInTarget = true;
                            break;
                        }
                    }
                }

                // Global fallback search if not found in target chapter (handles legacy bugs)
                if (!foundInTarget) {
                    const allSections = scrollViewportRef.current.querySelectorAll('section[data-index]');
                    for (const section of Array.from(allSections)) {
                        const els = section.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6');
                        for (const el of Array.from(els)) {
                            if (el.textContent?.toLowerCase().includes(searchText.toLowerCase())) {
                                targetElement = el as HTMLElement;
                                const indexAttr = section.getAttribute('data-index');
                                if (indexAttr) setCurrentChapterIndex(parseInt(indexAttr));
                                foundInTarget = true;
                                break;
                            }
                        }
                        if (foundInTarget) break;
                    }
                }
            }
            
            if (targetElement) {
                const viewport = scrollViewportRef.current;
                const containerRect = viewport.getBoundingClientRect();
                const targetRect = targetElement.getBoundingClientRect();
                const scrollOffset = targetRect.top - containerRect.top + viewport.scrollTop;
                
                // Set index immediately when navigating
                const idx = book.chapters.findIndex(c => c.id === locationId);
                // Only set if not already set by global search
                if (!foundInTarget && idx !== -1) setCurrentChapterIndex(idx);

                viewport.scrollTo({ top: scrollOffset - 20, behavior: 'smooth' });
                setShowToc(false);
            }
        }
    }, [book.chapters, book.isPdf, scrollViewportRef]);

    // Track active chapter during scroll
    useEffect(() => {
        if (!isInitialScrollDone || !scrollViewportRef.current) return;

        const observerOptions = {
            root: scrollViewportRef.current,
            threshold: [0, 0.1, 0.5, 0.9, 1.0],
            rootMargin: '-10% 0px -70% 0px' // Focus on the top part of the viewport
        };

        const callback: IntersectionObserverCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
                    const indexAttr = entry.target.getAttribute('data-index');
                    if (indexAttr !== null) {
                        const index = parseInt(indexAttr);
                        // We check against ref or state, but here we just update state
                        // to avoid dependency loops we check if it's different
                        setCurrentChapterIndex(prev => {
                            if (prev !== index) return index;
                            return prev;
                        });
                    }
                }
            });
        };

        const observer = new IntersectionObserver(callback, observerOptions);
        const sections = scrollViewportRef.current.querySelectorAll('section[data-index]');
        sections.forEach(s => observer.observe(s));

        return () => observer.disconnect();
    }, [isInitialScrollDone, book.chapters.length, book.isPdf]);

    useEffect(() => {
        const handleResize = () => {
            const desk = window.innerWidth >= 1280;
            setIsDesktop(desk);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isInitialScrollDone && scrollViewportRef.current) {
            if (initialChapterId) {
                const timer = setTimeout(() => {
                    navigateToHighlight(initialChapterId, initialSearchText || undefined);
                    setIsInitialScrollDone(true);
                }, 800);
                return () => clearTimeout(timer);
            } else if (book.lastScrollTop > 0) {
                const scrollTimer = setTimeout(() => {
                    if (scrollViewportRef.current) {
                        scrollViewportRef.current.scrollTo({ top: book.lastScrollTop, behavior: 'auto' });
                        setIsInitialScrollDone(true);
                    }
                }, 400);
                return () => clearTimeout(scrollTimer);
            } else {
                setIsInitialScrollDone(true);
            }
        }
    }, [isInitialScrollDone, initialChapterId, initialSearchText, book.lastScrollTop, navigateToHighlight]);

    useEffect(() => {
        const handleSelection = () => {
            const sel = window.getSelection();
            if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
                const range = sel.getRangeAt(0);
                setSelection({ text: sel.toString().trim(), rect: range.getBoundingClientRect() });
            } else {
                setSelection(null);
            }
        };
        document.addEventListener('selectionchange', handleSelection);
        return () => document.removeEventListener('selectionchange', handleSelection);
    }, []);

    const handleScroll = (position: { x: number; y: number }) => {
        if (!scrollViewportRef.current) return;
        const { scrollHeight, clientHeight } = scrollViewportRef.current;
        const progress = scrollHeight > clientHeight ? position.y / (scrollHeight - clientHeight) : 0;
        setScrollProgress(progress);

        const now = Date.now();
        if (now - lastUpdateRef.current > 3000) {
            const timeSpent = Math.floor((now - lastUpdateRef.current) / 1000);
            onUpdateProgress(book.id, currentChapterIndex, position.y, timeSpent, progress);
            lastUpdateRef.current = now;
        }
    };

    const styleVariables = {
        '--font-serif': theme.font.serif,
        '--font-sans': theme.font.sans,
        '--bg-color': theme.colors.background,
        '--text-color': theme.colors['primary-text'],
        '--sec-text': theme.colors['secondary-text'],
        '--accent-color': theme.colors.primary,
        '--font-size': `${theme.fontSize}rem`,
        '--line-height': theme.lineHeight,
        '--border-color': theme.colors['border-color'],
        '--fontSize': `${ephemeralFontSize ?? theme.fontSize}rem`,
        '--para-indent': theme.id === 'warm' ? '1.5em' : '0',
        '--para-spacing': theme.id === 'quiet' ? '2.5rem' : (theme.id === 'nocturne' ? '0.8rem' : '0'),
        '--text-align': theme.id === 'quiet' ? 'left' : 'justify'
    } as React.CSSProperties;

    return (
        <Box className={`fixed inset-0 z-[1000] flex flex-col md:flex-row overflow-hidden animate-fade-in reader-atmosphere-${theme.id}`} style={{ ...styleVariables, backgroundColor: 'var(--bg-color)' }}>
            
            <Transition mounted={isDesktop && isDesktopSidebarOpen} transition="slide-right" duration={300}>
                {(styles) => (
                    <Box style={styles} className="hidden xl:flex w-80 bg-[var(--bg-color)] border-r-4 border-black flex-col h-full z-[1100]">
                        <div className="h-16 md:h-20 border-b-4 border-black flex shrink-0 items-stretch">
                            <Box 
                                className={`flex-1 flex items-center justify-center cursor-pointer border-r-4 border-black text-center transition-all ${sidebarTab === 'chapters' ? 'bg-cyan-400' : 'bg-transparent'}`}
                                onClick={() => setSidebarTab('chapters')}
                            >
                                <Text className={`text-[11px] font-black uppercase tracking-widest ${sidebarTab === 'chapters' ? 'text-black' : 'text-[var(--text-color)]'}`}>Chapters</Text>
                            </Box>
                            <Box 
                                className={`flex-1 flex items-center justify-center cursor-pointer text-center transition-all ${sidebarTab === 'highlights' ? 'bg-yellow-300' : 'bg-transparent'}`}
                                onClick={() => setSidebarTab('highlights')}
                            >
                                <Text className={`text-[11px] font-black uppercase tracking-widest ${sidebarTab === 'highlights' ? 'text-black' : 'text-[var(--text-color)]'}`}>Highlights</Text>
                            </Box>
                            <Box 
                                className="w-14 flex items-center justify-center cursor-pointer border-l-4 border-black text-center hover:bg-red-400 active:translate-y-[1px] transition-all bg-[var(--bg-color)] shrink-0"
                                onClick={() => setIsDesktopSidebarOpen(false)}
                                title="Close Sidebar"
                            >
                                <IconClose className="text-[var(--text-color)] w-5 h-5 font-black" />
                            </Box>
                        </div>
                        <ScrollArea className="flex-1 p-6">
                            {sidebarTab === 'chapters' ? (
                                <Stack gap={4}>
                                    {book.chapters.map((item, idx) => (
                                        <Box key={idx} 
                                            className={`p-5 cursor-pointer border-4 transition-all ${idx === currentChapterIndex ? 'bg-cyan-400 border-black shadow-[4px_4px_0_black] -translate-y-1' : 'bg-transparent border-transparent hover:border-black'}`}
                                            style={{ borderRadius: '0px' }}
                                            onClick={() => navigateToChapter(idx)}
                                        >
                                            <Text className="text-[11px] font-black leading-relaxed line-clamp-2" style={{ color: 'var(--text-color)' }}>{item.label}</Text>
                                        </Box>
                                    ))}
                                </Stack>
                            ) : (
                                <Stack gap="xl">
                                    {notes.length === 0 && quotes.length === 0 ? (
                                        <Center className="h-40 opacity-40">
                                            <Text className="text-[10px] font-black uppercase text-[var(--sec-text)]">No highlights yet</Text>
                                        </Center>
                                    ) : (
                                        <>
                                            {notes.map(note => (
                                                <Box 
                                                    key={note.id} 
                                                    className="border-l-4 border-yellow-300 pl-4 py-1 cursor-pointer hover:bg-black/5 transition-colors"
                                                    onClick={() => note.location && navigateToHighlight(note.location, note.text)}
                                                >
                                                    <Text className="text-[11px] font-serif italic mb-2 line-clamp-3 opacity-80">"{note.text}"</Text>
                                                    <Box className="bg-black/5 p-3 border-l-2 border-black">
                                                        <Text className="text-[10px] font-black text-[var(--text-color)]">{note.note}</Text>
                                                    </Box>
                                                </Box>
                                            ))}
                                            {quotes.map(quote => (
                                                <Box 
                                                    key={quote.id} 
                                                    className="border-l-4 border-cyan-400 pl-4 py-1 cursor-pointer hover:bg-black/5 transition-colors"
                                                    onClick={() => quote.location && navigateToHighlight(quote.location, quote.text)}
                                                >
                                                    <Text className="text-[11px] font-serif italic mb-2 line-clamp-4">"{quote.text}"</Text>
                                                </Box>
                                            ))}
                                        </>
                                    )}
                                </Stack>
                            )}
                        </ScrollArea>
                    </Box>
                )}
            </Transition>

            <Box className="flex-1 flex flex-col h-full relative">
                <header className="h-16 md:h-20 bg-[var(--bg-color)] border-b-4 border-black flex items-center justify-between px-6 md:px-8 z-[1200] shadow-[0_4px_0_rgba(0,0,0,0.05)]">
                    <ActionIcon variant="filled" color="cyan" size="lg" onClick={onClose} className="border-2 border-black rounded-none shadow-[3px_3px_0_black] bg-[var(--bg-color)]"><IconChevronLeft className="text-[var(--text-color)] w-5 h-5" /></ActionIcon>
                    
                    <Group gap="xs" className="flex items-center">
                        <Text className="text-[11px] md:text-[13px] font-black uppercase tracking-widest text-[var(--text-color)]">
                            {Math.round(scrollProgress * 100)}% Progress
                        </Text>
                        <Box className="w-16 h-2 border-2 border-black rounded-none hidden sm:block relative bg-black/5 overflow-hidden">
                            <Box className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${scrollProgress * 100}%` }} />
                        </Box>
                    </Group>

                    {book.isPdf && (
                        <Group gap={4} className="hidden sm:flex">
                            <ActionIcon 
                                variant="subtle" 
                                color="gray" 
                                onClick={() => setPdfScale(prev => Math.max(0.5, prev - 0.25))}
                                className="text-[var(--text-color)]"
                            >
                                <IconMinus size={16} />
                            </ActionIcon>
                            <Text className="text-[10px] font-black w-8 text-center">{Math.round(pdfScale * 100)}%</Text>
                            <ActionIcon 
                                variant="subtle" 
                                color="gray" 
                                onClick={() => setPdfScale(prev => Math.min(4, prev + 0.25))}
                                className="text-[var(--text-color)]"
                            >
                                <IconPlus size={16} />
                            </ActionIcon>
                        </Group>
                    )}

                    {(!isDesktop || !isDesktopSidebarOpen) ? (
                        <ActionIcon 
                            variant="filled" 
                            color="yellow" 
                            size="lg" 
                            onClick={() => {
                                if (isDesktop) {
                                    setIsDesktopSidebarOpen(true);
                                } else {
                                    setShowToc(true);
                                }
                            }} 
                            className="border-2 border-black rounded-none shadow-[3px_3px_0_black] bg-[var(--bg-color)]"
                            title="Open Sidebar"
                        >
                            <IconMenu className="text-[var(--text-color)] w-5 h-5" />
                        </ActionIcon>
                    ) : (
                        <div className="w-10"></div>
                    )}
                </header>

                <ScrollArea className={`flex-1 ${theme.texture === 'paper' ? 'printed-texture' : ''}`} viewportRef={scrollViewportRef} onScrollPositionChange={handleScroll}>
                    <Box className={`relative ${book.isPdf ? 'w-full' : 'max-w-3xl'} mx-auto min-h-screen pt-8 md:pt-16 pb-64 px-4 md:px-8 font-serif text-[var(--text-color)] overflow-x-auto`}>
                        {isPdfLoading ? (
                            <Center className="h-64 flex-col gap-4">
                                <Loader color="cyan" size="xl" />
                                <Text className="font-black uppercase tracking-widest text-[var(--sec-text)]">Initializing PDF Engine...</Text>
                            </Center>
                        ) : book.isPdf && pdfDocument ? (
                            book.chapters.map((chapter, idx) => (
                                <section key={chapter.id} id={`pdf-page-${idx + 1}`} data-index={idx} className="mb-8 last:mb-0">
                                    <PdfPage pdfDocument={pdfDocument} pageNumber={idx + 1} scale={pdfScale} />
                                </section>
                            ))
                        ) : (
                            book.chapters.map((chapter, idx) => (
                                <section key={chapter.id} id={`chapter-${chapter.id.replace(/[^a-zA-Z0-9]/g, '-')}`} data-index={idx} className="mb-24 last:mb-0">
                                    <ChapterContent html={chapter.html} id={chapter.id} className={`epub-content`} />
                                </section>
                            ))
                        )}
                    </Box>
                </ScrollArea>
                
                <Box className="md:hidden fixed bottom-0 left-0 right-0 h-1.5 bg-black/10 z-[1100]">
                    <Box className="h-full bg-cyan-400" style={{ width: `${scrollProgress * 100}%` }} />
                </Box>

                {book.isPdf && (
                    <Box className="sm:hidden fixed bottom-8 right-6 z-[1200] flex flex-col gap-3">
                        <ActionIcon 
                            size={48}
                            variant="filled" 
                            color="cyan" 
                            onClick={() => setPdfScale(prev => Math.min(4, prev + 0.5))}
                            className="border-2 border-black rounded-none shadow-[4px_4px_0_black] active:translate-x-1 active:translate-y-1 active:shadow-none"
                        >
                            <IconPlus size={24} />
                        </ActionIcon>
                        <ActionIcon 
                            size={48}
                            variant="filled" 
                            color="cyan" 
                            onClick={() => setPdfScale(prev => Math.max(0.5, prev - 0.5))}
                            className="border-2 border-black rounded-none shadow-[4px_4px_0_black] active:translate-x-1 active:translate-y-1 active:shadow-none"
                        >
                            <IconMinus size={24} />
                        </ActionIcon>
                    </Box>
                )}

                {/* Floating Settings Trigger */}
                <Box className="fixed bottom-8 left-6 md:bottom-12 md:left-12 z-[1200]">
                    <ActionIcon 
                        size={48}
                        variant="filled" 
                        color="yellow" 
                        onClick={() => setShowReaderSettings(prev => !prev)}
                        className="border-2 border-black rounded-none shadow-[4px_4px_0_black] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-yellow-400 transition-all"
                        title="Reader Settings"
                    >
                        <IconSettings className="w-5 h-5 text-black" />
                    </ActionIcon>
                </Box>
            </Box>

            {selection && (
                <TextSelectionPopup 
                    rect={selection.rect}
                    onNote={() => { setNoteInput({ text: selection.text }); setSelection(null); }}
                    onQuote={() => { onSaveQuote(selection.text, book.chapters[currentChapterIndex].id); setSelection(null); }}
                    onSearch={() => { onSearch(selection.text); setSelection(null); }}
                    onShare={() => { setShowShareDialog(selection.text); setSelection(null); }}
                />
            )}

            {noteInput && (
                <Box className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <Box className="bg-[var(--bg-color)] border-4 border-black p-8 shadow-[12px_12px_0_black] max-w-md w-full animate-pop-in">
                        <h3 className="text-xl font-black uppercase mb-4 text-[var(--text-color)]">Add Note</h3>
                        <Box className="mb-6 p-4 bg-black/5 border-l-4 border-cyan-400 italic text-sm text-[var(--sec-text)]">
                            "{noteInput.text}"
                        </Box>
                        <textarea 
                            autoFocus
                            value={noteValue}
                            onChange={(e) => setNoteValue(e.target.value)}
                            placeholder="Type your note here..."
                            className="w-full h-32 p-4 bg-[var(--bg-color)] border-2 border-black font-bold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 mb-6 text-[var(--text-color)]"
                        />
                        <Group grow gap="md">
                            <button 
                                onClick={() => { setNoteInput(null); setNoteValue(''); }}
                                className="px-6 py-3 border-2 border-black font-black uppercase text-xs hover:bg-black/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => { 
                                    onSaveNote(noteInput.text, noteValue, book.chapters[currentChapterIndex].id); 
                                    setNoteInput(null); 
                                    setNoteValue(''); 
                                }}
                                className="px-6 py-3 bg-cyan-400 border-2 border-black font-black uppercase text-xs shadow-[4px_4px_0_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                            >
                                Save Note
                            </button>
                        </Group>
                    </Box>
                </Box>
            )}

            <Transition mounted={showToc && !isDesktop} transition="slide-right" duration={300}>
                {(styles) => (
                    <Box style={styles} className="fixed inset-0 z-[1500] flex">
                        <Box className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowToc(false)} />
                        <Box className="relative w-80 bg-[var(--bg-color)] h-full border-r-4 border-black flex flex-col shadow-[8px_0_0_black]">
                            <Box className="p-4 border-b-2 border-black flex justify-between items-center">
                                <Box className="flex border-2 border-black">
                                    <button 
                                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest ${sidebarTab === 'chapters' ? 'bg-cyan-400' : ''}`}
                                        onClick={() => setSidebarTab('chapters')}
                                    >
                                        Chapters
                                    </button>
                                    <button 
                                        className={`border-l-2 border-black px-4 py-2 text-[10px] font-black uppercase tracking-widest ${sidebarTab === 'highlights' ? 'bg-yellow-300' : ''}`}
                                        onClick={() => setSidebarTab('highlights')}
                                    >
                                        Highlights
                                    </button>
                                </Box>
                                <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setShowToc(false)}><IconClose className="text-[var(--text-color)]" /></ActionIcon>
                            </Box>
                            
                            <ScrollArea className="flex-1 p-6">
                                {sidebarTab === 'chapters' ? (
                                    <Stack gap={4}>
                                        {book.chapters.map((item, idx) => (
                                            <Box key={idx} 
                                                className={`p-4 cursor-pointer border-2 transition-all ${idx === currentChapterIndex ? 'bg-cyan-400 border-black shadow-[3px_3px_0_black]' : 'border-transparent'}`}
                                                onClick={() => navigateToChapter(idx)}
                                            >
                                                <Text className="text-[11px] font-bold text-[var(--text-color)] line-clamp-2">{item.label}</Text>
                                            </Box>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Stack gap="xl">
                                        {notes.length === 0 && quotes.length === 0 ? (
                                            <Center className="h-40 opacity-40">
                                                <Text className="text-[10px] font-black uppercase text-[var(--sec-text)]">No highlights yet</Text>
                                            </Center>
                                        ) : (
                                            <>
                                                {notes.map(note => (
                                                    <Box 
                                                        key={note.id} 
                                                        className="border-l-4 border-yellow-300 pl-4 py-1 cursor-pointer hover:bg-black/5 transition-colors"
                                                        onClick={() => note.location && navigateToHighlight(note.location, note.text)}
                                                    >
                                                        <Text className="text-[11px] font-serif italic mb-2 line-clamp-3 opacity-80">"{note.text}"</Text>
                                                        <Box className="bg-black/5 p-3 border-l-2 border-black">
                                                            <Text className="text-[10px] font-black">{note.note}</Text>
                                                        </Box>
                                                    </Box>
                                                ))}
                                                {quotes.map(quote => (
                                                    <Box 
                                                        key={quote.id} 
                                                        className="border-l-4 border-cyan-400 pl-4 py-1 cursor-pointer hover:bg-black/5 transition-colors"
                                                        onClick={() => quote.location && navigateToHighlight(quote.location, quote.text)}
                                                    >
                                                        <Text className="text-[11px] font-serif italic mb-2 line-clamp-4">"{quote.text}"</Text>
                                                    </Box>
                                                ))}
                                            </>
                                        )}
                                    </Stack>
                                )}
                            </ScrollArea>
                        </Box>
                    </Box>
                )}
            </Transition>

            {showShareDialog && <ShareDialog text={showShareDialog} bookTitle={book.title} author={book.author} coverImageUrl={book.coverImageUrl} theme={theme} onClose={() => setShowShareDialog(null)} />}

            {/* Inline Reader Settings Popup */}
            {showReaderSettings && (
                <Box className="fixed bottom-20 left-6 md:bottom-28 md:left-12 z-[1400] w-[calc(100%-3rem)] sm:w-80 border-4 border-black p-5 shadow-[8px_8px_0_black] animate-pop-in" style={{ backgroundColor: 'var(--bg-color)' }}>
                    <div className="flex items-center justify-between pb-2 border-b-2 border-black mb-4">
                        <span className="font-sans uppercase tracking-wider text-[11px] font-black text-[var(--text-color)]">
                            Format Settings
                        </span>
                        <button 
                            onClick={() => setShowReaderSettings(false)} 
                            className="p-1 border border-black bg-[var(--bg-color)] shadow-[1px_1px_0_black] active:translate-y-0.5 active:shadow-none transition-all hover:bg-red-400"
                        >
                            <IconClose className="w-3.5 h-3.5 text-[var(--text-color)] font-bold pointer-events-none" />
                        </button>
                    </div>

                    {/* Presets */}
                    <div className="mb-4">
                        <label className="text-[10px] uppercase tracking-wider font-sans font-black text-[var(--sec-text)] block mb-1.5">
                            Atmosphere
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {ATMOSPHERES_INLINE.map((atm) => {
                                const isSelected = theme.id === atm.id;
                                return (
                                    <button
                                        key={atm.id}
                                        onClick={() => {
                                            if (onThemeChange) {
                                                onThemeChange({
                                                    ...theme,
                                                    id: atm.id,
                                                    colors: atm.colors,
                                                    name: atm.name,
                                                    texture: atm.texture
                                                });
                                            }
                                        }}
                                        className={`py-1.5 px-1 border-2 text-center text-[9px] font-black uppercase tracking-wider transition-all ${
                                            isSelected 
                                                ? 'bg-yellow-300 border-black shadow-[2px_2px_0_black] text-black' 
                                                : 'bg-transparent border-black/20 text-[var(--text-color)] hover:border-black'
                                        }`}
                                    >
                                        {atm.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Text Size Controls */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] uppercase tracking-wider font-sans font-black text-[var(--sec-text)]">
                                Text Size
                            </label>
                            <span className="text-[9px] font-bold bg-black text-white px-1.5 py-0.5">
                                {Math.round((theme.fontSize || 1.15) * 100)}%
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const nextSize = parseFloat(Math.max(0.8, (theme.fontSize || 1.2) - 0.05).toFixed(2));
                                    if (onThemeChange) {
                                        onThemeChange({ ...theme, fontSize: nextSize });
                                    } else if (onFontSizeChange) {
                                        onFontSizeChange(nextSize);
                                    }
                                }}
                                className="w-8 h-8 flex items-center justify-center border-2 border-black bg-transparent hover:bg-black/5 font-extrabold text-lg text-[var(--text-color)] active:translate-y-0.5"
                            >
                                -
                            </button>
                            <div className="flex-1 text-center font-bold text-[10px] text-[var(--text-color)] uppercase tracking-tighter leading-tight line-clamp-1">
                                {theme.font ? theme.font.name : 'Serif'}
                            </div>
                            <button
                                onClick={() => {
                                    const nextSize = parseFloat(Math.min(2.0, (theme.fontSize || 1.2) + 0.05).toFixed(2));
                                    if (onThemeChange) {
                                        onThemeChange({ ...theme, fontSize: nextSize });
                                    } else if (onFontSizeChange) {
                                        onFontSizeChange(nextSize);
                                    }
                                }}
                                className="w-8 h-8 flex items-center justify-center border-2 border-black bg-transparent hover:bg-black/5 font-extrabold text-lg text-[var(--text-color)] active:translate-y-0.5"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Line height controls */}
                    <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] uppercase tracking-wider font-sans font-black text-[var(--sec-text)]">
                                Line Spacing
                            </label>
                            <span className="text-[9px] font-bold bg-black text-white px-1.5 py-0.5">
                                {theme.lineHeight || 1.6}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const nextHeight = parseFloat(Math.max(1.4, (theme.lineHeight || 1.6) - 0.1).toFixed(1));
                                    if (onThemeChange) {
                                        onThemeChange({ ...theme, lineHeight: nextHeight });
                                    }
                                }}
                                className="w-8 h-8 flex items-center justify-center border-2 border-black bg-transparent hover:bg-black/5 font-extrabold text-lg text-[var(--text-color)] active:translate-y-0.5"
                            >
                                -
                            </button>
                            <div className="flex-1 h-2 bg-black/10 rounded-none overflow-hidden relative">
                                <div 
                                    className="h-full bg-cyan-400" 
                                    style={{ width: `${Math.max(0, Math.min(100, (((theme.lineHeight || 1.6) - 1.4) / (2.8 - 1.4)) * 100))}%` }} 
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const nextHeight = parseFloat(Math.min(2.8, (theme.lineHeight || 1.6) + 0.1).toFixed(1));
                                    if (onThemeChange) {
                                        onThemeChange({ ...theme, lineHeight: nextHeight });
                                    }
                                }}
                                className="w-8 h-8 flex items-center justify-center border-2 border-black bg-transparent hover:bg-black/5 font-extrabold text-lg text-[var(--text-color)] active:translate-y-0.5"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </Box>
            )}

            <style>{`
                .epub-content { 
                    word-break: break-word; 
                    overflow-wrap: break-word;
                    max-width: 100% !important;
                    font-size: var(--fontSize, var(--font-size));
                    line-height: var(--line-height);
                    text-align: var(--text-align);
                    color: var(--text-color);
                    font-family: var(--font-serif);
                }
                .epub-content p { 
                    margin-bottom: var(--para-spacing); 
                    text-indent: var(--para-indent);
                    display: block !important;
                }
                .epub-content h1, .epub-content h2, .epub-content h3 {
                    font-family: var(--font-serif) !important;
                    font-weight: 700 !important;
                    line-height: 1.2 !important;
                    margin: 4rem 0 2rem 0 !important;
                    color: var(--text-color) !important;
                    text-transform: none !important;
                }
                .epub-content h1 { font-size: 2.6em !important; text-align: center !important; }
                .epub-content h2 { font-size: 2.0em !important; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; }
                .epub-content h3 { font-size: 1.6em !important; }

                .epub-content blockquote {
                    padding: 1.5rem 2rem !important;
                    margin: 3rem 1rem !important;
                    border-left: 5px solid var(--accent-color) !important;
                    background: rgba(0,0,0,0.03) !important;
                    font-style: italic !important;
                }
                .epub-content pre, .epub-content code {
                    font-family: 'JetBrains Mono', monospace !important;
                    font-size: 0.9em !important;
                    background: rgba(0,0,0,0.05) !important;
                }
                .epub-content pre {
                    padding: 1.5rem !important;
                    margin: 2rem 0 !important;
                    overflow-x: auto !important;
                    white-space: pre-wrap !important;
                    border: 1px solid var(--border-color) !important;
                }
                .epub-content img { 
                    max-width: 100% !important; 
                    height: auto !important; 
                    margin: 3rem auto !important; 
                    display: block !important;
                    border: 1px solid var(--border-color);
                }
                .pdf-page-container {
                    margin-bottom: 2rem;
                    display: flex;
                    justify-content: center;
                }
                .pdf-page-container img {
                    margin: 0 !important;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.15) !important;
                }
            `}</style>
        </Box>
    );
};
export default ReaderView;
