"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Dices,
  Heart,
  PawPrint,
  Plus,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import type {
  Agent,
  AgentAlly,
  AllyTemplateId,
  AllyType,
  SkillKey,
} from "@/types/ordem";
import {
  ALLY_TEMPLATES,
  buildAllyFromTemplate,
  type AllyTemplateDefinition,
} from "@/data/allies";
import { SKILLS_BY_KEY, SKILLS_LIST } from "@/data/skills";
import {
  getAgentEffectiveVitals,
  rollDiceFormula,
} from "@/lib/ordem-rules";
import { cn, generateId } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import {
  Badge,
  Button,
  Input,
  Modal,
  NumericInput,
  Select,
  Textarea,
} from "@/components/ui/primitives";

export function AlliesTab({
  agent,
  onUpdate,
  spendResource,
}: {
  agent: Agent;
  onUpdate: (updater: (prev: Agent) => Agent) => void;
  spendResource: (cost: number) => boolean;
}) {
  const { pushRoll } = useAppStore();
  const vitals = getAgentEffectiveVitals(agent);
  const resUnit = vitals.usingPd ? "PD" : "PE";

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    AllyTemplateId | "custom"
  >("acolito");
  const [customName, setCustomName] = useState("");
  const [chosenSkills, setChosenSkills] = useState<SkillKey[]>([]);
  const [customKind, setCustomKind] = useState<AllyType>("aliado");
  const [customBonusSummary, setCustomBonusSummary] = useState("");
  const [customFlatSkill, setCustomFlatSkill] = useState<SkillKey | "">("");
  const [customFlatValue, setCustomFlatValue] = useState(2);
  const [customAbilityName, setCustomAbilityName] = useState("");
  const [customAbilityCost, setCustomAbilityCost] = useState(1);
  const [customAbilityDesc, setCustomAbilityDesc] = useState("");
  const [customAbilityFormula, setCustomAbilityFormula] = useState("");
  const [expandedPetIds, setExpandedPetIds] = useState<Record<string, boolean>>(
    {}
  );

  const allies = agent.allies ?? [];
  const activeTemplate: AllyTemplateDefinition | undefined = ALLY_TEMPLATES.find(
    (t) => t.id === selectedTemplateId
  );

  const resetModal = () => {
    setSelectedTemplateId("acolito");
    setCustomName("");
    setChosenSkills([]);
    setCustomKind("aliado");
    setCustomBonusSummary("");
    setCustomFlatSkill("");
    setCustomFlatValue(2);
    setCustomAbilityName("");
    setCustomAbilityCost(1);
    setCustomAbilityDesc("");
    setCustomAbilityFormula("");
  };

  const toggleChosenSkill = (sk: SkillKey, maxCount: number) => {
    setChosenSkills((prev) => {
      if (prev.includes(sk)) return prev.filter((x) => x !== sk);
      if (prev.length >= maxCount) return [...prev.slice(1), sk];
      return [...prev, sk];
    });
  };

  const handleAddAlly = (e: React.FormEvent) => {
    e.preventDefault();
    let created: AgentAlly;

    if (selectedTemplateId === "custom") {
      if (!customName.trim()) return;
      const flatBonuses =
        customFlatSkill && customFlatValue !== 0
          ? { [customFlatSkill]: customFlatValue }
          : undefined;
      created = {
        id: generateId("ally"),
        templateId: "custom",
        name: customName.trim(),
        kind: customKind,
        helping: true,
        bonusSummary:
          customBonusSummary.trim() ||
          (customFlatSkill
            ? `+${customFlatValue} em ${SKILLS_BY_KEY[customFlatSkill]?.name}`
            : "Apoio tático customizado."),
        skillFlatBonuses: flatBonuses,
        abilityName: customAbilityName.trim() || "Apoio Especial",
        abilityPeCost: Math.max(0, customAbilityCost),
        abilityDescription:
          customAbilityDesc.trim() || "Habilidade ativa do aliado/pet.",
        abilityRollFormula: customAbilityFormula.trim() || undefined,
        dangerRuleEnabled: false,
        wounds: 0,
        combatStatsEnabled: customKind === "pet",
        petPv: 12,
        petMaxPv: 12,
        petDefense: 12,
        petAttack: "Ataque 1d6",
      };
    } else if (activeTemplate) {
      created = buildAllyFromTemplate({
        id: generateId("ally"),
        template: activeTemplate,
        customName,
        chosenSkills,
        customAbilityName:
          selectedTemplateId === "companheiro_animal"
            ? customAbilityName
            : undefined,
        customAbilityDescription:
          selectedTemplateId === "companheiro_animal"
            ? customAbilityDesc
            : undefined,
      });
    } else {
      return;
    }

    onUpdate((prev) => ({
      ...prev,
      allies: [created, ...(prev.allies ?? [])],
    }));
    resetModal();
    setAddModalOpen(false);
  };

  const updateAlly = (allyId: string, patch: Partial<AgentAlly>) => {
    onUpdate((prev) => ({
      ...prev,
      allies: (prev.allies ?? []).map((a) =>
        a.id === allyId ? { ...a, ...patch } : a
      ),
    }));
  };

  const handleAvatarUpload = (
    allyId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateAlly(allyId, { avatar: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUseAllyAbility = (ally: AgentAlly) => {
    if (ally.dangerRuleEnabled && (ally.wounds ?? 0) >= 2) return;
    if (ally.abilityPeCost > 0 && !spendResource(ally.abilityPeCost)) return;

    if (ally.abilityRollFormula?.trim()) {
      try {
        const res = rollDiceFormula({ formula: ally.abilityRollFormula.trim() });
        pushRoll({
          actorName: `${agent.name} (${ally.name})`,
          actorId: agent.id,
          label: `Aliado · ${ally.abilityName}`,
          kind: "ability",
          formula: `${res.effectiveFormula} (-${ally.abilityPeCost} ${resUnit})`,
          diceRolled: res.diceRolled,
          mode: "sum",
          bonus: res.bonus,
          total: res.total,
          details: `${ally.abilityDescription} • ${res.breakdown}`,
        });
        return;
      } catch {
        // fallback to non-dice log
      }
    }

    pushRoll({
      actorName: `${agent.name} (${ally.name})`,
      actorId: agent.id,
      label: `Aliado · ${ally.abilityName}`,
      kind: "ability",
      formula:
        ally.abilityPeCost > 0
          ? `-${ally.abilityPeCost} ${resUnit}`
          : "Sem custo",
      diceRolled: [],
      bonus: 0,
      total: ally.abilityPeCost,
      details: ally.abilityDescription,
    });
  };

  const handleRollDangerCheck = (ally: AgentAlly) => {
    const res = rollDiceFormula({ formula: "1d6" });
    const isOdd = res.total % 2 === 1;
    const curWounds = ally.wounds ?? 0;
    const nextWounds = isOdd
      ? (Math.min(2, curWounds + 1) as 0 | 1 | 2)
      : curWounds;

    if (isOdd) {
      updateAlly(ally.id, {
        wounds: nextWounds,
        helping: nextWounds >= 2 ? false : ally.helping,
      });
    }

    pushRoll({
      actorName: ally.name,
      actorId: agent.id,
      label: `Aliado em Perigo (1d6): ${ally.name}`,
      kind: "free",
      formula: "1d6 (Par=Intacto, Ímpar=Ferido)",
      diceRolled: res.diceRolled,
      mode: "sum",
      bonus: 0,
      total: res.total,
      isNat1: isOdd,
      details: isOdd
        ? nextWounds >= 2
          ? `ÍMPAR (${res.total}): ${ally.name} sofreu o 2º ferimento e MORREU (2/2)!`
          : `ÍMPAR (${res.total}): ${ally.name} ficou FERIDO (1/2)!`
        : `PAR (${res.total}): ${ally.name} saiu ileso!`,
    });
  };

  const activeHelpingCount = allies.filter(
    (a) => a.helping && (!a.dangerRuleEnabled || (a.wounds ?? 0) < 2)
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-bold tracking-tight text-zinc-100">
            Aliados & Pets
          </h3>
          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 tabular-nums">
            {allies.length} · {activeHelpingCount} ativo
            {activeHelpingCount === 1 ? "" : "s"}
          </span>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            resetModal();
            setAddModalOpen(true);
          }}
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar Aliado / Pet
        </Button>
      </div>

      <p className="font-mono text-[11px] text-[#8E8E9E] -mt-2">
        Aliados marcados como &ldquo;Ajudando Atualmente&rdquo; aplicam seus
        bônus passivos automaticamente nas Perícias e Ataques (bônus iguais de
        múltiplos aliados não se acumulam).
      </p>

      {allies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2A2A35] bg-[#0C0C10]/90 p-10 text-center flex flex-col items-center justify-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-400">
            <PawPrint className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-md">
            <p className="text-sm font-semibold text-[#F4F4F5]">
              Nenhum aliado ou companheiro animal vinculado ao dossiê
            </p>
            <p className="text-xs text-[#8E8E9E] leading-relaxed">
              Adicione aliados (Acólito, Faz-Tudo, Guerrilheiro, Socorrista) ou pets (Cão Adestrado, Companheiro Animal) que concedem bônus passivos automáticos e habilidades em campo.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetModal();
              setAddModalOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar Primeiro Aliado / Pet
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {allies.map((ally) => {
            const wounds = ally.wounds ?? 0;
            const isDead = Boolean(ally.dangerRuleEnabled && wounds >= 2);
            const isWounded = Boolean(ally.dangerRuleEnabled && wounds === 1);
            const petExpanded = Boolean(expandedPetIds[ally.id]);

            return (
              <div
                key={ally.id}
                className={cn(
                  "rounded-md border p-4 space-y-3 transition-colors",
                  isDead
                    ? "border-red-600/40 bg-red-950/10 opacity-75"
                    : ally.helping
                    ? "border-[#3A3A48] bg-[#0D0D11]"
                    : "border-[#22222A] bg-[#0A0A0E] opacity-85"
                )}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Optional Avatar */}
                    <label className="group relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-sm border border-[#2C2C38] bg-[#09090B]">
                      {ally.avatar ? (
                        <img
                          src={ally.avatar}
                          alt={ally.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#8E8E9E]">
                          {ally.kind === "pet" ? (
                            <PawPrint className="h-4 w-4" />
                          ) : (
                            <Users className="h-4 w-4" />
                          )}
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="h-3 w-3 text-[#F4F4F5]" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAvatarUpload(ally.id, e)}
                        className="hidden"
                      />
                    </label>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display text-[15px] font-bold text-[#F4F4F5]">
                          {ally.name}
                        </h4>
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">
                          {ally.kind === "pet" ? "Pet" : "Aliado"}
                        </Badge>
                        {isDead && <Badge variant="danger">Morto (2/2)</Badge>}
                        {isWounded && (
                          <Badge variant="warning">Ferido (1/2)</Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#D4D4D8]">
                        <span className="font-mono text-[10px] uppercase text-[#8E8E9E] mr-1.5">
                          BÔNUS PASSIVO:
                        </span>
                        {ally.bonusSummary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={isDead}
                      onClick={() =>
                        updateAlly(ally.id, { helping: !ally.helping })
                      }
                      className={cn(
                        "rounded-sm border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors disabled:opacity-40",
                        ally.helping && !isDead
                          ? "border-emerald-500/45 bg-emerald-600/15 text-emerald-300"
                          : "border-[#22222A] bg-[#141419] text-[#8E8E9E] hover:text-[#D4D4D8]"
                      )}
                    >
                      {ally.helping && !isDead
                        ? "Ajudando"
                        : "Inativo"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdate((prev) => ({
                          ...prev,
                          allies: (prev.allies ?? []).filter(
                            (a) => a.id !== ally.id
                          ),
                        }))
                      }
                      className="rounded-sm p-1.5 text-[#6E6E7E] hover:bg-[#16161C] hover:text-red-400"
                      title="Remover aliado"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Active Ability Block */}
                <div className="rounded-sm border border-[#1E1E26] bg-[#121217] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-xs font-bold text-[#F4F4F5]">
                        {ally.abilityName}
                      </span>
                      <span className="font-mono text-[10px] text-amber-300">
                        {ally.abilityPeCost} {resUnit}
                      </span>
                      {ally.abilityRollFormula && (
                        <span className="font-mono text-[10px] text-[#8E8E9E]">
                          · {ally.abilityRollFormula}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">
                      {ally.abilityDescription}
                    </p>
                  </div>
                  <Button
                    size="xs"
                    variant="primary"
                    disabled={isDead}
                    onClick={() => handleUseAllyAbility(ally)}
                    className="shrink-0"
                  >
                    <Sparkles className="h-3 w-3" /> Usar Habilidade
                  </Button>
                </div>

                {/* Bottom Controls: Aliados em Perigo + Ficha de Pet */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#1A1A22]">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[#8E8E9E] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(ally.dangerRuleEnabled)}
                        onChange={(e) =>
                          updateAlly(ally.id, {
                            dangerRuleEnabled: e.target.checked,
                          })
                        }
                      />
                      Aliados em Perigo
                    </label>

                    {ally.dangerRuleEnabled && (
                      <div className="inline-flex items-center gap-1.5 font-mono text-[10px]">
                        <span className="text-[#6E6E7E]">Ferimentos:</span>
                        {([1, 2] as const).map((pip) => {
                          const marked = wounds >= pip;
                          return (
                            <button
                              key={pip}
                              type="button"
                              onClick={() => {
                                const next = (wounds === pip ? pip - 1 : pip) as
                                  | 0
                                  | 1
                                  | 2;
                                updateAlly(ally.id, {
                                  wounds: next,
                                  helping: next >= 2 ? false : ally.helping,
                                });
                              }}
                              className={cn(
                                "h-5 w-5 rounded-sm border font-bold transition-colors",
                                marked
                                  ? pip === 2
                                    ? "border-red-500 bg-red-600 text-white"
                                    : "border-amber-500 bg-amber-500/30 text-amber-200"
                                  : "border-[#22222A] bg-[#09090B] text-[#6E6E7E]"
                              )}
                              title={
                                pip === 1 ? "Ferido (1/2)" : "Morto (2/2)"
                              }
                            >
                              {pip}
                            </button>
                          );
                        })}
                        <Button
                          size="xs"
                          variant="danger"
                          disabled={isDead}
                          onClick={() => handleRollDangerCheck(ally)}
                          className="h-6 px-2 text-[10px] font-mono"
                          title="Rolar 1d6 de risco: Par = Intacto, Ímpar = Ferido"
                        >
                          <Dices className="h-3 w-3" /> Risco 1d6
                        </Button>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPetIds((prev) => ({
                        ...prev,
                        [ally.id]: !prev[ally.id],
                      }))
                    }
                    className="inline-flex items-center gap-1 font-mono text-[10px] text-[#8E8E9E] hover:text-[#F4F4F5]"
                  >
                    Ficha Rápida (PV/Def/Atk)
                    {petExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                </div>

                {/* Expandable Quick Pet Combat Sheet */}
                {petExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-sm border border-[#22222A] bg-[#09090B] p-3">
                    <div>
                      <label className="font-mono text-[9px] uppercase text-[#8E8E9E] flex items-center gap-1 mb-1">
                        <Heart className="h-2.5 w-2.5 text-red-400" /> PV (Atual / Máx)
                      </label>
                      <div className="flex items-center gap-1">
                        <NumericInput
                          min={0}
                          value={ally.petPv ?? 12}
                          onValueChange={(v) =>
                            updateAlly(ally.id, { petPv: Math.max(0, v) })
                          }
                          className="h-7 w-full rounded-sm border border-[#22222A] bg-[#101014] px-2 font-mono text-xs text-center text-[#F4F4F5] focus:outline-none"
                        />
                        <span className="font-mono text-xs text-[#6E6E7E]">/</span>
                        <NumericInput
                          min={1}
                          fallback={1}
                          value={ally.petMaxPv ?? 12}
                          onValueChange={(v) =>
                            updateAlly(ally.id, { petMaxPv: Math.max(1, v) })
                          }
                          className="h-7 w-full rounded-sm border border-[#22222A] bg-[#101014] px-2 font-mono text-xs text-center text-[#D4D4D8] focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-mono text-[9px] uppercase text-[#8E8E9E] flex items-center gap-1 mb-1">
                        <Shield className="h-2.5 w-2.5 text-sky-400" /> Defesa
                      </label>
                      <NumericInput
                        min={0}
                        value={ally.petDefense ?? 12}
                        onValueChange={(v) =>
                          updateAlly(ally.id, { petDefense: Math.max(0, v) })
                        }
                        className="h-7 w-full rounded-sm border border-[#22222A] bg-[#101014] px-2 font-mono text-xs text-center text-[#F4F4F5] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[9px] uppercase text-[#8E8E9E] flex items-center gap-1 mb-1">
                        <Swords className="h-2.5 w-2.5 text-amber-400" /> Ataque
                      </label>
                      <Input
                        value={ally.petAttack ?? ""}
                        onChange={(e) =>
                          updateAlly(ally.id, { petAttack: e.target.value })
                        }
                        placeholder="Ex: Mordida 1d6+1"
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Adicionar Aliado ou Pet */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Adicionar Aliado ou Pet"
        description="Selecione um modelo oficial ou configure um aliado/companheiro customizado."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleAddAlly} className="space-y-4">
          {/* Template Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ALLY_TEMPLATES.map((tpl) => {
              const active = selectedTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplateId(tpl.id);
                    setChosenSkills([]);
                  }}
                  className={cn(
                    "rounded-sm border p-3 text-left transition-colors",
                    active
                      ? "border-[#F4F4F5] bg-[#16161C]"
                      : "border-[#22222A] bg-[#0D0D11] hover:border-[#32323E]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-xs font-bold text-[#F4F4F5]">
                      {tpl.name}
                    </span>
                    <span className="font-mono text-[9px] uppercase text-[#8E8E9E]">
                      {tpl.sourceLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A1A1AA] mt-1 leading-snug">
                    {tpl.bonusSummary}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2 font-mono text-[10px]">
                    <span className="text-amber-300/90">
                      {tpl.abilityName}{" "}
                      {tpl.abilityPeCost > 0
                        ? `(${tpl.abilityPeCost} PE)`
                        : "(Livre)"}
                    </span>
                    {tpl.defaultCombatStats && (
                      <span className="text-[#8E8E9E]">
                        PV {tpl.defaultCombatStats.petPv} · DEF{" "}
                        {tpl.defaultCombatStats.petDefense}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setSelectedTemplateId("custom")}
              className={cn(
                "sm:col-span-2 rounded-sm border border-dashed p-3 text-left transition-colors",
                selectedTemplateId === "custom"
                  ? "border-[#F4F4F5] bg-[#16161C]"
                  : "border-[#32323E] bg-[#0D0D11] hover:border-[#525266]"
              )}
            >
              <span className="font-display text-xs font-bold text-[#F4F4F5]">
                + Criar Aliado / Pet Customizado
              </span>
              <p className="text-[11px] text-[#8E8E9E] mt-0.5">
                Defina nome, bônus de perícia, habilidade ativa e custo de PE livremente.
              </p>
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
              Nome do Aliado / Pet{" "}
              {selectedTemplateId === "custom" ? "*" : "(opcional)"}
            </label>
            <Input
              required={selectedTemplateId === "custom"}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={
                activeTemplate
                  ? `Ex: ${activeTemplate.name} (ou nome próprio)`
                  : "Ex: Rex, Dr. Helena, Informante..."
              }
            />
          </div>

          {/* Skill Choice for Faz-Tudo / Companheiro Animal */}
          {activeTemplate?.requiresSkillChoice && (
            <div className="space-y-2 rounded-sm border border-[#22222A] bg-[#0B0B0F] p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#D4D4D8]">
                  {activeTemplate.requiresSkillChoice.prompt}
                </span>
                <span className="font-mono text-[10px] text-[#8E8E9E]">
                  {chosenSkills.length}/
                  {activeTemplate.requiresSkillChoice.maxCount ??
                    activeTemplate.requiresSkillChoice.count}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {SKILLS_LIST.filter(
                  (s) =>
                    !activeTemplate.requiresSkillChoice?.exclude?.includes(s.key)
                ).map((sk) => {
                  const selected = chosenSkills.includes(sk.key);
                  return (
                    <button
                      key={sk.key}
                      type="button"
                      onClick={() =>
                        toggleChosenSkill(
                          sk.key,
                          activeTemplate.requiresSkillChoice?.maxCount ??
                            activeTemplate.requiresSkillChoice?.count ??
                            1
                        )
                      }
                      className={cn(
                        "rounded-sm border px-2 py-1 text-[11px] transition-colors",
                        selected
                          ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5] font-semibold"
                          : "border-[#22222A] bg-[#09090B] text-[#8E8E9E] hover:text-[#D4D4D8]"
                      )}
                    >
                      {selected && <Check className="inline h-3 w-3 mr-1" />}
                      {sk.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom ability text for Companheiro Animal */}
          {selectedTemplateId === "companheiro_animal" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Nome da Habilidade do Pet
                </label>
                <Input
                  value={customAbilityName}
                  onChange={(e) => setCustomAbilityName(e.target.value)}
                  placeholder="Ex: Faro Aguçado, Investida..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Descrição da Habilidade (opcional)
                </label>
                <Textarea
                  rows={2}
                  value={customAbilityDesc}
                  onChange={(e) => setCustomAbilityDesc(e.target.value)}
                  placeholder="Efeito ao gastar 1 PE..."
                />
              </div>
            </div>
          )}

          {/* Full Custom Fields */}
          {selectedTemplateId === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-sm border border-[#22222A] bg-[#0B0B0F] p-3">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Tipo
                </label>
                <Select
                  value={customKind}
                  onChange={(e) => setCustomKind(e.target.value as AllyType)}
                >
                  <option value="aliado">Aliado</option>
                  <option value="pet">Pet / Companheiro</option>
                </Select>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Bônus Automático em Perícia (opc.)
                </label>
                <div className="flex gap-1.5">
                  <Select
                    value={customFlatSkill}
                    onChange={(e) =>
                      setCustomFlatSkill(e.target.value as SkillKey | "")
                    }
                    className="flex-1"
                  >
                    <option value="">Nenhum</option>
                    {SKILLS_LIST.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    value={customFlatValue}
                    onChange={(e) =>
                      setCustomFlatValue(Number(e.target.value) || 0)
                    }
                    className="w-16 font-mono text-center"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Resumo do Bônus Passivo
                </label>
                <Input
                  value={customBonusSummary}
                  onChange={(e) => setCustomBonusSummary(e.target.value)}
                  placeholder="Ex: +2 em Investigação e acesso a arquivos locais"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Nome da Habilidade
                </label>
                <Input
                  value={customAbilityName}
                  onChange={(e) => setCustomAbilityName(e.target.value)}
                  placeholder="Ex: Cobertura Tática"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                    Custo ({resUnit})
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={customAbilityCost}
                    onChange={(e) =>
                      setCustomAbilityCost(
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                    Dado (opc.)
                  </label>
                  <Input
                    value={customAbilityFormula}
                    onChange={(e) => setCustomAbilityFormula(e.target.value)}
                    placeholder="1d6, 1d8+1"
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Descrição da Habilidade
                </label>
                <Textarea
                  rows={2}
                  value={customAbilityDesc}
                  onChange={(e) => setCustomAbilityDesc(e.target.value)}
                  placeholder="Descreva o efeito da habilidade do aliado..."
                />
              </div>
            </div>
          )}

          {activeTemplate?.requiresSkillChoice &&
            chosenSkills.length < activeTemplate.requiresSkillChoice.count && (
              <p className="inline-flex items-center gap-1.5 text-xs text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                Selecione pelo menos {activeTemplate.requiresSkillChoice.count}{" "}
                perícia(s) acima.
              </p>
            )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#22222A]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                Boolean(
                  activeTemplate?.requiresSkillChoice &&
                    chosenSkills.length <
                      activeTemplate.requiresSkillChoice.count
                )
              }
            >
              Adicionar à Ficha
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
