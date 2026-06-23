import { readCandidates, readPositions, writePositions } from "@/lib/db";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/positions/[id]">
) {
  const { id } = await ctx.params;

  const positions = await readPositions();
  const index = positions.findIndex((p) => p.id === id);

  if (index === -1) {
    return Response.json({ error: "Position not found" }, { status: 404 });
  }

  const positionName = positions[index].name;
  const candidates = await readCandidates();
  const inUse = candidates.some((c) => c.position === positionName);

  if (inUse) {
    return Response.json(
      { error: `Position "${positionName}" is in use by one or more candidates` },
      { status: 409 }
    );
  }

  const [removed] = positions.splice(index, 1);
  await writePositions(positions);

  return Response.json(removed);
}
