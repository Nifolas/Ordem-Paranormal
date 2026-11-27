"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertOctagon,
  Brain,
  ChevronDown,
  ChevronUp,
  Dices,
  Footprints,
  Heart,
  Lock,
  Minus,
  Pencil,
  Plus,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Swords,
  Trash2,
  Unlock,
  Wind,
  X,
  Zap,
} from "lucide-react";
import type { GlossaryTermKey } from "@/lib/glossary";
import type { Agent, AttributeKey } from "@/types/ordem";
import { getOriginById } from "@/data/origins";
import { COMMUNITY_CONDITIONS } from "@/data/supplements";
import {
  calculateCombatStats,
  calculateLoadAndCategories,
  evaluateVitalConditions,
  getAgentEffectiveVitals,
  getTrailCarryBonus,
} from "@/lib/ordem-rules";
import { clamp, cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { AttributePentagram } from "./AttributePentagram";
import { TermTooltip } from "@/components/ui/TermTooltip";
import {
  Badge,
  Button,
  Card,
  Input,
  NumericInput,
  Select,
} from "@/components/ui/primitives";

const COMMON_DAMAGE_TYPES = [
  "Balístico",
  "Corte",
  "Impacto",
  "Perfuração",
  "Fogo",
  "Frio",
  "Eletricidade",
  "Químico",
  "Mental",
  "Sangue",
  "Morte",
  "Conhecimento",
  "Energia",
];

function VitalStackBar({
  label,
  glossaryTerm,
  icon: Icon,
  accentClass,
  barColor,
  current,
  temp,
  max,
  autoCalc,
  alertBadge,
  onAdjust,
  onSetCurrent,
  onSetTemp,
  onToggleAuto,
  onSetMaxOverride,
}: {
  label: string;
  glossaryTerm?: GlossaryTermKey;
  icon?: React.ComponentType<{ className?: string }>;
  accentClass: string;
  barColor: string;
  current: number;
  temp?: number;
  max: number;
  autoCalc: boolean;
  alertBadge?: string | null;
  onAdjust: (delta: number) => void;
  onSetCurrent: (val: number) => void;
  onSetTemp?: (val: number) => void;
  onToggleAuto: () => void;
  onSetMaxOverride: (val: number) => void;
}) {
  const pct = max > 0 ? clamp((current / max) * 100, 0, 100) : 0;
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showTempInput, setShowTempInput] = useState(false);
  const [popoverCoords, setPopoverCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const portalPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popoverOpen) return;
    const updatePosition = () => {
      if (!popoverRef.current) return;
      const rect = popoverRef.current.getBoundingClientRect();
      setPopoverCoords({
        top: rect.bottom + 6,
        left: Math.max(
          8,
          Math.min(
            rect.left,
            window.innerWidth - Math.max(rect.width, 250) - 8
          )
        ),
        width: Math.max(rect.width, 250),
      });
    };
    updatePosition();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        (!portalPopoverRef.current || !portalPopoverRef.current.contains(target))
      ) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [popoverOpen]);

  const hasTemp = (temp ?? 0) > 0;

  return (
    <div
      ref={popoverRef}
      className="relative rounded-lg border border-white/10 bg-[#0C0C10]/95 px-3.5 py-2.5 space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", accentClass)} />}
          <span
            className={cn(
              "font-display text-xs font-bold uppercase tracking-wider",
              accentClass
            )}
          >
            {glossaryTerm ? (
              <TermTooltip term={glossaryTerm} label={label} showIcon={false} />
            ) : (
              label
            )}
          </span>
          {alertBadge && (
            <span className="rounded-sm border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-amber-300">
              {alertBadge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="inline-flex items-center rounded-md border border-white/10 bg-[#121218] p-0.5">
            <button
              type="button"
              onClick={() => onAdjust(-1)}
              className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-white/10 hover:text-zinc-100 transition-colors"
              title={`Diminuir 1 ${label}`}
              aria-label={`Diminuir 1 ${label}`}
            >
              <Minus className="h-3 w-3" />
            </button>

            <button
              type="button"
              onClick={() => setPopoverOpen((v) => !v)}
              title="Clique para ajustes rápidos (-5 / +5) ou editar máximo"
              className="px-2 py-0.5 font-mono text-sm font-bold text-zinc-100 hover:text-white tabular-nums transition-colors"
            >
              <span>{current}</span>
              <span className="mx-1 text-zinc-500 font-normal">/</span>
              <span className="text-zinc-300 font-semibold">{max}</span>
              {hasTemp && (
                <span className="ml-1 text-xs font-semibold text-emerald-400">
                  +{temp}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onAdjust(1)}
              className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-white/10 hover:text-zinc-100 transition-colors"
              title={`Aumentar 1 ${label}`}
              aria-label={`Aumentar 1 ${label}`}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {onSetTemp && (
            <button
              type="button"
              onClick={() => setShowTempInput((v) => !v)}
              title="Pontos temporários"
              className={cn(
                "h-7 rounded-md border px-1.5 font-mono text-[10px] font-medium transition-colors",
                hasTemp || showTempInput
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-[#121218] text-zinc-400 hover:text-zinc-200"
              )}
            >
              {hasTemp ? `TMP +${temp}` : "+TMP"}
            </button>
          )}
        </div>
      </div>

      <div className="h-2.5 w-full rounded-full bg-zinc-900 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-200",
            barColor
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {onSetTemp && showTempInput && (
        <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
            {label} Temporário
          </span>
          <div className="flex items-center gap-1">
            <NumericInput
              min={0}
              value={temp ?? 0}
              onValueChange={(val) => onSetTemp(Math.max(0, val))}
              aria-label={`${label} temporário`}
              className="h-6 w-14 rounded bg-zinc-950 border border-white/15 px-1.5 font-mono text-xs font-semibold text-emerald-300 text-center focus:outline-none tabular-nums"
            />
            {(temp ?? 0) > 0 && (
              <button
                type="button"
                onClick={() => {
                  onSetTemp(0);
                  setShowTempInput(false);
                }}
                className="rounded px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 hover:text-red-300"
              >
                Zerar
              </button>
            )}
          </div>
        </div>
      )}

      {popoverOpen &&
        popoverCoords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={portalPopoverRef}
            style={{
              top: popoverCoords.top,
              left: popoverCoords.left,
              width: popoverCoords.width,
            }}
            className="fixed z-[110] rounded-lg border border-white/20 bg-[#121218] p-3 shadow-2xl space-y-2.5 text-[#F4F4F5]"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                Ajuste Rápido de {label}
              </span>
              <button
                type="button"
                onClick={() => setPopoverOpen(false)}
                className="text-zinc-400 hover:text-zinc-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[-5, -1, 1, 5].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => onAdjust(delta)}
                  className="rounded border border-white/10 bg-zinc-950 py-1 font-mono text-xs font-semibold text-zinc-200 hover:border-white/25 hover:bg-zinc-900 transition-colors"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-xs">
              <div>
                <label className="font-mono text-[10px] text-zinc-400 block mb-1">
                  Valor Atual
                </label>
                <NumericInput
                  value={current}
                  onValueChange={(val) => onSetCurrent(Math.max(0, val))}
                  aria-label={`${label} atual`}
                  className="h-7 w-full rounded bg-zinc-950 border border-white/15 px-2 font-mono text-xs font-bold text-zinc-100 text-center"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-mono text-[10px] text-zinc-400">
                    Máximo
                  </label>
                  <button
                    type="button"
                    onClick={onToggleAuto}
                    className="inline-flex items-center gap-0.5 font-mono text-[9px] text-zinc-400 hover:text-zinc-100"
                    title={
                      autoCalc
                        ? "Cálculo automático ativo — clique para editar manualmente"
                        : "Máximo manual — clique para voltar ao automático"
                    }
                  >
                    {autoCalc ? (
                      <>
                        <Lock className="h-2.5 w-2.5" /> Auto
                      </>
                    ) : (
                      <>
                        <Unlock className="h-2.5 w-2.5 text-amber-300" /> Manual
                      </>
                    )}
                  </button>
                </div>
                {autoCalc ? (
                  <div className="h-7 flex items-center justify-center rounded border border-white/10 bg-zinc-950/60 font-mono text-xs font-semibold text-zinc-400">
                    {max}
                  </div>
                ) : (
                  <NumericInput
                    min={1}
                    fallback={1}
                    value={max}
                    onValueChange={(val) => onSetMaxOverride(Math.max(1, val))}
                    aria-label={`${label} máximo manual`}
                    className="h-7 w-full rounded bg-zinc-950 border border-amber-500/40 px-2 font-mono text-xs font-bold text-zinc-100 text-center"
                  />
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export function LeftColumn({
  agent,
  onUpdate,
  onRollAttribute,
}: {
  agent: Agent;
  onUpdate: (updater: (prev: Agent) => Agent) => void;
  onRollAttribute: (key: AttributeKey) => void;
}) {
  const { setQuickRollerOpen } = useAppStore();
  const [newResType, setNewResType] = useState("Balístico");
  const [newResVal, setNewResVal] = useState(5);

  const [condPopoverOpen, setCondPopoverOpen] = useState(false);
  const [rdPopoverOpen, setRdPopoverOpen] = useState(false);
  const [defAdjustOpen, setDefAdjustOpen] = useState(false);
  const [sheetEditor, setSheetEditor] = useState<"defense" | "peTurno" | null>(null);
  const [sheetEditorCoords, setSheetEditorCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [condCoords, setCondCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [rdCoords, setRdCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const condRef = useRef<HTMLDivElement>(null);
  const condPortalRef = useRef<HTMLDivElement>(null);
  const rdRef = useRef<HTMLDivElement>(null);
  const rdPortalRef = useRef<HTMLDivElement>(null);
  const defenseEditTriggerRef = useRef<HTMLButtonElement>(null);
  const peTurnoEditTriggerRef = useRef<HTMLButtonElement>(null);
  const sheetEditorPortalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!condPopoverOpen && !rdPopoverOpen) return;
    const updatePositions = () => {
      if (condPopoverOpen && condRef.current) {
        const rect = condRef.current.getBoundingClientRect();
        setCondCoords({
          top: rect.top + 32,
          left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
          width: rect.width,
        });
      }
      if (rdPopoverOpen && rdRef.current) {
        const rect = rdRef.current.getBoundingClientRect();
        setRdCoords({
          top: rect.top + 36,
          left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
          width: rect.width,
        });
      }
    };
    updatePositions();
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        condPopoverOpen &&
        condRef.current &&
        !condRef.current.contains(target) &&
        (!condPortalRef.current || !condPortalRef.current.contains(target))
      ) {
        setCondPopoverOpen(false);
      }
      if (
        rdPopoverOpen &&
        rdRef.current &&
        !rdRef.current.contains(target) &&
        (!rdPortalRef.current || !rdPortalRef.current.contains(target))
      ) {
        setRdPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", updatePositions, true);
    window.addEventListener("resize", updatePositions);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", updatePositions, true);
      window.removeEventListener("resize", updatePositions);
    };
  }, [condPopoverOpen, rdPopoverOpen]);

  useEffect(() => {
    if (!sheetEditor) return;
    const updatePosition = () => {
      const trigger =
        sheetEditor === "defense"
          ? defenseEditTriggerRef.current
          : peTurnoEditTriggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(360, window.innerWidth - 16);
      const estimatedHeight = sheetEditor === "defense" ? 450 : 300;
      let top = rect.bottom + 6;
      if (top + estimatedHeight > window.innerHeight) {
        top = Math.max(8, rect.top - estimatedHeight - 6);
      }
      setSheetEditorCoords({
        top,
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
        width,
      });
    };
    updatePosition();
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const trigger =
        sheetEditor === "defense"
          ? defenseEditTriggerRef.current
          : peTurnoEditTriggerRef.current;
      if (
        trigger &&
        !trigger.contains(target) &&
        !sheetEditorPortalRef.current?.contains(target)
      ) {
        setSheetEditor(null);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetEditor(null);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [sheetEditor]);

  const vitals = getAgentEffectiveVitals(agent);
  const combat = calculateCombatStats(agent);
  const originDef = getOriginById(agent.originId);
  const morrendoMaxTurns =
    3 + (originDef?.efeitosPassivos?.rodadasMorrendoExtra ?? 0);
  const enlouquecendoMaxTurns =
    originDef?.efeitosPassivos?.rodadasMorrendoExtra &&
    agent.affinityElement === "Morte"
      ? 3 + originDef.efeitosPassivos.rodadasMorrendoExtra
      : 3;
  const originBloodRd = (() => {
    const rd = originDef?.efeitosPassivos?.rdSangueEscalonavel;
    if (!rd) return 0;
    if (agent.affinityElement === "Sangue") return rd.afinidade;
    if (rd.nex25 !== undefined && agent.nex >= 25) return rd.nex25;
    return rd.base;
  })();
  const desorientadoDef = COMMUNITY_CONDITIONS.find(
    (c) => c.id === "gc1_desorientado"
  );
  const load = calculateLoadAndCategories({
    forAttr: agent.attributes.FOR,
    patente: agent.patente,
    inventory: agent.inventory,
    extraCapacityBonus: getTrailCarryBonus(agent),
    organization: agent.organization,
  });

  const autoConds = evaluateVitalConditions({
    currentPv: agent.status.pv.current,
    maxPv: vitals.maxPv,
    currentSan: agent.status.san.current,
    maxSan: vitals.maxSan,
    usingPd: vitals.usingPd,
  });

  const conditionOptions = [
    {
      key: "machucado" as const,
      label: "Machucado",
      shortDesc: "PV ≤ 50% do máximo",
      active: Boolean(agent.status.machucado || autoConds.machucado),
      cls: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    },
    {
      key: "perturbado" as const,
      label: "Perturbado",
      shortDesc: "SAN ≤ 50% do máximo",
      active: Boolean(agent.status.perturbado || autoConds.perturbado),
      cls: "border-sky-500/40 bg-sky-500/10 text-sky-300",
    },
    {
      key: "morrendo" as const,
      label: "Morrendo",
      shortDesc: "0 PV — contagem de rodadas",
      active: Boolean(agent.status.morrendo),
      cls: "border-rose-500/50 bg-rose-500/15 text-rose-300",
    },
    {
      key: "enlouquecendo" as const,
      label: "Enlouquecendo",
      shortDesc: "0 SAN — contagem de rodadas",
      active: Boolean(agent.status.enlouquecendo),
      cls: "border-purple-500/50 bg-purple-500/15 text-purple-300",
    },
    {
      key: "vulneravel" as const,
      label: "Vulnerável (-2 Def)",
      shortDesc: "-2 na Defesa",
      active: Boolean(agent.status.vulneravel),
      cls: "border-orange-500/40 bg-orange-500/10 text-orange-300",
    },
    {
      key: "desorientado" as const,
      label: "Desorientado (-3 Def)",
      shortDesc: desorientadoDef
        ? desorientadoDef.description
        : "-3 na Defesa e -1d20 em localização",
      active: Boolean(agent.status.desorientado),
      cls: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
    },
  ];

  const activeConditions = conditionOptions.filter((c) => c.active);

  const toggleCondition = (
    key: (typeof conditionOptions)[number]["key"],
    checked: boolean
  ) => {
    onUpdate((prev) => ({
      ...prev,
      status: {
        ...prev.status,
        [key]: checked,
        ...(key === "morrendo" && !checked ? { morrendoTurns: 0 } : {}),
        ...(key === "enlouquecendo" && !checked
          ? { enlouquecendoTurns: 0 }
          : {}),
      },
    }));
  };

  const addResistance = () => {
    if (!newResType.trim()) return;
    onUpdate((prev) => ({
      ...prev,
      defense: {
        ...prev.defense,
        resistances: {
          ...prev.defense.resistances,
          [newResType.trim()]: newResVal,
        },
      },
    }));
  };

  const removeResistance = (key: string) => {
    onUpdate((prev) => {
      const copy = { ...prev.defense.resistances };
      delete copy[key];
      return {
        ...prev,
        defense: { ...prev.defense, resistances: copy },
      };
    });
  };

  const resistanceEntries = Object.entries(agent.defense.resistances);
  const hasManualDefAdjustments =
    agent.defense.protectionBonus !== 0 ||
    (agent.defense.abilityBonus ?? 0) + agent.defense.otherBonus !== 0 ||
    (Number(agent.defense.defenseBonus) || 0) !== 0 ||
    agent.defense.manualOverride != null ||
    (Number(agent.defense.blockBonus) || 0) !== 0 ||
    (Number(agent.defense.dodgeBonus) || 0) !== 0 ||
    Boolean(agent.defense.allowManualDodge) ||
    agent.defense.displacement !== 9;

  const effectiveDisplacement = Math.max(
    1,
    (Number(agent.defense.displacement) || 9) +
      Number(load.overloadDisplacementPenalty)
  );
  const squaresCount = Math.floor(effectiveDisplacement / 1.5);
  const extraDefBonus =
    Number(combat.shieldBonus) +
    Number(combat.accessoryBonus) +
    (Number(agent.defense.abilityBonus) || 0) +
    (Number(agent.defense.otherBonus) || 0) +
    (Number(agent.defense.defenseBonus) || 0);
  const peTurnoBonus =
    (Number(originDef?.efeitosPassivos?.limitePeBonus) || 0) +
    (Number(agent.peTurnoBonus) || 0);
  const peTurnoBreakdown =
    agent.peTurnoOverride !== null && agent.peTurnoOverride !== undefined
      ? `Valor fixo ${Number(vitals.peLimit) || 0}`
      : `Base ${Number(vitals.basePeLimitForDt) || 0} + bônus ${peTurnoBonus > 0 ? "+" : ""}${peTurnoBonus}`;

  const pdPool = agent.status.pd ?? {
    current: vitals.maxPd,
    temp: 0,
    maxOverride: null,
    autoCalc: true,
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Pentagrama de Atributos (grande e clicável estilo C.R.I.S.) */}
      <AttributePentagram
        attributes={agent.attributes}
        onRollAttribute={onRollAttribute}
        onChangeAttribute={(key, val) =>
          onUpdate((prev) => ({
            ...prev,
            attributes: { ...prev.attributes, [key]: Number(val) || 0 },
          }))
        }
      />

      {/* 2. Faixa Rápida: NEX % | PE / Turno | Deslocamento (m / q) em 3 mini-cards alinhados */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-white/10 bg-zinc-950/85 px-2.5 py-2 text-center">
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 block">
            {agent.classId === "sobrevivente" ? (
              "ESTÁGIO"
            ) : (
              <TermTooltip term="NEX" label="NEX" showIcon={false} />
            )}
          </span>
          <span className="font-mono text-base font-bold text-white tabular-nums">
            {agent.classId === "sobrevivente"
              ? `Est. ${agent.stage ?? 1}`
              : `${agent.nex}%`}
          </span>
        </div>

        <div
          className="relative rounded-lg border border-white/10 bg-zinc-950/85 px-2.5 py-2 text-center"
          title={peTurnoBreakdown}
        >
          <button
            ref={peTurnoEditTriggerRef}
            type="button"
            onClick={() => setSheetEditor((current) => current === "peTurno" ? null : "peTurno")}
            aria-label="Editar limite de PE por turno"
            title="Editar limite de PE por turno"
            className="absolute right-1 top-1 rounded p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-100"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <span className="font-mono text-[10px] uppercase tracking-wider text-amber-300/90 block">
            <TermTooltip
              term={vitals.usingPd ? "PD" : "PE"}
              label={`${vitals.usingPd ? "PD" : "PE"} / TURNO`}
              showIcon={false}
            />
          </span>
          <span className="font-mono text-base font-bold text-white tabular-nums">
            {vitals.peLimit}
          </span>
          <span className="block truncate font-mono text-[8px] text-zinc-500">
            {peTurnoBreakdown}
          </span>
        </div>

        <div
          className="rounded-lg border border-white/10 bg-zinc-950/85 px-2.5 py-2 text-center"
          title={
            load.isOverloaded
              ? `Deslocamento reduzido em -3m por Sobrecarga (Base ${agent.defense.displacement}m)`
              : `Deslocamento por ação de movimento: ${effectiveDisplacement}m (${squaresCount} quadrados)`
          }
        >
          <span className="inline-flex items-center justify-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
            <Footprints className="h-2.5 w-2.5" /> DESL.
          </span>
          <span
            className={cn(
              "font-mono text-base font-bold tabular-nums block",
              load.isOverloaded ? "text-amber-300" : "text-white"
            )}
          >
            {effectiveDisplacement}m{" "}
            <span className="text-xs font-normal text-zinc-400">
              ({squaresCount}q)
            </span>
          </span>
        </div>
      </div>

      {/* 3. Barras Vitais Empilhadas e Limpas (VIDA / SANIDADE / ESFORÇO) */}
      <Card className="p-3.5 space-y-2.5">
        <VitalStackBar
          label="VIDA (PV)"
          glossaryTerm="PV"
          icon={Heart}
          accentClass="text-rose-300"
          barColor="bg-rose-500/85"
          current={Number(agent.status.pv.current) || 0}
          temp={Number(agent.status.pv.temp) || 0}
          max={Number(vitals.maxPv) || 1}
          autoCalc={agent.status.pv.autoCalc}
          alertBadge={autoConds.machucado ? "Machucado" : null}
          onAdjust={(delta) =>
            onUpdate((prev) => {
              const nextVal = Math.max(
                0,
                (Number(prev.status.pv.current) || 0) + delta
              );
              const maxPv = getAgentEffectiveVitals(prev).maxPv;
              return {
                ...prev,
                status: {
                  ...prev.status,
                  pv: { ...prev.status.pv, current: nextVal },
                  machucado: nextVal <= Math.floor(maxPv / 2),
                  morrendo: nextVal === 0 ? true : prev.status.morrendo,
                },
              };
            })
          }
          onSetCurrent={(val) =>
            onUpdate((prev) => ({
              ...prev,
              status: {
                ...prev.status,
                pv: { ...prev.status.pv, current: Math.max(0, Number(val) || 0) },
              },
            }))
          }
          onSetTemp={(val) =>
            onUpdate((prev) => ({
              ...prev,
              status: {
                ...prev.status,
                pv: { ...prev.status.pv, temp: Number(val) || 0 },
              },
            }))
          }
          onToggleAuto={() =>
            onUpdate((prev) => ({
              ...prev,
              status: {
                ...prev.status,
                pv: {
                  ...prev.status.pv,
                  autoCalc: !prev.status.pv.autoCalc,
                  maxOverride: prev.status.pv.maxOverride ?? vitals.maxPv,
                },
              },
            }))
          }
          onSetMaxOverride={(val) =>
            onUpdate((prev) => ({
              ...prev,
              status: {
                ...prev.status,
                pv: { ...prev.status.pv, maxOverride: Number(val) || 1 },
              },
            }))
          }
        />

        {vitals.usingPd ? (
          <VitalStackBar
            label="DETERMINAÇÃO (PD)"
            glossaryTerm="PD"
            icon={Sparkles}
            accentClass="text-violet-300"
            barColor="bg-violet-500/85"
            current={Number(pdPool.current) || 0}
            temp={Number(pdPool.temp) || 0}
            max={Number(vitals.maxPd) || 1}
            autoCalc={pdPool.autoCalc}
            alertBadge={
              pdPool.current <= Math.floor(vitals.maxPd / 2) ? "Abalado" : null
            }
            onAdjust={(delta) =>
              onUpdate((prev) => {
                const cur = prev.status.pd ?? pdPool;
                return {
                  ...prev,
                  status: {
                    ...prev.status,
                    pd: {
                      ...cur,
                      current: Math.max(0, (Number(cur.current) || 0) + delta),
                    },
                  },
                };
              })
            }
            onSetCurrent={(val) =>
              onUpdate((prev) => {
                const cur = prev.status.pd ?? pdPool;
                return {
                  ...prev,
                  status: {
                    ...prev.status,
                    pd: { ...cur, current: Math.max(0, Number(val) || 0) },
                  },
                };
              })
            }
            onSetTemp={(val) =>
              onUpdate((prev) => {
                const cur = prev.status.pd ?? pdPool;
                return {
                  ...prev,
                  status: {
                    ...prev.status,
                    pd: { ...cur, temp: Number(val) || 0 },
                  },
                };
              })
            }
            onToggleAuto={() =>
              onUpdate((prev) => {
                const cur = prev.status.pd ?? pdPool;
                return {
                  ...prev,
                  status: {
                    ...prev.status,
                    pd: {
                      ...cur,
                      autoCalc: !cur.autoCalc,
                      maxOverride: cur.maxOverride ?? vitals.maxPd,
                    },
                  },
                };
              })
            }
            onSetMaxOverride={(val) =>
              onUpdate((prev) => {
                const cur = prev.status.pd ?? pdPool;
                return {
                  ...prev,
                  status: {
                    ...prev.status,
                    pd: { ...cur, maxOverride: Number(val) || 1 },
                  },
                };
              })
            }
          />
        ) : (
          <>
            <VitalStackBar
              label="SANIDADE (SAN)"
              glossaryTerm="SAN"
              icon={Brain}
              accentClass="text-sky-300"
              barColor="bg-sky-500/85"
              current={Number(agent.status.san.current) || 0}
              max={Number(vitals.maxSan) || 1}
              autoCalc={agent.status.san.autoCalc}
              alertBadge={autoConds.perturbado ? "Perturbado" : null}
              onAdjust={(delta) =>
                onUpdate((prev) => {
                  const nextVal = Math.max(
                    0,
                    (Number(prev.status.san.current) || 0) + delta
                  );
                  const maxSan = getAgentEffectiveVitals(prev).maxSan;
                  return {
                    ...prev,
                    status: {
                      ...prev.status,
                      san: { ...prev.status.san, current: nextVal },
                      perturbado: nextVal <= Math.floor(maxSan / 2),
                      enlouquecendo:
                        nextVal === 0 ? true : prev.status.enlouquecendo,
                    },
                  };
                })
              }
              onSetCurrent={(val) =>
                onUpdate((prev) => ({
                  ...prev,
                  status: {
                    ...prev.status,
                    san: {
                      ...prev.status.san,
                      current: Math.max(0, Number(val) || 0),
                    },
                  },
                }))
              }
              onToggleAuto={() =>
                onUpdate((prev) => ({
                  ...prev,
                  status: {
                    ...prev.status,
                    san: {
                      ...prev.status.san,
                      autoCalc: !prev.status.san.autoCalc,
                      maxOverride: prev.status.san.maxOverride ?? vitals.maxSan,
                    },
                  },
                }))
              }
              onSetMaxOverride={(val) =>
                onUpdate((prev) => ({
                  ...prev,
                  status: {
                    ...prev.status,
                    san: { ...prev.status.san, maxOverride: Number(val) || 1 },
                  },
                }))
              }
            />

            <VitalStackBar
              label="ESFORÇO (PE)"
              glossaryTerm="PE"
              icon={Zap}
              accentClass="text-amber-300"
              barColor="bg-amber-500/85"
              current={Number(agent.status.pe.current) || 0}
              temp={Number(agent.status.pe.temp) || 0}
              max={Number(vitals.maxPe) || 1}
              autoCalc={agent.status.pe.autoCalc}
              onAdjust={(delta) =>
                onUpdate((prev) => ({
                  ...prev,
                  status: {
                    ...prev.status,
                    pe: {
                      ...prev.status.pe,
                      current: Math.max(
                        0,
                        (Number(prev.status.pe.current) || 0) + delta
                      ),
                    },
                  },
                }))
              }
              onSetCurrent={(val) =>
                onUpdate((prev) => ({
                  ...prev,
                  status: {
                    ...prev.status,
                    pe: {
                      ...prev.status.pe,
                      current: Math.max(0, Number(val) || 0),
                    },
                  },
                }))
              }
              onSetTemp={(val) =>
                onUpdate((prev) => ({
                  ...prev,
                  status: {
                    ...prev.status,
                    pe: { ...prev.status.pe, temp: Number(val) || 0 },
                  },
                }))
              }
              onToggleAuto={() =>
                onUpdate((prev) => ({
                  ...prev,
                  status: {
                    ...prev.status,
                    pe: {
                      ...prev.status.pe,
                      autoCalc: !prev.status.pe.autoCalc,
                      maxOverride: prev.status.pe.maxOverride ?? vitals.maxPe,
                    },
                  },
                }))
              }
              onSetMaxOverride={(val) =>
                onUpdate((prev) => ({
                  ...prev,
                  status: {
                    ...prev.status,
                    pe: { ...prev.status.pe, maxOverride: Number(val) || 1 },
                  },
                }))
              }
            />
          </>
        )}
      </Card>

      {/* 4. Bloco de Defesa (estilo C.R.I.S.): Escudo com DEFESA grande + breakdown e ao lado BLOQUEIO (RD) e ESQUIVA */}
      <Card className="p-3.5 space-y-2.5">
        <div className="flex justify-end -mb-1">
          <button
            ref={defenseEditTriggerRef}
            type="button"
            onClick={() => setSheetEditor((current) => current === "defense" ? null : "defense")}
            aria-label="Editar Defesa, Bloqueio e Esquiva"
            title="Editar bônus e valores defensivos"
            className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[10px] text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-100"
          >
            <Pencil className="h-3 w-3" />
            Editar
          </button>
        </div>
        <div className="grid grid-cols-[1.15fr_1fr] gap-2.5 items-stretch">
          {/* Escudo Principal da Defesa */}
          <div className="flex flex-col items-center justify-center rounded-lg border border-white/15 bg-[#0C0C10] px-3 py-3 text-center">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
              <Shield className="h-3.5 w-3.5 text-zinc-200" />
              <TermTooltip term="Defesa" label="DEFESA" showIcon={false} />
            </div>
            <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-zinc-200/80 bg-zinc-950 font-mono text-2xl font-extrabold text-white shadow-[0_0_16px_rgba(255,255,255,0.1)] tabular-nums">
              {Number(combat.defense)}
            </div>
            <p className="mt-1.5 font-mono text-[10px] text-zinc-400 leading-tight tabular-nums">
              10 + AGI ({Number(agent.attributes.AGI) || 0})
              {combat.protectionBonus !== 0 && ` + Prot (${combat.protectionBonus})`}
              {extraDefBonus !== 0 && ` + Outros (${extraDefBonus > 0 ? "+" : ""}${extraDefBonus})`}
              {agent.defense.manualOverride != null && ` · Override (${Number(agent.defense.manualOverride) || 0})`}
            </p>
          </div>

          {/* Bloqueio (RD) e Esquiva ao lado */}
          <div className="flex flex-col justify-between gap-2">
            <div
              className={cn(
                "flex-1 flex items-center justify-between rounded-lg border border-white/10 bg-[#0C0C10] px-3 py-2",
                !combat.canBlock && "opacity-55"
              )}
              title={
                combat.canBlock
                  ? `Bloqueio: Reduz o dano de um ataque corpo a corpo em RD ${combat.blockRd} (igual ao seu bônus de Fortitude)`
                  : "Bloqueio: Requer ser treinado na perícia Fortitude"
              }
            >
              <div className="space-y-0.5">
                <span className="inline-flex items-center gap-1 font-display text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  <ShieldAlert className="h-3 w-3" />
                  <TermTooltip
                    term="Bloqueio"
                    label="BLOQUEIO"
                    showIcon={false}
                  />
                </span>
                <span className="block font-mono text-[9px] text-zinc-500">
                  {combat.canBlock ? "Fortitude (RD)" : "Req. Fortitude"}
                </span>
              </div>
              <span className="font-mono text-lg font-bold text-zinc-100 tabular-nums">
                {combat.canBlock ? `RD ${Number(combat.blockRd)}` : "—"}
              </span>
            </div>

            <div
              className={cn(
                "flex-1 flex items-center justify-between rounded-lg border border-white/10 bg-[#0C0C10] px-3 py-2",
                !combat.canDodge && "opacity-55"
              )}
              title={
                combat.canDodge
                  ? `Esquiva = Defesa (${Number(combat.defense)}) + Reflexos (${Number(combat.dodge) - Number(combat.defense)}) = ${Number(combat.dodge)}`
                  : "Esquiva: Requer ser treinado na perícia Reflexos"
              }
            >
              <div className="space-y-0.5">
                <span className="inline-flex items-center gap-1 font-display text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  <Wind className="h-3 w-3" />
                  <TermTooltip
                    term="Esquiva"
                    label="ESQUIVA"
                    showIcon={false}
                  />
                </span>
                <span className="block font-mono text-[9px] text-zinc-500">
                  {combat.canDodge ? "Def + Reflexos" : "Req. Reflexos"}
                </span>
              </div>
              <span className="font-mono text-lg font-bold text-zinc-100 tabular-nums">
                {combat.canDodge ? Number(combat.dodge) : "—"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 5. Botão de Destaque para Perícias (abre a aba Perícias no container principal da direita) */}

      {/* Card 2: Condições e Resistências sob demanda (Progressive Disclosure) */}
      {sheetEditor && sheetEditorCoords && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={sheetEditorPortalRef}
            style={sheetEditorCoords}
            role="dialog"
            aria-label={sheetEditor === "defense" ? "Editar defesas" : "Editar limite de PE por turno"}
            className="fixed z-[100] max-h-[calc(100vh-16px)] overflow-y-auto rounded-lg border border-white/20 bg-[#121218] p-3 shadow-2xl space-y-3 text-[#F4F4F5]"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-300">
                {sheetEditor === "defense" ? "Ajustes defensivos" : "Limite de PE por turno"}
              </span>
              <button
                type="button"
                onClick={() => setSheetEditor(null)}
                aria-label="Fechar edição"
                className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {sheetEditor === "defense" ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <label className="font-mono text-[10px] text-zinc-400">
                    Defesa (Outros / Bônus)
                    <Input
                      type="number"
                      value={Number(agent.defense.defenseBonus) || 0}
                      onChange={(event) => onUpdate((prev) => ({
                        ...prev,
                        defense: { ...prev.defense, defenseBonus: Number(event.target.value) || 0 },
                      }))}
                      aria-label="Bônus extra de Defesa"
                      className="mt-1 h-8 w-full font-mono text-sm text-zinc-100"
                    />
                  </label>
                  <label className="font-mono text-[10px] text-zinc-400">
                    Bloqueio (Bônus de RD)
                    <Input
                      type="number"
                      value={Number(agent.defense.blockBonus) || 0}
                      onChange={(event) => onUpdate((prev) => ({
                        ...prev,
                        defense: { ...prev.defense, blockBonus: Number(event.target.value) || 0 },
                      }))}
                      aria-label="Bônus de RD no Bloqueio"
                      className="mt-1 h-8 w-full font-mono text-sm text-zinc-100"
                    />
                  </label>
                  <label className="font-mono text-[10px] text-zinc-400">
                    Esquiva (Bônus)
                    <Input
                      type="number"
                      value={Number(agent.defense.dodgeBonus) || 0}
                      onChange={(event) => onUpdate((prev) => ({
                        ...prev,
                        defense: { ...prev.defense, dodgeBonus: Number(event.target.value) || 0 },
                      }))}
                      aria-label="Bônus de Esquiva"
                      className="mt-1 h-8 w-full font-mono text-sm text-zinc-100"
                    />
                  </label>
                  <label className="flex items-center gap-2 self-end rounded border border-white/10 bg-zinc-950/70 px-2 py-2 text-[10px] text-zinc-300">
                    <input
                      type="checkbox"
                      checked={Boolean(agent.defense.allowManualDodge)}
                      onChange={(event) => onUpdate((prev) => ({
                        ...prev,
                        defense: { ...prev.defense, allowManualDodge: event.target.checked },
                      }))}
                      aria-label="Permitir Esquiva sem treino em Reflexos"
                      className="accent-emerald-400"
                    />
                    Permitir Esquiva manual
                  </label>
                </div>

                <div className="space-y-2 border-t border-white/10 pt-2">
                  <label className="flex items-center gap-2 text-[11px] text-zinc-300">
                    <input
                      type="checkbox"
                      checked={agent.defense.manualOverride !== null && agent.defense.manualOverride !== undefined}
                      onChange={(event) => onUpdate((prev) => ({
                        ...prev,
                        defense: {
                          ...prev.defense,
                          manualOverride: event.target.checked ? Number(combat.defense) || 0 : null,
                        },
                      }))}
                      aria-label="Ativar valor fixo de Defesa"
                      className="accent-zinc-200"
                    />
                    Travar Defesa em um valor manual
                  </label>
                  <Input
                    type="number"
                    disabled={agent.defense.manualOverride === null || agent.defense.manualOverride === undefined}
                    value={(agent.defense.manualOverride ?? Number(combat.defense)) || 0}
                    onChange={(event) => onUpdate((prev) => ({
                      ...prev,
                      defense: { ...prev.defense, manualOverride: Number(event.target.value) || 0 },
                    }))}
                    aria-label="Valor manual de Defesa"
                    className="h-8 w-full font-mono text-sm text-zinc-100 disabled:opacity-50"
                  />
                </div>
                <p className="text-[10px] leading-relaxed text-zinc-500">
                  Os bônus extras são somados aos cálculos automáticos. O valor fixo substitui a Defesa calculada.
                </p>
              </>
            ) : (
              <>
                <label className="block font-mono text-[10px] text-zinc-400">
                  Bônus extra de PE / turno
                  <Input
                    type="number"
                    value={Number(agent.peTurnoBonus) || 0}
                    onChange={(event) => onUpdate((prev) => ({
                      ...prev,
                      peTurnoBonus: Number(event.target.value) || 0,
                    }))}
                    aria-label="Bônus extra de PE por turno"
                    className="mt-1 h-8 w-full font-mono text-sm text-zinc-100"
                  />
                </label>
                <label className="flex items-center gap-2 text-[11px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={agent.peTurnoOverride !== null && agent.peTurnoOverride !== undefined}
                    onChange={(event) => onUpdate((prev) => ({
                      ...prev,
                      peTurnoOverride: event.target.checked ? Number(vitals.peLimit) || 0 : null,
                    }))}
                    aria-label="Ativar valor fixo de PE por turno"
                    className="accent-amber-300"
                  />
                  Definir valor final manualmente
                </label>
                <Input
                  type="number"
                  min={0}
                  disabled={agent.peTurnoOverride === null || agent.peTurnoOverride === undefined}
                  value={(agent.peTurnoOverride ?? Number(vitals.peLimit)) || 0}
                  onChange={(event) => onUpdate((prev) => ({
                    ...prev,
                    peTurnoOverride: Number(event.target.value) || 0,
                  }))}
                  aria-label="Valor manual de PE por turno"
                  className="h-8 w-full font-mono text-sm text-zinc-100 disabled:opacity-50"
                />
                <p className="rounded border border-white/10 bg-zinc-950/70 px-2 py-1.5 font-mono text-[10px] text-amber-200/80">
                  {peTurnoBreakdown}
                </p>
              </>
            )}
          </div>,
          document.body
        )}

      <Card className="p-4 space-y-4">
        {/* Section A: Condições */}
        <div ref={condRef} className="relative space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-display text-xs font-bold uppercase tracking-wider text-zinc-200">
              Condições
            </span>
            <button
              type="button"
              onClick={() => setCondPopoverOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#14141A] px-2 py-1 text-xs font-medium text-zinc-300 hover:border-white/25 hover:text-white transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>Condição</span>
            </button>
          </div>

          {/* Active Condition Badges */}
          <div className="flex flex-wrap gap-1.5">
            {activeConditions.length === 0 && !load.isOverloaded ? (
              <span className="text-xs text-zinc-500">
                Nenhuma condição ativa
              </span>
            ) : (
              <>
                {activeConditions.map((cond) => (
                  <span
                    key={cond.key}
                    title={cond.shortDesc}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium",
                      cond.cls
                    )}
                  >
                    <AlertOctagon className="h-3 w-3 shrink-0" />
                    <span>{cond.label}</span>
                    <button
                      type="button"
                      onClick={() => toggleCondition(cond.key, false)}
                      className="opacity-70 hover:opacity-100 ml-0.5"
                      title={`Remover ${cond.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                {load.isOverloaded && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-300"
                    title="Sobrecarregado: -5 Defesa, -5 perícias de carga, -3m deslocamento"
                  >
                    <AlertOctagon className="h-3 w-3 shrink-0" />
                    <span>Sobrecarregado</span>
                  </span>
                )}
              </>
            )}
          </div>

          {/* Contadores de Rodadas de Morrendo / Enlouquecendo (quando ativos) */}
          {(agent.status.morrendo || agent.status.enlouquecendo) && (
            <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-2.5 space-y-2 font-mono text-[11px]">
              {agent.status.morrendo && (
                <div className="flex items-center justify-between">
                  <span className="text-rose-300 font-semibold">
                    Morrendo ({morrendoMaxTurns} rodadas)
                  </span>
                  <div className="flex gap-1">
                    {Array.from(
                      { length: morrendoMaxTurns },
                      (_, i) => i + 1
                    ).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          onUpdate((prev) => ({
                            ...prev,
                            status: {
                              ...prev.status,
                              morrendoTurns:
                                prev.status.morrendoTurns === t ? t - 1 : t,
                            },
                          }))
                        }
                        className={cn(
                          "h-5 w-5 rounded border font-bold transition-colors",
                          (agent.status.morrendoTurns ?? 0) >= t
                            ? "border-rose-400 bg-rose-600 text-white"
                            : "border-white/15 bg-zinc-950 text-zinc-500"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {agent.status.enlouquecendo && (
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 font-semibold">
                    Enlouquecendo ({enlouquecendoMaxTurns} rodadas)
                  </span>
                  <div className="flex gap-1">
                    {Array.from(
                      { length: enlouquecendoMaxTurns },
                      (_, i) => i + 1
                    ).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          onUpdate((prev) => ({
                            ...prev,
                            status: {
                              ...prev.status,
                              enlouquecendoTurns:
                                prev.status.enlouquecendoTurns === t
                                  ? t - 1
                                  : t,
                            },
                          }))
                        }
                        className={cn(
                          "h-5 w-5 rounded border font-bold transition-colors",
                          (agent.status.enlouquecendoTurns ?? 0) >= t
                            ? "border-purple-400 bg-purple-600 text-white"
                            : "border-white/15 bg-zinc-950 text-zinc-500"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Popover via Portal: Marcar/Desmarcar Condições */}
          {condPopoverOpen &&
            condCoords &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                ref={condPortalRef}
                style={{
                  top: condCoords.top,
                  left: condCoords.left,
                  width: condCoords.width,
                }}
                className="fixed z-50 rounded-lg border border-white/20 bg-[#121218] p-3 shadow-2xl space-y-2 text-[#F4F4F5]"
              >
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Alternar Condições
                  </span>
                  <button
                    type="button"
                    onClick={() => setCondPopoverOpen(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {conditionOptions.map((cond) => (
                    <label
                      key={cond.key}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-md border px-2.5 py-1.5 text-xs transition-colors select-none",
                        cond.active
                          ? cond.cls
                          : "border-white/10 bg-zinc-950 text-zinc-300 hover:bg-zinc-900"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="font-medium">{cond.label}</div>
                        <div className="text-[10px] opacity-75 truncate">
                          {cond.shortDesc}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={cond.active}
                        onChange={(e) =>
                          toggleCondition(cond.key, e.target.checked)
                        }
                        className="h-3.5 w-3.5 accent-zinc-200"
                      />
                    </label>
                  ))}
                </div>
              </div>,
              document.body
            )}
        </div>

        {/* Section B: Resistências a Dano (RD) sob demanda */}
        <div
          ref={rdRef}
          className="relative border-t border-white/10 pt-3.5 space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-zinc-200">
              <Shield className="h-3.5 w-3.5 text-zinc-400" />
              <TermTooltip term="RD" label="Resistências (RD)" />
            </span>
            <button
              type="button"
              onClick={() => setRdPopoverOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#14141A] px-2 py-1 text-xs font-medium text-zinc-300 hover:border-white/25 hover:text-white transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>RD</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {originBloodRd > 0 && (
              <Badge
                variant="danger"
                className="font-mono text-[11px]"
                title={`RD a Sangue automática da origem ${originDef?.name ?? ""}`}
              >
                Sangue {originBloodRd} (Origem)
              </Badge>
            )}
            {resistanceEntries.length === 0 && originBloodRd === 0 ? (
              <span className="text-xs text-zinc-500">
                Nenhuma RD ativa
              </span>
            ) : (
              resistanceEntries.map(([type, val]) => (
                <Badge
                  key={type}
                  variant="default"
                  className="font-mono text-[11px] gap-1.5 pr-1.5 py-0.5"
                >
                  <span>
                    {type} {val}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeResistance(type)}
                    className="text-zinc-500 hover:text-rose-400"
                    aria-label={`Remover RD ${type}`}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))
            )}
          </div>

          {/* Popover via Portal: Adicionar / Gerenciar RD */}
          {rdPopoverOpen &&
            rdCoords &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                ref={rdPortalRef}
                style={{
                  top: rdCoords.top,
                  left: rdCoords.left,
                  width: rdCoords.width,
                }}
                className="fixed z-50 rounded-lg border border-white/20 bg-[#121218] p-3 shadow-2xl space-y-2.5 text-[#F4F4F5]"
              >
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                    Adicionar Resistência a Dano
                  </span>
                  <button
                    type="button"
                    onClick={() => setRdPopoverOpen(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex gap-1.5">
                  <Select
                    value={newResType}
                    onChange={(e) => setNewResType(e.target.value)}
                    className="h-8 text-xs flex-1"
                  >
                    {COMMON_DAMAGE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    value={newResVal}
                    onChange={(e) => setNewResVal(Number(e.target.value) || 0)}
                    className="h-8 w-14 font-mono text-xs text-center px-1"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      addResistance();
                      setRdPopoverOpen(false);
                    }}
                    className="h-8 px-2.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>,
              document.body
            )}
        </div>

        {/* Section C: Ajustes Manuais & Atalho Discreto para o Rolador */}
        <div className="border-t border-white/10 pt-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px]",
                combat.canCounterAttack ? "text-emerald-400" : "text-zinc-500"
              )}
              title={
                combat.canCounterAttack
                  ? "Reação disponível: faça um ataque corpo a corpo se o inimigo errar você"
                  : "Requer ser treinado na perícia Luta"
              }
            >
              <Swords className="h-3 w-3" />
              <span>
                Contra-ataque:{" "}
                {combat.canCounterAttack ? "Disponível" : "Req. Luta"}
              </span>
            </span>

            <button
              type="button"
              onClick={() => setDefAdjustOpen((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition-colors",
                defAdjustOpen || hasManualDefAdjustments
                  ? "text-zinc-200 bg-white/10"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
              title="Ajustes manuais de Proteção, Defesa e Deslocamento"
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>Ajustes</span>
              {defAdjustOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
          </div>

          {defAdjustOpen && (
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <label className="font-mono text-[9px] uppercase text-zinc-400 block mb-1">
                  Prot+
                </label>
                <Input
                  type="number"
                  value={agent.defense.protectionBonus}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      defense: {
                        ...prev.defense,
                        protectionBonus: Number(e.target.value) || 0,
                      },
                    }))
                  }
                  className="h-7 font-mono text-xs px-2"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] uppercase text-zinc-400 block mb-1">
                  Def+
                </label>
                <Input
                  type="number"
                  value={
                    (agent.defense.abilityBonus ?? 0) + agent.defense.otherBonus
                  }
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      defense: {
                        ...prev.defense,
                        abilityBonus: 0,
                        otherBonus: Number(e.target.value) || 0,
                      },
                    }))
                  }
                  className="h-7 font-mono text-xs px-2"
                />
              </div>
              <div>
                <label className="font-mono text-[9px] uppercase text-zinc-400 flex items-center gap-0.5 mb-1">
                  <Footprints className="h-2.5 w-2.5" /> Desl (m)
                </label>
                <Input
                  type="number"
                  value={agent.defense.displacement}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      defense: {
                        ...prev.defense,
                        displacement: Math.max(0, Number(e.target.value) || 0),
                      },
                    }))
                  }
                  className="h-7 font-mono text-xs px-2"
                />
              </div>
            </div>
          )}

          {/* Discreet shortcut to open main Roller */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setQuickRollerOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-white/10 bg-[#121218] py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-zinc-100 transition-colors"
            >
              <Dices className="h-3.5 w-3.5" />
              <span>Abrir Rolador de Dados</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
