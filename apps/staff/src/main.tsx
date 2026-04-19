import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '@code829/shared/context/ThemeContext';
import { ThemedApp } from '@code829/shared/components/ThemedApp';
import { initGlobalErrorListeners } from '@code829/shared/lib/globalErrors';
import { installConsoleBuffer } from '@code829/shared/lib/consoleBuffer';
import { configureApiClient } from '@code829/shared/lib/axios';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/700.css';
import '@code829/shared/index.css';
import App from './App';

installConsoleBuffer();
initGlobalErrorListeners();
configureApiClient('staff');

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <ThemedApp>
          <App />
        </ThemedApp>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>,
);
