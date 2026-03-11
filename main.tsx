import { createRoot } from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import App from './App';

const mantineTheme = createTheme({ 
  primaryColor: 'dark', 
  fontFamily: 'Inter, sans-serif',
  components: {
    Button: {
      defaultProps: {
        radius: 0,
      }
    }
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Register Service Worker for PWA capabilities
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

// Clear caches
if ('caches' in window) {
  caches.keys().then(names => {
    for (const name of names) {
      caches.delete(name);
    }
  });
}

console.log('Main.tsx loaded');
const root = createRoot(rootElement);
root.render(
  <MantineProvider theme={mantineTheme} defaultColorScheme="light">
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </MantineProvider>
);
