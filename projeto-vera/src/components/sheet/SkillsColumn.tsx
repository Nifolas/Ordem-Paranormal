"use client";

import React, { useMemo, useState } from "react";
import {
  Briefcase,
  Check,
  ChevronDown,
  ChevronUp,
  Dices,
  Edit3,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import type {
  Agent,
  AgentSkill,
  AttributeKey,
  SkillKey,
  TrainingDegree,
} from "@/types/ordem";
import {
  applyAgentSkillList,
  buildSkillListFromRecord,
  formatSkillDisplayName,
  getAgentSkillList,
  SKILLS_LIST,
  STANDARD_SKILL_KEYS,
} from "@/data/skills";
import {
  calculateLoadAndCategories,
  getAgentEffectiveAttributes,
  getAllySkillModifiers,
  getPassiveSkillModifiers,
  getTrailCarryBonus,
} from "@/lib/ordem-rules";
import { cn, formatSigned, generateId } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import {
  Button,
  Input,
  Modal,
  NumericInput,
  Select,
  Textarea,
} from "@/components/ui/primitives";

const ATTRS: AttributeKey[] = ["AGI", "FOR", "INT", "PRE", "VIG"];

const TRAINING_OPTIONS: {
  value: TrainingDegree;
  label: string;
  fullLabel: string;
  shortTag: string;
  badgeCls: string;
  cardBorderCls: string;
}[] = [
  {
    value: 0,
    label: "L +0",
    fullLabel: "Leigo (+0)",
    shortTag: "L",
    badgeCls: "border-white/10 bg-zinc-950 text-zinc-500",
    cardBorderCls: "border-white/10 bg-[#0D0D12]",
  },
  {
    value: 5,
    label: "T +5",
    fullLabel: "Treinado (+5)",
    shortTag: "T",
    badgeCls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    cardBorderCls: "border-emerald-500/30 bg-emerald-500/[0.04]",
  },
  {
    value: 10,
    label: "V +10",
    fullLabel: "Veterano (+10)",
    shortTag: "V",
    badgeCls: "border-sky-500/40 bg-sky-500/10 text-sky-300",
    cardBorderCls: "border-sky-500/30 bg-sky-500/[0.04]",
  },
  {
    value: 15,
    label: "E +15",
    fullLabel: "Expert (+15)",
    shortTag: "E",
    badgeCls: "border-amber-500/45 bg-amber-500/10 text-amber-300",
    cardBorderCls: "border-amber-500/35 bg-amber-500/[0.05]",
  },
];

function createEmptySkillForm(): Omit<AgentSkill, "id"> {
  return {
    nome: "",
    especializacao: "",
    descricao: "",
    atributoBase: "INT",
    treinamento: 0,
    bonusOutros: 0,
    somenteTreinada: false,
    penalidadeCarga: false,
    requerKit: false,
    hasKit: true,
    isCustom: true,
  };
}

export function SkillsColumn({
  agent,
  onUpdate,
  onRollSkill,
}: {
  agent: Agent;
  onUpdate: (updater: (prev: Agent) => Agent) => void;
  onRollSkill: (skill: AgentSkill) => void;
}) {
  const { quickDiceMod } = useAppStore();
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"todas" | "treinadas">("todas");
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [expandedDescIds, setExpandedDescIds] = useState<
    Record<string, boolean>
  >({});

  // Create / Edit Skill Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<AgentSkill, "id">>(
    createEmptySkillForm
  );

  const skillList = useMemo(() => getAgentSkillList(agent), [agent]);
  const effAttrs = getAgentEffectiveAttributes(agent);
  const load = calculateLoadAndCategories({
    forAttr: effAttrs.FOR,
    patente: agent.patente,
    inventory: agent.inventory,
    extraCapacityBonus: getTrailCarryBonus(agent),
  });

  const trainedCount = useMemo(
    () => skillList.filter((sk) => sk.treinamento > 0).length,
    [skillList]
  );

  const missingStandardCount = useMemo(() => {
    const present = new Set(skillList.map((s) => s.id));
    return SKILLS_LIST.filter((def) => !present.has(def.key)).length;
  }, [skillList]);

  const filteredSkills = useMemo(() => {
    const q = search.trim().toLowerCase();
    return skillList.filter((sk) => {
      if (filterMode === "treinadas" && sk.treinamento === 0) return false;
      if (!q) return true;
      return (
        sk.nome.toLowerCase().includes(q) ||
        (sk.especializacao?.toLowerCase().includes(q) ?? false) ||
        sk.descricao.toLowerCase().includes(q) ||
        sk.atributoBase.toLowerCase().includes(q)
      );
    });
  }, [search, filterMode, skillList]);

  const updateSkillById = (skillId: string, patch: Partial<AgentSkill>) => {
    onUpdate((prev) => {
      const current = getAgentSkillList(prev);
      const next = current.map((s) =>
        s.id === skillId ? { ...s, ...patch } : s
      );
      return applyAgentSkillList(prev, next);
    });
  };

  const deleteSkillById = (skill: AgentSkill) => {
    const label = formatSkillDisplayName(skill);
    if (!window.confirm(`Excluir a perícia "${label}" desta ficha?`)) return;
    onUpdate((prev) => {
      const current = getAgentSkillList(prev);
      const next = current.filter((s) => s.id !== skill.id);
      return applyAgentSkillList(prev, next);
    });
    if (editingSkillId === skill.id) {
      setModalOpen(false);
      setEditingSkillId(null);
    }
  };

  const restoreMissingStandardSkills = () => {
    onUpdate((prev) => {
      const current = getAgentSkillList(prev);
      const existingIds = new Set(current.map((s) => s.id));
      const defaults = buildSkillListFromRecord(prev.skills);
      const toRestore = defaults.filter((d) => !existingIds.has(d.id));
      const next = [...current, ...toRestore].sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR")
      );
      return applyAgentSkillList(prev, next);
    });
  };

  const openCreateModal = () => {
    setEditingSkillId(null);
    setForm(createEmptySkillForm());
    setModalOpen(true);
  };

  const openEditModal = (skill: AgentSkill) => {
    setEditingSkillId(skill.id);
    setForm({
      nome: skill.nome,
      especializacao: skill.especializacao ?? "",
      descricao: skill.descricao,
      atributoBase: skill.atributoBase,
      treinamento: skill.treinamento,
      bonusOutros: skill.bonusOutros,
      somenteTreinada: skill.somenteTreinada,
      penalidadeCarga: skill.penalidadeCarga,
      requerKit: skill.requerKit,
      hasKit: skill.hasKit ?? true,
      isCustom: skill.isCustom,
    });
    setModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;

    const cleanedSpec = form.especializacao?.trim();

    if (editingSkillId) {
      updateSkillById(editingSkillId, {
        nome: form.nome.trim(),
        especializacao:
          editingSkillId === "profissao"
            ? cleanedSpec ?? ""
            : cleanedSpec || undefined,
        descricao: form.descricao.trim(),
        atributoBase: form.atributoBase,
        treinamento: form.treinamento,
        bonusOutros: form.bonusOutros,
        somenteTreinada: form.somenteTreinada,
        penalidadeCarga: form.penalidadeCarga,
        requerKit: form.requerKit,
        hasKit: form.hasKit ?? true,
      });
    } else {
      const created: AgentSkill = {
        id: generateId("skill"),
        nome: form.nome.trim(),
        especializacao: cleanedSpec || undefined,
        descricao: form.descricao.trim(),
        atributoBase: form.atributoBase,
        treinamento: form.treinamento,
        bonusOutros: form.bonusOutros,
        somenteTreinada: form.somenteTreinada,
        penalidadeCarga: form.penalidadeCarga,
        requerKit: form.requerKit,
        hasKit: true,
        isCustom: true,
      };
      onUpdate((prev) => {
        const current = getAgentSkillList(prev);
        return applyAgentSkillList(prev, [...current, created]);
      });
    }

    setModalOpen(false);
    setEditingSkillId(null);
  };

  const toggleDesc = (id: string) => {
    setExpandedDescIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      {/* Top Control & Filter Bar */}
      <div className="space-y-3 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-sm font-bold tracking-tight text-zinc-100">
              Perícias do Agente
            </h3>
            <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 tabular-nums">
              {trainedCount} treinadas de {skillList.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={isEditingSkills ? "primary" : "outline"}
              onClick={() => setIsEditingSkills((v) => !v)}
              className={cn(
                isEditingSkills &&
                  "border-emerald-500/50 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
              )}
              title={
                isEditingSkills
                  ? "Concluir edição de atributos, graus de treino e bônus"
                  : "Editar graus de treino (L/T/V/E), atributos e bônus de perícias"
              }
            >
              {isEditingSkills ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Concluir Edição
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5" /> Editar Perícias
                </>
              )}
            </Button>

            <Button size="sm" variant="primary" onClick={openCreateModal}>
              <Plus className="h-3.5 w-3.5" /> + Nova
            </Button>
          </div>
        </div>

        {/* Search + Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar perícia, atributo (AGI, INT...) ou profissão..."
              className="h-9 pl-9 text-xs"
            />
          </div>

          <div className="inline-flex rounded-md border border-white/10 bg-zinc-950 p-0.5 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setFilterMode("todas")}
              className={cn(
                "rounded px-3 py-1.5 transition-colors tabular-nums",
                filterMode === "todas"
                  ? "bg-[#1C1C24] text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Todas ({skillList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("treinadas")}
              className={cn(
                "rounded px-3 py-1.5 transition-colors tabular-nums",
                filterMode === "treinadas"
                  ? "bg-[#1C1C24] text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Treinadas ({trainedCount})
            </button>
          </div>
        </div>

        {/* Legend with tooltips + optional Restore Standard button */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="cursor-help"
              title="Somente Treinada: exige grau Treinado (+5) ou maior para realizar testes difíceis"
            >
              <strong className="text-emerald-400 font-mono">*</strong> Somente
              Treinada
            </span>
            <span className="text-zinc-600">·</span>
            <span
              className="cursor-help"
              title="Penalidade de Carga: sofre -5 no teste se você estiver Sobrecarregado"
            >
              <strong className="text-amber-400 font-mono">+</strong> Penalidade
              de Carga
            </span>
            <span className="text-zinc-600">·</span>
            <span
              className="inline-flex items-center gap-1 cursor-help"
              title="Requer Kit de Perícia: sofre -5 no teste se estiver sem o Kit no inventário (clique na maleta para alternar)"
            >
              <Briefcase className="h-3 w-3 text-zinc-400" /> Requer Kit
            </span>
          </div>

          <div className="flex items-center gap-2">
            {load.isOverloaded && (
              <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-300">
                Sobrecarga Ativa (-5 em perícias de carga)
              </span>
            )}
            {missingStandardCount > 0 && (
              <button
                type="button"
                onClick={restoreMissingStandardSkills}
                className="inline-flex items-center gap-1 text-xs text-zinc-300 hover:text-white underline"
                title="Restaurar perícias oficiais removidas"
              >
                <RotateCcw className="h-3 w-3" /> Restaurar (
                {missingStandardCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Wide 2-Column Grid of Skills on Desktop */}
      {filteredSkills.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-[#0C0C10]/60 p-10 text-center text-xs text-zinc-500">
          Nenhuma perícia encontrada para o filtro atual.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredSkills.map((sk) => {
            const attrVal = effAttrs[sk.atributoBase];
            const loadPen = sk.penalidadeCarga && load.isOverloaded ? -5 : 0;
            const kitPen = sk.requerKit && sk.hasKit === false ? -5 : 0;
            const passiveMod = STANDARD_SKILL_KEYS.has(sk.id)
              ? getPassiveSkillModifiers(agent, sk.id as SkillKey)
              : { flatBonus: 0, diceModifier: 0 };
            const allyMod = STANDARD_SKILL_KEYS.has(sk.id)
              ? getAllySkillModifiers(agent, sk.id as SkillKey)
              : { flatBonus: 0, diceModifier: 0, grantsTrained: false };

            const effectiveTraining =
              sk.treinamento === 0 && allyMod.grantsTrained
                ? 5
                : sk.treinamento;

            const totalBonus =
              effectiveTraining +
              sk.bonusOutros +
              passiveMod.flatBonus +
              allyMod.flatBonus +
              loadPen +
              kitPen;

            const effectiveDice =
              attrVal +
              quickDiceMod +
              passiveMod.diceModifier +
              allyMod.diceModifier;
            const diceCount =
              effectiveDice >= 1
                ? effectiveDice
                : 2 + Math.abs(effectiveDice);
            const isLowestMode = effectiveDice <= 0;
            const bonusText =
              totalBonus === 0
                ? ""
                : totalBonus > 0
                ? ` +${totalBonus}`
                : ` ${totalBonus}`;
            const formulaDisplay = `${diceCount}d20${
              isLowestMode ? "↓" : ""
            }${bonusText}`;

            const isTrained = effectiveTraining > 0;
            const isUntrainedLocked =
              sk.somenteTreinada && effectiveTraining === 0;
            const trainingMeta =
              TRAINING_OPTIONS.find((o) => o.value === effectiveTraining) ??
              TRAINING_OPTIONS[0];

            const showSpecLine =
              sk.id === "profissao" || sk.especializacao !== undefined;
            const descExpanded = Boolean(expandedDescIds[sk.id]);
            const displayLabel = formatSkillDisplayName(sk);

            return (
              <div
                key={sk.id}
                className={cn(
                  "rounded-lg border px-3.5 py-2.5 transition-colors flex flex-col justify-center",
                  trainingMeta.cardBorderCls,
                  "hover:border-white/25",
                  isEditingSkills && "space-y-2 py-3"
                )}
              >
                {/* Row 1: [Perícia + Especialização + Flags] + [Atributo · Treino · Bônus] + [Botão de Rolagem] */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onRollSkill(sk)}
                      className={cn(
                        "text-left text-sm leading-tight transition-colors focus:outline-none truncate",
                        isUntrainedLocked
                          ? "text-zinc-500 hover:text-zinc-300"
                          : isTrained
                          ? "text-zinc-50 font-semibold hover:text-white"
                          : "text-zinc-300 hover:text-white"
                      )}
                      title={`Clique para rolar ${displayLabel} (${sk.atributoBase} • ${formulaDisplay})`}
                    >
                      <span>{sk.nome}</span>
                      {sk.especializacao?.trim() && (
                        <span className="ml-1 text-xs font-normal text-zinc-400">
                          ({sk.especializacao.trim()})
                        </span>
                      )}
                    </button>

                    {sk.somenteTreinada && (
                      <span
                        title={
                          isUntrainedLocked
                            ? "Somente Treinada (*): você não possui treinamento nesta perícia"
                            : "Somente Treinada (*): requisito atendido"
                        }
                        className={cn(
                          "font-mono text-xs font-bold leading-none shrink-0 cursor-help",
                          isUntrainedLocked
                            ? "text-zinc-600"
                            : "text-emerald-400"
                        )}
                      >
                        *
                      </span>
                    )}

                    {sk.penalidadeCarga && (
                      <span
                        title={
                          load.isOverloaded
                            ? "Penalidade de Carga ativa (-5 por Sobrecarga)"
                            : "Penalidade de Carga (+): sofre -5 apenas se estiver Sobrecarregado"
                        }
                        className={cn(
                          "font-mono text-xs font-bold leading-none shrink-0 cursor-help",
                          load.isOverloaded
                            ? "text-amber-400"
                            : "text-zinc-500"
                        )}
                      >
                        +
                      </span>
                    )}

                    {sk.requerKit && (
                      <button
                        type="button"
                        onClick={() =>
                          updateSkillById(sk.id, {
                            hasKit: sk.hasKit === false ? true : false,
                          })
                        }
                        title={
                          sk.hasKit === false
                            ? "Sem Kit de Perícia (-5) — clique para marcar com Kit"
                            : "Requer Kit de Perícia (ativo) — clique se estiver sem Kit"
                        }
                        className="inline-flex items-center shrink-0"
                      >
                        <Briefcase
                          className={cn(
                            "h-3.5 w-3.5 transition-colors",
                            sk.hasKit === false
                              ? "text-rose-400"
                              : "text-zinc-500 hover:text-zinc-200"
                          )}
                        />
                      </button>
                    )}
                  </div>

                  {/* Right Side: Attribute Pill + Training Badge + Edit Controls + 1-Click Roll Button */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="rounded border border-white/10 bg-zinc-950/80 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-400"
                      title={`Atributo base: ${sk.atributoBase} (${attrVal})`}
                    >
                      {sk.atributoBase}
                    </span>

                    {isTrained && (
                      <span
                        title={`Grau de treinamento: ${trainingMeta.fullLabel}${
                          allyMod.grantsTrained && sk.treinamento === 0
                            ? " (via Aliado)"
                            : ""
                        }`}
                        className={cn(
                          "inline-flex items-center justify-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold leading-none",
                          trainingMeta.badgeCls
                        )}
                      >
                        {trainingMeta.label}
                      </span>
                    )}

                    {isEditingSkills && (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleDesc(sk.id)}
                          className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-zinc-100 transition-colors"
                          title={
                            descExpanded
                              ? "Ocultar descrição"
                              : "Ver descrição da perícia"
                          }
                        >
                          {descExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(sk)}
                          className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-zinc-100 transition-colors"
                          title={`Configurar ou excluir ${sk.nome}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}

                    {/* 1-Click Formula Roll Button */}
                    <button
                      type="button"
                      onClick={() => onRollSkill(sk)}
                      className={cn(
                        "inline-flex items-center justify-end gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs font-bold tabular-nums transition-colors min-w-[82px]",
                        isLowestMode
                          ? "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:border-rose-400"
                          : isTrained
                          ? "border-white/20 bg-[#181822] text-white hover:border-white/40 hover:bg-[#222230]"
                          : "border-white/10 bg-[#0A0A0E] text-zinc-300 hover:border-white/25 hover:text-white"
                      )}
                      title={
                        isLowestMode
                          ? `Rolar ${displayLabel} (${sk.atributoBase}): ${diceCount}d20 pega MENOR${bonusText}`
                          : `Rolar ${displayLabel} (${sk.atributoBase}): ${diceCount}d20 pega MAIOR${bonusText}`
                      }
                    >
                      <Dices className="h-3.5 w-3.5 opacity-75 shrink-0" />
                      <span>{formulaDisplay}</span>
                    </button>
                  </div>
                </div>

                {/* Edit Mode Only: Specialization Input + Attribute Selector + Training Selector + Outros Input */}
                {isEditingSkills && (
                  <div className="space-y-2 pt-1.5 border-t border-white/10">
                    {showSpecLine && (
                      <input
                        type="text"
                        value={sk.especializacao ?? ""}
                        onChange={(e) =>
                          updateSkillById(sk.id, {
                            especializacao: e.target.value,
                          })
                        }
                        placeholder={
                          sk.id === "profissao"
                            ? "Escreva sua profissão (ex: Engenheiro, Psicólogo, Investigador)..."
                            : "Especialização / subtítulo..."
                        }
                        aria-label={
                          sk.id === "profissao"
                            ? "Especialização de Profissão"
                            : `Especialização de ${sk.nome}`
                        }
                        className="w-full rounded border border-white/10 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-300 focus:outline-none"
                      />
                    )}

                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <select
                        value={sk.atributoBase}
                        aria-label={`Atributo de ${sk.nome}`}
                        onChange={(e) =>
                          updateSkillById(sk.id, {
                            atributoBase: e.target.value as AttributeKey,
                          })
                        }
                        className="h-7 rounded bg-zinc-950 border border-white/10 px-2 text-[11px] font-semibold text-zinc-200 focus:outline-none focus:border-white/30"
                      >
                        {ATTRS.map((a) => (
                          <option key={a} value={a} className="bg-[#101014]">
                            {a} ({effAttrs[a]})
                          </option>
                        ))}
                      </select>

                      <select
                        value={sk.treinamento}
                        aria-label={`Grau de treinamento de ${sk.nome}`}
                        onChange={(e) =>
                          updateSkillById(sk.id, {
                            treinamento: Number(
                              e.target.value
                            ) as TrainingDegree,
                          })
                        }
                        className={cn(
                          "h-7 rounded border px-2 text-[11px] font-bold focus:outline-none",
                          trainingMeta.badgeCls
                        )}
                      >
                        {TRAINING_OPTIONS.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            className="text-zinc-100 bg-[#101014]"
                          >
                            {opt.fullLabel}
                          </option>
                        ))}
                      </select>

                      <div
                        className="flex items-center gap-1.5 rounded border border-white/10 bg-zinc-950 px-2 h-7 ml-auto"
                        title="Bônus extra (Outros)"
                      >
                        <span className="text-[10px] text-zinc-400">OUT</span>
                        <NumericInput
                          value={sk.bonusOutros}
                          aria-label={`Bônus extra de ${sk.nome}`}
                          onValueChange={(val) =>
                            updateSkillById(sk.id, {
                              bonusOutros: val,
                            })
                          }
                          className="w-9 bg-transparent text-center text-xs font-semibold text-zinc-100 focus:outline-none tabular-nums"
                        />
                      </div>
                    </div>

                    {descExpanded && (
                      <div className="rounded border border-white/10 bg-zinc-950 px-3 py-2 space-y-1.5">
                        <p className="text-xs leading-relaxed text-zinc-400 whitespace-pre-line">
                          {sk.descricao || "Sem descrição cadastrada."}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => openEditModal(sk)}
                            className="font-mono text-[10px] text-zinc-300 hover:text-white underline"
                          >
                            Editar nome, texto ou regras
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSkillById(sk)}
                            className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-500 hover:text-rose-400"
                          >
                            <Trash2 className="h-2.5 w-2.5" /> Excluir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Criar ou Editar Perícia */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingSkillId(null);
        }}
        title={editingSkillId ? "Editar Perícia" : "Nova Perícia Personalizada"}
        description="Renomeie, adicione especialização, edite o texto descritivo ou ajuste atributos e regras."
      >
        <form onSubmit={handleSaveModal} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Nome da Perícia *
              </label>
              <Input
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Profissão, Pilotagem Espacial, Criptografia..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Especialização / Subtítulo (opcional)
              </label>
              <Input
                value={form.especializacao ?? ""}
                onChange={(e) =>
                  setForm({ ...form, especializacao: e.target.value })
                }
                placeholder="Ex: Engenheiro, Psicólogo, Armeiro, Biologia..."
              />
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Atributo-base
              </label>
              <Select
                value={form.atributoBase}
                onChange={(e) =>
                  setForm({
                    ...form,
                    atributoBase: e.target.value as AttributeKey,
                  })
                }
              >
                {ATTRS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Treino
                </label>
                <Select
                  value={form.treinamento}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      treinamento: Number(e.target.value) as TrainingDegree,
                    })
                  }
                  className="font-mono"
                >
                  {TRAINING_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Outros
                </label>
                <Input
                  type="number"
                  value={form.bonusOutros}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bonusOutros: Number(e.target.value) || 0,
                    })
                  }
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="inline-flex items-center gap-2 text-xs text-[#D4D4D8] cursor-pointer">
              <input
                type="checkbox"
                checked={form.somenteTreinada}
                onChange={(e) =>
                  setForm({ ...form, somenteTreinada: e.target.checked })
                }
              />
              Somente Treinada (*)
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-[#D4D4D8] cursor-pointer">
              <input
                type="checkbox"
                checked={form.penalidadeCarga}
                onChange={(e) =>
                  setForm({ ...form, penalidadeCarga: e.target.checked })
                }
              />
              Penalidade de Carga (+)
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-[#D4D4D8] cursor-pointer">
              <input
                type="checkbox"
                checked={form.requerKit}
                onChange={(e) =>
                  setForm({ ...form, requerKit: e.target.checked })
                }
              />
              Requer Kit
            </label>
          </div>

          {/* Description */}
          <div>
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
              Descrição / Usos / Anotações
            </label>
            <Textarea
              rows={4}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Descreva usos da perícia, DTs comuns ou anotações do personagem..."
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
            {editingSkillId ? (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => {
                  const target = skillList.find((s) => s.id === editingSkillId);
                  if (target) deleteSkillById(target);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </Button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setModalOpen(false);
                  setEditingSkillId(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm">
                {editingSkillId ? "Salvar Alterações" : "Criar Perícia"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
