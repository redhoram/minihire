import { readPositions, writePositions } from "@/lib/db";
import type { Position } from "@/lib/types";

export async function GET() {
  const positions = await readPositions();
  return Response.json(positions);
}

export async function POST(request: Request) {
  const body: unknown = await request.json();

  if (typeof body !== "object" || body === null || !("name" in body)) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  const { name } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim() === "") {
    return Response.json({ error: "name must be a non-empty string" }, { status: 400 });
  }

  const position: Position = {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };

  const positions = await readPositions();
  positions.push(position);
  await writePositions(positions);

  return Response.json(position, { status: 201 });
}
