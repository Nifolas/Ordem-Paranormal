"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SymbolPlacement {
  id: string;
  src: string;
  alt: string;
  sizePx: number;
  rotateDeg: number;
  positionStyle: React.CSSProperties;
  opacity: number;
  animClass: string;
  animDelay: string;
  isTransparentPngOrWebp?: boolean;
}

/**
 * Array 100% determinístico de 9 instâncias dos 5 símbolos dos elementos
 * de `public/symbols/` espalhadas pelas bordas, cantos e áreas vazias da tela.
 */
const PARANORMAL_PLACEMENTS: SymbolPlacement[] = [
  {
    id: "sym-morte-tl",
    src: "/symbols/Morte.jpg",
    alt: "Símbolo de Morte",
    sizePx: 360,
    rotateDeg: -18,
    positionStyle: { top: "-2%", left: "-2%" },
    opacity: 0.11,
    animClass: "animate-paranormal-float-slow",
    animDelay: "0s",
  },
  {
    id: "sym-conhecimento-tr",
    src: "/symbols/Conhecimento.jpg",
    alt: "Símbolo de Conhecimento",
    sizePx: 390,
    rotateDeg: 14,
    positionStyle: { top: "3%", right: "-3%" },
    opacity: 0.1,
    animClass: "animate-paranormal-float-med",
    animDelay: "-6s",
  },
  {
    id: "sym-sangue-ml",
    src: "/symbols/Sangue.webp",
    alt: "Símbolo de Sangue",
    sizePx: 310,
    rotateDeg: 20,
    positionStyle: { top: "36%", left: "-1%" },
    opacity: 0.085,
    animClass: "animate-paranormal-float-alt",
    animDelay: "-11s",
    isTransparentPngOrWebp: true,
  },
  {
    id: "sym-energia-mr",
    src: "/symbols/Energia.jpg",
    alt: "Símbolo de Energia",
    sizePx: 340,
    rotateDeg: -21,
    positionStyle: { top: "42%", right: "-1%" },
    opacity: 0.11,
    animClass: "animate-paranormal-float-slow",
    animDelay: "-15s",
  },
  {
    id: "sym-medo-bl",
    src: "/symbols/Medo.jpg",
    alt: "Símbolo de Medo",
    sizePx: 400,
    rotateDeg: 11,
    positionStyle: { bottom: "-4%", left: "2%" },
    opacity: 0.1,
    animClass: "animate-paranormal-float-med",
    animDelay: "-4s",
  },
  {
    id: "sym-sangue-br",
    src: "/symbols/Sangue.webp",
    alt: "Símbolo de Sangue",
    sizePx: 350,
    rotateDeg: -16,
    positionStyle: { bottom: "-3%", right: "2%" },
    opacity: 0.085,
    animClass: "animate-paranormal-float-slow",
    animDelay: "-19s",
    isTransparentPngOrWebp: true,
  },
  {
    id: "sym-conhecimento-tc",
    src: "/symbols/Conhecimento.jpg",
    alt: "Símbolo de Conhecimento",
    sizePx: 230,
    rotateDeg: -12,
    positionStyle: { top: "9%", left: "25%" },
    opacity: 0.075,
    animClass: "animate-paranormal-float-alt",
    animDelay: "-9s",
  },
  {
    id: "sym-morte-bc",
    src: "/symbols/Morte.jpg",
    alt: "Símbolo de Morte",
    sizePx: 250,
    rotateDeg: 19,
    positionStyle: { bottom: "7%", right: "26%" },
    opacity: 0.08,
    animClass: "animate-paranormal-float-med",
    animDelay: "-13s",
  },
  {
    id: "sym-energia-tl2",
    src: "/symbols/Energia.jpg",
    alt: "Símbolo de Energia",
    sizePx: 220,
    rotateDeg: 24,
    positionStyle: { top: "68%", left: "20%" },
    opacity: 0.075,
    animClass: "animate-paranormal-float-alt",
    animDelay: "-22s",
  },
];

export function ParanormalBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none vera-no-print"
    >
      {/* Símbolos dos Elementos de public/symbols/ camuflados no fundo */}
      {PARANORMAL_PLACEMENTS.map((item) => (
        <div
          key={item.id}
          style={{
            ...item.positionStyle,
            width: `${item.sizePx}px`,
            height: `${item.sizePx}px`,
            animationDelay: item.animDelay,
          }}
          className={cn(
            "absolute",
            item.animClass,
            !item.isTransparentPngOrWebp && "mix-blend-screen"
          )}
        >
          <img
            src={item.src}
            alt={item.alt}
            draggable={false}
            style={{
              transform: `rotate(${item.rotateDeg}deg)`,
              opacity: item.opacity,
            }}
            className={cn(
              "w-full h-full object-contain blur-[0.4px]",
              item.isTransparentPngOrWebp
                ? "brightness-95"
                : "contrast-125 brightness-110"
            )}
          />
        </div>
      ))}

      {/* Vinheta radial suave apenas no miolo central para preservar leitura sem esconder os símbolos das bordas */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(9, 9, 11, 0.45) 0%, rgba(9, 9, 11, 0.15) 60%, rgba(9, 9, 11, 0.35) 100%)",
        }}
      />
    </div>
  );
}
