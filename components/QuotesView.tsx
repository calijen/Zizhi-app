
import React, { useState, useMemo } from 'react';
import { Text, Group, ActionIcon, Box } from '@mantine/core';
import type { Quote, Theme, Book } from '../types';
import { IconTrash, IconSearch, IconShare } from './icons';
import ShareDialog from './ShareDialog';

interface QuotesViewProps {
  quotes: Quote[];
  library?: Book[];
  theme: Theme;
  onDelete: (id: string) => void;
  onGoToQuote: (quote: Quote) => void;
}

const QuoteCard: React.FC<{ 
    quote: Quote; 
    onDelete: (id: string) => void; 
    onGoToQuote: (q: Quote) => void;
    onShare: (q: Quote) => void;
}> = ({ quote, onDelete, onGoToQuote, onShare }) => {
    const [expanded, setExpanded] = useState(false);
    
    const words = useMemo(() => quote.text.trim().split(/\s+/), [quote.text]);
    const isLong = words.length > 20;
    const displayText = expanded || !isLong 
        ? quote.text 
        : words.slice(0, 20).join(' ') + '...';

    return (
        <div className="p-5 bg-[var(--color-surface)] border-4 border-black group relative shadow-[6px_6px_0_black] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_black] transition-all flex flex-col h-auto">
            <div className="flex justify-between items-start mb-3">
                <Text className="text-[9px] font-black uppercase tracking-widest text-pink-500 truncate max-w-[140px]">{quote.author}</Text>
                <Group gap={6}>
                    <ActionIcon variant="filled" color="cyan" size="xs" className="border-2 border-black rounded-none shadow-[1px_1px_0_black]" onClick={() => onShare(quote)}><IconShare className="w-3 h-3 text-black" /></ActionIcon>
                    <ActionIcon variant="filled" color="red" size="xs" className="border-2 border-black rounded-none shadow-[1px_1px_0_black]" onClick={() => onDelete(quote.id)}><IconTrash className="w-3 h-3 text-black" /></ActionIcon>
                </Group>
            </div>
            <p 
                className={`text-lg font-serif leading-tight text-[var(--color-primary-text)] cursor-pointer hover:opacity-80 transition-opacity mb-2`}
                onClick={() => onGoToQuote(quote)}
            >
                “{displayText}”
            </p>
            {isLong && (
                <button 
                    className="text-[9px] font-black uppercase tracking-widest text-cyan-600 hover:underline inline-block mb-3 self-start"
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? 'Show Less' : 'Show More'}
                </button>
            )}
            <div className="mt-auto pt-2 border-t border-black/10">
                <Text className="text-[8px] font-black text-black/40 uppercase tracking-widest truncate">{quote.bookTitle}</Text>
            </div>
        </div>
    );
};

const QuotesView: React.FC<QuotesViewProps> = ({ quotes, library = [], theme, onDelete, onGoToQuote }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeShare, setActiveShare] = useState<Quote | null>(null);

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
        return q.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
               q.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
               q.bookTitle.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [quotes, searchQuery]);

  const activeBookCover = useMemo(() => {
    if (!activeShare) return null;
    const book = library.find(b => b.id === activeShare.bookId);
    return book?.coverImageUrl || null;
  }, [activeShare, library]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-10 pb-40 animate-fade-in">
      <header className="border-b-4 border-black pb-6">
          <h2 className="text-4xl font-black text-black uppercase tracking-tight">Saved Quotes</h2>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-pink-500 mt-2">Your collection of highlights</p>
      </header>

      <div className="relative">
          <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black opacity-40" />
          <input 
            type="text" placeholder="Search your quotes..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-4 border-black p-4 pl-12 text-[14px] font-black text-black placeholder:text-gray-300 outline-none shadow-[4px_4px_0_black] focus:translate-x-[-2px] focus:translate-y-[-2px] focus:shadow-[6px_6px_0_black] transition-all"
          />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-min">
        {filteredQuotes.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-30">
                <p className="text-[12px] font-black uppercase tracking-[0.2em]">No Quotes Found</p>
            </div>
        ) : (
            filteredQuotes.map(quote => (
                <QuoteCard key={quote.id} quote={quote} onDelete={onDelete} onGoToQuote={onGoToQuote} onShare={setActiveShare} />
            ))
        )}
       </div>

       {activeShare && (
           <ShareDialog 
              text={activeShare.text} 
              bookTitle={activeShare.bookTitle} 
              author={activeShare.author} 
              coverImageUrl={activeBookCover}
              theme={theme} 
              onClose={() => setActiveShare(null)} 
           />
       )}
    </div>
  );
};

export default QuotesView;
