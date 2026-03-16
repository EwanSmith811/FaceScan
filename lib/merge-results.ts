import type { AnalysisProfile } from "@/lib/session";

export interface TraitScore {
  score: number;
  tip: string;
  label: string;
  method: "llm";
}

export type TraitKey =
  | "symmetry"
  | "canthalTilt"
  | "facialThirds"
  | "chinProjection"
  | "dimorphism"
  | "jawline"
  | "cheekbone"
  | "skin"
  | "hair"
  | "browRidge"
  ;

export type TraitMap = Record<TraitKey, TraitScore>;

export interface AnalysisResult {
  composite: number;
  traits: TraitMap;
  timestamp: number;
  profile: AnalysisProfile | null;
  qualityWarning: string | null;
  images: {
    frontBase64: string;
    sideBase64: string;
  };
}

export function computeComposite(traits: TraitMap): number {
  const weightedScore =
    traits.symmetry.score * 0.1233 +
    traits.jawline.score * 0.1233 +
    traits.cheekbone.score * 0.1133 +
    traits.chinProjection.score * 0.1033 +
    traits.facialThirds.score * 0.1033 +
    traits.canthalTilt.score * 0.05 +
    traits.dimorphism.score * 0.0933 +
    traits.browRidge.score * 0.0833 +
    traits.skin.score * 0.1033 +
    traits.hair.score * 0.1033;

  return Math.round(weightedScore * 10) / 10;
}

export function mergeResults(
  traits: TraitMap,
  images: AnalysisResult["images"],
  profile: AnalysisProfile | null,
  qualityWarning: string | null,
): AnalysisResult {
  return {
    composite: computeComposite(traits),
    traits,
    timestamp: Date.now(),
    profile,
    qualityWarning,
    images,
  };
}
