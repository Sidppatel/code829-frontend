import { Link } from 'react-router-dom';
import './Footer.css';

export type FooterVariant = 'public' | 'admin' | 'staff' | 'developer';

export interface FooterLink {
  label: string;
  to?: string;
  href?: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterProps {
  variant: FooterVariant;
  columns?: FooterColumn[];
  tagline?: string;
  copyright?: string;
  socials?: FooterLink[];
}

function renderLink(link: FooterLink, className: string) {
  if (link.href) {
    return (
      <a key={link.label} className={className} href={link.href} target="_blank" rel="noreferrer">
        {link.label}
      </a>
    );
  }
  return (
    <Link key={link.label} className={className} to={link.to ?? '#'}>
      {link.label}
    </Link>
  );
}

export function Footer({
  variant,
  columns = [],
  tagline,
  copyright = `© ${new Date().getFullYear()} Code829`,
  socials = [],
}: FooterProps) {
  if (variant === 'public') {
    return (
      <footer className="ui-footer ui-footer--public" aria-label="Site footer">
        <div className="ui-footer__inner">
          <div className="ui-footer__brand-col">
            <div className="ui-footer__brand">
              <span className="ui-footer__brand-mark" aria-hidden="true" />
              <span className="ui-footer__brand-name">Code829</span>
            </div>
            {tagline && <p className="ui-footer__tagline">{tagline}</p>}
            {socials.length > 0 && (
              <ul className="ui-footer__socials">
                {socials.map((s) => (
                  <li key={s.label}>{renderLink(s, 'ui-footer__social')}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="ui-footer__columns">
            {columns.map((col) => (
              <div key={col.title} className="ui-footer__col">
                <div className="ui-footer__col-title">{col.title}</div>
                <ul className="ui-footer__links">
                  {col.links.map((link) => (
                    <li key={link.label}>{renderLink(link, 'ui-footer__link')}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="ui-footer__legal">{copyright}</div>
      </footer>
    );
  }

  return (
    <footer className={`ui-footer ui-footer--minimal ui-footer--${variant}`} aria-label="Site footer">
      <div className="ui-footer__minimal-inner">
        <span className="ui-footer__legal">{copyright}</span>
        {columns.length > 0 && (
          <ul className="ui-footer__links ui-footer__links--inline">
            {columns
              .flatMap((c) => c.links)
              .map((link) => (
                <li key={link.label}>{renderLink(link, 'ui-footer__link')}</li>
              ))}
          </ul>
        )}
      </div>
    </footer>
  );
}
