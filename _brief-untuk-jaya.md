# Brief untuk Jaya (PM Lead) — Session Claude Code 2026-06-29

## 1. Apa yang sudah dikerjakan (bukan oleh squad)

Session ini ada beberapa fitur yang dikerjakan langsung via Claude Code (bukan Multica squad) karena squad sedang offline. Semua sudah **commit dan push ke `master`**.

### Commit yang masuk:

| Hash | Deskripsi |
|------|-----------|
| `e173a76` | feat: add POST /api/chat — server-side proxy to OpenAI and Anthropic |
| `be7ecb1` | feat: add AI chat floating panel (RED-35) |
| `6453723` | feat: add Groq as AI provider option (free tier, OpenAI-compatible) |
| `5e5bc38` | fix: make model name optional in AI settings — backend has defaults |
| `30e045e` | fix: allow empty model in chat panel config check — backend has defaults |
| `ceff6d6` | feat: inject pipeline context + HR scope into AI system prompt |

### Ringkasan fitur:
- **AI Chat panel** — floating bubble di kanan bawah, membuka panel chat
- **Multi-provider** — support OpenAI, Groq (gratis), Anthropic; config disimpan di localStorage
- **System prompt** — saat panel dibuka, fetch `/api/candidates` lalu inject data pipeline sebagai context ke AI
- **HR scope restriction** — AI hanya mau jawab soal MiniHire pipeline dan topik HR/rekrutmen
- **Settings page** — pilih provider, model (opsional, ada default), API key

### File yang diubah:
- `app/_components/chat.tsx` — komponen chat panel + floating button
- `app/api/chat/route.ts` — proxy handler ke OpenAI / Groq / Anthropic
- `app/settings/page.tsx` — AI configuration page

---

## 2. Request ke Jaya: Code Review

Tolong review semua commit di atas. Fokus pada:

1. **TypeScript** — apakah ada `any` yang lolos, type safety di response parsing
2. **Security** — API key hanya di localStorage dan dikirim server-side, tidak expose ke client log
3. **Error handling** — apakah semua edge case (network fail, invalid JSON, empty response) sudah tertangani
4. **Konsistensi** — apakah style dan konvensi sesuai dengan codebase MiniHire (font, warna, spacing)
5. **Build** — `npm run build` sudah pass, tapi konfirmasi tidak ada warning tersembunyi

Hasil review: **SHIP / NEEDS WORK / BLOCK** sesuai standar squad.

---

## 3. Insight: Fitur Selanjutnya (dengan prinsip "tetap ringan")

Ditemukan dalam session ini bahwa AI Chat lemah karena data kandidat terlalu tipis. AI hanya punya: nama, posisi, stage, rating angka, source, PIC, salary, applied date, notes satu field.

Berikut backlog yang direkomendasikan, diurutkan dari **impact tertinggi vs effort terendah**:

### Priority 1 — Data enrichment (ringan, no infra baru)

**RED-36: Skills / Tags field pada kandidat**
- Tambah field `skills: string` (comma-separated, e.g. "Python, FastAPI, SQL") ke data model
- Tampil sebagai tag pills di candidate card dan detail modal
- Impact: AI langsung bisa bandingkan kandidat secara objektif
- Effort: kecil — tambah field di type, form, dan card

**RED-37: Per-stage interview notes**
- Ganti `notes: string` (global) jadi `stageNotes: Record<Stage, string>`
- Di detail modal: tampilkan notes per stage sebagai accordion/tab
- Impact: AI bisa ceritakan journey kandidat dengan benar ("di Interview dia dinilai X, di Offering Y")
- Effort: medium — migration data + UI update

### Priority 2 — Analytics (medium effort, high value)

**RED-38: Stage timestamp history**
- Tambah `stageHistory: { stage: Stage, enteredAt: string }[]` ke Candidate
- Auto-append saat PATCH stage
- Impact: powers "sudah berapa hari di stage ini?", time-in-stage bottleneck detection, dan akurasi Avg Time to Hire
- Effort: medium — backend + tampilkan di timeline di detail modal

### Priority 3 — Attachment (perlu pertimbangan)

**RED-39: CV / Attachment upload**
- Simpan file di `/public/uploads/` atau link eksternal (Google Drive, LinkedIn URL)
- Opsi ringan: cukup field `cvUrl: string` (user paste link) — zero infra
- Opsi medium: upload ke `/api/upload`, simpan di disk lokal
- **Catatan:** jangan parsing CV otomatis — biarkan rekruter baca sendiri, AI cukup dapat summary dari notes
- Effort: tergantung opsi yang dipilih

### Yang sengaja tidak direkomendasikan (terlalu berat untuk mini ATS):
- Full CV parsing / AI screening otomatis
- Competency scoring matrix
- Email integration
- External job board sync

---

*Brief ini dibuat oleh Claude Code. Untuk diskusi lanjut, assign ke squad sesuai lane masing-masing.*
