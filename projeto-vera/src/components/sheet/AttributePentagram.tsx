"use client";

import React, { useState } from "react";
import { Check, Edit3 } from "lucide-react";
import type { AttributeKey } from "@/types/ordem";
import { cn } from "@/lib/utils";

interface AttributeNode {
  key: AttributeKey;
  label: string;
  x: number;
  y: number;
}

/**
 * Coordenadas do pentagrama regular em viewBox 320x300 (centro em 160, 156, raio 104)
 */
const NODES: AttributeNode[] = [
  { key: "AGI", label: "AGILIDADE", x: 160, y: 50 },
  { key: "INT", label: "INTELECTO", x: 260, y: 123 },
  { key: "VIG", label: "VIGOR", x: 222, y: 242 },
  { key: "PRE", label: "PRESENÇA", x: 98, y: 242 },
  { key: "FOR", label: "FORÇA", x: 60, y: 123 },
];

export function AttributePentagram({
  attributes,
  onRollAttribute,
  onChangeAttribute,
}: {
  attributes: Record<AttributeKey, number>;
  onRollAttribute: (key: AttributeKey) => void;
  onChangeAttribute: (key: AttributeKey, value: number) => void;
}) {
  const [editing, setEditing] = useState(false);

  const starPoints = [NODES[0], NODES[2], NODES[4], NODES[1], NODES[3]]
    .map((n) => `${n.x},${n.y}`)
    .join(" ");

  const outerPolygon = NODES.map((n) => `${n.x},${n.y}`).join(" ");

  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/85 backdrop-blur-sm p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-display text-xs font-bold uppercase tracking-wider text-zinc-100">
            Atributos
          </span>
          <span className="text-[11px] text-zinc-400">
            {editing ? "Modo edição" : "Clique no atributo para rolar"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors border",
            editing
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-white/10 bg-[#14141A] text-zinc-400 hover:text-zinc-100 hover:border-white/25"
          )}
        >
          {editing ? (
            <>
              <Check className="h-3 w-3" /> Concluir
            </>
          ) : (
            <>
              <Edit3 className="h-3 w-3" /> Editar
            </>
          )}
        </button>
      </div>

      {/* Pentagrama Grande e Legível (estilo C.R.I.S.) */}
      <div className="relative mx-auto w-full max-w-[308px] aspect-[320/300]">
        <svg
          viewBox="0 0 320 300"
          className="h-full w-full select-none"
          aria-label="Pentagrama de Atributos"
        >
          {/* Círculos guia e geometria do pentagrama */}
          <circle
            cx="160"
            cy="156"
            r="106"
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="1.5"
          />
          <circle
            cx="160"
            cy="156"
            r="96"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          <polygon
            points={outerPolygon}
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.25"
          />
          <polygon
            points={starPoints}
            fill="none"
            stroke="rgba(255,255,255,0.20)"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />

          {/* Rótulo central "ATRIBUTOS" no miolo do pentagrama */}
          <circle
            cx="160"
            cy="156"
            r="34"
            fill="#09090B"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.2"
          />
          <text
            x="160"
            y="159"
            textAnchor="middle"
            className="fill-zinc-300 font-display text-[9px] font-bold tracking-[0.2em]"
          >
            ATRIBUTOS
          </text>
        </svg>

        {NODES.map((node) => {
          const val = attributes[node.key];
          const leftPct = (node.x / 320) * 100;
          const topPct = (node.y / 300) * 100;

          return (
            <div
              key={node.key}
              style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            >
              {editing ? (
                <div className="flex h-[78px] w-[78px] flex-col items-center justify-center rounded-full border-2 border-zinc-200 bg-[#09090B] shadow-[0_0_18px_rgba(255,255,255,0.14)]">
                  <span className="font-mono text-[10px] font-bold tracking-wider text-zinc-300">
                    {node.key}
                  </span>
                  <div className="flex items-center gap-1 my-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        onChangeAttribute(node.key, Math.max(0, val - 1))
                      }
                      className="h-5 w-5 rounded-full bg-zinc-900 border border-white/25 text-xs font-mono font-bold text-zinc-100 hover:bg-zinc-800 hover:border-white"
                      aria-label={`Diminuir ${node.label}`}
                    >
                      -
                    </button>
                    <span className="font-mono text-xl font-bold text-white w-5 text-center tabular-nums">
                      {val}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onChangeAttribute(node.key, Math.min(10, val + 1))
                      }
                      className="h-5 w-5 rounded-full bg-zinc-900 border border-white/25 text-xs font-mono font-bold text-zinc-100 hover:bg-zinc-800 hover:border-white"
                      aria-label={`Aumentar ${node.label}`}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[7px] font-semibold uppercase tracking-wider text-zinc-400">
                    {node.label}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onRollAttribute(node.key)}
                  title={`Clique para rolar ${node.label} (${
                    val > 0 ? `${val}d20 maior` : `${2 + Math.abs(val)}d20 menor`
                  })`}
                  className="group flex h-[78px] w-[78px] flex-col items-center justify-center rounded-full border-2 border-zinc-300/85 bg-[#09090B] shadow-[0_4px_16px_rgba(0,0,0,0.75)] transition-all duration-150 hover:border-white hover:bg-[#121218] hover:shadow-[0_0_20px_rgba(255,255,255,0.22)] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/60"
                >
                  {/* Número grande em destaque */}
                  <span className="font-mono text-2xl sm:text-3xl font-extrabold leading-none text-white tabular-nums tracking-tight">
                    {val}
                  </span>
                  {/* Nome completo discreto */}
                  <span className="mt-1 text-[7.5px] font-medium uppercase tracking-[0.12em] text-zinc-400 group-hover:text-zinc-300 leading-none">
                    {node.label}
                  </span>
                  {/* Sigla em destaque */}
                  <span className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-200 group-hover:text-white leading-none">
                    {node.key}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
