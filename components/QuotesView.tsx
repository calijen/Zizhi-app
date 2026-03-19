
import { FC, useState, useMemo } from 'react';
import { Text, Group, ActionIcon, Box, Stack } from '@mantine/core';
import type { Quote, Theme, BookMetadata } from '../types';
import { IconTrash, IconSearch, IconShare } from './icons';
import ShareDialog from './ShareDialog';

interface QuotesViewProps {
  quotes: Quote[];
  library?: BookMetadata[];
  theme: Theme;
  onDelete: (id: string) => void;
  onGoToQuote: (quote: Quote) => void;
}

const EmptyQuotesGraphic = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="300" height="300" className="mx-auto mb-4">
      <defs>
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4FC3F7" stopOpacity={1} />
          <stop offset="100%" stopColor="#0288D1" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="metalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ECEFF1" stopOpacity={1} />
          <stop offset="100%" stopColor="#B0BEC5" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#263238" stopOpacity={1} />
          <stop offset="100%" stopColor="#37474F" stopOpacity={1} />
        </linearGradient>
        <linearGradient id="highlighterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFEB3B" stopOpacity={1} />
          <stop offset="100%" stopColor="#FDD835" stopOpacity={1} />
        </linearGradient>
      </defs>
      <path d="M420.5,310.5Q411,371,360.5,405Q310,439,250.5,425.5Q191,412,143,373.5Q95,335,106.5,272.5Q118,210,165.5,170Q213,130,274.5,138.5Q336,147,393,198.5Q450,250,420.5,310.5Z" fill="#E1F5FE" />
      <ellipse cx="256" cy="450" rx="120" ry="15" fill="#000000" opacity="0.15" />
      <g transform="translate(0, 10)">
        <path d="M210 380 L210 420 A10 10 0 0 0 230 420 L230 380 Z" fill="url(#metalGrad)" stroke="#78909C" strokeWidth="2"/>
        <path d="M282 380 L282 420 A10 10 0 0 0 302 420 L302 380 Z" fill="url(#metalGrad)" stroke="#78909C" strokeWidth="2"/>
        <path d="M195 420 H245 A5 5 0 0 1 250 425 V430 A5 5 0 0 1 245 435 H195 A5 5 0 0 1 190 430 V425 A5 5 0 0 1 195 420 Z" fill="#37474F"/>
        <path d="M267 420 H317 A5 5 0 0 1 322 425 V430 A5 5 0 0 1 317 435 H267 A5 5 0 0 1 262 430 V425 A5 5 0 0 1 267 420 Z" fill="#37474F"/>
      </g>
      <rect x="176" y="240" width="160" height="150" rx="25" ry="25" fill="url(#bodyGrad)" />
      <rect x="206" y="270" width="100" height="90" rx="10" ry="10" fill="#FFFFFF" opacity="0.9"/>
      <path d="M236 300 H276 M236 320 H276 M236 340 H260" stroke="#B3E5FC" strokeWidth="6" strokeLinecap="round"/>
      <rect x="236" y="220" width="40" height="30" fill="#78909C"/>
      <g transform="rotate(-5, 256, 180)">
        <rect x="156" y="100" width="200" height="130" rx="35" ry="35" fill="url(#bodyGrad)" />
        <rect x="176" y="120" width="160" height="90" rx="20" ry="20" fill="url(#screenGrad)"/>
        <g>
          <circle cx="226" cy="160" r="25" fill="#FFFFFF"/>
          <circle cx="226" cy="160" r="10" fill="#0277BD"/>
          <circle cx="286" cy="160" r="25" fill="#FFFFFF"/>
          <circle cx="286" cy="160" r="10" fill="#0277BD"/>
        </g>
        <path d="M241 190 Q256 200 271 190" fill="none" stroke="#4FC3F7" strokeWidth="3" strokeLinecap="round"/>
        <line x1="256" y1="100" x2="256" y2="60" stroke="#78909C" strokeWidth="6"/>
        <circle cx="256" cy="50" r="12" fill="#FF7043"/>
      </g>
      <path d="M176 280 C130 280 130 350 160 360" fill="none" stroke="#B0BEC5" strokeWidth="18" strokeLinecap="round"/>
      <circle cx="160" cy="360" r="14" fill="#37474F"/>
      <g transform="translate(130, 330) rotate(-15)">
        <path d="M0 10 L60 10 L60 70 L0 70 Z" fill="#5D4037" />
        <path d="M2 12 L58 12 L58 68 L2 68 Z" fill="#FFFFFF"/>
      </g>
      <path d="M336 280 C380 280 380 220 360 190" fill="none" stroke="#B0BEC5" strokeWidth="18" strokeLinecap="round"/>
      <circle cx="360" cy="190" r="14" fill="#37474F"/>
      <g transform="translate(350, 150) rotate(30)">
        <rect x="0" y="20" width="20" height="60" rx="4" fill="url(#highlighterGrad)"/>
        <path d="M5 15 L10 0 L15 15 Z" fill="#FFFF00"/>
      </g>
    </svg>
);

const QuoteCard: FC<{ quote: Quote; onDelete: (id: string) => void; onGoToQuote: (q: Quote) => void; onShare: (q: Quote) => void; }> = ({ quote, onDelete, onGoToQuote, onShare }) => {
    const [expanded, setExpanded] = useState(false);
    const words = useMemo(() => quote.text.trim().split(/\s+/), [quote.text]);
    const isLong = words.length > 20;
    const displayText = expanded || !isLong ? quote.text : words.slice(0, 20).join(' ') + '...';
    return (
        <div className="p-5 bg-[var(--color-surface)] border-4 border-black group relative shadow-[4px_4px_0_black] hover:translate-x-[-1px] transition-all flex flex-col h-auto">
            <div className="flex justify-between items-start mb-3">
                <Text className="text-[9px] font-black uppercase text-pink-500 truncate max-w-[140px]">{quote.author}</Text>
                <Group gap={6}>
                    <ActionIcon variant="filled" color="cyan" size="xs" className="border-2 border-black rounded-none shadow-[1px_1px_0_black]" onClick={() => onShare(quote)}><IconShare className="w-3 h-3 text-black" /></ActionIcon>
                    <ActionIcon variant="filled" color="red" size="xs" className="border-2 border-black rounded-none shadow-[1px_1px_0_black]" onClick={() => onDelete(quote.id)}><IconTrash className="w-3 h-3 text-black" /></ActionIcon>
                </Group>
            </div>
            <p className="text-lg font-serif leading-tight text-[var(--color-primary-text)] cursor-pointer hover:opacity-80 transition-opacity mb-2" onClick={() => onGoToQuote(quote)}>“{displayText}”</p>
            {isLong && <button className="text-[9px] font-black uppercase text-cyan-600 hover:underline inline-block mb-3 self-start" onClick={() => setExpanded(!expanded)}>{expanded ? 'Less' : 'More'}</button>}
            <div className="mt-auto pt-2 border-t border-black/10"><Text className="text-[8px] font-black text-[var(--color-muted-text)] uppercase truncate">{quote.bookTitle}</Text></div>
        </div>
    );
};

const QuotesView: FC<QuotesViewProps> = ({ quotes, library = [], theme, onDelete, onGoToQuote }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeShare, setActiveShare] = useState<Quote | null>(null);
  const filteredQuotes = useMemo(() => quotes.filter(q => q.text.toLowerCase().includes(searchQuery.toLowerCase()) || q.author.toLowerCase().includes(searchQuery.toLowerCase()) || q.bookTitle.toLowerCase().includes(searchQuery.toLowerCase())), [quotes, searchQuery]);
  const activeBookCover = useMemo(() => activeShare ? (library.find(b => b.id === activeShare.bookId)?.coverImageUrl || null) : null, [activeShare, library]);
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-10 pb-40 animate-fade-in">
      <header className="border-b-4 border-black pb-6"><h2 className="text-3xl font-black text-[var(--color-primary-text)] uppercase">Quotes</h2></header>
      <div className="relative"><IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted-text)]" /><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[var(--color-surface)] border-4 border-black p-4 pl-12 text-[14px] font-black text-[var(--color-primary-text)] outline-none shadow-[4px_4px_0_black] focus:translate-x-[-1px] transition-all" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-min">
        {filteredQuotes.length === 0 ? (<div className="col-span-full py-12 flex flex-col items-center justify-center text-center"><EmptyQuotesGraphic /><h2 className="text-2xl font-black mt-4 text-[var(--color-primary-text)] uppercase">No Quotes</h2><p className="text-[12px] font-black text-[var(--color-muted-text)] uppercase">Save text in a book to see it here.</p></div>) : (filteredQuotes.map(quote => <QuoteCard key={quote.id} quote={quote} onDelete={onDelete} onGoToQuote={onGoToQuote} onShare={setActiveShare} />))}
      </div>
       {activeShare && <ShareDialog text={activeShare.text} bookTitle={activeShare.bookTitle} author={activeShare.author} coverImageUrl={activeBookCover} theme={theme} onClose={() => setActiveShare(null)} />}
    </div>
  );
};

export default QuotesView;
