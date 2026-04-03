"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import CompositeScore from "@/components/composite-score";
import TraitCard from "@/components/trait-card";
import { GLSLHills } from "@/components/ui/glsl-hills";
import type { AnalysisResult } from "@/lib/merge-results";
import { clearResult, loadResult } from "@/lib/session";

const GOLD_HILLS_COLOR: [number, number, number] = [0.93, 0.6, 0.14];

const traitOrder = [
  "symmetry",
  "canthalTilt",
  "facialThirds",
  "chinProjection",
  "dimorphism",
  "jawline",
  "cheekbone",
  "skin",
  "hair",
  "browRidge",
] as const;

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const storedResult = loadResult();

    if (storedResult === null) {
      router.replace("/upload");
      return;
    }

    setResult(storedResult);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [router]);

  if (result === null) {
    return null;
  }

  const currentResult = result;

  async function handleShare() {
    const lines = [
      "My FaceScan Results",
      `Overall: ${currentResult.composite}/10`,
      "---",
      ...traitOrder.map(
        (key) =>
          `${currentResult.traits[key].label}: ${currentResult.traits[key].score}/10`,
      ),
    ];

    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 opacity-55">
        <GLSLHills
          color={GOLD_HILLS_COLOR}
          height="100%"
          width="100%"
          speed={0.35}
          brightness={2.5}
        />
      </div>

      <header className="relative z-10 pb-8 pt-12 text-center">
        <button
          className="absolute left-6 top-12 text-zinc-600 transition-colors hover:text-amber-500"
          onClick={() => router.push("/upload")}
          type="button"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <button
          className="absolute right-6 top-12 flex items-center gap-1.5 text-zinc-600 transition-colors hover:text-amber-500"
          onClick={() => void handleShare()}
          type="button"
        >
          {copied ? (
            <>
              <svg
                className="h-5 w-5 text-green-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <polyline points="20 6 9 18 4 13" />
              </svg>
              <span className="text-xs text-green-400">Copied</span>
            </>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <rect height="13" rx="2" ry="2" width="10" x="9" y="9" />
              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
            </svg>
          )}
        </button>

        <h1 className="text-3xl font-bold tracking-tight text-white">
          Your Results
        </h1>
        <p className="mt-1 text-xs text-amber-600/70">
          {new Date(currentResult.timestamp).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </header>

      <div className="relative z-10">
        <CompositeScore score={currentResult.composite} />
      </div>

      <div className="relative z-10 mx-auto mb-10 grid max-w-4xl grid-cols-1 gap-4 px-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-amber-700/20 bg-zinc-900/95 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
          <img
            alt="Front upload"
            className="aspect-[4/5] w-full object-cover"
            src={`data:image/jpeg;base64,${currentResult.images.frontBase64}`}
          />
          <div className="border-t border-amber-700/20 px-4 py-3">
            <p className="text-sm font-semibold text-white">Front Photo</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-amber-700/20 bg-zinc-900/95 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
          <img
            alt="Side upload"
            className="aspect-[4/5] w-full object-cover"
            src={`data:image/jpeg;base64,${currentResult.images.sideBase64}`}
          />
          <div className="border-t border-amber-700/20 px-4 py-3">
            <p className="text-sm font-semibold text-white">Side Photo</p>
          </div>
        </div>
      </div>

      <p className="relative z-10 mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-amber-700/70">
        Trait Breakdown
      </p>

      <div className="relative z-10 mx-auto grid max-w-4xl grid-cols-1 gap-4 px-6 pb-16 md:grid-cols-2">
        {traitOrder.map((key, i) => (
          <TraitCard
            index={i}
            key={key}
            profile={currentResult.profile}
            trait={currentResult.traits[key]}
            traitKey={key}
          />
        ))}
      </div>

      <div className="relative z-10 flex justify-center pb-16">
        <button
          className="rounded-xl border border-amber-700/20 bg-zinc-900/95 px-8 py-3 text-sm font-semibold text-white transition-all hover:border-amber-600/30 hover:bg-zinc-800"
          onClick={() => {
            clearResult();
            router.push("/upload");
          }}
          style={{
            boxShadow: "0 0 24px rgba(180,83,9,0.12)",
          }}
          type="button"
        >
          Scan Again
        </button>
      </div>
    </main>
  );
}
