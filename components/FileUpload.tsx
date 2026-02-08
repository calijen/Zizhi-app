import React from 'react';
import { IconClose, IconMicrophone, IconSpinner, IconPlay, IconLibrary } from './icons';
import type { Book, GenerationStatus } from '../types';

export interface BookCardData {
  id: string;
  title: string;
  author: string;
  coverImageUrl: string | null;
  progress: number;
  audioSummaryUrl?: string;
  genre?: string;
}

interface LibraryProps {
  books: BookCardData[];
  onBookSelect: (bookId: string) => void;
  isLoading: boolean;
  error: string | null;
  onDelete: (bookId: string) => void;
  onGenerateSummary: (bookId: string) => void;
  generationStatuses: Record<string, GenerationStatus>;
  onViewSummary: (bookId: string) => void;
  viewMode: 'grid' | 'list';
}

const BookCard: React.FC<{ 
    book: BookCardData; 
    onSelect: (id: string) => void; 
    onDelete: (id: string) => void;
    onGenerateSummary: (id: string) => void;
    onViewSummary: (id: string) => void;
    isGenerating?: boolean;
    viewMode: 'grid' | 'list';
}> = ({ book, onSelect, onDelete, onGenerateSummary, onViewSummary, isGenerating, viewMode }) => {

    const isList = viewMode === 'list';
    
    if (isList) {
        return (
            <div className={`flex bg-[var(--color-surface)] border border-[var(--color-border-color)] rounded-xl overflow-hidden h-44 shadow-sm group animate-fade-in relative ${isGenerating ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="w-32 flex-shrink-0 cursor-pointer bg-[var(--color-border-color)]/20" onClick={() => onSelect(book.id)}>
                    {book.coverImageUrl ? (
                        <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center p-4">
                             <IconLibrary className="w-8 h-8 opacity-20" />
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col p-4 min-w-0 border-l border-[var(--color-border-color)]">
                    <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onSelect(book.id)}>
                            <h3 className="text-base font-black text-[var(--color-primary-text)] truncate pr-4 leading-snug">{book.title}</h3>
                            <p className="text-xs text-[var(--color-secondary-text)] font-medium mt-0.5 truncate">{book.author}</p>
                        </div>
                        <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(book.id); }} 
                            aria-label="Remove book from shelf"
                            className="absolute top-2 right-2 p-1.5 text-[var(--color-secondary-text)] opacity-40 hover:opacity-100 hover:text-red-600 transition-all z-10"
                        >
                            <IconClose className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 flex items-center justify-between pr-2">
                         <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-secondary-text)] opacity-30">{book.genre}</span>
                         <span className="text-[10px] font-black text-[var(--color-secondary-text)] opacity-50">{Math.round(book.progress * 100)}%</span>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-[var(--color-border-color)]">
                        <button onClick={() => onSelect(book.id)} className="flex-1 py-2.5 bg-[var(--color-primary)] text-white text-[11px] font-black uppercase tracking-widest rounded-lg shadow-sm active:scale-95 transition-all">Read</button>
                        <button 
                            onClick={() => book.audioSummaryUrl ? onViewSummary(book.id) : onGenerateSummary(book.id)} 
                            className="flex-1 py-2.5 bg-transparent border border-[var(--color-border-color)] text-[var(--color-secondary-text)] text-[11px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-black/5 active:scale-95 transition-all"
                        >
                            {isGenerating ? <IconSpinner className="w-3.5 h-3.5" /> : (book.audioSummaryUrl ? <IconPlay className="w-3.5 h-3.5" /> : <IconMicrophone className="w-3.5 h-3.5" />)}
                            <span>Summary</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col bg-[var(--color-surface)] border border-[var(--color-border-color)] rounded-[1.5rem] overflow-hidden transition-all shadow-sm animate-fade-in relative ${isGenerating ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="relative aspect-[3/4.2] overflow-hidden cursor-pointer bg-black/5" onClick={() => onSelect(book.id)}>
                {book.coverImageUrl ? (
                    <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10"><IconLibrary className="w-12 h-12" /></div>
                )}
                <div className="absolute top-3 right-10 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-black text-white">{Math.round(book.progress * 100)}%</div>
                <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(book.id); }} 
                    aria-label="Remove book from shelf"
                    className="absolute top-3 right-3 p-1.5 bg-black/20 text-white rounded-full hover:bg-red-500 transition-all z-10"
                >
                    <IconClose className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="p-4 flex flex-col gap-3">
                <div className="min-w-0" onClick={() => onSelect(book.id)}>
                    <h3 className="font-bold text-sm leading-tight truncate text-[var(--color-primary-text)]">{book.title}</h3>
                    <p className="text-[10px] text-[var(--color-secondary-text)] truncate mt-1 uppercase tracking-widest font-bold opacity-50">{book.author}</p>
                </div>
                <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-primary)] transition-all duration-700" style={{ width: `${Math.max(book.progress * 100, 2)}%` }} />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onSelect(book.id)} className="flex-1 py-2 bg-[var(--color-primary)] text-white text-[10px] font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all">Read</button>
                    <button onClick={() => book.audioSummaryUrl ? onViewSummary(book.id) : onGenerateSummary(book.id)} className="px-3 py-2 bg-black/[0.04] text-[var(--color-secondary-text)] rounded-xl hover:bg-black/5 transition-all">
                        {isGenerating ? <IconSpinner className="w-3.5 h-3.5" /> : (book.audioSummaryUrl ? <IconPlay className="w-3.5 h-3.5" /> : <IconMicrophone className="w-3.5 h-3.5" />)}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Library: React.FC<LibraryProps> = ({ books, onBookSelect, isLoading, onDelete, onGenerateSummary, generationStatuses, onViewSummary, viewMode }) => {
  return (
    <div className="p-4 sm:p-8">
        {isLoading && (
          <div className="mb-8 flex flex-col items-center justify-center p-12 bg-black/5 rounded-2xl border-2 border-dashed border-[var(--color-border-color)]">
            <IconSpinner className="w-6 h-6 text-[var(--color-primary)] mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Synchronizing Stories...</span>
          </div>
        )}
        {!isLoading && books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <IconLibrary className="w-16 h-16 mb-4 text-[var(--color-primary-text)] opacity-10" />
            <p className="theme-serif text-xl font-black text-[var(--color-primary-text)] opacity-30 italic">Capture your first story by uploading an EPUB.</p>
          </div>
        )}
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6' : 'flex flex-col gap-4 max-w-2xl mx-auto'}>
            {books.map(book => (
                <BookCard 
                    key={book.id} 
                    book={book} 
                    onSelect={onBookSelect} 
                    onDelete={onDelete} 
                    onGenerateSummary={onGenerateSummary} 
                    onViewSummary={onViewSummary} 
                    isGenerating={!!generationStatuses[book.id]} 
                    viewMode={viewMode} 
                />
            ))}
        </div>
    </div>
  );
};
export default Library;