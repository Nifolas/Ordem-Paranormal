"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Coffee,
  Download,
  Dumbbell,
  Footprints,
  Lock,
  Minus,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Unlock,
  Upload,
  X,
} from "lucide-react";
import type {
  Agent,
  AgentClassId,
  InterludeBonusDie,
  OrganizationId,
  ParanormalElement,
  Patente,
} from "@/types/ordem";
import { BASE_ORIGINS, getOriginById } from "@/data/origins";
import { ALL_CLASSES, getClassById } from "@/data/classes";
import { BASE_TRAILS } from "@/data/trails";
import { COMMUNITY_ORIGINS, COMMUNITY_TRAILS } from "@/data/supplements";
import { filterByEnabledSources, isCommunitySource } from "@/data/sources";
import { ORGANIZATIONS, getOrganization } from "@/data/organizations";
import {
  SourceToggleGroup,
  setCommunityList,
  toggleSourceList,
} from "@/components/SourceToggles";
import { getAgentSkillList } from "@/data/skills";
import {
  calculateCombatStats,
  calculateLoadAndCategories,
  calculateVitals,
  evaluateVitalConditions,
  getAgentEffectiveVitals,
  getTrailCarryBonus,
  NEX_STEPS,
  normalizeCatalogId,
  rollDiceFormula,
  SURVIVOR_STAGES,
} from "@/lib/ordem-rules";
import { exportAgentToJson } from "@/services/storage";
import { clamp, cn, ELEMENT_STYLES, formatSigned } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { InterludeModal } from "./InterludeModal";
import {
  Button,
  Input,
  Modal,
  NumericInput,
  Select,
} from "@/components/ui/primitives";

const PATENTES: Patente[] = [
  "Recruta",
  "Operador",
  "Agente Especial",
  "Oficial de Operações",
  "Agente de Elite",
];

const ELEMENTS: ParanormalElement[] = [
  "Sangue",
  "Morte",
  "Conhecimento",
  "Energia",
];

function HeaderResourceBar({
  label,
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
        left: Math.max(8, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 250) - 8)),
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
      className="relative rounded-lg border border-white/10 bg-[#0C0C10]/90 px-3.5 py-2.5 space-y-2"
    >
      {/* Top Row: Label + Alert Badge + Clean [-] [current / max] [+] + [+TMP] */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={cn(
              "font-display text-xs font-bold uppercase tracking-wider",
              accentClass
            )}
          >
            {label}
          </span>
          {alertBadge && (
            <span className="rounded-sm border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-amber-300">
              {alertBadge}
            </span>
          )}
        </div>

        {/* Clean Controls: [-] [Current / Max] [+] and discreet [+TMP] */}
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

      {/* Progress bar with harmonious colors */}
      <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-200", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Inline Temp editor when toggled */}
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

      {/* Popover via Portal for Quick Adjustments (-5 / +5), Direct Value Input & Auto/Manual Max */}
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
            className="fixed z-50 rounded-lg border border-white/20 bg-[#121218] p-3 shadow-2xl space-y-2.5 text-[#F4F4F5]"
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

export function SheetTacticalHeader({
  agent,
  onUpdate,
}: {
  agent: Agent;
  onUpdate: (updater: (prev: Agent) => Agent) => void;
}) {
  const { homebrew, quickDiceMod, setQuickDiceMod, pushRoll } = useAppStore();
  const [configOpen, setConfigOpen] = useState(false);
  const [interludeOpen, setInterludeOpen] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [optionsCoords, setOptionsCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const optionsPortalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!optionsMenuOpen) return;
    const updatePosition = () => {
      if (!optionsMenuRef.current) return;
      const rect = optionsMenuRef.current.getBoundingClientRect();
      const menuWidth = 256;
      setOptionsCoords({
        top: rect.bottom + 6,
        left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)),
      });
    };
    updatePosition();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(target) &&
        (!optionsPortalRef.current || !optionsPortalRef.current.contains(target))
      ) {
        setOptionsMenuOpen(false);
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
  }, [optionsMenuOpen]);

  const handleSpendBonusDie = (die: InterludeBonusDie) => {
    const res = rollDiceFormula({ formula: die.dieFormula });
    pushRoll({
      actorName: agent.name,
      actorId: agent.id,
      label: `Dado Bônus (${die.source === "exercitar" ? "Exercitar-se" : "Leitura"})`,
      kind: "free",
      formula: `+${die.dieFormula}`,
      diceRolled: res.diceRolled,
      mode: "sum",
      bonus: 0,
      total: res.total,
      details: `${die.label} • Somar +${res.total} ao teste de ${die.appliesTo.join("/")}`,
    });
    onUpdate((prev) => ({
      ...prev,
      interludeBonusDice: (prev.interludeBonusDice ?? []).filter(
        (d) => d.id !== die.id
      ),
    }));
  };

  const allOrigins = useMemo(() => {
    const enabledCommunity = filterByEnabledSources(
      COMMUNITY_ORIGINS,
      agent.enabledSources
    );
    const currentCommunity = COMMUNITY_ORIGINS.find(
      (o) =>
        o.id === agent.originId || o.id === normalizeCatalogId(agent.originId)
    );
    const community =
      currentCommunity &&
      !enabledCommunity.some((o) => o.id === currentCommunity.id)
        ? [...enabledCommunity, currentCommunity]
        : enabledCommunity;
    return [...BASE_ORIGINS, ...community, ...homebrew.origins];
  }, [homebrew.origins, agent.enabledSources, agent.originId]);

  const classTrails = useMemo(() => {
    const enabledCommunity = filterByEnabledSources(
      COMMUNITY_TRAILS,
      agent.enabledSources
    );
    const currentCommunity = COMMUNITY_TRAILS.find(
      (t) =>
        t.id === agent.trilhaId || t.id === normalizeCatalogId(agent.trilhaId)
    );
    const community =
      currentCommunity &&
      !enabledCommunity.some((t) => t.id === currentCommunity.id)
        ? [...enabledCommunity, currentCommunity]
        : enabledCommunity;
    return [
      ...BASE_TRAILS,
      ...community,
      ...(homebrew.trails ?? []),
    ].filter((t) => t.classId === agent.classId);
  }, [agent.classId, agent.enabledSources, agent.trilhaId, homebrew.trails]);

  const origin = getOriginById(agent.originId, homebrew.origins);
  const cls = getClassById(agent.classId);
  const professionSpec = getAgentSkillList(agent)
    .find((s) => s.id === "profissao")
    ?.especializacao?.trim();
  const trail = classTrails.find(
    (t) =>
      t.id === agent.trilhaId || t.id === normalizeCatalogId(agent.trilhaId)
  );
  const vitals = getAgentEffectiveVitals(agent);
  const combat = calculateCombatStats(agent);
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

  const effectiveDisplacement = Math.max(
    1,
    agent.defense.displacement + load.overloadDisplacementPenalty
  );

  const elemStyle = agent.affinityElement
    ? ELEMENT_STYLES[agent.affinityElement]
    : null;

  const trilhaUnlocked =
    agent.classId === "sobrevivente"
      ? (agent.stage ?? 1) >= 2
      : agent.nex >= 10;

  const affinityUnlocked = agent.classId !== "sobrevivente" && agent.nex >= 50;

  const pdPool = agent.status.pd ?? {
    current: vitals.maxPd,
    temp: 0,
    maxOverride: null,
    autoCalc: true,
  };

  const normalizedTrailVal = trail?.id ?? "";
  const normalizedOriginVal =
    allOrigins.find(
      (o) =>
        o.id === agent.originId || o.id === normalizeCatalogId(agent.originId)
    )?.id ?? agent.originId;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onUpdate((prev) => ({ ...prev, avatar: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNexChange = (nextNex: number) => {
    onUpdate((prev) => {
      const oldVitals = getAgentEffectiveVitals(prev);
      const nextAuto = calculateVitals({
        classId: prev.classId,
        nex: nextNex,
        stage: prev.stage,
        vig: prev.attributes.VIG,
        pre: prev.attributes.PRE,
        patente: prev.patente,
        optionalRules: prev.optionalRules,
        transcenderCount: oldVitals.transcenderCount,
        halfInitialSan: Boolean(
          getOriginById(prev.originId, homebrew.origins)?.efeitosPassivos
            ?.metadeSanInicial ||
            getOriginById(prev.originId, homebrew.origins)?.halfInitialSan ||
            normalizeCatalogId(prev.originId) === "cultista_arrependido"
        ),
        permanentSanLoss: prev.permanentSanLoss ?? 0,
      });
      return {
        ...prev,
        nex: nextNex,
        trilhaId: nextNex < 10 ? null : prev.trilhaId,
        status: {
          ...prev.status,
          pv: {
            ...prev.status.pv,
            current: prev.status.pv.autoCalc
              ? Math.max(
                  0,
                  prev.status.pv.current + (nextAuto.maxPv - oldVitals.maxPv)
                )
              : prev.status.pv.current,
          },
          san: {
            ...prev.status.san,
            current: prev.status.san.autoCalc
              ? Math.max(
                  0,
                  prev.status.san.current + (nextAuto.maxSan - oldVitals.maxSan)
                )
              : prev.status.san.current,
          },
          pe: {
            ...prev.status.pe,
            current: prev.status.pe.autoCalc
              ? Math.max(
                  0,
                  prev.status.pe.current + (nextAuto.maxPe - oldVitals.maxPe)
                )
              : prev.status.pe.current,
          },
        },
      };
    });
  };

  const handleStageChange = (nextStage: number) => {
    onUpdate((prev) => ({
      ...prev,
      stage: nextStage,
      trilhaId: nextStage < 2 ? null : prev.trilhaId,
    }));
  };

  const handleTogglePdRule = () => {
    onUpdate((prev) => {
      const rules = prev.optionalRules ?? [];
      const has = rules.includes("jogando_sem_sanidade");
      const nextRules = has
        ? rules.filter((r) => r !== "jogando_sem_sanidade")
        : [...rules, "jogando_sem_sanidade" as const];
      const nextVitals = calculateVitals({
        classId: prev.classId,
        nex: prev.nex,
        stage: prev.stage,
        vig: prev.attributes.VIG,
        pre: prev.attributes.PRE,
        patente: prev.patente,
        optionalRules: nextRules,
      });
      return {
        ...prev,
        optionalRules: nextRules,
        status: {
          ...prev.status,
          pd: prev.status.pd ?? {
            current: nextVitals.maxPd,
            temp: 0,
            maxOverride: null,
            autoCalc: true,
          },
        },
      };
    });
  };

  return (
    <>
      <div
        className={cn(
          "relative z-30 rounded-lg border border-white/10 bg-zinc-950/85 backdrop-blur-sm border-l-[3px] shadow-sm",
          elemStyle ? elemStyle.borderLeft : "border-l-zinc-500"
        )}
      >
        {/* Unified Clean Top Bar: ← Agentes + Avatar & Identity + NEX Selector + Interlúdio + ⋯ Opções */}
        <div className="px-4 py-3.5 sm:px-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              href="/agentes"
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-[#121218] px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-colors shrink-0"
              title="Voltar para lista de agentes"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Agentes</span>
            </Link>

            <label className="group relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-md border border-white/15 bg-[#09090B]">
              {agent.avatar ? (
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono text-sm font-bold text-zinc-300">
                  {agent.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 transition-opacity group-hover:opacity-100">
                <Upload className="h-3.5 w-3.5 text-zinc-100" />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={agent.name}
                  onChange={(e) =>
                    onUpdate((prev) => ({ ...prev, name: e.target.value }))
                  }
                  aria-label="Nome do agente"
                  className="bg-transparent font-display text-lg sm:text-xl font-bold tracking-tight text-zinc-50 border-b border-transparent hover:border-white/20 focus:border-zinc-200 focus:outline-none max-w-full"
                />
                {agent.player && (
                  <span className="text-xs text-zinc-500">
                    · {agent.player}
                  </span>
                )}
                {agent.affinityElement && elemStyle && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                      elemStyle.badge
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", elemStyle.dot)} />
                    Afinidade {agent.affinityElement}
                  </span>
                )}
                {quickDiceMod !== 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                      quickDiceMod > 0
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-red-500/40 bg-red-500/10 text-red-300"
                    )}
                    title="Modificador global de d20 ativo"
                  >
                    Mod d20: {formatSigned(quickDiceMod)}d
                  </span>
                )}
              </div>

              {/* 1 Clean Line of Subtitle: Origem · Classe · Trilha · Patente · Limite de PE */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-400">
                <span className="text-zinc-200 font-medium">
                  {origin?.name ?? "Origem"}
                </span>
                {professionSpec && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-300">{professionSpec}</span>
                  </>
                )}
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-200 font-medium">{cls.name}</span>
                {trail && (
                  <>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-300">{trail.name}</span>
                  </>
                )}
                <span className="text-zinc-600">·</span>
                <span>{agent.patente}</span>
                <span className="text-zinc-600">·</span>
                <span
                  className="font-mono text-[11px] text-zinc-300"
                  title={`Máximo de ${vitals.usingPd ? "PD" : "PE"} que pode gastar por turno`}
                >
                  Limite de {vitals.usingPd ? "PD" : "PE"}: {vitals.peLimit}
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls: NEX Selector + Interlúdio + ⋯ Opções */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {agent.classId === "sobrevivente" ? (
              <select
                value={agent.stage ?? 1}
                onChange={(e) => handleStageChange(Number(e.target.value))}
                aria-label="Seletor de Estágio"
                className="h-8 rounded-md border border-white/15 bg-[#121218] px-2.5 font-mono text-xs font-bold text-zinc-100 focus:outline-none focus:border-zinc-300"
              >
                {SURVIVOR_STAGES.map((st) => (
                  <option key={st} value={st} className="bg-zinc-950">
                    Estágio {st} (NEX 0%)
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={agent.nex}
                onChange={(e) => handleNexChange(Number(e.target.value))}
                aria-label="Seletor de NEX"
                className="h-8 rounded-md border border-white/15 bg-[#121218] px-2.5 font-mono text-xs font-bold text-zinc-100 focus:outline-none focus:border-zinc-300"
              >
                {NEX_STEPS.map((n) => (
                  <option key={n} value={n} className="bg-zinc-950">
                    NEX {n}%
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={() => setInterludeOpen(true)}
              className="h-8 rounded-md"
              title="Abrir Assistente de Cena de Interlúdio (Dormir, Relaxar, Alimentar-se, Exercitar, Ler...)"
            >
              <Coffee className="h-3.5 w-3.5 text-amber-400" />
              <span>Interlúdio</span>
            </Button>

            {/* Dropdown Menu: ⋯ Opções (renderizado via Portal com z-50 para nunca ficar atrás de outros cards) */}
            <div ref={optionsMenuRef} className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOptionsMenuOpen((v) => !v)}
                className="h-8 rounded-md px-2.5"
                aria-label="Opções da ficha"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span>Opções</span>
              </Button>

              {optionsMenuOpen &&
                optionsCoords &&
                typeof document !== "undefined" &&
                createPortal(
                  <div
                    ref={optionsPortalRef}
                    style={{
                      top: optionsCoords.top,
                      left: optionsCoords.left,
                    }}
                    className="fixed z-50 w-64 rounded-lg border border-white/20 bg-[#121218] p-2 shadow-2xl space-y-1 text-xs text-[#F4F4F5]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setOptionsMenuOpen(false);
                        setConfigOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-zinc-200 hover:bg-white/10 transition-colors"
                    >
                      <Settings2 className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Configurar Dossiê</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleTogglePdRule();
                        setOptionsMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-zinc-200 hover:bg-white/10 transition-colors"
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                        <span>Alternar SAN/PE (Modo PD)</span>
                      </span>
                      <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                        {vitals.usingPd ? "PD" : "SAN/PE"}
                      </span>
                    </button>

                    <div className="rounded-md border border-white/10 bg-zinc-950/60 px-2.5 py-2 space-y-1.5">
                      <div className="flex items-center justify-between text-zinc-300">
                        <span className="inline-flex items-center gap-1.5">
                          <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" />
                          <span>Modificador Global d20</span>
                        </span>
                        {quickDiceMod !== 0 && (
                          <button
                            type="button"
                            onClick={() => setQuickDiceMod(0)}
                            className="font-mono text-[10px] text-zinc-400 hover:text-white underline"
                          >
                            Zerar
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between rounded border border-white/10 bg-zinc-950 px-2 py-1 font-mono">
                        <button
                          type="button"
                          onClick={() => setQuickDiceMod(quickDiceMod - 1)}
                          className="rounded px-2 py-0.5 text-zinc-300 hover:bg-white/10"
                          title="Desvantagem (-1d20)"
                        >
                          -1d
                        </button>
                        <span
                          className={cn(
                            "font-bold tabular-nums",
                            quickDiceMod > 0
                              ? "text-emerald-400"
                              : quickDiceMod < 0
                              ? "text-red-400"
                              : "text-zinc-300"
                          )}
                        >
                          {quickDiceMod === 0
                            ? "0d20"
                            : `${formatSigned(quickDiceMod)}d20`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuickDiceMod(quickDiceMod + 1)}
                          className="rounded px-2 py-0.5 text-zinc-300 hover:bg-white/10"
                          title="Vantagem (+1d20)"
                        >
                          +1d
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setOptionsMenuOpen(false);
                          exportAgentToJson(agent);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-zinc-200 hover:bg-white/10 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Exportar JSON</span>
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
            </div>
          </div>
        </div>

        {/* Row 2: Dedicated Status & Combat Strip (PV, SAN, PE/PD + Defesa, Esquiva, Bloqueio, Deslocamento) */}
        <div className="border-t border-white/10 bg-[#0B0B0F]/75 px-4 py-3.5 sm:px-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] items-stretch">
            {/* Resource Bars with more harmonious, less saturated colors */}
            <div
              className={cn(
                "grid gap-3",
                vitals.usingPd
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-3"
              )}
            >
              <HeaderResourceBar
                label="PV"
                accentClass="text-rose-300"
                barColor="bg-rose-500/80"
                current={agent.status.pv.current}
                temp={agent.status.pv.temp ?? 0}
                max={vitals.maxPv}
                autoCalc={agent.status.pv.autoCalc}
                alertBadge={autoConds.machucado ? "Machucado" : null}
                onAdjust={(delta) =>
                  onUpdate((prev) => {
                    const nextVal = Math.max(0, prev.status.pv.current + delta);
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
                      pv: { ...prev.status.pv, current: Math.max(0, val) },
                    },
                  }))
                }
                onSetTemp={(val) =>
                  onUpdate((prev) => ({
                    ...prev,
                    status: {
                      ...prev.status,
                      pv: { ...prev.status.pv, temp: val },
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
                        maxOverride:
                          prev.status.pv.maxOverride ?? vitals.maxPv,
                      },
                    },
                  }))
                }
                onSetMaxOverride={(val) =>
                  onUpdate((prev) => ({
                    ...prev,
                    status: {
                      ...prev.status,
                      pv: { ...prev.status.pv, maxOverride: val },
                    },
                  }))
                }
              />

              {vitals.usingPd ? (
                <HeaderResourceBar
                  label="PD"
                  accentClass="text-violet-300"
                  barColor="bg-violet-500/80"
                  current={pdPool.current}
                  temp={pdPool.temp ?? 0}
                  max={vitals.maxPd}
                  autoCalc={pdPool.autoCalc}
                  alertBadge={
                    pdPool.current <= Math.floor(vitals.maxPd / 2)
                      ? "Abalado"
                      : null
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
                            current: Math.max(0, cur.current + delta),
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
                          pd: { ...cur, current: Math.max(0, val) },
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
                          pd: { ...cur, temp: val },
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
                          pd: { ...cur, maxOverride: val },
                        },
                      };
                    })
                  }
                />
              ) : (
                <>
                  <HeaderResourceBar
                    label="SAN"
                    accentClass="text-sky-300"
                    barColor="bg-sky-500/80"
                    current={agent.status.san.current}
                    max={vitals.maxSan}
                    autoCalc={agent.status.san.autoCalc}
                    alertBadge={autoConds.perturbado ? "Perturbado" : null}
                    onAdjust={(delta) =>
                      onUpdate((prev) => {
                        const nextVal = Math.max(
                          0,
                          prev.status.san.current + delta
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
                            current: Math.max(0, val),
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
                            maxOverride:
                              prev.status.san.maxOverride ?? vitals.maxSan,
                          },
                        },
                      }))
                    }
                    onSetMaxOverride={(val) =>
                      onUpdate((prev) => ({
                        ...prev,
                        status: {
                          ...prev.status,
                          san: { ...prev.status.san, maxOverride: val },
                        },
                      }))
                    }
                  />

                  <HeaderResourceBar
                    label="PE"
                    accentClass="text-amber-300"
                    barColor="bg-amber-500/80"
                    current={agent.status.pe.current}
                    temp={agent.status.pe.temp ?? 0}
                    max={vitals.maxPe}
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
                              prev.status.pe.current + delta
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
                          pe: { ...prev.status.pe, current: Math.max(0, val) },
                        },
                      }))
                    }
                    onSetTemp={(val) =>
                      onUpdate((prev) => ({
                        ...prev,
                        status: {
                          ...prev.status,
                          pe: { ...prev.status.pe, temp: val },
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
                            maxOverride:
                              prev.status.pe.maxOverride ?? vitals.maxPe,
                          },
                        },
                      }))
                    }
                    onSetMaxOverride={(val) =>
                      onUpdate((prev) => ({
                        ...prev,
                        status: {
                          ...prev.status,
                          pe: { ...prev.status.pe, maxOverride: val },
                        },
                      }))
                    }
                  />
                </>
              )}
            </div>

            {/* Clean Defense / Esquiva / Bloqueio / Deslocamento Quartet with Beginner Tooltips */}
            <div className="grid grid-cols-4 gap-2 lg:min-w-[320px]">
              <div
                className="flex flex-col justify-center items-center rounded-lg border border-white/10 bg-[#0C0C10]/90 px-3 py-2 text-center"
                title={`Defesa = 10 + AGI (${Number(agent.attributes.AGI) || 0}) + Proteção (${combat.protectionBonus}) + Escudo/Bônus (${combat.shieldBonus + combat.accessoryBonus + (Number(agent.defense.abilityBonus) || 0) + (Number(agent.defense.otherBonus) || 0)}) = ${combat.defense}`}
              >
                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                  Defesa
                </span>
                <span className="font-mono text-xl font-bold text-zinc-100 tabular-nums mt-0.5">
                  {Number(combat.defense)}
                </span>
              </div>

              <div
                className={cn(
                  "flex flex-col justify-center items-center rounded-lg border border-white/10 bg-[#0C0C10]/90 px-3 py-2 text-center",
                  !combat.canDodge && "opacity-50"
                )}
                title={
                  combat.canDodge
                    ? `Esquiva = Defesa (${combat.defense}) + Bônus de Reflexos (${combat.dodge - combat.defense}) = ${combat.dodge}`
                    : "Esquiva: Requer ser treinado na perícia Reflexos (soma Reflexos à sua Defesa como reação)"
                }
              >
                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                  Esquiva
                </span>
                <span className="font-mono text-xl font-bold text-zinc-200 tabular-nums mt-0.5">
                  {combat.canDodge ? combat.dodge : "—"}
                </span>
              </div>

              <div
                className={cn(
                  "flex flex-col justify-center items-center rounded-lg border border-white/10 bg-[#0C0C10]/90 px-3 py-2 text-center",
                  !combat.canBlock && "opacity-50"
                )}
                title={
                  combat.canBlock
                    ? `Bloqueio: Reduz o dano de um ataque corpo a corpo em RD ${combat.blockRd} (igual ao seu bônus de Fortitude)`
                    : "Bloqueio: Requer ser treinado na perícia Fortitude (concede RD igual à sua Fortitude como reação)"
                }
              >
                <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                  Bloqueio
                </span>
                <span className="font-mono text-xl font-bold text-zinc-200 tabular-nums mt-0.5">
                  {combat.canBlock ? `RD ${combat.blockRd}` : "—"}
                </span>
              </div>

              <div
                className="flex flex-col justify-center items-center rounded-lg border border-white/10 bg-[#0C0C10]/90 px-3 py-2 text-center"
                title={
                  load.isOverloaded
                    ? `Deslocamento reduzido em -3m por Sobrecarga (Base ${agent.defense.displacement}m)`
                    : `Deslocamento por ação de movimento: ${effectiveDisplacement}m (${Math.floor(effectiveDisplacement / 1.5)} quadrados)`
                }
              >
                <span className="inline-flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                  <Footprints className="h-2.5 w-2.5" /> Desl.
                </span>
                <span
                  className={cn(
                    "font-mono text-xl font-bold tabular-nums mt-0.5",
                    load.isOverloaded ? "text-amber-300" : "text-zinc-200"
                  )}
                >
                  {effectiveDisplacement}m
                </span>
                {load.isOverloaded && (
                  <span className="inline-flex items-center justify-center gap-0.5 font-mono text-[9px] text-amber-400">
                    <AlertTriangle className="h-2.5 w-2.5" /> -3m
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Active Interlude Bonus Dice & Mission PE Penalty Strip */}
          {((agent.interludeBonusDice?.length ?? 0) > 0 ||
            (agent.missionPeMaxPenalty ?? 0) > 0) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-[#1E1E26] pt-2.5">
              {(agent.interludeBonusDice ?? []).length > 0 && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E]">
                  Bônus de Interlúdio (clique para rolar e gastar):
                </span>
              )}
              {(agent.interludeBonusDice ?? []).map((die) => (
                <div
                  key={die.id}
                  className={cn(
                    "inline-flex items-center rounded-sm border font-mono text-[11px] overflow-hidden",
                    die.source === "exercitar"
                      ? "border-emerald-500/40 bg-emerald-600/10 text-emerald-300"
                      : "border-purple-500/40 bg-purple-600/10 text-purple-300"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleSpendBonusDie(die)}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 hover:bg-white/10 transition-colors"
                    title={`Rolar e gastar ${die.label}`}
                  >
                    {die.source === "exercitar" ? (
                      <Dumbbell className="h-3 w-3" />
                    ) : (
                      <BookOpen className="h-3 w-3" />
                    )}
                    <span>
                      +{die.dieFormula} ({die.appliesTo.join("/")})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate((prev) => ({
                        ...prev,
                        interludeBonusDice: (
                          prev.interludeBonusDice ?? []
                        ).filter((d) => d.id !== die.id),
                      }))
                    }
                    className="px-1 py-0.5 opacity-60 hover:opacity-100 border-l border-current/20"
                    title="Descartar dado bônus sem rolar"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}

              {(agent.missionPeMaxPenalty ?? 0) > 0 && (
                <div className="ml-auto inline-flex items-center gap-2 rounded-sm border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-300">
                  <span>
                    Sucesso a Qualquer Custo: -{agent.missionPeMaxPenalty}{" "}
                    {vitals.usingPd ? "PD" : "PE"} máx.
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate((prev) => ({ ...prev, missionPeMaxPenalty: 0 }))
                    }
                    className="inline-flex items-center gap-0.5 underline hover:text-white"
                    title="Restaurar ao fim da missão"
                  >
                    <RotateCcw className="h-2.5 w-2.5" /> Restaurar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Assistente de Interlúdio */}
      <InterludeModal
        open={interludeOpen}
        onClose={() => setInterludeOpen(false)}
        agent={agent}
        onUpdate={onUpdate}
      />

      {/* Modal: Configurar Dossiê (Origem, Classe, Trilha, Patente, Afinidade, Transcender) */}
      <Modal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        title="Configuração do Dossiê"
        description="Edite identidade, origem, classe, trilha, patente, afinidade e regras opcionais."
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
              Nome do Jogador
            </label>
            <Input
              value={agent.player}
              onChange={(e) =>
                onUpdate((prev) => ({ ...prev, player: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Classe
              </label>
              <Select
                value={agent.classId}
                onChange={(e) => {
                  const nextClass = e.target.value as AgentClassId;
                  onUpdate((prev) => ({
                    ...prev,
                    classId: nextClass,
                    trilhaId: null,
                    nex:
                      nextClass === "sobrevivente"
                        ? 0
                        : Math.max(5, prev.nex || 5),
                    stage:
                      nextClass === "sobrevivente"
                        ? prev.stage ?? 1
                        : undefined,
                  }));
                }}
              >
                {ALL_CLASSES.filter(
                  (c) =>
                    !isCommunitySource(c.source) ||
                    c.id === agent.classId ||
                    (agent.enabledSources ?? []).includes(c.source)
                ).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {isCommunitySource(c.source) ? " (Comunidade)" : ""}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Trilha
              </label>
              <Select
                value={normalizedTrailVal}
                disabled={!trilhaUnlocked}
                onChange={(e) =>
                  onUpdate((prev) => ({
                    ...prev,
                    trilhaId: e.target.value || null,
                  }))
                }
              >
                <option value="">
                  {trilhaUnlocked ? "Sem trilha" : "Bloqueada (NEX 10% / Est. 2)"}
                </option>
                {classTrails.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Origem
              </label>
              <Select
                value={normalizedOriginVal}
                onChange={(e) =>
                  onUpdate((prev) => ({ ...prev, originId: e.target.value }))
                }
              >
                {allOrigins.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Patente
              </label>
              <Select
                value={agent.patente}
                onChange={(e) =>
                  onUpdate((prev) => ({
                    ...prev,
                    patente: e.target.value as Patente,
                  }))
                }
              >
                {PATENTES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Afinidade (NEX 50%+)
              </label>
              <Select
                value={agent.affinityElement ?? ""}
                disabled={!affinityUnlocked}
                onChange={(e) =>
                  onUpdate((prev) => ({
                    ...prev,
                    affinityElement:
                      (e.target.value as ParanormalElement) || undefined,
                  }))
                }
              >
                <option value="">
                  {affinityUnlocked ? "Nenhuma" : "Requer NEX 50%+"}
                </option>
                {ELEMENTS.map((el) => (
                  <option key={el} value={el}>
                    {el}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Transcender (reduz ganho SAN)
              </label>
              <div className="flex h-9 items-center justify-between rounded-sm border border-[#22222A] bg-[#09090B] px-3 font-mono text-xs">
                <button
                  type="button"
                  onClick={() =>
                    onUpdate((prev) => ({
                      ...prev,
                      transcenderCount: Math.max(
                        0,
                        (prev.transcenderCount ?? 0) - 1
                      ),
                    }))
                  }
                  className="text-[#8E8E9E] hover:text-[#F4F4F5] px-1.5"
                >
                  -
                </button>
                <span className="font-bold text-[#F4F4F5] tabular-nums">
                  {vitals.transcenderCount}×
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdate((prev) => ({
                      ...prev,
                      transcenderCount: (prev.transcenderCount ?? 0) + 1,
                    }))
                  }
                  className="text-[#8E8E9E] hover:text-[#F4F4F5] px-1.5"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-[#22222A] pt-3">
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block">
              Organização da Realidade
            </label>
            <Select
              value={getOrganization(agent.organization).id}
              onChange={(e) =>
                onUpdate((prev) => ({
                  ...prev,
                  organization: e.target.value as OrganizationId,
                }))
              }
            >
              {ORGANIZATIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
            {(() => {
              const org = getOrganization(agent.organization);
              return (
                <div className="rounded-sm border border-[#22222A] bg-[#0B0B0F] p-2.5 space-y-1">
                  <p className="font-mono text-[10px] font-bold text-[#D4D4D8]">
                    {org.abilityName}
                  </p>
                  <p className="text-[11px] text-[#A1A1AA]">
                    {org.abilityDescription}
                  </p>
                  <ul className="list-disc pl-4 text-[11px] text-[#8E8E9E]">
                    {org.rules.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>

          <div className="space-y-2 border-t border-[#22222A] pt-3">
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block">
              Livros & Suplementos Ativos nesta Ficha
            </label>
            <SourceToggleGroup
              compact
              enabled={agent.enabledSources}
              onToggle={(src) =>
                onUpdate((prev) => ({
                  ...prev,
                  enabledSources: toggleSourceList(prev.enabledSources, src),
                }))
              }
              onSetCommunity={(on) =>
                onUpdate((prev) => ({
                  ...prev,
                  enabledSources: setCommunityList(prev.enabledSources, on),
                }))
              }
            />
          </div>

          <div className="flex justify-end pt-2 border-t border-[#22222A]">
            <Button variant="primary" onClick={() => setConfigOpen(false)}>
              Concluir
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
