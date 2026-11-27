"use client";

import React, { useState } from "react";
import {
  AlertOctagon,
  Footprints,
  Plus,
  Shield,
  Swords,
  Trash2,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { AttributePentagram } from "./AttributePentagram";
import { FreeDiceRoller } from "@/components/FreeDiceRoller";
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
}: {
  agent: Agent;
  onUpdate: (updater: (prev: Agent) => Agent) => void;
  onRollAttribute: (key: AttributeKey) => void;
}) {
  const [newResType, setNewResType] = useState("Balístico");
  const [newResVal, setNewResVal] = useState(5);

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

  return (
    <div className="space-y-4">
      {/* Card 1: Atributos (Pentagrama clicável) */}
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

      {/* Card 2: Dados Soltos (d4, d6, d8, d10, d12, d20) */}
      <FreeDiceRoller actorName={agent.name} actorId={agent.id} compact />

      {/* Card 3: Resistências, Modificadores de Defesa & Condições */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-[#22222A] pb-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8E8E9E]">
            <Shield className="h-3 w-3" /> RESISTÊNCIAS & CONDIÇÕES
          </span>
        </div>

        {/* Condições de Estado */}
        <div className="space-y-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
            Condições Ativas
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              {
                key: "machucado" as const,
                label: "Machucado",
                active: agent.status.machucado || autoConds.machucado,
                cls: "border-amber-500/40 bg-amber-500/10 text-amber-300",
              },
              {
                key: "perturbado" as const,
                label: "Perturbado",
                active: Boolean(agent.status.perturbado || autoConds.perturbado),
                cls: "border-sky-500/40 bg-sky-500/10 text-sky-300",
              },
              {
                key: "morrendo" as const,
                label: "Morrendo",
                active: agent.status.morrendo,
                cls: "border-red-600/50 bg-red-600/15 text-red-300",
              },
              {
                key: "enlouquecendo" as const,
                label: "Enlouquecendo",
                active: agent.status.enlouquecendo,
                cls: "border-purple-600/50 bg-purple-600/15 text-purple-300",
              },
              {
                key: "vulneravel" as const,
                label: "Vulnerável (-2)",
                active: Boolean(agent.status.vulneravel),
                cls: "border-orange-500/40 bg-orange-500/10 text-orange-300",
              },
              {
                key: "desorientado" as const,
                label: "Desorientado (-3 Def)",
                active: Boolean(agent.status.desorientado),
                cls: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
                title: desorientadoDef
                  ? `${desorientadoDef.name} (${desorientadoDef.kind}): ${desorientadoDef.description}`
                  : undefined,
              },
            ].map((cond) => (
              <label
                key={cond.key}
                title={"title" in cond ? cond.title : undefined}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-1 rounded-sm border px-2 py-1.5 font-mono text-[10px] transition-colors select-none",
                  cond.active
                    ? cond.cls
                    : "border-[#22222A] bg-[#09090B] text-[#8E8E9E] hover:text-[#D4D4D8]"
                )}
              >
                <input
                  type="checkbox"
                  checked={cond.active}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      status: {
                        ...prev.status,
                        [cond.key]: e.target.checked,
                        ...(cond.key === "morrendo" && !e.target.checked
                          ? { morrendoTurns: 0 }
                          : {}),
                        ...(cond.key === "enlouquecendo" && !e.target.checked
                          ? { enlouquecendoTurns: 0 }
                          : {}),
                      },
                    }))
                  }
                  className="sr-only"
                />
                {cond.active && <AlertOctagon className="h-2.5 w-2.5 shrink-0" />}
                <span className="truncate">{cond.label}</span>
              </label>
            ))}

            <div
              className={cn(
                "flex items-center justify-center rounded-sm border px-2 py-1.5 font-mono text-[10px]",
                load.isOverloaded
                  ? "border-red-600/40 bg-red-600/10 text-red-300"
                  : "border-[#22222A] bg-[#09090B] text-[#6E6E7E]"
              )}
              title={
                load.isOverloaded
                  ? "Sobrecarregado: -5 Defesa, -5 perícias de carga, -3m deslocamento"
                  : "Capacidade de carga dentro do normal"
              }
            >
              {load.isOverloaded ? "Sobrecarregado" : "Carga Normal"}
            </div>
          </div>

          {(agent.status.morrendo || agent.status.enlouquecendo) && (
            <div className="rounded-sm border border-red-600/30 bg-red-600/5 p-2 space-y-1.5 font-mono text-[10px]">
              {agent.status.morrendo && (
                <div className="flex items-center justify-between">
                  <span className="text-red-300">
                    MORRENDO ({morrendoMaxTurns}T)
                  </span>
                  <div className="flex gap-1">
                    {Array.from({ length: morrendoMaxTurns }, (_, i) => i + 1).map(
                      (t) => (
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
                            "h-5 w-5 rounded-sm border font-bold",
                            (agent.status.morrendoTurns ?? 0) >= t
                              ? "border-red-500 bg-red-600 text-white"
                              : "border-[#22222A] bg-[#09090B] text-[#6E6E7E]"
                          )}
                        >
                          {t}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
              {agent.status.enlouquecendo && (
                <div className="flex items-center justify-between">
                  <span className="text-purple-300">
                    ENLOUQ. ({enlouquecendoMaxTurns}T)
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
                          "h-5 w-5 rounded-sm border font-bold",
                          (agent.status.enlouquecendoTurns ?? 0) >= t
                            ? "border-purple-500 bg-purple-600 text-white"
                            : "border-[#22222A] bg-[#09090B] text-[#6E6E7E]"
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
        </div>

        {/* Resistências a Dano (RD) */}
        <div className="border-t border-[#22222A] pt-3 space-y-2">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
            Resistências a Dano (RD)
          </span>
          <div className="flex flex-wrap gap-1">
            {originBloodRd > 0 && (
              <Badge
                variant="danger"
                className="font-mono text-[10px]"
                title={`RD a Sangue automática da origem ${originDef?.name ?? ""}`}
              >
                Sangue {originBloodRd} (Origem)
              </Badge>
            )}
            {Object.entries(agent.defense.resistances).length === 0 &&
            originBloodRd === 0 ? (
              <span className="text-[11px] text-[#6E6E7E]">
                Nenhuma RD registrada.
              </span>
            ) : (
              Object.entries(agent.defense.resistances).map(([type, val]) => (
                <Badge
                  key={type}
                  variant="default"
                  className="font-mono text-[10px] gap-1 pr-1"
                >
                  <span>
                    {type} {val}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeResistance(type)}
                    className="text-[#6E6E7E] hover:text-red-400"
                    aria-label={`Remover RD ${type}`}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <div className="flex gap-1">
            <Select
              value={newResType}
              onChange={(e) => setNewResType(e.target.value)}
              className="h-7 text-xs flex-1"
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
              className="h-7 w-12 font-mono text-xs text-center px-1"
            />
            <Button size="xs" variant="default" onClick={addResistance}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Ajustes Manuais de Defesa, Deslocamento & Contra-ataque */}
        <div className="border-t border-[#22222A] pt-3 space-y-2.5">
          <div
            className={cn(
              "flex items-center justify-between rounded-sm border px-2.5 py-1.5 font-mono text-[10px]",
              combat.canCounterAttack
                ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-300"
                : "border-[#22222A] bg-[#09090B] text-[#6E6E7E]"
            )}
          >
            <span className="inline-flex items-center gap-1">
              <Swords className="h-3 w-3" /> CONTRA-ATAQUE
            </span>
            <span>{combat.canCounterAttack ? "DISPONÍVEL" : "REQ. LUTA"}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="font-mono text-[9px] uppercase text-[#6E6E7E] block mb-1">
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
              <label className="font-mono text-[9px] uppercase text-[#6E6E7E] block mb-1">
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
              <label className="font-mono text-[9px] uppercase text-[#6E6E7E] flex items-center gap-0.5 mb-1">
                <Footprints className="h-2.5 w-2.5" /> Desl
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
        </div>
      </Card>
    </div>
  );
}
