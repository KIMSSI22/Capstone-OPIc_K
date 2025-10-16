// src/api/problems.ts
export type Mode = "survey" | "unexpected" | "roleplay" | "advanced" | "full15";

export interface GenerateRequest {
  mode: Mode;
  topic?: string;
  count?: number;
}

export interface Question {
  number: number;
  type: string;
  text: string;
}

export interface ProblemSet {
  topic: string;
  questions: Question[];
}

export interface GenerateResponse {
  mode: Mode | string;
  count: number;
  sets: ProblemSet[];
}

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://127.0.0.1:8000";

export async function generateProblems(
  body: GenerateRequest
): Promise<GenerateResponse> {
  const res = await fetch(`${BASE_URL}/problems/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Generate failed (${res.status}): ${errText}`);
  }
  return res.json();
}

export function previewUrl(mode: Mode) {
  const u = new URL(`${BASE_URL}/problems/preview`);
  u.searchParams.set("mode", mode);
  return u.toString();
}



export type GenerateParams = { mode: Mode; topic?: string };