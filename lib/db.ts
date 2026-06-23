import { promises as fs } from "fs";
import path from "path";
import type { Candidate, Position } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const CANDIDATES_FILE = path.join(DATA_DIR, "candidates.json");
const POSITIONS_FILE = path.join(DATA_DIR, "positions.json");

async function ensureFile(filePath: string): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "[]", "utf8");
  }
}

/** Read all candidates from the JSON file store. */
export async function readCandidates(): Promise<Candidate[]> {
  await ensureFile(CANDIDATES_FILE);
  const raw = await fs.readFile(CANDIDATES_FILE, "utf8");
  return JSON.parse(raw) as Candidate[];
}

/** Persist the full candidate list to the JSON file store. */
export async function writeCandidates(candidates: Candidate[]): Promise<void> {
  await ensureFile(CANDIDATES_FILE);
  await fs.writeFile(CANDIDATES_FILE, JSON.stringify(candidates, null, 2), "utf8");
}

/** Read all positions from the JSON file store. */
export async function readPositions(): Promise<Position[]> {
  await ensureFile(POSITIONS_FILE);
  const raw = await fs.readFile(POSITIONS_FILE, "utf8");
  return JSON.parse(raw) as Position[];
}

/** Persist the full position list to the JSON file store. */
export async function writePositions(positions: Position[]): Promise<void> {
  await ensureFile(POSITIONS_FILE);
  await fs.writeFile(POSITIONS_FILE, JSON.stringify(positions, null, 2), "utf8");
}
