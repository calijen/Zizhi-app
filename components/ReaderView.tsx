
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Box, Group, Stack, Text, ActionIcon, ScrollArea, Transition, Loader, Center } from '@mantine/core';
import type { Book, Chapter, Theme } from '../types';
import { IconChevronLeft, IconMenu, IconClose, IconPlus, IconMinus } from './icons';
import TextSelectionPopup from './TextSelectionPopup';
import PdfPage from './PdfPage';
import ShareDialog from './ShareDialog';

declare const pdfjsLib: any;

interface ReaderViewProps {
    book: Book;
    theme: Theme;
    initialChapterId?: string | null;
    onClose: () => void;
    onUpdateProgress: (bookId: string, chapterIndex: number, scrollTop: number, timeSpent: number, granularProgress: number) => void;
    onSaveQuote: (text: string, chapterId: string) => void;
    onSaveNote: (text: string, note: string, chapterId: string) => void;
    onSearch: (query: string) => void;
}

const ChapterContent = memo(({ html, id, className }: { html: string, id: string, className: string }) => (
    <div dangerouslySetInnerHTML={{ __html: html }} className={className} />
));

const ReaderView: React.FC<ReaderViewProps> = ({ book, theme, onClose, onUpdateProgress, onSaveQuote, onSaveNote, onSearch }) => {
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const [showToc, setShowToc] = useState(false);
    const [isDesktopTocPersistent, setIsDesktopTocPersistent] = useState(window.innerWidth > 1400);
    const [selection, setSelection] = useState<{ text: string, rect: DOMRect } | null>(null);
    const [noteInput, setNoteInput] = useState<{ text: string } | null>(null);
    const [noteValue, setNoteValue] = useState('');
    const [showShareDialog, setShowShareDialog] = useState<string | null>(null);
    const [scrollProgress, setScrollProgress] = useState(book.progress || 0);
    const [isInitialScrollDone, setIsInitialScrollDone] = useState(false);
    const [pdfDocument, setPdfDocument] = useState<any>(null);
    const [isPdfLoading, setIsPdfLoading] = useState(book.isPdf);
    const [pdfScale, setPdfScale] = useState(window.innerWidth < 768 ? 1.2 : 1.5);
    
    const scrollViewportRef = useRef<HTMLDivElement>(null);
    const lastUpdateRef = useRef<number>(Date.now());

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
            }, 400);
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
        const elementId = book.isPdf ? `pdf-page-${idx + 1}` : `chapter-${chapter.id.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const element = document.getElementById(elementId);
        if (element && scrollViewportRef.current) {
            scrollViewportRef.current.scrollTo({ top: element.offsetTop - 20, behavior: 'smooth' });
            setCurrentChapterIndex(idx);
            setShowToc(false);
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
        '--para-indent': theme.id === 'warm' ? '1.5em' : '0',
        '--para-spacing': theme.id === 'quiet' ? '2.5rem' : (theme.id === 'nocturne' ? '0.8rem' : '0'),
        '--text-align': theme.id === 'quiet' ? 'left' : 'justify'
    } as React.CSSProperties;

    return (
        <Box className={`fixed inset-0 z-[1000] flex flex-col md:flex-row overflow-hidden animate-fade-in reader-atmosphere-${theme.id}`} style={{ ...styleVariables, backgroundColor: 'var(--bg-color)' }}>
            
            <Transition mounted={isDesktopTocPersistent} transition="slide-right" duration={300}>
                {(styles) => (
                    <Box style={styles} className="hidden xl:flex w-80 bg-[var(--bg-color)] border-r-4 border-black flex-col h-full z-[1100]">
                        <div className="p-10 border-b-4 border-black">
                            <Text className="text-[12px] font-black uppercase tracking-widest text-[var(--sec-text)]">Chapters</Text>
                        </div>
                        <ScrollArea className="flex-1 p-6">
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
                                onClick={() => setPdfScale(prev => Math.max(0.5, prev - 0.1))}
                                className="text-[var(--text-color)]"
                            >
                                <IconMinus size={16} />
                            </ActionIcon>
                            <Text className="text-[10px] font-black w-8 text-center">{Math.round(pdfScale * 100)}%</Text>
                            <ActionIcon 
                                variant="subtle" 
                                color="gray" 
                                onClick={() => setPdfScale(prev => Math.min(3, prev + 0.1))}
                                className="text-[var(--text-color)]"
                            >
                                <IconPlus size={16} />
                            </ActionIcon>
                        </Group>
                    )}

                    {!isDesktopTocPersistent && (
                        <ActionIcon variant="filled" color="yellow" size="lg" onClick={() => setShowToc(true)} className="border-2 border-black rounded-none shadow-[3px_3px_0_black] bg-[var(--bg-color)]"><IconMenu className="text-[var(--text-color)] w-5 h-5" /></ActionIcon>
                    )}
                    {isDesktopTocPersistent && <div className="w-10"></div>}
                </header>

                <ScrollArea className={`flex-1 ${theme.texture === 'paper' ? 'printed-texture' : ''}`} viewportRef={scrollViewportRef} onScrollPositionChange={handleScroll}>
                    <Box className={`relative max-w-full ${book.isPdf ? 'md:max-w-4xl' : 'md:max-w-3xl lg:max-w-4xl'} mx-auto min-h-screen pt-8 md:pt-16 pb-64 px-6 md:px-24 font-serif text-[var(--text-color)]`}>
                        {isPdfLoading ? (
                            <Center className="h-64 flex-col gap-4">
                                <Loader color="cyan" size="xl" />
                                <Text className="font-black uppercase tracking-widest text-[var(--sec-text)]">Initializing PDF Engine...</Text>
                            </Center>
                        ) : book.isPdf && pdfDocument ? (
                            book.chapters.map((chapter, idx) => (
                                <section key={chapter.id} id={`pdf-page-${idx + 1}`} className="mb-8 last:mb-0">
                                    <PdfPage pdfDocument={pdfDocument} pageNumber={idx + 1} scale={pdfScale} />
                                </section>
                            ))
                        ) : (
                            book.chapters.map((chapter) => (
                                <section key={chapter.id} id={`chapter-${chapter.id.replace(/[^a-zA-Z0-9]/g, '-')}`} className="mb-24 last:mb-0">
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
                            onClick={() => setPdfScale(prev => Math.min(3, prev + 0.2))}
                            className="border-2 border-black rounded-none shadow-[4px_4px_0_black] active:translate-x-1 active:translate-y-1 active:shadow-none"
                        >
                            <IconPlus size={24} />
                        </ActionIcon>
                        <ActionIcon 
                            size={48}
                            variant="filled" 
                            color="cyan" 
                            onClick={() => setPdfScale(prev => Math.max(0.5, prev - 0.2))}
                            className="border-2 border-black rounded-none shadow-[4px_4px_0_black] active:translate-x-1 active:translate-y-1 active:shadow-none"
                        >
                            <IconMinus size={24} />
                        </ActionIcon>
                    </Box>
                )}
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

            <Transition mounted={showToc && !isDesktopTocPersistent} transition="slide-right" duration={300}>
                {(styles) => (
                    <Box style={styles} className="fixed inset-0 z-[1500] flex">
                        <Box className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowToc(false)} />
                        <Box className="relative w-72 bg-[var(--bg-color)] h-full border-r-4 border-black p-8 flex flex-col gap-6 shadow-[8px_0_0_black]">
                            <Group justify="space-between">
                                <Text className="text-[14px] font-black uppercase text-[var(--text-color)]">Chapters</Text>
                                <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setShowToc(false)}><IconClose className="text-[var(--text-color)]" /></ActionIcon>
                            </Group>
                            <ScrollArea className="flex-1">
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
                    font-size: var(--font-size);
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
