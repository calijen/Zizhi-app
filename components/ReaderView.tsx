
import React, { useState, useEffect, useRef } from 'react';
import type { Book, Chapter, Theme } from '../types';
import { IconChevronLeft, IconMenu, IconClose } from './icons';
import TextSelectionPopup from './TextSelectionPopup';
import ShareDialog from './ShareDialog';

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
    const [showShareDialog, setShowShareDialog] = useState<string | null>(null);
    const [pageTransition, setPageTransition] = useState<'next' | 'prev' | null>(null);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
    const lastTickRef = useRef<number>(Date.now());
    const accumulatedTimeRef = useRef<number>(0);
    const touchStartRef = useRef<number | null>(null);

    // Forces scroll mode on desktop screens
    const isScrollMode = isDesktop || theme.readingMode === 'scroll';

    // Handle Resize
    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Intersection Observer to track chapter while scrolling
    useEffect(() => {
        if (!isScrollMode) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.getAttribute('data-chapter-index') || '0');
                        setCurrentChapterIndex(index);
                    }
                });
            },
            { threshold: 0.2, root: containerRef.current }
        );

        chapterRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, [isScrollMode, book.chapters]);

    // Scroll to last position on open
    useEffect(() => {
        if (containerRef.current && book.lastScrollTop > 0 && isScrollMode) {
            containerRef.current.scrollTop = book.lastScrollTop;
        }
    }, [isScrollMode]);

    // Reading time tracker
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            accumulatedTimeRef.current += (now - lastTickRef.current) / 1000;
            lastTickRef.current = now;
            if (accumulatedTimeRef.current >= 10) flushStats();
        }, 1000);
        return () => { clearInterval(interval); flushStats(); };
    }, [currentChapterIndex]);

    const flushStats = () => {
        if (accumulatedTimeRef.current > 0) {
            const timeToSync = Math.floor(accumulatedTimeRef.current);
            onUpdateProgress(book.id, currentChapterIndex, containerRef.current?.scrollTop || 0, timeToSync);
            accumulatedTimeRef.current -= timeToSync;
        }
    };

    const handleFlip = (direction: 'next' | 'prev') => {
        if (direction === 'next' && currentChapterIndex < book.chapters.length - 1) {
            setPageTransition('next');
            setTimeout(() => {
                setCurrentChapterIndex(i => i + 1);
                setPageTransition(null);
            }, 300);
        } else if (direction === 'prev' && currentChapterIndex > 0) {
            setPageTransition('prev');
            setTimeout(() => {
                setCurrentChapterIndex(i => i - 1);
                setPageTransition(null);
            }, 300);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isScrollMode) return;
        touchStartRef.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (isScrollMode || touchStartRef.current === null) return;
        const touchEnd = e.changedTouches[0].clientX;
        const delta = touchStartRef.current - touchEnd;
        
        if (Math.abs(delta) > 50) { // Swipe threshold
            if (delta > 0) handleFlip('next');
            else handleFlip('prev');
        }
        touchStartRef.current = null;
    };

    const handleScreenClick = (e: React.MouseEvent) => {
        if (isScrollMode) return;
        const width = window.innerWidth;
        const clickX = e.clientX;
        const clickY = e.clientY;
        const height = window.innerHeight;

        // Taps on bottom corners flip pages
        if (clickY > height * 0.6) {
            if (clickX > width * 0.75) handleFlip('next');
            else if (clickX < width * 0.25) handleFlip('prev');
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
            className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-color)] animate-fade-in select-none"
            style={styleVariables}
        >
            <header className="h-14 border-b border-[var(--color-border-color)] flex items-center justify-between px-4 bg-[var(--bg-color)]/80 backdrop-blur-md z-30">
                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full"><IconChevronLeft className="w-6 h-6" /></button>
                <div className="flex-1 text-center truncate px-4">
                    <h2 className="text-sm font-bold truncate">{book.title}</h2>
                    <p className="text-[10px] text-[var(--color-secondary-text)]">
                        {book.chapters[currentChapterIndex]?.label || 'Reading'}
                    </p>
                </div>
                <button onClick={() => setShowToc(true)} className="p-2 hover:bg-black/5 rounded-full"><IconMenu className="w-6 h-6" /></button>
            </header>

            <div 
                ref={containerRef}
                onClick={handleScreenClick}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className={`flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth ${!isScrollMode && pageTransition === 'next' ? '-translate-x-12 opacity-0 transition-all duration-300' : !isScrollMode && pageTransition === 'prev' ? 'translate-x-12 opacity-0 transition-all duration-300' : ''}`}
            >
                <div className="max-w-2xl mx-auto p-6 sm:p-12 font-serif text-[var(--text-color)] text-[var(--font-size)] leading-[var(--line-height)] reader-content select-text">
                    {isScrollMode ? (
                        // TikTok style continuous scrolling for all chapters
                        book.chapters.map((ch, idx) => (
                            <div 
                                key={ch.id} 
                                data-chapter-index={idx}
                                ref={el => chapterRefs.current[idx] = el}
                                className="mb-16 last:mb-0"
                            >
                                <div dangerouslySetInnerHTML={{ __html: ch.html || '' }} />
                                {idx < book.chapters.length - 1 && (
                                    <div className="my-20 h-px w-full bg-gradient-to-r from-transparent via-[var(--color-border-color)] to-transparent opacity-50" />
                                )}
                            </div>
                        ))
                    ) : (
                        // Paginated single chapter view
                        <div dangerouslySetInnerHTML={{ __html: book.chapters[currentChapterIndex]?.html || '' }} />
                    )}
                </div>
            </div>

            {/* Progress indicator */}
            <div className="h-1 bg-[var(--color-border-color)]">
                <div 
                    className="h-full bg-[var(--color-primary)] transition-all duration-300" 
                    style={{ width: `${((currentChapterIndex + 1) / (book.chapters.length || 1)) * 100}%` }} 
                />
            </div>

            {showToc && (
                <div className="fixed inset-0 z-[60] flex">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowToc(false)} />
                    <aside className="relative w-80 bg-[var(--bg-color)] h-full shadow-2xl flex flex-col animate-slide-in-right">
                        <header className="p-4 border-b border-[var(--color-border-color)] flex justify-between items-center font-sans">
                            <h3 className="font-bold">Contents</h3>
                            <button onClick={() => setShowToc(false)}><IconClose className="w-6 h-6" /></button>
                        </header>
                        <nav className="flex-1 overflow-y-auto p-4 space-y-1 font-sans">
                            {book.chapters.map((ch, idx) => (
                                <button 
                                    key={ch.id} 
                                    onClick={() => { 
                                        if (isScrollMode) {
                                            chapterRefs.current[idx]?.scrollIntoView({ behavior: 'smooth' });
                                        } else {
                                            setCurrentChapterIndex(idx);
                                        }
                                        setShowToc(false); 
                                    }} 
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
                    onQuote={() => { onSaveQuote(selection.text, book.chapters[currentChapterIndex]?.id || ''); setSelection(null); }}
                    onSearch={() => { onSearch(selection.text); setSelection(null); }}
                    onShare={() => { setShowShareDialog(selection.text); setSelection(null); }}
                />
            )}

            {showShareDialog && (
                <ShareDialog 
                    text={showShareDialog} 
                    bookTitle={book.title} 
                    author={book.author}
                    onClose={() => setShowShareDialog(null)} 
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
