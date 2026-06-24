"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPage() {
  const router = useRouter();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const stored = localStorage.getItem("minihire_password");
    if (currentPw !== stored) {
      setError("Password saat ini tidak cocok");
      return;
    }
    if (newPw.length < 4) {
      setError("Password minimal 4 karakter");
      return;
    }
    if (newPw !== confirmPw) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);
    localStorage.setItem("minihire_password", newPw);
    localStorage.removeItem("minihire_session");
    document.cookie = "minihire_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    router.replace("/login");
  }

  const labelStyle = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--text-muted)",
    marginBottom: "0.375rem",
    fontFamily: "var(--font-inter, sans-serif)",
  } as const;

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg)" }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "0.75rem",
          padding: "2rem",
          width: "100%",
          maxWidth: "360px",
        }}
      >
        <div className="text-center mb-6">
          <span
            style={{
              fontFamily: "var(--font-space-grotesk, sans-serif)",
              fontWeight: 700,
              fontSize: "1.75rem",
              color: "#F5C518",
              letterSpacing: "-0.5px",
            }}
          >
            MiniHire
          </span>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.8125rem",
              marginTop: "0.25rem",
              fontFamily: "var(--font-inter, sans-serif)",
            }}
          >
            Ganti Password
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label htmlFor="currentPw" style={labelStyle}>
                Password Sekarang
              </label>
              <input
                id="currentPw"
                type="password"
                className="field-input"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <div>
              <label htmlFor="newPw" style={labelStyle}>
                Password Baru
              </label>
              <input
                id="newPw"
                type="password"
                className="field-input"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
                required
              />
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-inter, sans-serif)",
                  marginTop: "0.25rem",
                }}
              >
                Minimal 4 karakter
              </p>
            </div>

            <div>
              <label htmlFor="confirmPw" style={labelStyle}>
                Konfirmasi Password Baru
              </label>
              <input
                id="confirmPw"
                type="password"
                className="field-input"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <p
                role="alert"
                style={{
                  color: "#ef4444",
                  fontSize: "0.8125rem",
                  fontFamily: "var(--font-inter, sans-serif)",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-outline"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem" }}
            >
              {loading ? "Menyimpan..." : "Ganti Password"}
            </button>

            <div style={{ textAlign: "center" }}>
              <Link
                href="/login"
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-inter, sans-serif)",
                  textDecoration: "underline",
                }}
              >
                Batal, kembali ke login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
