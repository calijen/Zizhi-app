
import React from 'react';
import { IconCopy, IconShare, IconQuote, IconSearch } from './icons';

interface TextSelectionPopupProps {
  onCopy: () => void;
  onQuote: () => void;
  onSearch: () => void;
  onShare: () => void;
}

const TextSelectionPopup: React.FC<TextSelectionPopupProps> = ({ onCopy, onQuote, onSearch, onShare }) => {
  const Button = ({ onClick, icon: Icon, label }: { onClick: () => void; icon: any; label: string }) => (
    <button 
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }} 
      className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 hover:bg-white/10 active:bg-white/20 transition-all min-w-[64px]"
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-bold uppercase tracking-tight opacity-90">{label}</span>
    </button>
  );

  const Separator = () => <div className="w-px h-8 bg-white/10 self-center" />;

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
  };

  return (
    <div
      data-selection-popup="true"
      className="fixed bottom-[20%] left-1/2 -translate-x-1/2 z-[1000] flex items-stretch bg-[#1a1a1a] text-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-white/20 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      onMouseUp={handleInteraction}
      onMouseDown={handleInteraction}
      onTouchStart={handleInteraction}
      role="toolbar"
      aria-label="Selection actions"
    >
      <Button onClick={onCopy} icon={IconCopy} label="Copy" />
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
