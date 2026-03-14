"use client";
/* eslint-disable @next/next/no-img-element */

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { FILE_INPUT_ACCEPT } from "@/lib/image-processing";

interface UploadZoneProps {
  label: string;
  sublabel: string;
  onFile: (file: File) => void;
  file: File | null;
  error: string | null;
  loading: boolean;
}

const PHOTO_TIPS = [
  "Good lighting",
  "No sunglasses",
  "Neutral expression",
  "Hair pulled back",
];

export default function UploadZone({
  label,
  sublabel,
  onFile,
  file,
  error,
  loading,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `upload-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const handleFile = (nextFile: File | null) => {
    if (!nextFile) {
      return;
    }

    onFile(nextFile);
  };

  const borderClass = loading
    ? "border-amber-400 border-solid animate-pulse"
    : error
      ? "border-amber-500 border-solid"
      : file
        ? "border-amber-300 border-solid"
        : isDragging
          ? "border-amber-400"
          : "border-zinc-700 hover:border-amber-400";

  return (
    <div className="relative flex flex-col gap-4 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <label
        className={`relative flex min-h-72 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.25rem] border-2 border-dashed bg-[linear-gradient(180deg,rgba(24,24,28,0.95)_0%,rgba(15,15,18,0.98)_100%)] transition-all duration-200 ${borderClass}`}
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.03), 0 18px 40px rgba(0,0,0,0.28)",
        }}
        htmlFor={inputId}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files[0] ?? null);
        }}
      >
        <input
          id={inputId}
          ref={inputRef}
          accept={FILE_INPUT_ACCEPT}
          className="sr-only"
          type="file"
          onChange={(event) => {
            handleFile(event.target.files?.[0] ?? null);
            event.currentTarget.value = "";
          }}
        />

        {file && !error && previewUrl ? (
          <>
            <img
              alt={label}
              className="pointer-events-none absolute inset-0 h-full w-full rounded-[1.25rem] object-cover"
              src={previewUrl}
            />
            <div className="absolute inset-0 rounded-[1.25rem] bg-gradient-to-t from-black/35 via-transparent to-black/10" />
            <div className="absolute right-2 top-2 rounded-full bg-green-500 p-1">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <polyline points="20 6 9 18 4 13" />
              </svg>
            </div>
          </>
        ) : loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            className="h-10 w-10 rounded-full border-2 border-zinc-700 border-t-amber-400"
            transition={{ duration: 1, ease: "linear", repeat: Infinity }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center px-6 text-center">
            <svg
              viewBox="0 0 24 24"
              className="mb-5 h-10 w-10 text-zinc-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 16V4" />
              <path d="M7 9l5-5 5 5" />
              <path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
            </svg>
            <p className="text-base font-medium text-zinc-200">Drop photo here</p>
            <p className="mt-2 text-sm text-zinc-500">{sublabel}</p>
          </div>
        )}
      </label>

      <div>
        <p className="text-sm font-semibold tracking-wide text-white">{label}</p>
        <p className="mt-1 text-xs text-zinc-400">{sublabel}</p>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
        {PHOTO_TIPS.map((tip) => (
          <span
            key={tip}
            className="rounded-full border border-white/8 bg-black/20 px-2.5 py-1"
          >
            {tip}
          </span>
        ))}
      </div>

      <p className="text-[11px] text-zinc-500">
        JPG, PNG, WEBP, or HEIC. Max 8 MB each.
      </p>

      {error ? <p className="mt-1 text-xs text-amber-300">{error}</p> : null}
    </div>
  );
}
