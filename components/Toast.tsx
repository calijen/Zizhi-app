import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  message: string;
  action?: ToastAction;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, action, onClose, duration }) => {
  const onCloseRef = useRef(onClose);

  // Keep latest onClose callback in a ref to avoid resetting timer on parent re-renders
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // Auto dismiss after duration (defaults: 4s for info, 6s for actionable toasts)
    const timeoutMs = duration || (action ? 6000 : 4000);

    const timer = setTimeout(() => {
      if (onCloseRef.current) {
        onCloseRef.current();
      }
    }, timeoutMs);

    return () => {
      clearTimeout(timer);
    };
  }, [message, action, duration]);

  const handleActionClick = () => {
    if (action) {
      action.onClick();
    }
    onClose();
  };

  return (
    <div 
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[5000] bg-black text-white px-5 py-3.5 rounded-none border-4 border-white shadow-[8px_8px_0_black] animate-fade-in flex items-center gap-4 min-w-[280px] max-w-[90vw]" 
      role="alert"
    >
      <span className="font-black uppercase tracking-widest text-xs flex-1">{message}</span>
      
      {action && (
        <button 
          onClick={handleActionClick} 
          className="font-black uppercase text-[10px] tracking-[0.2em] bg-cyan-400 text-black px-4 py-2 rounded-none border-2 border-black hover:bg-yellow-400 transition-colors shadow-[3px_3px_0_white] cursor-pointer shrink-0"
        >
          {action.label}
        </button>
      )}

      <button
        onClick={onClose}
        className="p-1 text-slate-400 hover:text-white transition-colors rounded cursor-pointer shrink-0"
        title="Dismiss notification"
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default Toast;
