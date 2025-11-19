
import React, { useState, useMemo } from 'react';
import type { Quote } from '../types';
import { IconDownload, IconTrash } from './icons';

interface QuotesViewProps {
  quotes: Quote[];
  onDelete: (id: string) => void;
  onShare: (quote: Quote) => void;
  onGenerateImage: (quote: Quote) => void;
  onGoToQuote: (quote: Quote) => void;
}

const QuotesView: React.FC<QuotesViewProps> = ({ quotes, onDelete, onShare, onGenerateImage, onGoToQuote }) => {
  const [sortBy, setSortBy] = useState<'date' | 'book'>('date');
  const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedQuotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const groupedByBook = useMemo(() => {
    if (sortBy !== 'book') return null;
    const grouped = quotes.reduce((acc, quote) => {
      const key = quote.bookTitle || 'Unknown Book';
      (acc[key] = acc[key] || []).push(quote);
      return acc;
    }, {} as { [key: string]: Quote[] });
    
    // Sort books by title
    return Object.keys(grouped).sort().reduce(
        (obj, key) => { 
            obj[key] = grouped[key]; 
            return obj;
        }, 
        {} as {[key: string]: Quote[]}
    );
  }, [quotes, sortBy]);

  const sortedByDate = useMemo(() => {
    if (sortBy !== 'date') return [];
    return [...quotes].sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
  }, [quotes, sortBy]);

  const QuoteItem: React.FC<{ quote: Quote }> = ({ quote }) => {
    const isExpanded = expandedQuotes.has(quote.id);
    const words = quote.text.trim().split(/\s+/);
    const wordCount = words.length;
    const isTooLongForImage = wordCount > 100;
    const needsTruncation = wordCount > 50;
    const displayText = needsTruncation && !isExpanded ? words.slice(0, 50).join(' ') + '...' : quote.text;

    return (
        <div className="py-8 border-b border-[var(--color-border-color)] last:border-b-0">
            <div className="text-sm text-[var(--color-secondary-text)] mb-3">
                <span className="font-semibold text-[var(--color-primary-text)]">{quote.author}</span> in <span className="italic">{quote.bookTitle}</span>
            </div>
            <p 
              className={`text-lg text-[var(--color-primary-text)] font-serif leading-relaxed whitespace-pre-wrap ${quote.location ? 'cursor-pointer' : ''}`}
              onClick={() => quote.location && onGoToQuote(quote)}
              title={quote.location ? "View in book" : "Location not available for this quote"}
            >
                {displayText}
            </p>
            {needsTruncation && (
                <button onClick={() => toggleExpanded(quote.id)} className="text-[var(--color-primary)] font-semibold mt-2 text-sm">
                    {isExpanded ? 'Show less' : 'Read more'}
                </button>
            )}
            <div className="flex items-center justify-end gap-6 mt-5">
                <button 
                    onClick={() => onGenerateImage(quote)} 
                    title={isTooLongForImage ? "Quote is too long to download as an image (max 100 words)" : "Download as image"}
                    disabled={isTooLongForImage}
                    className={`flex items-center gap-1.5 text-[var(--color-secondary-text)] hover:text-[var(--color-primary)] transition-colors text-sm font-medium ${isTooLongForImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <IconDownload className="w-4 h-4" />
                    <span>Download</span>
                </button>
                <button onClick={() => onDelete(quote.id)} className="flex items-center gap-1.5 text-[var(--color-secondary-text)] hover:text-red-600 transition-colors text-sm font-medium">
                    <IconTrash className="w-4 h-4" />
                    <span>Delete</span>
                </button>
            </div>
        </div>
    );
  };

  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
        <div className="w-24 h-24 text-[var(--color-border-color)]">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M12 11C12 9.34315 13.3431 8 15 8H33C34.6569 8 36 9.34315 36 11V37C36 38.6569 34.6569 40 33 40H15C13.3431 40 12 38.6569 12 37V11Z" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M20 18H28" stroke="currentColor" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round"/>
            <path d="M20 26H28" stroke="currentColor" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round"/>
            <rect x="18" y="24" width="12" height="4" fill="var(--color-secondary)" fillOpacity="0.3"/>
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-[var(--color-primary-text)]">Your quotes will appear here</h3>
        <p className="max-w-md text-[var(--color-secondary-text)]">
          To save a quote, highlight text while reading a book and select the 'Quote' option.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-end mb-4">
        <span className="text-sm text-[var(--color-secondary-text)] mr-2">Sort by:</span>
        <div className="flex items-center border border-[var(--color-border-color)] rounded-md bg-[var(--color-background)]">
          <button 
            onClick={() => setSortBy('date')} 
            className={`px-3 py-1 text-sm rounded-l-md transition-colors ${sortBy === 'date' ? 'bg-[rgba(var(--color-border-color-rgb),0.2)] text-[var(--color-primary-text)] font-semibold' : 'text-[var(--color-secondary-text)] hover:bg-[rgba(var(--color-border-color-rgb),0.1)]'}`}
          >
            Date
          </button>
          <button 
            onClick={() => setSortBy('book')} 
            className={`px-3 py-1 text-sm rounded-r-md transition-colors border-l border-[var(--color-border-color)] ${sortBy === 'book' ? 'bg-[rgba(var(--color-border-color-rgb),0.2)] text-[var(--color-primary-text)] font-semibold' : 'text-[var(--color-secondary-text)] hover:bg-[rgba(var(--color-border-color-rgb),0.1)]'}`}
          >
            Book
          </button>
        </div>
      </div>
      
      <div className="bg-[var(--color-background)] border border-[var(--color-border-color)] rounded-lg px-4 sm:px-8">
        {sortBy === 'date' && sortedByDate.map(quote => <QuoteItem key={quote.id} quote={quote} />)}
        
        {sortBy === 'book' && groupedByBook && Object.keys(groupedByBook).map((bookTitle) => {
            const bookQuotes = groupedByBook[bookTitle];
            return (
              <div key={bookTitle} className="py-8 border-b border-[var(--color-border-color)] last:border-b-0">
                  <h2 className="text-xl font-bold font-sans text-[var(--color-primary-text)] pb-4 mb-4 border-b border-[var(--color-border-color)]">
                      From <span className="italic">{bookTitle}</span>
                  </h2>
                  <div className="space-y-8 divide-y divide-[var(--color-border-color)]">
                    {bookQuotes.map(quote => <QuoteItem key={quote.id} quote={quote} />)}
                  </div>
              </div>
            );
        })}
       </div>
    </div>
  );
};

export default QuotesView;
