@AGENTS.md

# MiniHire — Project Instructions

MiniHire is a tiny **Applicant Tracker** built as a practice project for a Multica agent squad.
Keep it small, clean, and runnable. One entity, full CRUD, grouped by hiring stage.

## Stack

- Framework: **Next.js 16** (App Router) — ⚠️ breaking changes vs older Next; read `node_modules/next/dist/docs/` before writing Next-specific code (see AGENTS.md).
- UI: React 19 + **Tailwind v4**
- Data: **JSON file store** at `data/candidates.json` via helpers in `lib/db.ts` (no external DB — keep it zero-config).

## Data model

`lib/types.ts` defines:

```ts
Stage = "Applied" | "Screening" | "Interview" | "Offer" | "Hired"
Candidate = { id, name, position, stage, notes, createdAt }
```

Use these types everywhere. Do not change the stage list without updating the spec.

## What to build (squad lanes)

- **backend-dev** — REST API under `app/api/candidates/`:
  - `GET /api/candidates` (optional `?stage=` filter) · `POST` (create) · `PATCH` (update) · `DELETE`
  - Use `readCandidates` / `writeCandidates` from `lib/db.ts`. Generate `id` + `createdAt` on create.
- **frontend-dev** — replace `app/page.tsx` with a candidate **board grouped by stage** (Applied → Hired), a **count per stage**, and a **form to add + edit** candidates. Fetch from `/api/candidates`.
- **qa** — run the app (`npm run dev` / `npm run build`), exercise create → list → filter → edit → delete, verify per-stage counts, and report bugs with repro steps.

## Conventions

- Code & comments in English; communication with the user in Indonesian.
- TypeScript strict — no `any`. Keep components small.
- Verify before finishing: `npm run build` must pass.
- Never commit `data/candidates.json` (runtime data) — it is gitignored.
