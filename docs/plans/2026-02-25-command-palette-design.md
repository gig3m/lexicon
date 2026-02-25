# Command Palette Design

## Overview

Global command palette (Cmd+K / Ctrl+K) for quick word navigation. Uses the `cmdk` library for keyboard navigation and accessibility. Available from every page.

## Trigger

- Keyboard: `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux)
- Header: clickable hint button showing `⌘K`

## Behavior

- Centered modal overlay with dimmed backdrop
- Auto-focused text input at top
- Flat filtered list of all words (cmdk handles fuzzy filtering)
- Arrow keys to navigate, Enter to select, Escape to close
- Selecting a word navigates to `/word/{slug}`

## Data

Fetches words from Supabase client-side on first open. Caches in component state for subsequent opens during the session.

## Components

- `src/components/CommandPalette.tsx` — client component using cmdk's `Command.Dialog`, `Command.Input`, `Command.List`, `Command.Item`
- Added to `src/app/layout.tsx` for global availability

## Styling

Matches Lexicon theme: parchment surface, ink text, accent highlight on selected item. Serif font for word names.

## Dependencies

- `cmdk` (~4KB)
