import type { TraitKey } from "@/lib/merge-results";
import type { AnalysisProfile } from "@/lib/session";

type PercentileResult = {
  topPercentLabel: string;
  comparisonLabel: string;
};

type DistributionSpec = {
  mean: number;
  deviation: number;
};

const TRAIT_DISTRIBUTIONS: Record<TraitKey, DistributionSpec> = {
  symmetry: { mean: 5.9, deviation: 1.05 },
  canthalTilt: { mean: 5.6, deviation: 1.1 },
  facialThirds: { mean: 5.8, deviation: 1.0 },
  chinProjection: { mean: 5.7, deviation: 1.15 },
  dimorphism: { mean: 5.7, deviation: 1.2 },
  jawline: { mean: 5.6, deviation: 1.2 },
  cheekbone: { mean: 5.7, deviation: 1.1 },
  skin: { mean: 5.9, deviation: 1.15 },
  hair: { mean: 5.8, deviation: 1.2 },
  browRidge: { mean: 5.7, deviation: 1.1 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function formatTopPercent(value: number): string {
  if (value >= 1) {
    return String(Math.round(value));
  }

  if (value >= 0.1) {
    return value.toFixed(1);
  }

  if (value >= 0.01) {
    return value.toFixed(2);
  }

  return value.toFixed(3);
}

// Fast approximation of the standard normal CDF for UI percentile display.
function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const absolute = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * absolute);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const erf =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t *
      Math.exp(-absolute * absolute));

  return 0.5 * (1 + sign * erf);
}

function getAgeAdjustment(
  traitKey: TraitKey,
  ageBand: AnalysisProfile["ageBand"] | undefined,
): number {
  if (!ageBand) {
    return 0;
  }

  if (traitKey === "skin") {
    if (ageBand === "35-44") return -0.15;
    if (ageBand === "45+") return -0.3;
  }

  if (traitKey === "hair") {
    if (ageBand === "35-44") return -0.12;
    if (ageBand === "45+") return -0.24;
  }

  return 0;
}

function getRubricAdjustment(
  traitKey: TraitKey,
  rubric: AnalysisProfile["rubric"] | undefined,
): number {
  if (!rubric || rubric === "universal") {
    return 0;
  }

  if (traitKey === "dimorphism") {
    return rubric === "male" ? -0.05 : 0.05;
  }

  if (traitKey === "browRidge") {
    return rubric === "male" ? -0.04 : 0.04;
  }

  return 0;
}

export function getPercentileForTrait(
  traitKey: TraitKey,
  score: number,
  profile: AnalysisProfile | null,
): PercentileResult {
  const distribution = TRAIT_DISTRIBUTIONS[traitKey];
  const adjustedMean =
    distribution.mean +
    getAgeAdjustment(traitKey, profile?.ageBand) +
    getRubricAdjustment(traitKey, profile?.rubric);
  const zScore = (score - adjustedMean) / distribution.deviation;
  const exactTopPercent = clamp(100 - normalCdf(zScore) * 100, 0.001, 99);
  const topPercentLabel = formatTopPercent(exactTopPercent);

  if (!profile) {
    return {
      topPercentLabel,
      comparisonLabel: "people overall",
    };
  }

  const rubricLabel =
    profile.rubric === "male"
      ? "men"
      : profile.rubric === "female"
        ? "women"
        : "people";

  return {
    topPercentLabel,
    comparisonLabel: `${rubricLabel} aged ${profile.ageBand}`,
  };
}
