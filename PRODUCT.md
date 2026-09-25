# Product

## Register

product

## Users

Parents (and occasionally another caregiver: a grandparent, a nanny) of a baby from birth to about 24 months. Two adults share the same diary, each on their own phone, and have to agree on what happened without talking to each other.

Their context is the hardest part of the brief. They are sleep-deprived, often holding the baby with one arm, and very often using the app at night in a dark nursery. The phone is in one hand and the thumb does all the work. Sessions last seconds: log a diaper, start a feed, check a time, put the phone down.

The job to be done has two halves:
- **Answer**: "When did they last eat, which side, when was the last change?" Answered in one glance, with no tapping and no reading.
- **Record**: log a feed, diaper, bottle, pump, medicine, vaccine or measurement in two taps, trusting it will reach the other parent's phone even if they are offline right now.

## Product Purpose

Bebè is a shared, real-time baby diary shipped as an installable mobile PWA (Italian UI). It replaces the notebook on the changing table and the "did you feed her?" message at 3am.

Success looks like:
- The home screen answers the 3am question before the parent has fully woken up.
- The most common logs (breastfeeding start/stop, diaper) take two taps or fewer.
- Both parents always see the same timer, the same last event and the same history, including after going offline.
- Nothing is lost and nothing is duplicated. The parent never has to wonder whether the app saved it.
- Enough history and charts (growth percentiles, daily stats) to answer the pediatrician's questions at the next visit.

## Brand Personality

**Calm, warm, reliable.** The mockup tagline says it too: *Semplice. Affidabile. Essenziale.*

- **Voice**: a kind, composed partner who kept good notes. Short sentences in plain Italian, written the way a person would say it ("Ha mangiato 40 min fa", not "Ultimo evento: allattamento, Δ 00:40"). No exclamation marks, no baby talk, no cheerleading.
- **Tone under stress**: when something fails or conflicts ("Sessione già terminata da Marco"), state the fact and the next step plainly. Never alarm, never blame.
- **Emotional goal**: reassurance. The interface should lower the parent's heart rate: "it's handled, it's written down, you're both on the same page."

## Anti-references

- **SaaS dashboards.** No KPI tiles, no hero-metric blocks (big number, small label, trend arrow), no grids of identical stat cards, no gradient accents on numbers or charts. The home screen is a sentence and a set of buttons, not a cockpit.
- **Ad-heavy baby trackers.** The typical free tracker: banners, premium upsell badges, streaks and gamification, push-for-engagement nags, crowded home screens with every feature fighting for attention. Bebè has no reason to ask for attention it does not need.

## Design Principles

1. **Answer first, then ask.** Every screen leads with the thing the parent came to know (last feed, running timer, today's count) before offering actions. If an answer can be shown, don't make them tap for it.
2. **Two taps, one thumb.** The frequent actions live in the lower, thumb-reachable half and finish in two taps. Rare actions (vaccines, measurements, settings) may take longer and sit further away. Effort follows frequency.
3. **Scroll to read more, never to act.** Scrolling is allowed: history, charts and long forms can run past the fold. What a screen is *for* cannot. The answer and the primary action (Salva, Termina, the Home logging keys) must be visible without scrolling on the smallest supported phone (375×667, iPhone SE) while holding the phone in one hand. When the content doesn't fit, the layout tightens first and the action docks to the bottom edge second; the parent never scrolls to find the button.
4. **Trust is visible.** Sync state, who did what, and "already ended by…" conflicts are shown quietly but always. Undo instead of confirmation dialogs. The parent should never wonder whether something was saved.
5. **Calm at 3am.** Designed for a dark room first: no bright flashes, no urgent reds for normal events, no motion that isn't feedback. The dark theme is a first-class surface, not an inversion.
6. **Written like a person.** Status is phrased as sentences a partner would say, with relative times and plain words. Numbers support the sentence; they don't replace it.

## Accessibility & Inclusion

- **WCAG 2.2 AA** as the floor: 4.5:1 for body text, 3:1 for large text and UI boundaries, visible focus on every interactive element, full keyboard and screen-reader support for sheets and forms (the Italian labels must make sense read aloud).
- **One-handed use**: minimum 44×44px targets (primary logging targets are much larger), primary actions reachable by the thumb in the lower half of the screen, no gestures that need two hands, no precision taps near screen edges.
- **Small and short screens**: the reference device is 375×667 (iPhone SE), with 360px-wide Android phones and Safari's collapsed toolbars in mind. On it, every screen's primary action is on screen at first paint, without scrolling, and there is no horizontal scroll.
- **Night-safe dark mode**: dark theme tuned for a dark nursery. Low-luminance surfaces, no pure-white fills or large bright areas, accents dimmed enough not to flash. Theme follows the system by default and applies before first paint (no white flash on launch).
- **Reduced motion** is respected everywhere; nothing depends on animation to be understood.
- Event categories are never identified by color alone: each one always has an icon and a text label.
