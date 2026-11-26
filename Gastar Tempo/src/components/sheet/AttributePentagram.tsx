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

const NODES: AttributeNode[] = [
  { key: "AGI", label: "AGILIDADE", x: 140, y: 40 },
  { key: "INT", label: "INTELECTO", x: 232, y: 106 },
  { key: "VIG", label: "VIGOR", x: 198, y: 212 },
  { key: "PRE", label: "PRESENÇA", x: 82, y: 212 },
  { key: "FOR", label: "FORÇA", x: 48, y: 106 },
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
    <div className="rounded-md border border-[#22222A] bg-[#101014] p-4">
      <div className="flex items-center justify-between border-b border-[#22222A] pb-2.5 mb-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8E8E9E]">
          ATRIBUTOS // PENTAGRAMA
        </span>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors border",
            editing
              ? "border-emerald-600/40 bg-emerald-600/10 text-emerald-300"
              : "border-[#22222A] bg-[#16161C] text-[#8E8E9E] hover:text-[#F4F4F5] hover:border-[#32323E]"
          )}
        >
          {editing ? (
            <>
              <Check className="h-3 w-3" /> Salvar
            </>
          ) : (
            <>
              <Edit3 className="h-3 w-3" /> Editar
            </>
          )}
        </button>
      </div>

      <div className="relative mx-auto w-full max-w-[260px] aspect-[280/254]">
        <svg
          viewBox="0 0 280 254"
          className="h-full w-full select-none"
          aria-label="Pentagrama de Atributos"
        >
          {/* Minimalist hairline geometry — zero neon glow */}
          <circle
            cx="140"
            cy="132"
            r="96"
            fill="none"
            stroke="#22222A"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
          <polygon
            points={outerPolygon}
            fill="none"
            stroke="#2E2E3A"
            strokeWidth="1"
          />
          <polygon
            points={starPoints}
            fill="none"
            stroke="#2E2E3A"
            strokeWidth="1"
            strokeLinejoin="miter"
          />
          <circle cx="140" cy="132" r="2" fill="#3A3A48" />
          <text
            x="140"
            y="148"
            textAnchor="middle"
            className="fill-[#6E6E7E] font-mono text-[8px] tracking-[0.18em]"
          >
            {editing ? "EDIÇÃO" : "1-CLIQUE ROLA"}
          </text>
        </svg>

        {NODES.map((node) => {
          const val = attributes[node.key];
          const leftPct = (node.x / 280) * 100;
          const topPct = (node.y / 254) * 100;

          return (
            <div
              key={node.key}
              style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            >
              {editing ? (
                <div className="flex flex-col items-center rounded-sm border border-[#525266] bg-[#09090B] px-1.5 py-1">
                  <span className="font-mono text-[9px] font-semibold tracking-widest text-[#8E8E9E]">
                    {node.key}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        onChangeAttribute(node.key, Math.max(0, val - 1))
                      }
                      className="h-5 w-5 rounded-sm bg-[#16161C] border border-[#22222A] text-xs font-mono text-[#D4D4D8] hover:border-[#525266]"
                    >
                      -
                    </button>
                    <span className="font-mono text-sm font-bold text-[#F4F4F5] w-4 text-center">
                      {val}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onChangeAttribute(node.key, Math.min(10, val + 1))
                      }
                      className="h-5 w-5 rounded-sm bg-[#16161C] border border-[#22222A] text-xs font-mono text-[#D4D4D8] hover:border-[#525266]"
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onRollAttribute(node.key)}
                  title={`Rolar teste de ${node.label} (${
                    val > 0 ? `${val}d20 maior` : `${2 + Math.abs(val)}d20 menor`
                  })`}
                  className="group flex h-12 w-12 flex-col items-center justify-center rounded-sm border border-[#2E2E3A] bg-[#09090B] transition-colors duration-150 hover:border-[#F4F4F5] hover:bg-[#16161C] focus:outline-none focus:ring-1 focus:ring-zinc-400"
                >
                  <span className="font-mono text-[9px] font-semibold tracking-[0.14em] text-[#8E8E9E] group-hover:text-[#F4F4F5]">
                    {node.key}
                  </span>
                  <span className="font-mono text-lg font-bold leading-none text-[#F4F4F5] mt-0.5">
                    {val}
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
