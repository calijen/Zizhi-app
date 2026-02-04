
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
  const Button = ({ onClick, children, className = '' }: any) => (
    <button 
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }} 
      className={`px-4 py-2 hover:bg-white/10 active:bg-white/20 transition-all text-[12px] font-bold whitespace-nowrap select-none ${className}`}
    >
      {children}
    </button>
  );

  const Separator = () => <div className="w-px h-4 bg-white/20 self-center" />;

  // Prevent parent events from interfering
  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
  };

  return (
    <div
      data-selection-popup="true"
      className="fixed z-[1000] flex items-stretch bg-[#2c2c2c] text-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden animate-in fade-in zoom-in duration-100"
      style={{ 
        top: Math.max(10, top - 60), 
        left: left, 
        transform: 'translate(-50%, -100%)' 
      }}
      onMouseUp={handleInteraction}
      onMouseDown={handleInteraction}
      onTouchStart={handleInteraction}
      role="toolbar"
      aria-label="Text selection actions"
    >
      <Button onClick={onCopy}>Copy</Button>
      <Separator />
      <Button onClick={onShare}>Share</Button>
      <Separator />
      <Button onClick={onQuote}>Quote</Button>
      <Separator />
      <button 
        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className="px-3 py-2 opacity-40 cursor-default"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
        </svg>
      </button>
    </div>
  );
};

export default TextSelectionPopup;
