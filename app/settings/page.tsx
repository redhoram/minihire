"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AiConfig = {
  provider: string;
  model: string;
  apiKey: string;
};

const PROVIDERS = ["OpenAI", "Groq", "Anthropic"];

export default function SettingsPage() {
  const [provider, setProvider] = useState("OpenAI");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("minihire_ai_config");
    if (saved) {
      const config: AiConfig = JSON.parse(saved);
      setProvider(config.provider ?? "OpenAI");
      setModel(config.model ?? "");
      setApiKey(config.apiKey ?? "");
    }
  }, []);

  function handleSave() {
    if (!provider || !apiKey) {
      setStatus({ type: "error", message: "Fill in all fields to save." });
      return;
    }
    localStorage.setItem("minihire_ai_config", JSON.stringify({ provider, model, apiKey }));
    setStatus({ type: "success", message: "Settings saved." });
    setTimeout(() => setStatus(null), 3000);
  }

  function handleClear() {
    if (!window.confirm("Remove AI configuration?")) return;
    localStorage.removeItem("minihire_ai_config");
    setProvider("OpenAI");
    setModel("");
    setApiKey("");
    setStatus(null);
  }

  return (
    <main
      className="min-h-screen flex items-start justify-center"
      style={{ background: "var(--bg)", paddingTop: "4rem", paddingLeft: "1rem", paddingRight: "1rem" }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "0.75rem",
          padding: "2rem",
          width: "100%",
          maxWidth: "440px",
        }}
      >
        {/* Back link */}
        <Link
          href="/"
          aria-label="Back to board"
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            textDecoration: "none",
            fontFamily: "var(--font-inter, sans-serif)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          ← Back to Board
        </Link>

        {/* Heading */}
        <h1
          style={{
            fontFamily: "var(--font-space-grotesk, sans-serif)",
            fontWeight: 700,
            fontSize: "1.5rem",
            color: "var(--text)",
            marginTop: "0.75rem",
            marginBottom: "0.25rem",
          }}
        >
          AI Configuration
        </h1>

        {/* Subtext */}
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            fontFamily: "var(--font-inter, sans-serif)",
            marginBottom: "1.25rem",
          }}
        >
          Configure the AI model used for candidate screening and recommendations.
        </p>

        {/* Divider */}
        <div style={{ borderTop: "1px solid var(--border)", marginBottom: "1.25rem" }} />

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Provider */}
          <div>
            <label
              htmlFor="provider"
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "var(--text-muted)",
                marginBottom: "0.375rem",
                fontFamily: "var(--font-inter, sans-serif)",
              }}
            >
              AI Provider
            </label>
            <select
              id="provider"
              className="field-input"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Model Name */}
          <div>
            <label
              htmlFor="model"
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "var(--text-muted)",
                marginBottom: "0.375rem",
                fontFamily: "var(--font-inter, sans-serif)",
              }}
            >
              Model Name
            </label>
            <input
              id="model"
              type="text"
              className="field-input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. llama-3.3-70b-versatile, gpt-4o, claude-sonnet-4-6"
            />
          </div>

          {/* API Key */}
          <div>
            <label
              htmlFor="apiKey"
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "var(--text-muted)",
                marginBottom: "0.375rem",
                fontFamily: "var(--font-inter, sans-serif)",
              }}
            >
              API Key
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="apiKey"
                type={showKey ? "text" : "password"}
                className="field-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-... or sk-ant-..."
                style={{ paddingRight: "3.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? "Hide API key" : "Show API key"}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  background: "transparent",
                  border: "none",
                  fontFamily: "var(--font-inter, sans-serif)",
                  padding: 0,
                }}
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>

        {/* Status message */}
        {status && (
          <p
            style={{
              fontSize: "0.8125rem",
              fontFamily: "var(--font-inter, sans-serif)",
              color: status.type === "success" ? "#22c55e" : "#ef4444",
              marginTop: "1rem",
            }}
          >
            {status.message}
          </p>
        )}

        {/* Action row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "1.25rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <button type="button" onClick={handleClear} className="btn-outline">
            Clear Config
          </button>
          <button type="button" onClick={handleSave} className="btn-outline">
            Save
          </button>
        </div>
      </div>
    </main>
  );
}
