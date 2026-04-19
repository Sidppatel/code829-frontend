/**
 * `<Text token="…" />` — renders a centralized copy + typography token
 * from `packages/shared/src/theme/strings.ts`.
 *
 * The `token` prop accepts either:
 *   - a dotted-path key into the `strings` registry (compile-time checked
 *     via `TextTokenPath`, e.g. `"events.heroTagline"`), or
 *   - a resolved `TextToken` object, used for templated/interpolated copy
 *     returned from `textTemplates`:
 *       <Text token={textTemplates.eveningsAcrossSeason(total)} />
 *
 * Behavior:
 *   - Element type comes from the token's `as` field. Heading levels live
 *     in the registry, not at each call site.
 *   - A caller-supplied `className` is appended to the token's className so
 *     layout tweaks (`mt-4`, `text-center`) compose without losing token
 *     typography.
 *   - `children`, when provided, overrides `token.text`. Useful for mixing
 *     static copy with dynamic inline nodes:
 *       <Text token="events.heroTagline"><em>{highlight}</em></Text>
 */

import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
} from 'react';
import {
  resolveTextToken,
  type TextToken,
  type TextTokenPath,
} from '../../theme/strings';

type TextProps = {
  token: TextTokenPath | TextToken;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'children'>;

export default function Text({
  token,
  className,
  children,
  ...rest
}: TextProps) {
  const resolved: TextToken =
    typeof token === 'string' ? resolveTextToken(token) : token;
  const Tag = resolved.as as ElementType;
  const merged = className
    ? `${resolved.className} ${className}`
    : resolved.className;
  return (
    <Tag className={merged} {...rest}>
      {children ?? resolved.text}
    </Tag>
  );
}
