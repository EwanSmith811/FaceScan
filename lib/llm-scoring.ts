import type { TraitKey, TraitMap, TraitScore } from "@/lib/merge-results";
import type { AnalysisProfile } from "@/lib/session";

const TRAIT_METADATA: Record<TraitKey, Pick<TraitScore, "label" | "method">> = {
  symmetry: { label: "Facial Symmetry", method: "llm" },
  canthalTilt: { label: "Canthal Tilt", method: "llm" },
  facialThirds: { label: "Facial Thirds Harmony", method: "llm" },
  chinProjection: { label: "Chin Projection", method: "llm" },
  dimorphism: { label: "Facial Dimorphism", method: "llm" },
  jawline: { label: "Jawline Definition", method: "llm" },
  cheekbone: { label: "Cheekbone Prominence", method: "llm" },
  skin: { label: "Skin Clarity", method: "llm" },
  hair: { label: "Hair Quality", method: "llm" },
  browRidge: { label: "Brow Ridge & Eye Area", method: "llm" },
};

const FALLBACK_TIP =
  "Use even lighting and a relaxed, natural pose for a steadier read next time.";

const SCORE_SPREAD_MULTIPLIER = 1.35;
const CONFIDENCE_BASELINE = 0.55;
const CONFIDENCE_NEUTRAL_SCORE = 5.7;

const BASE_SYSTEM_PROMPT = `You are a careful facial feature reviewer for a consumer appearance app.
You will receive two photos of the same person: one front-facing and one side profile.
Evaluate exactly these 10 traits:
symmetry, canthalTilt, facialThirds, chinProjection, dimorphism, jawline, cheekbone, skin, hair, browRidge.

Return ONLY valid JSON and match this schema exactly:
{
  "symmetry": { "score": number, "confidence": number, "reason": string, "tip": string },
  "canthalTilt": { "score": number, "confidence": number, "reason": string, "tip": string },
  "facialThirds": { "score": number, "confidence": number, "reason": string, "tip": string },
  "chinProjection": { "score": number, "confidence": number, "reason": string, "tip": string },
  "dimorphism": { "score": number, "confidence": number, "reason": string, "tip": string },
  "jawline": { "score": number, "confidence": number, "reason": string, "tip": string },
  "cheekbone": { "score": number, "confidence": number, "reason": string, "tip": string },
  "skin": { "score": number, "confidence": number, "reason": string, "tip": string },
  "hair": { "score": number, "confidence": number, "reason": string, "tip": string },
  "browRidge": { "score": number, "confidence": number, "reason": string, "tip": string },
}

Scoring guidance:
- Use a 1.0 to 10.0 scale with one decimal place.
- Use true tenth-place variation when justified. Do not round most scores to whole numbers or ".5".
- Do not treat 6.5 to 7.0 as a safe default range. Use the full scale when the evidence supports it.
- Score each trait independently. Do not let a generally good or generally weak face drag the other traits toward the same score.
- Use meaningful variation when the photos support it. A visibly weak trait should stand out as weak relative to the others.
- Reward clearly strong traits highly when the photo clearly supports it, even if the overall face has some weaknesses.
- Be stricter about genuinely weak structure and more generous about genuinely strong structure.
- Do not be reluctant to place clearly elite traits in the 8.3 to 9.5 range.
- If multiple visible cues strongly support a trait, score it aggressively rather than keeping it near 7 by default.
- Ignore small asymmetries, normal variation, minor camera distortion, and mild lighting flaws.
- If the photos are imperfect, avoid overconfidence, but do not force every score back to the middle.
- Compare each trait to a broad population standard for that specific trait, not to the subject's overall appearance.
- Use these anchors:
  1.0-2.9 = severely weak for that trait
  3.0-4.4 = clearly below average
  4.5-5.9 = average to mildly below average
  6.0-6.9 = above average
  7.0-8.4 = clearly strong
  8.5-10.0 = exceptional or rare
- Jawline should reflect mandibular definition, gonial angle clarity, lower-face structure, and neck-jaw separation.
- Strong and sepereated jawlines should score extremely well, and less visible, blended, or weak jawlines should score progressively lower.
- Cheekbone should reflect prominence, width contribution, and visible projection rather than overall leanness alone.
- ChinProjection should rely heavily on the side profile.
- Skin should reflect visible clarity, smoothness, and evenness of complexion as best as the photos allow.
- If the skin has no visible flaws and looks clear and healthy, it can score very highly even if the person has other weaknesses.
- Hair should reflect thickness, density, grooming, and healthy-looking texture. Thick, luscious, non-oily hair scores higher.
- Intentionally bald, closely shaved, or cleanly buzzed hair can still score well and should not be penalized just for being bald.
- Visible male pattern baldness, recession, or thinning should severely reduce the hair score when clearly present.
- Dimorphism is a reliable trait here. Evaluate it confidently from visible brow, orbital area, jaw, chin, and overall facial sexual dimorphism markers.
- For dimorphism, do not lazily proxy from overall attractiveness, body fat, hairstyle, or grooming alone.
- Judge dimorphism relative to the selected rubric, using visible bone structure and sexually dimorphic facial proportions first.
- Confidence must be 0.0 to 1.0 and reflect how clearly the photos support that specific trait score.
- Lower confidence when the trait is obscured by angle, zoom, focal distortion, lighting, facial hair, hairstyle, or expression.
- Reason must be brief, concrete, and visual. Describe the evidence, not general attractiveness.
- Tips must be supportive, practical, and under 18 words.
- Never use insulting or shaming language.`;

const STRUCTURAL_AUDIT_PROMPT = `You are performing a second-pass structural audit for a consumer appearance app.
You will receive two photos of the same person: one front-facing and one side profile.
Evaluate exactly these 10 traits again and return the same JSON schema, but this pass should prioritize structural accuracy and calibration.

Priority traits for this pass:
symmetry, jawline, cheekbone, chinProjection, facialThirds, dimorphism, canthalTilt, browRidge.

Return ONLY valid JSON and match this schema exactly:
{
  "symmetry": { "score": number, "confidence": number, "reason": string, "tip": string },
  "canthalTilt": { "score": number, "confidence": number, "reason": string, "tip": string },
  "facialThirds": { "score": number, "confidence": number, "reason": string, "tip": string },
  "chinProjection": { "score": number, "confidence": number, "reason": string, "tip": string },
  "dimorphism": { "score": number, "confidence": number, "reason": string, "tip": string },
  "jawline": { "score": number, "confidence": number, "reason": string, "tip": string },
  "cheekbone": { "score": number, "confidence": number, "reason": string, "tip": string },
  "skin": { "score": number, "confidence": number, "reason": string, "tip": string },
  "hair": { "score": number, "confidence": number, "reason": string, "tip": string },
  "browRidge": { "score": number, "confidence": number, "reason": string, "tip": string }
}

Audit guidance:
- Re-score every trait independently from visible evidence.
- For structural traits, do not settle near 7 if the photos clearly support stronger structure.
- Use the side profile heavily for chinProjection and lower-face structure.
- Dimorphism is a reliable trait here. Judge it confidently from brow, orbital area, chin, jaw, and overall sexually dimorphic structure.
- For dimorphism, separate actual sexually dimorphic structure from styling, camera angle, and soft-tissue presentation.
- Penalize a structural trait only when the photo clearly shows weakness. Do not infer weakness from lighting alone.
- Reward clearly elite structure aggressively when multiple visible cues support it.
- Skin and hair still matter, but this pass is primarily checking structural calibration and correcting underrating.
- Confidence must reflect visibility of the specific trait, not your overall certainty about the face.
- Reason must stay concrete and visual.
- Tips must be supportive, practical, and under 18 words.
- Never use insulting or shaming language.`;

function buildProfileCalibration(profile: AnalysisProfile | null): string {
  if (profile === null) {
    return "No optional rubric or age calibration was provided. Use a broad general-adult standard.";
  }

  const rubricLine =
    profile.rubric === "male"
      ? "Use a male facial standard for dimorphism, brow ridge, jaw, cheekbone, and chin interpretation."
      : profile.rubric === "female"
        ? "Use a female facial standard for dimorphism, brow ridge, jaw, cheekbone, and chin interpretation."
        : "Use a universal facial standard and avoid sex-specific assumptions unless a trait is visually obvious.";

  const ageLine = `The user selected age range ${profile.ageBand}. Use this only for calibration of expected skin, hair, and maturity-related facial presentation. Do not award free points or impose penalties simply because of age.`;

  return `${rubricLine} ${ageLine}`;
}

function clamp(value: number, min = 1, max = 10): number {
  return Math.round(Math.max(min, Math.min(max, value)) * 10) / 10;
}

function expandScoreSpread(score: number): number {
  const center = 6;
  const distance = score - center;
  const amplified = center + distance * SCORE_SPREAD_MULTIPLIER;
  return clamp(amplified);
}

function normalizeScore(rawScore: unknown): number {
  const numeric = Number(rawScore);
  const bounded = Number.isFinite(numeric) ? clamp(numeric) : 6;
  return expandScoreSpread(bounded);
}

function normalizeTip(value: unknown): string {
  if (typeof value !== "string") {
    return FALLBACK_TIP;
  }

  const trimmed = value.trim();
  return trimmed || FALLBACK_TIP;
}

function normalizeConfidence(value: unknown): number {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0.82;
  }

  return Math.max(0, Math.min(1, numeric));
}

function confidenceAdjustedScore(score: number, confidence: number): number {
  const effectiveConfidence =
    CONFIDENCE_BASELINE + confidence * (1 - CONFIDENCE_BASELINE);
  const adjusted =
    score * effectiveConfidence +
    CONFIDENCE_NEUTRAL_SCORE * (1 - effectiveConfidence);
  return clamp(adjusted);
}

function stripMarkdownFences(value: string): string {
  const trimmed = value.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractMessageText(payload: unknown): string {
  const root = payload as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ text?: string }>;
      };
    }>;
  };
  const content = root.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content.map((item) => item.text ?? "").join("\n").trim();
  }

  return "";
}

function normalizeTraitMap(input: unknown): TraitMap {
  const source = (input ?? {}) as Record<string, unknown>;

  const buildTrait = (key: TraitKey): TraitScore => {
    const rawTrait = (source[key] ?? {}) as Record<string, unknown>;
    const normalizedBaseScore = normalizeScore(rawTrait.score);
    const confidence = normalizeConfidence(rawTrait.confidence);

    return {
      score: confidenceAdjustedScore(normalizedBaseScore, confidence),
      tip: normalizeTip(rawTrait.tip),
      ...TRAIT_METADATA[key],
    };
  };

  return {
    symmetry: buildTrait("symmetry"),
    canthalTilt: buildTrait("canthalTilt"),
    facialThirds: buildTrait("facialThirds"),
    chinProjection: buildTrait("chinProjection"),
    dimorphism: buildTrait("dimorphism"),
    jawline: buildTrait("jawline"),
    cheekbone: buildTrait("cheekbone"),
    skin: buildTrait("skin"),
    hair: buildTrait("hair"),
    browRidge: buildTrait("browRidge"),
  };
}

async function scoreSinglePass(
  apiKey: string,
  systemPrompt: string,
  instructionText: string,
  profile: AnalysisProfile | null,
  frontImageBase64: string,
  sideImageBase64: string,
): Promise<TraitMap> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${instructionText}\n\nCalibration context:\n${buildProfileCalibration(profile)}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${frontImageBase64}`,
              },
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${sideImageBase64}`,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "OpenAI analysis failed");
  }

  const payload = (await response.json()) as unknown;
  const text = stripMarkdownFences(extractMessageText(payload));
  const parsed = JSON.parse(text) as unknown;

  return normalizeTraitMap(parsed);
}

function aggregateTraitMaps(passes: TraitMap[]): TraitMap {
  const [basePass, structuralPass] = passes;
  const keys = Object.keys(TRAIT_METADATA) as TraitKey[];
  const structuralWeights: Partial<Record<TraitKey, number>> = {
    symmetry: 0.65,
    jawline: 0.7,
    cheekbone: 0.7,
    chinProjection: 0.72,
    facialThirds: 0.65,
    dimorphism: 0.68,
    canthalTilt: 0.62,
    browRidge: 0.6,
    skin: 0.35,
    hair: 0.35,
  };

  return Object.fromEntries(
    keys.map((key) => {
      const auditWeight = structuralWeights[key] ?? 0.5;
      const baseWeight = 1 - auditWeight;
      const traitScores = [basePass[key].score, structuralPass[key].score];
      const aggregateScore = clamp(
        basePass[key].score * baseWeight +
          structuralPass[key].score * auditWeight +
          Math.max(...traitScores) * 0.08 -
          Math.min(...traitScores) * 0.03,
      );
      const sourceTip =
        auditWeight >= 0.5 ? structuralPass[key].tip : basePass[key].tip;

      return [
        key,
        {
          ...TRAIT_METADATA[key],
          score: aggregateScore,
          tip: sourceTip,
        },
      ];
    }),
  ) as TraitMap;
}

export async function scoreAllTraits(
  frontImageBase64: string,
  sideImageBase64: string,
  profile: AnalysisProfile | null = null,
): Promise<TraitMap> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const passes = await Promise.all([
    scoreSinglePass(
      apiKey,
      BASE_SYSTEM_PROMPT,
      "Review the two photos carefully. Score each trait independently, use the full scale when supported, and ground every score in visible evidence. Return the exact JSON object.",
      profile,
      frontImageBase64,
      sideImageBase64,
    ),
    scoreSinglePass(
      apiKey,
      STRUCTURAL_AUDIT_PROMPT,
      "Re-evaluate the same two photos as a structural audit. Be especially careful not to underrate clearly strong structure, and only lower a trait when visible evidence justifies it. Return the exact JSON object.",
      profile,
      frontImageBase64,
      sideImageBase64,
    ),
  ]);

  return aggregateTraitMaps(passes);
}
