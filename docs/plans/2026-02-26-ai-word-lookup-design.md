# AI-Enriched Word Lookup Design

## Overview

Add Claude API integration to the word creation flow. When a user searches a word, the app calls both Merriam-Webster and Claude in parallel. Results appear in a tabbed view ("Dictionary" | "AI"). Claude provides its own definition plus rich markdown content (etymology, usage examples, related words).

## API Route

**`/api/ai/route.ts`** — GET endpoint, requires admin auth.

- Accepts `?word=ephemeral`
- Calls Anthropic API with structured prompt
- Returns JSON: `{ word, definition, part_of_speech, content }`
- `content` is markdown with etymology, example sentences, usage notes, related words

**Environment variable:** `ANTHROPIC_API_KEY` (server-only)

## Prompt Design

- System: Claude acts as a concise lexicographer
- Output: JSON with `word`, `definition`, `part_of_speech`, `content` (markdown)
- Content sections: Etymology, Example Sentences (2-3), Usage Notes, Related Words
- Keep concise — a few paragraphs total

## Create Page Changes

- Tabbed view above results: "Dictionary" | "AI"
- Dictionary tab: existing MW results with checkboxes
- AI tab: Claude's definition + markdown content preview
- "Add" button on AI tab saves with `source: "claude"`, populating `definition`, `part_of_speech`, and `content`
- Tabs load independently — one failing doesn't block the other

## Data Flow

```
User searches "ephemeral"
  ├─→ GET /api/dictionary?word=ephemeral  →  MW definitions (existing)
  └─→ GET /api/ai?word=ephemeral          →  Claude definition + content
       ↓
  Tabbed UI: Dictionary | AI
       ↓
  User picks tab, selects/adds word
       ↓
  POST /api/words (existing, content field already supported)
```
