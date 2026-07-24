
import { FC, useState, useMemo, useEffect } from 'react';
import { Text, Group, ActionIcon, Box, Stack } from '@mantine/core';
import { AnimatePresence, motion } from 'framer-motion';
import type { Quote, Theme, BookMetadata } from '../types';
import { IconTrash, IconSearch, IconShare, IconSparkles, IconSpinner, IconChevronLeft } from './icons';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ShareDialog from './ShareDialog';

interface QuotesViewProps {
  quotes: Quote[];
  library?: BookMetadata[];
  theme: Theme;
  onDelete: (id: string) => void;
  onGoToQuote: (quote: Quote) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
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
    const words = useMemo(() => (quote?.text || '').trim().split(/\s+/), [quote?.text]);
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

const QuotesView: FC<QuotesViewProps> = ({ quotes, library = [], theme, onDelete, onGoToQuote, isChatOpen, setIsChatOpen }) => {
  const [viewMode, setViewMode] = useState<'all' | 'review'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeShare, setActiveShare] = useState<Quote | null>(null);

  // Review states
  const [reviewStep, setReviewStep] = useState<'input' | 'preview'>('input');
  const [reviewQuery, setReviewQuery] = useState('');
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [reviewQuotes, setReviewQuotes] = useState<Quote[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const filteredQuotes = useMemo(() => quotes.filter(q => q.text.toLowerCase().includes(searchQuery.toLowerCase()) || q.author.toLowerCase().includes(searchQuery.toLowerCase()) || q.bookTitle.toLowerCase().includes(searchQuery.toLowerCase())), [quotes, searchQuery]);
  const activeBookCover = useMemo(() => activeShare ? (library.find(b => b.id === activeShare.bookId)?.coverImageUrl || null) : null, [activeShare, library]);

  const currentQuoteText = useMemo(() => {
    return reviewQuotes[activeCardIndex]?.text || '';
  }, [reviewQuotes, activeCardIndex]);

  const quoteFontSizeClass = useMemo(() => {
    const len = currentQuoteText.length;
    if (len < 100) return 'text-[17px] sm:text-xl md:text-2xl font-serif font-medium leading-relaxed';
    if (len < 240) return 'text-[15px] sm:text-lg md:text-xl font-serif italic leading-relaxed';
    if (len < 500) return 'text-[13px] sm:text-base md:text-lg font-serif italic leading-relaxed';
    return 'text-[12px] sm:text-sm md:text-base font-serif italic leading-normal';
  }, [currentQuoteText]);

  // Generate beautiful Suggested Focus paths based on existing books and authors
  const focusPills = useMemo(() => {
    const pills = new Set<string>();
    
    // Add authors with most quotes
    quotes.forEach(q => {
      if (q.author && q.author.trim() && pills.size < 3) {
        // Clean name e.g. "Douglas Hofstadter" or "Hofstadter"
        pills.add(q.author.trim());
      }
    });

    // Add clean book titles
    quotes.forEach(q => {
      if (q.bookTitle && q.bookTitle.trim() && pills.size < 5) {
        const clean = q.bookTitle.replace(/\.(pdf|epub)$/i, '').trim();
        pills.add(clean);
      }
    });

    // Generic fallback standard semantic areas
    pills.add("Philosophy");
    pills.add("Cognitive Science");
    pills.add("Literature");

    // Convert set and clean up
    return Array.from(pills).slice(0, 7);
  }, [quotes]);

  const runAiFilter = async (qText: string): Promise<string[] | null> => {
    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) return null;

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
      
      const payload = quotes.map(q => ({
        id: q.id,
        text: q.text,
        author: q.author,
        bookTitle: q.bookTitle
      }));

      const prompt = `
You are a scholar's library assistant database engine.
The user wants to construct a customized review session for a reader application. They specified the focus of today's review session: "${qText}"

Here are the user's saved quotes represented as a JSON array:
${JSON.stringify(payload)}

Your objective is to identify and filter which of these quotes fit or are semantically relevant to the user's criteria. E.g.:
- If they type an author name, find quotes by that author.
- If they type a book title, find quotes from that book.
- If they type a topic or conceptual field ("philosophy", "minds", "consciousness", "truth", "ethics"), find all quotes that touch on these topics semantically.

Return a valid JSON object ONLY containing a key "matchedIds" which is a list of quote IDs that matching this focus area. Do not write markdown wraps, code blocks, or thinking. Strictly format as:
{"matchedIds": ["some-id-one", "some-id-two"]}
`;
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Clean JSON blocks if AI added markdown tags
      let cleanText = responseText.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.substring(7);
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.substring(3);
      }
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      cleanText = cleanText.trim();

      const parsed = JSON.parse(cleanText);
      if (parsed && Array.isArray(parsed.matchedIds)) {
        return parsed.matchedIds;
      }
    } catch (e) {
      console.error("AI matching failed, falling back to local search engine:", e);
    }
    return null;
  };

  const handleStartReview = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) {
      // Empty query means review everything!
      setReviewQuotes(quotes);
      setActiveCardIndex(0);
      setIsFlipped(false);
      setReviewStep('preview');
      return;
    }

    setIsLoadingReview(true);
    
    // 1. Try semantic search through the Gemini API
    const aiMatchedIds = await runAiFilter(trimmed);
    
    if (aiMatchedIds !== null) {
      const selected = quotes.filter(q => aiMatchedIds.includes(q.id));
      if (selected.length > 0) {
        setReviewQuotes(selected);
        setActiveCardIndex(0);
        setIsFlipped(false);
        setReviewStep('preview');
        setIsLoadingReview(false);
        return;
      }
    }

    // 2. Local fallback if AI fails or returns empty lists
    const cleanSearch = trimmed.toLowerCase();
    const localFiltered = quotes.filter(q => {
      const textMatch = q.text.toLowerCase().includes(cleanSearch);
      const authorMatch = q.author.toLowerCase().includes(cleanSearch);
      const bookMatch = q.bookTitle.toLowerCase().includes(cleanSearch);
      
      // Basic semantic keyword mappings
      let tagMatch = false;
      if (cleanSearch.includes("philosophy")) {
        const keywords = ["truth", "reason", "ethics", "moral", "existence", "existential", "wisdom", "logic", "conception", "concept", "philosophy", "realist", "ethics"];
        tagMatch = keywords.some(k => q.text.toLowerCase().includes(k));
      } else if (cleanSearch.includes("mind") || cleanSearch.includes("minds") || cleanSearch.includes("consciousness")) {
        const keywords = ["mind", "consciousness", "thought", "brain", "intellect", "self", "perception", "cognitive", "cognitive science"];
        tagMatch = keywords.some(k => q.text.toLowerCase().includes(k) || q.bookTitle.toLowerCase().includes(k));
      } else if (cleanSearch.includes("science")) {
        const keywords = ["science", "theory", "spacetime", "physics", "universe", "scientific", "quantum", "logical", "nature"];
        tagMatch = keywords.some(k => q.text.toLowerCase().includes(k));
      }
      
      return textMatch || authorMatch || bookMatch || tagMatch;
    });

    setReviewQuotes(localFiltered);
    setActiveCardIndex(0);
    setIsFlipped(false);
    setReviewStep('preview');
    setIsLoadingReview(false);
  };

  // Keyboard shortcut listeners for active flashcards
  useEffect(() => {
    if (viewMode !== 'review' || reviewStep !== 'preview' || reviewQuotes.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keys when user is typing in inputs or textareas
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'Right') {
        e.preventDefault();
        if (activeCardIndex < reviewQuotes.length - 1) {
          setActiveCardIndex(prev => prev + 1);
          setIsFlipped(false);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        e.preventDefault();
        if (activeCardIndex > 0) {
          setActiveCardIndex(prev => prev - 1);
          setIsFlipped(false);
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewMode, reviewStep, activeCardIndex, reviewQuotes.length]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-10 pb-40 animate-fade-in relative">
      <header className="border-b-4 border-black pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <Stack gap={3}>
          <h2 className="text-3xl font-black text-[var(--color-primary-text)] uppercase tracking-tight">Quotes</h2>
          <p className="text-[11px] font-black uppercase text-pink-500 tracking-wider">Archived insights & scholars review deck</p>
        </Stack>

        {/* View switcher buttons styled in high-fidelity academic retro */}
        <div className="flex bg-[var(--color-surface)] border-4 border-black p-1 self-stretch sm:self-auto">
          <button 
            type="button"
            onClick={() => setViewMode('all')} 
            className={`flex-1 sm:flex-none px-6 py-2 text-xs font-black uppercase tracking-wider transition-colors duration-200 border-0 ${viewMode === 'all' ? 'bg-black text-white' : 'bg-transparent text-[var(--color-primary-text)] hover:bg-black/5'}`}
          >
            All Saved ({filteredQuotes.length})
          </button>
          <button 
            type="button"
            onClick={() => {
              setViewMode('review');
              setReviewStep('input');
            }} 
            className={`flex-1 sm:flex-none px-6 py-2 text-xs font-black uppercase tracking-wider transition-colors duration-200 border-0 ${viewMode === 'review' ? 'bg-black text-white' : 'bg-transparent text-[var(--color-primary-text)] hover:bg-black/5'}`}
          >
            Flashcard Review
          </button>
        </div>
      </header>

      {viewMode === 'all' ? (
        <div className="space-y-10 animate-fade-in">
          <div className="relative">
            <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted-text)]" />
            <input 
              type="text" 
              placeholder="Search quotes, books, or authors..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full bg-[var(--color-surface)] border-4 border-black p-4 pl-12 text-[14px] font-black text-[var(--color-primary-text)] outline-none shadow-[4px_4px_0_black] focus:translate-x-[-1px] transition-all" 
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-min">
            {filteredQuotes.length === 0 ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                <EmptyQuotesGraphic />
                <h2 className="text-2xl font-black mt-4 text-[var(--color-primary-text)] uppercase">No Quotes</h2>
                <p className="text-[12px] font-black text-[var(--color-muted-text)] uppercase">Save text in a book to see it here.</p>
              </div>
            ) : (
              filteredQuotes.map(quote => (
                <QuoteCard 
                  key={quote.id} 
                  quote={quote} 
                  onDelete={onDelete} 
                  onGoToQuote={onGoToQuote} 
                  onShare={setActiveShare} 
                />
              ))
            )}
          </div>
        </div>
      ) : (
        /* FLASHCARD REVIEW TAB MODE */
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
          {isLoadingReview ? (
            <div className="py-24 flex flex-col items-center justify-center gap-6 bg-[var(--color-surface)] border-4 border-black shadow-[8px_8px_0_black]">
              <IconSpinner className="w-12 h-12 text-pink-500" />
              <div className="text-center space-y-1">
                <p className="text-sm font-black uppercase tracking-widest text-[var(--color-primary-text)]">Consulting Catalogs...</p>
                <p className="text-[11px] font-serif italic text-[var(--color-muted-text)]">Sifting saved insights for appropriate thematic matching</p>
              </div>
            </div>
          ) : reviewStep === 'input' ? (
            /* Focus input screen */
            <div className="bg-[var(--color-surface)] border-4 border-black p-8 md:p-12 shadow-[12px_12px_0_black] space-y-8">
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-pink-500 tracking-[0.3em]">Knowledge Retrospective</span>
                <h3 className="text-3xl font-black uppercase tracking-tight text-[var(--color-primary-text)]">Set Your Study focus</h3>
                <p className="text-sm font-serif italic text-[var(--color-secondary-text)] leading-relaxed">
                  Enter a book title, author, scientific field, or philosophical theme. We will curate matching quotes so you can review them as tactile index cards.
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted-text)]" />
                  <input 
                    type="text" 
                    value={reviewQuery} 
                    onChange={(e) => setReviewQuery(e.target.value)} 
                    placeholder="e.g. Douglas Hofstadter, philosophy, consciousness..." 
                    className="w-full bg-[var(--color-background)] border-4 border-black p-4 pl-12 text-[14px] font-black text-[var(--color-primary-text)] focus:translate-x-[-1px] transition-all outline-none" 
                  />
                </div>

                {/* Suggestions pills */}
                {quotes.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-muted-text)] block">Suggested Focus Horizons:</span>
                    <div className="flex flex-wrap gap-2">
                      {focusPills.map(pill => (
                        <button
                          key={pill}
                          type="button"
                          onClick={() => {
                            setReviewQuery(pill);
                            handleStartReview(pill);
                          }}
                          className="bg-[var(--color-background)] border-2 border-black px-3 py-1.5 text-[10px] font-black uppercase tracking-wide hover:bg-black hover:text-white hover:border-black transition-all active:translate-y-[1px] rounded-none"
                        >
                          {pill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="button"
                onClick={() => handleStartReview(reviewQuery)}
                className="w-full py-4.5 bg-yellow-400 text-black border-4 border-black font-black uppercase shadow-[6px_6px_0_black] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_black] transition-all active:translate-y-0 active:shadow-[4px_4px_0_black] text-xs"
              >
                Begin Review Deck
              </button>
            </div>
          ) : (
            /* Active Flashcard Screen */
            <div className="space-y-8 animate-fade-in flex flex-col items-center">
              <div className="w-full flex justify-between items-center bg-[var(--color-surface)] border-4 border-black p-4 shadow-[4px_4px_0_black]">
                <button 
                  type="button"
                  onClick={() => setReviewStep('input')} 
                  className="flex items-center gap-1 text-[10px] font-black uppercase text-[var(--color-primary-text)] hover:underline border-0 bg-transparent"
                >
                  <IconChevronLeft className="w-4 h-4" /> Change focus
                </button>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-pink-500 bg-pink-50 px-2.5 py-1 border border-pink-200">
                    FOCUS: {reviewQuery || "ALL SAVED"}
                  </span>
                </div>
              </div>

              {reviewQuotes.length === 0 ? (
                <div className="w-full bg-[var(--color-surface)] border-4 border-black p-10 text-center space-y-6 shadow-[8px_8px_0_black]">
                  <p className="text-sm font-serif italic text-[var(--color-secondary-text)]">
                    "Each tab is a room we have not yet entered."
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase text-[var(--color-primary-text)]">No custom matching quotes found</p>
                    <p className="text-[11px] font-serif text-[var(--color-muted-text)] leading-relaxed max-w-sm mx-auto">
                      Don't let that stop you. Expand your focus criteria, or perform a review sequence on all your library highlights instead!
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                    <button 
                      type="button"
                      onClick={() => setReviewStep('input')} 
                      className="px-6 py-3 bg-[var(--color-background)] text-[var(--color-primary-text)] border-4 border-black font-black uppercase hover:bg-black hover:text-white transition-colors block text-xs"
                    >
                      Change Topic
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleStartReview("")} 
                      className="px-6 py-3 bg-yellow-400 text-black border-4 border-black font-black uppercase hover:translate-y-[-1px] shadow-[4px_4px_0_black] transition-all block text-xs"
                    >
                      Review All ({quotes.length})
                    </button>
                  </div>
                </div>
              ) : (
                /* Card Display Stack interface */
                <div className="w-full space-y-6 sm:space-y-8 flex flex-col items-center">
                  <div className="w-full flex justify-between items-center text-[11px] sm:text-xs font-black uppercase text-[var(--color-primary-text)] tracking-wider">
                    <span>INDEX CARD {activeCardIndex + 1} of {reviewQuotes.length}</span>
                    <span className="text-[11px] text-[var(--color-muted-text)] hidden sm:inline">Tip: [Space] to Flip, [← / →] to navigate</span>
                  </div>

                  {/* Perfectly engineered 3D simulated flippable index card - responsive heights perfectly matched for flip consistency */}
                  <div 
                    onClick={() => setIsFlipped(!isFlipped)} 
                    className="w-full relative cursor-pointer select-none group [perspective:1000px] h-[450px] sm:h-[350px] max-w-2xl mx-auto focus:outline-none"
                    tabIndex={0}
                  >
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="w-full h-full relative [transform-style:preserve-3d]"
                    >
                      {/* CARD FRONT: The Quote Text centered with beautiful notebook paper styles */}
                      <div 
                        className="absolute inset-0 w-full h-full p-6 sm:p-10 flex flex-col justify-between border-4 border-black shadow-[8px_8px_0_black] transition-all bg-[#FCFBF4] overflow-hidden"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                        }}
                      >
                        {/* Custom notebook margins and horizontal ruling blue/pink lines */}
                        <div className="absolute top-0 bottom-0 left-[35px] sm:left-[50px] w-[2px] bg-red-200 pointer-events-none" />
                        <div 
                          className="absolute inset-0 pointer-events-none opacity-15" 
                          style={{
                            backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, #60A5FA 39px, #60A5FA 40px)',
                            backgroundSize: '100% 40px',
                            top: '44px'
                          }}
                        />

                        {/* Top index header */}
                        <div className="relative pl-3 sm:pl-6 flex justify-between items-center">
                          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-cyan-600">SCHOLASTIC INDEX CARD</span>
                          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-pink-500 hover:underline">Flip Card ↻</span>
                        </div>

                        {/* Center Quote body - completely scroll-safe, touch friendly, and dynamically sized font */}
                        <div className="relative flex-1 flex items-center pl-4 sm:pl-8 pr-1 overflow-y-auto mt-4 sm:mt-6 mb-3 sm:mb-4 max-h-[290px] sm:max-h-[190px] scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent">
                          <p className={`w-full text-left font-serif leading-relaxed text-slate-800 tracking-wide ${quoteFontSizeClass}`}>
                            “{reviewQuotes[activeCardIndex].text}”
                          </p>
                        </div>

                        {/* Bottom note header */}
                        <div className="relative pl-4 sm:pl-8 flex justify-between items-end border-t border-dashed border-gray-300 pt-2 sm:pt-3">
                          <span className="text-[8px] sm:text-[9px] font-black uppercase text-gray-400">ZIZHI CADET INSIGHT</span>
                          <span className="text-[7px] sm:text-[8px] font-mono tracking-widest text-slate-400">KNOWLEDGE ENQUIRY</span>
                        </div>
                      </div>

                      {/* CARD BACK: Reveal Books and Author Details of the Quote */}
                      <div 
                        className="absolute inset-0 w-full h-full p-6 sm:p-10 flex flex-col justify-between border-4 border-black shadow-[8px_8px_0_black] bg-[#FAF8EF] overflow-hidden"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)'
                        }}
                      >
                        {/* Margins layer */}
                        <div className="absolute top-0 bottom-0 left-[35px] sm:left-[50px] w-[2px] bg-red-200 pointer-events-none" />
                        <div 
                          className="absolute inset-0 pointer-events-none opacity-10" 
                          style={{
                            backgroundImage: 'repeating-linear-gradient(transparent, transparent 39px, #60A5FA 39px, #60A5FA 40px)',
                            backgroundSize: '100% 40px',
                            top: '44px'
                          }}
                        />

                        {/* Top review header */}
                        <div className="relative pl-3 sm:pl-6 flex justify-between items-center border-b border-black/10 pb-2">
                          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-pink-500">SOURCE VERIFICATION</span>
                          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">CARD REVERSED</span>
                        </div>

                        <div className="relative flex-1 pl-4 sm:pl-8 flex flex-col justify-center space-y-4 sm:space-y-6 overflow-y-auto max-h-[290px] sm:max-h-[190px] py-2">
                          <div className="space-y-1">
                            <span className="text-[8px] sm:text-[9px] font-black uppercase text-pink-600 block tracking-widest">AUTHOR / SOURCE</span>
                            <h4 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-slate-900 leading-tight">
                              {reviewQuotes[activeCardIndex].author || "Unknown Scholar"}
                            </h4>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[8px] sm:text-[9px] font-black uppercase text-cyan-600 block tracking-widest">VOLUME TITLE</span>
                            <p className="text-xs sm:text-base font-serif italic text-slate-700 leading-snug">
                              {reviewQuotes[activeCardIndex].bookTitle}
                            </p>
                          </div>
                        </div>

                        {/* Bottom action controls */}
                        <div className="relative pl-4 sm:pl-8 flex justify-between items-center pt-3 sm:pt-4 border-t border-black/10">
                          <button 
                            type="button"
                            onClick={(e) => {
                              // Avoid card-flip action on clicking link button
                              e.stopPropagation();
                              onGoToQuote(reviewQuotes[activeCardIndex]);
                            }}
                            className="bg-black hover:bg-pink-600 text-white border-2 border-black font-black uppercase text-[8px] sm:text-[10px] tracking-wide px-3 sm:px-4 py-2 sm:py-2.5 transition-colors duration-200 relative z-10 rounded-none shadow-[2px_2px_0_black] hover:shadow-[3px_3px_0_black]"
                          >
                            📖 Go to source
                          </button>
                          <span className="text-[8px] font-mono tracking-widest text-slate-400">ARCHIVE REFERENCE</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Manual trigger panel */}
                  <div className="w-full flex justify-between items-center gap-3 max-w-lg">
                    <button 
                      type="button"
                      disabled={activeCardIndex === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCardIndex(prev => prev - 1);
                        setIsFlipped(false);
                      }}
                      className="flex-1 py-2.5 sm:py-3 bg-[var(--color-surface)] disabled:opacity-40 disabled:pointer-events-none text-[var(--color-primary-text)] border-4 border-black font-black uppercase text-[10px] sm:text-xs shadow-[4px_4px_0_black] active:translate-y-1 transition-all"
                    >
                      ← Prev
                    </button>

                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFlipped(prev => !prev);
                      }}
                      className="py-2.5 sm:py-3 px-4 sm:px-6 bg-pink-500 text-white border-4 border-black font-black uppercase text-[10px] sm:text-xs shadow-[4px_4px_0_black] hover:bg-pink-600 transition-colors"
                    >
                      ↻ Flip
                    </button>

                    <button 
                      type="button"
                      disabled={activeCardIndex === reviewQuotes.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCardIndex(prev => prev + 1);
                        setIsFlipped(false);
                      }}
                      className="flex-1 py-2.5 sm:py-3 bg-[var(--color-surface)] disabled:opacity-40 disabled:pointer-events-none text-[var(--color-primary-text)] border-4 border-black font-black uppercase text-[10px] sm:text-xs shadow-[4px_4px_0_black] active:translate-y-1 transition-all"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeShare && <ShareDialog text={activeShare.text} bookTitle={activeShare.bookTitle} author={activeShare.author} coverImageUrl={activeBookCover} theme={theme} onClose={() => setActiveShare(null)} />}
    </div>
  );
};

export default QuotesView;

