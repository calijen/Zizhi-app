
import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';

const ReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-8 right-8 z-[5000] p-6 bg-[var(--color-surface)] border-4 border-black shadow-[8px_8px_0_#000] max-w-sm"
        >
          <div className="mb-4">
            {offlineReady ? (
              <p className="font-black uppercase tracking-tight text-sm">App ready to work offline</p>
            ) : (
              <p className="font-black uppercase tracking-tight text-sm">New content available, click on reload button to update.</p>
            )}
          </div>
          <div className="flex gap-4">
            {needRefresh && (
              <button
                onClick={() => updateServiceWorker(true)}
                className="px-4 py-2 bg-cyan-400 border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_#000] active:translate-y-0.5 active:shadow-none transition-all"
              >
                Reload
              </button>
            )}
            <button
              onClick={() => close()}
              className="px-4 py-2 bg-white border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0_#000] active:translate-y-0.5 active:shadow-none transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReloadPrompt;
