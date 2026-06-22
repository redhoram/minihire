import { promises as fs } from "fs";
import path from "path";
import type { Candidate } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "candidates.json");

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

/** Read all candidates from the JSON file store. */
export async function readCandidates(): Promise<Candidate[]> {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as Candidate[];
}

/** Persist the full candidate list to the JSON file store. */
export async function writeCandidates(candidates: Candidate[]): Promise<void> {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(candidates, null, 2), "utf8");
}
