"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Candidate, Position, Stage } from "@/lib/types";
import { STAGES } from "@/lib/types";
import Chat from "./chat";

type FormState = {
  name: string;
  position: string;
  stage: Stage;
  email: string;
  source: string;
  pic: string;
  expectedSalary: string;
  rating: number;
  appliedAt: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  position: "",
  stage: "Applied",
  email: "",
  source: "",
  pic: "",
  expectedSalary: "",
  rating: 3,
  appliedAt: "",
  notes: "",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
      {children}
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#F5C518", fontSize: "0.875rem" }}>
      {"★".repeat(Math.max(0, Math.min(5, rating)))}
      {"☆".repeat(Math.max(0, 5 - Math.min(5, rating)))}
    </span>
  );
}

export default function CandidateBoard() {
  const router = useRouter();
  const [theme, setTheme] = useState<"night" | "day">("night");
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionFilter, setPositionFilter] = useState("");
  const [search, setSearch] = useState("");

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add / Edit Candidate modal
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Detail modal
  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null);
  const [detailEditMode, setDetailEditMode] = useState(false);
  const [detailForm, setDetailForm] = useState<FormState>(EMPTY_FORM);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailFormError, setDetailFormError] = useState<string | null>(null);

  // Add Position modal
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [positionName, setPositionName] = useState("");
  const [positionSaving, setPositionSaving] = useState(false);
  const [positionError, setPositionError] = useState<string | null>(null);
  const [positionDeleteError, setPositionDeleteError] = useState<string | null>(null);
  const [deletingPositionId, setDeletingPositionId] = useState<string | null>(null);

  // Drag & drop
  const draggingId = useRef<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("minihire_theme") as "night" | "day" | null;
    const initial = saved ?? "night";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
    document.documentElement.style.colorScheme = initial === "day" ? "light" : "dark";
  }, []);

  function toggleTheme() {
    const next = theme === "night" ? "day" : "night";
    setTheme(next);
    localStorage.setItem("minihire_theme", next);
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.style.colorScheme = next === "day" ? "light" : "dark";
  }

  function handleLogout() {
    localStorage.removeItem("minihire_session");
    document.cookie = "minihire_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    router.replace("/login");
  }

  async function loadPositions() {
    const res = await fetch("/api/positions");
    if (res.ok) {
      const data: Position[] = await res.json();
      setPositions(data);
    }
  }

  async function loadCandidates() {
    try {
      const res = await fetch("/api/candidates");
      if (!res.ok) throw new Error("Failed to load candidates");
      const data: Candidate[] = await res.json();
      setCandidates(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCandidates();
    loadPositions();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (candidateModalOpen) {
        setCandidateModalOpen(false);
        setEditing(null);
        setFormError(null);
        return;
      }
      if (positionModalOpen) { setPositionModalOpen(false); setPositionDeleteError(null); return; }
      if (detailCandidate) {
        if (detailEditMode) { setDetailEditMode(false); return; }
        setDetailCandidate(null);
        setDetailEditMode(false);
        setDetailFormError(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [candidateModalOpen, positionModalOpen, detailCandidate, detailEditMode]);

  const filtered = candidates.filter((c) => {
    if (positionFilter && c.position !== positionFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = Object.fromEntries(
    STAGES.map((stage) => [stage, filtered.filter((c) => c.stage === stage)])
  ) as Record<Stage, Candidate[]>;

  // ── Metrics ──────────────────────────────────────────────────────────────────
  const total = filtered.length;
  const interviewPlus = filtered.filter((c) =>
    ["Interview", "Offering", "Negotiation", "Hired"].includes(c.stage)
  ).length;
  const offeringPlus = filtered.filter((c) =>
    ["Offering", "Negotiation", "Hired"].includes(c.stage)
  ).length;
  const hiredCount = filtered.filter((c) => c.stage === "Hired").length;

  const screeningRate = total > 0 ? (interviewPlus / total) * 100 : 0;
  const selectionRate = interviewPlus > 0 ? (offeringPlus / interviewPlus) * 100 : 0;
  const acceptanceRate = offeringPlus > 0 ? (hiredCount / offeringPlus) * 100 : 0;

  const hiredCandidates = filtered.filter((c) => c.stage === "Hired" && c.hiredAt);
  const avgDays =
    hiredCandidates.length > 0
      ? hiredCandidates.reduce((sum, c) => {
          const applied = new Date(c.appliedAt).getTime();
          const hired = new Date(c.hiredAt!).getTime();
          return sum + Math.max(0, (hired - applied) / 86_400_000);
        }, 0) / hiredCandidates.length
      : null;

  // ── Drag & drop ─────────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, candidateId: string) {
    draggingId.current = candidateId;
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, stage: Stage) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  }

  function handleDragLeave() {
    setDragOverStage(null);
  }

  async function handleDrop(e: React.DragEvent, targetStage: Stage) {
    e.preventDefault();
    setDragOverStage(null);
    const id = draggingId.current;
    if (!id) return;
    draggingId.current = null;

    const candidate = candidates.find((c) => c.id === id);
    if (!candidate || candidate.stage === targetStage) return;

    // Optimistic update
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: targetStage } : c))
    );
    if (detailCandidate?.id === id) {
      setDetailCandidate((prev) => (prev ? { ...prev, stage: targetStage } : null));
    }

    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: targetStage }),
      });
      if (!res.ok) throw new Error("Failed to update stage");
      const updated: Candidate = await res.json();
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch {
      // Revert optimistic update
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, stage: candidate.stage } : c))
      );
    }
  }

  // ── Detail modal ─────────────────────────────────────────────────────────────

  function openDetail(c: Candidate) {
    setDetailCandidate(c);
  }

  function closeDetail() {
    setDetailCandidate(null);
    setDetailEditMode(false);
    setDetailFormError(null);
  }

  function openDetailEdit() {
    if (!detailCandidate) return;
    setDetailForm({
      name: detailCandidate.name,
      position: detailCandidate.position,
      stage: detailCandidate.stage,
      email: detailCandidate.email,
      source: detailCandidate.source,
      pic: detailCandidate.pic,
      expectedSalary: detailCandidate.expectedSalary,
      rating: detailCandidate.rating,
      appliedAt: detailCandidate.appliedAt,
      notes: detailCandidate.notes,
    });
    setDetailFormError(null);
    setDetailEditMode(true);
  }

  async function handleSaveDetailEdit() {
    if (!detailCandidate) return;
    if (!detailForm.name.trim()) { setDetailFormError("Name is required"); return; }
    if (!detailForm.position.trim()) { setDetailFormError("Position is required"); return; }
    setDetailSaving(true);
    setDetailFormError(null);
    try {
      const res = await fetch(`/api/candidates/${detailCandidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(detailForm),
      });
      if (!res.ok) throw new Error("Failed to update candidate");
      const updated: Candidate = await res.json();
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setDetailCandidate(updated);
      setDetailEditMode(false);
    } catch (e) {
      setDetailFormError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setDetailSaving(false);
    }
  }

  async function handleDeleteFromDetail(id: string) {
    if (!confirm("Delete this candidate?")) return;
    try {
      const res = await fetch(`/api/candidates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete candidate");
      setCandidates((prev) => prev.filter((c) => c.id !== id));
      closeDetail();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  // ── Candidate modal ──────────────────────────────────────────────────────────

  function openAdd() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      appliedAt: new Date().toISOString().split("T")[0],
    });
    setFormError(null);
    setCandidateModalOpen(true);
  }

  function openEdit(candidate: Candidate) {
    setEditing(candidate);
    setForm({
      name: candidate.name,
      position: candidate.position,
      stage: candidate.stage,
      email: candidate.email,
      source: candidate.source,
      pic: candidate.pic,
      expectedSalary: candidate.expectedSalary,
      rating: candidate.rating,
      appliedAt: candidate.appliedAt,
      notes: candidate.notes,
    });
    setFormError(null);
    setCandidateModalOpen(true);
  }

  function closeCandidateModal() {
    setCandidateModalOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function handleSave() {
    if (!form.name.trim()) { setFormError("Name is required"); return; }
    if (!form.position.trim()) { setFormError("Position is required"); return; }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        const res = await fetch(`/api/candidates/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to update candidate");
        const updated: Candidate = await res.json();
        setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const res = await fetch("/api/candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to create candidate");
        const created: Candidate = await res.json();
        setCandidates((prev) => [...prev, created]);
      }
      closeCandidateModal();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  // ── Position modal ───────────────────────────────────────────────────────────

  function openAddPosition() {
    setPositionName("");
    setPositionError(null);
    setPositionDeleteError(null);
    setPositionModalOpen(true);
  }

  async function handleSavePosition() {
    if (!positionName.trim()) { setPositionError("Position name is required"); return; }
    setPositionSaving(true);
    setPositionError(null);
    try {
      const res = await fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: positionName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create position");
      const created: Position = await res.json();
      setPositions((prev) => [...prev, created]);
      setPositionName("");
    } catch (e) {
      setPositionError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setPositionSaving(false);
    }
  }

  async function handleDeletePosition(id: string) {
    setDeletingPositionId(id);
    setPositionDeleteError(null);
    try {
      const res = await fetch(`/api/positions/${id}`, { method: "DELETE" });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Cannot delete: position has candidates");
      }
      if (!res.ok) throw new Error("Failed to delete position");
      setPositions((prev) => prev.filter((p) => p.id !== id));
      if (positionFilter === positions.find((p) => p.id === id)?.name) {
        setPositionFilter("");
      }
    } catch (e) {
      setPositionDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingPositionId(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* ── Topbar ── */}
      <header
        className="border-b px-6 py-3"
        style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
      >
        <div className="flex flex-wrap items-center gap-3">

          {/* Logo */}
          <span
            className="text-xl font-bold select-none"
            style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", color: "var(--text)" }}
          >
            MiniHire
          </span>

          {/* Position filter */}
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="field-input"
            style={{ width: "auto", minWidth: "9rem" }}
          >
            <option value="">All Positions</option>
            {positions.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search candidates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input"
            style={{ width: "auto", minWidth: "12rem", flex: "1 1 12rem", maxWidth: "24rem" }}
          />

          {/* Push buttons to the right */}
          <div style={{ flex: 1 }} />

          {/* Theme toggle */}
          <button onClick={toggleTheme} className="btn-outline">
            {theme === "night" ? "☀ Day" : "☽ Night"}
          </button>

          {/* Settings */}
          <button onClick={() => router.push("/settings")} className="btn-outline">
            Settings
          </button>

          {/* Logout */}
          <button onClick={handleLogout} className="btn-outline">
            Logout
          </button>

          {/* Add Position */}
          <button onClick={openAddPosition} className="btn-outline">
            + Add Position
          </button>

          {/* Add Candidate */}
          <button onClick={openAdd} className="btn-outline">
            + Add Candidate
          </button>

        </div>
      </header>

      {/* ── Metrics bar ── */}
      <section className="border-b px-6 py-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex flex-wrap gap-3">
          {[
            {
              label: "Total Candidates",
              value: String(total),
            },
            {
              label: "Screening Rate",
              value: `${screeningRate.toFixed(1)}%`,
              sub: "Interview+ / Total",
            },
            {
              label: "Selection Rate",
              value: `${selectionRate.toFixed(1)}%`,
              sub: "Offering+ / Interview+",
            },
            {
              label: "Acceptance Rate",
              value: `${acceptanceRate.toFixed(1)}%`,
              sub: "Hired / Offering+",
            },
            {
              label: "Avg Time to Hire",
              value: avgDays !== null ? `${avgDays.toFixed(1)}d` : "—",
              sub: "Hired candidates only",
            },
          ].map(({ label, value, sub }) => (
            <div
              key={label}
              className="flex min-w-[140px] flex-1 flex-col rounded-lg px-5 py-4"
              style={{ background: "#F5C518", color: "#0A0A0A" }}
            >
              <span
                className="text-2xl font-bold leading-none"
                style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
              >
                {value}
              </span>
              <span
                className="mt-1.5 text-sm font-semibold"
                style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
              >
                {label}
              </span>
              {sub && (
                <span className="mt-0.5 text-xs opacity-70" style={{ fontFamily: "var(--font-inter, sans-serif)" }}>
                  {sub}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Board ── */}
      <main className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4" style={{ minWidth: "max-content" }}>
          {STAGES.map((stage) => {
            const cols = grouped[stage];
            const isOver = dragOverStage === stage;
            return (
              <div
                key={stage}
                className="flex w-64 flex-col rounded-lg border"
                style={{
                  borderColor: isOver ? "#F5C518" : "var(--border)",
                  background: isOver ? "var(--bg)" : "var(--bg-card)",
                  transition: "border-color 0.15s, background 0.15s",
                  minHeight: "200px",
                }}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <span
                    className="text-sm font-semibold"
                    style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", color: "var(--text)" }}
                  >
                    {stage}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-bold"
                    style={{ background: "#F5C518", color: "#0A0A0A", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
                  >
                    {cols.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 overflow-y-auto p-3">
                  {cols.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-md border p-3 shadow-sm"
                      draggable
                      onDragStart={(e) => handleDragStart(e, c.id)}
                      onClick={() => openDetail(c)}
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-card)",
                        cursor: "grab",
                        userSelect: "none",
                      }}
                    >
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {c.name}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        {c.position}
                      </p>
                      {c.rating > 0 && (
                        <p className="mt-1">
                          <StarRating rating={c.rating} />
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── Candidate Detail Modal ── */}
      {detailCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) closeDetail(); }}
        >
          <div
            className="w-full max-w-md rounded-xl border p-6 shadow-xl overflow-y-auto"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", maxHeight: "90vh" }}
          >
            {detailEditMode ? (
              /* ── Edit mode ── */
              <>
                <h2
                  className="mb-4 text-lg font-semibold"
                  style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", color: "var(--text)" }}
                >
                  Edit Candidate
                </h2>

                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1">
                    <FieldLabel>Name <span className="text-red-500">*</span></FieldLabel>
                    <input
                      type="text"
                      value={detailForm.name}
                      onChange={(e) => setDetailForm((f) => ({ ...f, name: e.target.value }))}
                      className="field-input"
                      placeholder="Candidate name"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <FieldLabel>Position <span className="text-red-500">*</span></FieldLabel>
                    {positions.length > 0 ? (
                      <select
                        value={detailForm.position}
                        onChange={(e) => setDetailForm((f) => ({ ...f, position: e.target.value }))}
                        className="field-input"
                      >
                        <option value="">Select position…</option>
                        {positions.map((p) => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <select disabled className="field-input" style={{ opacity: 0.5, cursor: "not-allowed" }}>
                          <option>No positions available</option>
                        </select>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          No positions yet.{" "}
                          <button
                            type="button"
                            onClick={openAddPosition}
                            className="underline"
                            style={{ color: "#F5C518" }}
                          >
                            Create a position first
                          </button>
                        </p>
                      </div>
                    )}
                  </label>

                  <label className="flex flex-col gap-1">
                    <FieldLabel>Stage</FieldLabel>
                    <select
                      value={detailForm.stage}
                      onChange={(e) => setDetailForm((f) => ({ ...f, stage: e.target.value as Stage }))}
                      className="field-input"
                    >
                      {STAGES.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <FieldLabel>Email</FieldLabel>
                    <input
                      type="email"
                      value={detailForm.email}
                      onChange={(e) => setDetailForm((f) => ({ ...f, email: e.target.value }))}
                      className="field-input"
                      placeholder="email@example.com"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <FieldLabel>Source</FieldLabel>
                    <input
                      type="text"
                      value={detailForm.source}
                      onChange={(e) => setDetailForm((f) => ({ ...f, source: e.target.value }))}
                      className="field-input"
                      placeholder="e.g. LinkedIn, Referral"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <FieldLabel>PIC (Recruiter)</FieldLabel>
                    <input
                      type="text"
                      value={detailForm.pic}
                      onChange={(e) => setDetailForm((f) => ({ ...f, pic: e.target.value }))}
                      className="field-input"
                      placeholder="Recruiter name"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <FieldLabel>Expected Salary</FieldLabel>
                    <input
                      type="text"
                      value={detailForm.expectedSalary}
                      onChange={(e) => setDetailForm((f) => ({ ...f, expectedSalary: e.target.value }))}
                      className="field-input"
                      placeholder="e.g. Rp 18jt"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <FieldLabel>Rating (1–5)</FieldLabel>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={detailForm.rating}
                      onChange={(e) => setDetailForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                      className="field-input"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <FieldLabel>Applied Date</FieldLabel>
                    <input
                      type="date"
                      value={detailForm.appliedAt}
                      onChange={(e) => setDetailForm((f) => ({ ...f, appliedAt: e.target.value }))}
                      className="field-input"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <FieldLabel>Notes</FieldLabel>
                    <textarea
                      value={detailForm.notes}
                      onChange={(e) => setDetailForm((f) => ({ ...f, notes: e.target.value }))}
                      rows={3}
                      className="field-input resize-none"
                      placeholder="Optional notes…"
                    />
                  </label>
                </div>

                {detailFormError && <p className="mt-2 text-sm text-red-500">{detailFormError}</p>}

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setDetailEditMode(false)}
                    disabled={detailSaving}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDetailEdit}
                    disabled={detailSaving}
                    className="btn-outline"
                  >
                    {detailSaving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </>
            ) : (
              /* ── View mode ── */
              <>
                {/* Stage badge */}
                <div className="mb-3">
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
                    style={{ background: "#F5C518", color: "#0A0A0A", fontFamily: "var(--font-space-grotesk, sans-serif)" }}
                  >
                    {detailCandidate.stage}
                  </span>
                </div>

                {/* Name */}
                <h2
                  className="text-xl font-bold"
                  style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", color: "var(--text)" }}
                >
                  {detailCandidate.name}
                </h2>

                {/* Position */}
                <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  {detailCandidate.position}
                </p>

                {/* Star rating */}
                {detailCandidate.rating > 0 && (
                  <p className="mt-2">
                    <StarRating rating={detailCandidate.rating} />
                  </p>
                )}

                {/* Detail rows */}
                <div className="mt-5 flex flex-col gap-2.5">
                  {(
                    [
                      ["Email", detailCandidate.email],
                      ["Source", detailCandidate.source],
                      ["PIC", detailCandidate.pic],
                      ["Expected Salary", detailCandidate.expectedSalary],
                      ["Applied Date", detailCandidate.appliedAt],
                      ["Notes", detailCandidate.notes],
                    ] as [string, string][]
                  )
                    .filter(([, v]) => v)
                    .map(([label, value]) => (
                      <div key={label} className="flex gap-3 text-sm">
                        <span
                          className="w-32 flex-shrink-0 text-xs font-medium"
                          style={{ color: "var(--text-muted)", paddingTop: "1px" }}
                        >
                          {label}
                        </span>
                        <span className="text-sm" style={{ color: "var(--text)", wordBreak: "break-word" }}>
                          {value}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={() => handleDeleteFromDetail(detailCandidate.id)}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                  <div className="flex gap-2">
                    <button onClick={closeDetail} className="btn-outline">
                      Close
                    </button>
                    <button onClick={openDetailEdit} className="btn-outline">
                      Edit
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Add / Edit Candidate Modal ── */}
      {candidateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) closeCandidateModal(); }}
        >
          <div
            className="w-full max-w-md rounded-xl border p-6 shadow-xl overflow-y-auto"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", maxHeight: "90vh" }}
          >
            <h2
              className="mb-4 text-lg font-semibold"
              style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", color: "var(--text)" }}
            >
              {editing ? "Edit Candidate" : "Add Candidate"}
            </h2>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <FieldLabel>Name <span className="text-red-500">*</span></FieldLabel>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="field-input"
                  placeholder="Candidate name"
                />
              </label>

              <label className="flex flex-col gap-1">
                <FieldLabel>Position <span className="text-red-500">*</span></FieldLabel>
                {positions.length > 0 ? (
                  <select
                    value={form.position}
                    onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                    className="field-input"
                  >
                    <option value="">Select position…</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex flex-col gap-1">
                    <select disabled className="field-input" style={{ opacity: 0.5, cursor: "not-allowed" }}>
                      <option>No positions available</option>
                    </select>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      No positions yet.{" "}
                      <button
                        type="button"
                        onClick={openAddPosition}
                        className="underline"
                        style={{ color: "#F5C518" }}
                      >
                        Create a position first
                      </button>
                    </p>
                  </div>
                )}
              </label>

              <label className="flex flex-col gap-1">
                <FieldLabel>Stage</FieldLabel>
                <select
                  value={form.stage}
                  onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value as Stage }))}
                  className="field-input"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <FieldLabel>Email</FieldLabel>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="field-input"
                  placeholder="email@example.com"
                />
              </label>

              <label className="flex flex-col gap-1">
                <FieldLabel>Source</FieldLabel>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                  className="field-input"
                  placeholder="e.g. LinkedIn, Referral"
                />
              </label>

              <label className="flex flex-col gap-1">
                <FieldLabel>PIC (Recruiter)</FieldLabel>
                <input
                  type="text"
                  value={form.pic}
                  onChange={(e) => setForm((f) => ({ ...f, pic: e.target.value }))}
                  className="field-input"
                  placeholder="Recruiter name"
                />
              </label>

              <label className="flex flex-col gap-1">
                <FieldLabel>Expected Salary</FieldLabel>
                <input
                  type="text"
                  value={form.expectedSalary}
                  onChange={(e) => setForm((f) => ({ ...f, expectedSalary: e.target.value }))}
                  className="field-input"
                  placeholder="e.g. Rp 18jt"
                />
              </label>

              <label className="flex flex-col gap-1">
                <FieldLabel>Rating (1–5)</FieldLabel>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.rating}
                  onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                  className="field-input"
                />
              </label>

              <label className="flex flex-col gap-1">
                <FieldLabel>Applied Date</FieldLabel>
                <input
                  type="date"
                  value={form.appliedAt}
                  onChange={(e) => setForm((f) => ({ ...f, appliedAt: e.target.value }))}
                  className="field-input"
                />
              </label>

              <label className="flex flex-col gap-1">
                <FieldLabel>Notes</FieldLabel>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="field-input resize-none"
                  placeholder="Optional notes…"
                />
              </label>
            </div>

            {formError && <p className="mt-2 text-sm text-red-500">{formError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={closeCandidateModal} disabled={saving} className="btn-outline">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-outline">
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Candidate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Chat ── */}
      <Chat />

      {/* ── Manage Positions Modal ── */}
      {positionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) setPositionModalOpen(false); }}
        >
          <div
            className="w-full max-w-sm rounded-xl border p-6 shadow-xl"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <h2
              className="mb-4 text-lg font-semibold"
              style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", color: "var(--text)" }}
            >
              Manage Positions
            </h2>

            {/* Existing positions list */}
            {positions.length > 0 && (
              <div className="mb-4">
                <FieldLabel>Existing Positions</FieldLabel>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {positions.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      style={{ borderColor: "var(--border)", background: "var(--bg)" }}
                    >
                      <span style={{ color: "var(--text)" }}>{p.name}</span>
                      <button
                        onClick={() => handleDeletePosition(p.id)}
                        disabled={deletingPositionId === p.id}
                        className="ml-2 text-xs text-red-500 hover:underline disabled:opacity-50"
                      >
                        {deletingPositionId === p.id ? "…" : "Delete"}
                      </button>
                    </li>
                  ))}
                </ul>
                {positionDeleteError && (
                  <p className="mt-1.5 text-xs text-red-500">{positionDeleteError}</p>
                )}
              </div>
            )}

            {/* Add new position */}
            <label className="flex flex-col gap-1">
              <FieldLabel>New Position Name <span className="text-red-500">*</span></FieldLabel>
              <input
                type="text"
                value={positionName}
                onChange={(e) => setPositionName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSavePosition()}
                className="field-input"
                placeholder="e.g. Frontend Engineer"
                autoFocus
              />
            </label>

            {positionError && <p className="mt-2 text-sm text-red-500">{positionError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setPositionModalOpen(false)}
                disabled={positionSaving}
                className="btn-outline"
              >
                Close
              </button>
              <button
                onClick={handleSavePosition}
                disabled={positionSaving || !positionName.trim()}
                className="btn-outline"
              >
                {positionSaving ? "Saving…" : "Add Position"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
