
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
    const [selection, setSelection] = useState<{ text: string, rect: DOMRect } | null>(null);
    const [showShareDialog, setShowShareDialog] = useState<string | null>(null);
    const [scrollProgress, setScrollProgress] = useState(book.progress || 0);
    const [isInitialScrollDone, setIsInitialScrollDone] = useState(false);
    
    const scrollViewportRef = useRef<HTMLDivElement>(null);
    const lastUpdateRef = useRef<number>(Date.now());

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
        <Box className="fixed inset-0 z-[1000] flex flex-col overflow-hidden animate-fade-in" style={{ ...styleVariables, backgroundColor: 'var(--bg-color)' }}>
            <header className="h-16 bg-white border-b-4 border-black flex items-center justify-between px-6 z-[1200] shadow-[0_4px_0_#000]">
                <ActionIcon variant="filled" color="cyan" size="lg" onClick={onClose} className="border-2 border-black rounded-none shadow-[2px_2px_0_#000]"><IconChevronLeft className="text-black" /></ActionIcon>
                <Stack gap={0} align="center">
                    <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-black">
                        {Math.round(scrollProgress * 100)}% READ
                    </Text>
                </Stack>
                <ActionIcon variant="filled" color="yellow" size="lg" onClick={() => setShowToc(true)} className="border-2 border-black rounded-none shadow-[2px_2px_0_#000]"><IconMenu className="text-black" /></ActionIcon>
            </header>

            <Box className="fixed left-0 top-0 bottom-0 w-2 bg-black z-[1100]">
                <Box className="w-full bg-cyan-400 transition-all duration-100" style={{ height: `${scrollProgress * 100}%` }} />
            </Box>

            <ScrollArea className={`flex-1 ${isPaperTheme ? 'printed-texture' : ''}`} viewportRef={scrollViewportRef} onScrollPositionChange={handleScroll}>
                <Box className={`relative max-w-full md:max-w-3xl mx-auto min-h-screen pt-12 pb-40 px-4 md:px-16 font-serif text-[var(--text-color)] overflow-x-hidden`}>
                    {book.chapters.map((chapter, idx) => (
                        <section key={chapter.id} className="mb-20 last:mb-0 transition-opacity duration-300">
                            <ChapterContent html={chapter.html} id={chapter.id} className={`epub-content text-justify`} />
                        </section>
                    ))}
                </Box>
            </ScrollArea>

            {selection && (
                <TextSelectionPopup 
                    rect={selection.rect}
                    onCopy={() => { navigator.clipboard.writeText(selection.text); setSelection(null); onSearch("Copied!"); }}
                    onQuote={() => { onSaveQuote(selection.text, book.chapters[currentChapterIndex].id); setSelection(null); }}
                    onSearch={() => { onSearch(selection.text); setSelection(null); }}
                    onShare={() => { setShowShareDialog(selection.text); setSelection(null); }}
                />
            )}

            <Transition mounted={showToc} transition="slide-right" duration={300}>
                {(styles) => (
                    <Box style={styles} className="fixed inset-0 z-[1500] flex">
                        <Box className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowToc(false)} />
                        <Box className="relative w-80 bg-white h-full border-r-8 border-black p-8 flex flex-col gap-6" bg="var(--color-surface)">
                            <Group justify="space-between" align="center">
                                <Text className="text-[14px] font-black uppercase tracking-[0.1em] text-black">Contents</Text>
                                <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setShowToc(false)}><IconClose className="text-black" /></ActionIcon>
                            </Group>
                            <ScrollArea className="flex-1">
                                <Stack gap={4}>
                                    {book.chapters.map((item, idx) => (
                                        <Box key={idx} 
                                            className={`p-4 cursor-pointer border-2 transition-all ${idx === currentChapterIndex ? 'bg-cyan-400 border-black shadow-[4px_4px_0_#000]' : 'bg-white border-gray-200 hover:border-black'}`}
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
                    display: block; /* Force blocks to stack correctly on small screens */
                    margin-left: auto !important;
                    margin-right: auto !important;
                }
                /* Inline exceptions */
                .epub-content span, .epub-content b, .epub-content i, .epub-content a, .epub-content em, .epub-content strong {
                    display: inline !important;
                    position: static !important;
                }
                .epub-content p { 
                    width: 100% !important;
                    font-size: var(--font-size); 
                    line-height: var(--line-height); 
                    margin-bottom: 2rem; 
                    text-rendering: optimizeLegibility;
                    -webkit-font-smoothing: antialiased;
                    display: block !important;
                    text-align: justify;
                }
                .epub-content img, .epub-content image, .epub-content svg { 
                    max-width: 100% !important; 
                    height: auto !important; 
                    border: 4px solid black; 
                    margin: 2rem auto !important; 
                    box-shadow: 6px 6px 0 black; 
                    display: block !important;
                    width: auto !important;
                }
                .epub-content pre, .epub-content code {
                    background: rgba(0,0,0,0.05);
                    padding: 1.5rem;
                    border: 2px solid black;
                    overflow-x: auto !important;
                    max-width: 100% !important;
                    display: block !important;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    font-family: var(--font-mono);
                    width: 100% !important;
                    margin: 1rem 0;
                }
                .epub-content table {
                    width: 100% !important;
                    display: block !important;
                    overflow-x: auto !important;
                    border-collapse: collapse;
                    margin: 2rem 0;
                    border: 2px solid black;
                }
                .epub-content td, .epub-content th {
                    min-width: 100px;
                    border: 1px solid var(--border-color);
                    padding: 0.75rem;
                    display: table-cell !important;
                }
                .epub-content h1, .epub-content h2, .epub-content h3 { 
                    font-family: var(--font-sans); 
                    color: black; 
                    margin: 3.5rem 0 1.5rem 0 !important; 
                    font-weight: 900; 
                    line-height: 1.1; 
                    text-transform: uppercase; 
                    letter-spacing: -0.02em;
                    background: yellow;
                    display: inline-block !important;
                    padding: 0.25rem 0.5rem !important;
                    width: auto !important;
                }
            `}</style>
        </Box>
    );
};
export default ReaderView;
