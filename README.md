# MiniHire

🇮🇩 [Baca dalam Bahasa Indonesia](README.id.md)

A mini **Applicant Tracking System (ATS)** — a proof of concept: can a squad of AI agents (PM, Designer, Backend, Frontend, QA) build a real software project end-to-end, just like a human team?

Every line of code in this repo was written by AI agents operating as a structured squad inside [Multica](https://multica.ai).

## The Squad

| Agent | Name | Role |
|-------|------|------|
| `pm-lead` | Jaya | Tech lead — spec, delegation, final review |
| `designer` | Citra | UI/UX — design spec, design system |
| `backend-dev` | Sthira | API routes, data layer, validation |
| `frontend-dev` | Cipta | UI components, kanban board, modals |
| `qa` | Prajna | End-to-end testing, bug reports |

## What It Builds

A kanban-style ATS with 7 hiring stages: **Applied → Screening → Interview → Offering → Negotiation → Hired → Not Proceeding**

**Features:**
- Position management (create, filter, delete with safety check)
- Candidate CRUD with full profile fields
- Drag & drop between stages
- Dashboard metrics (Screening Rate, Selection Rate, Acceptance Rate, Avg Time to Hire)
- Day / Night mode (persists via localStorage)
- Real-time search + position filter

## Stack

- **Next.js 16** (App Router) · React 19 · Tailwind v4 · TypeScript strict
- JSON file store — no external DB, zero config

## Run

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # type check + production build
```

## Workflow

Issues → Jaya (spec + delegate) → Citra (design) → Sthira + Cipta (build) → Prajna (test) → Jaya (SHIP / NEEDS WORK / BLOCK)

See [CLAUDE.md](./CLAUDE.md) for the full spec and conventions.
