import React, { useEffect, useState } from 'react';
import { IconClose } from './icons';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  message: string;
  action?: ToastAction;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, action, type = 'info', onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Only set a timeout if there's no action (or maybe even with action, but user wants it to fade out).
    // Prompt: "messages should be shown in red, orange or green respectively and should fade out after a few seconds"
    const timer = setTimeout(() => {
      setIsClosing(true);
    }, 4000); // 4 seconds before starting fade-out

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        onClose();
      }, 300); // match duration of fade out
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  const handleActionClick = () => {
    if (action) {
      action.onClick();
    }
    setIsClosing(true);
  };

  const colors = {
    info: 'bg-black text-white border-white',
    success: 'bg-green-500 text-white border-black',
    error: 'bg-red-500 text-white border-black',
    warning: 'bg-orange-500 text-white border-black'
  };

  return (
    <div 
      className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[5000] px-6 py-4 rounded-none border-4 shadow-[8px_8px_0_black] flex items-center gap-6 min-w-[300px] transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'animate-fade-in opacity-100'} ${colors[type]}`} 
      role="alert"
    >
      <span className="font-black uppercase tracking-widest text-xs flex-1">{message}</span>
      {action && (
        <button 
          onClick={handleActionClick} 
          className="font-black uppercase text-[10px] tracking-[0.2em] bg-cyan-400 text-black px-4 py-2 rounded-none border-2 border-black hover:bg-yellow-400 transition-colors shadow-[3px_3px_0_transparent]"
        >
          {action.label}
        </button>
      )}
      <button onClick={() => setIsClosing(true)} className="ml-2 hover:opacity-70 transition-opacity flex-shrink-0">
        <IconClose size={20} />
      </button>
    </div>
  );
};

export default Toast;