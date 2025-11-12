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
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[var(--color-primary-text)] text-[var(--color-background)] px-4 py-2 rounded-md shadow-lg animate-fade-in-out flex items-center gap-4" role="alert">
      <span>{message}</span>
      {action && (
        <button 
          onClick={handleActionClick} 
          className="font-bold uppercase text-sm tracking-wider bg-[var(--color-primary)] text-white px-3 py-1 rounded-md hover:opacity-90 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default Toast;