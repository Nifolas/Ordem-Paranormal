"use client";

import React, { useMemo, useState } from "react";
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
  Plus,
  RotateCcw,
  Settings2,
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
import { COMMUNITY_TRAILS } from "@/data/supplements";
import { isCommunitySource } from "@/data/sources";
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

  return (
    <div className="rounded-sm border border-[#22222A] bg-[#09090B] px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={cn(
              "font-mono text-[11px] font-bold uppercase tracking-wider",
              accentClass
            )}
          >
            {label}
          </span>
          {alertBadge && (
            <span className="rounded-sm border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.2 font-mono text-[9px] uppercase text-amber-300">
              {alertBadge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 font-mono text-xs shrink-0 tabular-nums">
          <NumericInput
            value={current}
            onValueChange={(val) => onSetCurrent(Math.max(0, val))}
            aria-label={`${label} atual`}
            className="w-11 rounded-sm bg-[#101014] border border-[#22222A] px-1 py-0.5 text-right font-bold text-[#F4F4F5] focus:outline-none focus:border-[#525266]"
          />
          <span className="text-[#6E6E7E]">/</span>
          {autoCalc ? (
            <span className="min-w-[24px] text-left font-semibold text-[#D4D4D8]">
              {max}
            </span>
          ) : (
            <NumericInput
              min={1}
              fallback={1}
              value={max}
              onValueChange={(val) => onSetMaxOverride(Math.max(1, val))}
              aria-label={`${label} máximo manual`}
              className="w-11 rounded-sm bg-[#101014] border border-[#525266] px-1 py-0.5 text-left font-bold text-[#F4F4F5] focus:outline-none"
            />
          )}
          <button
            type="button"
            onClick={onToggleAuto}
            title={
              autoCalc
                ? "Auto-cálculo ativo (clique para editar máximo manualmente)"
                : "Manual ativo (clique para voltar ao auto-cálculo)"
            }
            className={cn(
              "rounded-sm p-1 border transition-colors",
              autoCalc
                ? "border-[#22222A] text-[#6E6E7E] hover:text-[#F4F4F5]"
                : "border-[#525266] bg-[#16161C] text-[#F4F4F5]"
            )}
          >
            {autoCalc ? (
              <Lock className="h-2.5 w-2.5" />
            ) : (
              <Unlock className="h-2.5 w-2.5" />
            )}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-[#1A1A22] overflow-hidden">
        <div
          className={cn("h-full transition-all duration-200", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Quick deltas + Temp */}
      <div className="flex items-center gap-1">
        <div className="grid grid-cols-4 gap-1 flex-1">
          {[-5, -1, 1, 5].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => onAdjust(delta)}
              className="rounded-sm border border-[#22222A] bg-[#101014] py-0.5 font-mono text-[10px] text-[#A1A1AA] hover:border-[#32323E] hover:bg-[#16161C] hover:text-[#F4F4F5] transition-colors"
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
        </div>
        {onSetTemp && (
          <div
            className="flex items-center gap-1 rounded-sm border border-[#22222A] bg-[#101014] px-1.5 py-0.5"
            title="Pontos temporários"
          >
            <span className="font-mono text-[9px] text-[#6E6E7E]">TMP</span>
            <NumericInput
              min={0}
              value={temp ?? 0}
              onValueChange={(val) => onSetTemp(Math.max(0, val))}
              aria-label={`${label} temporário`}
              className="w-7 bg-transparent font-mono text-[10px] font-semibold text-emerald-400 text-center focus:outline-none tabular-nums"
            />
          </div>
        )}
      </div>
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

  const allOrigins = useMemo(
    () => [...BASE_ORIGINS, ...homebrew.origins],
    [homebrew.origins]
  );

  const classTrails = useMemo(() => {
    return [
      ...BASE_TRAILS,
      ...COMMUNITY_TRAILS,
      ...(homebrew.trails ?? []),
    ].filter(
      (t) => t.classId === agent.classId
    );
  }, [agent.classId, homebrew.trails]);

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
        halfInitialSan:
          normalizeCatalogId(prev.originId) === "cultista_arrependido",
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
          "rounded-md border border-[#22222A] bg-[#101014] border-l-[3px] overflow-hidden",
          elemStyle ? elemStyle.borderLeft : "border-l-[#525266]"
        )}
      >
        {/* Top Utility Hairline */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22222A] bg-[#0C0C10] px-4 py-2">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#8E8E9E]">
            <Link
              href="/agentes"
              className="inline-flex items-center gap-1 hover:text-[#F4F4F5] transition-colors"
            >
              <ArrowLeft className="h-3 w-3" /> AGENTES
            </Link>
            <span>/</span>
            <span className="uppercase tracking-wider text-[#D4D4D8]">
              DOSSIÊ #{agent.id.slice(-6).toUpperCase()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* ±1d20 Global Mod */}
            <div className="flex items-center gap-1 rounded-sm border border-[#22222A] bg-[#09090B] px-2 py-0.5 font-mono text-[11px]">
              <span className="text-[10px] uppercase text-[#8E8E9E] mr-1">
                MOD d20
              </span>
              <button
                type="button"
                onClick={() => setQuickDiceMod(quickDiceMod - 1)}
                className="rounded-sm p-0.5 text-[#8E8E9E] hover:bg-[#16161C] hover:text-[#F4F4F5]"
                title="Desvantagem (-1d20)"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span
                className={cn(
                  "min-w-[36px] text-center font-bold tabular-nums",
                  quickDiceMod > 0
                    ? "text-emerald-400"
                    : quickDiceMod < 0
                    ? "text-red-400"
                    : "text-[#D4D4D8]"
                )}
              >
                {quickDiceMod === 0 ? "0" : `${formatSigned(quickDiceMod)}d`}
              </span>
              <button
                type="button"
                onClick={() => setQuickDiceMod(quickDiceMod + 1)}
                className="rounded-sm p-0.5 text-[#8E8E9E] hover:bg-[#16161C] hover:text-[#F4F4F5]"
                title="Vantagem (+1d20)"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            <Button
              variant="default"
              size="xs"
              onClick={() => setInterludeOpen(true)}
              className="font-mono"
              title="Abrir Assistente de Cena de Interlúdio (Dormir, Relaxar, Alimentar-se, Exercitar, Ler...)"
            >
              <Coffee className="h-3 w-3 text-amber-400" /> Interlúdio
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={handleTogglePdRule}
              className="font-mono"
              title="Alternar regra opcional Pontos de Determinação (SaH)"
            >
              {vitals.usingPd ? "MODO PD" : "SAN / PE"}
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={() => setConfigOpen(true)}
              className="font-mono"
            >
              <Settings2 className="h-3 w-3" /> Configurar
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={() => exportAgentToJson(agent)}
              className="font-mono"
            >
              <Download className="h-3 w-3" /> JSON
            </Button>
          </div>
        </div>

        {/* Row 1: Identity Strip */}
        <div className="px-4 py-3.5 sm:px-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <label className="group relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-sm border border-[#2C2C38] bg-[#09090B]">
              {agent.avatar ? (
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono text-base font-bold text-[#D4D4D8]">
                  {agent.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 transition-opacity group-hover:opacity-100">
                <Upload className="h-4 w-4 text-[#F4F4F5]" />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  value={agent.name}
                  onChange={(e) =>
                    onUpdate((prev) => ({ ...prev, name: e.target.value }))
                  }
                  aria-label="Nome do agente"
                  className="bg-transparent font-display text-xl sm:text-2xl font-bold tracking-tight text-[#F4F4F5] border-b border-transparent hover:border-[#32323E] focus:border-[#F4F4F5] focus:outline-none max-w-full"
                />
                {agent.player && (
                  <span className="font-mono text-[11px] text-[#6E6E7E]">
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
                    <span className={cn("h-1.5 w-1.5", elemStyle.dot)} />
                    AFINIDADE {agent.affinityElement}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] uppercase tracking-wider text-[#8E8E9E]">
                <span className="text-[#D4D4D8]">
                  {origin?.name ?? "Origem"}
                </span>
                {professionSpec && (
                  <>
                    <span>·</span>
                    <span className="text-[#D4D4D8]">{professionSpec}</span>
                  </>
                )}
                <span>·</span>
                <span className="text-[#D4D4D8]">{cls.name}</span>
                {trail && (
                  <>
                    <span>·</span>
                    <span className="text-[#D4D4D8]">{trail.name}</span>
                  </>
                )}
                <span>·</span>
                <span>{agent.patente}</span>
                <span>·</span>
                <span>
                  LIM {vitals.usingPd ? "PD" : "PE"} {vitals.peLimit}
                </span>
              </div>
            </div>
          </div>

          {/* NEX / Stage Selector */}
          <div className="flex items-center gap-2 shrink-0">
            {agent.classId === "sobrevivente" ? (
              <select
                value={agent.stage ?? 1}
                onChange={(e) => handleStageChange(Number(e.target.value))}
                aria-label="Seletor de Estágio"
                className="h-9 rounded-sm border border-[#32323E] bg-[#09090B] px-3 font-mono text-xs font-bold text-[#F4F4F5] focus:outline-none focus:border-[#F4F4F5]"
              >
                {SURVIVOR_STAGES.map((st) => (
                  <option key={st} value={st}>
                    ESTÁGIO {st} (NEX 0%)
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={agent.nex}
                onChange={(e) => handleNexChange(Number(e.target.value))}
                aria-label="Seletor de NEX"
                className="h-9 rounded-sm border border-[#32323E] bg-[#09090B] px-3 font-mono text-xs font-bold text-[#F4F4F5] focus:outline-none focus:border-[#F4F4F5]"
              >
                {NEX_STEPS.map((n) => (
                  <option key={n} value={n}>
                    NEX {n}%
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Row 2: Dedicated Status & Combat Strip (PV, SAN, PE/PD + Defesa, Esquiva, Bloqueio, Deslocamento) */}
        <div className="border-t border-[#22222A] bg-[#0B0B0F] px-4 py-3 sm:px-5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] items-stretch">
            {/* Resource Bars */}
            <div
              className={cn(
                "grid gap-2.5",
                vitals.usingPd
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-3"
              )}
            >
              <HeaderResourceBar
                label="PV"
                accentClass="text-red-400"
                barColor="bg-[#DC2626]"
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
                  accentClass="text-purple-400"
                  barColor="bg-[#9333EA]"
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
                    accentClass="text-sky-400"
                    barColor="bg-sky-500"
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
                    accentClass="text-amber-400"
                    barColor="bg-amber-500"
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

            {/* Compact Defense / Esquiva / Bloqueio / Deslocamento Quartet */}
            <div className="grid grid-cols-4 divide-x divide-[#22222A] rounded-sm border border-[#22222A] bg-[#09090B] font-mono text-center lg:min-w-[296px]">
              <div className="flex flex-col justify-center px-2.5 py-2">
                <span className="text-[9px] uppercase tracking-wider text-[#8E8E9E]">
                  DEFESA
                </span>
                <span className="text-xl font-bold text-[#F4F4F5] tabular-nums">
                  {combat.defense}
                </span>
              </div>
              <div
                className={cn(
                  "flex flex-col justify-center px-2.5 py-2",
                  !combat.canDodge && "opacity-45"
                )}
                title={
                  combat.canDodge
                    ? "Esquiva (Defesa + Reflexos)"
                    : "Requer Reflexos treinado"
                }
              >
                <span className="text-[9px] uppercase tracking-wider text-[#8E8E9E]">
                  ESQUIVA
                </span>
                <span className="text-xl font-bold text-[#D4D4D8] tabular-nums">
                  {combat.canDodge ? combat.dodge : "—"}
                </span>
              </div>
              <div
                className={cn(
                  "flex flex-col justify-center px-2.5 py-2",
                  !combat.canBlock && "opacity-45"
                )}
                title={
                  combat.canBlock
                    ? "Bloqueio (RD igual a Fortitude)"
                    : "Requer Fortitude treinado"
                }
              >
                <span className="text-[9px] uppercase tracking-wider text-[#8E8E9E]">
                  BLOQ. RD
                </span>
                <span className="text-xl font-bold text-[#D4D4D8] tabular-nums">
                  {combat.canBlock ? combat.blockRd : "—"}
                </span>
              </div>
              <div
                className="flex flex-col justify-center px-2.5 py-2"
                title={
                  load.isOverloaded
                    ? `Deslocamento reduzido (-3m por Sobrecarga)`
                    : "Deslocamento base por rodada"
                }
              >
                <span className="inline-flex items-center justify-center gap-0.5 text-[9px] uppercase tracking-wider text-[#8E8E9E]">
                  <Footprints className="h-2.5 w-2.5" /> DESL.
                </span>
                <span
                  className={cn(
                    "text-xl font-bold tabular-nums",
                    load.isOverloaded ? "text-amber-300" : "text-[#D4D4D8]"
                  )}
                >
                  {effectiveDisplacement}m
                </span>
                {load.isOverloaded && (
                  <span className="inline-flex items-center justify-center gap-0.5 text-[8px] text-amber-400">
                    <AlertTriangle className="h-2 w-2" /> -3m
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
              value={agent.organization ?? "ordo_realitas"}
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
