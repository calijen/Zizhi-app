

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
            className="bg-background border border-border-color rounded-lg shadow-sm transition-shadow duration-300 overflow-hidden flex flex-row sm:flex-col group text-primary-text"
            aria-label={`${book.title} by ${book.author}`}
        >
            <div className="relative w-1/3 sm:w-full flex-shrink-0 aspect-[3/4] bg-border-color/10">
                {book.coverImageUrl ? (
                    <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-center text-secondary-text/50 p-2">
                        <span className="text-sm font-serif">{book.title}</span>
                    </div>
                )}
            </div>
            <div className="w-2/3 sm:w-full flex flex-col flex-grow justify-between border-l sm:border-l-0 border-border-color/50">
                <div className="p-3 flex flex-col w-full space-y-2 flex-grow">
                    <div className="flex justify-between items-start gap-2">
                         <h3 className="font-bold text-md truncate flex-grow" title={book.title}>{book.title}</h3>
                         <button
                            onClick={handleDelete}
                            className="p-1 -mr-2 -mt-1 flex-shrink-0 text-secondary-text/50 hover:text-primary transition-colors z-10"
                            title="Delete book"
                            aria-label={`Delete ${book.title}`}
                         >
                            <IconClose className="w-4 h-4" />
                         </button>
                    </div>
                    <p className="text-sm text-secondary-text truncate" title={book.author}>{book.author || 'Unknown Author'}</p>
                    <div className="pt-1">
                        <div className="w-full bg-border-color/30 rounded-full h-1.5">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${book.progress * 100}%` }}></div>
                        </div>
                        <p className="text-xs text-right mt-1 text-secondary-text">{Math.round(book.progress * 100)}%</p>
                    </div>
                </div>
                <div className="p-3 pt-0 border-t border-border-color/50 sm:mt-2 grid grid-cols-2 gap-2 text-sm font-medium">
                    <button 
                        onClick={() => onSelect(book.id)}
                        className="w-full py-2 px-3 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors text-center"
                    >
                        Read
                    </button>
                    <div className="relative">
                        {isGenerating ? (
                            <button className="w-full py-2 px-3 bg-secondary-text/10 text-secondary-text rounded-md transition-colors flex items-center justify-center gap-2" disabled>
                                <IconSpinner className="w-4 h-4" />
                                <span>Creating...</span>
                            </button>
                        ) : book.audioTrailerUrl ? (
                             <button 
                                onClick={() => onViewTrailer(book.id)}
                                className="w-full py-2 px-3 bg-secondary-text/10 text-secondary-text rounded-md hover:bg-secondary-text/20 transition-colors flex items-center justify-center gap-2"
                             >
                                <IconPlay className="w-4 h-4" />
                                <span>Play</span>
                             </button>
                        ) : (
                            <button 
                                onClick={() => onGenerateTrailer(book.id)}
                                className="w-full py-2 px-3 bg-secondary-text/10 text-secondary-text rounded-md hover:bg-secondary-text/20 transition-colors flex items-center justify-center gap-2"
                            >
                                <IconMicrophone className="w-4 h-4" />
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
    <div className="p-4 sm:p-6 lg:p-8">
        {isLoading && (
          <div className="mt-4 flex items-center justify-center space-x-2 text-lg">
            <div className="w-6 h-6 rounded-full animate-spin border-2 border-solid border-primary border-t-transparent"></div>
            <span>Processing book...</span>
          </div>
        )}
        {error && (
          <div className="my-4 text-red-900 bg-red-100 border border-red-300 rounded-md p-3 text-center">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!isLoading && books.length === 0 && (
          <div className="flex items-center justify-center h-full text-center py-16">
            <p className="text-xl text-secondary-text">Your library is empty.</p>
          </div>
        )}
        
        {books.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
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