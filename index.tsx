
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Register Service Worker for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
      
      // Check for updates
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content is available, but the user needs to reload
                console.log('New content is available; please refresh.');
              } else {
                // Content is cached for offline use
                console.log('Content is cached for offline use.');
              }
            }
          };
        }
      };
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
