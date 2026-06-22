import { NextRequest } from "next/server";
import { readCandidates, writeCandidates } from "@/lib/db";
import { STAGES } from "@/lib/types";
import type { Stage, Candidate } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const stage = searchParams.get("stage");

  const candidates = await readCandidates();

  if (stage !== null) {
    if (!(STAGES as readonly string[]).includes(stage)) {
      return Response.json(
        { error: `Invalid stage. Must be one of: ${STAGES.join(", ")}` },
        { status: 400 }
      );
    }
    return Response.json(candidates.filter((c) => c.stage === stage));
  }

  return Response.json(candidates);
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json();

  if (
    typeof body !== "object" ||
    body === null ||
    !("name" in body) ||
    !("position" in body) ||
    !("stage" in body)
  ) {
    return Response.json(
      { error: "name, position, and stage are required" },
      { status: 400 }
    );
  }

  const { name, position, stage, notes } = body as {
    name: unknown;
    position: unknown;
    stage: unknown;
    notes?: unknown;
  };

  if (typeof name !== "string" || name.trim() === "") {
    return Response.json({ error: "name must be a non-empty string" }, { status: 400 });
  }
  if (typeof position !== "string" || position.trim() === "") {
    return Response.json({ error: "position must be a non-empty string" }, { status: 400 });
  }
  if (!(STAGES as readonly unknown[]).includes(stage)) {
    return Response.json(
      { error: `stage must be one of: ${STAGES.join(", ")}` },
      { status: 400 }
    );
  }

  const candidate: Candidate = {
    id: crypto.randomUUID(),
    name: name.trim(),
    position: position.trim(),
    stage: stage as Stage,
    notes: typeof notes === "string" ? notes : "",
    createdAt: new Date().toISOString(),
  };

  const candidates = await readCandidates();
  candidates.push(candidate);
  await writeCandidates(candidates);

  return Response.json(candidate, { status: 201 });
}
