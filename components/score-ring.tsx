"use client";

import { motion } from "framer-motion";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function ScoreRing({
  score,
  size = 120,
  strokeWidth = 10,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 10) * circumference;

  return (
    <svg height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        fill="none"
        r={radius}
        stroke="#27272A"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        animate={{ strokeDashoffset: offset }}
        cx={size / 2}
        cy={size / 2}
        fill="none"
        initial={{ strokeDashoffset: circumference }}
        r={radius}
        stroke="#D97706"
        strokeDasharray={circumference}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      />
      <text
        dominantBaseline="middle"
        fill="white"
        fontFamily="Inter, sans-serif"
        fontSize={size * 0.2}
        fontWeight="700"
        textAnchor="middle"
        x={size / 2}
        y={size / 2}
      >
        {score.toFixed(1)}
      </text>
    </svg>
  );
}
