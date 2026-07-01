@AGENTS.md

# MiniHire — Project Instructions

MiniHire is a mini **Applicant Tracking System (ATS)** built as a practice project for a Multica agent squad. Keep it small, clean, and runnable.

## Stack

- Framework: **Next.js 16** (App Router) — ⚠️ breaking changes vs older Next; read `node_modules/next/dist/docs/` before writing Next-specific code (see AGENTS.md).
- UI: React 19 + **Tailwind v4**
- Data: **JSON file store** at `data/candidates.json` and `data/positions.json` via helpers in `lib/db.ts` (no external DB — keep it zero-config).

## Data model

`lib/types.ts` defines:

```ts
Stage = "Applied" | "Screening" | "Interview" | "Offering" | "Negotiation" | "Hired" | "Not Proceeding"

Position = { id: string, name: string, createdAt: string }

Candidate = {
  id: string
  name: string
  position: string        // position name (not foreign key)
  stage: Stage
  email: string
  source: string          // e.g. LinkedIn, Referral, Job Portal, Walk-in
  pic: string             // recruiter / person-in-charge
  expectedSalary: string  // free text, e.g. "Rp 18jt"
  rating: number          // 1–5
  appliedAt: string       // ISO date string
  notes: string
  createdAt: string       // ISO date string
}
```

Use these types everywhere. Do not change the stage list without updating the spec.

## What to build (squad lanes)

### backend-dev
- `lib/db.ts` — add `readPositions` / `writePositions` helpers (alongside existing candidates helpers)
- `app/api/positions/route.ts` — `GET` (list all) · `POST` (create, generate id + createdAt)
- `app/api/positions/[id]/route.ts` — `DELETE` (reject with 409 if any candidate uses this position)
- `app/api/candidates/route.ts` — update `GET` to support `?position=` and `?q=` filters · update `POST` to accept all new fields, default `appliedAt` to today
- `app/api/candidates/[id]/route.ts` — update `PATCH` to accept all fields · keep `DELETE`
- Validate: `stage` must be one of 7 valid values; `rating` must be 1–5

### frontend-dev
Build `app/page.tsx` with these sections (top to bottom):

**Topbar** (left to right):
- Logo "MiniHire" (Space Grotesk bold)
- Position filter dropdown (fetch `/api/positions`, first option = "All Positions")
- Search input (filter by candidate name, client-side)
- Day/Night toggle button (saves to `localStorage` key `minihire_theme`)
- "+ Add Position" button → modal → `POST /api/positions`
- "+ Add Candidate" button → form modal → `POST /api/candidates`
- All buttons: same style — border, no fill. No yellow on buttons.

**Dashboard metrics bar** (5 cards, always yellow `#F5C518` bg + `#0A0A0A` text in both modes):
1. Total candidates (respects active position filter)
2. Screening Rate = Interview+ / Total × 100%
3. Selection Rate = Offering+ / Interview+ × 100%
4. Acceptance Rate = Hired / Offering+ × 100%
5. Avg Time to Hire = avg days from `appliedAt` to `Hired` stage (Hired candidates only)

**Kanban board** (7 columns, one per stage in order):
- Column header: stage name + count badge (yellow circle, black text)
- Candidate card: name, position, star rating (★ yellow)
- Drag & drop between columns → `PATCH` stage to backend
- Click card → candidate detail modal

**Candidate detail modal:**
- Stage badge (yellow pill), name, position, star rating
- Rows: Email · Source · PIC · Expected Salary · Applied Date · Notes
- Edit button → form mode → `PATCH` on save
- Delete button → confirm → `DELETE`, refresh board

**Add Candidate form modal:**
- Fields: Name*, Position* (dropdown), Stage (default: Applied), Email, Source, PIC, Expected Salary, Rating, Applied Date (default today), Notes
- Client-side required validation before submit

### qa
Run `npm run dev`, verify full flow:
- Add position → appears in filter dropdown
- Add candidate → appears in Applied column, metrics update
- Drag candidate to Hired → Acceptance Rate + Avg Time to Hire update
- Filter by position → board + metrics scoped correctly
- Search by name → real-time filter
- Edit + Delete candidate → board + counts update correctly
- Toggle Day/Night → all elements consistent, form inputs match theme background
- Refresh browser → theme persists (localStorage), data persists (JSON)
- `npm run build` must pass

## Brand & Design

**Palette:**
- Yellow: `#F5C518` (hover `#E2B400`)
- Black: `#0A0A0A` (soft `#1A1A1A`)
- Cream: `#FAF0E6` (soft `#F1E4D4`)

**Typography:**
- `Space Grotesk` — logo, headings, numbers, badges
- `Inter` — body, labels, inputs, buttons

**Night mode** (default): bg `#0A0A0A`, card `#1A1A1A`, text `#FAF0E6`, border `#2E2E2E`
**Day mode**: bg `#FAF0E6`, card `#FFFFFF`, text `#0A0A0A`, border `#D5C8B8`

Set `document.documentElement.style.colorScheme = 'dark' | 'light'` on mode toggle — required so browser renders native form elements (input, select) matching our theme.

Dashboard stat cards and column count badges are always yellow in both modes.

## Conventions

- Code & comments in English; communication with the user in Indonesian.
- TypeScript strict — no `any`. Keep components small.
- Verify before finishing: `npm run build` must pass.
- Never commit `data/candidates.json` or `data/positions.json` (runtime data) — gitignored.

## Agent Squad

This project is built by a Multica AI agent squad. Each agent has a defined role and must include a `Co-Authored-By` trailer in every commit message.

| Agent | Name | Role |
|---|---|---|
| pm-lead | **Jaya** | Tech lead — spec writing, delegation, final review (SHIP/NEEDS WORK/BLOCK) |
| backend-dev | **Sthira** | Backend — API, data layer, server logic |
| frontend-dev | **Cipta** | Frontend — UI, components, pages |
| qa | **Prajna** | QA — structured testing, PASS/FAIL reporting |
| designer | **Citra** | UI/UX — design spec, design system, a11y |

### Commit convention

Every agent commit must end with:

```
Co-Authored-By: Jaya <pm-lead@multica.ai>
```

Replace name and role with the agent making the commit. Example for Sthira:

```
Co-Authored-By: Sthira <backend-dev@multica.ai>
```

## Ops Squad (non-dev)

Alongside **MiniHire Dev** (the squad above), a second Multica squad — **MiniHire Ops** —
works in this same repo on the **Antigravity (Gemini)** runtime, handling anything non-code:
research, content, data analysis, and review. This proves Multica can run coding and
non-coding work in parallel, in the same project.

**Output conventions:**
- All deliverables are markdown, saved to `outputs/[topic-slug]-[YYYY-MM].md`.
- Source files (if any) go in `data/` — note this is separate from the app's runtime
  `data/candidates.json` / `data/positions.json`; don't overwrite those.
- Every output is self-contained: title, date, summary up top, sources at the bottom.
- Never fabricate data or sources. Flag uncertainty explicitly.

**Roles:**

| Role | Name | Task |
|---|---|---|
| `coordinator` | **Nayaka** | Squad leader — reads issues, delegates, doesn't do the work itself |
| `researcher` | **Lekha** | Research, fact-finding, competitor/market scans |
| `content-writer` | **Aksara** | Drafts docs, posts, copy, any written asset |
| `data-analyst` | **Ganita** | Analyzes data, computes metrics, reports |
| `reviewer` | **Waskita** | Quality gate — APPROVED / NEEDS REVISION / ESCALATE |

Commit trailer for this squad:

```
Co-Authored-By: Nayaka (AI Agent) <coordinator@multica.ai>
```

Cross-squad requests: MiniHire Dev mentions `@MiniHire Ops` (or `@Nayaka`) in an issue comment
with a short brief; Nayaka delegates internally and posts the result back as a comment + file
in `outputs/`.
