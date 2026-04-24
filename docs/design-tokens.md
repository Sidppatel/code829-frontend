# Design Tokens

Single source of truth for colors, spacing, radius, and typography shared across
all four apps (`public`, `admin`, `staff`, `developer`).

## Source

- **Typed object:** `packages/shared/src/tokens/tokens.ts`
- **Underlying modules** (each injects its own CSS vars at import time):
  - `packages/shared/src/theme/colors.ts`
  - `packages/shared/src/theme/spacing.ts`
  - `packages/shared/src/theme/radii.ts`
  - `packages/shared/src/theme/typography.ts`
  - `packages/shared/src/theme/motion.ts`
- **Ant Design binding:** `packages/shared/src/components/ThemedApp.tsx`
  consumes `semantic` + `shadows` directly. Changing a color in `colors.ts`
  flows into the AntD `ConfigProvider` token map with no other edits.

## JSON export (for design tools)

```bash
pnpm gen:tokens
```

Emits `packages/shared/src/tokens/tokens.json`. Consume from Figma via the
Variables-import plugin, or pipe into Style Dictionary for native-platform
outputs.

## Usage in TSX

```tsx
import { tokens } from '@code829/shared/tokens';

<div style={{ padding: tokens.spacing[4], borderRadius: tokens.radius.md }} />
```

Prefer the CSS custom properties (`var(--primary)`, `var(--space-4)`, etc.) for
anything that should inherit the runtime theme — they are injected automatically
by the side-effect imports inside `ThemedApp`.

## Figma sync (future)

Procedure is deferred: run `pnpm gen:tokens`, commit `tokens.json`, import into
Figma via the "Variables" JSON import. Automating the round-trip (Figma → PR)
would require a separate tokens-studio or Style Dictionary pipeline — out of
scope for this session.
