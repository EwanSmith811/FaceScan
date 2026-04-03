"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AnalysisProfileModal from "@/components/analysis-profile-modal";
import UploadZone from "@/components/upload-zone";
import { GLSLHills } from "@/components/ui/glsl-hills";
import {
  fileToBase64,
  normalizeUploadFile,
} from "@/lib/image-processing";
import { type AnalysisProfile, saveInput } from "@/lib/session";
import {
  clearCachedUpload,
  clearCachedUploads,
  loadCachedUpload,
  saveCachedUpload,
} from "@/lib/upload-cache";

const GOLD_HILLS_COLOR: [number, number, number] = [0.93, 0.6, 0.14];

export default function UploadPage() {
  const router = useRouter();
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [sideFile, setSideFile] = useState<File | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [analysisProfile, setAnalysisProfile] = useState<AnalysisProfile>({
    rubric: "male",
    ageBand: "18-24",
  });
  const [frontError, setFrontError] = useState<string | null>(null);
  const [sideError, setSideError] = useState<string | null>(null);
  const [frontLoading, setFrontLoading] = useState(false);
  const [sideLoading, setSideLoading] = useState(false);

  const persistNormalizedFile = useCallback(async (
    file: File,
    cacheKey: "front" | "side",
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const normalizedFile = await normalizeUploadFile(file);
      setFile(normalizedFile);
      await saveCachedUpload(cacheKey, normalizedFile);
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleFile(
    file: File,
    cacheKey: "front" | "side",
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  ) {
    try {
      await persistNormalizedFile(
        file,
        cacheKey,
        setFile,
        setError,
        setLoading,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not process that image. Please try another photo.";

      setFile(null);
      setError(message);

      try {
        await clearCachedUpload(cacheKey);
      } catch {
        return;
      }
    }
  }

  const restoreCachedFile = useCallback(async (
    file: File,
    cacheKey: "front" | "side",
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    try {
      await persistNormalizedFile(
        file,
        cacheKey,
        setFile,
        setError,
        setLoading,
      );
    } catch {
      setFile(null);
      setError(null);

      try {
        await clearCachedUpload(cacheKey);
      } catch {
        return;
      }
    }
  }, [persistNormalizedFile]);

  useEffect(() => {
    let isActive = true;

    void Promise.all([loadCachedUpload("front"), loadCachedUpload("side")])
      .then(([cachedFront, cachedSide]) => {
        if (!isActive) {
          return;
        }

        if (cachedFront) {
          void restoreCachedFile(
            cachedFront,
            "front",
            setFrontFile,
            setFrontError,
            setFrontLoading,
          );
        }

        if (cachedSide) {
          void restoreCachedFile(
            cachedSide,
            "side",
            setSideFile,
            setSideError,
            setSideLoading,
          );
        }
      })
      .catch(() => {
        return;
      });

    return () => {
      isActive = false;
    };
  }, [restoreCachedFile]);

  const canAnalyze =
    frontFile !== null &&
    sideFile !== null &&
    !frontLoading &&
    !sideLoading;

  const startAnalysis = async (profile: AnalysisProfile | null) => {
    if (frontFile === null || sideFile === null) {
      return;
    }

    setFrontLoading(true);
    setSideLoading(true);
    setFrontError(null);
    setSideError(null);

    try {
      await clearCachedUploads();
    } catch {
      // Ignore cache-clear failures and continue the analysis flow.
    }

    try {
      const [frontBase64, sideBase64] = await Promise.all([
        fileToBase64(frontFile),
        fileToBase64(sideFile),
      ]);

      saveInput({
        frontBase64,
        sideBase64,
        profile,
      });

      router.push("/processing");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not process one of those images. Please try another photo.";

      setFrontError(message);
      setSideError(message);
    } finally {
      setFrontLoading(false);
      setSideLoading(false);
    }
  };

  const handleAnalyze = () => {
    if (!canAnalyze) {
      return;
    }

    setProfileModalOpen(true);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 opacity-55">
        <GLSLHills
          height="100%"
          width="100%"
          speed={0.35}
          color={GOLD_HILLS_COLOR}
          brightness={2.5}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center px-6 py-10">
        <section
          className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(10,10,12,0.72)] px-6 py-10 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl md:px-10 md:py-12"
          style={{
            boxShadow:
              "0 30px 120px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(180,83,9,0.16)",
          }}
        >
          <div className="absolute left-6 top-6 z-20">
            <button
              className="flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-2 text-sm text-zinc-300 backdrop-blur-md transition-colors hover:text-white"
              onClick={() => router.push("/")}
              type="button"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back
            </button>
          </div>

          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-40"
            style={{
              background:
                "radial-gradient(circle at top, rgba(217,119,6,0.16) 0%, transparent 72%)",
            }}
          />

          <div className="relative text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-amber-500/80">
              Secure Intake
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Upload Photos
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-400">
              We need one front photo and one side photo for review. Clear,
              evenly lit images will give the most accurate read.
            </p>
          </div>

          <div className="relative mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <UploadZone
              error={frontError}
              file={frontFile}
              label="Front Profile"
              loading={frontLoading}
              onFile={(file) =>
                void handleFile(
                  file,
                  "front",
                  setFrontFile,
                  setFrontError,
                  setFrontLoading,
                )
              }
              sublabel="Face the camera directly"
            />
            <UploadZone
              error={sideError}
              file={sideFile}
              label="Side Profile"
              loading={sideLoading}
              onFile={(file) =>
                void handleFile(
                  file,
                  "side",
                  setSideFile,
                  setSideError,
                  setSideLoading,
                )
              }
              sublabel="Turn 90 degrees to the right"
            />
          </div>

          <button
            className={`mt-8 w-full rounded-2xl py-4 text-sm font-semibold uppercase tracking-[0.18em] transition-all duration-300 ${
              canAnalyze
                ? "text-white"
                : "cursor-not-allowed border border-white/10 bg-white/5 text-zinc-500"
            }`}
            disabled={!canAnalyze}
            onClick={handleAnalyze}
            style={
              canAnalyze
                ? {
                    background:
                      "linear-gradient(180deg, rgba(217,119,6,0.96) 0%, rgba(180,83,9,0.96) 100%)",
                    border: "1px solid rgba(245,158,11,0.22)",
                    boxShadow:
                      "0 0 30px rgba(180,83,9,0.24), inset 0 1px 0 rgba(255,255,255,0.1)",
                  }
                : undefined
            }
            type="button"
          >
            {canAnalyze ? "Analyze My Face" : "Upload both photos to continue"}
          </button>

          <p className="mt-4 text-center text-xs text-zinc-500">
            Photos are resized client-side before analysis and are never stored.
          </p>
        </section>
      </div>

      <AnalysisProfileModal
        isOpen={profileModalOpen}
        isSubmitting={frontLoading || sideLoading}
        onChange={setAnalysisProfile}
        onClose={() => setProfileModalOpen(false)}
        onContinueWithoutProfile={() => {
          setProfileModalOpen(false);
          void startAnalysis(null);
        }}
        onSubmit={() => {
          setProfileModalOpen(false);
          void startAnalysis(analysisProfile);
        }}
        value={analysisProfile}
      />
    </main>
  );
}
