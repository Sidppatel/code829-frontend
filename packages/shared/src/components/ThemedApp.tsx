import type { ReactNode } from 'react';
import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd';

const tokens = {
  colorPrimary: '#7C3AED',
  colorSuccess: '#059669',
  colorError: '#DC2626',
  colorWarning: '#D97706',
  colorInfo: '#7C3AED',
  fontFamily: "'Inter', sans-serif",
  fontSize: 15,
  borderRadius: 10,
  colorBgContainer: '#B8B8B8',
  colorBgElevated: '#C4C4C4',
  colorBgLayout: '#A9A9A9',
  colorBgBase: '#A9A9A9',
  colorText: '#1A1A1A',
  colorTextSecondary: '#3A3A3A',
  colorTextTertiary: '#5A5A5A',
  colorBorder: 'rgba(0,0,0,0.12)',
  colorBorderSecondary: 'rgba(0,0,0,0.08)',
  controlHeight: 44,
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
};

const components = {
  Button: { primaryShadow: 'none', borderRadius: 10, controlHeight: 44, controlHeightLG: 52 },
  Card: { borderRadiusLG: 14, boxShadowTertiary: '0 2px 12px rgba(0,0,0,0.08)' },
  Input: { colorBgContainer: '#C4C4C4', borderRadius: 10 },
  Select: { colorBgContainer: '#C4C4C4', borderRadius: 10 },
  Menu: {
    darkItemBg: 'transparent',
    darkSubMenuItemBg: 'transparent',
    darkItemSelectedBg: 'rgba(124,58,237,0.18)',
    darkItemHoverBg: 'rgba(124,58,237,0.08)',
    itemSelectedBg: 'rgba(124,58,237,0.10)',
    itemHoverBg: 'rgba(124,58,237,0.05)',
    itemSelectedColor: '#7C3AED',
  },
  Layout: {
    headerBg: '#B8B8B8',
    bodyBg: '#A9A9A9',
    siderBg: '#B8B8B8',
    footerBg: '#A9A9A9',
  },
  Table: {
    colorBgContainer: '#B8B8B8',
    headerBg: '#C4C4C4',
    rowHoverBg: 'rgba(124,58,237,0.06)',
  },
  Modal: { contentBg: '#B8B8B8', headerBg: '#B8B8B8' },
  Dropdown: { colorBgElevated: '#C4C4C4' },
  Tag: { borderRadiusSM: 6 },
  Pagination: { itemActiveBg: 'rgba(124,58,237,0.15)' },
};

export function ThemedApp({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: antTheme.defaultAlgorithm,
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
