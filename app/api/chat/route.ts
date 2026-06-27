import { NextRequest } from "next/server";

type Message = { role: string; content: string };

async function proxyOpenAI(model: string, apiKey: string, messages: Message[]) {
  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages }),
    });
  } catch {
    return Response.json({ error: "Failed to reach OpenAI." }, { status: 502 });
  }

  if (res.status === 401) {
    return Response.json({ error: "Invalid API key for OpenAI." }, { status: 401 });
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    const msg = (err?.error as Record<string, unknown>)?.message as string | undefined;
    return Response.json({ error: msg ?? "OpenAI request failed." }, { status: res.status });
  }

  const data = await res.json() as Record<string, unknown>;
  const choices = data?.choices as Array<{ message: { content: string } }> | undefined;
  const content: string = choices?.[0]?.message?.content ?? "";
  return Response.json({ content });
}

async function proxyAnthropic(model: string, apiKey: string, messages: Message[]) {
  const resolvedModel = model.trim() || "claude-sonnet-4-6";
  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages,
        max_tokens: 1024,
      }),
    });
  } catch {
    return Response.json({ error: "Failed to reach Anthropic." }, { status: 502 });
  }

  if (res.status === 401) {
    return Response.json({ error: "Invalid API key for Anthropic." }, { status: 401 });
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    const msg = (err?.error as Record<string, unknown>)?.message as string | undefined;
    return Response.json({ error: msg ?? "Anthropic request failed." }, { status: res.status });
  }

  const data = await res.json() as Record<string, unknown>;
  const blocks = data?.content as Array<{ type: string; text: string }> | undefined;
  const content: string = blocks?.find((b) => b.type === "text")?.text ?? "";
  return Response.json({ content });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Request body must be a JSON object" }, { status: 400 });
  }

  const { provider, model, apiKey, messages } = body as Record<string, unknown>;

  if (typeof provider !== "string" || provider.trim() === "") {
    return Response.json({ error: "provider is required" }, { status: 400 });
  }
  if (typeof apiKey !== "string" || apiKey.trim() === "") {
    return Response.json({ error: "apiKey is required" }, { status: 400 });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages must be a non-empty array" }, { status: 400 });
  }

  const resolvedModel = typeof model === "string" && model.trim() ? model.trim() : "";
  const normalizedProvider = provider.toLowerCase().trim();

  if (normalizedProvider === "openai") {
    return proxyOpenAI(resolvedModel || "gpt-4o-mini", apiKey, messages as Message[]);
  } else if (normalizedProvider === "anthropic") {
    return proxyAnthropic(resolvedModel || "claude-sonnet-4-6", apiKey, messages as Message[]);
  } else {
    return Response.json(
      { error: `Unknown provider "${provider}". Supported providers: openai, anthropic.` },
      { status: 400 }
    );
  }
}
