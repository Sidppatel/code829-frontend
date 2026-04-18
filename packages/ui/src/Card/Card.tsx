import React from 'react';
import './Card.css';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardVariant = 'surface' | 'elevated' | 'outlined' | 'glass';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'surface', padding = 'md', interactive = false, className, children, ...rest },
  ref,
) {
  const classes = [
    'ui-card',
    `ui-card--${variant}`,
    `ui-card--pad-${padding}`,
    interactive ? 'ui-card--interactive' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  );
});

export interface CardSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = React.forwardRef<HTMLDivElement, CardSectionProps>(function CardHeader(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={`ui-card__header ${className ?? ''}`} {...rest} />;
});

export const CardBody = React.forwardRef<HTMLDivElement, CardSectionProps>(function CardBody(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={`ui-card__body ${className ?? ''}`} {...rest} />;
});

export const CardFooter = React.forwardRef<HTMLDivElement, CardSectionProps>(function CardFooter(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={`ui-card__footer ${className ?? ''}`} {...rest} />;
});
