
import React, { useState, useEffect } from 'react';
import { IconClose, IconSpinner } from './icons';

interface SearchSidebarProps {
  query: string;
  onClose: () => void;
}

// Add google to window type for TypeScript
declare global {
    interface Window {
        google?: any;
        __gcse?: any;
    }
}

const SearchSidebar: React.FC<SearchSidebarProps> = ({ query, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const searchEngineId = process.env.GOOGLE_CSE_ID; 

        if (!searchEngineId) {
            setError("Search is not configured. Missing Search Engine ID. Please set GOOGLE_CSE_ID in your environment variables.");
            setIsLoading(false);
            return;
        }

        // Define callbacks for the CSE script to hook into.
        const handleSearchComplete = () => {
            setIsLoading(false);
        };
        
        window.__gcse = {
            searchCallbacks: {
                web: {
                    ready: handleSearchComplete,
                    error: () => {
                        handleSearchComplete();
                        // Google doesn't provide detailed error info here, so a generic message is best.
                        setError("An error occurred with Google Search.");
                    }
                },
            },
        };
        
        // Inject the Google CSE script into the page.
        const scriptId = 'gcse-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.src = `https://cse.google.com/cse.js?cx=${searchEngineId}`;
            script.async = true;
            script.id = scriptId;
            document.head.appendChild(script);
        }

        return () => {
            // Cleanup on component unmount
            const existingScript = document.getElementById(scriptId);
            if (existingScript) {
                existingScript.remove();
            }
            // Remove the callback object to avoid memory leaks
            delete window.__gcse;
        };
    }, []); // Runs only once when the sidebar is first opened

    useEffect(() => {
        // This effect executes the search when the query changes or after the script loads.
        if (!query) return;
        if (error) return; // Don't try to search if setup failed

        const executeSearch = () => {
            if (window.google?.search?.cse?.element) {
                setIsLoading(true);
                // Programmatically execute a search for the given query
                window.google.search.cse.element.getElement('zizhi-search-results').execute(query);
            } else {
                // If script isn't loaded yet, poll for it.
                setTimeout(executeSearch, 100);
            }
        };
        
        executeSearch();

    }, [query, error]);

    // Google CSE injects its own styles. These overrides help integrate it into the app's theme.
    const customStyles = `
        .gsc-control-cse {
            background-color: transparent !important;
            border: none !important;
            padding: 1rem !important;
            font-family: var(--font-sans), sans-serif !important;
        }
        .gsc-webResult.gsc-result {
            border-color: var(--color-border-color) !important;
            background-color: transparent !important;
            padding: 0 0 1rem 0 !important;
            margin-bottom: 1rem !important;
        }
        .gsc-result-info, .gsc-orderby {
            display: none !important;
        }
        .gs-webResult.gs-result a.gs-title:link,
        .gs-webResult.gs-result a.gs-title:visited {
            color: var(--color-primary) !important;
            text-decoration: none !important;
            font-size: 1rem !important;
            font-family: var(--font-sans), sans-serif !important;
        }
        .gs-webResult.gs-result a.gs-title:hover {
            text-decoration: underline !important;
        }
        .gsc-url-top,
        .gs-webResult .gs-snippet {
            color: var(--color-primary-text) !important;
            font-size: 0.875rem !important;
        }
        .gsc-cursor-box {
            border: none !important;
            margin-top: 1rem;
        }
        .gsc-cursor-page {
            color: var(--color-secondary-text) !important;
            background: transparent !important;
            border-color: var(--color-border-color) !important;
            margin: 0 0.25rem !important;
        }
        .gsc-cursor-current-page {
            color: var(--color-primary) !important;
            background-color: rgba(var(--color-primary-rgb), 0.1) !important;
            border-color: var(--color-primary) !important;
        }
        .gsc-adBlock {
            display: none !important; /* Hide ads */
        }
        .gs-image-box, .gs-promotion-image-box {
            float: left;
            margin-right: 0.75rem;
        }
        .gsc-results .gsc-cursor-box .gsc-cursor-current-page {
             font-weight: bold;
        }
    `;

    return (
        <div className="fixed inset-0 z-40 flex items-end md:items-stretch md:justify-end" aria-modal="true" role="dialog">
            <style>{customStyles}</style>
            <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
            <div className="relative z-10 w-full h-4/5 md:h-full md:w-2/5 lg:w-1/3 bg-[var(--color-background)] text-[var(--color-primary-text)] shadow-2xl flex flex-col animate-search-panel-in">
                <header className="flex items-center justify-between p-4 border-b border-[var(--color-border-color)] flex-shrink-0">
                    <h3 className="font-bold truncate">Search Results for "{query}"</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-[rgba(var(--color-border-color-rgb),0.2)]" aria-label="Close search">
                        <IconClose className="w-5 h-5"/>
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto relative">
                    {isLoading && !error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-background)] z-10">
                            <div className="flex items-center space-x-2">
                                <IconSpinner className="w-6 h-6 text-[var(--color-primary)]" />
                                <span>Searching...</span>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="p-4 text-red-700 bg-red-50 m-4 rounded-md text-center">
                            <p className="font-semibold mb-1">Search Unavailable</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    {/* This div will be populated by the Google CSE script */}
                    <div className="gcse-searchresults-only" id="zizhi-search-results"></div>
                </div>
            </div>
        </div>
    );
};

export default SearchSidebar;
