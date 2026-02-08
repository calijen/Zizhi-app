import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import type { Book, Chapter, Theme } from '../types';
import { IconChevronLeft, IconMenu, IconClose, Logo, IconSpinner } from './icons';
import TextSelectionPopup from './TextSelectionPopup';
import ShareDialog from './ShareDialog';

interface ReaderViewProps {
    book: Book;
    theme: Theme;
    initialChapterId?: string | null;
    onClose: () => void;
    onUpdateProgress: (bookId: string, chapterIndex: number, scrollTop: number, timeSpent: number) => void;
    onSaveQuote: (text: string, chapterId: string) => void;
    onSearch: (query: string) => void;
}

const ChapterContent = memo(({ html, className }: { html: string, className: string }) => (
    <div 
        dangerouslySetInnerHTML={{ __html: html }} 
        className={className} 
    />
));

const ReaderView: React.FC<ReaderViewProps> = ({ book, theme, initialChapterId, onClose, onUpdateProgress, onSaveQuote, onSearch }) => {
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const [showToc, setShowToc] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selection, setSelection] = useState<{ text: string, rect: DOMRect } | null>(null);
    const [showShareDialog, setShowShareDialog] = useState<string | null>(null);
    const [isPreparing, setIsPreparing] = useState(true);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const pointerStart = useRef<{ x: number, y: number, time: number } | null>(null);

    const isScrollMode = theme.readingMode === 'scroll';

    const updateSelectionUI = useCallback(() => {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const text = sel.toString().trim();
            if (text.length > 0) {
                const rect = range.getBoundingClientRect();
                setSelection({ text, rect });
            }
        } else {
            setSelection(null);
        }
    }, []);

    useEffect(() => {
        let debounce: number;
        const onSelectionChange = () => {
            clearTimeout(debounce);
            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) {
                setSelection(null);
            } else {
                debounce = window.setTimeout(updateSelectionUI, 200);
            }
        };
        document.addEventListener('selectionchange', onSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', onSelectionChange);
            clearTimeout(debounce);
        };
    }, [updateSelectionUI]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('.selection-popup') || (e.target as HTMLElement).closest('header')) return;
        pointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!pointerStart.current || isScrollMode) return;
        const deltaX = e.clientX - pointerStart.current.x;
        const deltaY = e.clientY - pointerStart.current.y;
        const duration = Date.now() - pointerStart.current.time;
        const sel = window.getSelection();
        const hasHighlight = sel && !sel.isCollapsed;

        if (!hasHighlight && Math.abs(deltaX) > 60 && Math.abs(deltaY) < 40 && duration < 300) {
            if (deltaX < 0) {
                if (currentPage < totalPages - 1) setCurrentPage(prev => prev + 1);
                else if (currentChapterIndex < book.chapters.length - 1) { setCurrentPage(0); setCurrentChapterIndex(prev => prev + 1); }
            } else {
                if (currentPage > 0) setCurrentPage(prev => prev - 1);
                else if (currentChapterIndex > 0) { setCurrentPage(-1); setCurrentChapterIndex(prev => prev - 1); }
            }
        }
        pointerStart.current = null;
    };

    const goToChapter = (index: number) => {
        setCurrentChapterIndex(index);
        setCurrentPage(0);
        if (isScrollMode && scrollContainerRef.current) {
            const chapterEl = scrollContainerRef.current.querySelector(`[data-chapter-index="${index}"]`);
            if (chapterEl) chapterEl.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        if (isScrollMode) { setIsPreparing(false); return; }
        const calcPages = () => {
            if (containerRef.current) {
                const viewWidth = containerRef.current.clientWidth;
                const fullWidth = containerRef.current.scrollWidth;
                const total = Math.max(1, Math.round(fullWidth / viewWidth));
                setTotalPages(total);
                if (currentPage === -1) setCurrentPage(total - 1);
                else if (currentPage >= total) setCurrentPage(Math.max(0, total - 1));
                setIsPreparing(false);
            }
        };
        const timeout = setTimeout(calcPages, 200); 
        window.addEventListener('resize', calcPages);
        return () => { window.removeEventListener('resize', calcPages); clearTimeout(timeout); };
    }, [isScrollMode, currentChapterIndex, book.chapters, currentPage, theme.fontSize, theme.lineHeight]);

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
    } as React.CSSProperties;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-color)] animate-fade-in overflow-hidden reader-surface" style={styleVariables}>
            {isPreparing && (
                <div className="absolute inset-0 bg-[var(--bg-color)] z-[60] flex flex-col items-center justify-center">
                    <IconSpinner className="w-8 h-8 text-[var(--accent-color)] mb-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Engraving Perspective...</span>
                </div>
            )}

            <header className="h-16 border-b border-[var(--border-color)] flex items-center justify-between px-4 bg-[var(--bg-color)] z-[70] shadow-sm flex-none select-none pointer-events-auto">
                <button 
                  onClick={(e) => { e.stopPropagation(); onClose(); }} 
                  className="p-2 text-[var(--text-color)] hover:bg-black/5 rounded-full transition-colors relative z-[80] pointer-events-auto"
                >
                  <IconChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex-1 text-center truncate px-4">
                    <Logo className="h-6 w-auto mx-auto mb-0.5 text-[var(--text-color)]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--sec-text)] opacity-90">
                        {book.chapters[currentChapterIndex]?.label || 'Reading'}
                    </p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowToc(true); }} 
                  className="p-2 text-[var(--text-color)] hover:bg-black/5 rounded-full transition-colors relative z-[80] pointer-events-auto"
                >
                  <IconMenu className="w-6 h-6" />
                </button>
            </header>

            {isScrollMode ? (
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar relative select-text">
                    <div className="max-w-2xl mx-auto p-8 sm:p-14 font-serif text-[var(--text-color)]">
                        {book.chapters.map((chapter, idx) => (
                            <section key={chapter.id} data-chapter-index={idx} className="epub-chapter-section mb-20 last:mb-0">
                                <ChapterContent html={chapter.html} className="epub-content" />
                            </section>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-1 relative overflow-hidden" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
                    <div ref={containerRef} className="h-full px-8 py-12 transition-transform duration-500 ease-out select-text"
                        style={{ 
                            columnWidth: 'calc(100vw - 4rem)', columnGap: '4rem', columnFill: 'auto',
                            transform: `translateX(-${currentPage * 100}%)`, width: '100%', height: '100%',
                            display: 'block'
                        }}
                    >
                        <div className="font-serif text-[var(--text-color)] h-full overflow-visible">
                            <ChapterContent html={book.chapters[currentChapterIndex]?.html || ''} className="epub-content h-full" />
                        </div>
                    </div>
                </div>
            )}

            {selection && (
                <TextSelectionPopup 
                    rect={selection.rect}
                    onCopy={() => { navigator.clipboard.writeText(selection.text); setSelection(null); window.getSelection()?.removeAllRanges(); }}
                    onQuote={() => { onSaveQuote(selection.text, book.chapters[currentChapterIndex].id); setSelection(null); window.getSelection()?.removeAllRanges(); }}
                    onSearch={() => { onSearch(selection.text); setSelection(null); window.getSelection()?.removeAllRanges(); }}
                    onShare={() => { setShowShareDialog(selection.text); setSelection(null); window.getSelection()?.removeAllRanges(); }}
                />
            )}

            {showToc && (
                <div className="fixed inset-0 z-[120] flex">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowToc(false)} />
                    <aside className="relative w-80 bg-[var(--bg-color)] h-full shadow-2xl flex flex-col animate-slide-in-right border-r border-[var(--border-color)]">
                        <header className="p-5 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-color)]">
                            <h3 className="font-black uppercase tracking-[0.3em] text-[var(--text-color)] text-xs">Navigation</h3>
                            <button onClick={() => setShowToc(false)} className="text-[var(--text-color)] hover:bg-black/5 rounded-full p-1"><IconClose className="w-6 h-6" /></button>
                        </header>
                        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                            {book.toc.map((item, idx) => (
                                <button key={idx} onClick={() => { goToChapter(idx); setShowToc(false); }} 
                                    className={`w-full text-left p-4 rounded-xl text-xs font-black tracking-tight transition-all border ${idx === currentChapterIndex ? 'bg-[var(--accent-color)] text-white shadow-md border-[var(--accent-color)]' : 'text-[var(--text-color)] hover:bg-black/5 border-transparent opacity-100'}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </aside>
                </div>
            )}

            {showShareDialog && <ShareDialog text={showShareDialog} bookTitle={book.title} author={book.author} theme={theme} onClose={() => setShowShareDialog(null)} />}

            <style>{`
                .epub-content p { font-size: var(--font-size) !important; line-height: var(--line-height) !important; margin-bottom: 1.5rem; text-align: justify; break-inside: avoid-column; }
                .epub-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 1.5rem 0; border: 1px solid var(--border-color); break-inside: avoid; }
                .epub-content h1, .epub-content h2, .epub-content h3 { font-family: var(--font-sans); color: var(--text-color); margin: 2.5rem 0 1.25rem 0; font-weight: 900; line-height: 1.2; text-transform: uppercase; letter-spacing: 0.05em; break-after: avoid; }
                @keyframes slide-in-right { from { transform: translateX(-100%); } to { transform: translateX(0); } }
                .animate-slide-in-right { animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
            `}</style>
        </div>
    );
};
export default ReaderView;