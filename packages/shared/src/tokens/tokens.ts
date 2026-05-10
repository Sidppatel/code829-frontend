import { palette, semantic, status, shadows, gradients } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
} from '../theme/typography';

export const tokens = {
  colors: {
    primary: semantic.brand,
    primaryHover: semantic.brandHover,
    primaryDark: semantic.brandDark,
    accent: palette.rose,
    background: {
      page: semantic.surface.page,
      surface: semantic.surface.surface,
      elevated: semantic.surface.elevated,
      nav: semantic.surface.nav,
    },
    surface: semantic.surface,
    text: semantic.text,
    border: semantic.border,
    status,
    palette,
    gradients,
    shadows,
  },
  spacing,
  radius: radii,
  typography: {
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    letterSpacing,
  },
} as const;

export type Tokens = typeof tokens;
