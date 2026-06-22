"use client";

import { useEffect, useState } from "react";
import type { Candidate, Stage } from "@/lib/types";
import { STAGES } from "@/lib/types";

type FormState = {
  name: string;
  position: string;
  stage: Stage;
  notes: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  position: "",
  stage: "Applied",
  notes: "",
};

export default function CandidateBoard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
  }, []);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(candidate: Candidate) {
    setEditing(candidate);
    setForm({
      name: candidate.name,
      position: candidate.position,
      stage: candidate.stage,
      notes: candidate.notes,
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (!form.position.trim()) {
      setFormError("Position is required");
      return;
    }
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
        setCandidates((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
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
      closeModal();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this candidate?")) return;
    try {
      const res = await fetch(`/api/candidates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete candidate");
      setCandidates((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const grouped = Object.fromEntries(
    STAGES.map((stage) => [
      stage,
      candidates.filter((c) => c.stage === stage),
    ])
  ) as Record<Stage, Candidate[]>;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">MiniHire</h1>
          <button
            onClick={openAdd}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + Add Candidate
          </button>
        </div>
      </header>

      {/* Board */}
      <main className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4" style={{ minWidth: "max-content" }}>
          {STAGES.map((stage) => {
            const cols = grouped[stage];
            return (
              <div
                key={stage}
                className="flex w-64 flex-col rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                    {stage}
                  </span>
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    {cols.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 overflow-y-auto p-3">
                  {cols.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                        {c.name}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {c.position}
                      </p>
                      {c.notes && (
                        <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500 line-clamp-2">
                          {c.notes}
                        </p>
                      )}
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-xs text-red-500 hover:underline dark:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
              {editing ? "Edit Candidate" : "Add Candidate"}
            </h2>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Name <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                  placeholder="Candidate name"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Position <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                  placeholder="e.g. Frontend Engineer"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Stage
                </span>
                <select
                  value={form.stage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stage: e.target.value as Stage }))
                  }
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Notes
                </span>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                  placeholder="Optional notes…"
                />
              </label>
            </div>

            {formError && (
              <p className="mt-2 text-sm text-red-500">{formError}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Candidate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
