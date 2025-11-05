import React from 'react';
import { IconCopy, IconQuote, IconSearch } from './icons';

interface TextSelectionPopupProps {
  top: number;
  left: number;
  onCopy: () => void;
  onQuote: () => void;
  onSearch: () => void;
}

const TextSelectionPopup: React.FC<TextSelectionPopupProps> = ({ top, left, onCopy, onQuote, onSearch }) => {
  return (
    <div
      className="absolute z-30 flex items-center gap-1 p-1 bg-background rounded-lg shadow-lg border border-border-color"
      style={{ top: top, left, transform: 'translateY(-110%)' }}
      // Prevent mouse up on the popup from re-triggering a new selection event
      onMouseUp={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button onClick={onCopy} title="Copy" className="p-2 rounded-md hover:bg-border-color/20 transition-colors">
        <IconCopy className="w-5 h-5" />
      </button>
      <button onClick={onQuote} title="Save as Quote" className="p-2 rounded-md hover:bg-border-color/20 transition-colors">
        <IconQuote className="w-5 h-5" />
      </button>
      <button onClick={onSearch} title="Search" className="p-2 rounded-md hover:bg-border-color/20 transition-colors">
        <IconSearch className="w-5 h-5" />
      </button>
    </div>
  );
};

export default TextSelectionPopup;