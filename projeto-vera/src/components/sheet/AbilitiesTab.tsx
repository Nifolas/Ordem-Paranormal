"use client";

import React, { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import type {
  Agent,
  AgentAbility,
  ContentSource,
} from "@/types/ordem";
import { getOriginById } from "@/data/origins";
import { getClassById } from "@/data/classes";
import { BASE_TRAILS } from "@/data/trails";
import { COMMUNITY_TRAILS } from "@/data/supplements";
import { SOURCE_UPPER_LABELS as BOOK_SOURCE_LABEL } from "@/lib/sources";
import { SKILLS_BY_KEY } from "@/data/skills";
import {
  getAgentEffectiveVitals,
  getNexMilestones,
  normalizeCatalogId,
} from "@/lib/ordem-rules";
import { cn, ELEMENT_STYLES } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { AbilitiesCatalogModal } from "./AbilitiesCatalogModal";
import { Badge, Button, Input, Textarea } from "@/components/ui/primitives";

type SubFilter =
  | "todas"
  | "origem"
  | "classe"
  | "trilha"
  | "gerais"
  | "paranormais";

function getClassBaseScalingTag(agent: Agent): string {
  if (agent.classId === "combatente") {
    if (agent.nex >= 85) return "NEX 85%+ · +20 (5 PE)";
    if (agent.nex >= 55) return "NEX 55%+ · +15 (4 PE)";
    if (agent.nex >= 25) return "NEX 25%+ · +10 (3 PE)";
    return "NEX 5%+ · +5 (2 PE)";
  }
  if (agent.classId === "especialista") {
    if (agent.nex >= 85) return "NEX 85%+ · +1d12 (5 PE)";
    if (agent.nex >= 55) return "NEX 55%+ · +1d10 (4 PE)";
    if (agent.nex >= 25) return "NEX 25%+ · +1d8 (3 PE)";
    return "NEX 5%+ · +1d6 (2 PE)";
  }
  if (agent.classId === "ocultista") {
    const m = getNexMilestones("ocultista", agent.nex);
    return `ATÉ ${m.maxRitualCircle}º CÍRCULO`;
  }
  return `ESTÁGIO ${agent.stage ?? 1} · +2 (1 PE)`;
}

function SectionHeader({
  index,
  title,
  count,
  rightSlot,
}: {
  index: string;
  title: string;
  count?: number;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22222A] pb-2 mb-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] font-bold tracking-[0.18em] text-[#6E6E7E]">
          {index} //
        </span>
        <h3 className="font-display text-xs font-bold uppercase tracking-[0.14em] text-[#F4F4F5]">
          {title}
        </h3>
        {count !== undefined && (
          <span className="font-mono text-[10px] text-[#8E8E9E]">
            ({count})
          </span>
        )}
      </div>
      {rightSlot}
    </div>
  );
}

export function AbilitiesTab({
  agent,
  onUpdate,
  onUseAbility,
}: {
  agent: Agent;
  onUpdate: (updater: (prev: Agent) => Agent) => void;
  onUseAbility: (ability: AgentAbility) => void;
}) {
  const { homebrew } = useAppStore();
  const vitals = getAgentEffectiveVitals(agent);
  const resUnit = vitals.usingPd ? "PD" : "PE";

  const [search, setSearch] = useState("");
  const [subFilter, setSubFilter] = useState<SubFilter>("todas");
  const [showFutureMilestones, setShowFutureMilestones] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    name: string;
    peCost: number;
    description: string;
  }>({ name: "", peCost: 0, description: "" });
  const [catalogOpen, setCatalogOpen] = useState(false);

  const originDef = useMemo(
    () => getOriginById(agent.originId, homebrew.origins),
    [agent.originId, homebrew.origins]
  );

  const classDef = useMemo(() => getClassById(agent.classId), [agent.classId]);

  const trailDef = useMemo(() => {
    const all = [
      ...BASE_TRAILS,
      ...COMMUNITY_TRAILS,
      ...(homebrew.trails ?? []),
    ];
    return all.find(
      (t) =>
        t.id === agent.trilhaId || t.id === normalizeCatalogId(agent.trilhaId)
    );
  }, [agent.trilhaId, homebrew.trails]);

  // Partition stored abilities cleanly (avoiding duplicates with structured Origin/Base Class/Trail)
  const originPowerAbility = useMemo(() => {
    return agent.abilities.find((a) => a.source === "Origem") ?? null;
  }, [agent.abilities]);

  const chosenClassPowers = useMemo(() => {
    const baseNameLower = classDef.baseAbility.name.toLowerCase();
    return agent.abilities.filter(
      (a) =>
        (a.source === "Classe" || a.source === "Homebrew") &&
        a.name.toLowerCase() !== baseNameLower
    );
  }, [agent.abilities, classDef.baseAbility.name]);

  const customTrailAbilities = useMemo(() => {
    const officialNames = new Set(
      (trailDef?.abilitiesByNex ?? []).map((x) => x.name.toLowerCase())
    );
    return agent.abilities.filter(
      (a) => a.source === "Trilha" && !officialNames.has(a.name.toLowerCase())
    );
  }, [agent.abilities, trailDef]);

  const generalPowers = useMemo(
    () => agent.abilities.filter((a) => a.source === "Geral"),
    [agent.abilities]
  );

  const paranormalPowers = useMemo(
    () => agent.abilities.filter((a) => a.source === "Paranormal"),
    [agent.abilities]
  );

  const trailMilestones = useMemo(() => {
    if (!trailDef) return [];
    return trailDef.abilitiesByNex.map((m) => {
      const unlocked =
        agent.classId === "sobrevivente"
          ? (agent.stage ?? 1) >= m.nex
          : agent.nex >= m.nex;
      return {
        ...m,
        id: `trail_${trailDef.id}_${m.nex}`,
        labelMarco:
          agent.classId === "sobrevivente" ? `ESTÁGIO ${m.nex}` : `NEX ${m.nex}%`,
        unlocked,
      };
    });
  }, [trailDef, agent.classId, agent.nex, agent.stage]);

  const unlockedTrailCount = trailMilestones.filter((m) => m.unlocked).length;

  // Search matcher
  const q = search.trim().toLowerCase();
  const matchesQuery = (name: string, desc: string, extra?: string) => {
    if (!q) return true;
    return (
      name.toLowerCase().includes(q) ||
      desc.toLowerCase().includes(q) ||
      (extra?.toLowerCase().includes(q) ?? false)
    );
  };

  const filteredClassPowers = useMemo(
    () =>
      chosenClassPowers.filter((a) =>
        matchesQuery(a.name, a.description, a.source)
      ),
    [chosenClassPowers, q]
  );

  const filteredGeneralPowers = useMemo(
    () =>
      generalPowers.filter((a) =>
        matchesQuery(a.name, a.description, a.bookSource)
      ),
    [generalPowers, q]
  );

  const filteredParanormalPowers = useMemo(
    () =>
      paranormalPowers.filter((a) =>
        matchesQuery(
          a.name,
          `${a.description} ${a.affinityDescription ?? ""}`,
          a.element
        )
      ),
    [paranormalPowers, q]
  );

  const filteredTrailMilestones = useMemo(
    () =>
      trailMilestones.filter((m) => {
        if (!showFutureMilestones && !m.unlocked) return false;
        return matchesQuery(m.name, m.description, m.labelMarco);
      }),
    [trailMilestones, showFutureMilestones, q]
  );

  const originMatches = originDef
    ? matchesQuery(
        `${originDef.name} ${originDef.powerName}`,
        originDef.powerDescription
      )
    : false;

  const baseClassMatches = matchesQuery(
    classDef.baseAbility.name,
    classDef.baseAbility.description
  );

  // Real counts for sub-tabs
  const counts = {
    origem: originDef ? 1 : 0,
    classe: 1 + chosenClassPowers.length,
    trilha: unlockedTrailCount + customTrailAbilities.length,
    gerais: generalPowers.length,
    paranormais: paranormalPowers.length,
  };
  const totalCount =
    counts.origem +
    counts.classe +
    counts.trilha +
    counts.gerais +
    counts.paranormais;

  // Collect all expandable IDs for Expand All / Collapse All
  const allExpandableIds = useMemo(
    () => [
      `base_class_${classDef.id}`,
      ...chosenClassPowers.map((a) => a.id),
      ...trailMilestones.map((m) => m.id),
      ...customTrailAbilities.map((a) => a.id),
      ...generalPowers.map((a) => a.id),
      ...paranormalPowers.map((a) => a.id),
    ],
    [
      classDef.id,
      chosenClassPowers,
      trailMilestones,
      customTrailAbilities,
      generalPowers,
      paranormalPowers,
    ]
  );

  const allExpanded =
    allExpandableIds.length > 0 &&
    allExpandableIds.every((id) => expandedIds[id]);

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedIds({});
    } else {
      const next: Record<string, boolean> = {};
      allExpandableIds.forEach((id) => {
        next[id] = true;
      });
      setExpandedIds(next);
    }
  };

  const toggleItem = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startEdit = (ab: AgentAbility) => {
    setEditingId(ab.id);
    setEditDraft({
      name: ab.name,
      peCost: ab.peCost,
      description: ab.description,
    });
    setExpandedIds((prev) => ({ ...prev, [ab.id]: true }));
  };

  const saveEdit = (id: string) => {
    onUpdate((prev) => ({
      ...prev,
      abilities: prev.abilities.map((a) =>
        a.id === id
          ? {
              ...a,
              name: editDraft.name.trim() || a.name,
              peCost: editDraft.peCost,
              description: editDraft.description,
            }
          : a
      ),
    }));
    setEditingId(null);
  };

  const removeAbility = (id: string) => {
    onUpdate((prev) => ({
      ...prev,
      abilities: prev.abilities.filter((a) => a.id !== id),
    }));
  };

  const renderAccordionCard = (ab: AgentAbility) => {
    const isExpanded = Boolean(expandedIds[ab.id]);
    const isEditing = editingId === ab.id;
    const isParanormal = ab.source === "Paranormal";
    const elemStyle = ab.element ? ELEMENT_STYLES[ab.element] : null;
    const affinityActive = Boolean(
      ab.hasAffinity ||
        (isParanormal &&
          agent.affinityElement &&
          ab.element &&
          ab.element === agent.affinityElement)
    );

    return (
      <div
        key={ab.id}
        className={cn(
          "rounded-md border border-[#22222A] bg-[#101014] transition-colors hover:border-[#32323E]",
          isParanormal && elemStyle && `border-l-[3px] ${elemStyle.borderLeft}`
        )}
      >
        {/* Spacious Header Row (min py-3.5 px-4) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggleItem(ab.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleItem(ab.id);
            }
          }}
          className="flex items-center justify-between gap-3 py-3.5 px-4 cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <span className="text-[15px] font-semibold text-[#F4F4F5] leading-snug">
              {ab.name}
            </span>
            {ab.element && elemStyle && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                  elemStyle.badge
                )}
              >
                <span className={cn("h-1.5 w-1.5", elemStyle.dot)} />
                {ab.element}
              </span>
            )}
            {ab.source === "Homebrew" && (
              <Badge variant="outline" className="font-mono text-[10px]">
                HOMEBREW
              </Badge>
            )}
            {ab.isTranscender && (
              <Badge variant="warning" className="font-mono text-[10px]">
                TRANSCENDER
              </Badge>
            )}
            {isParanormal && affinityActive && (
              <Badge variant="warning" className="font-mono text-[10px]">
                AFINIDADE
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-sm border border-[#22222A] bg-[#09090B] px-2 py-0.5 font-mono text-[11px] text-[#D4D4D8]">
              {ab.peCost > 0 ? `${ab.peCost} ${resUnit}` : "PASSIVA"}
            </span>
            <Button
              size="xs"
              variant={ab.peCost > 0 ? "default" : "secondary"}
              onClick={(e) => {
                e.stopPropagation();
                onUseAbility({ ...ab, hasAffinity: affinityActive });
              }}
            >
              <Zap className="h-3 w-3" /> Usar
            </Button>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-[#8E8E9E]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#8E8E9E]" />
            )}
          </div>
        </div>

        {/* Expanded Body — Generous Readability, Zero Overflow Clipping */}
        {isExpanded && (
          <div className="border-t border-[#1E1E26] px-4 pb-4 pt-3 space-y-3.5">
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_100px] gap-2">
                  <Input
                    value={editDraft.name}
                    onChange={(e) =>
                      setEditDraft({ ...editDraft, name: e.target.value })
                    }
                    placeholder="Nome"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={editDraft.peCost}
                    onChange={(e) =>
                      setEditDraft({
                        ...editDraft,
                        peCost: Number(e.target.value) || 0,
                      })
                    }
                    className="font-mono"
                    placeholder="PE"
                  />
                </div>
                <Textarea
                  rows={3}
                  value={editDraft.description}
                  onChange={(e) =>
                    setEditDraft({ ...editDraft, description: e.target.value })
                  }
                />
                <div className="flex justify-end gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setEditingId(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={() => saveEdit(ab.id)}
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  {isParanormal && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8E8E9E] block">
                      EFEITO BASE
                    </span>
                  )}
                  <p className="text-[14px] leading-[1.68] text-[#D4D4D8] whitespace-pre-line">
                    {ab.description}
                  </p>
                </div>

                {/* Paranormal Affinity Section */}
                {isParanormal && (
                  <div
                    className={cn(
                      "rounded-sm border p-3.5 space-y-2 transition-colors",
                      affinityActive
                        ? "border-amber-500/40 bg-amber-500/5"
                        : "border-[#22222A] bg-[#0C0C10]"
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]",
                          affinityActive ? "text-amber-300" : "text-[#8E8E9E]"
                        )}
                      >
                        <Sparkles className="h-3 w-3" /> AFINIDADE (NEX 50%+)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdate((prev) => ({
                            ...prev,
                            abilities: prev.abilities.map((x) =>
                              x.id === ab.id
                                ? { ...x, hasAffinity: !affinityActive }
                                : x
                            ),
                          }))
                        }
                        className={cn(
                          "rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors",
                          affinityActive
                            ? "border-amber-500/50 bg-amber-500/15 text-amber-200"
                            : "border-[#22222A] bg-[#101014] text-[#8E8E9E] hover:text-[#F4F4F5]"
                        )}
                      >
                        {affinityActive ? "Afinidade Ativa" : "Ativar Afinidade"}
                      </button>
                    </div>
                    <p
                      className={cn(
                        "text-[14px] leading-[1.65]",
                        affinityActive ? "text-[#F4F4F5]" : "text-[#8E8E9E]"
                      )}
                    >
                      {ab.affinityDescription ||
                        "Sem efeito adicional de afinidade especificado."}
                    </p>
                  </div>
                )}

                {/* Structured Metadata & Secondary Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1A1A22] pt-2.5">
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-[#6E6E7E]">
                    <span>CATEGORIA: {ab.source}</span>
                    {ab.bookSource && (
                      <span>FONTE: {BOOK_SOURCE_LABEL[ab.bookSource]}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(ab)}
                      className="inline-flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-[10px] text-[#8E8E9E] hover:bg-[#16161C] hover:text-[#F4F4F5]"
                    >
                      <Edit3 className="h-3 w-3" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAbility(ab.id)}
                      className="inline-flex items-center gap-1 rounded-sm px-2 py-1 font-mono text-[10px] text-[#8E8E9E] hover:bg-red-600/10 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" /> Remover
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const showSection = (sec: Exclude<SubFilter, "todas">) =>
    subFilter === "todas" || subFilter === sec;

  return (
    <div className="space-y-6">
      {/* A. Top Control & Filter Bar */}
      <div className="space-y-3 border-b border-[#22222A] pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6E6E7E]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, efeito ou pré-requisito..."
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={toggleExpandAll}
              className="font-mono text-[11px]"
            >
              {allExpanded ? "Recolher todas" : "Expandir todas"}
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setCatalogOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar Habilidade
            </Button>
          </div>
        </div>

        {/* Segmented Sub-tabs with Live Counts */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "todas" as const, label: "Todas", count: totalCount },
              { id: "origem" as const, label: "Origem", count: counts.origem },
              { id: "classe" as const, label: "Classe", count: counts.classe },
              { id: "trilha" as const, label: "Trilha", count: counts.trilha },
              { id: "gerais" as const, label: "Gerais", count: counts.gerais },
              {
                id: "paranormais" as const,
                label: "Paranormais",
                count: counts.paranormais,
              },
            ] as const
          ).map((f) => {
            const active = subFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSubFilter(f.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                    : "border-[#22222A] bg-[#0C0C10] text-[#8E8E9E] hover:text-[#D4D4D8] hover:border-[#32323E]"
                )}
              >
                <span>{f.label}</span>
                <span
                  className={cn(
                    "font-mono text-[10px]",
                    active ? "text-[#D4D4D8]" : "text-[#6E6E7E]"
                  )}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* B. 01 // PODER DE ORIGEM (Always open by default) */}
      {showSection("origem") && originDef && originMatches && (
        <section>
          <SectionHeader index="01" title="Poder de Origem" count={1} />
          <div className="rounded-md border border-[#22222A] border-l-[3px] border-l-[#525266] bg-[#101014] p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-display text-base font-bold text-[#F4F4F5]">
                    {originDef.powerName}
                  </h4>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    ORIGEM · {originDef.name.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#6E6E7E]">
                    PERÍCIAS CONCEDIDAS:
                  </span>
                  {(originDef.trainedSkillNotes &&
                  originDef.trainedSkillNotes.length > 0
                    ? originDef.trainedSkillNotes
                    : originDef.trainedSkills.map(
                        (k) => SKILLS_BY_KEY[k]?.name ?? k
                      )
                  ).map((label) => (
                    <span
                      key={label}
                      className="rounded-sm border border-[#22222A] bg-[#16161C] px-2 py-0.5 font-mono text-[10px] text-[#D4D4D8]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-sm border border-[#22222A] bg-[#09090B] px-2 py-0.5 font-mono text-[11px] text-[#D4D4D8]">
                  {(originDef.powerPeCost ?? 0) > 0
                    ? `${originDef.powerPeCost} ${resUnit}`
                    : "PASSIVA"}
                </span>
                <Button
                  size="xs"
                  variant={(originDef.powerPeCost ?? 0) > 0 ? "default" : "secondary"}
                  onClick={() =>
                    onUseAbility(
                      originPowerAbility ?? {
                        id: `origin_${originDef.id}`,
                        name: originDef.powerName,
                        source: "Origem",
                        peCost: originDef.powerPeCost ?? 0,
                        description: originDef.powerDescription,
                      }
                    )
                  }
                >
                  <Zap className="h-3 w-3" /> Usar
                </Button>
              </div>
            </div>

            <p className="text-[14px] leading-[1.68] text-[#D4D4D8]">
              {originDef.powerDescription}
            </p>
          </div>
        </section>
      )}

      {/* B. 02 // HABILIDADES DE CLASSE (Base + Poderes Escolhidos) */}
      {showSection("classe") && (baseClassMatches || filteredClassPowers.length > 0) && (
        <section className="space-y-3">
          <SectionHeader
            index="02"
            title={`Habilidades de Classe (${classDef.name})`}
            count={1 + chosenClassPowers.length}
          />

          {/* Base Class Feature */}
          {baseClassMatches && (
            <div className="rounded-md border border-[#22222A] bg-[#101014]">
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleItem(`base_class_${classDef.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleItem(`base_class_${classDef.id}`);
                  }
                }}
                className="flex items-center justify-between gap-3 py-3.5 px-4 cursor-pointer select-none"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[15px] font-semibold text-[#F4F4F5]">
                    {classDef.baseAbility.name}
                  </span>
                  <Badge variant="default" className="font-mono text-[10px]">
                    BASE · {getClassBaseScalingTag(agent)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-sm border border-[#22222A] bg-[#09090B] px-2 py-0.5 font-mono text-[11px] text-[#D4D4D8]">
                    {classDef.baseAbility.peCost > 0
                      ? `${classDef.baseAbility.peCost} ${resUnit}`
                      : "PASSIVA"}
                  </span>
                  <Button
                    size="xs"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUseAbility({
                        id: `base_${classDef.id}`,
                        name: classDef.baseAbility.name,
                        source: "Classe",
                        peCost: classDef.baseAbility.peCost,
                        description: classDef.baseAbility.description,
                      });
                    }}
                  >
                    <Zap className="h-3 w-3" /> Usar
                  </Button>
                  {expandedIds[`base_class_${classDef.id}`] ? (
                    <ChevronUp className="h-4 w-4 text-[#8E8E9E]" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#8E8E9E]" />
                  )}
                </div>
              </div>
              {(expandedIds[`base_class_${classDef.id}`] ?? true) && (
                <div className="border-t border-[#1E1E26] px-4 pb-4 pt-3">
                  <p className="text-[14px] leading-[1.68] text-[#D4D4D8]">
                    {classDef.baseAbility.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Chosen Class Powers */}
          {filteredClassPowers.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6E6E7E] block">
                PODERES DE CLASSE ESCOLHIDOS
              </span>
              {filteredClassPowers.map(renderAccordionCard)}
            </div>
          )}
        </section>
      )}

      {/* B. 03 // PROGRESSÃO DE TRILHA (Chronological Timeline) */}
      {showSection("trilha") && (
        <section>
          <SectionHeader
            index="03"
            title={
              trailDef
                ? `Progressão de Trilha — ${trailDef.name}`
                : "Progressão de Trilha"
            }
            count={unlockedTrailCount}
            rightSlot={
              trailDef && (
                <button
                  type="button"
                  onClick={() => setShowFutureMilestones((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-[#22222A] bg-[#0C0C10] px-2 py-0.5 font-mono text-[10px] text-[#8E8E9E] hover:text-[#F4F4F5] transition-colors"
                >
                  {showFutureMilestones ? (
                    <>
                      <EyeOff className="h-3 w-3" /> Ocultar futuros
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" /> Mostrar marcos futuros
                    </>
                  )}
                </button>
              )
            }
          />

          {!trailDef ? (
            <div className="rounded-md border border-dashed border-[#22222A] bg-[#0C0C10] px-5 py-5 text-xs text-[#8E8E9E]">
              Nenhuma trilha selecionada.{" "}
              {agent.classId === "sobrevivente"
                ? "Disponível a partir do Estágio 2 em Configuração do Dossiê."
                : "Disponível a partir de NEX 10% em Configuração do Dossiê."}
            </div>
          ) : (
            <div className="relative pl-5 space-y-2.5 before:content-[''] before:absolute before:left-[7px] before:top-3 before:bottom-3 before:w-[1px] before:bg-[#22222A]">
              {filteredTrailMilestones.map((m) => {
                const isExpanded = expandedIds[m.id] ?? m.unlocked;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "relative rounded-md border border-[#22222A] bg-[#101014] transition-opacity",
                      !m.unlocked && "opacity-45"
                    )}
                  >
                    {/* Timeline node dot */}
                    <span
                      className={cn(
                        "absolute -left-[19px] top-5 h-2.5 w-2.5 rounded-none border",
                        m.unlocked
                          ? "bg-[#F4F4F5] border-[#F4F4F5]"
                          : "bg-[#09090B] border-[#525266]"
                      )}
                    />

                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleItem(m.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleItem(m.id);
                        }
                      }}
                      className="flex items-center justify-between gap-3 py-3.5 px-4 cursor-pointer select-none"
                    >
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={cn(
                            "rounded-sm border px-2 py-0.5 font-mono text-[10px] font-bold",
                            m.unlocked
                              ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                              : "border-[#22222A] bg-[#09090B] text-[#8E8E9E]"
                          )}
                        >
                          {m.labelMarco}
                        </span>
                        <span className="text-[15px] font-semibold text-[#F4F4F5]">
                          {m.name}
                        </span>
                        {!m.unlocked && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#8E8E9E]">
                            <Lock className="h-3 w-3" /> BLOQUEADO
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded-sm border border-[#22222A] bg-[#09090B] px-2 py-0.5 font-mono text-[11px] text-[#D4D4D8]">
                          {(m.peCost ?? 0) > 0
                            ? `${m.peCost} ${resUnit}`
                            : "PASSIVA"}
                        </span>
                        {m.unlocked && (
                          <Button
                            size="xs"
                            variant={(m.peCost ?? 0) > 0 ? "default" : "secondary"}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUseAbility({
                                id: m.id,
                                name: m.name,
                                source: "Trilha",
                                peCost: m.peCost ?? 0,
                                description: m.description,
                              });
                            }}
                          >
                            <Zap className="h-3 w-3" /> Usar
                          </Button>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-[#8E8E9E]" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-[#8E8E9E]" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#1E1E26] px-4 pb-4 pt-3">
                        <p className="text-[14px] leading-[1.68] text-[#D4D4D8]">
                          {m.description}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {customTrailAbilities.map(renderAccordionCard)}
            </div>
          )}
        </section>
      )}

      {/* B. 04 // PODERES GERAIS */}
      {showSection("gerais") && (
        <section>
          <SectionHeader
            index="04"
            title="Poderes Gerais"
            count={generalPowers.length}
          />
          {filteredGeneralPowers.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#22222A] bg-[#0C0C10] px-5 py-5 flex items-center justify-between gap-3">
              <span className="text-xs text-[#8E8E9E]">
                Nenhum poder geral na ficha.
              </span>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setCatalogOpen(true)}
              >
                <Plus className="h-3 w-3" /> Escolher Poder Geral
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredGeneralPowers.map(renderAccordionCard)}
            </div>
          )}
        </section>
      )}

      {/* B. 05 // PODERES PARANORMAIS */}
      {showSection("paranormais") && (
        <section>
          <SectionHeader
            index="05"
            title="Poderes Paranormais"
            count={paranormalPowers.length}
            rightSlot={
              agent.affinityElement && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase",
                    ELEMENT_STYLES[agent.affinityElement].badge
                  )}
                >
                  AFINIDADE: {agent.affinityElement}
                </span>
              )
            }
          />
          {filteredParanormalPowers.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#22222A] bg-[#0C0C10] px-5 py-5 flex items-center justify-between gap-3">
              <span className="text-xs text-[#8E8E9E]">
                Nenhum poder paranormal (Transcender) registrado.
              </span>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setCatalogOpen(true)}
              >
                <Plus className="h-3 w-3" /> Transcender / Adicionar
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredParanormalPowers.map(renderAccordionCard)}
            </div>
          )}
        </section>
      )}

      {/* D. Wide 2-Column Master-Detail Catalog Modal */}
      <AbilitiesCatalogModal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        agent={agent}
        onAddAbility={(ability, isTranscender) => {
          onUpdate((prev) => ({
            ...prev,
            transcenderCount: isTranscender
              ? (prev.transcenderCount ?? 0) + 1
              : prev.transcenderCount,
            abilities: [ability, ...prev.abilities],
          }));
          setExpandedIds((prev) => ({ ...prev, [ability.id]: true }));
        }}
      />
    </div>
  );
}
