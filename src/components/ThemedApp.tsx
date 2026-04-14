import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd';
import App from '../App';

const tokens = {
  colorPrimary: '#7C3AED',
  colorSuccess: '#059669',
  colorError: '#DC2626',
  colorWarning: '#D97706',
  colorInfo: '#7C3AED',
  fontFamily: "'Inter', sans-serif",
  fontSize: 15,
  borderRadius: 10,
  colorBgContainer: '#FFFFFF',
  colorBgElevated: '#F5F5F5',
  colorBgLayout: '#A9A9A9',
  colorBgBase: '#A9A9A9',
  colorText: '#1A1A1A',
  colorTextSecondary: '#4B4B4B',
  colorTextTertiary: '#787878',
  colorBorder: 'rgba(0,0,0,0.10)',
  colorBorderSecondary: 'rgba(0,0,0,0.06)',
  controlHeight: 44,
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
};

const components = {
  Button: { primaryShadow: 'none', borderRadius: 10, controlHeight: 44, controlHeightLG: 52 },
  Card: { borderRadiusLG: 14, boxShadowTertiary: '0 2px 12px rgba(0,0,0,0.08)' },
  Input: { colorBgContainer: '#FFFFFF', borderRadius: 10 },
  Select: { colorBgContainer: '#FFFFFF', borderRadius: 10 },
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
    headerBg: '#FFFFFF',
    bodyBg: '#A9A9A9',
    siderBg: '#FFFFFF',
    footerBg: '#A9A9A9',
  },
  Table: {
    colorBgContainer: '#FFFFFF',
    headerBg: '#F5F5F5',
    rowHoverBg: 'rgba(124,58,237,0.06)',
  },
  Modal: { contentBg: '#FFFFFF', headerBg: '#FFFFFF' },
  Dropdown: { colorBgElevated: '#FFFFFF' },
  Tag: { borderRadiusSM: 6 },
  Pagination: { itemActiveBg: 'rgba(124,58,237,0.15)' },
};

export function ThemedApp() {
  return (
    <ConfigProvider
      theme={{
        algorithm: antTheme.defaultAlgorithm,
        token: tokens,
        components,
      }}
    >
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  );
}
