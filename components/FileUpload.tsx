
import React from 'react';
import { IconClose, IconMicrophone, IconSpinner, IconPlay } from './icons';

export interface BookCardData {
  id: string;
  title: string;
  author: string;
  coverImageUrl: string | null;
  progress: number;
  audioTrailerUrl?: string;
}

interface LibraryProps {
  books: BookCardData[];
  onBookSelect: (bookId: string) => void;
  isLoading: boolean;
  error: string | null;
  onDelete: (bookId: string) => void;
  onGenerateTrailer: (bookId: string) => void;
  generatingTrailerForBookId: string | null;
  onViewTrailer: (bookId: string) => void;
}

const BookCard: React.FC<{ 
    book: BookCardData; 
    onSelect: (id: string) => void; 
    onDelete: (id: string) => void;
    onGenerateTrailer: (id: string) => void;
    onViewTrailer: (id: string) => void;
    isGenerating: boolean;
}> = ({ book, onSelect, onDelete, onGenerateTrailer, onViewTrailer, isGenerating }) => {

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(book.id);
    };
    
    return (
        <div 
            className="bg-[var(--color-background)] border border-[var(--color-border-color)] rounded-lg shadow-sm transition-shadow duration-300 overflow-hidden flex flex-row group text-[var(--color-primary-text)] h-full"
            aria-label={`${book.title} by ${book.author}`}
        >
            <div className="relative w-1/3 flex-shrink-0 aspect-[2/3] bg-[rgba(var(--color-border-color-rgb),0.5)]">
                {book.coverImageUrl ? (
                    <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-center text-[rgba(var(--color-secondary-text-rgb),0.5)] p-2">
                        <span className="text-xs sm:text-sm font-serif break-words">{book.title}</span>
                    </div>
                )}
            </div>
            <div className="w-2/3 flex flex-col flex-grow justify-between border-l border-[rgba(var(--color-border-color-rgb),0.5)]">
                <div className="p-3 flex flex-col w-full space-y-1 flex-grow overflow-hidden">
                    <div className="flex justify-between items-start gap-2">
                         <h3 className="font-bold text-base sm:text-lg leading-tight truncate flex-grow" title={book.title}>{book.title}</h3>
                         <button
                            onClick={handleDelete}
                            className="p-1 -mr-2 -mt-1 flex-shrink-0 text-[rgba(var(--color-secondary-text-rgb),0.5)] hover:text-[var(--color-primary)] transition-colors z-10"
                            title="Delete book"
                            aria-label={`Delete ${book.title}`}
                         >
                            <IconClose className="w-4 h-4" />
                         </button>
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--color-secondary-text)] truncate" title={book.author}>{book.author || 'Unknown Author'}</p>
                    <div className="pt-2 mt-auto">
                        <div className="w-full bg-[rgba(var(--color-border-color-rgb),0.3)] rounded-full h-1">
                            <div className="bg-[var(--color-primary)] h-1 rounded-full" style={{ width: `${book.progress * 100}%` }}></div>
                        </div>
                        <p className="text-[10px] text-right mt-1 text-[var(--color-secondary-text)]">{Math.round(book.progress * 100)}%</p>
                    </div>
                </div>
                <div className="p-3 pt-0 border-t border-[rgba(var(--color-border-color-rgb),0.5)] grid grid-cols-2 gap-2 text-xs sm:text-sm font-medium">
                    <button 
                        onClick={() => onSelect(book.id)}
                        className="w-full py-2 px-2 bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)] rounded-md hover:bg-[rgba(var(--color-primary-rgb),0.2)] transition-colors text-center truncate"
                    >
                        Read
                    </button>
                    <div className="relative">
                        {isGenerating ? (
                            <button className="w-full py-2 px-2 bg-[rgba(var(--color-secondary-text-rgb),0.1)] text-[var(--color-secondary-text)] rounded-md transition-colors flex items-center justify-center gap-1 truncate" disabled>
                                <IconSpinner className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Creating...</span>
                            </button>
                        ) : book.audioTrailerUrl ? (
                             <button 
                                onClick={() => onViewTrailer(book.id)}
                                className="w-full py-2 px-2 bg-[rgba(var(--color-secondary-text-rgb),0.1)] text-[var(--color-secondary-text)] rounded-md hover:bg-[rgba(var(--color-secondary-text-rgb),0.2)] transition-colors flex items-center justify-center gap-1 truncate"
                             >
                                <IconPlay className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Play</span>
                             </button>
                        ) : (
                            <button 
                                onClick={() => onGenerateTrailer(book.id)}
                                className="w-full py-2 px-2 bg-[rgba(var(--color-secondary-text-rgb),0.1)] text-[var(--color-secondary-text)] rounded-md hover:bg-[rgba(var(--color-secondary-text-rgb),0.2)] transition-colors flex items-center justify-center gap-1 truncate"
                            >
                                <IconMicrophone className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Trailer</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


const Library: React.FC<LibraryProps> = ({ books, onBookSelect, isLoading, error, onDelete, onGenerateTrailer, generatingTrailerForBookId, onViewTrailer }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full">
        {isLoading && (
          <div className="mt-4 flex items-center justify-center space-x-2 text-lg">
            <div className="w-6 h-6 rounded-full animate-spin border-2 border-solid border-[var(--color-primary)] border-t-transparent"></div>
            <span>Processing book...</span>
          </div>
        )}
        {error && (
          <div className="my-4 text-red-900 bg-red-100 border border-red-300 rounded-md p-3 text-center">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!isLoading && books.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-20 px-4">
            <div className="w-64 h-64 text-[var(--color-border-color)] mb-8 opacity-80">
              <svg 
                viewBox="0 0 240 240" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-full h-full" 
                stroke="currentColor" 
                strokeWidth="1.2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {/* Left Page */}
                <path d="M120 50 L60 60 C 50 62 45 70 45 80 L 45 180 C 45 190 50 198 60 196 L 120 186" />
                {/* Right Page */}
                <path d="M120 50 L180 60 C 190 62 195 70 195 80 L 195 180 C 195 190 190 198 180 196 L 120 186" />
                {/* Spine */}
                <path d="M120 50 V 186" />
                
                {/* Abstract Text Lines - Left */}
                <path d="M65 80 H 105" opacity="0.4"/>
                <path d="M65 95 H 105" opacity="0.4"/>
                <path d="M65 110 H 105" opacity="0.4"/>
                <path d="M65 125 H 95" opacity="0.4"/>
                
                {/* Abstract Text Lines - Right */}
                <path d="M135 80 H 175" opacity="0.4"/>
                <path d="M135 95 H 175" opacity="0.4"/>
                <path d="M135 110 H 175" opacity="0.4"/>
                <path d="M135 125 H 165" opacity="0.4"/>

                {/* Floating Particles/Dust Motes */}
                <circle cx="120" cy="40" r="1.5" fill="currentColor" opacity="0.6"/>
                <circle cx="180" cy="50" r="1" fill="currentColor" opacity="0.4"/>
                <circle cx="60" cy="50" r="1" fill="currentColor" opacity="0.4"/>
                <circle cx="90" cy="30" r="0.8" fill="currentColor" opacity="0.3"/>
                <circle cx="150" cy="35" r="0.8" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            <h3 className="text-2xl font-serif font-medium text-[var(--color-primary-text)] mb-3">Your library awaits</h3>
            <p className="max-w-md text-[var(--color-secondary-text)] leading-relaxed text-base">
              Upload an EPUB file to begin your reading journey.<br/>
              <span className="text-sm opacity-70 mt-2 block">Download e-books from sources like Welib or OceanPdf.</span>
            </p>
          </div>
        )}
        
        {books.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {books.map(book => (
              <BookCard 
                key={book.id} 
                book={book} 
                onSelect={onBookSelect} 
                onDelete={onDelete} 
                onGenerateTrailer={onGenerateTrailer}
                onViewTrailer={onViewTrailer}
                isGenerating={generatingTrailerForBookId === book.id}
              />
            ))}
          </div>
        )}
    </div>
  );
};

export default Library;
