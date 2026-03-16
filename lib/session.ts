import type { AnalysisResult } from "@/lib/merge-results";

export type AnalysisRubric = "male" | "female" | "universal";
export type AnalysisAgeBand = "18-24" | "25-34" | "35-44" | "45+";

export interface AnalysisProfile {
  rubric: AnalysisRubric;
  ageBand: AnalysisAgeBand;
}

export interface ProcessingInput {
  frontBase64: string;
  sideBase64: string;
  profile: AnalysisProfile | null;
  qualityWarning: string | null;
}

const RESULT_STORAGE_KEY = "facescan_result";
const INPUT_STORAGE_KEY = "facescan_input";
let memoryInput: ProcessingInput | null = null;
let memoryResult: AnalysisResult | null = null;

export function saveInput(input: ProcessingInput): void {
  memoryInput = input;

  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(INPUT_STORAGE_KEY, JSON.stringify(input));
  } catch {
    return;
  }
}

export function saveResult(result: AnalysisResult): void {
  memoryResult = result;

  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
  } catch {
    return;
  }
}

export function loadResult(): AnalysisResult | null {
  if (memoryResult !== null) {
    return memoryResult;
  }

  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}

export function clearResult(): void {
  memoryResult = null;

  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(RESULT_STORAGE_KEY);
  } catch {
    return;
  }
}

export function loadInput(): ProcessingInput | null {
  if (memoryInput !== null) {
    return memoryInput;
  }

  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(INPUT_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as ProcessingInput;
  } catch {
    return null;
  }
}

export function clearInput(): void {
  memoryInput = null;

  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(INPUT_STORAGE_KEY);
  } catch {
    return;
  }
}
