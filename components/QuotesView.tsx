import React, { useState, useMemo } from 'react';
import type { Quote, Theme } from '../types';
import { IconTrash, IconSearch, IconQuote, IconShare } from './icons';
import ShareDialog from './ShareDialog';

interface QuotesViewProps {
  quotes: Quote[];
  theme: Theme;
  onDelete: (id: string) => void;
  onGoToQuote: (quote: Quote) => void;
}

const QuotesView: React.FC<QuotesViewProps> = ({ quotes, theme, onDelete, onGoToQuote }) => {
  const [sortBy, setSortBy] = useState<'date' | 'book'>('date');
  const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBook, setFilterBook] = useState('all');
  const [activeShare, setActiveShare] = useState<Quote | null>(null);

  const uniqueBooks = useMemo(() => {
    const books = new Set(quotes.map(q => q.bookTitle));
    return Array.from(books).sort();
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
        const matchesSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             q.author.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBook = filterBook === 'all' || q.bookTitle === filterBook;
        return matchesSearch && matchesBook;
    });
  }, [quotes, searchQuery, filterBook]);

  const toggleExpanded = (id: string) => {
    setExpandedQuotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const QuoteItem: React.FC<{ quote: Quote }> = ({ quote }) => {
    const isExpanded = expandedQuotes.has(quote.id);
    const words = quote.text.trim().split(/\s+/);
    const needsTruncation = words.length > 50;
    const displayText = needsTruncation && !isExpanded ? words.slice(0, 50).join(' ') + '...' : quote.text;

    return (
        <div className="py-8 border-b border-[var(--color-border-color)] last:border-b-0 animate-fade-in group">
            <div className="text-xs text-[var(--color-secondary-text)] mb-3 flex items-center justify-between">
                <div>
                   <span className="font-black text-[var(--color-primary-text)] uppercase tracking-widest">{quote.author}</span>
                   <span className="opacity-40 font-bold uppercase tracking-widest text-[9px] ml-2">from {quote.bookTitle}</span>
                </div>
            </div>
            <p 
              className={`text-lg text-[var(--color-primary-text)] font-serif leading-relaxed whitespace-pre-wrap ${quote.location ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={() => quote.location && onGoToQuote(quote)}
            >
                {displayText}
            </p>
            {needsTruncation && (
                <button onClick={() => toggleExpanded(quote.id)} className="text-[var(--color-primary)] font-black uppercase tracking-widest mt-4 text-[9px] bg-black/5 px-3 py-1.5 rounded-full border border-black/5">
                    {isExpanded ? 'Collapse' : 'Expand'}
                </button>
            )}
            <div className="w-full flex items-center justify-end gap-6 mt-6 opacity-40 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveShare(quote); }} 
                    className="flex items-center gap-1.5 text-[var(--color-secondary-text)] hover:text-[var(--color-primary)] transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                    <IconShare className="w-4 h-4" />
                    <span>share</span>
                </button>
                <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(quote.id); }} 
                    aria-label="Delete quote"
                    className="flex items-center gap-1.5 text-[var(--color-secondary-text)] hover:text-red-600 transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                    <IconTrash className="w-4 h-4" />
                    <span>delete</span>
                </button>
            </div>
        </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
              <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
              <input 
                type="text" placeholder="Search quotes" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--color-background)] border border-[var(--color-border-color)] rounded-2xl py-3 pl-12 pr-4 text-[11px] font-black uppercase tracking-widest focus:border-[var(--color-primary)] outline-none"
              />
          </div>
          <select 
            value={filterBook} onChange={(e) => setFilterBook(e.target.value)}
            className="bg-[var(--color-background)] border border-[var(--color-border-color)] rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-widest focus:border-[var(--color-primary)] outline-none"
          >
              <option value="all">all books</option>
              {uniqueBooks.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
      </div>

      <div className="flex items-center justify-end gap-4">
        <div className="flex items-center border border-[var(--color-border-color)] rounded-full overflow-hidden bg-[var(--color-background)]">
          <button onClick={() => setSortBy('date')} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === 'date' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-secondary-text)] hover:bg-black/5'}`}>date</button>
          <button onClick={() => setSortBy('book')} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all border-l border-[var(--color-border-color)] ${sortBy === 'book' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-secondary-text)] hover:bg-black/5'}`}>book</button>
        </div>
      </div>
      
      <div className="bg-[var(--color-background)] border border-[var(--color-border-color)] rounded-[2.5rem] px-8 sm:px-12 shadow-sm min-h-[500px]">
        {filteredQuotes.length === 0 ? (
            <div className="py-40 flex flex-col items-center justify-center text-center">
                <IconQuote className="w-16 h-16 mb-8 text-[var(--color-primary)] opacity-10" />
                <p className="text-xl font-black text-[var(--color-primary-text)] opacity-30 italic theme-serif">
                    Nothing found.
                </p>
            </div>
        ) : sortBy === 'date' ? (
            filteredQuotes.map(quote => <QuoteItem key={quote.id} quote={quote} />)
        ) : (
            Object.entries(filteredQuotes.reduce((acc, q) => {
              const key = q.bookTitle || 'Unknown';
              (acc[key] = acc[key] || []).push(q);
              return acc;
            }, {} as Record<string, Quote[]>)).map(([bookTitle, qs]) => (
              <div key={bookTitle} className="py-10 border-b border-[var(--color-border-color)] last:border-b-0">
                  <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[var(--color-primary)] pb-4 mb-6 border-b border-black/5">
                      {bookTitle}
                  </h2>
                  <div className="space-y-4">
                    {(qs as Quote[]).map(quote => <QuoteItem key={quote.id} quote={quote} />)}
                  </div>
              </div>
            ))
        )}
       </div>

       {activeShare && (
           <ShareDialog 
              text={activeShare.text} 
              bookTitle={activeShare.bookTitle} 
              author={activeShare.author} 
              theme={theme} 
              onClose={() => setActiveShare(null)} 
           />
       )}
    </div>
  );
};

export default QuotesView;