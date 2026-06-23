import { NextRequest } from "next/server";
import { readCandidates, writeCandidates } from "@/lib/db";
import { STAGES } from "@/lib/types";
import type { Stage } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/candidates/[id]">
) {
  const { id } = await ctx.params;
  const body: unknown = await request.json();

  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Request body must be a JSON object" }, { status: 400 });
  }

  const candidates = await readCandidates();
  const index = candidates.findIndex((c) => c.id === id);

  if (index === -1) {
    return Response.json({ error: "Candidate not found" }, { status: 404 });
  }

  const patch = body as Record<string, unknown>;

  if ("name" in patch) {
    if (typeof patch.name !== "string" || patch.name.trim() === "") {
      return Response.json({ error: "name must be a non-empty string" }, { status: 400 });
    }
    candidates[index].name = patch.name.trim();
  }

  if ("position" in patch) {
    if (typeof patch.position !== "string" || patch.position.trim() === "") {
      return Response.json({ error: "position must be a non-empty string" }, { status: 400 });
    }
    candidates[index].position = patch.position.trim();
  }

  if ("stage" in patch) {
    if (!(STAGES as readonly unknown[]).includes(patch.stage)) {
      return Response.json(
        { error: `stage must be one of: ${STAGES.join(", ")}` },
        { status: 400 }
      );
    }
    const newStage = patch.stage as Stage;
    if (newStage === "Hired" && candidates[index].stage !== "Hired") {
      candidates[index].hiredAt = new Date().toISOString();
    }
    candidates[index].stage = newStage;
  }

  if ("email" in patch) {
    if (typeof patch.email !== "string") {
      return Response.json({ error: "email must be a string" }, { status: 400 });
    }
    candidates[index].email = patch.email.trim();
  }

  if ("source" in patch) {
    if (typeof patch.source !== "string") {
      return Response.json({ error: "source must be a string" }, { status: 400 });
    }
    candidates[index].source = patch.source.trim();
  }

  if ("pic" in patch) {
    if (typeof patch.pic !== "string") {
      return Response.json({ error: "pic must be a string" }, { status: 400 });
    }
    candidates[index].pic = patch.pic.trim();
  }

  if ("expectedSalary" in patch) {
    if (typeof patch.expectedSalary !== "string") {
      return Response.json({ error: "expectedSalary must be a string" }, { status: 400 });
    }
    candidates[index].expectedSalary = patch.expectedSalary.trim();
  }

  if ("rating" in patch) {
    if (typeof patch.rating !== "number" || patch.rating < 1 || patch.rating > 5) {
      return Response.json({ error: "rating must be a number between 1 and 5" }, { status: 400 });
    }
    candidates[index].rating = patch.rating;
  }

  if ("appliedAt" in patch) {
    if (typeof patch.appliedAt !== "string" || patch.appliedAt.trim() === "") {
      return Response.json({ error: "appliedAt must be a non-empty string" }, { status: 400 });
    }
    candidates[index].appliedAt = patch.appliedAt.trim();
  }

  if ("notes" in patch) {
    if (typeof patch.notes !== "string") {
      return Response.json({ error: "notes must be a string" }, { status: 400 });
    }
    candidates[index].notes = patch.notes;
  }

  await writeCandidates(candidates);
  return Response.json(candidates[index]);
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/candidates/[id]">
) {
  const { id } = await ctx.params;

  const candidates = await readCandidates();
  const index = candidates.findIndex((c) => c.id === id);

  if (index === -1) {
    return Response.json({ error: "Candidate not found" }, { status: 404 });
  }

  const [removed] = candidates.splice(index, 1);
  await writeCandidates(candidates);

  return Response.json(removed);
}
