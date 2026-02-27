# Religious Lens + Unified Results Design

**Date**: 2026-02-27

## Summary

Two changes to the word creation flow:

1. Add a biblical studies lens to the AI prompt — Hebrew/Greek roots, scriptural usage, theological significance where relevant.
2. Replace the tabbed MW/AI results UI with a unified checklist where users can select any combination of MW definitions and/or the AI definition. AI content (rich markdown) is always attached to saved words.

## AI Prompt Changes

Update the system prompt in `src/app/api/ai/route.ts`:

- Add instruction: "Where relevant, explore the word's connection to biblical languages (Hebrew, Greek, Latin), its usage in Scripture or theological discourse, and any spiritual or theological significance."
- Fits naturally into the existing etymology instruction — expand it to prioritize biblical/theological roots when they exist.
- For secular words with no religious connection, the AI focuses on general etymology ("where relevant" avoids forcing a religious angle).
- Logos Bible Software source links already align with this lens.

## Create Page UI

Replace the two-tab layout with a unified checklist:

- **Source badges**: Each definition entry labeled "MW" (muted) or "AI" (accent) pill.
- **MW entries**: Each definition gets a checkbox row — part of speech, pronunciation, definition text.
- **AI entry**: Single checkbox row — definition, part of speech, pronunciation. Expandable "Show full content" details element for the AI markdown preview.
- **AI content notice**: "AI content (etymology, usage, related terms) is always included."
- **Notes textarea**: Shared, appears when results are available (unchanged).

## Save Logic

Single `POST /api/words` call:

| Selection | `definition` | `content` | `source` |
|-----------|-------------|-----------|----------|
| MW only | Combined MW text | AI markdown | "merriam-webster" |
| AI only | AI definition | AI markdown | "claude" |
| Both | MW + AI combined | AI markdown | "combined" |

Other fields:
- `part_of_speech`: from first checked entry
- `pronunciation`: AI preferred, fallback to first MW entry
- `notes`: from textarea

## Edge Cases

- AI fails, MW succeeds: show only MW results, no AI content attached
- MW fails, AI succeeds: show only AI result
- Both fail: error message

## What Doesn't Change

- Word detail page — already renders `content` markdown
- Index page, WordCard component
- `/api/words` route — already accepts `content` and `source`
- `/api/dictionary` route
- Database schema — no changes needed
