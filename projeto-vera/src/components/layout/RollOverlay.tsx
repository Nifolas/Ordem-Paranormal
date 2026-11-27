"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Dices,
  History,
  Minus,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { rollOrdemTest } from "@/lib/ordem-rules";
import { drawBaralhoInfinitoCard } from "@/data/supplements";
import { cn, ELEMENT_STYLES, formatSigned } from "@/lib/utils";
import { FreeDiceRoller } from "@/components/FreeDiceRoller";
import { Button, Input } from "@/components/ui/primitives";
import type { RollRecord } from "@/types/ordem";

function RollCard({
  record,
  compact = false,
  onDismiss,
}: {
  record: RollRecord;
  compact?: boolean;
  onDismiss?: () => void;
}) {
  const isCrit = Boolean(
    record.isNat20 || record.isCriticalThreat || record.isCriticalDamage
  );
  const isDisaster = Boolean(record.isNat1);
  const elemStyle = record.element ? ELEMENT_STYLES[record.element] : null;

  return (
    <div
      className={cn(
        "relative rounded-md border border-[#22222A] border-l-[3px] bg-[#101014] p-3.5 shadow-xl transition-colors",
        !compact && "animate-slide-up-fade",
        isCrit
          ? "border-l-amber-400 border-[#32323E]"
          : isDisaster
          ? "border-l-[#DC2626] animate-disaster-shake"
          : elemStyle
          ? elemStyle.borderLeft
          : "border-l-[#525266]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] truncate">
              {record.actorName}
            </span>
            {record.isNat20 && (
              <span className="inline-flex items-center gap-0.5 rounded-sm bg-amber-500/10 px-1.5 py-0.2 font-mono text-[10px] font-bold text-amber-300 border border-amber-500/30">
                <Sparkles className="h-2.5 w-2.5" /> 20 NAT
              </span>
            )}
            {record.isCriticalThreat && !record.isNat20 && (
              <span className="inline-flex items-center gap-0.5 rounded-sm bg-amber-500/10 px-1.5 py-0.2 font-mono text-[10px] font-bold text-amber-300 border border-amber-500/30">
                CRÍTICO
              </span>
            )}
            {record.isCriticalDamage && (
              <span className="inline-flex items-center gap-0.5 rounded-sm bg-red-600/10 px-1.5 py-0.2 font-mono text-[10px] font-bold text-red-400 border border-red-600/30">
                DANO CRÍTICO
              </span>
            )}
            {record.isNat1 && (
              <span className="inline-flex items-center gap-0.5 rounded-sm bg-red-600/10 px-1.5 py-0.2 font-mono text-[10px] font-bold text-red-400 border border-red-600/30">
                <AlertTriangle className="h-2.5 w-2.5" /> 1 NAT
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-[#F4F4F5] truncate mt-0.5">
            {record.label}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div
            className={cn(
              "font-mono text-2xl font-bold leading-none px-2.5 py-1 rounded-sm border",
              isCrit
                ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
                : isDisaster
                ? "text-red-400 bg-red-600/10 border-red-600/30"
                : "text-[#F4F4F5] bg-[#16161C] border-[#22222A]"
            )}
          >
            {record.total}
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-sm p-1 text-[#6E6E7E] hover:text-[#F4F4F5]"
              aria-label="Dispensar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {record.diceRolled.length > 0 && (
        <div className="mt-2.5 flex items-center flex-wrap gap-1">
          {record.diceRolled.map((die, idx) => {
            const isChosen =
              record.mode !== "sum" &&
              record.chosenDie !== undefined &&
              die === record.chosenDie &&
              record.diceRolled.indexOf(record.chosenDie) === idx;

            return (
              <span
                key={`${record.id}-d-${idx}`}
                className={cn(
                  "inline-flex h-6 min-w-[26px] items-center justify-center rounded-sm px-1.5 font-mono text-xs font-semibold border",
                  record.mode === "sum"
                    ? "bg-[#16161C] text-[#F4F4F5] border-[#22222A]"
                    : isChosen
                    ? die === 20
                      ? "bg-amber-500/15 text-amber-200 border-amber-500/50"
                      : die === 1
                      ? "bg-red-600/15 text-red-300 border-red-600/50"
                      : "bg-[#F4F4F5] text-[#09090B] border-[#F4F4F5]"
                    : "bg-[#09090B] text-[#6E6E7E] border-[#22222A] line-through"
                )}
              >
                {die}
              </span>
            );
          })}
          {record.bonus !== 0 && (
            <span className="font-mono text-xs text-[#8E8E9E] ml-1">
              {formatSigned(record.bonus)}
            </span>
          )}
          <span className="ml-auto font-mono text-[10px] text-[#6E6E7E]">
            {record.formula}
          </span>
        </div>
      )}

      {record.details && (
        <p className="mt-2 text-xs text-[#8E8E9E] leading-relaxed">
          {record.details}
        </p>
      )}
    </div>
  );
}

export function RollOverlay() {
  const {
    activeToasts,
    dismissToast,
    quickRollerOpen,
    setQuickRollerOpen,
    quickDiceMod,
    setQuickDiceMod,
    rollHistory,
    clearRollHistory,
    pushRoll,
  } = useAppStore();

  const [attrPool, setAttrPool] = useState(2);
  const [attrBonus, setAttrBonus] = useState(5);
  const [lastDrawnCard, setLastDrawnCard] = useState<{
    total: number;
    dice: [number, number];
    carta: string;
    efeito: string;
  } | null>(null);

  const handleDrawBaralhoInfinito = () => {
    const drawn = drawBaralhoInfinitoCard();
    setLastDrawnCard({
      total: drawn.total,
      dice: drawn.dice,
      carta: drawn.card.carta,
      efeito: drawn.card.efeito,
    });
    pushRoll({
      actorName: "Rolador Rápido",
      label: `Baralho Infinito (2d12): ${drawn.card.carta}`,
      kind: "free",
      element: "Energia",
      formula: "2d12",
      diceRolled: drawn.dice,
      mode: "sum",
      bonus: 0,
      total: drawn.total,
      details: `[${drawn.card.valor}] ${drawn.card.carta} — ${drawn.card.efeito}`,
    });
  };

  const handleOrdemQuickTest = () => {
    const res = rollOrdemTest({
      attributeValue: attrPool,
      bonus: attrBonus,
      bonusDice: quickDiceMod,
    });
    pushRoll({
      actorName: "Rolador Rápido",
      label: `Teste d20 (Atrib ${attrPool}${
        quickDiceMod !== 0 ? ` ${formatSigned(quickDiceMod)}d` : ""
      })`,
      kind: "attribute",
      formula: res.formula,
      diceRolled: res.diceRolled,
      chosenDie: res.chosenDie,
      mode: res.mode,
      bonus: res.bonus,
      total: res.total,
      isNat20: res.isNat20,
      isNat1: res.isNat1,
      details:
        res.mode === "highest"
          ? "Regra Ordem: selecionou o MAIOR d20."
          : "Regra Ordem (≤0): selecionou o MENOR d20.",
    });
  };

  return (
    <>
      {/* Toast Stack */}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {activeToasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <RollCard
              record={toast}
              onDismiss={() => dismissToast(toast.id)}
            />
          </div>
        ))}
      </div>

      {/* Quick Roller Drawer */}
      {quickRollerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/75"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setQuickRollerOpen(false);
          }}
        >
          <aside className="flex h-full w-full max-w-md flex-col border-l border-[#22222A] bg-[#09090B]">
            <div className="flex items-center justify-between border-b border-[#22222A] bg-[#101014] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Dices className="h-4 w-4 text-[#F4F4F5]" />
                <div>
                  <h2 className="font-display text-sm font-semibold text-[#F4F4F5]">
                    Rolador & Registro de Dados
                  </h2>
                  <p className="text-[11px] text-[#8E8E9E]">
                    Modificador global afeta testes de atributo e perícia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickRollerOpen(false)}
                className="rounded-sm p-1.5 text-[#8E8E9E] hover:bg-[#16161C] hover:text-[#F4F4F5]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Global ±1d20 */}
              <div className="rounded-md border border-[#22222A] bg-[#101014] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8E8E9E]">
                    Modificador Global d20
                  </span>
                  {quickDiceMod !== 0 && (
                    <button
                      type="button"
                      onClick={() => setQuickDiceMod(0)}
                      className="font-mono text-[10px] text-[#D4D4D8] underline"
                    >
                      Zerar
                    </button>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuickDiceMod(quickDiceMod - 1)}
                  >
                    <Minus className="h-3.5 w-3.5" /> 1d20
                  </Button>
                  <span className="font-mono text-base font-bold text-[#F4F4F5]">
                    {quickDiceMod === 0
                      ? "0d20 (Normal)"
                      : `${formatSigned(quickDiceMod)}d20`}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuickDiceMod(quickDiceMod + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" /> 1d20
                  </Button>
                </div>
              </div>

              {/* Ordem Pool Test */}
              <div className="rounded-md border border-[#22222A] bg-[#101014] p-4 space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8E8E9E]">
                  Teste Padrão (Ordem v1.2)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#8E8E9E] block mb-1">
                      Atributo (-2 a 6)
                    </label>
                    <Input
                      type="number"
                      min={-2}
                      max={10}
                      value={attrPool}
                      onChange={(e) => setAttrPool(Number(e.target.value) || 0)}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8E8E9E] block mb-1">
                      Bônus de Perícia
                    </label>
                    <Input
                      type="number"
                      value={attrBonus}
                      onChange={(e) => setAttrBonus(Number(e.target.value) || 0)}
                      className="font-mono"
                    />
                  </div>
                </div>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleOrdemQuickTest}
                >
                  <Dices className="h-4 w-4" /> Rolar Teste d20
                </Button>
              </div>

              {/* Free Dice Roller (d4, d6, d8, d10, d12, d20 + formula) */}
              <FreeDiceRoller actorName="Rolador Rápido" />

              {/* Baralho Infinito (2d12 — Grimório do Cataclisma) */}
              <div className="rounded-md border border-[#22222A] bg-[#101014] p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8E8E9E]">
                    Baralho Infinito · Grimório do Cataclisma
                  </span>
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={handleDrawBaralhoInfinito}
                    className="font-mono"
                  >
                    <Sparkles className="h-3 w-3" /> Baralho Infinito (2d12)
                  </Button>
                </div>
                {lastDrawnCard && (
                  <div className="rounded-sm border border-[#2C2C38] bg-[#0B0B0F] p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-purple-300">
                        {lastDrawnCard.carta}
                      </span>
                      <span className="text-[#8E8E9E]">
                        2d12 [{lastDrawnCard.dice.join("+")}] ={" "}
                        <strong className="text-[#F4F4F5]">
                          {lastDrawnCard.total}
                        </strong>
                      </span>
                    </div>
                    <p className="text-[11px] text-[#D4D4D8]">
                      {lastDrawnCard.efeito}
                    </p>
                  </div>
                )}
              </div>

              {/* History */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8E8E9E]">
                    <History className="h-3.5 w-3.5" />
                    Histórico ({rollHistory.length})
                  </div>
                  {rollHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={clearRollHistory}
                      className="inline-flex items-center gap-1 font-mono text-[10px] text-[#8E8E9E] hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" /> Limpar
                    </button>
                  )}
                </div>

                {rollHistory.length === 0 ? (
                  <div className="rounded-md border border-dashed border-[#22222A] p-6 text-center text-xs text-[#6E6E7E]">
                    Nenhuma rolagem registrada.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rollHistory.slice(0, 30).map((record) => (
                      <RollCard key={record.id} record={record} compact />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
