"use client";

import React, { useMemo, useState } from "react";
import {
  Crown,
  Dices,
  Edit3,
  Eye,
  Heart,
  Plus,
  Search,
  Send,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Trash2,
  Users,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { COMMUNITY_RELICS, COMMUNITY_THREATS } from "@/data/supplements";
import {
  DEFAULT_ENABLED_SOURCES,
  filterByEnabledSources,
} from "@/lib/sources";
import {
  SourceBadge,
  SourceToggleGroup,
  setCommunityList,
  toggleSourceList,
} from "@/components/SourceToggles";
import { rollDiceFormula, rollOrdemTest } from "@/lib/ordem-rules";
import { cn, ELEMENT_STYLES, generateId } from "@/lib/utils";
import type {
  AgentAlly,
  ContentSource,
  ParanormalElement,
  RelicDefinition,
  Threat,
  ThreatAttack,
} from "@/types/ordem";
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui/primitives";

const ELEMENTS: ParanormalElement[] = [
  "Sangue",
  "Morte",
  "Conhecimento",
  "Energia",
  "Medo",
  "Realidade",
];

function createEmptyThreat(): Threat {
  return {
    id: generateId("threat"),
    name: "",
    vd: 20,
    element: "Sangue",
    size: "Médio",
    type: "Criatura",
    pv: 45,
    defense: 16,
    displacement: "9m / 6q",
    disturbingPresence: { dt: 15, damage: "2d6 mental", nexImmunity: 25 },
    attributes: { AGI: 2, FOR: 2, INT: 1, PRE: 1, VIG: 2 },
    saves: { fortitude: 5, reflexos: 5, vontade: 5 },
    skills: [{ name: "Iniciativa", dice: 2, bonus: 5 }],
    resistances: "Balístico, corte e perfuração 5",
    vulnerabilities: "",
    attacks: [
      {
        id: generateId("tatk"),
        name: "Golpe Paranormal",
        diceCount: 2,
        testBonus: 10,
        damageFormula: "2d6+4",
        damageType: "Sangue",
        threatRange: 20,
        critMultiplier: 2,
      },
    ],
    abilities: [
      {
        id: generateId("tab"),
        name: "Habilidade Especial",
        description: "Descreva a habilidade especial da ameaça.",
      },
    ],
    description: "",
    isHomebrew: true,
  };
}

export default function AmeacasPage() {
  const {
    agents,
    threats,
    campaigns,
    addThreat,
    updateThreat,
    deleteThreat,
    updateAgent,
    toggleThreatEnigmaResolved,
    sendThreatToCampaignInitiative,
    pushRoll,
  } = useAppStore();

  const [activeSection, setActiveSection] = useState<"bestiario" | "reliquias">(
    "bestiario"
  );
  const [search, setSearch] = useState("");
  const [elementFilter, setElementFilter] = useState<"Todos" | ParanormalElement>(
    "Todos"
  );
  const [variantFilter, setVariantFilter] = useState<
    "todos" | "base" | "variantes"
  >("todos");
  const [enabledSources, setEnabledSources] = useState<ContentSource[]>([
    ...DEFAULT_ENABLED_SOURCES,
    "guia_confidencial_vol1",
    "misterios_do_outro_lado",
  ]);
  const [showSourcesPanel, setShowSourcesPanel] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Threat>(createEmptyThreat());

  const [sendModalThreat, setSendModalThreat] = useState<Threat | null>(null);
  const [detailThreatId, setDetailThreatId] = useState<string | null>(null);
  const [targetCampaignId, setTargetCampaignId] = useState(
    campaigns[0]?.id ?? ""
  );
  const [relicModal, setRelicModal] = useState<RelicDefinition | null>(null);
  const [targetAgentId, setTargetAgentId] = useState(agents[0]?.id ?? "");
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  const combinedThreats = useMemo(() => {
    const storeIds = new Set(threats.map((t) => t.id));
    const communityExtra = COMMUNITY_THREATS.filter((ct) => !storeIds.has(ct.id));
    return filterByEnabledSources(
      [...threats, ...communityExtra],
      enabledSources
    );
  }, [threats, enabledSources]);

  const detailThreat = useMemo(
    () => combinedThreats.find((t) => t.id === detailThreatId) ?? null,
    [combinedThreats, detailThreatId]
  );

  const variantCount = useMemo(
    () => combinedThreats.filter((t) => Boolean(t.isVariant)).length,
    [combinedThreats]
  );

  const visibleRelics = useMemo(
    () => filterByEnabledSources(COMMUNITY_RELICS, enabledSources),
    [enabledSources]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return combinedThreats.filter((t) => {
      if (elementFilter !== "Todos" && t.element !== elementFilter) return false;
      if (variantFilter === "variantes" && !t.isVariant) return false;
      if (variantFilter === "base" && t.isVariant) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.baseCreatureName?.toLowerCase().includes(q) ?? false) ||
        String(t.vd).includes(q)
      );
    });
  }, [combinedThreats, search, elementFilter, variantFilter]);

  const handleRollThreatAttack = (threat: Threat, atk: ThreatAttack) => {
    const res = rollOrdemTest({
      attributeValue: atk.diceCount,
      bonus: atk.testBonus,
      threatRange: atk.threatRange,
    });
    pushRoll({
      actorName: threat.name,
      label: `Ataque: ${atk.name}`,
      kind: "threat",
      element: threat.element,
      formula: res.formula,
      diceRolled: res.diceRolled,
      chosenDie: res.chosenDie,
      mode: res.mode,
      bonus: res.bonus,
      total: res.total,
      isNat20: res.isNat20,
      isNat1: res.isNat1,
      isCriticalThreat: res.isCriticalThreat,
      details: atk.notes || `VD ${threat.vd} • ${threat.element}`,
    });
  };

  const handleRollThreatDamage = (
    threat: Threat,
    atk: ThreatAttack,
    isCrit: boolean
  ) => {
    try {
      const res = rollDiceFormula({
        formula: atk.damageFormula,
        isCritical: isCrit,
        critMultiplier: atk.critMultiplier,
      });
      pushRoll({
        actorName: threat.name,
        label: `${isCrit ? "Dano Crítico" : "Dano"}: ${atk.name} (${atk.damageType})`,
        kind: "damage",
        element: threat.element,
        formula: res.effectiveFormula,
        diceRolled: res.diceRolled,
        mode: "sum",
        bonus: res.bonus,
        total: res.total,
        isCriticalDamage: res.isCriticalDamage,
        details: res.breakdown,
      });
    } catch {
      // ignore invalid formula
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(createEmptyThreat());
    setEditorOpen(true);
  };

  const openEdit = (threat: Threat) => {
    setEditingId(threat.id);
    setForm(JSON.parse(JSON.stringify(threat)));
    setEditorOpen(true);
  };

  const handleSaveThreat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId && threats.some((t) => t.id === editingId)) {
      updateThreat(editingId, () => form);
    } else if (editingId) {
      addThreat({ ...form, id: editingId });
    } else {
      addThreat({ ...form, id: generateId("threat") });
    }
    setEditorOpen(false);
  };

  const handleToggleEnigma = (threat: Threat) => {
    if (threats.some((t) => t.id === threat.id)) {
      toggleThreatEnigmaResolved(threat.id);
    } else {
      addThreat({ ...threat, enigmaResolved: !threat.enigmaResolved });
    }
  };

  const handleSendToInitiative = () => {
    if (!sendModalThreat || !targetCampaignId) return;
    const initSkill = sendModalThreat.skills.find((s) =>
      s.name.toLowerCase().includes("iniciativa")
    );
    const roll = rollOrdemTest({
      attributeValue: initSkill?.dice ?? sendModalThreat.attributes.AGI,
      bonus: initSkill?.bonus ?? 0,
    });
    sendThreatToCampaignInitiative(targetCampaignId, sendModalThreat, roll.total);
    pushRoll({
      actorName: sendModalThreat.name,
      campaignId: targetCampaignId,
      label: "Iniciativa (Enviado à Campanha)",
      kind: "threat",
      element: sendModalThreat.element,
      formula: roll.formula,
      diceRolled: roll.diceRolled,
      chosenDie: roll.chosenDie,
      mode: roll.mode,
      bonus: roll.bonus,
      total: roll.total,
    });
    const campName =
      campaigns.find((c) => c.id === targetCampaignId)?.name ?? "Campanha";
    setSentNotice(
      `"${sendModalThreat.name}" enviado para "${campName}" com iniciativa ${roll.total}!`
    );
    window.setTimeout(() => setSentNotice(null), 4500);
    setSendModalThreat(null);
  };

  const handleAddRelicAsAlly = () => {
    if (!relicModal || !targetAgentId) return;
    const abilityTitle =
      relicModal.ally.ability.split("(")[0]?.trim() || "Habilidade de Relíquia";
    const ally: AgentAlly = {
      id: generateId("ally"),
      templateId: "custom",
      name: `Relíquia Aliada — ${relicModal.name}`,
      kind: "aliado",
      helping: true,
      bonusSummary: `${relicModal.ally.general} • ${relicModal.ally.bonus}`,
      attackDiceBonus:
        relicModal.id === "mol_rel_trono_de_sangue" ? 1 : undefined,
      abilityName: abilityTitle,
      abilityPeCost: 7,
      abilityDescription: relicModal.ally.ability,
      notes: `Relíquia como Aliada (${relicModal.element} · Mistérios do Outro Lado). ${relicModal.bearerRelation}`,
    };
    updateAgent(targetAgentId, (prev) => ({
      ...prev,
      allies: [ally, ...(prev.allies ?? [])],
    }));
    const agentName =
      agents.find((a) => a.id === targetAgentId)?.name ?? "Agente";
    setSentNotice(
      `Bônus de "${relicModal.name}" adicionados como Aliada na ficha de "${agentName}"!`
    );
    window.setTimeout(() => setSentNotice(null), 4500);
    setRelicModal(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#22222A] pb-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8E8E9E]">
            Arquivo Paranormal · Bestiário
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F4F5] mt-1">
            Ameaças
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-sm border border-[#22222A] bg-[#0D0D11] p-0.5">
            <button
              type="button"
              onClick={() => setActiveSection("bestiario")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                activeSection === "bestiario"
                  ? "bg-[#16161C] text-[#F4F4F5]"
                  : "text-[#8E8E9E] hover:text-[#D4D4D8]"
              )}
            >
              <Skull className="h-3.5 w-3.5" /> Bestiário ({combinedThreats.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("reliquias")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                activeSection === "reliquias"
                  ? "bg-[#16161C] text-[#F4F4F5]"
                  : "text-[#8E8E9E] hover:text-[#D4D4D8]"
              )}
            >
              <Crown className="h-3.5 w-3.5 text-amber-400" /> Relíquias (
              {visibleRelics.length})
            </button>
          </div>
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nova Ameaça
          </Button>
        </div>
      </div>

      {sentNotice && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
          {sentNotice}
        </div>
      )}

      {activeSection === "reliquias" ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-[#F4F4F5]">
                Relíquias da Calamidade
              </h2>
              <p className="text-xs text-[#8E8E9E]">
                Efeitos de objeto, relação com o portador, habilidades opcionais
                e bônus de Relíquia como Aliada (Mistérios do Outro Lado).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSourcesPanel((v) => !v)}
              className={cn(
                "rounded-sm border px-2.5 py-1 font-mono text-[10px] transition-colors",
                showSourcesPanel
                  ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                  : "border-[#32323E] bg-[#141419] text-[#A1A1AA] hover:text-[#F4F4F5]"
              )}
            >
              {showSourcesPanel ? "Ocultar Fontes" : "Fontes & Suplementos"}
            </button>
          </div>

          {showSourcesPanel && (
            <Card className="p-3.5">
              <SourceToggleGroup
                compact
                enabled={enabledSources}
                onToggle={(src) =>
                  setEnabledSources((prev) => toggleSourceList(prev, src))
                }
                onSetCommunity={(on) =>
                  setEnabledSources((prev) => setCommunityList(prev, on))
                }
              />
            </Card>
          )}

          {visibleRelics.length === 0 ? (
            <Card className="p-8 text-center space-y-3 border-dashed">
              <p className="text-sm text-[#A1A1AA]">
                A fonte <strong>Mistérios do Outro Lado</strong> está desativada
                nos filtros atuais.
              </p>
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  setEnabledSources((prev) =>
                    prev.includes("misterios_do_outro_lado")
                      ? prev
                      : [...prev, "misterios_do_outro_lado"]
                  )
                }
              >
                Ativar Mistérios do Outro Lado
              </Button>
            </Card>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {visibleRelics.map((relic) => {
                const st = ELEMENT_STYLES[relic.element];
                return (
                  <Card
                    key={relic.id}
                    className={cn(
                      "p-5 space-y-4 border-l-[3px] hover:border-[#32323E] transition-colors",
                      st.borderLeft
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Crown className={cn("h-4 w-4", st.text)} />
                          <h3 className="text-lg font-bold text-zinc-50">
                            {relic.name}
                          </h3>
                          <SourceBadge source={relic.source} />
                          <span
                            className={cn(
                              "rounded border px-2 py-0.5 text-[11px] font-semibold uppercase",
                              st.badge
                            )}
                          >
                            {relic.element}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="xs"
                        variant="primary"
                        className="shrink-0"
                        onClick={() => {
                          setTargetAgentId(agents[0]?.id ?? "");
                          setRelicModal(relic);
                        }}
                      >
                        <Users className="h-3 w-3" /> Adicionar como Aliada
                      </Button>
                    </div>

                    <div className="space-y-2.5 text-xs text-zinc-300 leading-relaxed">
                      <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-3 space-y-1">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8E8E9E] block">
                          Efeito do Objeto
                        </span>
                        <p>{relic.objectEffect}</p>
                      </div>

                      <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-3 space-y-1">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                          Relação com o Portador
                        </span>
                        <p>{relic.bearerRelation}</p>
                      </div>

                      <div className="rounded-sm border border-purple-500/30 bg-purple-500/5 p-3 space-y-1.5">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
                          Relíquia como Aliada
                        </span>
                        <p>
                          <strong className="text-zinc-100">Geral:</strong>{" "}
                          {relic.ally.general}
                        </p>
                        <p>
                          <strong className="text-zinc-100">Bônus:</strong>{" "}
                          {relic.ally.bonus}
                        </p>
                        <p>
                          <strong className="text-zinc-100">Habilidade:</strong>{" "}
                          {relic.ally.ability}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 border-t border-[#20202C] pt-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                        Habilidades Opcionais ({relic.optionalAbilities.length})
                      </span>
                      {relic.optionalAbilities.map((ab) => (
                        <div key={ab.name} className="text-xs text-zinc-400">
                          <strong className="text-zinc-200">{ab.name}:</strong>{" "}
                          {ab.description}
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search & Element Filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative max-w-sm w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar ameaça, base ou VD..."
                  className="pl-9"
                />
              </div>
              <div className="inline-flex rounded-sm border border-[#22222A] bg-[#0D0D11] p-0.5 text-[11px]">
                {(
                  [
                    { id: "todos", label: "Todas" },
                    { id: "base", label: "Criaturas" },
                    { id: "variantes", label: `Variantes (${variantCount})` },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setVariantFilter(opt.id)}
                    className={cn(
                      "rounded-sm px-2.5 py-1 font-mono transition-colors",
                      variantFilter === opt.id
                        ? "bg-[#16161C] text-[#F4F4F5]"
                        : "text-[#8E8E9E] hover:text-[#D4D4D8]"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <button
            type="button"
            onClick={() => setElementFilter("Todos")}
            className={cn(
              "rounded-sm border px-2.5 py-1 text-xs transition-colors",
              elementFilter === "Todos"
                ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                : "border-[#22222A] bg-[#101014] text-[#8E8E9E] hover:text-[#D4D4D8]"
            )}
          >
            Todos ({combinedThreats.length})
          </button>
          {ELEMENTS.map((el) => {
            const st = ELEMENT_STYLES[el];
            return (
              <button
                key={el}
                type="button"
                onClick={() => setElementFilter(el)}
                className={cn(
                  "rounded-sm border px-2.5 py-1 text-xs transition-colors",
                  elementFilter === el
                    ? st.badge
                    : "border-[#22222A] bg-[#101014] text-[#8E8E9E] hover:text-[#D4D4D8]"
                )}
              >
                {el}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowSourcesPanel((v) => !v)}
            className={cn(
              "rounded-sm border px-2.5 py-1 font-mono text-[10px] transition-colors",
              showSourcesPanel
                ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                : "border-[#32323E] bg-[#141419] text-[#A1A1AA] hover:text-[#F4F4F5]"
            )}
          >
            {showSourcesPanel ? "Ocultar Fontes" : "Fontes & Suplementos"}
          </button>
        </div>
      </div>

      {showSourcesPanel && (
        <Card className="p-3.5">
          <SourceToggleGroup
            compact
            enabled={enabledSources}
            onToggle={(src) =>
              setEnabledSources((prev) => toggleSourceList(prev, src))
            }
            onSetCommunity={(on) =>
              setEnabledSources((prev) => setCommunityList(prev, on))
            }
          />
        </Card>
      )}

      {/* Threat Cards */}
      <div className="grid gap-5 lg:grid-cols-2">
        {filtered.map((threat) => {
          const st = ELEMENT_STYLES[threat.element];
          return (
            <Card
              key={threat.id}
              className={cn(
                "p-5 space-y-4 border-l-[3px] hover:border-[#32323E] transition-colors",
                st.borderLeft
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Skull className={cn("h-4 w-4", st.text)} />
                    <button
                      type="button"
                      onClick={() => setDetailThreatId(threat.id)}
                      className="text-left text-lg font-bold text-zinc-50 hover:text-zinc-200 underline-offset-4 hover:underline"
                    >
                      {threat.name}
                    </button>
                    <SourceBadge source={threat.source} />
                    {threat.isVariant && (
                      <Badge variant="warning" className="font-mono text-[10px]">
                        VARIANTE
                      </Badge>
                    )}
                    <span
                      className={cn(
                        "rounded border px-2 py-0.5 text-[11px] font-semibold uppercase",
                        st.badge
                      )}
                    >
                      {threat.element}
                    </span>
                    {threat.secondaryElements?.map((sec) => (
                      <span
                        key={sec}
                        className={cn(
                          "rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                          ELEMENT_STYLES[sec].badge
                        )}
                      >
                        + {sec}
                      </span>
                    ))}
                    <Badge variant="default" className="font-mono">
                      VD {threat.vd}
                    </Badge>
                    {threat.isHomebrew && <Badge variant="purple">HB</Badge>}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {threat.type} • {threat.size} • Deslocamento {threat.displacement}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setDetailThreatId(threat.id)}
                    title="Abrir modal completo da criatura"
                  >
                    <Eye className="h-3 w-3" /> Ficha
                  </Button>
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => {
                      setTargetCampaignId(campaigns[0]?.id ?? "");
                      setSendModalThreat(threat);
                    }}
                    title="Enviar para iniciativa de uma campanha"
                  >
                    <Send className="h-3 w-3 text-purple-400" /> Iniciativa
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEdit(threat)}
                    title="Editar ameaça"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:text-red-400"
                    onClick={() => {
                      if (window.confirm(`Excluir "${threat.name}"?`)) {
                        deleteThreat(threat.id);
                      }
                    }}
                    title="Excluir ameaça"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {threat.isVariant && threat.variantAlterations && (
                <div className="rounded-sm border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-100 space-y-0.5">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                    Variante de {threat.baseCreatureName} · Alterações
                  </span>
                  <p>{threat.variantAlterations}</p>
                </div>
              )}

              {threat.description && !threat.isVariant && (
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {threat.description}
                </p>
              )}

              {/* Core Stats */}
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-2.5">
                  <span className="text-[10px] text-red-400 flex items-center gap-1">
                    <Heart className="h-3 w-3" /> PV
                  </span>
                  <span className="text-lg font-bold text-[#F4F4F5] tabular-nums">
                    {threat.pv}
                  </span>
                </div>
                <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-2.5">
                  <span className="text-[10px] text-[#A1A1AA] flex items-center gap-1">
                    <Shield className="h-3 w-3" /> DEFESA
                  </span>
                  <span className="text-lg font-bold text-[#F4F4F5] tabular-nums">
                    {threat.defense}
                  </span>
                </div>
                <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-2.5">
                  <span className="text-[10px] text-amber-400 block">
                    PRES. PERTURB.
                  </span>
                  <span className="text-xs font-bold text-[#F4F4F5] block mt-0.5 tabular-nums">
                    DT {threat.disturbingPresence.dt} ({threat.disturbingPresence.damage})
                  </span>
                </div>
              </div>

              {/* Attributes */}
              <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
                {(["AGI", "FOR", "INT", "PRE", "VIG"] as const).map((k) => (
                  <div
                    key={k}
                    className="rounded-sm border border-[#22222A] bg-[#0D0D11] py-1.5"
                  >
                    <span className="text-[10px] text-[#6E6E7E] block">{k}</span>
                    <span className="text-sm font-bold text-[#F4F4F5] tabular-nums">
                      {threat.attributes[k]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Resistances, Senses, Saves & Immunities */}
              <div className="text-[11px] text-zinc-400 space-y-1 rounded-md border border-white/10 bg-[#0D0D11]/80 p-2.5">
                {threat.senses && (
                  <p>
                    <strong className="text-zinc-200">Sentidos:</strong>{" "}
                    {[
                      threat.senses.percepcao
                        ? `Percepção ${threat.senses.percepcao}`
                        : null,
                      threat.senses.iniciativa
                        ? `Iniciativa ${threat.senses.iniciativa}`
                        : null,
                      ...(threat.senses.especiais ?? []),
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}
                <p>
                  <strong className="text-zinc-200">Testes de Resistência:</strong>{" "}
                  {threat.saveFormulas ? (
                    <>
                      Fort {threat.saveFormulas.fortitude ?? `+${threat.saves.fortitude}`} •{" "}
                      Ref {threat.saveFormulas.reflexos ?? `+${threat.saves.reflexos}`} •{" "}
                      Von {threat.saveFormulas.vontade ?? `+${threat.saves.vontade}`}
                    </>
                  ) : (
                    <>
                      Fort +{threat.saves.fortitude} • Ref +{threat.saves.reflexos} • Von +
                      {threat.saves.vontade}
                    </>
                  )}
                </p>
                {threat.skills.length > 0 && (
                  <p>
                    <strong className="text-zinc-200">Perícias:</strong>{" "}
                    {threat.skills
                      .map(
                        (sk) =>
                          `${sk.name} ${sk.dice}d20${
                            sk.bonus > 0
                              ? `+${sk.bonus}`
                              : sk.bonus < 0
                              ? `${sk.bonus}`
                              : ""
                          }`
                      )
                      .join(" • ")}
                  </p>
                )}
                {threat.immunities && (
                  <p>
                    <strong className="text-amber-300">Imunidades:</strong>{" "}
                    {threat.immunities}
                  </p>
                )}
                {threat.resistances && (
                  <p>
                    <strong className="text-zinc-200">Resistências a Dano:</strong>{" "}
                    {threat.resistances}
                  </p>
                )}
                {threat.vulnerabilities && (
                  <p>
                    <strong className="text-rose-300">Vulnerabilidades:</strong>{" "}
                    {threat.vulnerabilities}
                  </p>
                )}
              </div>

              {/* Enigma de Medo (com toggle Resolvido) */}
              {threat.enigmaOfFear && (
                <div
                  className={cn(
                    "rounded-xl border p-3 space-y-1.5 transition-all",
                    threat.enigmaResolved
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-sky-400/40 bg-sky-500/10"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-200">
                      Enigma de Medo
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleEnigma(threat)}
                      className={cn(
                        "rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors",
                        threat.enigmaResolved
                          ? "border-emerald-400 bg-emerald-600/30 text-emerald-100"
                          : "border-sky-400/50 bg-[#0D0D14] text-sky-200 hover:bg-sky-500/20"
                      )}
                    >
                      {threat.enigmaResolved ? "✓ Resolvido" : "Marcar Resolvido"}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-200 leading-relaxed">
                    {threat.enigmaOfFear}
                  </p>
                </div>
              )}

              {/* Clickable Attacks */}
              {threat.attacks.length > 0 && (
                <div className="space-y-2 border-t border-[#20202C] pt-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                    Ataques (clique para rolar)
                  </span>
                  {threat.attacks.map((atk) => (
                    <div
                      key={atk.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#242432] bg-[#0D0D14] p-2.5"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-semibold text-zinc-100">
                            {atk.name}
                          </p>
                          {atk.actionType && (
                            <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.2 font-mono text-[9px] uppercase text-zinc-300">
                              {atk.actionType}
                            </span>
                          )}
                          {atk.range && (
                            <span className="font-mono text-[10px] text-zinc-400">
                              • {atk.range}
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-zinc-400">
                          {atk.diceCount}d20+{atk.testBonus} • {atk.damageFormula}{" "}
                          ({atk.damageType}) • Crít {atk.threatRange}/x
                          {atk.critMultiplier}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="xs"
                          variant="primary"
                          onClick={() => handleRollThreatAttack(threat, atk)}
                        >
                          <Dices className="h-3 w-3" /> Teste
                        </Button>
                        <Button
                          size="xs"
                          variant="default"
                          onClick={() =>
                            handleRollThreatDamage(threat, atk, false)
                          }
                        >
                          <Swords className="h-3 w-3 text-red-400" /> Dano
                        </Button>
                        <Button
                          size="xs"
                          variant="danger"
                          onClick={() =>
                            handleRollThreatDamage(threat, atk, true)
                          }
                        >
                          <Sparkles className="h-3 w-3" /> x{atk.critMultiplier}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Abilities with Action Type Badges */}
              {threat.abilities.length > 0 && (
                <div className="space-y-2 border-t border-[#20202C] pt-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                    Habilidades ({threat.abilities.length})
                  </span>
                  {threat.abilities.map((ab) => (
                    <div
                      key={ab.id}
                      className="rounded-md border border-white/10 bg-[#0D0D14]/70 p-2.5 text-xs text-zinc-300 space-y-1"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-zinc-100">{ab.name}</strong>
                        {ab.actionType && (
                          <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-zinc-300">
                            {ab.actionType}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-400 leading-relaxed">
                        {ab.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
        </>
      )}

      {/* Add Relic as Ally Modal */}
      <Modal
        open={Boolean(relicModal)}
        onClose={() => setRelicModal(null)}
        title={`Relíquia como Aliada — ${relicModal?.name ?? ""}`}
        description="Selecione a ficha do agente que receberá os bônus e a habilidade desta Relíquia na aba Aliados & Pets."
        maxWidth="max-w-md"
      >
        {agents.length === 0 ? (
          <p className="text-xs text-zinc-400">
            Você ainda não possui nenhum agente cadastrado. Crie um agente na
            aba <strong className="text-zinc-200">Agentes</strong> primeiro.
          </p>
        ) : (
          <div className="space-y-4">
            {relicModal && (
              <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-3 text-xs text-zinc-300 space-y-1">
                <p>
                  <strong className="text-zinc-100">Geral:</strong>{" "}
                  {relicModal.ally.general}
                </p>
                <p>
                  <strong className="text-zinc-100">Bônus:</strong>{" "}
                  {relicModal.ally.bonus}
                </p>
                <p>
                  <strong className="text-zinc-100">Habilidade:</strong>{" "}
                  {relicModal.ally.ability}
                </p>
              </div>
            )}
            <Select
              value={targetAgentId}
              onChange={(e) => setTargetAgentId(e.target.value)}
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.patente})
                </option>
              ))}
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRelicModal(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleAddRelicAsAlly}>
                <Users className="h-3.5 w-3.5" /> Adicionar à Ficha
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Send to Initiative Modal */}
      <Modal
        open={Boolean(sendModalThreat)}
        onClose={() => setSendModalThreat(null)}
        title={`Enviar "${sendModalThreat?.name ?? ""}" para Iniciativa`}
        description="Selecione a campanha de destino. A iniciativa da ameaça será rolada automaticamente."
        maxWidth="max-w-md"
      >
        {campaigns.length === 0 ? (
          <p className="text-xs text-zinc-400">
            Você ainda não possui nenhuma campanha. Crie uma na aba{" "}
            <strong className="text-zinc-200">Campanhas</strong> primeiro.
          </p>
        ) : (
          <div className="space-y-4">
            <Select
              value={targetCampaignId}
              onChange={(e) => setTargetCampaignId(e.target.value)}
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSendModalThreat(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSendToInitiative}>
                <Send className="h-3.5 w-3.5" /> Rolar & Enviar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Threat Modal */}
      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? "Editar Ameaça" : "Nova Ameaça do Outro Lado"}
      >
        <form onSubmit={handleSaveThreat} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-zinc-400 block mb-1">Nome *</label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Aberração de Carne"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Elemento</label>
              <Select
                value={form.element}
                onChange={(e) =>
                  setForm({
                    ...form,
                    element: e.target.value as ParanormalElement,
                  })
                }
              >
                {ELEMENTS.map((el) => (
                  <option key={el} value={el}>
                    {el}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">VD</label>
              <Input
                type="number"
                value={form.vd}
                onChange={(e) =>
                  setForm({ ...form, vd: Number(e.target.value) || 0 })
                }
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">PV</label>
              <Input
                type="number"
                value={form.pv}
                onChange={(e) =>
                  setForm({ ...form, pv: Number(e.target.value) || 1 })
                }
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Defesa</label>
              <Input
                type="number"
                value={form.defense}
                onChange={(e) =>
                  setForm({ ...form, defense: Number(e.target.value) || 10 })
                }
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">
                Presença Perturb. DT
              </label>
              <Input
                type="number"
                value={form.disturbingPresence.dt}
                onChange={(e) =>
                  setForm({
                    ...form,
                    disturbingPresence: {
                      ...form.disturbingPresence,
                      dt: Number(e.target.value) || 10,
                    },
                  })
                }
                className="font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-zinc-400 block mb-1">
                Dano Mental da Presença
              </label>
              <Input
                value={form.disturbingPresence.damage}
                onChange={(e) =>
                  setForm({
                    ...form,
                    disturbingPresence: {
                      ...form.disturbingPresence,
                      damage: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {(["AGI", "FOR", "INT", "PRE", "VIG"] as const).map((k) => (
              <div key={k}>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1 text-center">
                  {k}
                </label>
                <Input
                  type="number"
                  value={form.attributes[k]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      attributes: {
                        ...form.attributes,
                        [k]: Number(e.target.value) || 0,
                      },
                    })
                  }
                  className="font-mono text-center"
                />
              </div>
            ))}
          </div>

          {/* First Attack Quick Editor */}
          {form.attacks[0] && (
            <div className="rounded-lg border border-[#242432] bg-[#0D0D14] p-3 space-y-2">
              <p className="text-xs font-semibold text-zinc-300">
                Ataque Principal
              </p>
              <div className="grid gap-2 sm:grid-cols-4">
                <Input
                  placeholder="Nome do ataque"
                  value={form.attacks[0].name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      attacks: [
                        { ...form.attacks[0], name: e.target.value },
                        ...form.attacks.slice(1),
                      ],
                    })
                  }
                  className="sm:col-span-2"
                />
                <Input
                  type="number"
                  placeholder="Bônus"
                  value={form.attacks[0].testBonus}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      attacks: [
                        {
                          ...form.attacks[0],
                          testBonus: Number(e.target.value) || 0,
                        },
                        ...form.attacks.slice(1),
                      ],
                    })
                  }
                  className="font-mono"
                />
                <Input
                  placeholder="Dano (ex: 2d8+4)"
                  value={form.attacks[0].damageFormula}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      attacks: [
                        { ...form.attacks[0], damageFormula: e.target.value },
                        ...form.attacks.slice(1),
                      ],
                    })
                  }
                  className="font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-zinc-400 block mb-1">
              Enigma de Medo (opcional)
            </label>
            <Textarea
              rows={2}
              value={form.enigmaOfFear ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  enigmaOfFear: e.target.value || undefined,
                })
              }
              placeholder="Condição para quebrar a imunidade / resolver o Enigma de Medo..."
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Descrição</label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditorOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Ameaça
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ficha Completa da Criatura */}
      <Modal
        open={Boolean(detailThreat)}
        onClose={() => setDetailThreatId(null)}
        title={
          detailThreat
            ? `${detailThreat.name} — VD ${detailThreat.vd} (${detailThreat.element})`
            : "Ficha da Criatura"
        }
        description={
          detailThreat
            ? `${detailThreat.type} • ${detailThreat.size} • Deslocamento ${detailThreat.displacement}`
            : undefined
        }
        maxWidth="max-w-3xl"
      >
        {detailThreat && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <SourceBadge source={detailThreat.source} />
                <span
                  className={cn(
                    "rounded border px-2 py-0.5 text-[11px] font-semibold uppercase",
                    ELEMENT_STYLES[detailThreat.element].badge
                  )}
                >
                  {detailThreat.element}
                </span>
                {detailThreat.secondaryElements?.map((sec) => (
                  <span
                    key={sec}
                    className={cn(
                      "rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                      ELEMENT_STYLES[sec].badge
                    )}
                  >
                    + {sec}
                  </span>
                ))}
                <Badge variant="default" className="font-mono">
                  VD {detailThreat.vd}
                </Badge>
              </div>
              <Button
                size="xs"
                variant="secondary"
                onClick={() => {
                  setTargetCampaignId(campaigns[0]?.id ?? "");
                  setSendModalThreat(detailThreat);
                }}
              >
                <Send className="h-3 w-3 text-purple-400" /> Enviar para Iniciativa
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 font-mono">
              <div className="rounded-md border border-white/10 bg-[#0D0D14] p-3">
                <span className="text-[10px] text-rose-400 flex items-center gap-1">
                  <Heart className="h-3 w-3" /> PV
                </span>
                <span className="text-xl font-bold text-zinc-100 tabular-nums">
                  {detailThreat.pv}
                </span>
              </div>
              <div className="rounded-md border border-white/10 bg-[#0D0D14] p-3">
                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> DEFESA
                </span>
                <span className="text-xl font-bold text-zinc-100 tabular-nums">
                  {detailThreat.defense}
                </span>
              </div>
              <div className="rounded-md border border-white/10 bg-[#0D0D14] p-3">
                <span className="text-[10px] text-amber-400 block">
                  PRESENÇA PERTURBADORA
                </span>
                <span className="text-xs font-bold text-zinc-100 block mt-1 tabular-nums">
                  DT {detailThreat.disturbingPresence.dt} •{" "}
                  {detailThreat.disturbingPresence.damage}
                  {detailThreat.disturbingPresence.nexImmunity
                    ? ` (Imune NEX ${detailThreat.disturbingPresence.nexImmunity}%+)`
                    : ""}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center font-mono">
              {(["AGI", "FOR", "INT", "PRE", "VIG"] as const).map((k) => (
                <div
                  key={k}
                  className="rounded-md border border-white/10 bg-[#0D0D14] py-2"
                >
                  <span className="text-[10px] text-zinc-500 block">{k}</span>
                  <span className="text-base font-bold text-zinc-100 tabular-nums">
                    {detailThreat.attributes[k]}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-white/10 bg-[#0D0D14] p-3 space-y-1.5 text-zinc-300">
              {detailThreat.senses && (
                <p>
                  <strong className="text-zinc-100">Sentidos:</strong>{" "}
                  {[
                    detailThreat.senses.percepcao
                      ? `Percepção ${detailThreat.senses.percepcao}`
                      : null,
                    detailThreat.senses.iniciativa
                      ? `Iniciativa ${detailThreat.senses.iniciativa}`
                      : null,
                    ...(detailThreat.senses.especiais ?? []),
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              )}
              <p>
                <strong className="text-zinc-100">
                  Testes de Resistência:
                </strong>{" "}
                {detailThreat.saveFormulas
                  ? `Fortitude ${detailThreat.saveFormulas.fortitude ?? `+${detailThreat.saves.fortitude}`} • Reflexos ${detailThreat.saveFormulas.reflexos ?? `+${detailThreat.saves.reflexos}`} • Vontade ${detailThreat.saveFormulas.vontade ?? `+${detailThreat.saves.vontade}`}`
                  : `Fortitude +${detailThreat.saves.fortitude} • Reflexos +${detailThreat.saves.reflexos} • Vontade +${detailThreat.saves.vontade}`}
              </p>
              {detailThreat.skills.length > 0 && (
                <p>
                  <strong className="text-zinc-100">Perícias:</strong>{" "}
                  {detailThreat.skills
                    .map(
                      (sk) =>
                        `${sk.name} ${sk.dice}d20${
                          sk.bonus > 0
                            ? `+${sk.bonus}`
                            : sk.bonus < 0
                            ? `${sk.bonus}`
                            : ""
                        }`
                    )
                    .join(" • ")}
                </p>
              )}
              {detailThreat.immunities && (
                <p>
                  <strong className="text-amber-300">Imunidades:</strong>{" "}
                  {detailThreat.immunities}
                </p>
              )}
              {detailThreat.resistances && (
                <p>
                  <strong className="text-zinc-100">
                    Resistências a Dano:
                  </strong>{" "}
                  {detailThreat.resistances}
                </p>
              )}
              {detailThreat.vulnerabilities && (
                <p>
                  <strong className="text-rose-300">Vulnerabilidades:</strong>{" "}
                  {detailThreat.vulnerabilities}
                </p>
              )}
            </div>

            {detailThreat.enigmaOfFear && (
              <div
                className={cn(
                  "rounded-lg border p-3 space-y-1.5",
                  detailThreat.enigmaResolved
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-sky-400/40 bg-sky-500/10"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-200">
                    Enigma de Medo
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleEnigma(detailThreat)}
                    className={cn(
                      "rounded border px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors",
                      detailThreat.enigmaResolved
                        ? "border-emerald-400 bg-emerald-600/30 text-emerald-100"
                        : "border-sky-400/50 bg-[#0D0D14] text-sky-200 hover:bg-sky-500/20"
                    )}
                  >
                    {detailThreat.enigmaResolved
                      ? "✓ Resolvido"
                      : "Marcar Resolvido"}
                  </button>
                </div>
                <p className="text-zinc-200 leading-relaxed">
                  {detailThreat.enigmaOfFear}
                </p>
              </div>
            )}

            {detailThreat.attacks.length > 0 && (
              <div className="space-y-2 border-t border-white/10 pt-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                  Ataques ({detailThreat.attacks.length}) — Clique para rolar
                </span>
                {detailThreat.attacks.map((atk) => (
                  <div
                    key={atk.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#0D0D14] p-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-zinc-100">
                          {atk.name}
                        </span>
                        {atk.actionType && (
                          <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-zinc-300">
                            {atk.actionType}
                          </span>
                        )}
                        {atk.range && (
                          <span className="font-mono text-[10px] text-zinc-400">
                            • {atk.range}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[11px] text-zinc-400">
                        {atk.diceCount}d20+{atk.testBonus} • {atk.damageFormula}{" "}
                        ({atk.damageType}) • Crít {atk.threatRange}/x
                        {atk.critMultiplier}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() =>
                          handleRollThreatAttack(detailThreat, atk)
                        }
                      >
                        <Dices className="h-3 w-3" /> Rolar Ataque
                      </Button>
                      <Button
                        size="xs"
                        variant="default"
                        onClick={() =>
                          handleRollThreatDamage(detailThreat, atk, false)
                        }
                      >
                        <Swords className="h-3 w-3 text-rose-400" /> Rolar Dano
                      </Button>
                      <Button
                        size="xs"
                        variant="danger"
                        onClick={() =>
                          handleRollThreatDamage(detailThreat, atk, true)
                        }
                      >
                        <Sparkles className="h-3 w-3" /> Crítico x
                        {atk.critMultiplier}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detailThreat.abilities.length > 0 && (
              <div className="space-y-2 border-t border-white/10 pt-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                  Habilidades ({detailThreat.abilities.length})
                </span>
                {detailThreat.abilities.map((ab) => (
                  <div
                    key={ab.id}
                    className="rounded-lg border border-white/10 bg-[#0D0D14] p-3 space-y-1"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-sm text-zinc-100">
                        {ab.name}
                      </strong>
                      {ab.actionType && (
                        <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-zinc-300">
                          {ab.actionType}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-300 leading-relaxed">
                      {ab.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
