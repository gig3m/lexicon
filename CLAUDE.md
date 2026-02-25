# Lexicon

Personal word collection app. Users browse words alphabetically with search; admins add words via Merriam-Webster lookups.

## Stack

- **Next.js 15** (App Router, Turbopack dev server) + **React 19**
- **Supabase** (Postgres — `words` table)
- **Tailwind CSS 4** (via `@tailwindcss/postcss`)
- **Merriam-Webster Collegiate API** for dictionary lookups
- TypeScript, strict mode

## Commands

```bash
npm run dev      # Start dev server (Turbopack) — http://localhost:3000
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # Next.js lint
```

## Environment Variables

Defined in `.env.local` (see `.env.local.example`):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `MW_API_KEY` | Merriam-Webster API key (server-only) |
| `ADMIN_PASSWORD` | Password for admin gate (server-only) |

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Public word index (client component, fetches from Supabase directly)
│   ├── layout.tsx            # Root layout with header nav (Index, Admin)
│   ├── globals.css           # Tailwind imports + custom theme (parchment/ink/accent colors)
│   ├── admin/
│   │   ├── layout.tsx        # Wraps children in AdminGate (password auth)
│   │   ├── page.tsx          # Word list management (edit/delete)
│   │   └── create/page.tsx   # MW dictionary lookup → pick definition → save to Supabase
│   └── api/
│       ├── auth/route.ts     # POST: password login + token verification
│       ├── dictionary/route.ts  # GET: proxies Merriam-Webster API, parses response
│       └── words/route.ts    # CRUD for words table (GET/POST/PUT/DELETE)
├── components/
│   ├── WordCard.tsx           # Displays a single word entry
│   ├── SearchBar.tsx          # Controlled text input for filtering
│   └── AdminGate.tsx          # Password auth wall (cookie-based sessions)
└── lib/
    ├── supabase.ts            # Client-side Supabase instance
    └── types.ts               # Word and MWDefinition types
```

## Database

Single `words` table in Supabase:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `word` | text | |
| `definition` | text | |
| `part_of_speech` | text | nullable |
| `pronunciation` | text | nullable |
| `source` | text | defaults to "merriam-webster" |
| `notes` | text | nullable, personal annotations |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

## Key Patterns

- **Client-side data fetching**: The index page queries Supabase directly from the browser using the anon key. API routes also create their own Supabase clients (not a shared singleton for server routes).
- **Admin auth**: Simple password → SHA-256 token stored in cookie (7-day expiry). No user accounts or Supabase Auth. Token is `sha256(password + "_lexicon_salt")`.
- **MW API proxy**: `/api/dictionary` server route keeps the MW API key secret. Returns parsed `MWDefinition[]` or suggestions if the word isn't found.
- **Tailwind 4 theme**: Custom colors defined in `globals.css` via `@theme` directive — `parchment`, `ink`, `accent`, `accent-light`, `muted`, `border`, `surface`, `surface-hover`. Serif font for headings, sans for body.

## Gotchas

- No git repo initialized yet
- Supabase client in `src/lib/supabase.ts` uses `NEXT_PUBLIC_*` keys — fine for reads with RLS but not for privileged ops
- API routes in `src/app/api/words/route.ts` also use the anon key (not a service role key), so Supabase RLS policies must allow these operations
- No error boundary or loading states at the layout level
- Admin auth has no CSRF protection and token is deterministic (same password always produces same token)
