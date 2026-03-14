import type { TraitKey, TraitMap, TraitScore } from "@/lib/merge-results";

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

const SYSTEM_PROMPT = `You are a careful facial feature reviewer for a consumer appearance app.
You will receive two photos of the same person: one front-facing and one side profile.
Evaluate exactly these 10 traits:
symmetry, canthalTilt, facialThirds, chinProjection, dimorphism, jawline, cheekbone, skin, hair, browRidge.

Return ONLY valid JSON and match this schema exactly:
{
  "symmetry": { "score": number, "tip": string },
  "canthalTilt": { "score": number, "tip": string },
  "facialThirds": { "score": number, "tip": string },
  "chinProjection": { "score": number, "tip": string },
  "dimorphism": { "score": number, "tip": string },
  "jawline": { "score": number, "tip": string },
  "cheekbone": { "score": number, "tip": string },
  "skin": { "score": number, "tip": string },
  "hair": { "score": number, "tip": string },
  "browRidge": { "score": number, "tip": string },
}

Scoring guidance:
- Use a 1.0 to 10.0 scale with one decimal place.
- Use true tenth-place variation when justified. Do not round most scores to whole numbers or ".5".
- Score each trait independently. Do not let a generally good or generally weak face drag the other traits toward the same score.
- Use meaningful variation when the photos support it. A visibly weak trait should stand out as weak relative to the others.
- Reward clearly strong traits highly when the photo clearly supports it, even if the overall face has some weaknesses.
- Only score below 4.0 when the trait is clearly and significantly below average.
- Do not be harsh. Ignore small asymmetries, normal variation, minor camera distortion, and mild lighting flaws.
- If the photos are imperfect, avoid overconfidence, but do not force every score back to the middle.
- Compare each trait to a broad population standard for that specific trait, not to the subject's overall appearance.
- Jawline should reflect mandibular definition, gonial angle clarity, lower-face structure, and neck-jaw separation.
- Cheekbone should reflect prominence, width contribution, and visible projection rather than overall leanness alone.
- ChinProjection should rely heavily on the side profile.
- Skin should reflect visible clarity, smoothness, and evenness of complexion as best as the photos allow.
- If the skin has no visible flaws and looks clear and healthy, it can score very highly even if the person has other weaknesses.
- Hair should reflect thickness, density, grooming, and healthy-looking texture. Thick, luscious, non-oily hair scores higher.
- Intentionally bald, closely shaved, or cleanly buzzed hair can still score well and should not be penalized just for being bald.
- Visible male pattern baldness, recession, or thinning should severely reduce the hair score when clearly present.
- Tips must be supportive, practical, and under 18 words.
- Never use insulting or shaming language.`;

function clamp(value: number, min = 1, max = 10): number {
  return Math.round(Math.max(min, Math.min(max, value)) * 10) / 10;
}

function normalizeScore(rawScore: unknown): number {
  const numeric = Number(rawScore);
  const bounded = Number.isFinite(numeric) ? clamp(numeric) : 6;

  if (bounded >= 3.5 && bounded < 4) {
    return 4;
  }

  return bounded;
}

function normalizeTip(value: unknown): string {
  if (typeof value !== "string") {
    return FALLBACK_TIP;
  }

  const trimmed = value.trim();
  return trimmed || FALLBACK_TIP;
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

    return {
      score: normalizeScore(rawTrait.score),
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

export async function scoreAllTraits(
  frontImageBase64: string,
  sideImageBase64: string,
): Promise<TraitMap> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Review the two photos carefully and return the exact JSON object for the 10 requested traits.",
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
