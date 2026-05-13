# Bloom Report — URL State Contract

> **Audience:** anyone touching `BloomReportView.vue`, `InteractionExplorer.vue`,
> `TaxonomyTree.vue`, `ReportRibbon.vue`, `IssueCard.vue`, or `IssueCardStats.vue`.
>
> **TL;DR:** The URL is the single source of truth for what's selected and which
> sidebar (if any) is open. Components read from the URL via the
> `useBloomUrlState` composable. Don't reach into `ui.activeRightTab` /
> `ui.isRightOpen` to drive what the user sees — those should be derived from
> the URL.

---

## Why this exists

The Bloom report previously coupled three concerns into overlapping URL params
(`taxo`, `exploreIssue`, `exploreEmotion`) plus Pinia store flags
(`ui.activeRightTab`, `ui.isRightOpen`). That coupling caused:

- The sidebar reopening on every back/forward, and being captured as "open"
  in `lastVisitedMap` even after the user closed it manually (because the
  manual toggle didn't write to the URL at all).
- Cold loads (direct links with params) sometimes failing to filter the
  interactions list because the issue lookup ran before `bloomStore.allIssues`
  populated.
- Three params doing partially overlapping jobs, with precedence rules in
  `updateSidebarState` and `navigateWithGrace` that were hard to reason about.

The new model separates **selection scope** from **UI surface** from
**filter/highlight modifiers**, giving each its own param.

---

## The three params

### `taxo` — the selection scope

The currently selected taxonomy node. Independent of any panel — setting `taxo`
just filters the main report list and highlights the tree. It does NOT open
any sidebar by itself.

**Format:** `L1` | `L1:L2` | `L1:L2:L3` (category, topic, issue depth),
colon-delimited. Colons are RFC-3986-legal in query string values and pass
through vue-router unchanged, so no encoding/decoding is needed.

**Examples**

- `?taxo=account-access` — category-level selection
- `?taxo=account-access:sign-in` — topic-level
- `?taxo=account-access:sign-in:login-fails` — specific packet (issue-level)

When `taxo` is issue-level (three segments), the Interactions panel resolves
a target issue and loads its specific interactions. At broader levels, the
Interactions panel falls back to its broader scope.

### `panel` — which sidebar is open

What the right sidebar is showing. Absence of this param means the sidebar
is closed.

| Value | Meaning |
|---|---|
| `taxonomy` | Taxonomy tree |
| `interactions` | Interaction Explorer |
| _(absent)_ | Sidebar closed |

The sidebar's open/closed state is derived from this param. Closing the
sidebar removes the param from the URL, which produces a real history entry
AND lets `lastVisitedMap` capture the closed state correctly.

### `emotion` and `hl` — modifiers on the interactions panel

Only meaningful when `panel=interactions`. They are mutually exclusive — the
composable enforces this on writes.

#### `emotion=<metric>`

Filters interactions to those tagged with the given emotion AND highlights the
emotion "bits" inside each interaction's text. Two scenarios:

- **No `taxo`** — shows all interactions across the report tagged with this
  emotion. This is what the ribbon emoji buttons produce.
- **`taxo` is issue-level** — shows only that issue's interactions tagged with
  this emotion. This is what the in-panel emotion chips produce.

Valid values: `joy`, `confidence`, `engagement`, `frustration`, `hopelessness`.

#### `hl=issue`

Highlights the "issue bits" inside each interaction — the spans the AI
identified as evidence for the issue. Only meaningful when `taxo` is
issue-level (otherwise there's no single issue to derive bits from).

Bits live at `interaction.issueMeta.meta.bits` and are scoped to each
interaction's relationship to a specific issue.

**Mutual exclusion:** `emotion` and `hl` should not both be present. The
composable enforces this on every write — setting either one clears the other.

---

## URL shapes by user action

| User action | Resulting URL |
|---|---|
| Land on report | `?` |
| Click taxonomy node in tree | `?taxo=<taxo>&panel=taxonomy` |
| Click "Reviews" on a packet card | `?taxo=<issue-taxo>&panel=interactions` |
| Click an emoji in the ribbon | `?panel=interactions&emotion=<metric>` (clears `taxo`) |
| Click in-panel emotion chip while in issue | `?taxo=<issue-taxo>&panel=interactions&emotion=<metric>` |
| Toggle issue-bits highlight in panel | `?taxo=<issue-taxo>&panel=interactions&hl=issue` |
| Close sidebar | (removes `panel`, `emotion`, `hl`; keeps `taxo`) |
| Open taxonomy tree with current selection | `?taxo=<taxo>&panel=taxonomy` |

Closing the sidebar preserves `taxo`. The user's selection on the main view
shouldn't disappear when they close a panel.

---

## How to read/write URL state

**Always go through `useBloomUrlState`.** It lives at
`@/composables/useBloomUrlState.js` and exposes:

```js
const {
  // Reactive computed refs (read these)
  taxo,            // string | null   — colon-delimited
  panel,           // 'taxonomy' | 'interactions' | null
  emotion,         // 'joy' | 'confidence' | ... | null
  hl,              // 'issue' | null
  isIssueLevel,    // boolean — taxo has three segments

  // Setters (call these to update the URL)
  setTaxo,         // (taxo: string | null)
  setPanel,        // (panel: 'taxonomy' | 'interactions' | null)
  setEmotion,      // (metric: string | null)
  setHl,           // (mode: 'issue' | null)

  // Composed helpers (the common entry points)
  closePanel,                  // shorthand: clears panel + emotion + hl
  openInteractionsForIssue,    // (issueTaxo) — sets taxo + panel=interactions
  openInteractionsForEmotion,  // (metric)    — clears taxo, sets panel + emotion
  openTaxonomyWith,            // (taxo)      — sets taxo + panel=taxonomy
} = useBloomUrlState()
```

The composable handles mutual exclusion between `emotion` and `hl`, no-op
guarding (won't push if the URL wouldn't actually change), and validation
(invalid values for the enum params are ignored on read).

---

## Things to avoid

- **Don't mutate `ui.isRightOpen` or `ui.activeRightTab` directly to control
  the sidebar.** Those should be derived from the URL. Writing to them
  desyncs from the URL and produces the "history doesn't reflect close"
  class of bugs.
- **Don't read `route.query` directly when you could use the composable.** The
  composable validates and gives you consistent, typed shapes.
- **Don't combine `emotion` and `hl` in the same URL.** They're alternative
  highlight modes. If a UI flow seems to need both, that's a design
  conversation, not a URL change.

---

## Backward compatibility

The legacy params `exploreIssue` and `exploreEmotion` are accepted on entry
and migrated to the new shape on the next router update. This is a temporary
shim — once we're confident all external links have been updated, the shim
should be removed. Search for `LEGACY_URL_MIGRATION` to find the relevant
code.

There may also be old in-the-wild URLs using dash-as-delimiter for `taxo`
(`account-access-sign-in-login-fails` instead of `account-access:sign-in:login-fails`).
These can't be unambiguously decoded since taxonomy segments themselves may
contain hyphens. The composable accepts them as-is on read; prefix-matching
on `issue.taxo` elsewhere in the codebase still works for the legacy form.
All new writes use the canonical colon form.