/**
 * Premium Concierge — centralized UI text registry.
 *
 * This file is the single source of truth for user-visible copy (and the
 * Tailwind typography styling that goes with each piece of copy) in the
 * public app. It intentionally mirrors the shape of `colors.ts`: a frozen,
 * `as const` object exported from this module and consumed by the rest of
 * the app.
 *
 * Convention
 * ----------
 * JSX files in `apps/public` should render user-visible copy through
 * `<Text token="…" />` rather than hardcoding string literals and
 * typography classes. Copy coming from the backend (event names,
 * descriptions, user input) is exempt — only static UI chrome lives here.
 *
 * Organization
 * ------------
 * Tokens are grouped by domain:
 *   - `common`     — buttons / links / labels reused across pages
 *   - `auth`       — login + magic-link + developer-access copy
 *   - `events`     — event listing, hero, collection copy
 *   - `bookings`   — purchases / tickets / cancel flow copy
 *   - `errors`     — toast error + warning strings
 *   - `validation` — form validation messages
 *
 * Each token has shape `{ text, className, as }` so the `<Text>` component
 * can render the correct element type with the correct styling in a single
 * JSX call. For interpolated copy (e.g. pluralization), use the
 * `textTemplates` object below — each entry is a function returning a
 * `TextToken`.
 *
 * Adding a new token
 * ------------------
 * 1. Pick the right domain bucket (or add a new one).
 * 2. Copy the exact Tailwind classes from the existing page so visuals do
 *    not drift. Do not invent new styling here.
 * 3. Choose the correct semantic element (`h1`–`h4`, `p`, `span`, `div`,
 *    `label`) — it is declared once, in the registry, not per caller.
 */

export type TextTokenTag =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'p'
  | 'span'
  | 'div'
  | 'label';

export type TextToken = {
  text: string;
  className: string;
  as: TextTokenTag;
};

export const strings = {
  common: {
    browseEvents: {
      text: 'Browse events',
      className: 'text-sm font-medium',
      as: 'span',
    },
    upcomingSchedule: {
      text: 'Upcoming schedule',
      className: 'text-sm font-medium',
      as: 'span',
    },
    viewAll: {
      text: 'View all →',
      className: 'text-sm text-textMid',
      as: 'span',
    },
    useDifferentEmail: {
      text: 'Use a different email',
      className: 'text-sm font-bold',
      as: 'span',
    },
    continueWithEmail: {
      text: 'Continue with Email',
      className: 'text-base font-extrabold',
      as: 'span',
    },
    exploreExperiences: {
      text: 'Explore experiences',
      className: 'text-sm font-bold',
      as: 'span',
    },
    newToPlatform: {
      text: 'New to the platform?',
      className: 'text-sm font-medium text-textMid',
      as: 'span',
    },
    cancel: {
      text: 'Cancel',
      className: 'text-sm font-medium',
      as: 'span',
    },
  },

  auth: {
    welcomeBack: {
      text: 'Welcome back',
      className: 'text-3xl font-black tracking-tight text-textLight',
      as: 'h1',
    },
    signInSubtitle: {
      text: 'Sign in to your premium account.',
      className: 'text-base font-medium text-textMid',
      as: 'p',
    },
    checkYourMail: {
      text: 'Check your mail',
      className: 'text-2xl font-extrabold text-textLight',
      as: 'h2',
    },
    magicLinkSent: {
      text: "We've sent a magic login link to your inbox. Please click the link to sign in securely.",
      className: 'text-[15px] leading-relaxed text-textMid',
      as: 'p',
    },
    developerAccess: {
      text: 'Developer Access',
      className: 'text-xs font-extrabold uppercase tracking-[1.5px] text-textDim',
      as: 'span',
    },
    devLogin: {
      text: 'Bypass with Dev Login',
      className: 'text-sm font-bold',
      as: 'span',
    },
    signInPageTitle: {
      text: 'Sign In - Code829',
      className: '',
      as: 'span',
    },
  },

  events: {
    seasonTagline: {
      text: 'Spring / Summer 2026',
      className:
        'text-[11px] font-semibold uppercase tracking-[1.5px] text-violetLight',
      as: 'span',
    },
    heroHeadingLine1: {
      text: 'Curated evenings,',
      className:
        "font-display text-[clamp(2.6rem,6vw,4.5rem)] font-bold leading-[1.12] tracking-[-0.04em] text-textLight",
      as: 'span',
    },
    heroHeadingLine2: {
      text: 'thoughtfully seated.',
      className: 'italic font-normal',
      as: 'span',
    },
    heroSubheading: {
      text: 'A private bookings platform for chamber music, tasting dinners, and intimate benefits. Every seat held until payment; every table, claimed with care.',
      className:
        'text-[clamp(0.95rem,1.5vw,1.1rem)] leading-[1.6] text-textMid max-w-[460px]',
      as: 'p',
    },
    yourHostsKicker: {
      text: 'Your hosts',
      className:
        'text-[10px] font-semibold uppercase tracking-[1.5px] text-violetLight',
      as: 'div',
    },
    yourHostsName: {
      text: 'The Code 829 Collective',
      className: "font-display italic text-[15px] text-textLight",
      as: 'div',
    },
    statEventsLabel: {
      text: 'Events this season',
      className: 'text-xs uppercase tracking-[1px] text-textDim',
      as: 'div',
    },
    statVenuesLabel: {
      text: 'Partner venues',
      className: 'text-xs uppercase tracking-[1px] text-textDim',
      as: 'div',
    },
    statRatingLabel: {
      text: 'Guest rating',
      className: 'text-xs uppercase tracking-[1px] text-textDim',
      as: 'div',
    },
    nextInSeason: {
      text: 'Next in season',
      className:
        "font-display text-[clamp(1.8rem,4vw,2.4rem)] font-bold tracking-[-0.02em] text-textLight",
      as: 'h2',
    },
    homePageTitle: {
      text: 'Curated evenings, thoughtfully seated — Code829',
      className: '',
      as: 'span',
    },
    collectionKicker: {
      text: 'The Collection',
      className: 'text-xs uppercase tracking-[1.5px] text-violetLight',
      as: 'span',
    },
    allEvents: {
      text: 'All events',
      className: "font-display text-4xl font-bold text-textLight",
      as: 'h1',
    },
    noEventsFound: {
      text: 'No events found matching your current filters',
      className: 'text-base text-textMid',
      as: 'p',
    },
    eventsPageTitle: {
      text: 'All events — Code829',
      className: '',
      as: 'span',
    },
  },

  bookings: {
    kicker: {
      text: 'Your evenings',
      className: 'text-xs uppercase tracking-[1.5px] text-violetLight',
      as: 'span',
    },
    pageTitle: {
      text: 'My purchases',
      className: "font-display text-4xl font-bold text-textLight",
      as: 'h1',
    },
    pageSubtitle: {
      text: "Review, manage, and share tickets for every reservation you've made.",
      className: 'text-base text-textMid',
      as: 'p',
    },
    searchPlaceholder: {
      text: 'Search by event name, purchase # or status...',
      className: '',
      as: 'span',
    },
    emptyTitle: {
      text: 'No purchases yet',
      className: 'text-lg font-semibold text-textLight',
      as: 'h3',
    },
    emptyDescription: {
      text: 'Your reservations will appear here.',
      className: 'text-sm text-textMid',
      as: 'p',
    },
    actionTickets: {
      text: 'Tickets',
      className: 'text-sm font-medium',
      as: 'span',
    },
    actionQr: {
      text: 'QR',
      className: 'text-sm font-medium',
      as: 'span',
    },
    actionManageTickets: {
      text: 'Manage Tickets',
      className: 'text-sm font-medium',
      as: 'span',
    },
    actionQrCode: {
      text: 'QR Code',
      className: 'text-sm font-medium',
      as: 'span',
    },
    actionCancel: {
      text: 'Cancel',
      className: 'text-sm font-medium',
      as: 'span',
    },
    cancelDialogTitle: {
      text: 'Cancel Purchase',
      className: 'text-lg font-semibold text-textLight',
      as: 'h3',
    },
    cancelDialogDescription: {
      text: 'Are you sure you want to cancel this purchase? This action cannot be undone.',
      className: 'text-sm text-textMid',
      as: 'p',
    },
    cancelDialogDescriptionShort: {
      text: 'Cancel this purchase? This action cannot be undone.',
      className: 'text-sm text-textMid',
      as: 'p',
    },
    cancelDialogConfirm: {
      text: 'Cancel Purchase',
      className: 'text-sm font-medium',
      as: 'span',
    },
    cancelSuccess: {
      text: 'Purchase cancelled',
      className: '',
      as: 'span',
    },
    guestTicketsWarningTitle: {
      text: 'Some guest tickets could not be loaded',
      className: 'text-sm font-semibold text-textLight',
      as: 'span',
    },
    guestTicketsWarningDescription: {
      text: 'Invited tickets may not appear in this list. Refresh the page to try again.',
      className: 'text-sm text-textMid',
      as: 'p',
    },
    guestTicketsCtaSubtitle: {
      text: 'View and manage entries shared with you by others.',
      className: 'text-sm text-textMid',
      as: 'p',
    },
    guestTicketsCtaButton: {
      text: 'View Guest Tickets',
      className: 'text-sm font-semibold',
      as: 'span',
    },
    qrModalPurchaseTitle: {
      text: 'Purchase QR Code',
      className: 'text-lg font-semibold text-textLight',
      as: 'h3',
    },
    qrModalTicketTitle: {
      text: 'Ticket QR',
      className: 'text-lg font-semibold text-textLight',
      as: 'h3',
    },
    qrModalTicketCaption: {
      text: 'Show this QR code at the venue for check-in',
      className: 'text-sm text-textMid',
      as: 'p',
    },
    myPurchasesPageTitle: {
      text: 'My Purchases - Code829',
      className: '',
      as: 'span',
    },
  },

  errors: {
    loadEventsFailed: {
      text: 'Failed to load events',
      className: '',
      as: 'span',
    },
    magicLinkFailed: {
      text: 'Failed to send magic link',
      className: '',
      as: 'span',
    },
    magicLinkRateLimited: {
      text: 'Please wait before requesting another link',
      className: '',
      as: 'span',
    },
    devLoginFailed: {
      text: 'Dev login failed',
      className: '',
      as: 'span',
    },
    magicLinkSuccess: {
      text: 'Check your email for the login link',
      className: '',
      as: 'span',
    },
  },

  validation: {
    emailRequired: {
      text: 'Email is required',
      className: 'text-xs text-redSoft',
      as: 'span',
    },
    emailInvalid: {
      text: 'Enter a valid email',
      className: 'text-xs text-redSoft',
      as: 'span',
    },
  },
} as const satisfies Record<string, Record<string, TextToken>>;

/**
 * Templated copy — functions that produce a `TextToken` from runtime values.
 * Use for pluralization, interpolation, and any copy that can't be a static
 * literal. Consumed by `<Text>` the same way as static tokens:
 *
 *   <Text token={textTemplates.eveningsAcrossSeason(total)} />
 */
export const textTemplates = {
  eveningsAcrossSeason: (n: number): TextToken => ({
    text: `${n} ${n === 1 ? 'evening' : 'evenings'} across the season — curated and held with care.`,
    className: 'text-base text-textMid',
    as: 'p',
  }),
  loggedInAs: (firstName: string): TextToken => ({
    text: `Logged in as ${firstName}`,
    className: '',
    as: 'span',
  }),
  retryInCooldown: (cooldown: string): TextToken => ({
    text: `Retry in ${cooldown}`,
    className: 'text-base font-extrabold',
    as: 'span',
  }),
  guestTicketsCount: (n: number): TextToken => ({
    text: `You have ${n} guest tickets`,
    className: 'text-lg font-bold text-textLight',
    as: 'h3',
  }),
} as const;

export type StringsRegistry = typeof strings;

/**
 * Dotted-path keys over the strings registry — e.g. `'events.heroHeading'`.
 * The `<Text>` component uses this to constrain the `token` prop so invalid
 * keys fail at compile time.
 */
export type TextTokenPath = {
  [D in keyof StringsRegistry]: {
    [K in keyof StringsRegistry[D]]: `${D & string}.${K & string}`;
  }[keyof StringsRegistry[D]];
}[keyof StringsRegistry];

/**
 * Resolve a dotted-path token key to its `TextToken`. Throws at runtime if
 * the path is invalid (which can only happen if the `TextTokenPath` type
 * constraint is circumvented with a cast).
 */
export function resolveTextToken(path: TextTokenPath): TextToken {
  const [domain, key] = path.split('.') as [
    keyof StringsRegistry,
    string,
  ];
  const bucket = strings[domain] as Record<string, TextToken> | undefined;
  const token = bucket?.[key];
  if (!token) {
    throw new Error(`[strings] Unknown text token path: "${path}"`);
  }
  return token;
}
