# MiniHire

A tiny **Applicant Tracker** — practice project for a [Multica](https://multica.ai) agent squad.

One entity (`Candidate`), full CRUD, grouped by hiring stage:
**Applied → Screening → Interview → Offer → Hired**

## Stack

- Next.js 16 (App Router) · React 19 · Tailwind v4
- JSON file store (`data/candidates.json`) via `lib/db.ts` — no external DB

## Run

```bash
npm install   # already done by scaffold
npm run dev   # http://localhost:3000
npm run build # production build / type check
```

## Squad lanes

| Agent | Builds |
|-------|--------|
| `backend-dev` | REST API in `app/api/candidates/` (list + `?stage=` filter, create, update, delete) |
| `frontend-dev` | Candidate board UI grouped by stage, add/edit form, count per stage |
| `qa` | End-to-end test of the CRUD flow, bug reports |

See [CLAUDE.md](./CLAUDE.md) for the full spec and conventions.
