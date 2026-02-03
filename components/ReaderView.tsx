
import React, { useState, useEffect, useRef } from 'react';
import type { Book, Chapter, Theme } from '../types';
import { IconChevronLeft, IconMenu, IconClose } from './icons';
import TextSelectionPopup from './TextSelectionPopup';

interface ReaderViewProps {
    book: Book;
    theme: Theme;
    onClose: () => void;
    onUpdateProgress: (bookId: string, chapterIndex: number, scrollTop: number, timeSpent: number) => void;
    onSaveQuote: (text: string, chapterId: string) => void;
    onSearch: (query: string) => void;
}

const ReaderView: React.FC<ReaderViewProps> = ({ book, theme, onClose, onUpdateProgress, onSaveQuote, onSearch }) => {
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const [showToc, setShowToc] = useState(false);
    const [selection, setSelection] = useState<{ top: number; left: number; text: string } | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastTickRef = useRef<number>(Date.now());
    const accumulatedTimeRef = useRef<number>(0);

    const chapter = book.chapters[currentChapterIndex];

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, [currentChapterIndex]);

    // Reading time tracker
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const delta = (now - lastTickRef.current) / 1000; // in seconds
            accumulatedTimeRef.current += delta;
            lastTickRef.current = now;

            // Update stats every 10 seconds or when closing
            if (accumulatedTimeRef.current >= 10) {
                flushStats();
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            flushStats();
        };
    }, [currentChapterIndex]);

    const flushStats = () => {
        if (accumulatedTimeRef.current > 0) {
            const timeToSync = Math.floor(accumulatedTimeRef.current);
            const scrollTop = containerRef.current?.scrollTop || 0;
            onUpdateProgress(book.id, currentChapterIndex, scrollTop, timeToSync);
            accumulatedTimeRef.current -= timeToSync;
        }
    };

    const handleScroll = () => {
        if (containerRef.current) {
            const { scrollTop } = containerRef.current;
            onUpdateProgress(book.id, currentChapterIndex, scrollTop, 0);
        }
    };

    const handleMouseUp = () => {
        const sel = window.getSelection();
        if (sel && sel.toString().trim().length > 0) {
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setSelection({
                top: rect.top,
                left: rect.left + rect.width / 2,
                text: sel.toString().trim()
            });
        } else {
            setSelection(null);
        }
    };

    const styleVariables = {
        '--font-serif': theme.font.serif,
        '--font-sans': theme.font.sans,
        '--bg-color': theme.colors.background,
        '--text-color': theme.colors['primary-text'],
        '--accent-color': theme.colors.primary,
        '--font-size': `${theme.fontSize}rem`,
        '--line-height': theme.lineHeight,
    } as React.CSSProperties;

    return (
        <div 
            className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-color)] animate-fade-in"
            style={styleVariables}
        >
            {/* Top Header */}
            <header className="h-14 border-b border-[var(--color-border-color)] flex items-center justify-between px-4 bg-[var(--bg-color)]/80 backdrop-blur-md z-30">
                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <IconChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex-1 text-center truncate px-4">
                    <h2 className="text-sm font-bold truncate">{book.title}</h2>
                    <p className="text-[10px] text-[var(--color-secondary-text)]">{chapter?.label || `Chapter ${currentChapterIndex + 1}`}</p>
                </div>
                <button onClick={() => setShowToc(true)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <IconMenu className="w-6 h-6" />
                </button>
            </header>

            {/* Content Area */}
            <div 
                ref={containerRef}
                onScroll={handleScroll}
                onMouseUp={handleMouseUp}
                className="flex-1 overflow-y-auto"
            >
                <div 
                    ref={contentRef}
                    className="max-w-2xl mx-auto p-6 sm:p-12 font-serif text-[var(--text-color)] text-[var(--font-size)] leading-[var(--line-height)] reader-content"
                    dangerouslySetInnerHTML={{ __html: chapter?.html || '' }}
                />
                
                {/* Chapter Navigation */}
                <div className="max-w-2xl mx-auto p-12 flex justify-between items-center border-t border-[var(--color-border-color)]">
                    <button 
                        disabled={currentChapterIndex === 0}
                        onClick={() => { flushStats(); setCurrentChapterIndex(i => Math.max(0, i - 1)); }}
                        className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-white disabled:opacity-30"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-[var(--color-secondary-text)]">
                        {currentChapterIndex + 1} / {book.chapters.length}
                    </span>
                    <button 
                        disabled={currentChapterIndex === book.chapters.length - 1}
                        onClick={() => { flushStats(); setCurrentChapterIndex(i => Math.min(book.chapters.length - 1, i + 1)); }}
                        className="px-4 py-2 rounded-md bg-[var(--color-primary)] text-white disabled:opacity-30"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* TOC Sidebar */}
            {showToc && (
                <div className="fixed inset-0 z-[60] flex">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowToc(false)} />
                    <aside className="relative w-80 bg-[var(--bg-color)] h-full shadow-2xl flex flex-col animate-slide-in-right">
                        <header className="p-4 border-b border-[var(--color-border-color)] flex justify-between items-center">
                            <h3 className="font-bold">Contents</h3>
                            <button onClick={() => setShowToc(false)}><IconClose className="w-6 h-6" /></button>
                        </header>
                        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                            {book.chapters.map((ch, idx) => (
                                <button
                                    key={ch.id}
                                    onClick={() => { flushStats(); setCurrentChapterIndex(idx); setShowToc(false); }}
                                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${idx === currentChapterIndex ? 'bg-[var(--color-primary)] text-white font-bold' : 'hover:bg-black/5'}`}
                                >
                                    {ch.label}
                                </button>
                            ))}
                        </nav>
                    </aside>
                </div>
            )}

            {selection && (
                <TextSelectionPopup 
                    top={selection.top}
                    left={selection.left}
                    isMobile={window.innerWidth < 768}
                    onCopy={() => { navigator.clipboard.writeText(selection.text); setSelection(null); }}
                    onQuote={() => { onSaveQuote(selection.text, chapter.id); setSelection(null); }}
                    onSearch={() => { onSearch(selection.text); setSelection(null); }}
                />
            )}

            <style>{`
                .reader-content img { max-width: 100%; height: auto; margin: 1.5rem auto; display: block; border-radius: 8px; }
                .reader-content p { margin-bottom: 1.5rem; }
                .reader-content h1, .reader-content h2, .reader-content h3 { font-family: var(--font-sans); margin-top: 2rem; margin-bottom: 1rem; }
                @keyframes slide-in-right { from { transform: translateX(-100%); } to { transform: translateX(0); } }
                .animate-slide-in-right { animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
            `}</style>
        </div>
    );
};

export default ReaderView;
