import React from 'react';
import { IconClose } from './icons';

interface SearchSidebarProps {
  query: string;
  onClose: () => void;
}

const SearchSidebar: React.FC<SearchSidebarProps> = ({ query, onClose }) => {
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-stretch md:justify-end" aria-modal="true" role="dialog">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
        <div className="relative z-10 w-full h-4/5 md:h-full md:w-2/5 lg:w-1/3 bg-background shadow-2xl flex flex-col animate-search-panel-in">
            <header className="flex items-center justify-between p-4 border-b border-border-color flex-shrink-0">
                <h3 className="font-bold truncate">Search Results</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-border-color/20" aria-label="Close search">
                    <IconClose />
                </button>
            </header>
            <p className="p-4 text-sm text-secondary-text border-b border-border-color flex-shrink-0">
                Showing results for: <strong className="font-semibold text-primary-text">{query}</strong>
            </p>
            <div className="flex-1 overflow-hidden">
                <iframe
                    src={searchUrl}
                    title={`Search results for ${query}`}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                />
            </div>
        </div>
    </div>
  );
};

export default SearchSidebar;