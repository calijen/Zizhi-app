import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { IconClose, IconSpinner, IconSearch, IconGoogle } from './icons';
import type { Theme } from '../types';

interface SearchSidebarProps {
  query: string;
  theme?: Theme;
  onClose: () => void;
}

const SearchSidebar: React.FC<SearchSidebarProps> = ({ query, theme, onClose }) => {
  const [inputValue, setInputValue] = useState(query);
  const [searchTerm, setSearchTerm] = useState(query);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  const styleVariables = theme ? {
    '--bg-color': theme.colors['background'],
    '--text-color': theme.colors['primary-text'],
    '--sec-text': theme.colors['secondary-text'],
    '--surface': theme.colors['surface'],
    '--border': theme.colors['border-color'],
  } as React.CSSProperties : {} as React.CSSProperties;

  useEffect(() => {
    setInputValue(query);
    setSearchTerm(query);
    setIsIframeLoading(true);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setIsIframeLoading(true);
      setSearchTerm(inputValue.trim());
    }
  };

  const handleExternalSearch = () => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`, '_blank', 'noopener,noreferrer');
  };

  const googleIframeUrl = `https://www.google.com/search?igu=1&q=${encodeURIComponent(searchTerm)}`;

  return (
    <div 
      className="fixed inset-0 z-[2200] flex items-stretch justify-end pointer-events-auto" 
      style={styleVariables}
      aria-modal="true" 
      role="dialog"
    >
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative z-10 w-full md:max-w-2xl bg-[var(--bg-color)] border-l-4 border-black flex flex-col h-full shadow-[0_30px_70px_rgba(0,0,0,0.5)] pt-safe"
      >
        {/* Header Block */}
        <header className="p-4 bg-[var(--surface)] border-b-4 border-black flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-black flex items-center justify-center rounded-none shadow-[1px_1px_0_black]">
                <IconGoogle className="text-white w-4 h-4 p-0.5" />
              </div>
              <h3 className="font-display uppercase tracking-wider text-xs font-black text-[var(--text-color)]">
                Zizhi Google Search
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExternalSearch}
                className="px-3 py-1 bg-yellow-300 border-2 border-black font-black text-[10px] uppercase tracking-wider text-black shadow-[2px_2px_0_black] active:translate-y-0.5 active:shadow-none hover:bg-yellow-400 transition-all flex items-center gap-1"
                title="Open directly in Google.com"
              >
                Open Google.com ↗
              </button>
              <button 
                onClick={onClose} 
                className="p-1 border-2 border-black bg-[var(--bg-color)] shadow-[2px_2px_0_black] active:translate-y-0.5 active:shadow-none transition-all hover:bg-red-400"
                aria-label="Close"
              >
                <IconClose className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full pl-10 pr-20 py-3 bg-[var(--bg-color)] border-2 border-black font-bold text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-none shadow-[2px_2px_0_black] text-[var(--text-color)]"
              placeholder="Search Google..."
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/60 pointer-events-none">
              <IconSearch className="w-4 h-4" />
            </div>
            {inputValue && (
              <button
                type="button"
                onClick={() => setInputValue('')}
                className="absolute right-16 top-1/2 -translate-y-1/2 font-black text-[9px] uppercase tracking-wider text-black/50 hover:text-black hover:underline"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-cyan-400 border border-black font-black uppercase text-[9px] tracking-wider text-black shadow-[1px_1px_0_black] hover:bg-cyan-500 active:translate-y-0.5 active:shadow-none"
            >
              Search
            </button>
          </form>
        </header>

        {/* Search Viewport Frame Container */}
        <div className="flex-1 overflow-hidden relative bg-[var(--bg-color)] flex flex-col">
          {isIframeLoading && (
            <div className="absolute inset-0 bg-[var(--bg-color)]/95 backdrop-blur-xs flex flex-col gap-4 items-center justify-center z-20">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="p-3 bg-yellow-300 border-4 border-black shadow-[4px_4px_0_black]"
              >
                <IconSpinner className="w-8 h-8 text-black" />
              </motion.div>
              <span className="text-xs font-black uppercase tracking-widest text-[var(--text-color)]">
                Loading Google Search results...
              </span>
            </div>
          )}

          <iframe
            key={searchTerm}
            src={googleIframeUrl}
            title={`Google Search for ${searchTerm}`}
            className="w-full h-full border-none flex-1"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={() => setIsIframeLoading(false)}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default SearchSidebar;
