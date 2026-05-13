# Bloom Report — URL State Contract

> **Audience:** anyone touching `BloomReportView.vue`,
> `InteractionExplorer.vue`, `TaxonomyTree.vue`, `ReportRibbon.vue`,
> `IssueCard.vue`, or `IssueCardStats.vue`.
>
> **TL;DR:** The URL is the single source of truth for what's selected
> and which sidebar (if any) is open. Components read from the URL via
> the `useBloomUrlState` composable. Don't reach into
> `ui.activeRightTab` / `ui.isRightOpen` to drive what the user sees —
> those should be derived from the URL.

---

## Why this exists

The Bloom report previously coupled multiple concerns into overlapping
URL params plus Pinia store flags. That coupling caused:

- The sidebar reopening on every back/forward and being captured as
  "open" in `lastVisitedMap` even after the user closed it manually.
- Cold loads sometimes failing to filter the interactions list because
  data arrived after the watcher had already run.
- One param (`taxo`) doing two distinct jobs — filtering the main
  report list AND scoping the side panel — which collided when users
  wanted one but not the other.

The new model separates each concern into its own param.

---

## The params

### `taxo` — the main report list filter

The currently selected taxonomy node. Filters the main report's
issue/packet list and highlights the tree.

**Format:** `L1` | `L1:L2` | `L1:L2:L3` (category, topic, issue
depth), colon-delimited. Colons are RFC-3986-legal in query string
values and pass through vue-router unchanged.

**Examples**

- `?taxo=account_access` — category-level
- `?taxo=account_access:sign_in` — topic-level
- `?taxo=account_access:sign_in:login_fails` — specific packet

Changing `taxo` clears `forIssue` (see below) — the user's intent to
refocus the main view supersedes any pending panel-only peek.

### `forIssue` — the panel's issue scope (without filtering the main list)

A specific issue's taxonomy address used to scope the interactions
panel WITHOUT touching the main list filter.

**Use case:** the user is scrolling through the main report's
packets. They click the "Reviews" button on one packet to peek at
its interactions in the side panel. They don't want the main list
to collapse to that single issue while doing so.

**Format:** must be issue-level (L1:L2:L3). Shallower values are
ignored on read — there's no specific issue context for issue-bits
highlight at category or topic depth.

**Precedence:** when both `forIssue` and `taxo` are set, the
interactions panel scopes to `forIssue`. The main list still filters
by `taxo`. They're independent dimensions.

When neither is set, the panel falls back to its broadest state
(emotion-only filter if `emotion` is set, otherwise "recent 100"
across the report).

### `panel` — which sidebar is open

| Value | Meaning |
|---|---|
| `taxonomy` | Taxonomy tree |
| `interactions` | Interaction Explorer |
| _(absent)_ | Sidebar closed |

Closing the sidebar removes the param from the URL, producing a real
history entry AND letting `lastVisitedMap` capture the closed state.

### `emotion` and `hl` — highlight modes for the interactions panel

Together these represent the panel's "highlight mode" — a four-state
toggle:

| State | URL | UI |
|---|---|---|
| None | neither param set | "None" button selected |
| Emotion (any) | `hl=emotion` | "Emotion" button selected, no chip active, multi-color bits per interaction |
| Emotion (specific) | `emotion=<metric>` | "Emotion" button selected, that chip active, list filtered, single-color bits |
| Issue bits | `hl=issue` | "Issue" button selected, violet bits for AI evidence |

`emotion` and `hl` are mutually exclusive — the composable enforces
this on every write.

#### `hl=emotion` (no specific metric)

The panel shows all interactions in the current scope, highlighting
whichever emotion bits each interaction has, each in its metric's
color. No list filtering. This is the entry/default state of
"Emotion mode" when no chip is active.

#### `emotion=<metric>` (specific)

Filters AND highlights:

1. Filters the interactions list to those tagged with this emotion
2. Highlights only that emotion's bits, in its single color

Valid values: `joy`, `confidence`, `engagement`, `frustration`,
`hopelessness`.

The behavior composes naturally with scope:
- No `taxo` or `forIssue` → all report interactions of that emotion
- With either → that scope's interactions of that emotion

#### `hl=issue`

Highlights the "issue bits" inside each interaction — the spans the
AI identified as evidence for the issue. Only meaningful when the
panel is issue-scoped (`forIssue` set, or `taxo` at L1:L2:L3). The
"Issue" highlight button is disabled otherwise.

Bits live at `interaction.issueMeta.meta.bits` and are scoped to each
interaction's relationship to a specific issue.

---

## The in-panel emotion chip row

When `panel=interactions`, the explorer shows an emoji-only chip row
above the sort dropdown:

```
[ ✨ ] [ 😎 ] [ 👀 ] [ 😤 ] [ 😔 ]
```

Each chip toggles the `emotion` URL param within the current scope:

- Click a chip → `emotion=<that-metric>`, list filters to that
  emotion, single-color highlight.
- Click the active chip → clears `emotion`. If the previous mode was
  "Emotion (any)", reverts there. Otherwise reverts to None.

The chip row is the entry point for scoping an emotion view to the
current taxo/forIssue scope. The ribbon emoji buttons, in contrast,
always zoom out to the full report.

---

## URL shapes by user action

| User action | Resulting URL |
|---|---|
| Land on report | `?` |
| Click taxonomy node in tree | `?taxo=<taxo>&panel=taxonomy` |
| Click "Reviews" on a packet card | `?panel=interactions&forIssue=<issue-taxo>&hl=issue` |
| Click an emoji in the ribbon | `?panel=interactions&emotion=<metric>` (clears `taxo` and `forIssue`) |
| Click "Emotion" in highlight toggle (no chip active) | adds `hl=emotion`, removes `emotion` |
| Click in-panel emotion chip | adds `emotion=<metric>`, removes `hl` |
| Click "Issue" in highlight toggle | adds `hl=issue`, removes `emotion` |
| Click "None" in highlight toggle | removes both `emotion` and `hl` |
| Close sidebar | removes `panel`, `emotion`, `hl`, `forIssue` |

Closing the sidebar preserves `taxo`. The user's main-list selection
shouldn't disappear when they close a panel.

---

## How to read/write URL state

**Always go through `useBloomUrlState`.** It lives at
`@/composables/useBloomUrlState.js` and exposes:

```js
const {
  // Reactive computed refs (read these)
  taxo,                  // string | null — main list scope
  forIssue,              // string | null — panel-only issue scope (L1:L2:L3)
  panel,                 // 'taxonomy' | 'interactions' | null
  emotion,               // 'joy' | 'confidence' | ... | null
  hl,                    // 'issue' | 'emotion' | null
  panelScopeTaxo,        // forIssue || taxo — what the panel uses
  panelScopeDepth,       // 'category' | 'topic' | 'issue' | null
  panelIsIssueScoped,    // boolean — panel scope is L1:L2:L3

  // Setters (call these to update the URL)
  setTaxo,         // (taxo: string | null)        — clears forIssue
  setForIssue,     // (taxo: string | null)        — must be issue-level
  setPanel,        // (panel: 'taxonomy' | 'interactions' | null)
  setEmotion,      // (metric: string | null)
  setHl,           // (mode: 'issue' | 'emotion' | null)

  // Composed helpers (the common entry points)
  closePanel,                  // clears panel + emotion + hl + forIssue
  openInteractionsForIssue,    // (issueTaxo) — sets forIssue + panel + hl=issue, clears emotion
  openInteractionsForEmotion,  // (metric)    — clears taxo + forIssue + hl, sets panel + emotion
  openTaxonomyWith,            // (taxo)      — sets taxo + panel=taxonomy, clears everything else
} = useBloomUrlState()
```

The composable handles mutual exclusion between `emotion` and `hl`,
no-op guarding (won't push if the URL wouldn't actually change),
validation (invalid values for enum params are ignored on read), and
the "any taxo change clears forIssue" rule.

### Helper semantics — which modifiers each clears

| Helper | Sets | Clears |
|---|---|---|
| `openInteractionsForIssue` | `forIssue`, `panel=interactions`, `hl=issue` | `emotion` |
| `openInteractionsForEmotion` | `panel=interactions`, `emotion` | `taxo`, `forIssue`, `hl` |
| `openTaxonomyWith` | `taxo`, `panel=taxonomy` | `forIssue`, `emotion`, `hl` |
| `closePanel` | (nothing) | `panel`, `emotion`, `hl`, `forIssue` |
| `setTaxo` | `taxo` | `forIssue` |

---

## Things to avoid

- **Don't mutate `ui.isRightOpen` or `ui.activeRightTab` directly.**
  Those should be derived from the URL.
- **Don't read `route.query` directly when you could use the
  composable.** The composable validates and gives you consistent
  shapes.
- **Don't combine `emotion` and `hl` in the same URL.** The
  composable enforces this on writes; on reads they're an enum and
  the latter "wins" only because one of them is unset.
- **Don't set `forIssue` to a non-issue-level taxo.** The composable
  rejects this on writes and ignores it on reads.

---

## Backward compatibility

The legacy params `exploreIssue` and `exploreEmotion` are accepted on
entry and migrated to the new shape on the next router update.

- `exploreIssue=<taxo>` → `forIssue=<taxo> + panel=interactions + hl=issue`
- `exploreEmotion=<metric>` → `panel=interactions + emotion=<metric>`

Migration uses `forIssue` (not `taxo`) so old links land in the
"peek without filtering main list" view, matching the new card
behavior. Search for `LEGACY_URL_MIGRATION` to find the migration
code. Safe to remove once old links have aged out of use.