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
  borderRadius: 12,
  colorBgContainer: '#FFFFFF',
  colorBgElevated: '#FFFFFF',
  colorBgLayout: '#A9A9A9',
  colorBgBase: '#F7F5FA',
  colorText: '#1B1225',
  colorTextSecondary: '#4A3F5C',
  colorTextTertiary: '#8A8198',
  colorBorder: 'rgba(80,60,120,0.12)',
  colorBorderSecondary: 'rgba(80,60,120,0.08)',
  controlHeight: 44,
  boxShadow: '0 4px 16px rgba(80,60,120,0.10)',
};

const components = {
  Button: { primaryShadow: 'none', borderRadius: 10, controlHeight: 44, controlHeightLG: 52 },
  Card: { borderRadiusLG: 16, boxShadowTertiary: '0 2px 12px rgba(80,60,120,0.08)' },
  Input: { colorBgContainer: '#FFFFFF', borderRadius: 12 },
  Select: { colorBgContainer: '#FFFFFF', borderRadius: 12 },
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
    headerBg: '#FAFAFA',
    bodyBg: '#A9A9A9',
    siderBg: '#FAFAFA',
    footerBg: 'transparent',
  },
  Table: {
    colorBgContainer: '#FFFFFF',
    headerBg: '#F7F5FA',
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
