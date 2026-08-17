# project_ui.md
## UI/UX Design System — "Mercury-Inspired Fintech Aesthetic"

> **Purpose:** Drop this file into the root of any project (or paste it into an agent's context) to get a consistent, premium, Mercury-banking-style visual language: calm, minimal, typography-led, card-based, and confidence-inspiring. This is a *recreation of the feel*, not a copy of Mercury's proprietary code or exact assets — do not use Mercury's logo, name, or brand marks in real products.

---

## 1. Design Philosophy (read this first)

Every decision should serve these five principles, in priority order:

1. **Clarity over decoration.** If an element doesn't help the user understand or act, remove it.
2. **Typography is the primary design tool.** Hierarchy comes from font weight/size, not boxes, borders, or color.
3. **Whitespace is a feature.** Generous padding and margin signal confidence and reduce cognitive load.
4. **Color is a signal, not a decoration.** Near-monochrome by default; color only appears to mean something (status, action, data).
5. **Motion should be felt, not seen.** Transitions are fast, subtle, and physical — never bouncy, never long.

Agent instruction: when in doubt between "more visual interest" and "more restraint," choose restraint.

---

## 2. Color System

Keep the palette almost entirely neutral. Color is reserved for meaning (primary action, status, data visualization).

### 2.1 Neutrals (the workhorse palette)
```css
--color-bg:            #FFFFFF;
--color-bg-subtle:     #FAFAFA;
--color-bg-muted:      #F4F4F5;
--color-surface:       #FFFFFF;   /* cards, panels */
--color-border:        #E7E7E9;
--color-border-strong: #D4D4D8;
--color-text-primary:  #0A0A0A;
--color-text-secondary:#5B5B60;
--color-text-muted:    #8B8B90;
--color-text-inverse:  #FFFFFF;
```
Dark mode equivalents (invert lightness, keep the same restraint):
```css
--color-bg-dark:        #0B0C0E;
--color-surface-dark:   #17181B;
--color-border-dark:    #2A2B2F;
--color-text-primary-dark: #F5F5F6;
--color-text-secondary-dark: #A1A1A6;
```

### 2.2 Accent colors (use sparingly — one per context)
```css
--color-primary:   #1A56FF;  /* blue — primary actions, links */
--color-primary-hover: #0F3FE0;
--color-success:   #12805C;  /* green — positive balances, success states */
--color-success-bg: #E7F6EF;
--color-warning:   #B5750A;  /* amber — pending, caution */
--color-warning-bg: #FDF3E0;
--color-danger:    #C4293A;  /* red — errors, negative amounts */
--color-danger-bg: #FBEAEC;
--color-purple:    #6E56CF;  /* used for a single differentiating highlight, e.g. "new" badges */
```

### 2.3 Rules
- Never use more than 2 accent colors on a single screen.
- Backgrounds stay white/near-white; color lives in text, icons, small badges, and data viz — not large fills.
- Negative financial numbers get `--color-danger` text, never a red background fill on the whole row.
- Charts: use a restrained categorical palette (blue, green, purple, gray) — no rainbow charts.

---

## 3. Typography

### 3.1 Font stack
```css
--font-sans: "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono: "IBM Plex Mono", "SF Mono", ui-monospace, monospace; /* for amounts, account numbers, code */
```
Use a mono or tabular-nums font/feature for all numeric/financial data so digits align in columns:
```css
font-variant-numeric: tabular-nums;
```

### 3.2 Type scale (rem, 16px base)
| Token | Size | Weight | Line-height | Use |
|---|---|---|---|---|
| `display` | 3rem (48px) | 600 | 1.1 | Hero numbers, landing headlines |
| `h1` | 2.25rem (36px) | 600 | 1.2 | Page titles |
| `h2` | 1.5rem (24px) | 600 | 1.25 | Section headers |
| `h3` | 1.125rem (18px) | 600 | 1.35 | Card titles |
| `body-lg` | 1rem (16px) | 400 | 1.5 | Primary body text |
| `body` | 0.875rem (14px) | 400 | 1.5 | Default UI text |
| `caption` | 0.75rem (12px) | 500 | 1.4 | Labels, metadata, timestamps |
| `overline` | 0.6875rem (11px) | 600, uppercase, +0.04em tracking | 1.3 | Section eyebrows |

### 3.3 Rules
- Never use more than 3 font weights in one interface: 400 (regular), 500 (medium, for labels), 600 (semibold, for headings/emphasis). No bold (700+) except display numbers.
- Big balances/numbers use `display` or `h1` size, tabular-nums, and slightly tighter letter-spacing (-0.01em to -0.02em).
- Muted secondary text (`--color-text-secondary`) does most of the "explaining" — captions under headings, helper text under inputs.

---

## 4. Spacing & Layout

### 4.1 Spacing scale (4px base unit — stick to this strictly)
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### 4.2 Layout rules
- Card internal padding: minimum `--space-6` (24px), often `--space-8` (32px) for hero cards.
- Section gaps: `--space-8` to `--space-12` between major page sections.
- Max content width: `1200px–1280px` for dashboards, centered with side padding `--space-6` on desktop, `--space-4` on mobile.
- Sidebar width: `240–280px`, collapsible to icon-only rail at `64px`.
- Grid: 12-column, `24px` gutters on desktop; single column stacking under `768px`.
- Never let content touch the viewport edge — minimum `16px` safe margin on mobile.

---

## 5. Elevation, Radius & Borders

```css
--radius-sm: 8px;    /* buttons, inputs, small badges */
--radius-md: 12px;   /* cards, dropdowns */
--radius-lg: 16px;   /* modals, large panels */
--radius-full: 999px;/* pills, avatars */

--shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
--shadow-sm: 0 2px 8px rgba(0,0,0,0.06);
--shadow-md: 0 8px 24px rgba(0,0,0,0.08);
--shadow-lg: 0 16px 48px rgba(0,0,0,0.12);
```

Rules:
- Prefer a **1px hairline border (`--color-border`) + a soft shadow** over a thick border alone. Cards should look like they're gently resting on the background, not boxed in.
- Shadows increase on hover/focus/elevation state (e.g. `--shadow-sm` → `--shadow-md` on hover for interactive cards), never decrease.
- Corner radius scales with element size: small controls get `--radius-sm`, cards get `--radius-md`, modals/sheets get `--radius-lg`.

---

## 6. Core Components

### 6.1 Cards
- White surface, `--radius-md`, `--shadow-xs` at rest, hairline border.
- Structure: overline/label (optional) → title → primary metric or content → secondary meta text → optional action.
- Interactive cards get a subtle lift on hover: `translateY(-2px)` + shadow increase, 150ms ease-out.

### 6.2 Buttons
| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| Primary | `--color-primary` | white | none | one per screen/section, main CTA |
| Secondary | white | `--color-text-primary` | `--color-border-strong` | secondary actions |
| Ghost/Text | transparent | `--color-primary` | none | tertiary, inline actions |
| Danger | white | `--color-danger` | `--color-danger` (light) | destructive, used rarely |

- Height: `40px` default, `32px` compact, `48px` large/hero CTA.
- Radius: `--radius-sm`.
- Font: `body`, weight 500.
- Only ever **one primary button** visible per view/section — this is a hard rule, it's core to the "calm" feel.

### 6.3 Inputs & Forms
- Height `40–44px`, `--radius-sm`, hairline border, white background.
- Label above the field (`caption` size, weight 500, `--color-text-secondary`), not placeholder-only.
- Focus state: border becomes `--color-primary`, add a 3px soft outer glow (`box-shadow: 0 0 0 3px rgba(26,86,255,0.12)`), no harsh outline.
- Helper/error text directly below field, `caption` size.
- Group related fields with `--space-4` vertical gap; group sections with `--space-8`.

### 6.4 Tables
- No heavy grid lines. Row separators are hairline `--color-border`, no vertical column lines.
- Header row: `caption` size, `--color-text-secondary`, weight 500, uppercase optional.
- Numeric columns right-aligned, tabular-nums, monospace or tabular feature enabled.
- Row hover: `--color-bg-subtle` background, no border change.
- Generous row height (`48–56px`) — never cramped.

### 6.5 Navigation
- Left sidebar: logo/wordmark top, primary nav items with icon + label, active state = subtle background pill (`--color-bg-muted`) + `--color-primary` icon/text, not a hard border or gradient.
- Top bar (if used): minimal — search, notifications, account switcher, avatar. No clutter.
- Icons: outline style, 1.5–1.75px stroke, 20px default size (see §7).

### 6.6 Modals / Dialogs / Drawers
- `--radius-lg`, `--shadow-lg`, centered or right-side drawer.
- Backdrop: `rgba(0,0,0,0.4)` with slight blur (`backdrop-filter: blur(2px)`) optional.
- Entrance: fade + scale from 0.98→1 (modals) or slide-in from edge (drawers), 200ms ease-out.
- Always a clear single primary action + a cancel/ghost action, right-aligned in footer.

### 6.7 Badges / Status Pills
- `--radius-full`, small padding (`4px 10px`), `caption` size, weight 500.
- Background = tinted version of the status color (e.g. `--color-success-bg` + `--color-success` text), never solid saturated fill.

### 6.8 Empty States
- Centered icon or simple illustration (outline style), one-line headline, one supporting sentence, one primary action. Never leave a blank card/table with no explanation.

---

## 7. Iconography

- Style: **outline only**, consistent stroke width (1.5–1.75px), rounded line caps/joins.
- Recommended library: **Lucide Icons** (closest match to this aesthetic — clean geometry, consistent grid).
- Default size `20px` in UI, `16px` in dense tables/badges, `24–32px` for empty states/features.
- Icons are always paired with or subordinate to text — never the sole way to convey critical meaning.

---

## 8. Motion

```css
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--duration-fast: 120ms;
--duration-base: 180ms;
--duration-slow: 280ms;
```
- Hover/press feedback: `--duration-fast`.
- Panel/drawer/modal transitions: `--duration-base` to `--duration-slow`.
- Page/route transitions: simple cross-fade, ~200ms, no slides or flips.
- Loading states: skeleton screens (shimmering neutral blocks matching final layout shape) rather than spinners wherever content shape is predictable.
- Never use bounce, elastic, or overshoot easing — motion should feel precise and financial-grade, not playful.

---

## 9. Data Visualization

- Line/bar charts on transparent or `--color-bg-subtle` background, no heavy gridlines (use very light `--color-border` gridlines, or none).
- One primary data color per chart (usually `--color-primary` or `--color-success`); use gray for comparison/secondary series.
- Tooltips: white card, `--shadow-md`, `--radius-sm`, small padding, tabular numbers.
- Axis labels: `caption` size, `--color-text-muted`.
- Recommended libraries: **Recharts** or **Tremor** (React), or **Chart.js** for framework-agnostic contexts.

---

## 10. Accessibility Baseline

- Body text minimum contrast: 4.5:1 against background.
- All interactive elements have a visible focus state (the soft glow pattern in §6.3), never `outline: none` without a replacement.
- Never convey status by color alone — pair with icon or text label (e.g. "Failed" badge, not just red).
- Minimum tap target: 40x40px on touch interfaces.
- Respect `prefers-reduced-motion`: disable non-essential transitions when set.

---

## 11. Recommended Implementation Stack

Use this when the project allows a free stack choice; adapt tokens above to whatever is already in place otherwise.

**Frontend:** React + TypeScript, Next.js (SSR/SSG where relevant), Tailwind CSS (map the tokens in §2–§5 into `tailwind.config` theme extensions), shadcn/ui + Radix UI primitives for accessible unstyled components, Framer Motion for the motion patterns in §8, TanStack Query for data fetching/caching, React Hook Form + Zod for forms and validation, Recharts or Tremor for charts, Lucide Icons for iconography.

**Suggested `tailwind.config` mapping:**
```js
theme: {
  extend: {
    colors: { /* map §2 tokens here */ },
    borderRadius: { sm: '8px', md: '12px', lg: '16px', full: '999px' },
    boxShadow: { xs: '...', sm: '...', md: '...', lg: '...' },
    fontFamily: { sans: ['Inter', 'sans-serif'], mono: ['IBM Plex Mono', 'monospace'] },
  }
}
```

---

## 12. Agent Checklist (apply to every screen you build)

- [ ] One primary CTA visible at a time
- [ ] Numbers use tabular-nums and are right-aligned in tables
- [ ] No more than 2 accent colors on screen
- [ ] Cards use hairline border + soft shadow, not heavy borders
- [ ] Generous padding (24px+ inside cards, 32px+ between sections)
- [ ] Headings carry hierarchy via weight/size, not boxes or color
- [ ] Icons are outline-style and paired with text
- [ ] Every interactive element has a visible, soft focus state
- [ ] Motion is under 300ms and uses `ease-standard`, no bounce
- [ ] Empty/loading/error states are designed, not left blank

---

## 13. Attribution Note

This document describes a **design language inspired by the general visual patterns of modern minimalist fintech dashboards** (the kind popularized by apps like Mercury). It is an original interpretation built from public-facing UI conventions — not extracted code, assets, or proprietary specs from any company. Do not reuse any real company's name, logo, or trademark when applying this system to a product.
