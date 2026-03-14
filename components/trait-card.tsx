"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import ScoreRing from "@/components/score-ring";
import type { TraitScore } from "@/lib/merge-results";

interface TraitCardProps {
  traitKey: string;
  trait: TraitScore;
  index: number;
}

const descriptions: Record<string, string> = {
  symmetry: "How evenly balanced the left and right sides of your face are",
  canthalTilt: "The upward or downward angle of your outer eye corners",
  facialThirds:
    "How evenly your face divides into forehead, midface, and lower face",
  chinProjection:
    "How far your chin extends forward relative to your facial profile",
  dimorphism:
    "The degree of sexually dimorphic structure in the brow, jaw, and lower face",
  jawline: "The sharpness and definition of your jaw and mandibular angle",
  cheekbone: "The prominence and lateral projection of your cheekbones",
  skin: "The visible clarity, smoothness, and evenness of your skin",
  hair: "The density, thickness, texture, and grooming quality of your hair",
  browRidge: "The framing, thickness, and position of your brow above the eyes",
};

export default function TraitCard({ traitKey, trait, index }: TraitCardProps) {
  const [tipOpen, setTipOpen] = useState(false);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5"
      initial={{ opacity: 0, y: 24 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: "easeOut",
      }}
    >
      <div className="flex items-center gap-4">
        <ScoreRing score={trait.score} size={80} strokeWidth={7} />
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold text-white">{trait.label}</p>
          <p className="text-xs leading-relaxed text-zinc-500">
            {descriptions[traitKey]}
          </p>
        </div>
      </div>

      <div>
        <button
          className="flex w-fit items-center gap-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
          onClick={() => setTipOpen((current) => !current)}
          type="button"
        >
          <motion.svg
            animate={{ rotate: tipOpen ? 180 : 0 }}
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M6 9l6 6 6-6" />
          </motion.svg>
          Improvement Tip
        </button>

        {tipOpen ? (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            initial={{ opacity: 0, height: 0 }}
          >
            <p className="border-t border-amber-700/20 pt-2 text-xs leading-relaxed text-amber-100">
              {trait.tip}
            </p>
          </motion.div>
        ) : null}
      </div>
    </motion.div>
  );
}
