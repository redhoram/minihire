export const STAGES = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
] as const;

export type Stage = (typeof STAGES)[number];

export interface Candidate {
  id: string;
  name: string;
  position: string;
  stage: Stage;
  notes: string;
  /** ISO 8601 timestamp */
  createdAt: string;
}
