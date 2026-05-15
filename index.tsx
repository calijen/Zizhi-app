import React from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: '"Gentium Book Plus", serif',
  headings: {
    fontFamily: '"Alfa Slab One", serif',
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Registration handled by vite-plugin-pwa in production
// Only manual registration should be here if VitePWA is not used

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <App />
        <Analytics />
      </MantineProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
