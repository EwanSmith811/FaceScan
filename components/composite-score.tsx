"use client";

import { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";

interface CompositeScoreProps {
  score: number;
}

function getInterpretation(score: number) {
  if (score >= 8.0) {
    return { className: "bg-green-950 text-green-400", label: "Touse Mogger" };
  }
  if (score >= 6.7) {
    return {
      className: "bg-amber-950 text-amber-500",
      label: "Chad",
    };
  }
  if (score >= 6.0) {
    return { className: "bg-zinc-800 text-zinc-300", label: "Mogs Chuds" };
  }
  if (score >= 5.5) {
    return {
      className: "bg-orange-950 text-orange-400",
      label: "Bouse Squid",
    };
  }
  return {
    className: "bg-amber-950 text-amber-500",
    label: "Brutally Frame Mogged",
  };
}

export default function CompositeScore({ score }: CompositeScoreProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (value) => value.toFixed(1));
  const interpretation = getInterpretation(score);

  useEffect(() => {
    const controls = animate(count, score, {
      duration: 1,
      ease: "easeOut",
    });

    return () => controls.stop();
  }, [count, score]);

  return (
    <div className="flex flex-col items-center gap-2 py-10">
      <div className="flex items-end">
        <motion.span className="text-[8.5rem] font-bold tracking-tighter leading-none text-white md:text-[10rem]">
          {rounded}
        </motion.span>
        <span className="mb-2 ml-3 text-4xl text-zinc-500 md:text-5xl">/ 10</span>
      </div>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
        OVERALL SCORE
      </p>
      <span
        className={`mt-3 rounded-full px-4 py-1.5 text-sm font-semibold ${interpretation.className}`}
      >
        {interpretation.label}
      </span>
    </div>
  );
}
