import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, App as AntApp } from 'antd';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App';

const theme = {
  token: {
    colorPrimary: '#4f46e5',
    colorSuccess: '#22c55e',
    colorError: '#ef4444',
    colorWarning: '#f59e0b',
    colorInfo: '#0ea5e9',
    fontFamily: "'DM Sans', sans-serif",
    fontFamilyCode: "'JetBrains Mono', monospace",
    borderRadius: 8,
    colorBgContainer: '#ffffff',
    colorBgLayout: '#fafaf9',
    colorText: '#1c1917',
    colorTextSecondary: '#57534e',
    colorBorder: '#e7e5e4',
  },
};

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <HelmetProvider>
      <ConfigProvider theme={theme}>
        <AntApp>
          <App />
        </AntApp>
      </ConfigProvider>
    </HelmetProvider>
  </StrictMode>,
);
