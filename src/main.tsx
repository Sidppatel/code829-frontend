import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App';

const theme = {
  algorithm: antTheme.darkAlgorithm,
  token: {
    colorPrimary: '#7C3AED',
    colorSuccess: '#10B981',
    colorError: '#EF4444',
    colorWarning: '#F59E0B',
    colorInfo: '#7C3AED',
    fontFamily: "'Inter', sans-serif",
    fontFamilyCode: "'JetBrains Mono', monospace",
    fontSize: 15,
    borderRadius: 8,
    colorBgContainer: '#13131A',
    colorBgElevated: '#1C1C27',
    colorBgLayout: '#0A0A0F',
    colorBgBase: '#0A0A0F',
    colorText: '#F1F0FF',
    colorTextSecondary: '#9CA3AF',
    colorTextTertiary: '#6B7280',
    colorTextQuaternary: '#4B5563',
    colorBorder: 'rgba(255, 255, 255, 0.08)',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.06)',
    colorBgSpotlight: '#1C1C27',
    controlHeight: 40,
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
    boxShadowSecondary: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  components: {
    Button: {
      primaryShadow: 'none',
      borderRadius: 8,
      controlHeight: 40,
      controlHeightLG: 48,
    },
    Card: {
      colorBgContainer: '#13131A',
      borderRadiusLG: 12,
      boxShadowTertiary: '0 2px 12px rgba(0, 0, 0, 0.2)',
    },
    Input: {
      colorBgContainer: '#1C1C27',
      borderRadius: 8,
    },
    Select: {
      colorBgContainer: '#1C1C27',
      borderRadius: 8,
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemSelectedBg: 'rgba(124, 58, 237, 0.15)',
      darkItemHoverBg: 'rgba(124, 58, 237, 0.08)',
    },
    Layout: {
      headerBg: '#0A0A0F',
      bodyBg: '#0A0A0F',
      siderBg: '#13131A',
      footerBg: '#0A0A0F',
    },
    Table: {
      colorBgContainer: '#13131A',
      headerBg: '#1C1C27',
      rowHoverBg: 'rgba(124, 58, 237, 0.06)',
    },
    Modal: {
      contentBg: '#13131A',
      headerBg: '#13131A',
    },
    Pagination: {
      colorBgContainer: '#1C1C27',
      itemActiveBg: 'rgba(124, 58, 237, 0.2)',
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Dropdown: {
      colorBgElevated: '#1C1C27',
    },
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
