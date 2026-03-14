"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const messages = [
  "Preparing your photos for review...",
  "Comparing front and side profile details...",
  "Scoring facial traits with AI reasoning...",
  "Compiling your results...",
];

export default function ProcessingOverlay() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 1500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-zinc-950">
      <motion.div
        animate={{ rotate: 360 }}
        className="h-16 w-16 rounded-full border-4 border-zinc-800 border-t-amber-500"
        transition={{ duration: 1, ease: "linear", repeat: Infinity }}
      />

      <div className="text-center">
        <p className="text-sm tracking-wide text-zinc-400">{messages[messageIndex]}</p>
        <p className="mt-2 text-xs text-zinc-700">This takes about 10–15 seconds</p>
      </div>

      <div className="h-px w-48 rounded-full bg-zinc-800">
        <motion.div
          animate={{ width: "100%" }}
          className="h-full rounded-full bg-amber-600"
          initial={{ width: "0%" }}
          transition={{ duration: 14, ease: "linear" }}
        />
      </div>
    </div>
  );
}
