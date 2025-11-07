import React from 'react';

interface TextSelectionPopupProps {
  top: number;
  left: number;
  onCopy: () => void;
  onQuote: () => void;
}

const TextSelectionPopup: React.FC<TextSelectionPopupProps> = ({ top, left, onCopy, onQuote }) => {
  return (
    <div
      data-selection-popup="true"
      className="absolute z-30 flex items-center bg-secondary-text text-background rounded-md shadow-xl"
      style={{ top: top, left, transform: 'translate(-50%, -120%)' }}
      // Prevent mouse up on the popup from re-triggering a new selection event
      onMouseUp={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button onClick={onCopy} title="Copy" className="px-4 py-2 hover:bg-primary-text transition-colors text-sm font-medium rounded-l-md">
        Copy
      </button>
      <div className="w-px h-5 bg-background/20" />
      <button onClick={onQuote} title="Save as Quote" className="px-4 py-2 hover:bg-primary-text transition-colors text-sm font-medium rounded-r-md">
        Quote
      </button>
    </div>
  );
};

export default TextSelectionPopup;