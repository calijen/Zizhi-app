import React, { useEffect } from 'react';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  message: string;
  action?: ToastAction;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, action, onClose }) => {
  useEffect(() => {
    // Only set a timeout if there's no action
    if (!action) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [onClose, action]);

  const handleActionClick = () => {
    if (action) {
      action.onClick();
      onClose();
    }
  };

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[5000] bg-black text-white px-6 py-4 rounded-none border-4 border-white shadow-[8px_8px_0_black] animate-fade-in flex items-center gap-6 min-w-[300px]" role="alert">
      <span className="font-black uppercase tracking-widest text-xs">{message}</span>
      {action && (
        <button 
          onClick={handleActionClick} 
          className="font-black uppercase text-[10px] tracking-[0.2em] bg-cyan-400 text-black px-4 py-2 rounded-none border-2 border-black hover:bg-yellow-400 transition-colors shadow-[3px_3px_0_white]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default Toast;