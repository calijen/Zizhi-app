
import React, { useMemo } from 'react';
import { IconNote, IconShare, IconQuote, IconSearch } from './icons';

interface TextSelectionPopupProps {
  rect: DOMRect;
  onNote: () => void;
  onQuote: () => void;
  onSearch: () => void;
  onShare: () => void;
}

const Button = ({ onClick, icon: Icon, label }: { onClick: () => void; icon: any; label: string }) => (
  <button 
    onPointerDown={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }} 
    className="flex flex-col items-center justify-center gap-1.5 px-5 py-3.5 hover:bg-white/10 active:bg-white/20 active:scale-90 transition-all min-w-[70px]"
  >
    <Icon className="w-4 h-4 text-white/90" />
    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/40">{label}</span>
  </button>
);

const Separator = () => <div className="w-px h-8 bg-white/10 self-center mx-0.5" />;

const TextSelectionPopup: React.FC<TextSelectionPopupProps> = ({ rect, onNote, onQuote, onSearch, onShare }) => {
  const positionStyle = useMemo(() => {
    const barWidth = 300;
    const barHeight = 65;
    
    // Position above selection with a small offset
    let top = rect.top - barHeight - 15;
    let left = rect.left + (rect.width / 2) - (barWidth / 2);
 
    // If too close to top of screen, show below selection
    if (top < 80) {
      top = rect.bottom + 15;
    }
 
    // Keep within horizontal bounds
    left = Math.max(15, Math.min(window.innerWidth - barWidth - 15, left));
    
    return {
        top: `${top}px`,
        left: `${left}px`,
        width: `${barWidth}px`
    };
  }, [rect]);
 
  return (
    <div
      style={positionStyle}
      className="fixed z-[1000] flex items-stretch bg-[#0A0A0B] text-white rounded-none shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8)] border border-white/15 overflow-hidden animate-pop-in selection-popup backdrop-blur-2xl"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Button onClick={onNote} icon={IconNote} label="Note" />
      <Separator />
      <Button onClick={onShare} icon={IconShare} label="Share" />
      <Separator />
      <Button onClick={onQuote} icon={IconQuote} label="Quote" />
      <Separator />
      <Button onClick={onSearch} icon={IconSearch} label="Search" />
    </div>
  );
};

export default TextSelectionPopup;
