# ProSieben Marketing Agents — React frontend

A minimal React SPA migrated from the Streamlit `client.py`, built per
[`frontend-migration.md`](./frontend-migration.md) and the
[Stitch designs](./stitch-designs/). **Authentication is intentionally not
implemented** (no MSAL / login gate) — the app assumes an already-authenticated user.

## Stack
- **Vite + React 18 + TypeScript**
- **Zustand** for state (`src/store/useChatStore.ts`)
- **react-markdown + remark-gfm** for rendering bot replies (GFM tables)
- **dompurify** for sanitising the server's pre-rendered cast `profile_html`
- **html2pdf.js** (lazy-loaded) for per-message PDF export
- Plain CSS with the design tokens from migration doc §2 (`src/styles/tokens.css`)

## Run
```bash
npm install
npm run dev      # http://localhost:5173  (proxies /api + /health → http://localhost:8000)
npm run build    # type-check + production build to dist/
npm run preview  # serve the build
```

### Backend URL
Dev uses the Vite proxy in `vite.config.ts` (no CORS setup needed). For a deployed
backend, copy `.env.example` → `.env` and set `VITE_API_BASE_URL=https://your-api`.
Backend must allow the React origin via `ALLOWED_ORIGINS` (§10).

## What's implemented
| Flow | Where |
|---|---|
| Plain chat (`POST /api/message`) | `submitComposer` (§5.1) |
| Document upload + optional instructions (`/api/upload`) | `submitComposer` (§5.2) |
| Cast research → **edit** (`/api/cast_edit`) → **SSE report** (`/api/cast_report/stream`) | `handleAction`, `confirmCastEdit`, `startCastStream` (§5.3, §6) |
| Live carousel + thinking-card progress while streaming | `CastCarousel`, `ThinkingCard` |
| Briefing edit (`/api/briefing_edit`) | `confirmBriefingEdit`, `BriefingEditTable` (§5.4) |
| Follow-up chips incl. `_cast_edit` / `_briefing_edit` pseudo-intents | `FollowUpButtons`, `handleAction` |
| Health dot (`/health`), EN/DE toggle, drag-and-drop, staged-file chips, per-message PDF | `App`, `Header`, `Composer`, `DropOverlay`, `PdfExportButton` |

`conversation_id` is generated once and persisted to `localStorage` (§9), so refresh
keeps the session (the server persists state keyed by it).

## Structure
```
src/
  main.tsx, App.tsx          # root + flow orchestration (file picker, drag-drop, health)
  api/                       # client, chat, cast (SSE), briefing, health
  store/useChatStore.ts      # Zustand: state + all async flows
  i18n/strings.ts            # bilingual copy + briefing field schema (19 fields)
  components/                # Header, WelcomeHero, FeatureModal, MessageList,
                             # UserBubble, BotMessage, ThinkingCard, FollowUpButtons,
                             # CastCarousel, CastProfile, CastEditTable,
                             # BriefingEditTable, Composer, DropOverlay,
                             # PdfExportButton, LanguageToggle, Logo
  styles/                    # tokens.css (§2 design tokens) + app.css
```

## Notes / not included (per request)
- **No auth.** `src/auth/*`, MSAL, and the login gate from §7 are deliberately omitted.
  When auth is added later, attach a bearer token in `src/api/client.ts` and gate `<App>`.
- The SSE handler already supports a structured `profile` object (§7); if the backend
  is upgraded to emit one, `CastProfile` renders it natively instead of injecting HTML.
```
