/**
 * Design tokens — single typed facade over the `theme/` modules.
 *
 * Each theme module (`colors`, `spacing`, `radii`, `typography`, `motion`) owns
 * its CSS-var injection. This file re-exposes the values as one flat object so
 * JS consumers (Ant ConfigProvider, generated tokens.json, Figma sync) have a
 * single import point. Do not duplicate values here — pull from `theme/*`.
 */
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
