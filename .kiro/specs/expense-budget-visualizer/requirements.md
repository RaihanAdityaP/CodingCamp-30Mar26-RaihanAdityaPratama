# Requirements Document

## Introduction

A client-side Expense & Budget Visualizer built with HTML, CSS, and Vanilla JavaScript. Users can track transactions, visualize spending by category via a pie chart, set spending limits, sort transactions, and toggle dark/light mode. All data persists via Local Storage with no backend required.

## Glossary

- **App**: The Expense & Budget Visualizer single-page application
- **Transaction**: A record consisting of an item name, amount, and category
- **Category**: One of three predefined spending groups: Food, Transport, or Fun
- **Balance**: The sum of all transaction amounts
- **Spending_Limit**: A user-defined numeric threshold for total spending
- **Chart**: A Chart.js pie chart displaying spending grouped by category
- **Storage**: The browser's Local Storage API used for data persistence
- **Theme**: The visual color scheme, either light or dark mode

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to add transactions via a form, so that I can record my expenses.

#### Acceptance Criteria

1. THE App SHALL provide an input form with fields for item name, amount, and category (Food, Transport, Fun)
2. WHEN the user submits the form, THE App SHALL validate that all fields are non-empty before processing
3. IF any required field is empty on submit, THEN THE App SHALL display a validation error and prevent submission
4. WHEN all fields are valid and the form is submitted, THE App SHALL add the transaction to the transaction list
5. WHEN a transaction is successfully added, THE App SHALL clear the form fields

### Requirement 2: Transaction List Display

**User Story:** As a user, I want to see all my transactions in a list, so that I can review my spending history.

#### Acceptance Criteria

1. THE App SHALL display all transactions in a scrollable list showing item name, amount, and category
2. WHEN a transaction is added or deleted, THE App SHALL update the list immediately
3. THE App SHALL provide a delete button for each transaction in the list
4. WHEN the user clicks a delete button, THE App SHALL remove the corresponding transaction from the list and from Storage

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my total balance at the top of the page, so that I know my overall spending at a glance.

#### Acceptance Criteria

1. THE App SHALL display the total balance (sum of all transaction amounts) at the top of the page
2. WHEN a transaction is added or deleted, THE App SHALL recalculate and update the displayed balance immediately

### Requirement 4: Spending Category Chart

**User Story:** As a user, I want a pie chart of my spending by category, so that I can understand where my money goes.

#### Acceptance Criteria

1. THE App SHALL render a Chart.js pie chart showing total spending grouped by category
2. WHEN a transaction is added or deleted, THE App SHALL update the chart immediately to reflect the new data
3. IF no transactions exist, THE App SHALL display the chart in an empty or placeholder state

### Requirement 5: Data Persistence

**User Story:** As a user, I want my transactions and preferences saved locally, so that my data is not lost on page refresh.

#### Acceptance Criteria

1. WHEN a transaction is added, THE App SHALL save the updated transaction list to Storage
2. WHEN a transaction is deleted, THE App SHALL save the updated transaction list to Storage
3. WHEN the App loads, THE App SHALL read and restore all transactions from Storage
4. WHEN the user sets a spending limit, THE App SHALL save the spending limit to Storage
5. WHEN the user toggles the theme, THE App SHALL save the theme preference to Storage
6. WHEN the App loads, THE App SHALL restore the spending limit and theme preference from Storage

### Requirement 6: Transaction Sorting

**User Story:** As a user, I want to sort my transactions, so that I can find and compare entries more easily.

#### Acceptance Criteria

1. THE App SHALL provide controls to sort transactions by amount in ascending order
2. THE App SHALL provide controls to sort transactions by amount in descending order
3. THE App SHALL provide a control to sort transactions by category alphabetically
4. WHEN a sort option is selected, THE App SHALL re-render the transaction list in the chosen order immediately

### Requirement 7: Spending Limit Alert

**User Story:** As a user, I want to set a spending limit and receive a warning when I exceed it, so that I can stay within my budget.

#### Acceptance Criteria

1. THE App SHALL provide an input field for the user to set a numeric spending limit
2. WHEN the total balance exceeds the spending limit, THE App SHALL display a visible warning message
3. WHEN the total balance is at or below the spending limit, THE App SHALL hide the warning message
4. IF the spending limit field is empty or zero, THEN THE App SHALL not evaluate or display the spending limit warning

### Requirement 8: Dark/Light Mode Toggle

**User Story:** As a user, I want to toggle between dark and light themes, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL provide a toggle button to switch between dark and light mode
2. WHEN the toggle is activated, THE App SHALL apply the selected theme to the entire page immediately
3. WHEN the App loads, THE App SHALL apply the theme preference restored from Storage

### Requirement 9: Responsive and Accessible UI

**User Story:** As a user, I want a clean, mobile-friendly layout, so that I can use the app on any device.

#### Acceptance Criteria

1. THE App SHALL use a single-column responsive layout that adapts to mobile screen widths
2. THE App SHALL display the total balance section at the top, the input form in the middle, and the transaction list with chart at the bottom
3. THE App SHALL use a single CSS file (css/style.css) and a single JavaScript file (js/script.js)
