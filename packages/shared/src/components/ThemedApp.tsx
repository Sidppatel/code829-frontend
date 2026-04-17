import type { ReactNode } from 'react';
import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd';
import { semantic, status, shadows, applyThemeVars } from '../theme/colors';

applyThemeVars();

const tokens = {
  colorPrimary: semantic.brand,
  colorSuccess: status.success,
  colorError: status.danger,
  colorWarning: status.warning,
  colorInfo: status.info,
  fontFamily: "'Inter', sans-serif",
  fontSize: 15,
  borderRadius: 12,
  colorBgContainer: semantic.surface.surface,
  colorBgElevated: semantic.surface.elevated,
  colorBgLayout: semantic.surface.page,
  colorBgBase: semantic.surface.page,
  colorText: semantic.text.primary,
  colorTextSecondary: semantic.text.secondary,
  colorTextTertiary: semantic.text.muted,
  colorBorder: semantic.border.default,
  colorBorderSecondary: semantic.border.subtle,
  controlHeight: 44,
  boxShadow: shadows.antToken,
};

const components = {
  Button: { primaryShadow: 'none', borderRadius: 12, controlHeight: 44, controlHeightLG: 52 },
  Card: { borderRadiusLG: 16, boxShadowTertiary: shadows.antCard },
  Input: { colorBgContainer: semantic.surface.surface, borderRadius: 12 },
  Select: { colorBgContainer: semantic.surface.surface, borderRadius: 12 },
  Menu: {
    itemSelectedBg: semantic.surface.muted,
    itemHoverBg: semantic.surface.soft,
    itemSelectedColor: semantic.brand,
  },
  Layout: {
    headerBg: semantic.surface.page,
    bodyBg: semantic.surface.page,
    siderBg: semantic.surface.elevated,
    footerBg: 'transparent',
  },
  Table: {
    colorBgContainer: semantic.surface.surface,
    headerBg: semantic.surface.elevated,
    rowHoverBg: semantic.surface.soft,
  },
  Modal: { contentBg: semantic.surface.surface, headerBg: semantic.surface.surface },
  Dropdown: { colorBgElevated: semantic.surface.surface },
  Tag: { borderRadiusSM: 6 },
  Pagination: { itemActiveBg: semantic.surface.muted },
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
