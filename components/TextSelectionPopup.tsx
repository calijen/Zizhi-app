
import React from 'react';

interface TextSelectionPopupProps {
  top: number;
  left: number;
  onCopy: () => void;
  onQuote: () => void;
  onSearch: () => void;
  onShare: () => void;
  isMobile: boolean;
}

const TextSelectionPopup: React.FC<TextSelectionPopupProps> = ({ top, left, onCopy, onQuote, onSearch, onShare, isMobile }) => {
  const Button = ({ onClick, children, rounded = '' }: any) => (
    <button onClick={onClick} className={`px-4 py-2 hover:bg-white/20 active:bg-white/30 transition-colors text-sm font-medium whitespace-nowrap select-none ${rounded}`}>
      {children}
    </button>
  );

  return (
    <div
      data-selection-popup="true"
      className={`fixed z-[100] flex items-center bg-[#1a1a1a] text-white rounded-xl shadow-2xl select-none ${isMobile ? 'bottom-12 left-1/2 -translate-x-1/2 animate-slide-up-centered' : ''}`}
      style={!isMobile ? { top: top, left, transform: 'translate(-50%, -130%)' } : {}}
      onMouseUp={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      role="toolbar"
    >
      <Button onClick={onCopy} rounded="rounded-l-xl">Copy</Button>
      <div className="w-px h-5 bg-white/10" />
      <Button onClick={onShare}>Share</Button>
      <div className="w-px h-5 bg-white/10" />
      <Button onClick={onSearch}>Search</Button>
      <div className="w-px h-5 bg-white/10" />
      <Button onClick={onQuote} rounded="rounded-r-xl">Quote</Button>
    </div>
  );
};

export default TextSelectionPopup;
