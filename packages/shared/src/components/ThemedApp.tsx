import type { ReactNode } from 'react';
import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd';

const tokens = {
  colorPrimary: '#7C5CFF',
  colorSuccess: '#10B981',
  colorError: '#F87171',
  colorWarning: '#FBBF24',
  colorInfo: '#7C5CFF',
  fontFamily: "'Inter', sans-serif",
  fontSize: 15,
  borderRadius: 12,
  colorBgContainer: '#1D1727',
  colorBgElevated: '#251E32',
  colorBgLayout: '#120F1A',
  colorBgBase: '#171320',
  colorText: '#F5F2FA',
  colorTextSecondary: '#B8AFC9',
  colorTextTertiary: '#948AA8',
  colorBorder: 'rgba(255,255,255,0.10)',
  colorBorderSecondary: 'rgba(255,255,255,0.06)',
  controlHeight: 44,
  boxShadow: '0 4px 16px rgba(0,0,0,0.30)',
};

const components = {
  Button: { primaryShadow: 'none', borderRadius: 12, controlHeight: 44, controlHeightLG: 52 },
  Card: { borderRadiusLG: 16, boxShadowTertiary: '0 2px 12px rgba(0,0,0,0.20)' },
  Input: { colorBgContainer: '#1D1727', borderRadius: 12 },
  Select: { colorBgContainer: '#1D1727', borderRadius: 12 },
  Menu: {
    darkItemBg: 'transparent',
    darkSubMenuItemBg: 'transparent',
    darkItemSelectedBg: 'rgba(124,92,255,0.18)',
    darkItemHoverBg: 'rgba(124,92,255,0.08)',
    itemSelectedBg: 'rgba(124,92,255,0.15)',
    itemHoverBg: 'rgba(124,92,255,0.08)',
    itemSelectedColor: '#9B82FF',
  },
  Layout: {
    headerBg: '#171320',
    bodyBg: '#120F1A',
    siderBg: '#171320',
    footerBg: 'transparent',
  },
  Table: {
    colorBgContainer: '#1D1727',
    headerBg: '#171320',
    rowHoverBg: 'rgba(124,92,255,0.08)',
  },
  Modal: { contentBg: '#1D1727', headerBg: '#1D1727' },
  Dropdown: { colorBgElevated: '#251E32' },
  Tag: { borderRadiusSM: 6 },
  Pagination: { itemActiveBg: 'rgba(124,92,255,0.18)' },
};

export function ThemedApp({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: antTheme.darkAlgorithm,
        token: tokens,
        components,
      }}
    >
      <AntApp>
        {children}
      </AntApp>
    </ConfigProvider>
  );
}
