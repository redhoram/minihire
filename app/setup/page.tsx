"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("minihire_password")) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Password tidak boleh kosong.");
      return;
    }
    if (password.length < 4) {
      setError("Password minimal 4 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Password dan Confirm Password harus sama.");
      return;
    }

    localStorage.setItem("minihire_password", password);
    localStorage.setItem("minihire_session", "true");
    router.replace("/");
  }

  if (!ready) return null;

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
        {/* Logo */}
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
            Buat password untuk pertama kali
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  marginBottom: "0.375rem",
                  fontFamily: "var(--font-inter, sans-serif)",
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirm"
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  marginBottom: "0.375rem",
                  fontFamily: "var(--font-inter, sans-serif)",
                }}
              >
                Confirm Password
              </label>
              <input
                id="confirm"
                type="password"
                className="field-input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <p
                style={{
                  color: "#ef4444",
                  fontSize: "0.8125rem",
                  fontFamily: "var(--font-inter, sans-serif)",
                }}
              >
                {error}
              </p>
            )}

            <button type="submit" className="btn-outline" style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem" }}>
              Set Password
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
