import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './context/ThemeContext';
import { ThemedApp } from './components/ThemedApp';
import { initGlobalErrorListeners } from './lib/globalErrors';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/700.css';
import './index.css';

// Initialize global error & warning capture
initGlobalErrorListeners();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>,
);
