"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ProcessingOverlay from "@/components/processing-overlay";
import {
  createAnalysisCacheKey,
  loadCachedAnalysis,
  saveCachedAnalysis,
} from "@/lib/analysis-cache";
import type { TraitMap } from "@/lib/merge-results";
import { mergeResults } from "@/lib/merge-results";
import { clearInput, loadInput, saveResult } from "@/lib/session";

type AnalyzeErrorResponse = {
  error?: string;
  retryAfter?: number;
};

function formatRetryAfter(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }

  if (seconds === 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  return `${minutes} minute${minutes === 1 ? "" : "s"} ${seconds} second${seconds === 1 ? "" : "s"}`;
}

export default function ProcessingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const input = loadInput();

    if (input === null) {
      router.replace("/upload");
      return;
    }

    const run = async () => {
      try {
        const cacheKey = await createAnalysisCacheKey(
          input.frontBase64,
          input.sideBase64,
        );
        const cachedTraits = loadCachedAnalysis(cacheKey);

        if (cachedTraits !== null) {
          const cachedResult = mergeResults(cachedTraits, {
            frontBase64: input.frontBase64,
            sideBase64: input.sideBase64,
          });

          saveResult(cachedResult);
          clearInput();
          router.replace("/results");
          return;
        }

        const traits = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frontImage: input.frontBase64,
            sideImage: input.sideBase64,
          }),
        }).then(async (response) => {
          const data = (await response.json()) as TraitMap | AnalyzeErrorResponse;

          if (!response.ok) {
            const retryAfterHeader = response.headers.get("Retry-After");
            const retryAfterFromHeader = Number(retryAfterHeader);
            const retryAfter =
              "retryAfter" in data && typeof data.retryAfter === "number"
                ? data.retryAfter
                : Number.isFinite(retryAfterFromHeader)
                  ? retryAfterFromHeader
                  : null;

            if (response.status === 429 && retryAfter !== null) {
              throw new Error(
                `Too many scans right now. Please try again in ${formatRetryAfter(retryAfter)}.`,
              );
            }

            throw new Error(
              "error" in data && typeof data.error === "string"
                ? data.error
                : "Analysis failed",
            );
          }

          return data as TraitMap;
        });

        saveCachedAnalysis(cacheKey, traits);

        const result = mergeResults(traits, {
          frontBase64: input.frontBase64,
          sideBase64: input.sideBase64,
        });

        saveResult(result);
        clearInput();
        router.replace("/results");
      } catch (nextError) {
        setError(
          nextError instanceof Error ? nextError.message : "Analysis failed",
        );
      }
    };

    void run();
  }, [router]);

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-zinc-950">
        <p className="max-w-xs text-center text-sm text-red-400">{error}</p>
        <button
          onClick={() => router.replace("/upload")}
          className="rounded-lg bg-zinc-800 px-6 py-3 text-sm text-white transition-all hover:bg-zinc-700"
          type="button"
        >
          Try Again
        </button>
      </div>
    );
  }

  return <ProcessingOverlay />;
}
