import type { ReactNode } from 'react';
import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd';
import { semantic, status, shadows, applyThemeVars } from '../theme/colors';
// Side-effect imports: each module self-injects its CSS vars at parse time.
import '../theme/typography';
import '../theme/spacing';
import '../theme/radii';
import '../theme/motion';

applyThemeVars();

const tokens = {
  colorPrimary: semantic.brand,
  colorSuccess: status.success,
  colorError: status.danger,
  colorWarning: status.warning,
  colorInfo: semantic.brand,
  fontFamily: "'Inter', sans-serif",
  fontSize: 15,
  borderRadius: 12,
  colorBgContainer: semantic.surface.surface,
  colorBgElevated: semantic.surface.elevated,
  colorBgLayout: semantic.surface.page,
  colorBgBase: semantic.surface.nav,
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
    darkItemBg: 'transparent',
    darkSubMenuItemBg: 'transparent',
    darkItemSelectedBg: semantic.surface.pressed,
    darkItemHoverBg: semantic.surface.soft,
    itemSelectedBg: semantic.surface.muted,
    itemHoverBg: semantic.surface.soft,
    itemSelectedColor: semantic.brandLight,
  },
  Layout: {
    headerBg: semantic.surface.nav,
    bodyBg: semantic.surface.page,
    siderBg: semantic.surface.nav,
    footerBg: 'transparent',
  },
  Table: {
    colorBgContainer: semantic.surface.surface,
    headerBg: semantic.surface.nav,
    rowHoverBg: semantic.surface.soft,
  },
  Modal: { contentBg: semantic.surface.surface, headerBg: semantic.surface.surface },
  Dropdown: { colorBgElevated: semantic.surface.elevated },
  Tag: { borderRadiusSM: 6 },
  Pagination: { itemActiveBg: semantic.surface.pressed },
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
