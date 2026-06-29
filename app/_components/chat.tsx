"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  X,
  Bot,
  Send,
  Settings,
  AlertCircle,
} from "lucide-react";

type AiConfig = { provider: string; model: string; apiKey: string };
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
};
type Candidate = {
  id: string;
  name: string;
  position: string;
  stage: string;
  rating: number;
  source: string;
  pic: string;
  expectedSalary: string;
  appliedAt: string;
  notes: string;
};

function buildSystemPrompt(candidates: Candidate[]): string {
  const stages = ["Applied","Screening","Interview","Offering","Negotiation","Hired","Not Proceeding"];
  const byStage = stages.map((s) => {
    const list = candidates.filter((c) => c.stage === s);
    if (list.length === 0) return `${s}: (none)`;
    return `${s}:\n${list.map((c) =>
      `  - ${c.name} | ${c.position} | Rating: ${c.rating}/5 | Source: ${c.source || "-"} | PIC: ${c.pic || "-"} | Salary: ${c.expectedSalary || "-"} | Applied: ${c.appliedAt?.slice(0,10) || "-"}${c.notes ? ` | Notes: ${c.notes}` : ""}`
    ).join("\n")}`;
  }).join("\n\n");

  return `You are MiniHire AI, an assistant embedded inside MiniHire — a recruitment pipeline management app.

Your role: help recruiters understand and act on their candidate pipeline. Answer ONLY questions related to:
- The candidate pipeline data below
- Recruitment, hiring, and HR best practices
- Interview strategies, offer negotiation, and talent acquisition

Refuse politely if asked anything outside HR/recruitment topics. Keep answers concise and actionable.

## Current Pipeline (${candidates.length} total candidates)

${byStage}`;
}

function readTheme(): "night" | "day" {
  return (localStorage.getItem("minihire_theme") as "night" | "day") ?? "night";
}

function readAiConfig(): AiConfig | null {
  try {
    const raw = localStorage.getItem("minihire_ai_config");
    if (!raw) return null;
    const c = JSON.parse(raw) as Partial<AiConfig>;
    if (!c.provider || !c.apiKey) return null;
    return c as AiConfig;
  } catch {
    return null;
  }
}

const NIGHT = {
  chatBg: "#F5C518",
  chatText: "#0A0A0A",
  chatTextMuted: "rgba(10,10,10,0.55)",
  chatBorder: "rgba(10,10,10,0.15)",
  bubbleUserBg: "#0A0A0A",
  bubbleUserText: "#FAF0E6",
  bubbleAiBg: "rgba(10,10,10,0.10)",
  bubbleAiText: "#0A0A0A",
  inputBg: "#0A0A0A",
  inputText: "#FAF0E6",
  sendBg: "#0A0A0A",
  sendIcon: "#F5C518",
  dotsColor: "#0A0A0A",
  floatBg: "#F5C518",
  floatIcon: "#0A0A0A",
  floatHoverBg: "#E2B400",
};

const DAY = {
  chatBg: "#0A0A0A",
  chatText: "#FAF0E6",
  chatTextMuted: "rgba(250,240,230,0.55)",
  chatBorder: "rgba(250,240,230,0.12)",
  bubbleUserBg: "#FAF0E6",
  bubbleUserText: "#0A0A0A",
  bubbleAiBg: "#1A1A1A",
  bubbleAiText: "#FAF0E6",
  inputBg: "#1A1A1A",
  inputText: "#FAF0E6",
  sendBg: "#FAF0E6",
  sendIcon: "#0A0A0A",
  dotsColor: "#FAF0E6",
  floatBg: "#0A0A0A",
  floatIcon: "#FAF0E6",
  floatHoverBg: "#1A1A1A",
};

export default function Chat() {
  const router = useRouter();

  // Panel open/close with close animation support
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const isClosing = isVisible && !isOpen;

  function openPanel() {
    setIsOpen(true);
    setIsVisible(true);
  }
  function closePanel() {
    setIsOpen(false);
    // isVisible cleared via onAnimationEnd after the close animation finishes
  }
  function togglePanel() {
    if (isOpen) closePanel();
    else openPanel();
  }

  // Theme (watches data-theme attribute changes from the board toggle)
  const [theme, setTheme] = useState<"night" | "day">("night");

  // AI config (re-read each time panel opens so config changes are reflected)
  const [aiConfig, setAiConfig] = useState<AiConfig | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [floatHovered, setFloatHovered] = useState(false);
  const [sendHovered, setSendHovered] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const t = theme === "night" ? NIGHT : DAY;

  // Mount: read theme + watch data-theme attribute mutations from board toggle
  useEffect(() => {
    setTheme(readTheme());
    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // Re-read config + fetch pipeline data every time the panel opens
  useEffect(() => {
    if (!isOpen) return;
    setAiConfig(readAiConfig());
    fetch("/api/candidates")
      .then((r) => r.json())
      .then((data: unknown) => {
        const candidates = Array.isArray(data) ? (data as Candidate[]) : [];
        setSystemPrompt(buildSystemPrompt(candidates));
      })
      .catch(() => setSystemPrompt(buildSystemPrompt([])));
  }, [isOpen]);

  // Scroll to bottom when new messages arrive or typing indicator appears
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) textareaRef.current?.focus();
  }, [isOpen]);

  // ESC closes panel (capture phase so it runs before the board's handler)
  useEffect(() => {
    if (!isOpen) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        closePanel();
      }
    }
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [isOpen]);

  // Focus trap: keep Tab cycling within the panel
  function trapFocus(e: React.KeyboardEvent) {
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = panelRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])'
    );
    const els = Array.from(nodes);
    if (els.length === 0) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // Auto-resize textarea (min 24px, max 96px)
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "24px";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || isLoading || !aiConfig) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "24px";
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiConfig.provider,
          model: aiConfig.model,
          apiKey: aiConfig.apiKey,
          system: systemPrompt,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = (await res.json()) as Record<string, unknown>;

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              (data.error as string) ??
              "Couldn't reach the AI. Check your API key in Settings.",
            error: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: (data.content as string) ?? "",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Couldn't reach the AI. Check your API key in Settings.",
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const configured = aiConfig !== null;

  return (
    <>
      <style>{`
        @keyframes minihire-chat-open {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes minihire-chat-close {
          from { transform: translateY(0);    opacity: 1; }
          to   { transform: translateY(12px); opacity: 0; }
        }
        @keyframes minihire-dot {
          0%, 100% { transform: translateY(0);   }
          50%      { transform: translateY(-3px); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes minihire-chat-open  { from { opacity: 0; } to { opacity: 1; } }
          @keyframes minihire-chat-close { from { opacity: 1; } to { opacity: 0; } }
          @keyframes minihire-dot        { 0%, 100%, 50% { transform: none; } }
        }
        .minihire-float-btn:focus-visible  { outline: 2px solid currentColor; outline-offset: 3px; }
        .minihire-close-btn:focus-visible  { outline: 2px solid currentColor; outline-offset: 2px; }
        .minihire-send-btn:focus-visible   { outline: 2px solid currentColor; outline-offset: 2px; }
        .minihire-chat-textarea::placeholder { opacity: 0.45; }
        @media (max-width: 440px) {
          .minihire-chat-panel {
            width: 100%  !important;
            right: 0     !important;
            bottom: 0    !important;
            border-radius: 16px 16px 0 0 !important;
            height: 85vh !important;
            max-height: 85vh !important;
          }
        }
      `}</style>

      {/* ── Floating trigger button ── */}
      <button
        className="minihire-float-btn"
        onClick={togglePanel}
        aria-label={isOpen ? "Close AI chat" : "Open AI chat"}
        aria-expanded={isOpen}
        onMouseEnter={() => setFloatHovered(true)}
        onMouseLeave={() => setFloatHovered(false)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 60,
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: floatHovered ? t.floatHoverBg : t.floatBg,
          color: t.floatIcon,
          transform: floatHovered ? "scale(1.04)" : "scale(1)",
          transition: "background-color 0.15s, transform 0.15s ease",
        }}
      >
        {isOpen || isClosing ? <X size={22} /> : <MessageSquare size={22} />}
      </button>

      {/* ── Chat panel ── */}
      {isVisible && (
        <div
          ref={panelRef}
          className="minihire-chat-panel"
          role="dialog"
          aria-label="AI Chat"
          aria-modal="false"
          onKeyDown={trapFocus}
          onAnimationEnd={(e) => {
            if (e.animationName === "minihire-chat-close") setIsVisible(false);
          }}
          style={{
            position: "fixed",
            bottom: "88px",
            right: "24px",
            zIndex: 60,
            width: "380px",
            height: "520px",
            maxHeight: "calc(100vh - 120px)",
            borderRadius: "16px",
            background: t.chatBg,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: isClosing
              ? "minihire-chat-close 150ms ease-in forwards"
              : "minihire-chat-open 200ms ease-out",
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              height: "56px",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px",
              borderBottom: `1px solid ${t.chatBorder}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Bot size={18} style={{ color: t.chatText }} />
              <span
                style={{
                  fontFamily: "var(--font-space-grotesk, sans-serif)",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: t.chatText,
                }}
              >
                MiniHire AI
              </span>
            </div>
            <button
              className="minihire-close-btn"
              onClick={closePanel}
              aria-label="Close chat"
              style={{
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: `1px solid ${t.chatBorder}`,
                borderRadius: "6px",
                cursor: "pointer",
                color: t.chatText,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* ── Message area ── */}
          <div
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {!configured ? (
              /* Unconfigured state */
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  textAlign: "center",
                }}
              >
                <Settings size={32} style={{ color: t.chatText, opacity: 0.5 }} />
                <p
                  style={{
                    fontFamily: "var(--font-inter, sans-serif)",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: t.chatText,
                    margin: 0,
                  }}
                >
                  AI not configured
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-inter, sans-serif)",
                    fontSize: "13px",
                    color: t.chatTextMuted,
                    margin: 0,
                    maxWidth: "240px",
                  }}
                >
                  Set up your provider, model, and API key to use this feature.
                </p>
                <button
                  onClick={() => router.push("/settings")}
                  style={{
                    fontFamily: "var(--font-inter, sans-serif)",
                    fontSize: "13px",
                    color: t.chatText,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: 0,
                    marginTop: "4px",
                  }}
                >
                  Open Settings →
                </button>
              </div>
            ) : messages.length === 0 && !isLoading ? (
              /* Empty state */
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  textAlign: "center",
                }}
              >
                <Bot size={36} style={{ color: t.chatText, opacity: 0.35 }} />
                <p
                  style={{
                    fontFamily: "var(--font-inter, sans-serif)",
                    fontSize: "14px",
                    color: t.chatText,
                    margin: 0,
                  }}
                >
                  Ask me anything about your pipeline
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-inter, sans-serif)",
                    fontSize: "13px",
                    color: t.chatTextMuted,
                    margin: 0,
                    maxWidth: "240px",
                  }}
                >
                  I can help analyze stages, compare candidates, and suggest
                  next steps.
                </p>
              </div>
            ) : (
              /* Messages list */
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent:
                        msg.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: msg.role === "user" ? "75%" : "80%",
                        padding: "10px 14px",
                        borderRadius:
                          msg.role === "user"
                            ? "12px 12px 4px 12px"
                            : "12px 12px 12px 4px",
                        background:
                          msg.role === "user"
                            ? t.bubbleUserBg
                            : t.bubbleAiBg,
                        color:
                          msg.role === "user"
                            ? t.bubbleUserText
                            : t.bubbleAiText,
                        fontFamily: "var(--font-inter, sans-serif)",
                        fontSize: "14px",
                        lineHeight: 1.6,
                        border: msg.error
                          ? "1px solid rgba(239,68,68,0.4)"
                          : "none",
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.error && (
                        <AlertCircle
                          size={16}
                          style={{
                            color: "#ef4444",
                            display: "inline",
                            marginRight: "6px",
                            verticalAlign: "text-bottom",
                          }}
                        />
                      )}
                      {msg.content}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div
                      aria-label="AI is typing"
                      style={{
                        padding: "14px 18px",
                        borderRadius: "12px 12px 12px 4px",
                        background: t.bubbleAiBg,
                        display: "flex",
                        gap: "4px",
                        alignItems: "center",
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: t.dotsColor,
                            display: "block",
                            animation: `minihire-dot 400ms ease-in-out ${i * 100}ms infinite`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* ── Input area (hidden when not configured) ── */}
          {configured && (
            <div
              style={{
                flexShrink: 0,
                borderTop: `1px solid ${t.chatBorder}`,
                background: t.inputBg,
                padding: "12px 16px",
                display: "flex",
                alignItems: "flex-end",
                gap: "12px",
              }}
            >
              <textarea
                ref={textareaRef}
                className="minihire-chat-textarea"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleTextareaKeyDown}
                placeholder="Ask about your candidates…"
                disabled={isLoading}
                rows={1}
                style={{
                  flex: 1,
                  minHeight: "24px",
                  maxHeight: "96px",
                  overflow: "hidden",
                  resize: "none",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: t.inputText,
                  WebkitTextFillColor: t.inputText,
                  fontFamily: "var(--font-inter, sans-serif)",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  opacity: isLoading ? 0.5 : 1,
                }}
              />
              <button
                className="minihire-send-btn"
                onClick={() => void sendMessage()}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                onMouseEnter={() => setSendHovered(true)}
                onMouseLeave={() => setSendHovered(false)}
                style={{
                  flexShrink: 0,
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "none",
                  background: t.sendBg,
                  color: t.sendIcon,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: !input.trim() || isLoading ? "not-allowed" : "pointer",
                  opacity: !input.trim() || isLoading ? 0.3 : sendHovered ? 0.85 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
