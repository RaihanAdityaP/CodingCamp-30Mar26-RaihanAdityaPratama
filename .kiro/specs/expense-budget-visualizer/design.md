# Design Document

## Overview

A single-page client-side application built with HTML, CSS, and Vanilla JavaScript. No build tools, no frameworks, no backend. All state lives in memory and is persisted to `localStorage`. Chart.js (v4.4.4) is loaded via CDN for the pie chart.

## Architecture

The app is a single HTML page with one CSS file and one JS file. There is no module system — all code runs in a single script scope.

```
index.html          — markup and layout
css/style.css       — all styles, CSS variables for theming
js/script.js        — all logic: state, storage, rendering, events
```

External dependency: `https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js`

## Data Model

### Transaction

```js
{
  id:       number,   // Date.now() — unique timestamp ID
  name:     string,   // item name (user input, HTML-escaped on render)
  amount:   number,   // positive float, IDR
  category: string,   // 'Food' | 'Transport' | 'Fun'
}
```

### App State (in-memory)

```js
let transactions  = [];   // Transaction[]
let spendingLimit = 0;    // 0 means not set
let chartInstance = null; // Chart.js instance, created once
let pendingDeleteId = null; // id held while confirm modal is open
```

### localStorage Keys

| Key                    | Value                        |
|------------------------|------------------------------|
| `expense_transactions` | JSON array of Transaction[]  |
| `expense_limit`        | numeric string               |
| `expense_theme`        | `'light'` or `'dark'`        |

## Component Structure

```
body
├── #toast-container          — fixed, top-center, stacked toasts
├── #confirm-modal            — fixed overlay, delete confirmation
├── #theme-toggle             — fixed top-right pill button
└── .container
    ├── .balance-section      — app title + total spending display
    ├── .form-section         — add transaction form + spending limit input
    └── .bottom-section       — 2-column grid (stacks on mobile)
        ├── .list-panel       — sort controls + scrollable transaction list
        └── .chart-panel      — Chart.js pie chart canvas
```

## Theming

CSS custom properties on `:root` define the light theme. The `body.dark` selector overrides all variables for dark mode. A `transition` on `background` and `color` provides smooth switching.

The theme toggle button shows:
- 🌙 "Turn on Flashlight" → in light mode (clicking switches to dark)
- ☀️ "Turn off Flashlight" → in dark mode (clicking switches to light)

Theme preference is saved to `localStorage` and restored on `init()`.

## Currency

All amounts are formatted using `Intl.NumberFormat` with `id-ID` locale and `IDR` currency, producing `Rp` prefixed values with no decimal places (e.g. `Rp 25.000`).

## Rendering Flow

All UI updates go through `renderAll()`:

```
renderAll()
  ├── renderBalance()         — recalculates sum, updates #total-balance
  ├── renderTransactionList() — clears + rebuilds <ul> from sorted state
  ├── renderChart()           — updates or creates Chart.js instance
  └── checkSpendingLimit()    — fires warning toast if limit exceeded
```

`renderChart()` reuses the existing `chartInstance` via `.update()` to avoid re-creating the canvas. When no transactions exist, a grey "No data" placeholder slice is shown.

## Sorting

Sorting is view-only — it does not mutate the `transactions` array. `getSortedTransactions()` returns a sorted copy based on `sortSelect.value`:

| Option        | Behaviour                        |
|---------------|----------------------------------|
| `default`     | insertion order                  |
| `amount-asc`  | ascending by amount              |
| `amount-desc` | descending by amount             |
| `category`    | alphabetical by category string  |

## Toast Notifications

Toasts are appended to `#toast-container`, animated in with CSS `opacity` + `transform`, then removed after a timeout. Types: `success`, `warning`, `error`, `info`.

| Event                    | Type    |
|--------------------------|---------|
| Transaction added        | success |
| Transaction deleted      | error   |
| Spending limit set       | info    |
| Spending limit exceeded  | warning |

## Delete Confirmation Modal

Clicking a delete button sets `pendingDeleteId` and opens the modal. Confirming filters the transaction out of state, saves, re-renders, and shows a toast. Cancelling or clicking the overlay clears `pendingDeleteId` and closes the modal.

## Spending Limit

`checkSpendingLimit()` is called at the end of every `renderAll()`. It fires a warning toast only when `spendingLimit > 0` and `getTotal() > spendingLimit`. The limit is saved to `localStorage` on "Set Limit" click.

## Security

User-supplied strings (item names) are passed through `escapeHtml()` before being injected into `innerHTML` to prevent XSS.

## Responsive Layout

- Desktop (>680px): form fields in a 3-column row, transaction list and chart side-by-side
- Mobile (≤680px): all sections stack to single column, balance box goes full-width, chart shrinks to 220px, toasts wrap text
