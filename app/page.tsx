"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import GigachadTilt from "@/components/gigachad-tilt";
import ShaderLines from "@/components/shader-lines";

const HERO_WORDS = [
  { text: "Mogger", color: "#38BDF8" },
  { text: "Looksmaxxer", color: "#F97316" },
  { text: "Chad", color: "#A78BFA" },
] as const;

export default function HomePage() {
  const router = useRouter();
  const [wordIndex, setWordIndex] = useState(0);
  const [visibleLength, setVisibleLength] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = HERO_WORDS[wordIndex].text;
    const isWordComplete = visibleLength === currentWord.length;
    const isWordCleared = visibleLength === 0;
    const delay = isDeleting
      ? 70
      : isWordComplete
        ? 1100
        : 115;

    const timeoutId = window.setTimeout(() => {
      if (!isDeleting) {
        if (isWordComplete) {
          setIsDeleting(true);
          return;
        }

        setVisibleLength((current) => current + 1);
        return;
      }

      if (!isWordCleared) {
        setVisibleLength((current) => current - 1);
        return;
      }

      setIsDeleting(false);
      setWordIndex((current) => (current + 1) % HERO_WORDS.length);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isDeleting, visibleLength, wordIndex]);

  const activeWord = HERO_WORDS[wordIndex];
  const typedWord = activeWord.text.slice(0, visibleLength);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 z-0">
        <ShaderLines />
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <GigachadTilt />
      </div>

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(0,0,0,0.72) 0%, transparent 100%)",
          }}
        />

        <span
          className="mb-5 text-xs font-semibold tracking-[0.3em] uppercase"
          style={{ color: "rgba(217,119,6,0.9)", letterSpacing: "0.3em" }}
        >
          AI Facial Analysis
        </span>

        <h1
          className="font-bold tracking-tighter text-white leading-[0.95]"
          style={{
            fontSize: "clamp(4rem, 10vw, 7rem)",
            fontFamily: "Inter, system-ui, sans-serif",
            textShadow: "0 0 80px rgba(0,0,0,1), 0 2px 4px rgba(0,0,0,1)",
            fontWeight: 800,
          }}
        >
          Mog-O-Meter.
          <br />
          <span className="text-white">Be a </span>
          <span
            style={{
              color: activeWord.color,
              textShadow: `0 0 30px ${activeWord.color}55, 0 0 60px rgba(0,0,0,0.85)`,
            }}
          >
            {typedWord}
          </span>
          <span
            className="inline-block animate-pulse align-baseline text-white/90"
            style={{
              marginLeft: "0.06em",
            }}
          >
            |
          </span>
        </h1>

        <p
          className="mt-6 text-base text-zinc-400 max-w-xs leading-relaxed tracking-wide"
          style={{
            textShadow: "0 1px 12px rgba(0,0,0,1)",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          Brutally honest facial analysis.
          <br />
          10 traits. 30 seconds.
        </p>

        <button
          onClick={() => router.push("/upload")}
          className="mt-10 px-9 py-3.5 rounded-lg font-semibold text-sm tracking-widest uppercase text-white transition-all duration-300"
          style={{
            background: "rgba(180, 83, 9, 0.85)",
            border: "1px solid rgba(217, 119, 6, 0.4)",
            boxShadow:
              "0 0 28px rgba(180,83,9,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
            fontFamily: "Inter, system-ui, sans-serif",
            letterSpacing: "0.15em",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 42px rgba(217,119,6,0.5), inset 0 1px 0 rgba(255,255,255,0.12)";
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(217, 119, 6, 0.92)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 28px rgba(180,83,9,0.35), inset 0 1px 0 rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(180, 83, 9, 0.85)";
          }}
          type="button"
        >
          Analyze My Face
        </button>
      </div>
    </main>
  );
}
