
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
