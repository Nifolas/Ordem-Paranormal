"use client";

import React, { useMemo, useState } from "react";
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  Dices,
  PanelRightClose,
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
  Card,
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
  badgeCls: string;
}[] = [
  {
    value: 0,
    label: "L +0",
    badgeCls: "border-[#22222A] bg-[#09090B] text-[#7A7A8C]",
  },
  {
    value: 5,
    label: "T +5",
    badgeCls: "border-emerald-500/40 bg-emerald-600/10 text-emerald-300",
  },
  {
    value: 10,
    label: "V +10",
    badgeCls: "border-sky-500/40 bg-sky-600/10 text-sky-300",
  },
  {
    value: 15,
    label: "E +15",
    badgeCls: "border-amber-500/45 bg-amber-500/10 text-amber-300",
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
  onCollapse,
}: {
  agent: Agent;
  onUpdate: (updater: (prev: Agent) => Agent) => void;
  onRollSkill: (skill: AgentSkill) => void;
  onCollapse?: () => void;
}) {
  const { quickDiceMod } = useAppStore();
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"todas" | "treinadas">("todas");
  const [expandedDescIds, setExpandedDescIds] = useState<Record<string, boolean>>({});

  // Create / Edit Skill Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<AgentSkill, "id">>(createEmptySkillForm);

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

  const updateSkillById = (
    skillId: string,
    patch: Partial<AgentSkill>
  ) => {
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
    <Card className="flex flex-col overflow-hidden">
      {/* Header & Controls */}
      <div className="border-b border-[#22222A] bg-[#0C0C10] p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-display text-xs font-bold uppercase tracking-[0.16em] text-[#F4F4F5]">
              Perícias
            </span>
            <span className="font-mono text-[10px] text-[#8E8E9E] tabular-nums">
              ({skillList.length})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1 rounded-sm border border-[#32323E] bg-[#16161C] px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#F4F4F5] hover:border-[#F4F4F5] transition-colors"
              title="Criar nova perícia personalizada"
            >
              <Plus className="h-3 w-3" /> Nova
            </button>

            {onCollapse && (
              <button
                type="button"
                onClick={onCollapse}
                title="Recolher coluna de Perícias para expandir o painel central"
                className="hidden xl:inline-flex h-6 w-6 items-center justify-center rounded-sm border border-[#22222A] bg-[#09090B] text-[#8E8E9E] hover:border-[#32323E] hover:text-[#F4F4F5] transition-colors"
              >
                <PanelRightClose className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6E6E7E]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar perícia ou profissão..."
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* Segmented Filter: Todas | Treinadas */}
        <div className="grid grid-cols-2 gap-1 rounded-sm border border-[#22222A] bg-[#09090B] p-0.5 font-mono text-[10px]">
          <button
            type="button"
            onClick={() => setFilterMode("todas")}
            className={cn(
              "rounded-sm py-1 transition-colors tabular-nums",
              filterMode === "todas"
                ? "bg-[#1C1C24] text-[#F4F4F5] font-semibold"
                : "text-[#8E8E9E] hover:text-[#D4D4D8]"
            )}
          >
            Todas ({skillList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("treinadas")}
            className={cn(
              "rounded-sm py-1 transition-colors tabular-nums",
              filterMode === "treinadas"
                ? "bg-[#1C1C24] text-[#F4F4F5] font-semibold"
                : "text-[#8E8E9E] hover:text-[#D4D4D8]"
            )}
          >
            Treinadas ({trainedCount})
          </button>
        </div>

        {/* Legend + optional Restore Standard button */}
        <div className="flex items-center justify-between gap-2 font-mono text-[9px] text-[#6E6E7E]">
          <span>* Treinada · + Carga · Kit</span>
          <div className="flex items-center gap-2">
            {load.isOverloaded && (
              <span className="text-amber-400">Sobrecarga -5</span>
            )}
            {missingStandardCount > 0 && (
              <button
                type="button"
                onClick={restoreMissingStandardSkills}
                className="inline-flex items-center gap-0.5 text-[#A1A1AA] hover:text-[#F4F4F5] underline"
                title="Restaurar perícias oficiais removidas"
              >
                <RotateCcw className="h-2.5 w-2.5" /> Restaurar ({missingStandardCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Skills List */}
      <div className="divide-y divide-[#1A1A22] overflow-y-auto max-h-[72vh] xl:max-h-[calc(100vh-15rem)]">
        {filteredSkills.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#6E6E7E]">
            Nenhuma perícia encontrada.
          </div>
        ) : (
          filteredSkills.map((sk) => {
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
              sk.treinamento === 0 && allyMod.grantsTrained ? 5 : sk.treinamento;

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

            const isUntrainedLocked =
              sk.somenteTreinada && effectiveTraining === 0;
            const trainingMeta =
              TRAINING_OPTIONS.find((o) => o.value === sk.treinamento) ??
              TRAINING_OPTIONS[0];

            const showSpecLine =
              sk.id === "profissao" || sk.especializacao !== undefined;
            const descExpanded = Boolean(expandedDescIds[sk.id]);
            const displayLabel = formatSkillDisplayName(sk);

            return (
              <div
                key={sk.id}
                className="px-3.5 py-2.5 hover:bg-[#14141A] transition-colors space-y-2"
              >
                {/* Row 1: Name + Flags + Edit/Expand + 1-Click Roll */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onRollSkill(sk)}
                      className={cn(
                        "text-left text-[13px] leading-tight hover:text-[#F4F4F5] transition-colors focus:outline-none",
                        isUntrainedLocked
                          ? "text-[#7A7A8C]"
                          : sk.treinamento > 0
                          ? "text-[#F4F4F5] font-semibold"
                          : "text-[#D4D4D8]"
                      )}
                      title={`Rolar ${displayLabel} (${formulaDisplay})`}
                    >
                      {sk.nome}
                    </button>

                    {sk.somenteTreinada && (
                      <span
                        title="Somente Treinada (*)"
                        className={cn(
                          "font-mono text-[11px] font-bold leading-none",
                          isUntrainedLocked
                            ? "text-[#6E6E7E]"
                            : "text-emerald-400/80"
                        )}
                      >
                        *
                      </span>
                    )}

                    {sk.penalidadeCarga && (
                      <span
                        title={
                          load.isOverloaded
                            ? "Penalidade de Carga ativa (-5)"
                            : "Sofre penalidade de Carga se Sobrecarregado (+)"
                        }
                        className={cn(
                          "font-mono text-[11px] font-bold leading-none",
                          load.isOverloaded
                            ? "text-amber-400"
                            : "text-[#6E6E7E]"
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
                        className="inline-flex items-center"
                      >
                        <Briefcase
                          className={cn(
                            "h-3 w-3 transition-colors",
                            sk.hasKit === false
                              ? "text-red-400"
                              : "text-[#6E6E7E] hover:text-[#D4D4D8]"
                          )}
                        />
                      </button>
                    )}

                    {sk.isCustom && (
                      <span className="rounded-sm border border-[#32323E] bg-[#16161C] px-1 py-0.2 font-mono text-[8px] uppercase text-[#8E8E9E]">
                        CUSTOM
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleDesc(sk.id)}
                      className="rounded-sm p-1 text-[#6E6E7E] hover:bg-[#1C1C24] hover:text-[#D4D4D8] transition-colors"
                      title={
                        descExpanded
                          ? "Ocultar descrição da perícia"
                          : "Ver descrição / anotações da perícia"
                      }
                      aria-label={`Descrição de ${sk.nome}`}
                    >
                      {descExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(sk)}
                      className="rounded-sm p-1 text-[#6E6E7E] hover:bg-[#1C1C24] hover:text-[#F4F4F5] transition-colors"
                      title={`Editar ou excluir ${sk.nome}`}
                      aria-label={`Editar ${sk.nome}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>

                    {/* 1-Click Formula Roll Button */}
                    <button
                      type="button"
                      onClick={() => onRollSkill(sk)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 font-mono text-[11px] font-bold tabular-nums transition-colors",
                        isLowestMode
                          ? "border-red-600/40 bg-red-600/10 text-red-300 hover:border-red-500"
                          : sk.treinamento > 0
                          ? "border-[#32323E] bg-[#16161C] text-[#F4F4F5] hover:border-[#F4F4F5]"
                          : "border-[#22222A] bg-[#09090B] text-[#A1A1AA] hover:border-[#525266] hover:text-[#F4F4F5]"
                      )}
                      title={
                        isLowestMode
                          ? `Rolar ${displayLabel}: ${diceCount}d20 pega MENOR${bonusText}`
                          : `Rolar ${displayLabel}: ${diceCount}d20 pega MAIOR${bonusText}`
                      }
                    >
                      <Dices className="h-3 w-3 opacity-75" />
                      <span>{formulaDisplay}</span>
                    </button>
                  </div>
                </div>

                {/* Row 2 (Inline Editable Line for Profissão & Specialized Skills) */}
                {showSpecLine && (
                  <div>
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
                          ? "Escreva sua profissão (ex: Engenheiro, Psicólogo, Cozinheiro)..."
                          : "Especialização / subtítulo..."
                      }
                      aria-label={
                        sk.id === "profissao"
                          ? "Especialização de Profissão"
                          : `Especialização de ${sk.nome}`
                      }
                      className="w-full rounded-sm border border-[#22222A] bg-[#09090B] px-2 py-1 text-xs text-[#E4E4E7] placeholder:text-[#525260] focus:border-[#F4F4F5] focus:outline-none transition-colors"
                    />
                  </div>
                )}

                {/* Row 3: Attribute · Training Degree · Outros Bonus */}
                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                  <select
                    value={sk.atributoBase}
                    aria-label={`Atributo de ${sk.nome}`}
                    onChange={(e) =>
                      updateSkillById(sk.id, {
                        atributoBase: e.target.value as AttributeKey,
                      })
                    }
                    className="h-6 rounded-sm bg-[#09090B] border border-[#22222A] px-1.5 text-[10px] font-semibold text-[#A1A1AA] focus:outline-none focus:border-[#525266]"
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
                        treinamento: Number(e.target.value) as TrainingDegree,
                      })
                    }
                    className={cn(
                      "h-6 rounded-sm border px-1.5 text-[10px] font-bold focus:outline-none",
                      trainingMeta.badgeCls
                    )}
                  >
                    {TRAINING_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="text-[#F4F4F5] bg-[#101014]"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <div
                    className="flex items-center gap-1 rounded-sm border border-[#22222A] bg-[#09090B] px-1.5 h-6 ml-auto"
                    title="Bônus extra (Outros)"
                  >
                    <span className="text-[9px] text-[#6E6E7E]">OUT</span>
                    <NumericInput
                      value={sk.bonusOutros}
                      aria-label={`Bônus extra de ${sk.nome}`}
                      onValueChange={(val) =>
                        updateSkillById(sk.id, {
                          bonusOutros: val,
                        })
                      }
                      className="w-8 bg-transparent text-center text-[10px] font-semibold text-[#D4D4D8] focus:outline-none tabular-nums"
                    />
                  </div>

                  {(loadPen !== 0 ||
                    kitPen !== 0 ||
                    passiveMod.flatBonus !== 0 ||
                    allyMod.flatBonus !== 0 ||
                    allyMod.diceModifier !== 0 ||
                    (allyMod.grantsTrained && sk.treinamento === 0)) && (
                    <span
                      title="Modificadores passivos, aliados ou penalidades ativas"
                      className={cn(
                        "text-[9px] tabular-nums",
                        loadPen + kitPen < 0
                          ? "text-amber-400"
                          : "text-emerald-400"
                      )}
                    >
                      {loadPen + kitPen + passiveMod.flatBonus + allyMod.flatBonus !== 0
                        ? formatSigned(
                            loadPen +
                              kitPen +
                              passiveMod.flatBonus +
                              allyMod.flatBonus
                          )
                        : ""}
                      {allyMod.diceModifier > 0
                        ? ` +${allyMod.diceModifier}d`
                        : ""}
                      {allyMod.grantsTrained && sk.treinamento === 0
                        ? " +T"
                        : ""}
                    </span>
                  )}
                </div>

                {/* Expandable Description & Notes */}
                {descExpanded && (
                  <div className="rounded-sm border border-[#22222A] bg-[#09090B] px-2.5 py-2 space-y-1.5">
                    <p className="text-xs leading-relaxed text-[#A1A1AA] whitespace-pre-line">
                      {sk.descricao || "Sem descrição cadastrada."}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-[#1A1A22]">
                      <button
                        type="button"
                        onClick={() => openEditModal(sk)}
                        className="font-mono text-[10px] text-[#D4D4D8] hover:text-[#F4F4F5] underline"
                      >
                        Editar nome, texto ou regras
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSkillById(sk)}
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-[#6E6E7E] hover:text-red-400"
                      >
                        <Trash2 className="h-2.5 w-2.5" /> Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

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

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#22222A]">
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
    </Card>
  );
}
