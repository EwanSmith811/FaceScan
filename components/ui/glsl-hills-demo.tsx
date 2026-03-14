import { GLSLHills } from "@/components/ui/glsl-hills";

export default function DemoOne() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      <GLSLHills />
      <div className="pointer-events-none absolute z-10 space-y-6 text-center">
        <h1 className="whitespace-pre-wrap text-7xl font-semibold">
          <span className="text-6xl font-thin italic">
            Designs That Speak <br />
          </span>
          Louder Than Words
        </h1>
        <p className="text-sm text-primary/60">
          We craft stunning visuals and user - friendly experiences that <br />
          help your brand stand out and connect with your audience.
        </p>
      </div>
    </div>
  );
}
