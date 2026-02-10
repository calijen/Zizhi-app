
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Box, Group, Stack, Text, ActionIcon, ScrollArea, Transition } from '@mantine/core';
import type { Book, Chapter, Theme } from '../types';
import { IconChevronLeft, IconMenu, IconClose } from './icons';
import TextSelectionPopup from './TextSelectionPopup';
import ShareDialog from './ShareDialog';

interface ReaderViewProps {
    book: Book;
    theme: Theme;
    initialChapterId?: string | null;
    onClose: () => void;
    onUpdateProgress: (bookId: string, chapterIndex: number, scrollTop: number, timeSpent: number, granularProgress: number) => void;
    onSaveQuote: (text: string, chapterId: string) => void;
    onSearch: (query: string) => void;
}

const ChapterContent = memo(({ html, id, className }: { html: string, id: string, className: string }) => (
    <div id={`chapter-${id.replace(/[^a-zA-Z0-9]/g, '-')}`} dangerouslySetInnerHTML={{ __html: html }} className={className} />
));

const ReaderView: React.FC<ReaderViewProps> = ({ book, theme, onClose, onUpdateProgress, onSaveQuote, onSearch }) => {
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const [showToc, setShowToc] = useState(false);
    const [isDesktopTocPersistent, setIsDesktopTocPersistent] = useState(window.innerWidth > 1400);
    const [selection, setSelection] = useState<{ text: string, rect: DOMRect } | null>(null);
    const [showShareDialog, setShowShareDialog] = useState<string | null>(null);
    const [scrollProgress, setScrollProgress] = useState(book.progress || 0);
    const [isInitialScrollDone, setIsInitialScrollDone] = useState(false);
    
    const scrollViewportRef = useRef<HTMLDivElement>(null);
    const lastUpdateRef = useRef<number>(Date.now());

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1400) setIsDesktopTocPersistent(true);
            else setIsDesktopTocPersistent(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isInitialScrollDone && scrollViewportRef.current && book.lastScrollTop > 0) {
            const scrollTimer = setTimeout(() => {
                if (scrollViewportRef.current) {
                    scrollViewportRef.current.scrollTo({ top: book.lastScrollTop, behavior: 'auto' });
                    setIsInitialScrollDone(true);
                }
            }, 300);
            return () => clearTimeout(scrollTimer);
        } else if (!isInitialScrollDone) {
            setIsInitialScrollDone(true);
        }
    }, [isInitialScrollDone, book.lastScrollTop]);

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

    const navigateToChapter = (idx: number) => {
        const chapter = book.chapters[idx];
        const element = document.getElementById(`chapter-${chapter.id.replace(/[^a-zA-Z0-9]/g, '-')}`);
        if (element && scrollViewportRef.current) {
            scrollViewportRef.current.scrollTo({ top: element.offsetTop, behavior: 'smooth' });
            setCurrentChapterIndex(idx);
            setShowToc(false);
        }
    };

    const isPaperTheme = theme.id === 'paper' || theme.id === 'vintage' || theme.id === 'sepia';

    const styleVariables = {
        '--font-serif': theme.font.serif,
        '--font-sans': theme.font.sans,
        '--bg-color': theme.colors.background,
        '--text-color': theme.colors['primary-text'],
        '--sec-text': theme.colors['secondary-text'],
        '--accent-color': theme.colors.primary,
        '--font-size': `${theme.fontSize}rem`,
        '--line-height': theme.lineHeight,
        '--border-color': theme.colors['border-color']
    } as React.CSSProperties;

    return (
        <Box className="fixed inset-0 z-[1000] flex flex-col md:flex-row overflow-hidden animate-fade-in" style={{ ...styleVariables, backgroundColor: 'var(--bg-color)' }}>
            
            {/* Table of Contents Side Pane (Desktop Persistent) */}
            <Transition mounted={isDesktopTocPersistent} transition="slide-right" duration={300}>
                {(styles) => (
                    <Box style={styles} className="hidden xl:flex w-80 bg-white border-r-8 border-black flex-col h-full z-[1100]">
                        <div className="p-10 border-b-8 border-black bg-black text-white">
                            <Text className="text-[12px] font-black uppercase tracking-[0.4em]">Contents</Text>
                        </div>
                        <ScrollArea className="flex-1 p-6">
                            <Stack gap={4}>
                                {book.chapters.map((item, idx) => (
                                    <Box key={idx} 
                                        className={`p-5 cursor-pointer border-4 transition-all ${idx === currentChapterIndex ? 'bg-cyan-400 border-black shadow-[4px_4px_0_black] -translate-y-1' : 'bg-white border-transparent hover:border-black'}`}
                                        style={{ borderRadius: '0px' }}
                                        onClick={() => navigateToChapter(idx)}
                                    >
                                        <Text className="text-[11px] font-black uppercase tracking-tight leading-relaxed text-black line-clamp-2">{item.label}</Text>
                                    </Box>
                                ))}
                            </Stack>
                        </ScrollArea>
                    </Box>
                )}
            </Transition>

            <Box className="flex-1 flex flex-col h-full relative">
                <header className="h-20 bg-white border-b-8 border-black flex items-center justify-between px-8 z-[1200] shadow-[0_8px_0_rgba(0,0,0,0.05)]">
                    <ActionIcon variant="filled" color="cyan" size="xl" onClick={onClose} className="border-4 border-black rounded-none shadow-[4px_4px_0_black] bg-white hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"><IconChevronLeft className="text-black w-6 h-6" /></ActionIcon>
                    
                    <Stack gap={0} align="center">
                        <Text className="text-[11px] font-black uppercase tracking-[0.3em] text-black">
                            {Math.round(scrollProgress * 100)}% Synchronized
                        </Text>
                    </Stack>
                    
                    {!isDesktopTocPersistent && (
                        <ActionIcon variant="filled" color="yellow" size="xl" onClick={() => setShowToc(true)} className="border-4 border-black rounded-none shadow-[4px_4px_0_black] bg-white"><IconMenu className="text-black w-6 h-6" /></ActionIcon>
                    )}
                    {isDesktopTocPersistent && <div className="w-12"></div>}
                </header>

                <Box className="fixed left-0 top-0 bottom-0 w-2 bg-black z-[1100] md:hidden">
                    <Box className="w-full bg-cyan-400 transition-all duration-100" style={{ height: `${scrollProgress * 100}%` }} />
                </Box>

                <ScrollArea className={`flex-1 ${isPaperTheme ? 'printed-texture' : ''}`} viewportRef={scrollViewportRef} onScrollPositionChange={handleScroll}>
                    <Box className={`relative max-w-full md:max-w-4xl mx-auto min-h-screen pt-20 pb-64 px-6 md:px-24 font-serif text-[var(--text-color)] overflow-x-hidden`}>
                        {book.chapters.map((chapter, idx) => (
                            <section key={chapter.id} className="mb-32 last:mb-0 transition-opacity duration-300">
                                <ChapterContent html={chapter.html} id={chapter.id} className={`epub-content text-justify`} />
                            </section>
                        ))}
                    </Box>
                </ScrollArea>
            </Box>

            {selection && (
                <TextSelectionPopup 
                    rect={selection.rect}
                    onCopy={() => { navigator.clipboard.writeText(selection.text); setSelection(null); onSearch("Captured to buffer."); }}
                    onQuote={() => { onSaveQuote(selection.text, book.chapters[currentChapterIndex].id); setSelection(null); }}
                    onSearch={() => { onSearch(selection.text); setSelection(null); }}
                    onShare={() => { setShowShareDialog(selection.text); setSelection(null); }}
                />
            )}

            <Transition mounted={showToc && !isDesktopTocPersistent} transition="slide-right" duration={300}>
                {(styles) => (
                    <Box style={styles} className="fixed inset-0 z-[1500] flex">
                        <Box className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowToc(false)} />
                        <Box className="relative w-80 bg-white h-full border-r-8 border-black p-10 flex flex-col gap-8 shadow-[12px_0_0_black]" bg="var(--color-surface)">
                            <Group justify="space-between" align="center">
                                <Text className="text-[16px] font-black uppercase tracking-[0.2em] text-black">Archives</Text>
                                <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setShowToc(false)}><IconClose className="text-black" /></ActionIcon>
                            </Group>
                            <ScrollArea className="flex-1">
                                <Stack gap={6}>
                                    {book.chapters.map((item, idx) => (
                                        <Box key={idx} 
                                            className={`p-5 cursor-pointer border-4 transition-all ${idx === currentChapterIndex ? 'bg-cyan-400 border-black shadow-[4px_4px_0_black] -translate-y-1' : 'bg-white border-gray-100 hover:border-black'}`}
                                            style={{ borderRadius: '0px' }}
                                            onClick={() => navigateToChapter(idx)}
                                        >
                                            <Text className="text-[12px] font-black uppercase tracking-tight leading-relaxed text-black line-clamp-2">{item.label}</Text>
                                        </Box>
                                    ))}
                                </Stack>
                            </ScrollArea>
                        </Box>
                    </Box>
                )}
            </Transition>

            {showShareDialog && <ShareDialog text={showShareDialog} bookTitle={book.title} author={book.author} coverImageUrl={book.coverImageUrl} theme={theme} onClose={() => setShowShareDialog(null)} />}

            <style>{`
                .epub-content { 
                    word-break: break-word; 
                    overflow-wrap: break-word;
                    max-width: 100% !important;
                    width: 100% !important;
                    overflow-x: hidden !important;
                }
                .epub-content * {
                    max-width: 100% !important;
                    box-sizing: border-box !important;
                    height: auto !important;
                    width: auto !important;
                    min-width: 0 !important;
                    float: none !important;
                    position: static !important;
                    display: block; 
                    margin-left: auto !important;
                    margin-right: auto !important;
                }
                .epub-content span, .epub-content b, .epub-content i, .epub-content a, .epub-content em, .epub-content strong {
                    display: inline !important;
                    position: static !important;
                }
                .epub-content p { 
                    width: 100% !important;
                    font-size: var(--font-size); 
                    line-height: var(--line-height); 
                    margin-bottom: 2.5rem; 
                    text-rendering: optimizeLegibility;
                    -webkit-font-smoothing: antialiased;
                    display: block !important;
                    text-align: justify;
                }
                .epub-content img, .epub-content image, .epub-content svg { 
                    max-width: 100% !important; 
                    height: auto !important; 
                    border: 8px solid black; 
                    margin: 4rem auto !important; 
                    box-shadow: 12px 12px 0 black; 
                    display: block !important;
                    width: auto !important;
                }
                .epub-content h1, .epub-content h2, .epub-content h3 { 
                    font-family: var(--font-sans); 
                    color: black; 
                    margin: 5rem 0 2rem 0 !important; 
                    font-weight: 900; 
                    line-height: 1.1; 
                    text-transform: uppercase; 
                    letter-spacing: -0.02em;
                    background: yellow;
                    display: inline-block !important;
                    padding: 0.5rem 1rem !important;
                    width: auto !important;
                    border: 4px solid black;
                    box-shadow: 6px 6px 0 black;
                }
            `}</style>
        </Box>
    );
};
export default ReaderView;
