import { scoreAllTraits } from "@/lib/llm-scoring";
import type { AnalysisAgeBand, AnalysisRubric } from "@/lib/session";

export const runtime = "nodejs";

type AnalyzeRequestBody = {
  frontImage?: string;
  sideImage?: string;
  profile?: {
    rubric?: AnalysisRubric;
    ageBand?: AnalysisAgeBand;
  } | null;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const MAX_BODY_BYTES = 6 * 1024 * 1024;
const MAX_IMAGE_BYTES = Math.floor(2.5 * 1024 * 1024);
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const BASE64_PATTERN = /^[A-Za-z0-9+/=]+$/;
const VALID_RUBRICS = new Set<AnalysisRubric>(["male", "female", "universal"]);
const VALID_AGE_BANDS = new Set<AnalysisAgeBand>([
  "18-24",
  "25-34",
  "35-44",
  "45+",
]);
const globalStore = globalThis as typeof globalThis & {
  __facescanRateLimit?: Map<string, RateLimitEntry>;
};

function getRateLimitMap(): Map<string, RateLimitEntry> {
  if (!globalStore.__facescanRateLimit) {
    globalStore.__facescanRateLimit = new Map<string, RateLimitEntry>();
  }

  return globalStore.__facescanRateLimit;
}

function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  const agent = request.headers.get("user-agent") || "unknown";

  return `${ip}:${agent.slice(0, 120)}`;
}

function checkRateLimit(request: Request): { allowed: boolean; retryAfter: number } {
  const store = getRateLimitMap();
  const now = Date.now();
  const key = getClientKey(request);
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return {
      allowed: true,
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  store.set(key, current);

  return {
    allowed: true,
    retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

function hasTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    return originUrl.host === requestUrl.host;
  } catch {
    return false;
  }
}

function decodedSizeFromBase64(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function validateImagePayload(image: string | undefined): string | null {
  if (!image) {
    return "Missing frontImage or sideImage";
  }

  const normalized = image.trim();

  if (!normalized || !BASE64_PATTERN.test(normalized)) {
    return "Invalid image payload";
  }

  if (decodedSizeFromBase64(normalized) > MAX_IMAGE_BYTES) {
    return "Each photo must stay under 2.5 MB after compression.";
  }

  return null;
}

function validateProfile(
  profile: AnalyzeRequestBody["profile"],
): { rubric: AnalysisRubric; ageBand: AnalysisAgeBand } | null {
  if (profile == null) {
    return null;
  }

  const rubric = profile.rubric;
  const ageBand = profile.ageBand;

  if (!rubric || !ageBand) {
    return null;
  }

  if (!VALID_RUBRICS.has(rubric) || !VALID_AGE_BANDS.has(ageBand)) {
    return null;
  }

  return { rubric, ageBand };
}

export async function POST(req: Request): Promise<Response> {
  try {
    if (!hasTrustedOrigin(req)) {
      return Response.json(
        { error: "Invalid request origin" },
        { status: 403 },
      );
    }

    const contentType = req.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return Response.json(
        { error: "Content-Type must be application/json" },
        { status: 415 },
      );
    }

    const contentLength = Number(req.headers.get("content-length") || "0");

    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return Response.json(
        { error: "Upload payload is too large" },
        { status: 413 },
      );
    }

    const rateLimit = checkRateLimit(req);

    if (!rateLimit.allowed) {
      return Response.json(
        {
          error: "Too many scans. Please wait before starting another one.",
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
          },
        },
      );
    }

    const body = (await req.json()) as AnalyzeRequestBody;
    const frontImage = body.frontImage?.trim();
    const sideImage = body.sideImage?.trim();
    const profile = validateProfile(body.profile);
    const frontError = validateImagePayload(frontImage);
    const sideError = validateImagePayload(sideImage);

    if (frontError || sideError) {
      return Response.json(
        { error: frontError ?? sideError ?? "Invalid image input" },
        { status: 400 },
      );
    }

    const scores = await scoreAllTraits(frontImage!, sideImage!, profile);

    return Response.json(scores, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("FaceScan analysis failed", error);

    return Response.json(
      { error: "Analysis failed. Please try again with two clear photos." },
      { status: 500 },
    );
  }
}
