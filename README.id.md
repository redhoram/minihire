# MiniHire

🌐 [Read in English](README.md)

Mini **Applicant Tracking System (ATS)** — sebuah proof of concept: bisakah squad AI agents (PM, Designer, Backend, Frontend, QA) membangun software secara end-to-end, seperti tim manusia sungguhan?

Setiap baris kode di repo ini ditulis oleh AI agents yang bekerja sebagai squad terstruktur di dalam [Multica](https://multica.ai).

## Tim Squad

| Agent | Nama | Peran |
|-------|------|-------|
| `pm-lead` | Jaya | Tech lead — spec, delegasi, final review |
| `designer` | Citra | UI/UX — design spec, design system |
| `backend-dev` | Sthira | API routes, data layer, validasi |
| `frontend-dev` | Cipta | UI components, kanban board, modal |
| `qa` | Prajna | End-to-end testing, bug report |

## Yang Dibangun

Kanban ATS dengan 7 tahap rekrutmen: **Applied → Screening → Interview → Offering → Negotiation → Hired → Not Proceeding**

**Fitur:**
- Manajemen posisi (buat, filter, hapus dengan safety check)
- CRUD kandidat dengan field profil lengkap
- Drag & drop antar tahap
- Dashboard metrik (Screening Rate, Selection Rate, Acceptance Rate, Avg Time to Hire)
- Mode Siang / Malam (tersimpan via localStorage)
- Search real-time + filter posisi

## Stack

- **Next.js 16** (App Router) · React 19 · Tailwind v4 · TypeScript strict
- JSON file store — tanpa database eksternal, zero config

## Cara Jalankan

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # type check + production build
```

## Workflow

Issue masuk → Jaya (spec + delegasi) → Citra (desain) → Sthira + Cipta (coding) → Prajna (testing) → Jaya (SHIP / NEEDS WORK / BLOCK)

Lihat [CLAUDE.md](./CLAUDE.md) untuk spec lengkap dan konvensi tim.
