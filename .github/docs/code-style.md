# Code Style Guidelines for Clinton CAT

These guidelines help maintain a consistent codebase and make it easier for everyone to contribute to Clinton CAT. Please follow these rules when writing or updating code.

---

## 1. General Principles

- **Readability & Clarity:**  
  Write code that is easy to read and understand. Use descriptive variable and function names. Avoid overly clever solutions when a simple, clear one exists.

- **Consistency:**  
  Stick to the established style across the project. Consistent formatting and naming conventions improve maintainability and reduce cognitive load for all contributors.

---

## 2. Formatting & Linting

We use [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to enforce consistent code formatting. This is done automatically on commit, but you can run the formatting scripts manually if needed.
- `npm run format` - Formats the code using Prettier.
- `npm run lint` - Checks the code for ESLint errors.
- `npm run lint:fix` - Fixes ESLint errors automatically.
- `npm run typecheck` - Checks TypeScript types.

---

## 3. Naming Conventions

- **Variables & Functions:** Use camelCase (e.g., `userName`, `calculateTotal`).
- **Classes & Components:** Use PascalCase (e.g., `ObservableValue`, `PreferencesService`).
- **Constants:** Use UPPERCASE with underscores (e.g., `MAX_ITEMS`).
- **Files & Directories:**
    - Use descriptive names that match the content, class or function of the file.
    - use PascalCase (e.g., `Options.tsx`) for React components.
    - Use kebab-case (e.g., `sorted-collection.ts`) for file names if possible, to keep things consistent.
    - Use `.test.ts` for test files (e.g., `sorted-collection.test.ts`).

---

## 4. Folder Structure

```sh
├── background.ts                # The primary background script for the browser extension
│
├── common                       # Shared code or utilities used by multiple parts of the extension
│   ├── observables              # Contains classes/utilities for reactive "observable" logic
│   └── services                 # Application services (e.g., Preferences, network helpers)
│
├── content-scanners             # Site-specific logic to scan or scrape data from these domains
│   ├── helpers                  # Shared utilities and helper functions for content scanners
│   ├── amazon                   # Scanner logic specific to domain
│   │  ├── amazon-uk.scanner.ts  # Scanner must be suffixed with `.scanner.ts`
│   │  └── amazon-us.scanner.ts  # Scanner must be suffixed with `.scanner.ts`
│   │
│   ├── apple                    # Scanner logic specific to domain
│   ├── best-buy                 # Scanner logic specific to domain
│   ├── google                   # Scanner logic specific to domain
│   ├── meta                     # Scanner logic specific to domain
│   ├── netflix                  # Scanner logic specific to domain
│   └── scanner.ts               # Exports all scanners
│
├── storage                      # Responsible for browser storage logic (local, sync, cache, etc.)
│   ├── chrome                   # Chrome-specific storage backends
│   ├── istorage-backend.ts      # Interface/contract for a storage backend
│   └── storage-cache.ts         # Implements an in-memory cache around browser storage
│
├── ui                           # All user interface (React components, pages, popups, etc.)
│   ├── components               # Reusable UI components
│   ├── options                  # The extension’s "Options" page
│   └── popup                    # The extension’s "Popup" (the small window on toolbar click)
│
└── utils                        # General-purpose helper functions/types
    ├── helpers                  # Misc helpers (formatting, parsing, etc.)
    └── types.ts                 # Shared/global TypeScript types
```

---

## 5. Comments & Documentation

- **Avoid Unnecessary Comments:**
    - Write code that is self-explanatory and easy to understand. Avoid adding comments that merely restate the code.

- **Inline Comments:**
    - Write comments (when necessary) to explain why a piece of code exists or how a non-obvious solution works.
    - Keep inline comments brief and to the point.

- **Function Documentation:**
    - Use [JSDoc / TypeScript](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html) comments for functions, classes, and complex logic. This helps with inline IDE documentation and clarifies the intended use.

  *Example*:
  ```ts
  /**
   * Searches for the correct index to insert the value into a sorted array.
   * @param value - The value to insert.
   * @returns The index at which to insert the value.
   */
  private _searchIndex(value: T): number {
    // ...
  }
  ```
