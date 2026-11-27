"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HelpCircle } from "lucide-react";
import { GLOSSARY, type GlossaryTermKey } from "@/lib/glossary";
import { cn } from "@/lib/utils";

export function TermTooltip({
  term,
  label,
  showIcon = true,
  className,
}: {
  term: GlossaryTermKey;
  label?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}) {
  const entry = GLOSSARY[term];
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const width = 276;
      setCoords({
        top: rect.bottom + 6,
        left: Math.max(
          8,
          Math.min(
            rect.left + rect.width / 2 - width / 2,
            window.innerWidth - width - 8
          )
        ),
      });
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  if (!entry) {
    return <span className={className}>{label ?? term}</span>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex items-center gap-1 cursor-help border-b border-dotted border-zinc-500/70 hover:border-zinc-300 transition-colors",
          className
        )}
      >
        <span>{label ?? term}</span>
        {showIcon && (
          <HelpCircle className="h-3 w-3 opacity-60 hover:opacity-100 shrink-0" />
        )}
      </span>

      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[120] w-[276px] pointer-events-none rounded-lg border border-white/20 bg-[#121218] p-3 text-left shadow-2xl space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-xs font-bold text-zinc-100">
                {entry.title}
              </span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-zinc-300">
                {entry.term}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-300 font-normal normal-case">
              {entry.shortExplanation}
            </p>
            {entry.example && (
              <p className="border-t border-white/10 pt-1.5 text-[10px] leading-snug text-zinc-400 italic font-normal normal-case">
                {entry.example}
              </p>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
