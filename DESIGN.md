---
name: Bebè
description: Diario condiviso per i momenti più importanti. Semplice. Affidabile. Essenziale.
colors:
  primary: "#F4617F"
  primary-ink: "oklch(0.54 0.17 8)"
  primary-pressed: "#E75B7A"
  secondary: "#6366F1"
  accent: "#2DD4BF"
  success: "#5FD39A"
  danger: "#E5484D"
  feed: "#F4617F"
  feed-soft: "#FCE8EC"
  diaper: "#4F8EF7"
  diaper-soft: "#E8F2FF"
  bottle: "#F0A92A"
  bottle-soft: "#FFF4E5"
  pump: "#8B7CF6"
  pump-soft: "#F2E9FF"
  med: "#2FB67C"
  med-soft: "#E6F7EE"
  vax: "#A36BF5"
  vax-soft: "#EBE8FE"
  growth: "#14B8A6"
  growth-soft: "#E7F8F3"
  neutral-soft: "#F1F5F9"
  grey-900: "#0F172A"
  grey-700: "#334155"
  grey-500: "#64748B"
  grey-300: "#CBD5E1"
  grey-100: "#F1F5F9"
  grey-50: "#FAFAFC"
  canvas: "oklch(0.974 0.012 45)"
  surface: "oklch(0.994 0.004 45)"
  ink: "oklch(0.25 0.04 350)"
  ink-2: "oklch(0.4 0.04 350)"
  ink-3: "oklch(0.46 0.035 350)"
  night: "oklch(0.27 0.055 350)"
  night-ink: "oklch(0.96 0.014 45)"
  dark-canvas: "oklch(0.17 0.022 345)"
  dark-surface: "oklch(0.21 0.025 345)"
  dark-surface-2: "oklch(0.255 0.028 345)"
  dark-line: "oklch(0.3 0.03 345)"
typography:
  display:
    fontFamily: "Bricolage Grotesque Variable, Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: "41px"
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Bricolage Grotesque Variable, Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "32px"
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Bricolage Grotesque Variable, Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: "28px"
  subtitle:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: "26px"
  body:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  body-small:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  caption:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
  timer:
    fontFamily: "Bricolage Grotesque Variable, Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "88px"
    fontWeight: 800
    lineHeight: "0.9"
    letterSpacing: "-0.035em"
    fontFeature: "'tnum' 1"
rounded:
  element: "12px"
  card: "16px"
  panel: "24px"
  sheet: "28px"
  pill: "9999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "12": "48px"
  container: "16px"
  section: "24px"
  card-gap: "16px"
  tab-bar: "80px"
  short-viewport: "760px"
  dock-offset: "max(safe-area-inset-bottom, 12px)"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.night}"
    rounded: "{rounded.element}"
    height: "48px"
    padding: "0 16px"
    typography: "{typography.body}"
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.element}"
    height: "48px"
    padding: "0 16px"
  button-destructive:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.element}"
    height: "48px"
    padding: "0 16px"
  button-disabled:
    backgroundColor: "{colors.grey-100}"
    textColor: "{colors.grey-300}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.element}"
    height: "48px"
    padding: "0 16px"
    typography: "{typography.body}"
  segmented:
    backgroundColor: "{colors.grey-100}"
    textColor: "{colors.grey-700}"
    rounded: "{rounded.element}"
    height: "40px"
  segmented-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.night}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "16px"
  status-panel:
    backgroundColor: "{colors.night}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.sheet}"
    padding: "24px 20px 20px"
  category-tile-feed:
    backgroundColor: "{colors.feed-soft}"
    textColor: "{colors.feed}"
    rounded: "{rounded.card}"
  category-tile-diaper:
    backgroundColor: "{colors.diaper-soft}"
    textColor: "{colors.diaper}"
    rounded: "{rounded.card}"
  category-tile-bottle:
    backgroundColor: "{colors.bottle-soft}"
    textColor: "{colors.bottle}"
    rounded: "{rounded.card}"
  category-tile-pump:
    backgroundColor: "{colors.pump-soft}"
    textColor: "{colors.pump}"
    rounded: "{rounded.card}"
  form-dock:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.night}"
    rounded: "{rounded.card}"
    height: "56px"
    padding: "0 20px"
  tab-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.grey-500}"
    height: "{spacing.tab-bar}"
  tab-bar-active:
    textColor: "{colors.primary-ink}"
---

# Design System: Bebè

## 1. Overview

**Creative North Star: "The Shared Notebook"**

Bebè is the paper diary two parents keep on the changing table, rebuilt so it lives on both of their phones at once. A notebook has no dashboard: it has the last entry, written plainly, and a column of times down the margin. The system borrows that honesty. The home screen opens on a sentence ("Ha mangiato 40 min fa"), a set of large, thumb-sized entry points, and today's timeline. Everything else is a page further in.

The palette is soft and domestic: a warm cream page, neutrals tinted toward plum, one confident rose for the thing you do most (feeding, primary actions), and a set of pastel category tints that behave like colored tabs in a notebook, so a parent learns "blue is diapers" without reading. Type pairs Bricolage Grotesque (display: the baby's name, the status sentence, page and section titles, the timer) with Inter for everything you read or tap; hierarchy comes from weight and size, never from decoration. Density is low on Home (big targets, one question answered) and comfortable on Diario and Statistiche (a list of entries you scan by time).

This system explicitly rejects the **SaaS dashboard** (KPI tiles, hero metrics, identical stat-card grids, gradient accents on data) and the **ad-heavy baby tracker** (banners, upsell badges, streaks, crowded home screens). It is built for a tired person in a dark room, so the dark theme is a first-class, night-safe surface, not an afterthought.

**Key Characteristics:**
- Single mobile column, max 512px wide, 16px side gutter, floating glass tab buttons (Home · Diario · Statistiche · Altro).
- The page is drenched in a fixed wash (peach → coral → rose → lilac) and every surface on it is frosted glass. The wash warms to rose while a session runs.
- Answer-first home: a dark status panel phrased as a sentence, then primary logging keys, then today.
- Category color = soft pastel tile + saturated icon + text label, always all three.
- Rounded, soft geometry (12px elements, 16px cards, 24px feature panels, 28px sheets).
- Bottom sheets for quick logging, undo toasts instead of confirmation dialogs.
- Responsive motion: press feedback, sheet slide-up and slide-down (drag the grabber to dismiss), live-session pulse, toast in/out, the segmented control's sliding indicator, and screen transitions on navigation (shared-axis slide going deeper or back, fade-through between tabs, tab bar slides away on detail screens, the active tab pops into a labeled rose pill, the ambient wash warms when a session starts). Nothing else moves.
- Scroll to read, never to act: on the reference phone (375×667) every screen's primary action is visible at first paint. Short screens (height ≤ 760px) tighten the same structure through the `short:` variant, and form Save buttons dock to the bottom edge while the form is on screen.
- Layout rhythm on a 4px base: 4 · 8 · 12 · 16 · 24 · 48. Container padding 16px, space between sections 24px (Home uses 36 to 40px between major blocks), space between cards 16px.

## 2. Colors

A warm cream page carrying one confident rose, a quiet indigo helper and seven pastel category tabs; neutrals are cool slate greys for ink.

### Primary
- **Nursery Rose** (#E75B7A): the brand and the most frequent action. Primary buttons, the selected segment, the active tab, the running-session timer ring, and the breastfeeding category (feeding is the product's center of gravity, so it shares the brand color). Pressed state fades to **Pressed Rose** (#D9A3B0).

### Secondary
- **Quiet Indigo** (#6366F1): secondary emphasis only. Links to secondary flows, informational highlights, focus rings. Never a filled primary action and never on the same button row as Nursery Rose.

### Tertiary
- **Mint Accent** (#2DD4BF): positive, "all good" moments: sync confirmed, a completed entry, growth trending on curve. Used as a small mark, not a surface.
- **Success** (#2FB67C): the success icon in toasts and the "registrato" confirmation. Never a button fill.
- **Alert Red** (#E5484D): input error borders, error text and error toasts only. Never used for normal events, even medicines.

### Category tabs
Each event kind has a saturated **ink** (icon, small marks, chart series) and a pastel **tint** (tile background). The tint names come from the mockup; the ink values are the icon colors.

| Category | Ink | Tint |
|---|---|---|
| Allattamento | Nursery Rose (#E75B7A) | Blush (#FCE8EC) |
| Pannolino | Cornflower (#4F8EF7) | Morning Sky (#E8F2FF) |
| Biberon | Honey (#F0A92A) | Warm Milk (#FFF4E5) |
| Tiralatte | Lavender (#8B7CF6) | Lilac Mist (#F2E9FF) |
| Medicine | Sage Green (#2FB67C) | Mint Cream (#E6F7EE) |
| Vaccinazioni | Violet (#A36BF5) | Periwinkle Wash (#EBE8FE) |
| Crescita | Teal (#14B8A6) | Seafoam (#E7F8F3) |
| Neutro / Altro | grey-500 (#64748B) | Slate Wash (#F1F5F9) |

### Neutral
All neutrals are OKLCH, tinted toward the brand's plum (hue ~350) so the page reads warm, never grey. Tokens live in `src/styles/index.css`.
- **Cream Page** (`--bg`, oklch 0.974 0.012 45): app background in light mode.
- **Paper** (`--surface`, oklch 0.994 0.004 45): sheets, inputs, toasts, icon discs (page-level cards are Frost, see Elevation).
- **Mist** (`--surface-2`): segmented track, pressed rows, secondary buttons.
- **Hairline** (`--line`): borders, dividers, the filets between values.
- **Ink** (`--ink`, oklch 0.25 0.04 350): primary text. **Ink 2** secondary text. **Ink 3** (oklch 0.46) captions and hints; tuned to stay at 4.5:1 on the darkest point of the wash (L 0.85), so it may carry small text.
- **Rose Ink** (`--rose-ink`): rose for text and icons on light surfaces (links, active tab, "Suggerito"). Filled rose never carries rose text.

### Night panel
- **Night** (`--night`, oklch 0.27 0.055 350): the deep plum of the Home status panel and the Active Session card, in both themes. Text on it is **Night Ink**; secondary text **Night Ink 2**; dividers **Night Line**. The relative time and the running timer use **Feed Glow** (oklch 0.8 0.12 12).
- Night is also the text color on every filled rose surface (primary buttons, selected segments and filter chips, the feeding key). White on rose fails contrast.

### Dark theme (night-safe)
- Canvas oklch 0.17, Surface 0.21, Raised 0.255, Line 0.3, all at hue 345 with low chroma. Primary text Night Ink.
- Category tints stay the category ink at 12 to 20% opacity; inks stay as they are. Cards drop their shadow.

### Named Rules
**The Notebook Tab Rule.** Category color is a tab, not a theme. A category tint may fill its own tile, icon chip or chart series; it never tints a whole screen, a header, or text paragraphs.

**The One Rose Rule.** Nursery Rose fills at most one large element per screen (the primary action or the running timer). Everything else rose is small: the active tab, a selected segment, an icon.

**The Calm Red Rule.** Alert Red means "something went wrong with your data". Normal events, including medicines and vaccines, are never red.

## 3. Typography

**Display Font:** Bricolage Grotesque Variable (`--font-display`), used only for names, sentences and titles.
**Body / Label / Data Font:** Inter Variable (with ui-sans-serif, system-ui, -apple-system). Values, times and form text stay in Inter.

**Character:** One family, tuned for legibility on a phone at arm's length in low light. Semibold does the heavy lifting for hierarchy; tabular figures keep times and timers from jittering.

### Hierarchy
- **Display** (Bricolage 700 to 800, 34 to 44px, `font-display-tight`): the baby's name, the Home status sentence, tab page titles (Diario, Statistiche, Altro), auth titles.
- **Headline** (Bricolage 700, 24px, `font-display-tight`): Home section titles ("Aggiungi", "Oggi").
- **Title** (Bricolage 700, 18 to 20px, `font-display-snug`): sheet titles, detail page headers, section and card titles.
- **Subtitle** (500, 18px, 26px line): large list labels, primary tile labels.
- **Body** (400, 16px, 24px line): default text, inputs (16px minimum to avoid iOS zoom), buttons (at 600).
- **Body Small** (400, 14px, 20px line): event subtitles, hints, summaries ("5 pasti · 7 cambi").
- **Caption** (400, 12px, 16px line): tab labels, timestamps in dense lists, chart axes.
- **Timer** (Bricolage 800, 88px on Home, 60px compact and on short screens, tabular figures): running session timers only.

### Named Rules
**The Tabular Time Rule.** Every time, duration, quantity and timer uses tabular figures (`font-variant-numeric: tabular-nums`). Numbers that shift width while ticking are forbidden.

**The Two-Voice Rule.** Bricolage speaks (names, sentences, titles); Inter informs (labels, values, buttons, inputs). Never set a button, label or number in Bricolage, except the running timer.

**The Sentence-Case Rule.** Labels, buttons and headings are sentence case in Italian ("Termina", "Aggiungi una nota"). No all-caps, no letter-spaced eyebrow labels.

## 4. Elevation

Three layers: a **drenched wash** fixed behind everything, **frosted surfaces** on top of it, and **lit rose** for the few things you press most. Light always comes from the top-left.

- **Wash** (`.ambient`): `position: fixed`, full viewport, content scrolls over it. A 172° base gradient (peach oklch 0.95 → coral 0.9 → rose 0.875 → lilac 0.88) with four radial blooms. It never drops below L 0.85, which is why Ink 2 (0.40) and Ink 3 (0.46) hold 4.5:1 anywhere on it. While a feed or pump runs, a rose bloom fades in over 900ms. Dark mode keeps the same shapes at L 0.17 to 0.28: a wine-and-plum room, no glow.
- **Frost** (`.frost`, `.frost-strong`): translucent Paper (56% / 68%), a 1px light edge, a top-left sheen and a rose-tinted drop shadow (none in dark). No backdrop-filter: over a smooth wash, blur is invisible and costs frames. Used by `Card`, the segmented track, chips, diary filters and the status panel.
- **Glass** (`.glass`): translucent Paper at 72% with a 20px blur and 1.8 saturation, only where real content scrolls underneath: the tab buttons and sticky headers once scrolled (`.glass-header`, clear at rest, driven by a scroll timeline). The opacity alone keeps icons legible where blur is unavailable.
- **Lit rose** (`.rose-lit`, `.feed-key`, `.tab-active`): a coral-to-rose gradient with a top highlight. Primary buttons, the selected segment and filter, the active tab and the feeding key. The feeding key and active tab add a rose drop shadow.
- **Category tiles** (`.quick-tile`): Frost with a bloom of their own ink in the top-left corner (`color-mix(in oklab, ink 24%, transparent)`) and a shadow in their color; the icon sits on a raised Paper disc.
- **Status panel** (`.night-panel`): in light mode it is Frost Strong with a rose and lilac inner glow, and remaps the night tokens inside itself (Night Ink → Ink, Feed Glow → Rose Ink), so the sentence reads dark on light. In dark mode it stays the lit Night block.

### Shadow Vocabulary
- **Card rest** (`box-shadow: 0 1px 2px rgb(15 23 42 / 0.04), 0 6px 20px rgb(15 23 42 / 0.05)`): cards and list groups on the Cream Page. Light mode only.
- **Sheet** (`box-shadow: 0 -8px 32px rgb(15 23 42 / 0.12)`): bottom sheets, over a `rgb(15 23 42 / 0.4)` scrim.
- **Toast** (`box-shadow: 0 8px 24px rgb(15 23 42 / 0.12)`): toasts only.

### Named Rules
**The Paper-On-Table Rule.** Frost shadows are tinted rose and soft; only the signature surfaces (status panel, feeding key, active tab) may float visibly.

**The Blur Budget Rule.** Surfaces are frosted by translucency; real backdrop blur only where content scrolls underneath (tab buttons, scrolled headers, the sheet scrim). Never blur a card.

**The Oklab Mix Rule.** Tints mixed from a category ink use `color-mix(in oklab, …)`. Mixing in oklch drags the hue toward the near-neutral surface (blue turns pink).

## 5. Components

Soft, tactile and forgiving: every control is large enough to hit with a thumb while holding a baby, and responds to a press immediately.

### Buttons
- **Shape:** gently rounded (12px); large Home keys use 24px.
- **Primary:** Nursery Rose fill, Night text, 48px tall (56px for full-width form submits), 16px horizontal padding, 600 weight.
- **Secondary:** Mist fill, Ink text. **Outline:** Paper fill with a Hairline border. **Ghost:** text only, Ink 2.
- **Night:** outline button for use on the Night panel only.
- **Destructive:** a ghost button in Ink 2. Deliberately not red: delete is a calm choice, and every event delete offers undo.
- There are no category-colored buttons. Every form's Save is the Primary button, whatever the category.
- **States:** pressed scales to 0.98 and shifts to the pressed color (Pressed Rose for primary) within 150ms; disabled is Mist fill with grey-300 text; loading swaps the icon for a spinner and keeps the width; focus shows a 2px `--focus` indigo ring with 2px offset.
- **Icon buttons:** 44px circle, grey-700 icon, Mist on press.
- **Form dock** (`FormDock`, `.form-dock`): every form's Save sits in a dock that is `position: sticky` to the bottom edge, 12px (or the safe area) above it. While the form is on screen and its end is below the fold, Save floats under the thumb; at the end of the form it rests in its normal place. When stuck it gains a 5px Paper halo (Canvas in dark) and a soft rose drop shadow (a `scroll-state(stuck: bottom)` container query; without support it simply floats without the halo), so fields scroll cleanly under it. It works the same inside bottom sheets. The dock is for the one primary action only; Elimina and secondary links stay in the flow below.

### Chips
- **Style:** pill (9999px), 44px tall, Paper fill with Hairline border, category ink icon at 18px + Ink label. Used for secondary quick actions (Medicine, Crescita, Vaccini) and diary filters.
- **State:** selected filter chip fills with Nursery Rose and Night text; unselected stays Paper.

### Cards / Containers
- **Corner Style:** 16px for cards and grouped lists; 24px for the Home status panel and the primary feeding key.
- **Background:** Paper on Cream Page (light), Night Surface on Night Canvas (dark).
- **Shadow Strategy:** Card rest in light mode, none in dark (see Elevation).
- **Border:** none by default; empty states use a 1px dashed Hairline border instead of a fill.
- **Internal Padding:** 16px; list rows 12px vertical × 16px horizontal.
- Cards are for grouping lists and forms. Never nest a card inside a card.

### Inputs / Fields
- **Style:** Paper fill, 1px Hairline border, 12px radius, 48px tall, 16px text, label above in 14px medium Slate, "(opzionale)" in Muted Slate.
- **Focus:** border shifts to Nursery Rose with a soft rose ring (3px at 20% opacity).
- **Error:** border and helper text in Alert Red, message announced with `role="alert"`.
- **Disabled:** 60% opacity, no border change.
- **Big numeric input** (bottle ml, weight): 64px tall, 32px semibold tabular figures, unit as a suffix.
- **Date and time** (`DateTimeInput`): label left and the relative time ("19 min fa") right on the same line, then the day stepper + native time input (48px), then the quick offsets (Adesso, −5′, −15′, −30′, −1h, 40px chips). No hint line underneath: the relative time is the hint.
- **Notes**: one line (48px) that grows with its text up to 160px (`field-sizing: content`). A note is rare; it never gets to push Save off screen.
- **Choice grid** (side, diaper type, milk): 56px options, 48px on short screens.

### Segmented Control
- Mist track with 4px inset, 12px radius; segments 40px tall. Selected segment fills Nursery Rose with Night text (semibold); others are Ink 2. Used for time ranges (Oggi / 7 giorni / 30 giorni) and binary choices (Seno sinistro / destro).

### Navigation
- **Tab bar:** four separate floating buttons, centered, 8px apart, 12px or the safe area from the bottom. Inactive tabs are 56px Glass circles with a 24px Ink 2 icon (the label lives in `aria-label`). The active tab expands into a 56px Lit Rose pill with icon + 15px semibold label in Night, popping in with a 260ms scale from 0.9. Each button carries its own view-transition name (class `tab`) so the glass keeps blurring the page. Screen content keeps `7rem + safe area` of bottom padding.
- **Page header:** sticky, 44px back button left, title centered in Title style, optional single action right. No hamburger menus.
- **Detail pages** lead with the answer as a sentence, not a card that repeats the form: "Sinistro, 15 min" in Title-scale Bricolage with the date and times below in Body Small. A running session uses the compact Active Session card (60px timer). The editable form follows, with its docked Save.

### Short screens
The `short:` variant (`@media (max-height: 760px)`) tightens Home and forms without changing their structure: the baby header drops to 64px, the Active Session timer to 60px, the status sentence to 34px, the "Aggiungi" heading becomes screen-reader only, and the 24 to 40px gaps between blocks shrink to 16px. The goal is concrete: on 375×667, with a feed running, the feeding key and the three round keys sit above the floating tab bar.

**The Thumb Floor Rule.** On the reference phone (375×667), the primary action of every screen is fully visible at first paint, without scrolling. Tighten spacing first, then dock the action; never hide the action behind a scroll or a "more" toggle. Content that exists to be read (history, charts, long lists) may scroll freely.

### Status Panel (signature)
The Home answer. A luminous frosted panel by day, a lit Night block by night (`.night-panel`, 28px radius, 24/20/20px padding) that states the last meal as a Display sentence, with the relative time in Feed Glow, followed by a detail line in Body Small ("Seno sinistro, 14 min · alle 10:15"). Below a Night Line divider, a two-column definition list: "Prossimo lato" and "Cambio". When a session is running, it is replaced by the **Active Session card**: the same Night block, a pulsing dot and "Allattamento in corso", the timer in Timer style (Feed Glow for feeds), "Avviato da…", then a Night-variant side switch and a primary "Termina".

### Baby Monogram
`BabyAvatar`: the initial in Bricolage 800, Night ink, on a three-stop gradient built around one hue per baby (`--h`, picked from the baby id), so siblings stay distinguishable. Never tied to sex. 56px on Home beside the name (inside the name button), 44px in lists.

### Quick-Log Console (signature)
The "Aggiungi" section is one console (`.console`, 30px radius, 8px padding) that follows the Status Panel's rule: luminous Frost with peach and lilac blooms by day, the lit Night block by night (the `night-*` tokens remap inside it the same way). On top, the full-width 88px lit Nursery Rose feeding key (`.feed-key`, 22px radius) with Night content: a 48px translucent icon disc, the label in Bricolage 800, a "Tocca al destro/sinistro" line from the suggested side, and a "+". While a feed runs, the line becomes "in corso" with a pulsing dot and the "+" becomes an arrow. Below it, three round 64px keys (`.console-key`: Pannolino, Biberon, Tiralatte) filled with their category color, lit from the top with a same-hue halo and shadow by day, pulled toward plum with no shadow by night; the Night icon sits in the key, label and live hint ("3 oggi", "ultimo 90 ml") below. A running session puts a small dot, ringed in the console surface, on the key. Under a Night Line filet, the rare categories (Medicine, Crescita, Vaccini) are 48px text buttons with their ink icon. Frequency decides size: rose bar, then keys, then text.

### Value rows
Summary numbers ("Sessioni · Totale · Media") are a `dl` of three columns split by Hairline filets, label above value, like the Home panel. Never tinted tiles.

### Toasts
Paper (Raised in dark), 16px radius, Hairline ring, Toast shadow in light mode only. The tone lives in the icon alone (success green, warning amber, error red, info Ink 2). Action and close are 44px targets; the action is Rose Ink.

### Event Row
Time in tabular Body Small at a fixed 48px column, a 40px category icon chip (tint fill, ink icon), title in 15px medium and subtitle in Body Small Slate, optional chevron. Rows are grouped in one card per day with Hairline dividers; unsynced rows show a small cloud-off icon.

### Bottom Sheet
Slides up in 220ms (ease-out-quart), 28px top radius, grab handle, title + close button, max 92% of the viewport. Used for quick logging only; everything else is a page.

## 6. Do's and Don'ts

### Do:
- **Do** lead every screen with the answer: the Home status panel's Display sentence comes before any button.
- **Do** keep frequent actions in the lower half of the screen and at least 44×44px; Home logging keys are 88px tall (feeding) and 64px round keys.
- **Do** check every new screen at 375×667: the primary action must be visible without scrolling. Wrap a form's Save in `FormDock`; use the `short:` variant to tighten spacing before shrinking targets.
- **Do** show every category as tint + ink icon + text label, all three, every time.
- **Do** use tabular figures for all times, durations, quantities and timers.
- **Do** use undo toasts (Paper, 16px radius, Toast shadow) instead of confirmation dialogs for deletes and edits.
- **Do** keep transitions between 150 and 250ms with exponential ease-out; press feedback is `scale(0.98)`.
- **Do** design the dark theme on its own: plum Night Canvas base, no Paper or Snow fills larger than a button, at most one filled Nursery Rose element per screen.
- **Do** respect `prefers-reduced-motion`: the live pulse, sheet slide and screen transitions become instant.

### Don't:
- **Don't** build a **SaaS dashboard**: no KPI tiles, no hero-metric blocks (big number, small label, trend arrow), no grids of identical stat cards, no gradient accents on numbers or charts. Gradients are atmosphere and light, never data.
- **Don't** make it an **ad-heavy baby tracker**: no banners, premium upsell badges, streaks, gamification, or engagement nags; no crowded home screen with every feature competing.
- **Don't** use gender-coded pink-for-girls / blue-for-boys theming; the palette is the same for every baby.
- **Don't** use Alert Red (#E5484D) for normal events; red means a data problem.
- **Don't** fill whole screens or headers with a category tint (The Notebook Tab Rule).
- **Don't** use `border-left` or `border-right` wider than 1px as a colored stripe on rows, cards or toasts.
- **Don't** use gradient text. Don't put backdrop blur on cards; frost them with translucency (The Blur Budget Rule).
- **Don't** add a third typeface, set labels or buttons in the display face, or use all-caps labels or letter-spaced eyebrows.
- **Don't** open a modal dialog when a sheet, inline edit, or undo toast would do.
- **Don't** make the parent scroll to reach Salva, Termina or a logging key; and don't restate a form's values in a summary card above it (answer in one sentence instead).
- **Don't** animate anything that isn't feedback or a state change; no page-load choreography.
- **Don't** use pure black (#000) or pure white (#FFF) anywhere, including white text on rose; use Ink, Night and Paper.
