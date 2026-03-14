"use client";

type AnalysisRubric = "male" | "female" | "universal";
type AnalysisAgeBand = "18-24" | "25-34" | "35-44" | "45+";

type AnalysisProfile = {
  rubric: AnalysisRubric;
  ageBand: AnalysisAgeBand;
};

type AnalysisProfileModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  value: AnalysisProfile;
  onChange: (value: AnalysisProfile) => void;
  onClose: () => void;
  onContinueWithoutProfile: () => void;
  onSubmit: () => void;
};

const RUBRIC_OPTIONS: Array<{
  value: AnalysisRubric;
  label: string;
  description: string;
}> = [
  {
    value: "male",
    label: "Male rubric",
    description: "Optimizes dimorphism and brow-area calibration for male facial standards.",
  },
  {
    value: "female",
    label: "Female rubric",
    description: "Optimizes dimorphism and structure calibration for female facial standards.",
  },
  {
    value: "universal",
    label: "Universal rubric",
    description: "Uses a broader facial standard when you do not want sex-specific calibration.",
  },
];

const AGE_OPTIONS: Array<{
  value: AnalysisAgeBand;
  label: string;
}> = [
  { value: "18-24", label: "18-24" },
  { value: "25-34", label: "25-34" },
  { value: "35-44", label: "35-44" },
  { value: "45+", label: "45+" },
];

export type { AnalysisAgeBand, AnalysisProfile, AnalysisRubric };

export default function AnalysisProfileModal({
  isOpen,
  isSubmitting,
  value,
  onChange,
  onClose,
  onContinueWithoutProfile,
  onSubmit,
}: AnalysisProfileModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <button
        aria-label="Close profile preferences"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <section className="relative z-10 w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[rgba(10,10,12,0.96)] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{
            background:
              "radial-gradient(circle at top, rgba(217,119,6,0.18) 0%, transparent 72%)",
          }}
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-amber-500/80">
                Optional Calibration
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                Sharpen The Read
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-400">
                Add a rubric and age range to calibrate dimorphism, brow area,
                skin, and hair more accurately. You can also skip this.
              </p>
            </div>

            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400 transition-colors hover:text-white"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Rubric
            </p>
            <div className="mt-3 grid gap-3">
              {RUBRIC_OPTIONS.map((option) => {
                const active = value.rubric === option.value;

                return (
                  <button
                    className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                      active
                        ? "border-amber-500/50 bg-amber-500/10 shadow-[0_0_24px_rgba(217,119,6,0.12)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                    key={option.value}
                    onClick={() => onChange({ ...value, rubric: option.value })}
                    type="button"
                  >
                    <p className="text-sm font-semibold text-white">{option.label}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Age Range
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {AGE_OPTIONS.map((option) => {
                const active = value.ageBand === option.value;

                return (
                  <button
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                      active
                        ? "border-amber-500/50 bg-amber-500/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                    key={option.value}
                    onClick={() => onChange({ ...value, ageBand: option.value })}
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:text-white"
              disabled={isSubmitting}
              onClick={onContinueWithoutProfile}
              type="button"
            >
              Skip For Now
            </button>
            <button
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-all disabled:opacity-70"
              disabled={isSubmitting}
              onClick={onSubmit}
              style={{
                background:
                  "linear-gradient(180deg, rgba(217,119,6,0.96) 0%, rgba(180,83,9,0.96) 100%)",
                border: "1px solid rgba(245,158,11,0.22)",
                boxShadow:
                  "0 0 30px rgba(180,83,9,0.24), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
              type="button"
            >
              Analyze With Calibration
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
