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
  images: {
    frontBase64: string;
    sideBase64: string;
  };
}

export function computeComposite(traits: TraitMap): number {
  const scores = Object.values(traits).map((trait) => trait.score);
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  return Math.round(mean * 10) / 10;
}

export function mergeResults(
  traits: TraitMap,
  images: AnalysisResult["images"],
): AnalysisResult {
  return {
    composite: computeComposite(traits),
    traits,
    timestamp: Date.now(),
    images,
  };
}
