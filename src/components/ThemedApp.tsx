import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd';
import { useTheme } from '../hooks/useTheme';
import App from '../App';

const darkTokens = {
  colorPrimary: '#7C3AED',
  colorSuccess: '#10B981',
  colorError: '#EF4444',
  colorWarning: '#F59E0B',
  colorInfo: '#7C3AED',
  fontFamily: "'Inter', sans-serif",
  fontSize: 15,
  borderRadius: 10,
  colorBgContainer: '#13131A',
  colorBgElevated: '#1C1C27',
  colorBgLayout: '#0A0A0F',
  colorBgBase: '#0A0A0F',
  colorText: '#F1F0FF',
  colorTextSecondary: '#9CA3AF',
  colorTextTertiary: '#6B7280',
  colorBorder: 'rgba(255,255,255,0.08)',
  colorBorderSecondary: 'rgba(255,255,255,0.05)',
  controlHeight: 44,
  boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
};

const lightTokens = {
  colorPrimary: '#7C3AED',
  colorSuccess: '#059669',
  colorError: '#DC2626',
  colorWarning: '#D97706',
  colorInfo: '#7C3AED',
  fontFamily: "'Inter', sans-serif",
  fontSize: 15,
  borderRadius: 10,
  colorBgContainer: '#FFFFFF',
  colorBgElevated: '#F9F9FF',
  colorBgLayout: '#F4F4F8',
  colorBgBase: '#F4F4F8',
  colorText: '#1A1A2E',
  colorTextSecondary: '#4B5563',
  colorTextTertiary: '#9CA3AF',
  colorBorder: 'rgba(0,0,0,0.08)',
  colorBorderSecondary: 'rgba(0,0,0,0.05)',
  controlHeight: 44,
  boxShadow: '0 4px 16px rgba(124,58,237,0.08)',
};

function buildComponents(isDark: boolean) {
  return {
    Button: { primaryShadow: 'none', borderRadius: 10, controlHeight: 44, controlHeightLG: 52 },
    Card: { borderRadiusLG: 14, boxShadowTertiary: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(124,58,237,0.07)' },
    Input: { colorBgContainer: isDark ? '#1C1C27' : '#FFFFFF', borderRadius: 10 },
    Select: { colorBgContainer: isDark ? '#1C1C27' : '#FFFFFF', borderRadius: 10 },
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
      headerBg: isDark ? '#0D0D14' : '#FFFFFF',
      bodyBg: isDark ? '#0A0A0F' : '#F4F4F8',
      siderBg: isDark ? '#0D0D14' : '#FFFFFF',
      footerBg: isDark ? '#0D0D14' : '#F4F4F8',
    },
    Table: {
      colorBgContainer: isDark ? '#13131A' : '#FFFFFF',
      headerBg: isDark ? '#1C1C27' : '#F9F9FF',
      rowHoverBg: 'rgba(124,58,237,0.06)',
    },
    Modal: { contentBg: isDark ? '#13131A' : '#FFFFFF', headerBg: isDark ? '#13131A' : '#FFFFFF' },
    Dropdown: { colorBgElevated: isDark ? '#1C1C27' : '#FFFFFF' },
    Tag: { borderRadiusSM: 6 },
    Pagination: { itemActiveBg: 'rgba(124,58,237,0.15)' },
  };
}

export function ThemedApp() {
  const { isDark } = useTheme();
  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: isDark ? darkTokens : lightTokens,
        components: buildComponents(isDark),
      }}
    >
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  );
}
