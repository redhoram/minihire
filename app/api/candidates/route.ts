import { NextRequest } from "next/server";
import { readCandidates, writeCandidates } from "@/lib/db";
import { STAGES } from "@/lib/types";
import type { Stage, Candidate } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const stage = searchParams.get("stage");
  const position = searchParams.get("position");
  const q = searchParams.get("q");

  let candidates = await readCandidates();

  if (stage !== null) {
    if (!(STAGES as readonly string[]).includes(stage)) {
      return Response.json(
        { error: `Invalid stage. Must be one of: ${STAGES.join(", ")}` },
        { status: 400 }
      );
    }
    candidates = candidates.filter((c) => c.stage === stage);
  }

  if (position !== null && position !== "") {
    const positionLower = position.toLowerCase();
    candidates = candidates.filter((c) => c.position.toLowerCase() === positionLower);
  }

  if (q !== null && q.trim() !== "") {
    const lower = q.trim().toLowerCase();
    candidates = candidates.filter((c) => c.name.toLowerCase().includes(lower));
  }

  return Response.json(candidates);
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json();

  if (typeof body !== "object" || body === null || !("name" in body) || !("position" in body)) {
    return Response.json({ error: "name and position are required" }, { status: 400 });
  }

  const {
    name,
    position,
    stage,
    email,
    source,
    pic,
    expectedSalary,
    rating,
    appliedAt,
    notes,
  } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim() === "") {
    return Response.json({ error: "name must be a non-empty string" }, { status: 400 });
  }
  if (typeof position !== "string" || position.trim() === "") {
    return Response.json({ error: "position must be a non-empty string" }, { status: 400 });
  }

  const resolvedStage: Stage =
    stage !== undefined && (STAGES as readonly unknown[]).includes(stage)
      ? (stage as Stage)
      : "Applied";

  if (stage !== undefined && !(STAGES as readonly unknown[]).includes(stage)) {
    return Response.json(
      { error: `stage must be one of: ${STAGES.join(", ")}` },
      { status: 400 }
    );
  }

  const resolvedRating =
    typeof rating === "number" && rating >= 1 && rating <= 5 ? rating : 0;
  if (rating !== undefined && (typeof rating !== "number" || rating < 1 || rating > 5)) {
    return Response.json({ error: "rating must be a number between 1 and 5" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const now = new Date().toISOString();
  const candidate: Candidate = {
    id: crypto.randomUUID(),
    name: name.trim(),
    position: position.trim(),
    stage: resolvedStage,
    email: typeof email === "string" ? email.trim() : "",
    source: typeof source === "string" ? source.trim() : "",
    pic: typeof pic === "string" ? pic.trim() : "",
    expectedSalary: typeof expectedSalary === "string" ? expectedSalary.trim() : "",
    rating: resolvedRating,
    appliedAt: typeof appliedAt === "string" && appliedAt ? appliedAt : today,
    notes: typeof notes === "string" ? notes : "",
    createdAt: now,
    ...(resolvedStage === "Hired" ? { hiredAt: now } : {}),
  };

  const candidates = await readCandidates();
  candidates.push(candidate);
  await writeCandidates(candidates);

  return Response.json(candidate, { status: 201 });
}
