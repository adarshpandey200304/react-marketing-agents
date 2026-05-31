# Stitch Designs — ProSieben Marketing Agents (React migration)

Minimal UI designs generated in **Google Stitch** from [`frontend-migration.md`](../frontend-migration.md).
Auth/login was intentionally **excluded** per request.

- **Stitch project:** `projects/11435906113393200826`
- **Design system:** `assets/12974591660004255582` — "ProSieben Marketing — Light"
  - Font: DM Sans · Light theme (locked) · Brand `#00cc92` teal-green gradient · 12px roundness
  - Tokens taken straight from §2 of the migration doc.

## Screens

| File | Stitch title | Covers (migration doc §) |
|---|---|---|
| `01-welcome.png` | Marketing Agents Welcome | Header, `<WelcomeHero>` (3 feature cards), `<Composer>` empty state, connection dot, `<LanguageToggle>` |
| `02-active-chat.png` | Marketing Agents Active Chat | `<UserBubble>`, `<BotMessage>` + GFM table, `<FollowUpButtons>`, `<CastEditTable>`, staged-file chip in `<Composer>` (§5.1, §5.3) |
| `03-streaming-report.png` | Streaming Cast Report | `<ThinkingCard>`, `<CastCarousel>` + `<CastProfile>`, overview table, disabled composer during SSE (§5.3, §6) |

## Not yet designed (optional follow-ups)
- `<BriefingEditTable>` (19-field editor, §5.4)
- `<FeatureModal>` (feature card → "what to upload / output / tip", §7)
- `<DropOverlay>` (full-screen drag-and-drop)
- Mobile/tablet variants (all current screens are DESKTOP)

To regenerate or edit: use the Stitch MCP (`generate_screen_from_text`, `edit_screens`) against the project ID above.
