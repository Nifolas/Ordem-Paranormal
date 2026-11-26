"use client";

import React from "react";
import { BookOpen, Users } from "lucide-react";
import type { ContentSource } from "@/types/ordem";
import {
  COMMUNITY_SOURCES,
  DEFAULT_ENABLED_SOURCES,
  OFFICIAL_SOURCES,
  SOURCE_BADGE_STYLES,
  getSourceMeta,
  isCommunitySource,
} from "@/lib/sources";
import { cn } from "@/lib/utils";

/** Badge discreto da fonte — exibido apenas para suplementos não oficiais. */
export function SourceBadge({
  source,
  className,
}: {
  source: ContentSource | undefined;
  className?: string;
}) {
  if (!source || !isCommunitySource(source)) return null;
  const meta = getSourceMeta(source);
  return (
    <span
      title={`${meta.label}${meta.author ? ` — ${meta.author}` : ""} (não oficial)`}
      className={cn(
        "inline-flex items-center rounded-sm border px-1 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider",
        SOURCE_BADGE_STYLES[source],
        className
      )}
    >
      {meta.shortLabel}
    </span>
  );
}

export function SourceToggleGroup({
  enabled,
  onToggle,
  onSetCommunity,
  compact = false,
}: {
  enabled: ContentSource[] | undefined;
  onToggle: (src: ContentSource) => void;
  /** Liga/desliga todos os suplementos da comunidade de uma vez. */
  onSetCommunity?: (on: boolean) => void;
  compact?: boolean;
}) {
  const set = new Set(enabled ?? DEFAULT_ENABLED_SOURCES);
  const communityOn = COMMUNITY_SOURCES.filter((s) => set.has(s.id)).length;

  const btn = (id: ContentSource, label: string, title?: string) => {
    const active = set.has(id);
    return (
      <button
        key={id}
        type="button"
        title={title}
        onClick={() => onToggle(id)}
        className={cn(
          "rounded-sm border font-medium transition-colors",
          compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1.5 text-xs",
          active
            ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
            : "border-[#22222A] bg-[#101014] text-[#6E6E7E] hover:text-[#D4D4D8]"
        )}
      >
        {active ? "✓ " : ""}
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E]">
          <BookOpen className="h-3 w-3" /> Livros Oficiais
        </div>
        <div className="flex flex-wrap gap-1.5">
          {OFFICIAL_SOURCES.map((s) => btn(s.id, s.label))}
          {btn("homebrew", "Homebrew do Usuário")}
        </div>
      </div>

      <div className="space-y-1.5 border-t border-[#22222A] pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E]">
            <Users className="h-3 w-3" /> Suplementos da Comunidade (Não
            Oficiais)
            <span className="text-[#6E6E7E]">
              {communityOn}/{COMMUNITY_SOURCES.length}
            </span>
          </div>
          {onSetCommunity && (
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => onSetCommunity(true)}
                className="text-[#A1A1AA] hover:text-[#F4F4F5] underline"
              >
                Ligar todos
              </button>
              <button
                type="button"
                onClick={() => onSetCommunity(false)}
                className="text-[#A1A1AA] hover:text-[#F4F4F5] underline"
              >
                Desligar
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COMMUNITY_SOURCES.map((s) =>
            btn(
              s.id,
              s.label,
              s.author ? `${s.label} — ${s.author}` : s.label
            )
          )}
        </div>
      </div>
    </div>
  );
}

/** Helper puro: aplica toggle individual preservando ao menos 1 fonte ativa. */
export function toggleSourceList(
  current: ContentSource[] | undefined,
  src: ContentSource
): ContentSource[] {
  const list = current ?? DEFAULT_ENABLED_SOURCES;
  if (list.includes(src)) {
    return list.length === 1 ? list : list.filter((s) => s !== src);
  }
  return [...list, src];
}

export function setCommunityList(
  current: ContentSource[] | undefined,
  on: boolean
): ContentSource[] {
  const list = current ?? DEFAULT_ENABLED_SOURCES;
  const base = list.filter((s) => !isCommunitySource(s));
  return on ? [...base, ...COMMUNITY_SOURCES.map((s) => s.id)] : base;
}
