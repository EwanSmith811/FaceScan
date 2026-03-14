"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";

export default function GigachadTilt() {
  const imgRef = useRef<HTMLImageElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      targetX.current = (event.clientX / window.innerWidth - 0.5) * 2;
      targetY.current = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleMouseLeave = () => {
      targetX.current = 0;
      targetY.current = 0;
    };

    const animate = () => {
      currentX.current += (targetX.current - currentX.current) * 0.08;
      currentY.current += (targetY.current - currentY.current) * 0.08;

      if (imgRef.current) {
        imgRef.current.style.transform = `perspective(800px) rotateY(${currentX.current * 18}deg) rotateX(${-currentY.current * 18}deg) scale(1.04)`;
      }

      if (glowRef.current) {
        glowRef.current.style.transform = `perspective(800px) rotateY(${currentX.current * 10}deg) rotateX(${-currentY.current * 10}deg)`;
      }

      frameRef.current = window.requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div
        ref={glowRef}
        className="absolute h-[40rem] w-[40rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(180,95,20,0.34) 0%, transparent 70%)",
          filter: "blur(60px)",
          width: "420px",
          height: "420px",
          willChange: "transform",
        }}
      />
      <img
        ref={imgRef}
        src="/gigachad.jpg"
        alt="Gigachad"
        style={{
          width: "456px",
          height: "576px",
          objectFit: "cover",
          objectPosition: "center top",
          willChange: "transform",
          transformStyle: "preserve-3d",
          position: "relative",
          maskImage:
            "radial-gradient(ellipse 85% 90% at 50% 40%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 90% at 50% 40%, black 40%, transparent 100%)",
          filter:
            "grayscale(0.3) contrast(1.1) drop-shadow(0 0 80px rgba(180,95,20,0.38))",
        }}
      />
    </div>
  );
}
