"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPage() {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);

  function handleReset() {
    localStorage.removeItem("minihire_password");
    localStorage.removeItem("minihire_session");
    document.cookie = "minihire_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    router.replace("/setup");
  }

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
            Reset Password
          </p>
        </div>

        {!confirmed ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p
              style={{
                color: "var(--text)",
                fontSize: "0.875rem",
                fontFamily: "var(--font-inter, sans-serif)",
                lineHeight: 1.5,
                textAlign: "center",
              }}
            >
              Password yang tersimpan akan dihapus dan kamu perlu membuat password baru.
            </p>

            <button
              type="button"
              className="btn-outline"
              style={{ width: "100%", justifyContent: "center", borderColor: "#ef4444", color: "#ef4444" }}
              onClick={() => setConfirmed(true)}
            >
              Ya, reset password
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
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p
              style={{
                color: "var(--text)",
                fontSize: "0.875rem",
                fontFamily: "var(--font-inter, sans-serif)",
                lineHeight: 1.5,
                textAlign: "center",
              }}
            >
              Konfirmasi: kamu yakin ingin menghapus password dan keluar dari semua sesi?
            </p>

            <button
              type="button"
              className="btn-outline"
              style={{ width: "100%", justifyContent: "center", borderColor: "#ef4444", color: "#ef4444" }}
              onClick={handleReset}
            >
              Hapus & buat password baru
            </button>

            <button
              type="button"
              className="btn-outline"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => setConfirmed(false)}
            >
              Batal
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
