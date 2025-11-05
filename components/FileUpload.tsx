import React from 'react';
import { IconClose } from './icons';

export interface BookCardData {
  id: string;
  title: string;
  author: string;
  coverImageUrl: string | null;
  progress: number;
}

interface LibraryProps {
  books: BookCardData[];
  onBookSelect: (bookId: string) => void;
  isLoading: boolean;
  error: string | null;
  onDelete: (bookId: string) => void;
}

const BookCard: React.FC<{ book: BookCardData; onSelect: (id: string) => void; onDelete: (id: string) => void; }> = ({ book, onSelect, onDelete }) => {
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(book.id);
    };
    
    return (
        <div 
            onClick={() => onSelect(book.id)}
            className="bg-background border border-border-color rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer overflow-hidden flex flex-row sm:flex-col items-center sm:items-stretch group text-primary-text"
            aria-label={`Read ${book.title}`}
        >
            <div className="relative w-1/5 sm:w-full flex-shrink-0 aspect-[2/3] bg-border-color/10">
                {book.coverImageUrl ? (
                    <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-center text-secondary-text/50 p-2">
                        <span className="text-sm font-serif">{book.title}</span>
                    </div>
                )}
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <p className="text-white font-bold text-lg">Read</p>
                </div>
            </div>
            <div className="p-3 flex flex-col justify-center flex-grow w-4/5 sm:w-full space-y-2">
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
        </div>
    );
};


const Library: React.FC<LibraryProps> = ({ books, onBookSelect, isLoading, error, onDelete }) => {
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
              <BookCard key={book.id} book={book} onSelect={onBookSelect} onDelete={onDelete} />
            ))}
          </div>
        )}
    </div>
  );
};

export default Library;