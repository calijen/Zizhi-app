import React from 'react';

interface TextSelectionPopupProps {
  top: number;
  left: number;
  onCopy: () => void;
  onQuote: () => void;
  onSearch: () => void;
  isMobile: boolean;
}

const TextSelectionPopup: React.FC<TextSelectionPopupProps> = ({ top, left, onCopy, onQuote, onSearch, isMobile }) => {
  if (isMobile) {
    return (
      <div
        data-selection-popup="true"
        className="fixed bottom-8 left-1/2 z-50 flex items-center bg-[var(--color-primary-text)] text-[var(--color-background)] rounded-full shadow-2xl transform -translate-x-1/2 animate-slide-up-centered"
        // Stop propagation to prevent the click from deselecting the text in the viewer
        onMouseUp={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <button onClick={onCopy} className="px-6 py-3 active:bg-white/20 transition-colors text-base font-medium rounded-l-full border-r border-white/20 whitespace-nowrap">
          Copy
        </button>
        <button onClick={onQuote} className="px-6 py-3 active:bg-white/20 transition-colors text-base font-medium border-r border-white/20 whitespace-nowrap">
          Quote
        </button>
        <button onClick={onSearch} className="px-6 py-3 active:bg-white/20 transition-colors text-base font-medium rounded-r-full whitespace-nowrap">
          Search
        </button>
      </div>
    );
  }

  return (
    <div
      data-selection-popup="true"
      className="absolute z-30 flex items-center bg-[var(--color-primary-text)] text-[var(--color-background)] rounded-md shadow-xl"
      style={{ top: top, left, transform: 'translate(-50%, -120%)' }}
      onMouseUp={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button onClick={onCopy} title="Copy" className="px-4 py-2 hover:bg-white/20 transition-colors text-sm font-medium rounded-l-md">
        Copy
      </button>
      <div className="w-px h-5 bg-white/20" />
      <button onClick={onQuote} title="Save as Quote" className="px-4 py-2 hover:bg-white/20 transition-colors text-sm font-medium">
        Quote
      </button>
      <div className="w-px h-5 bg-white/20" />
      <button onClick={onSearch} title="Search Online" className="px-4 py-2 hover:bg-white/20 transition-colors text-sm font-medium rounded-r-md">
        Search
      </button>
    </div>
  );
};

export default TextSelectionPopup;