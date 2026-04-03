# Implementation Plan: Expense & Budget Visualizer

## Overview

Single-page client-side app using HTML, CSS, and Vanilla JavaScript with localStorage persistence and Chart.js for pie chart visualization.

## Tasks

- [x] 1. Set up project structure and static markup
  - Create `index.html` with all sections: toast container, confirm modal, theme toggle, balance section, transaction form, spending limit input, transaction list with sort controls, and chart canvas
  - Link `css/style.css` and load Chart.js v4.4.4 via CDN
  - Link `js/script.js`
  - _Requirements: 9.2, 9.3_

- [x] 2. Implement theming and CSS layout
  - [x] 2.1 Define CSS custom properties for light and dark themes
    - `:root` variables for light mode; `body.dark` overrides for dark mode
    - Smooth `transition` on `background` and `color`
    - _Requirements: 8.1, 8.2_
  - [x] 2.2 Implement responsive grid layout
    - 3-column `.form-row` on desktop, single-column on mobile (≤680px)
    - 2-column `.bottom-section` grid on desktop, stacked on mobile
    - _Requirements: 9.1, 9.2_
  - [x] 2.3 Style transaction items, category color dots, empty state, and chart panel
    - `.transaction-item` with `.category-dot` colored circles per category
    - `.empty-state` placeholder when list is empty
    - _Requirements: 2.1, 4.3_
  - [x] 2.4 Style toast notifications and confirm modal overlay
    - `.toast` with `opacity` + `transform` animation and `.show` class
    - `.modal-overlay` with backdrop blur and centered `.modal`
    - _Requirements: 2.3, 7.2_

- [x] 3. Implement core app state and localStorage persistence
  - [x] 3.1 Define app state variables and storage keys
    - `transactions`, `spendingLimit`, `chartInstance`, `pendingDeleteId`
    - Storage keys: `expense_transactions`, `expense_limit`, `expense_theme`
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 3.2 Implement `loadFromStorage()` and `init()`
    - Parse transactions JSON, restore spending limit value, call `applyTheme()` and `renderAll()`
    - _Requirements: 5.3, 5.6_
  - [x] 3.3 Implement `saveTransactions()`, `saveLimit()`, `saveTheme()`
    - Write to localStorage on every mutation
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [x] 4. Implement transaction form and CRUD
  - [x] 4.1 Implement form submit handler with validation
    - Validate name, amount > 0, and category are all present; show `#form-error` if not
    - Push `{ id: Date.now(), name, amount, category }` to `transactions`, save, render, reset form
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 4.2 Implement delete confirmation modal
    - `openConfirmModal(id, name)` sets `pendingDeleteId` and shows modal
    - Confirm handler filters transaction out, saves, re-renders, shows error toast
    - Cancel and overlay-click close modal and clear `pendingDeleteId`
    - _Requirements: 2.3, 2.4_
  - [x]* 4.3 Write unit tests for form validation logic
    - Test empty name, zero/negative amount, missing category each trigger error
    - Test valid submission adds transaction and resets form
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 5. Implement rendering pipeline
  - [x] 5.1 Implement `renderBalance()`
    - Sum all transaction amounts with `getTotal()`, format with `Intl.NumberFormat` IDR, update `#total-balance`
    - _Requirements: 3.1, 3.2_
  - [x] 5.2 Implement `renderTransactionList()`
    - Call `getSortedTransactions()`, clear `<ul>`, render each item with category dot, name, meta, amount, delete button
    - Show empty-state `<li>` when list is empty
    - Escape user strings via `escapeHtml()` before `innerHTML` injection
    - _Requirements: 2.1, 2.2, 6.4_
  - [x] 5.3 Implement `renderChart()`
    - Aggregate amounts per category; show grey "No data" placeholder slice when all values are zero
    - Create `Chart.js` instance once; update via `.update()` on subsequent calls
    - Adapt legend label color to current theme
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 5.4 Implement `renderAll()` orchestrator
    - Call `renderBalance()`, `renderTransactionList()`, `renderChart()`, `checkSpendingLimit()` in sequence
    - _Requirements: 2.2, 3.2, 4.2_

- [x] 6. Implement sorting
  - [x] 6.1 Implement `getSortedTransactions()`
    - Return sorted copy for `amount-asc`, `amount-desc`, `category`; insertion order for `default`
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 6.2 Wire `sortSelect` change event to `renderTransactionList()`
    - _Requirements: 6.4_

- [x] 7. Implement spending limit and toast notifications
  - [x] 7.1 Implement spending limit set handler
    - Parse input, update `spendingLimit`, save, call `renderAll()`, show info toast
    - _Requirements: 7.1, 5.4_
  - [x] 7.2 Implement `checkSpendingLimit()`
    - Fire warning toast only when `spendingLimit > 0` and `getTotal() > spendingLimit`
    - _Requirements: 7.2, 7.3, 7.4_
  - [x] 7.3 Implement `showToast(message, type, duration)`
    - Append toast element, animate in with double `requestAnimationFrame`, remove after timeout
    - Types: `success`, `warning`, `error`, `info`
    - _Requirements: 7.2_

- [x] 8. Implement theme toggle
  - [x] 8.1 Implement `applyTheme()` and theme toggle click handler
    - Toggle `body.dark`, update icon (🌙/☀️) and label text, save preference
    - Call `renderChart()` after toggle to update legend colors
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 9. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All tasks are marked complete — the implementation is fully built
- Property tests are not included as the design used no formal correctness properties
