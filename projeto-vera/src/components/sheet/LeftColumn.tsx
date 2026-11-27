"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertOctagon,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Dices,
  Footprints,
  Plus,
  Shield,
  SlidersHorizontal,
  Swords,
  Trash2,
  X,
} from "lucide-react";
import type { Agent, AttributeKey } from "@/types/ordem";
import { getOriginById } from "@/data/origins";
import { getAgentSkillList } from "@/data/skills";
import { COMMUNITY_CONDITIONS } from "@/data/supplements";
import {
  calculateCombatStats,
  calculateLoadAndCategories,
  evaluateVitalConditions,
  getAgentEffectiveVitals,
  getTrailCarryBonus,
} from "@/lib/ordem-rules";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { AttributePentagram } from "./AttributePentagram";
import { Badge, Button, Card, Input, Select } from "@/components/ui/primitives";

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

export function LeftColumn({
  agent,
  onUpdate,
  onRollAttribute,
  isSkillsOpen = false,
  onOpenSkills,
}: {
  agent: Agent;
  onUpdate: (updater: (prev: Agent) => Agent) => void;
  onRollAttribute: (key: AttributeKey) => void;
  isSkillsOpen?: boolean;
  onOpenSkills?: () => void;
}) {
  const { setQuickRollerOpen } = useAppStore();
  const [newResType, setNewResType] = useState("Balístico");
  const [newResVal, setNewResVal] = useState(5);

  const [condPopoverOpen, setCondPopoverOpen] = useState(false);
  const [rdPopoverOpen, setRdPopoverOpen] = useState(false);
  const [defAdjustOpen, setDefAdjustOpen] = useState(false);
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

  const skillList = getAgentSkillList(agent);
  const trainedSkillsCount = skillList.filter((s) => s.treinamento > 0).length;

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
    agent.defense.displacement !== 9;

  return (
    <div className="space-y-3.5">
      {/* Card 1: Atributos (Pentagrama grande estilo C.R.I.S.) */}
      <AttributePentagram
        attributes={agent.attributes}
        onRollAttribute={onRollAttribute}
        onChangeAttribute={(key, val) =>
          onUpdate((prev) => ({
            ...prev,
            attributes: { ...prev.attributes, [key]: val },
          }))
        }
      />

      {/* Botão de Destaque para Perícias (abre a aba Perícias no container principal da direita) */}
      {onOpenSkills && (
        <button
          type="button"
          onClick={onOpenSkills}
          className={cn(
            "group flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-all shadow-sm",
            isSkillsOpen
              ? "border-white bg-[#1A1A24] text-white shadow-[0_0_20px_rgba(255,255,255,0.08)]"
              : "border-white/15 bg-zinc-950/85 hover:border-white/35 hover:bg-[#14141C] text-zinc-100"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors",
                isSkillsOpen
                  ? "border-white/40 bg-white text-zinc-950"
                  : "border-white/15 bg-[#14141C] text-zinc-200 group-hover:border-white/30"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-bold tracking-wide">
                Perícias ({trainedSkillsCount} treinadas)
              </div>
              <div className="text-[11px] text-zinc-400 truncate">
                {isSkillsOpen
                  ? "Exibindo todas as perícias no painel ao lado"
                  : `Clique para abrir e rolar as ${skillList.length} perícias`}
              </div>
            </div>
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 transition-transform",
              isSkillsOpen
                ? "text-white translate-x-0.5"
                : "text-zinc-400 group-hover:text-white group-hover:translate-x-0.5"
            )}
          />
        </button>
      )}

      {/* Card 2: Condições e Resistências sob demanda (Progressive Disclosure) */}
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
              <span>Resistências (RD)</span>
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
