"use client";

import React, { useState } from "react";
import { Dices, Minus, Plus, RotateCcw } from "lucide-react";
import { rollDiceFormula } from "@/lib/ordem-rules";
import { cn, formatSigned } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { Button, Input } from "@/components/ui/primitives";

type DieSides = 4 | 6 | 8 | 10 | 12 | 20;
type RollPoolMode = "sum" | "highest" | "lowest";

const DICE_LIST: DieSides[] = [4, 6, 8, 10, 12, 20];

interface LooseRollPreview {
  formula: string;
  sides: number | null;
  rolls: number[];
  chosen?: number;
  mode: RollPoolMode;
  modifier: number;
  total: number;
  hasMaxFace: boolean;
  hasNat1: boolean;
}

function DieSvg({
  sides,
  className = "w-5 h-5",
}: {
  sides: DieSides;
  className?: string;
}) {
  switch (sides) {
    case 4:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <polygon
            points="12,3 21,19 3,19"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <line x1="12" y1="3" x2="12" y2="19" stroke="currentColor" strokeWidth="1" strokeOpacity="0.45" />
        </svg>
      );
    case 6:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="9" cy="9" r="1" fill="currentColor" fillOpacity="0.55" />
          <circle cx="15" cy="15" r="1" fill="currentColor" fillOpacity="0.55" />
        </svg>
      );
    case 8:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <polygon
            points="12,2.5 21,12 12,21.5 3,12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.45" />
        </svg>
      );
    case 10:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <polygon
            points="12,2.5 20.5,10.5 12,21.5 3.5,10.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <polyline
            points="3.5,10.5 12,13.5 20.5,10.5"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.5"
          />
        </svg>
      );
    case 12:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <polygon
            points="12,2.5 20.5,8.5 17.5,19.5 6.5,19.5 3.5,8.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <polygon
            points="12,7 16,10 14.5,15.5 9.5,15.5 8,10"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
        </svg>
      );
    case 20:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <polygon
            points="12,2.5 20.5,7.25 20.5,16.75 12,21.5 3.5,16.75 3.5,7.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <polygon
            points="12,6 17.5,15.5 6.5,15.5"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.45"
          />
        </svg>
      );
  }
}

export function FreeDiceRoller({
  actorName = "Dados Soltos",
  actorId,
  compact = false,
  className,
}: {
  actorName?: string;
  actorId?: string;
  compact?: boolean;
  className?: string;
}) {
  const { pushRoll } = useAppStore();

  const [quantity, setQuantity] = useState<number>(1);
  const [modifier, setModifier] = useState<number>(0);
  const [d20Mode, setD20Mode] = useState<RollPoolMode>("sum");
  const [customFormula, setCustomFormula] = useState<string>("");
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [lastRoll, setLastRoll] = useState<LooseRollPreview | null>(null);

  const rollSingleType = (sides: DieSides) => {
    setFormulaError(null);
    const rolls: number[] = [];
    for (let i = 0; i < quantity; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }

    const usePoolMode: RollPoolMode =
      sides === 20 && quantity > 1 ? d20Mode : "sum";

    let chosen: number | undefined;
    let total: number;
    let modeSuffix = "";

    if (usePoolMode === "highest") {
      chosen = Math.max(...rolls);
      total = chosen + modifier;
      modeSuffix = "(kh1)";
    } else if (usePoolMode === "lowest") {
      chosen = Math.min(...rolls);
      total = chosen + modifier;
      modeSuffix = "(kl1)";
    } else {
      total = rolls.reduce((a, b) => a + b, 0) + modifier;
    }

    const modStr = modifier !== 0 ? formatSigned(modifier) : "";
    const formula = `${quantity}d${sides}${modeSuffix}${modStr}`;

    const isSingleOrChosenMax =
      chosen !== undefined
        ? chosen === sides
        : rolls.some((r) => r === sides);
    const isSingleOrChosenNat1 =
      chosen !== undefined
        ? chosen === 1
        : rolls.length === 1 && rolls[0] === 1;

    setLastRoll({
      formula,
      sides,
      rolls,
      chosen,
      mode: usePoolMode,
      modifier,
      total,
      hasMaxFace: isSingleOrChosenMax,
      hasNat1: isSingleOrChosenNat1,
    });

    const modeDesc =
      usePoolMode === "highest"
        ? `Maior d20 entre [${rolls.join(", ")}]${modStr ? ` ${modStr}` : ""}`
        : usePoolMode === "lowest"
        ? `Menor d20 entre [${rolls.join(", ")}]${modStr ? ` ${modStr}` : ""}`
        : `[${rolls.join(" + ")}]${modStr ? ` ${modStr}` : ""} = ${total}`;

    pushRoll({
      actorName,
      actorId,
      label: `Dado Solto: ${formula}`,
      kind: "free",
      formula,
      diceRolled: rolls,
      chosenDie: chosen,
      mode: usePoolMode,
      bonus: modifier,
      total,
      isNat20: sides === 20 && isSingleOrChosenMax,
      isNat1: sides === 20 && isSingleOrChosenNat1,
      details: modeDesc,
    });
  };

  const handleCustomFormulaRoll = (e: React.FormEvent) => {
    e.preventDefault();
    const expr = customFormula.trim();
    if (!expr) return;
    try {
      const res = rollDiceFormula({ formula: expr });
      setFormulaError(null);
      setLastRoll({
        formula: res.effectiveFormula,
        sides: null,
        rolls: res.diceRolled,
        mode: "sum",
        modifier: res.bonus,
        total: res.total,
        hasMaxFace: false,
        hasNat1: res.diceRolled.length === 1 && res.diceRolled[0] === 1,
      });

      pushRoll({
        actorName,
        actorId,
        label: `Fórmula Livre: ${expr}`,
        kind: "free",
        formula: res.effectiveFormula,
        diceRolled: res.diceRolled,
        mode: "sum",
        bonus: res.bonus,
        total: res.total,
        details: res.breakdown,
      });
    } catch (err) {
      setFormulaError(err instanceof Error ? err.message : "Fórmula inválida");
    }
  };

  return (
    <div
      className={cn(
        "rounded-md border border-[#22222A] bg-[#101014] p-4 space-y-3",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#22222A] pb-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8E8E9E]">
          <Dices className="h-3 w-3 text-[#A1A1AA]" /> DADOS SOLTOS
        </span>
        {(quantity !== 1 || modifier !== 0) && (
          <button
            type="button"
            onClick={() => {
              setQuantity(1);
              setModifier(0);
            }}
            className="inline-flex items-center gap-1 font-mono text-[10px] text-[#8E8E9E] hover:text-[#F4F4F5] transition-colors"
            title="Resetar quantidade e modificador"
          >
            <RotateCcw className="h-2.5 w-2.5" /> Reset
          </button>
        )}
      </div>

      {/* 6 Geometric Dice Buttons */}
      <div
        className={cn(
          "grid gap-1.5",
          compact ? "grid-cols-3" : "grid-cols-3 sm:grid-cols-6"
        )}
      >
        {DICE_LIST.map((sides) => (
          <button
            key={sides}
            type="button"
            onClick={() => rollSingleType(sides)}
            className="group flex flex-col items-center justify-center gap-1 rounded-sm border border-[#22222A] bg-[#09090B] py-2 px-1 text-[#A1A1AA] hover:border-[#F4F4F5] hover:bg-[#16161C] hover:text-[#F4F4F5] active:scale-[0.97] transition-all"
            title={`Rolar ${quantity}d${sides}${
              modifier !== 0 ? formatSigned(modifier) : ""
            }`}
          >
            <DieSvg
              sides={sides}
              className="h-4 w-4 text-[#8E8E9E] group-hover:text-[#F4F4F5] transition-colors"
            />
            <span className="font-mono text-[11px] font-bold tracking-tight tabular-nums">
              {quantity > 1 ? `${quantity}d${sides}` : `d${sides}`}
            </span>
          </button>
        ))}
      </div>

      {/* Quantity & Modifier Steppers */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-sm border border-[#22222A] bg-[#09090B] px-2 py-1.5 flex items-center justify-between gap-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#6E6E7E]">
            QTD
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="h-5 w-5 inline-flex items-center justify-center rounded-sm bg-[#16161C] text-[#A1A1AA] hover:text-[#F4F4F5] disabled:opacity-35"
              aria-label="Diminuir quantidade de dados"
            >
              <Minus className="h-2.5 w-2.5" />
            </button>
            <button
              type="button"
              onClick={() => setQuantity(1)}
              className="min-w-[22px] text-center font-mono text-xs font-bold text-[#F4F4F5] tabular-nums"
              title="Clique para voltar para 1"
            >
              {quantity}
            </button>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              disabled={quantity >= 20}
              className="h-5 w-5 inline-flex items-center justify-center rounded-sm bg-[#16161C] text-[#A1A1AA] hover:text-[#F4F4F5] disabled:opacity-35"
              aria-label="Aumentar quantidade de dados"
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>

        <div className="rounded-sm border border-[#22222A] bg-[#09090B] px-2 py-1.5 flex items-center justify-between gap-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#6E6E7E]">
            MOD
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setModifier((m) => Math.max(-50, m - 1))}
              className="h-5 w-5 inline-flex items-center justify-center rounded-sm bg-[#16161C] text-[#A1A1AA] hover:text-[#F4F4F5]"
              aria-label="Diminuir modificador"
            >
              <Minus className="h-2.5 w-2.5" />
            </button>
            <button
              type="button"
              onClick={() => setModifier(0)}
              className={cn(
                "min-w-[26px] text-center font-mono text-xs font-bold tabular-nums",
                modifier > 0
                  ? "text-emerald-400"
                  : modifier < 0
                  ? "text-red-400"
                  : "text-[#D4D4D8]"
              )}
              title="Clique para zerar modificador"
            >
              {formatSigned(modifier)}
            </button>
            <button
              type="button"
              onClick={() => setModifier((m) => Math.min(50, m + 1))}
              className="h-5 w-5 inline-flex items-center justify-center rounded-sm bg-[#16161C] text-[#A1A1AA] hover:text-[#F4F4F5]"
              aria-label="Aumentar modificador"
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mode toggle for multiple d20 */}
      {quantity > 1 && (
        <div className="flex items-center justify-between gap-2 rounded-sm border border-[#1E1E26] bg-[#0C0C10] px-2 py-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#6E6E7E]">
            MODO d20
          </span>
          <div className="flex items-center gap-1">
            {(
              [
                { id: "sum" as const, label: "Somar" },
                { id: "highest" as const, label: "Maior" },
                { id: "lowest" as const, label: "Menor" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setD20Mode(opt.id)}
                className={cn(
                  "rounded-sm px-1.5 py-0.5 font-mono text-[10px] transition-colors",
                  d20Mode === opt.id
                    ? "bg-[#F4F4F5] text-[#09090B] font-semibold"
                    : "text-[#8E8E9E] hover:text-[#F4F4F5]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Free Formula */}
      <form onSubmit={handleCustomFormulaRoll} className="flex gap-1.5">
        <Input
          value={customFormula}
          onChange={(e) => setCustomFormula(e.target.value)}
          placeholder="Ex: 2d6+1d4+3"
          className="h-8 font-mono text-xs"
          aria-label="Fórmula livre de dados"
        />
        <Button type="submit" size="xs" variant="default" className="px-3">
          Rolar
        </Button>
      </form>
      {formulaError && (
        <p className="font-mono text-[10px] text-red-400">{formulaError}</p>
      )}

      {/* Instant Last Result Preview */}
      {lastRoll && (
        <div
          className={cn(
            "rounded-sm border bg-[#09090B] px-3 py-2 font-mono text-xs space-y-1",
            lastRoll.hasMaxFace
              ? "border-amber-500/40"
              : lastRoll.hasNat1
              ? "border-red-600/40"
              : "border-[#22222A]"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-[#8E8E9E] truncate">
              {lastRoll.formula}
            </span>
            <span
              className={cn(
                "text-base font-bold tabular-nums",
                lastRoll.hasMaxFace
                  ? "text-amber-300"
                  : lastRoll.hasNat1
                  ? "text-red-400"
                  : "text-[#F4F4F5]"
              )}
            >
              = {lastRoll.total}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1 text-[10px]">
            {lastRoll.rolls.map((val, idx) => {
              const isMax = lastRoll.sides !== null && val === lastRoll.sides;
              const isOne = val === 1;
              const isDiscarded =
                lastRoll.mode !== "sum" &&
                lastRoll.chosen !== undefined &&
                !(
                  val === lastRoll.chosen &&
                  lastRoll.rolls.indexOf(lastRoll.chosen) === idx
                );
              return (
                <span
                  key={idx}
                  className={cn(
                    "inline-flex min-w-[20px] justify-center rounded-sm border px-1 py-0.2 tabular-nums",
                    isDiscarded
                      ? "border-[#1E1E26] text-[#52525E] line-through"
                      : isMax
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold"
                      : isOne
                      ? "border-red-600/40 bg-red-600/10 text-red-400 font-bold"
                      : "border-[#22222A] bg-[#141419] text-[#D4D4D8]"
                  )}
                >
                  {val}
                </span>
              );
            })}
            {lastRoll.modifier !== 0 && (
              <span className="text-[#8E8E9E] ml-0.5">
                {formatSigned(lastRoll.modifier)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
