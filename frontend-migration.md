# Frontend Migration — Streamlit (`client.py`) → React

## Why migrate

The current frontend is a single ~2000-line Streamlit file (`client.py`). Streamlit is a server-driven, full-rerun framework, which fights every interactive part of this app. The migration is driven specifically by the **`/api/cast_report/stream`** (SSE) and **cast/briefing edit** flows, which Streamlit can only fake:

| Pain point | How Streamlit hacks it today | What React does natively |
|---|---|---|
| **SSE streaming** of cast profiles | Spawns a background `threading.Thread` that appends chunks to a shared list, while the main script `time.sleep(0.3)` polls that list and re-renders the *entire page* each tick (`client.py:1837-1884`). | `fetch()` + `ReadableStream` reader, or `EventSource`; append to state as chunks arrive. No threads, no polling, no full rerun. |
| **Live carousel** that updates as each profile streams in | Rebuilds the whole carousel HTML string and re-injects it via `st.empty().markdown(unsafe_allow_html=True)` every 0.3s; carousel nav wired by a `setInterval` JS loop reaching into `window.parent.document` (`client.py:1088-1114`). | A `<Carousel>` component with `useState` index; cards pushed to an array. |
| **Cast edit / briefing edit tables** | `st.data_editor` inside a chat message, gated by `_is_last_msg` + a session flag, with confirm/cancel buttons that mutate `st.session_state` and `st.rerun()` (`client.py:1665-1794`). Editing only works on the *last* message. | A controlled `<EditableTable>` modal/inline form, editable anytime, optimistic update. |
| **File attach** (paperclip in the input bar) | Native `st.file_uploader` is hidden off-screen; a JS `setInterval` injects a paperclip `<button>` into the chat input DOM and proxies clicks to the hidden `<input type=file>` (`client.py:993-1048`). | A real `<input type=file>` + button in the composer. |
| **Staged-file chips + drag-and-drop** | JS reads a hidden `data-files` carrier div and injects chip DOM; a global `drop` handler stuffs files into the hidden input via `DataTransfer` (`client.py:1268-1404`). | Component state + `onDrop`. |
| **Per-message PDF export** | JS injects a button into every `[data-testid="stChatMessage"]` and calls `html2pdf` on its innerHTML (`client.py:1133-1208`). | A button per message bubble; reuse `html2pdf.js` or server-side. |
| **Locking light theme** | ~640 lines of CSS overrides + a JS `fixBg()` loop forcing `background-color`/`color-scheme` on Streamlit's internal `data-testid` nodes (`client.py:1050-1075`). | Your own CSS. None of this exists. |
| **Preserving the typed draft** across the file-picker rerun | Saves textarea value to `sessionStorage` and restores it with a native setter + synthetic `input` event (`client.py:1119-1130`). | State persists across renders by default. |

Almost everything fragile in `client.py` is a workaround for Streamlit's rerun model and its closed DOM. A React SPA removes the entire `_components.html(...)` JS layer (~400 lines) and the CSS-injection layer.

> Backend note: the API stays **unchanged**. See [migration.md](migration.md) for the backend (Azure→LangChain) migration. This document is frontend-only.

---

## 1. Current tech & what it maps to

| Current (`client.py`) | Purpose | React equivalent |
|---|---|---|
| Streamlit | UI runtime + state + rerun loop | React + Vite (or Next.js) |
| `st.session_state` | Per-session client state | `useState` / `useReducer` / Zustand / Context |
| `st.chat_message`, `st.markdown` | Message rendering | `<MessageList>` + a markdown renderer (`react-markdown` + `remark-gfm` for tables) |
| `st.data_editor` | Editable cast/briefing tables | `<EditableTable>` (TanStack Table, AG Grid, or controlled inputs) |
| `requests` (sync) | HTTP to FastAPI | `fetch` / `axios` |
| `requests ... stream=True` + thread + poll | SSE consumption | `fetch` + `ReadableStream`, or `EventSource` |
| `msal` (Python ConfidentialClientApplication) | Microsoft Entra OAuth | `@azure/msal-browser` + `@azure/msal-react` (SPA / PKCE) |
| `_components.html` JS injection | Paperclip, chips, drag-drop, carousel, modals, PDF | Native React components |
| `html2pdf.js` (CDN) | Client-side PDF export | Keep `html2pdf.js` or `react-to-pdf` |
| `pandas` DataFrame | Backing for `st.data_editor` | Plain JS arrays/objects |

The header comment already says the Streamlit CSS was built to *mimic a React design system* — so the design tokens below come straight from the intended React app.

---

## 2. Design system (extracted from the CSS)

All colors are HSL. Font is **DM Sans** (Google Fonts). Theme is **light, locked** (OS dark mode is forcibly overridden — irrelevant in React).

```css
/* Core tokens */
--bg:                hsl(209, 40%, 96%);   /* app background */
--surface:           hsl(210, 40%, 98%);   /* cards, bot bubble */
--surface-white:     #ffffff;
--border:            hsl(212, 26%, 83%);
--text:              hsl(222, 47%, 11%);   /* near-black headings */
--text-muted:        hsl(215, 16%, 46%);
--text-secondary:    hsl(215, 19%, 35%);

/* Brand gradient (logos, primary buttons, user bubble, "checked" pills) */
--grad: linear-gradient(135deg, hsl(163,100%,40%), hsl(180,80%,40%));
--brand:        hsl(163, 100%, 40%);
--brand-text:   hsl(163, 100%, 35%);   /* links, accents on light bg */
--logo-bg:      hsl(215, 19%, 34%);     /* slate square behind the "7" logo */

--status-ok:    hsl(163, 100%, 45%);    /* connected dot (pulses) */
--status-err:   hsl(0, 84%, 60%);       /* disconnected dot */
--danger:       #dc2626;                /* error text */
```

Key visual specs:
- **Bot bubble**: `--surface` bg, 1px `--border`, radius `4px 20px 20px 20px`, max-width 85% (100% when it contains a `<table>`), subtle shadow.
- **User bubble**: brand gradient bg, white text, radius `20px 20px 4px 20px`, right-aligned, max-width 75%.
- **Logo**: ProSieben "7" — white SVG path on a slate (`--logo-bg`) rounded square. SVG path is in `client.py:107` / `774`:
  `M12 8 L88 8 L88 32 L52 92 L28 92 L60 38 L12 38 Z`
- **Header**: fixed top, 60px, blurred translucent bg, logo + title (gradient text) + subtitle "Content Briefing · Consumer Insights · Story Hooks" + signed-in user name + connection dot.
- **Pulsing status dot**: `@keyframes pulse-g` / `pulse-r` (box-shadow ripple).
- **Tables**: full-width, horizontal scroll when wider than bubble, header bg `hsl(210,40%,96%)`, 1px borders; 2nd column (`Entry`/value) wraps, others `nowrap`.
- **Markdown tables require GFM** — bot replies are markdown strings containing pipe tables. Use `remark-gfm`.

Reusable component CSS already written (port the rules, drop the `[data-testid=...]` selectors):
- Thinking/processing card: `.thinking-box`, `.t-step`, `.step-icon-*`, `@keyframes spin`, `.gen-line` (`client.py:477-532`).
- Cast carousel: `.cc-wrap`, `.cc-header`, `.cc-prev/.cc-next`, `.cc-counter`, `.cc-card`, `.cc-card-inner` (`client.py:698-768`).
- Feature modal: `.fm-overlay`, `.fm-box`, `.fm-close`, `.fm-section`, `.fm-list`, `.fm-steps`, `.fm-tip` (`client.py:303-384`).
- Follow-up chips: `.followup-header` + secondary button style (`client.py:659-696`).

---

## 3. API contract (the part that must stay identical)

Base URL: `API_BASE_URL` (env, default `http://localhost:8000`). All POSTs are JSON except upload (multipart). Endpoints are defined in [main.py](main.py).

### `GET /health`
→ `{ "status": "ok" }`. Used on load to set the connection dot.

### `POST /api/message` — main chat router
Request:
```json
{ "message": "string", "conversation_id": "string", "language": "english|german", "intent": "optional-string" }
```
- If `intent` is omitted, the backend classifies it (routing chain).
- If `intent` is set (follow-up buttons / forced flows), routing is skipped.

Response:
```json
{
  "reply": "markdown string",
  "suggested_actions": [ { "title": "📊 …", "value": "trigger phrase", "intent": "consumer_insights" } ],
  "cast_edit_data":     { "Name": "identity-anchor-url", ... },   // present only on cast_research
  "briefing_edit_data": { "field": {"value": "...", "source": "..."}, ... }  // present only on content_briefing
}
```
- `reply` is **rendered markdown** (tables, links, headings). React must render it with GFM.
- `cast_edit_data` present → show the editable cast table affordance.
- `briefing_edit_data` present → enable the "Edit Briefing Card" affordance.
- 500 errors return `{ "error": "..." }` with status 500.

### `POST /api/upload` — document upload (multipart/form-data)
Form fields: `conversation_id`, `language`, and one or more `files`.
Response:
```json
{ "reply": "**N document(s) processed…**", "suggested_actions": [ ... ] }
```
Accepted types (frontend filter): `pdf, docx, doc, pptx, ppt, png, jpg, jpeg, gif, webp, bmp, svg`.
After upload the backend auto-derives `show_title`. Today the client uploads first, then optionally sends a `/api/message` with the typed instructions (see flow §5.2).

### `POST /api/cast_report/stream` — **SSE stream** (the key flow)
Request: `{ "message": "Generate cast report", "conversation_id": "...", "language": "...", "intent": "cast_report" }`
Response: `text/event-stream`. Each event is a line `data: {json}\n\n`. Chunk types:
```jsonc
// 1) status (zero or more)
{ "type": "status", "message": "Fetching data for 8 cast members..." }

// 2) profile (one per cast member, as it completes — order is completion order, not input order)
{ "type": "profile",
  "profile_html": "<h3>…</h3> …full pre-rendered HTML for one cast card…",
  "name": "Emmy Russ", "index": 3, "total": 8 }

// 3) complete (exactly one, last)
{ "type": "complete",
  "overview_table": "| Cast Member | Age | … |\n|---|---|…",   // markdown table
  "report_name": "Cast Research Report - …",
  "suggested_actions": [ ... ] }

// error
{ "type": "error", "message": "No cast research data found." }
```
> Note the backend sends `profile_html` **already rendered as HTML** (see `_format_profile_html` in `main.py:202`). The React carousel can inject it directly (sanitize first), OR — cleaner — switch the endpoint to emit a structured `profile` object and render with a `<CastProfile>` component. The structured profile fields exist server-side; see §7.

### `POST /api/cast_report/step` — non-streaming paginated alternative
`message` = step number `"1"|"2"|"3"`. step 1 = overview, step 2 = first 6 profiles, step 3 = remainder. Returns `{ reply, has_more, suggested_actions? }`. Exists as a fallback to SSE; React may not need it.

### `POST /api/cast_edit` — regenerate report from edited cast list
Request: `{ "conversation_id": "...", "identity_anchors": { "Name": "url", ... } }`
→ `{ "status": "ok", "cast_count": N }`. **Does not return the report** — today the client follows up by triggering the stream/report again.

### `POST /api/briefing_edit` — save manually edited briefing card
Request: `{ "conversation_id": "...", "briefing_card": { "field": "value-string", ... } }` (flat string values; backend re-wraps each as `{value, source:"manual edit"}`).
→ `{ "status": "ok", "reply": "markdown briefing table" }`.

### Intents (drive routing + follow-up buttons)
`pdf_upload`, `content_briefing`, `regenerate_briefing`, `consumer_insights`, `creative_ideation`, `cast_research`, `cast_report`, `qa`, `greeting`.
Plus two **client-only pseudo-intents** used by follow-up buttons (never sent to the server):
- `_cast_edit` → opens the cast edit table.
- `_briefing_edit` → opens the briefing edit table.

### Auth header
Today only `/api/cast_edit` is called with `Authorization: Bearer <token>` (`client.py:1697`); the others omit it. The backend does not currently enforce auth. **Recommendation for React: attach the bearer token to every request** and add verification server-side.

---

## 4. Client state model (`st.session_state` → React store)

From `client.py:777-789` plus runtime keys. Model this as a single store (Zustand/Context):

```ts
interface AppState {
  conversationId: string;        // uuid4, generated once per session (persist to localStorage)
  messages: Message[];           // ordered chat log
  processing: boolean;           // a request/stream is in flight (disables composer)
  language: 'english' | 'german';// default 'german'
  isConnected: boolean;          // from /health
  auth: { token: string; user: { name?: string; preferred_username?: string } } | null;

  // staged composer state
  stagedFiles: File[];           // attached but not yet sent
  draft: string;                 // composer text

  // transient flow flags (replace the _cast_edit_active / _briefing_edit_active / _pending hacks)
  editing: { type: 'cast' | 'briefing'; messageId: string } | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;               // markdown (assistant) or plain text (user)
  timestamp: string;             // "HH:MM"
  kind?: 'markdown' | 'carousel' | 'error';
  attachmentNames?: string[];
  suggestedActions?: Action[];
  castEditData?: Record<string,string>;        // -> render cast edit affordance
  briefingEditData?: Record<string, any>;      // -> render briefing edit affordance
  profiles?: CastProfile[];      // for carousel messages
}

interface Action { title: string; value: string; intent: string; }
```

Notes:
- `conversation_id` is the only identity the server needs; persist it so refresh keeps the session.
- Streamlit regenerates `conversation_id` on every browser load (`str(uuid.uuid4())`) — meaning **refresh starts a new session today**. React should decide intentionally (persist vs. fresh). The server already persists sessions in Cosmos keyed by `conversation_id`.

---

## 5. Core flows

### 5.1 Plain message
1. User types → push user `Message`, set `processing=true`.
2. `POST /api/message` with `{message, conversation_id, language}`.
3. On reply: push assistant `Message` with `reply` + `suggested_actions` (+ `cast_edit_data`/`briefing_edit_data` if present). `processing=false`.
4. Errors → push an error bubble ("⚠️ Request timed out / Server error / empty response").

### 5.2 Upload (+ optional instructions)
1. User attaches files (paperclip / drag-drop) → they sit as **staged chips** in the composer.
2. On send:
   - Always `POST /api/upload` (multipart) first.
   - If there's also typed text, then `POST /api/message` with that text.
   - The displayed user bubble shows the text + 📎 attachment names.
3. Clear staged files; bump uploader key (Streamlit artifact — N/A in React).

> Today there's also a "Generate Briefing Card" follow-up button whose `intent==content_briefing` *opens the file picker first* and auto-submits once files are staged (`client.py:959-963`, `1449-1464`). In React this is just: button → open file dialog → on select, run the upload flow. Much simpler.

### 5.3 Cast research → edit → report (the headline flow)
1. **Cast research**: user/button sends `intent=cast_research` → `/api/message` returns a playback table + `cast_edit_data` (`{name: anchorUrl}`), and follow-up buttons "✅ Generate Cast Report" (`intent=cast_report`) and "✏️ Edit Cast List" (`intent=_cast_edit`).
2. **Edit (optional)**: user edits names/anchors in an editable table. Confirm → `POST /api/cast_edit` (regenerates server-side), then proceed to report.
3. **Report (streaming)**: send `intent=cast_report` to `POST /api/cast_report/stream`. As `profile` chunks arrive:
   - Append to a `profiles[]` array, render a **live carousel** that advances to the newest card.
   - Show a thinking card: "Fetching wiki & social data" → ✓, then one ✓ per completed profile, then "N profiles remaining".
   - On `complete`: finalize the carousel message + append an **overview table** message with `report_name` and `suggested_actions`.

### 5.4 Briefing edit
1. Briefing reply includes `briefing_edit_data`. The "✏️ Edit Briefing Card" follow-up (`intent=_briefing_edit`) opens the editable field/value table (19 fields, EN/DE labels — schema in `client.py:1728-1748` and `main.py:299-319`).
2. Save → `POST /api/briefing_edit` with flat `{field: value}` → returns rendered markdown `reply`; push it as a new assistant message.

---

## 6. SSE consumption in React (replaces the thread+poll hack)

The current approach (`client.py:900-922`, `1837-1887`) is a background thread filling a list while the main loop polls and full-reruns. In React, consume the stream directly:

```ts
async function streamCastReport(conversationId: string, language: string,
                                onChunk: (c: any) => void): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/cast_report/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ message: 'Generate cast report', conversation_id: conversationId,
                           language, intent: 'cast_report' }),
  });
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');         // SSE event delimiter
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      const line = part.trim();
      if (line.startsWith('data: ')) {
        try { onChunk(JSON.parse(line.slice(6))); } catch {}
      }
    }
  }
}
```
- `onChunk` dispatches by `type`: `status` → update thinking steps; `profile` → push to `profiles` state (carousel re-renders, jumps to newest); `complete` → finalize + push overview message; `error` → error bubble.
- Use `EventSource` only if you switch the endpoint to GET; it's POST today, so `fetch`+reader is the fit.
- `profile` chunks arrive in **completion order** (server uses a thread pool, `as_completed`) — don't assume input order; the `index`/`total` fields tell you progress, `name` identifies the card.

---

## 7. Component inventory (build list)

| Component | Replaces (client.py) | Notes |
|---|---|---|
| `<AuthGate>` / `<LoginPage>` | `_handle_auth`, `_show_login_page` (1-129) | MSAL SPA (PKCE). "Sign in with Microsoft" button → redirect; handle `code` on return. |
| `<Header>` | header markdown (1409-1428) | Logo, gradient title, subtitle, user name, connection dot (green pulse / red). |
| `<WelcomeHero>` | hero markdown (1549-1572) | 3 feature cards (Content Briefing / Consumer Insights / Q&A), bilingual copy in `_T` (1484-1544). Show only when `messages` empty. |
| `<FeatureModal>` | `.fm-*` + JS `wireModals` (303-384, 1210-1266) | Click a feature card → modal with "what to upload / output / tip". Copy in `_T`. |
| `<MessageList>` | chat loop (1632-1815) | Maps `messages[]`. |
| `<UserBubble>` | 1633-1651 | Right-aligned gradient bubble + 📎 attachment names + timestamp. |
| `<BotMessage>` | 1652-1663 | Markdown via `react-markdown`+`remark-gfm`. Error variant when content starts with ⚠️. |
| `<ThinkingCard>` | `make_thinking_card` (792-831) | Steps with done/active/pending icons + spinner + "Generating…" line. Drives both standard and streaming progress. |
| `<FollowUpButtons>` | 1796-1815 | Renders `suggested_actions` as a 2-col chip grid. Click → dispatch by `intent` (incl. `_cast_edit`/`_briefing_edit` pseudo-intents). Hidden while an edit table is open or while processing. |
| `<CastCarousel>` | `_build_carousel_html` + JS nav (925-947, 1088-1114) | Prev/next, "i / N" counter, one card per profile. Render `profile_html` (sanitized) or structured fields. Auto-advances to newest while streaming. |
| `<CastEditTable>` | `st.data_editor` block (1665-1718) | Editable name/anchor rows, add/remove, Confirm→`/api/cast_edit`→stream report, Cancel. **Editable anytime, not just last message.** |
| `<BriefingEditTable>` | briefing editor block (1720-1794) | 19 field/value rows (field labels read-only, values editable), bilingual labels. Save→`/api/briefing_edit`. |
| `<Composer>` | `st.chat_input` + uploader + JS (993-1048, 1268-1404, 1989-2018) | Textarea, send button, paperclip (real file input), staged-file chips, drag-and-drop overlay, bilingual placeholder, disabled while `processing`. |
| `<LanguageToggle>` | `st.radio` (1466-1472) | EN/DE pill toggle; updates `language`. |
| `<PdfExportButton>` | JS `injectMsgPDFBtns`/`exportMsgAsPDF` (1133-1208) | Per-message export. Keep `html2pdf.js` (CSS string at 1170-1183) or move server-side. |
| `<DropOverlay>` | JS drag-drop (1321-1404) | "Drop your file here" full-screen overlay on drag-enter. |

**Structured cast profile** (if you replace `profile_html` with structured rendering): the server profile object (`main.py:_format_profile_html`, `cast_reasearch_chain._build_profile_prompt`) has: `name, age, profession, known_from, marketing_role, basic_identity(+_sources), previous_work(+_sources), social_media{platform:{handle,followers,url}}, content_style, amplification_channels, public_narrative(+_archetype,+_sources), promotional_leverage`. Recommend exposing this JSON in the `profile` chunk so React owns the layout.

---

## 8. Recommended React architecture

```
src/
  main.tsx                 # MSAL provider + app root
  api/
    client.ts              # fetch wrapper, base URL, auth header
    chat.ts                # sendMessage, uploadFiles
    cast.ts                # streamCastReport (SSE), castEdit, castStep
    briefing.ts            # briefingEdit
    health.ts              # ping
  store/
    useChatStore.ts        # Zustand: messages, processing, language, conversationId
  auth/
    msalConfig.ts          # @azure/msal-browser SPA config (PKCE)
    AuthGate.tsx
  components/
    Header.tsx  WelcomeHero.tsx  FeatureModal.tsx
    MessageList.tsx  UserBubble.tsx  BotMessage.tsx
    ThinkingCard.tsx  FollowUpButtons.tsx
    CastCarousel.tsx  CastProfile.tsx
    CastEditTable.tsx  BriefingEditTable.tsx
    Composer.tsx  LanguageToggle.tsx  DropOverlay.tsx  PdfExportButton.tsx
  styles/
    tokens.css             # the HSL variables from §2
  i18n/
    strings.ts             # the _T bilingual copy (1484-1544) + UI labels
```

Suggested libraries: `@azure/msal-browser` + `@azure/msal-react`, `react-markdown` + `remark-gfm`, `zustand`, `dompurify` (if injecting `profile_html`), `html2pdf.js` (keep), Vite + TS.

### MSAL change (important)
The Python client uses a **confidential** client (client secret) — wrong for a browser SPA. The React app must use a **public SPA client with PKCE** (`@azure/msal-browser`, no secret in the browser). In Entra, register/confirm the app as a SPA with redirect URI = the React app origin, scope `User.Read`. The `AZURE_CLIENT_SECRET` env var does not move to the frontend.

---

## 9. Migration order (suggested)

1. **Scaffold + tokens + Header/Hero** — static shell, light theme CSS, connection dot via `/health`.
2. **Auth** — MSAL SPA login gate.
3. **Composer + MessageList + plain `/api/message`** — get the basic chat loop working (user bubble, bot markdown, follow-up buttons).
4. **Upload flow** — real file input, staged chips, drag-drop, multipart upload (+ optional follow-up message).
5. **Cast research + `<CastEditTable>` + `/api/cast_edit`**.
6. **SSE cast report + `<CastCarousel>` + `<ThinkingCard>` streaming** — the core reason for the migration. Consider switching the chunk payload to structured profiles.
7. **`<BriefingEditTable>` + `/api/briefing_edit`**.
8. **Feature modals, PDF export, bilingual copy polish**.
9. **Decide conversation persistence** (localStorage vs fresh per load).

---

## 10. Gotchas carried over from the backend

- **CORS**: backend reads `ALLOWED_ORIGINS` (not the `CORS_ALLOW_ORIGINS` shown in docs); set it to the React origin. See `main.py:20-26`.
- **`profile` chunks are completion-ordered**, not input-ordered (§6).
- **`/api/cast_edit` returns only a status**, not the report — after confirming an edit you must re-trigger the report/stream.
- **Briefing edit sends flat strings**; the server re-wraps to `{value, source}`. Don't send the `{value, source}` shape back.
- **`cast_edit_data` / `briefing_edit_data`** appear only on their respective intents' replies — key your edit affordances off their presence.
- The backend writes debug lines to a hardcoded `log.txt`; unrelated to the frontend but noisy in dev.
```
