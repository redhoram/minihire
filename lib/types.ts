export const STAGES = [
  "Applied",
  "Screening",
  "Interview",
  "Offering",
  "Negotiation",
  "Hired",
  "Not Proceeding",
] as const;

export type Stage = (typeof STAGES)[number];

export interface Position {
  id: string;
  name: string;
  /** ISO 8601 timestamp */
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  /** Position name (not a foreign key) */
  position: string;
  stage: Stage;
  email: string;
  source: string;
  pic: string;
  expectedSalary: string;
  /** 1–5 */
  rating: number;
  /** ISO date string */
  appliedAt: string;
  notes: string;
  /** ISO 8601 timestamp */
  createdAt: string;
  /** ISO 8601 timestamp — set when stage first transitions to "Hired" */
  hiredAt?: string;
}
