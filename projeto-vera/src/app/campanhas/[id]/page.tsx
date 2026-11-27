"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpDown,
  BookOpen,
  Brain,
  Check,
  Dices,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Footprints,
  Heart,
  Play,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Trash2,
  Users,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import {
  calculateCombatStats,
  getAgentEffectiveVitals,
  rollOrdemTest,
} from "@/lib/ordem-rules";
import { OPTIONAL_RULES_LIST } from "@/data/optionalRules";
import {
  COMMUNITY_CONDITIONS,
  COMMUNITY_DISEASES_AND_POISONS,
  COMMUNITY_OPTIONAL_RULES,
  drawBaralhoInfinitoCard,
} from "@/data/supplements";
import { filterByEnabledSources } from "@/lib/sources";
import { SourceBadge } from "@/components/SourceToggles";
import { cn, ELEMENT_STYLES, generateId } from "@/lib/utils";
import type {
  Agent,
  InitiativeEntry,
  MembraneState,
  OptionalRuleId,
  OrganizationId,
  Threat,
} from "@/types/ordem";
import { ORGANIZATIONS, getOrganization } from "@/data/organizations";
import {
  SourceToggleGroup,
  setCommunityList,
  toggleSourceList,
} from "@/components/SourceToggles";
import { SpecialScenesPanel } from "@/components/campaign/SpecialScenesPanel";
import { DocumentStudio } from "@/components/documents/DocumentStudio";
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  NumericInput,
  Select,
  Textarea,
} from "@/components/ui/primitives";

type CampaignSceneTab =
  | "combate"
  | "investigacao"
  | "perseguicao"
  | "furtividade"
  | "documentos";

export default function EscudoDoMestrePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    campaigns,
    agents,
    threats,
    rollHistory,
    updateCampaign,
    updateAgent,
    pushRoll,
  } = useAppStore();

  const [manageAgentsOpen, setManageAgentsOpen] = useState(false);
  const [addCombatantOpen, setAddCombatantOpen] = useState(false);
  const [sceneTab, setSceneTab] = useState<CampaignSceneTab>("combate");
  const [selectedThreatId, setSelectedThreatId] = useState(threats[0]?.id ?? "");
  const [customName, setCustomName] = useState("");
  const [customInit, setCustomInit] = useState(12);
  const [customPv, setCustomPv] = useState(30);
  const [newClueTitle, setNewClueTitle] = useState("");
  const [newClueContent, setNewClueContent] = useState("");
  const [lastInfiniteCard, setLastInfiniteCard] = useState<{
    total: number;
    dice: [number, number];
    carta: string;
    efeito: string;
  } | null>(null);

  const handleRollBaralhoInfinito = () => {
    const drawn = drawBaralhoInfinitoCard();
    setLastInfiniteCard({
      total: drawn.total,
      dice: drawn.dice,
      carta: drawn.card.carta,
      efeito: drawn.card.efeito,
    });
    pushRoll({
      actorName: "Escudo do Mestre",
      campaignId: campaign?.id,
      label: `Baralho Infinito (2d12): ${drawn.card.carta}`,
      kind: "free",
      element: "Energia",
      formula: "2d12",
      diceRolled: drawn.dice,
      mode: "sum",
      bonus: 0,
      total: drawn.total,
      details: `[${drawn.card.valor}] ${drawn.card.carta} — ${drawn.card.efeito}`,
    });
  };

  const campaign = campaigns.find((c) => c.id === id);

  if (!campaign) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Card className="p-8 space-y-4">
          <h1 className="text-lg font-bold text-zinc-100">
            Campanha não encontrada
          </h1>
          <Link href="/campanhas">
            <Button variant="primary">Voltar para Campanhas</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const partyAgents = agents.filter((a) => campaign.agentIds.includes(a.id));

  const applyAgentStatDelta = (
    agent: Agent,
    stat: "pv" | "san" | "pe",
    delta: number
  ) => {
    const vitals = getAgentEffectiveVitals(agent);
    updateAgent(agent.id, (prev) => {
      const nextVal = Math.max(0, prev.status[stat].current + delta);
      return {
        ...prev,
        status: {
          ...prev.status,
          [stat]: { ...prev.status[stat], current: nextVal },
          machucado:
            stat === "pv"
              ? nextVal <= Math.floor(vitals.maxPv / 2)
              : prev.status.machucado,
          morrendo:
            stat === "pv" && nextVal === 0 ? true : prev.status.morrendo,
          enlouquecendo:
            stat === "san" && nextVal === 0 ? true : prev.status.enlouquecendo,
        },
      };
    });
    // Also mirror PV update inside initiative tracker if present
    if (stat === "pv") {
      updateCampaign(campaign.id, (prev) => ({
        ...prev,
        initiative: prev.initiative.map((entry) =>
          entry.type === "agent" && entry.refId === agent.id
            ? { ...entry, currentPv: Math.max(0, agent.status.pv.current + delta) }
            : entry
        ),
      }));
    }
  };

  const addAgentToInitiative = (agent: Agent) => {
    const initSkill = agent.skills.iniciativa;
    const attrVal = agent.attributes[initSkill?.attribute ?? "AGI"];
    const bonus = (initSkill?.training ?? 0) + (initSkill?.bonus ?? 0);
    const roll = rollOrdemTest({ attributeValue: attrVal, bonus });
    const vitals = getAgentEffectiveVitals(agent);
    const combat = calculateCombatStats(agent);

    pushRoll({
      actorName: agent.name,
      actorId: agent.id,
      campaignId: campaign.id,
      label: "Iniciativa",
      kind: "skill",
      formula: roll.formula,
      diceRolled: roll.diceRolled,
      chosenDie: roll.chosenDie,
      mode: roll.mode,
      bonus: roll.bonus,
      total: roll.total,
      isNat20: roll.isNat20,
      isNat1: roll.isNat1,
    });

    const entry: InitiativeEntry = {
      id: generateId("init"),
      type: "agent",
      refId: agent.id,
      name: agent.name,
      initiative: roll.total,
      currentPv: agent.status.pv.current,
      maxPv: vitals.maxPv,
      defense: combat.defense,
    };

    updateCampaign(campaign.id, (prev) => ({
      ...prev,
      initiative: [...prev.initiative, entry].sort(
        (a, b) => b.initiative - a.initiative
      ),
    }));
  };

  const addThreatToInitiative = (threat: Threat) => {
    const initSkill = threat.skills.find((s) =>
      s.name.toLowerCase().includes("iniciativa")
    );
    const roll = rollOrdemTest({
      attributeValue: initSkill?.dice ?? threat.attributes.AGI,
      bonus: initSkill?.bonus ?? 0,
    });

    pushRoll({
      actorName: threat.name,
      campaignId: campaign.id,
      label: "Iniciativa (Ameaça)",
      kind: "threat",
      element: threat.element,
      formula: roll.formula,
      diceRolled: roll.diceRolled,
      chosenDie: roll.chosenDie,
      mode: roll.mode,
      bonus: roll.bonus,
      total: roll.total,
      isNat20: roll.isNat20,
      isNat1: roll.isNat1,
    });

    const entry: InitiativeEntry = {
      id: generateId("init"),
      type: "threat",
      refId: threat.id,
      name: threat.name,
      initiative: roll.total,
      currentPv: threat.pv,
      maxPv: threat.pv,
      defense: threat.defense,
      element: threat.element,
    };

    updateCampaign(campaign.id, (prev) => ({
      ...prev,
      initiative: [...prev.initiative, entry].sort(
        (a, b) => b.initiative - a.initiative
      ),
    }));
  };

  const handleNextTurn = () => {
    if (campaign.initiative.length === 0) return;
    updateCampaign(campaign.id, (prev) => {
      const nextIndex = (prev.activeTurnIndex + 1) % prev.initiative.length;
      const wrapped = nextIndex === 0;
      return {
        ...prev,
        activeTurnIndex: nextIndex,
        round: wrapped ? prev.round + 1 : prev.round,
      };
    });
  };

  const handleSortInitiative = () => {
    updateCampaign(campaign.id, (prev) => ({
      ...prev,
      initiative: [...prev.initiative].sort((a, b) => b.initiative - a.initiative),
      activeTurnIndex: 0,
    }));
  };

  const handleResetCombat = () => {
    updateCampaign(campaign.id, (prev) => ({
      ...prev,
      round: 1,
      activeTurnIndex: 0,
    }));
  };

  const handleAddClue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClueTitle.trim()) return;
    updateCampaign(campaign.id, (prev) => ({
      ...prev,
      clues: [
        {
          id: generateId("clue"),
          title: newClueTitle.trim(),
          content: newClueContent.trim(),
          revealed: false,
        },
        ...prev.clues,
      ],
    }));
    setNewClueTitle("");
    setNewClueContent("");
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#22222A] pb-4">
        <div>
          <Link
            href="/campanhas"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#8E8E9E] hover:text-[#F4F4F5] mb-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Campanhas
          </Link>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Shield className="h-5 w-5 text-[#A1A1AA]" />
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#F4F4F5]">
              {campaign.name}
            </h1>
            <Badge variant="outline" className="font-mono">
              ESCUDO DO MESTRE
            </Badge>
          </div>
          {campaign.description && (
            <p className="text-xs text-[#8E8E9E] mt-1">{campaign.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRollBaralhoInfinito}
            title="Sacar carta aleatória do Baralho Infinito (2d12 — Grimório do Cataclisma)"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400" /> Baralho Infinito (2d12)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setManageAgentsOpen(true)}
          >
            <Users className="h-3.5 w-3.5" /> Gerenciar Agentes ({partyAgents.length})
          </Button>
          <Link href="/ameacas">
            <Button variant="secondary" size="sm">
              <Skull className="h-3.5 w-3.5 text-red-400" /> Bestiário
            </Button>
          </Link>
        </div>
      </div>

      {/* MEMBRANE STATE & CAMPAIGN RULES BAR */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Estado da Membrana */}
        <Card className="p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              Estado da Membrana
            </span>
            <Badge variant="purple" className="font-mono text-[10px]">
              {campaign.membraneState ?? "Estável"}
            </Badge>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {(
              [
                {
                  id: "Intacta" as MembraneState,
                  cls: "border-emerald-500/60 bg-emerald-500/15 text-emerald-200",
                },
                {
                  id: "Estável" as MembraneState,
                  cls: "border-sky-500/60 bg-sky-500/15 text-sky-200",
                },
                {
                  id: "Danificada" as MembraneState,
                  cls: "border-yellow-500/60 bg-yellow-500/15 text-yellow-200",
                },
                {
                  id: "Arruinada" as MembraneState,
                  cls: "border-orange-500/60 bg-orange-500/15 text-orange-200",
                },
                {
                  id: "Rompida" as MembraneState,
                  cls: "border-red-500/70 bg-red-600/20 text-red-200",
                },
              ] as const
            ).map((m) => {
              const active = (campaign.membraneState ?? "Estável") === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    updateCampaign(campaign.id, (prev) => ({
                      ...prev,
                      membraneState: m.id,
                    }))
                  }
                  className={cn(
                    "rounded-lg border py-1.5 text-[11px] font-medium transition-all",
                    active
                      ? m.cls
                      : "border-[#242432] bg-[#0D0D14] text-zinc-500 hover:text-zinc-200"
                  )}
                >
                  {m.id}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-zinc-400">
            {(campaign.membraneState ?? "Estável") === "Intacta" &&
              "Nenhuma manifestação paranormal espontânea; rituais sofrem restrições extremas."}
            {(campaign.membraneState ?? "Estável") === "Estável" &&
              "Condição normal da Realidade. Rituais e manifestações funcionam com regras padrão."}
            {(campaign.membraneState ?? "Estável") === "Danificada" &&
              "Criaturas de baixo VD podem emergir; névoa e anomalias sensoriais surgem na cena."}
            {(campaign.membraneState ?? "Estável") === "Arruinada" &&
              "Rituais ficam instáveis e criaturas poderosas se manifestam com facilidade (+2 DT paranormal)."}
            {(campaign.membraneState ?? "Estável") === "Rompida" &&
              "O Outro Lado invade a Realidade! A física colapsa, Medo puro permeia o local e entidades se fortalecem."}
          </p>
        </Card>

        {/* Livros & Regras Opcionais */}
        <Card className="p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-300">
            <BookOpen className="h-3.5 w-3.5 text-purple-400" />
            Livros & Regras Opcionais da Campanha
          </div>
          <SourceToggleGroup
            compact
            enabled={
              campaign.enabledSources ?? [
                "livro_basico",
                "sobrevivendo_ao_horror",
                "homebrew",
              ]
            }
            onToggle={(src) =>
              updateCampaign(campaign.id, (prev) => ({
                ...prev,
                enabledSources: toggleSourceList(
                  prev.enabledSources ?? [
                    "livro_basico",
                    "sobrevivendo_ao_horror",
                    "homebrew",
                  ],
                  src
                ),
              }))
            }
            onSetCommunity={(on) =>
              updateCampaign(campaign.id, (prev) => ({
                ...prev,
                enabledSources: setCommunityList(
                  prev.enabledSources ?? [
                    "livro_basico",
                    "sobrevivendo_ao_horror",
                    "homebrew",
                  ],
                  on
                ),
              }))
            }
          />

          <div className="space-y-1.5 border-t border-[#20202C] pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E]">
                Organização da Realidade
              </span>
              <select
                value={getOrganization(campaign.organization).id}
                onChange={(e) =>
                  updateCampaign(campaign.id, (prev) => ({
                    ...prev,
                    organization: e.target.value as OrganizationId,
                  }))
                }
                className="h-7 rounded-sm border border-[#22222A] bg-[#09090B] px-2 text-xs text-[#F4F4F5] focus:outline-none"
              >
                {ORGANIZATIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              {getOrganization(campaign.organization).id !== "ordo_realitas" && (
                <SourceBadge source="misterios_do_outro_lado" />
              )}
            </div>
            {(() => {
              const org = getOrganization(campaign.organization);
              return (
                <div className="rounded-sm border border-[#22222A] bg-[#0D0D14] px-2.5 py-2 text-[11px] space-y-1">
                  <p className="text-zinc-200">
                    <strong className="font-mono text-[10px] uppercase tracking-wider text-purple-300">
                      {org.abilityName}:
                    </strong>{" "}
                    <span className="text-zinc-300">{org.abilityDescription}</span>
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    <strong className="text-zinc-300">Equipamentos:</strong>{" "}
                    {org.equipmentRules} ·{" "}
                    <strong className="text-zinc-300">Crédito:</strong>{" "}
                    {org.creditRules}
                  </p>
                </div>
              );
            })()}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#20202C] max-h-24 overflow-y-auto">
            {[
              ...OPTIONAL_RULES_LIST,
              ...filterByEnabledSources(
                COMMUNITY_OPTIONAL_RULES,
                campaign.enabledSources
              ),
            ].map((rule) => {
              const active = (campaign.optionalRules ?? []).includes(rule.id);
              return (
                <button
                  key={rule.id}
                  type="button"
                  title={`${rule.summary} (${rule.mechanicalEffect})`}
                  onClick={() =>
                    updateCampaign(campaign.id, (prev) => {
                      const cur = prev.optionalRules ?? [];
                      return {
                        ...prev,
                        optionalRules: cur.includes(rule.id)
                          ? cur.filter((x) => x !== rule.id)
                          : [...cur, rule.id as OptionalRuleId],
                      };
                    })
                  }
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
                    active
                      ? "border-amber-500/60 bg-amber-500/15 text-amber-200"
                      : "border-[#242432] bg-[#0D0D14] text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <span>
                    {active ? "● " : "○ "}
                    {rule.name}
                  </span>
                  <SourceBadge source={rule.source} />
                </button>
              );
            })}
          </div>

          {lastInfiniteCard && (
            <div className="rounded-sm border border-purple-500/40 bg-purple-950/20 px-3 py-2 text-xs space-y-0.5">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-purple-300">
                  Baralho Infinito (2d12): {lastInfiniteCard.carta}
                </span>
                <span className="text-zinc-400">
                  [{lastInfiniteCard.dice.join("+")}] ={" "}
                  <strong className="text-zinc-100">
                    {lastInfiniteCard.total}
                  </strong>
                </span>
              </div>
              <p className="text-[11px] text-zinc-200">
                {lastInfiniteCard.efeito}
              </p>
            </div>
          )}

          {(campaign.optionalRules ?? []).length > 0 && (
            <div className="space-y-1 border-t border-[#20202C] pt-2 max-h-28 overflow-y-auto">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#8E8E9E] block">
                Referência Rápida das Regras Ativas ({(campaign.optionalRules ?? []).length})
              </span>
              {[
                ...OPTIONAL_RULES_LIST,
                ...COMMUNITY_OPTIONAL_RULES,
              ]
                .filter((r) => (campaign.optionalRules ?? []).includes(r.id))
                .map((r) => (
                  <p
                    key={r.id}
                    className="text-[11px] text-zinc-300 leading-snug"
                  >
                    <strong className="text-amber-300 font-mono text-[10px]">
                      {r.name}:
                    </strong>{" "}
                    {r.summary}
                  </p>
                ))}
            </div>
          )}
        </Card>
      </div>

      {/* SECTION 1: PARTY AGENTS GRID */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Equipe em Campo ({partyAgents.length})
          </h2>
          <span className="text-[11px] text-zinc-500">
            Aplique dano ou cura de PV/SAN diretamente nos cards
          </span>
        </div>

        {partyAgents.length === 0 ? (
          <Card className="p-6 text-center border-dashed text-xs text-zinc-500">
            Nenhum agente vinculado a esta campanha. Clique em &ldquo;Gerenciar Agentes&rdquo; acima.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {partyAgents.map((ag) => {
              const vitals = getAgentEffectiveVitals(ag);
              const combat = calculateCombatStats(ag);
              const pvPct = Math.min(100, (ag.status.pv.current / Math.max(1, vitals.maxPv)) * 100);
              const sanPct = Math.min(100, (ag.status.san.current / Math.max(1, vitals.maxSan)) * 100);
              const pePct = Math.min(100, (ag.status.pe.current / Math.max(1, vitals.maxPe)) * 100);

              return (
                <Card key={ag.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/agente/${ag.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-100 hover:text-purple-300 truncate"
                      >
                        {ag.name}
                        <ExternalLink className="h-3 w-3 shrink-0 text-zinc-500" />
                      </Link>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        NEX {ag.nex}% • DEF {combat.defense} • ESQ {combat.dodge} • RD {combat.blockRd}
                      </p>
                    </div>
                    <Button
                      size="xs"
                      variant="ghost"
                      title="Rolar iniciativa e adicionar ao combate"
                      onClick={() => addAgentToInitiative(ag)}
                    >
                      <Dices className="h-3.5 w-3.5 text-purple-400" />
                    </Button>
                  </div>

                  {/* Status Alerts */}
                  {(ag.status.machucado || ag.status.morrendo || ag.status.enlouquecendo) && (
                    <div className="flex flex-wrap gap-1">
                      {ag.status.machucado && <Badge variant="warning">Machucado</Badge>}
                      {ag.status.morrendo && <Badge variant="danger">Morrendo</Badge>}
                      {ag.status.enlouquecendo && <Badge variant="purple">Enlouquecendo</Badge>}
                    </div>
                  )}

                  {/* PV Control */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="inline-flex items-center gap-1 text-red-400">
                        <Heart className="h-3 w-3" /> PV
                      </span>
                      <span className="font-bold text-zinc-100">
                        {ag.status.pv.current}/{vitals.maxPv}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#181824] overflow-hidden">
                      <div className="h-full bg-red-500 transition-all" style={{ width: `${pvPct}%` }} />
                    </div>
                    <div className="grid grid-cols-5 gap-1 pt-0.5">
                      {[-10, -5, -1, 1, 5].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => applyAgentStatDelta(ag, "pv", d)}
                          className="rounded border border-[#242432] bg-[#0D0D14] py-0.5 font-mono text-[10px] text-zinc-300 hover:bg-[#1C1C2A]"
                        >
                          {d > 0 ? `+${d}` : d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SAN Control */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="inline-flex items-center gap-1 text-sky-400">
                        <Brain className="h-3 w-3" /> SAN
                      </span>
                      <span className="font-bold text-zinc-100">
                        {ag.status.san.current}/{vitals.maxSan}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#181824] overflow-hidden">
                      <div className="h-full bg-sky-500 transition-all" style={{ width: `${sanPct}%` }} />
                    </div>
                    <div className="grid grid-cols-4 gap-1 pt-0.5">
                      {[-5, -1, 1, 5].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => applyAgentStatDelta(ag, "san", d)}
                          className="rounded border border-[#242432] bg-[#0D0D14] py-0.5 font-mono text-[10px] text-zinc-300 hover:bg-[#1C1C2A]"
                        >
                          {d > 0 ? `+${d}` : d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PE Summary */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-yellow-400">PE (Lim. {vitals.peLimit})</span>
                      <span className="font-semibold text-zinc-200">
                        {ag.status.pe.current}/{vitals.maxPe}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#181824] overflow-hidden">
                      <div className="h-full bg-yellow-500 transition-all" style={{ width: `${pePct}%` }} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: SCENE CONTROLLER TABS (Combate | Investigação | Perseguição | Furtividade | Documentos) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#22222A] pb-2 vera-no-print">
          {(
            [
              { id: "combate" as const, label: "Combate", icon: Swords },
              {
                id: "investigacao" as const,
                label: "Investigação",
                icon: Search,
              },
              {
                id: "perseguicao" as const,
                label: "Perseguição",
                icon: Footprints,
              },
              {
                id: "furtividade" as const,
                label: "Furtividade",
                icon: EyeOff,
              },
              {
                id: "documentos" as const,
                label: "Documentos & Pistas",
                icon: FileText,
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = sceneTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSceneTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-sm border px-3 py-2 font-mono text-xs font-medium transition-colors",
                  active
                    ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                    : "border-[#22222A] bg-[#101014] text-[#8E8E9E] hover:border-[#32323E] hover:text-[#D4D4D8]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {sceneTab === "documentos" ? (
          <DocumentStudio fixedCampaignId={campaign.id} />
        ) : sceneTab !== "combate" ? (
          <div className="grid gap-4 lg:grid-cols-12 items-start">
            <div className="lg:col-span-8">
              <SpecialScenesPanel
                campaign={campaign}
                partyAgents={partyAgents}
                threats={threats}
                activeSceneTab={sceneTab}
              />
            </div>

            {/* Live Session Roll Feed (4 cols alongside Special Scenes) */}
            <Card className="lg:col-span-4 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#22222A] pb-3">
                <div className="flex items-center gap-2">
                  <Dices className="h-4 w-4 text-amber-400" />
                  <h2 className="text-sm font-semibold text-[#F4F4F5]">
                    Feed de Rolagens
                  </h2>
                </div>
                <span className="font-mono text-[11px] text-[#8E8E9E]">
                  {rollHistory.length}
                </span>
              </div>

              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {rollHistory.length === 0 ? (
                  <p className="text-xs text-[#8E8E9E] text-center py-8">
                    Eventos de cena, Busca Obstinada e testes aparecerão aqui em
                    tempo real.
                  </p>
                ) : (
                  rollHistory.slice(0, 25).map((r) => (
                    <div
                      key={r.id}
                      className="rounded-sm border border-[#22222A] bg-[#0B0B0F] p-2.5 text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-[#D4D4D8] truncate">
                          {r.actorName}
                        </span>
                        <span className="font-mono text-sm font-bold text-[#F4F4F5] tabular-nums">
                          {r.total}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A1A1AA] truncate">
                        {r.label}
                      </p>
                      {r.details && (
                        <p className="text-[10px] text-[#8E8E9E] leading-snug">
                          {r.details}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        ) : (
      <div className="grid gap-4 lg:grid-cols-12 items-start">
        {/* Initiative Tracker (5 cols) */}
        <Card className="lg:col-span-5 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#242432] pb-3">
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-red-400" />
              <h2 className="text-sm font-semibold text-zinc-100">
                Rastreador de Iniciativa
              </h2>
              <Badge variant="purple" className="font-mono">
                Rodada {campaign.round}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="xs" variant="outline" onClick={handleSortInitiative} title="Ordenar por iniciativa">
                <ArrowUpDown className="h-3 w-3" /> Ordenar
              </Button>
              <Button size="xs" variant="outline" onClick={handleResetCombat} title="Reiniciar rodadas">
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button size="xs" variant="primary" onClick={() => setAddCombatantOpen(true)}>
                <Plus className="h-3 w-3" /> Combatente
              </Button>
            </div>
          </div>

          {campaign.initiative.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#242432] p-6 text-center text-xs text-zinc-500">
              Nenhum combatente na ordem. Adicione agentes ou ameaças para iniciar o combate.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {campaign.initiative.map((entry, idx) => {
                  const isActive = idx === campaign.activeTurnIndex;
                  const elemStyle = entry.element ? ELEMENT_STYLES[entry.element] : null;
                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        "rounded-md border p-3 transition-colors",
                        isActive
                          ? "border-[#F4F4F5] border-l-[3px] bg-[#16161C]"
                          : "border-[#22222A] bg-[#0D0D11]"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <NumericInput
                            value={entry.initiative}
                            onValueChange={(val) =>
                              updateCampaign(campaign.id, (prev) => ({
                                ...prev,
                                initiative: prev.initiative.map((x) =>
                                  x.id === entry.id
                                    ? { ...x, initiative: val }
                                    : x
                                ),
                              }))
                            }
                            aria-label={`Iniciativa de ${entry.name}`}
                            className="h-8 w-12 rounded-sm border border-[#22222A] bg-[#141419] text-center font-mono text-sm font-bold text-[#F4F4F5] tabular-nums"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isActive && (
                                <span className="h-2 w-2 rounded-full bg-[#F4F4F5]" />
                              )}
                              <span className="text-sm font-semibold text-zinc-100 truncate">
                                {entry.name}
                              </span>
                              {entry.type === "threat" && elemStyle && (
                                <span
                                  className={cn(
                                    "rounded border px-1.5 py-0.2 text-[10px]",
                                    elemStyle.badge
                                  )}
                                >
                                  {entry.element}
                                </span>
                              )}
                              {entry.defense !== undefined && (
                                <span className="font-mono text-[10px] text-zinc-400">
                                  DEF {entry.defense}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            updateCampaign(campaign.id, (prev) => {
                              const next = prev.initiative.filter(
                                (x) => x.id !== entry.id
                              );
                              return {
                                ...prev,
                                initiative: next,
                                activeTurnIndex: Math.min(
                                  prev.activeTurnIndex,
                                  Math.max(0, next.length - 1)
                                ),
                              };
                            })
                          }
                          className="rounded p-1 text-zinc-500 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Enemy / Combatant HP Bar & quick controls */}
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <Heart className="h-3 w-3 text-red-400" />
                          <span className="font-bold text-zinc-100">
                            {entry.currentPv}/{entry.maxPv}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[-10, -5, -1, 1, 5].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() =>
                                updateCampaign(campaign.id, (prev) => ({
                                  ...prev,
                                  initiative: prev.initiative.map((x) =>
                                    x.id === entry.id
                                      ? {
                                          ...x,
                                          currentPv: Math.max(0, x.currentPv + d),
                                        }
                                      : x
                                  ),
                                }))
                              }
                              className="rounded border border-[#242432] bg-[#14141F] px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 hover:bg-[#1F1F2E]"
                            >
                              {d > 0 ? `+${d}` : d}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button variant="primary" className="w-full" onClick={handleNextTurn}>
                <Play className="h-4 w-4" /> Próximo Turno
              </Button>
            </>
          )}
        </Card>

        {/* Live Session Roll Feed (3 cols) */}
        <Card className="lg:col-span-3 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#242432] pb-3">
            <div className="flex items-center gap-2">
              <Dices className="h-4 w-4 text-yellow-400" />
              <h2 className="text-sm font-semibold text-zinc-100">
                Feed de Rolagens
              </h2>
            </div>
            <span className="font-mono text-[11px] text-zinc-500">
              {rollHistory.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {rollHistory.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-8">
                As rolagens dos agentes e ameaças aparecerão aqui em tempo real.
              </p>
            ) : (
              rollHistory.slice(0, 25).map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    "rounded-lg border p-2.5 text-xs",
                    r.isNat20 || r.isCriticalThreat
                      ? "border-yellow-500/50 bg-yellow-500/10"
                      : r.isNat1
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-[#222230] bg-[#0D0D14]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-zinc-300 truncate">
                      {r.actorName}
                    </span>
                    <span className="font-mono text-base font-bold text-zinc-50">
                      {r.total}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {r.label}
                  </p>
                  {r.diceRolled.length > 0 && (
                    <p className="font-mono text-[10px] text-zinc-500 mt-1">
                      [{r.diceRolled.join(", ")}] {r.formula}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* GM Notes & Clues (4 cols) */}
        <Card className="lg:col-span-4 p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#242432] pb-3">
            <FileText className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Anotações & Pistas do Mestre
            </h2>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
              Bloco Secreto da Sessão
            </label>
            <Textarea
              rows={6}
              value={campaign.gmNotes}
              onChange={(e) =>
                updateCampaign(campaign.id, (prev) => ({
                  ...prev,
                  gmNotes: e.target.value,
                }))
              }
              placeholder="Anotações de cenas, NPCs, DTs de investigação, reviravoltas..."
            />
          </div>

          <div className="space-y-2.5 border-t border-[#20202C] pt-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
              Pistas da Investigação ({campaign.clues.length})
            </span>

            <form onSubmit={handleAddClue} className="space-y-2">
              <Input
                value={newClueTitle}
                onChange={(e) => setNewClueTitle(e.target.value)}
                placeholder="Título da pista (ex: Diário do Subsolo)"
                className="h-8 text-xs"
              />
              <div className="flex gap-1.5">
                <Input
                  value={newClueContent}
                  onChange={(e) => setNewClueContent(e.target.value)}
                  placeholder="Detalhe / onde encontrar..."
                  className="h-8 text-xs"
                />
                <Button type="submit" size="sm" variant="primary">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {campaign.clues.map((clue) => (
                <div
                  key={clue.id}
                  className={cn(
                    "rounded-lg border p-2.5 text-xs",
                    clue.revealed
                      ? "border-emerald-500/35 bg-emerald-500/5"
                      : "border-[#242432] bg-[#0D0D14]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-zinc-100">{clue.title}</p>
                      {clue.content && (
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {clue.content}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          updateCampaign(campaign.id, (prev) => ({
                            ...prev,
                            clues: prev.clues.map((c) =>
                              c.id === clue.id
                                ? { ...c, revealed: !c.revealed }
                                : c
                            ),
                          }))
                        }
                        title={
                          clue.revealed
                            ? "Pista revelada aos jogadores"
                            : "Pista oculta"
                        }
                        className={cn(
                          "rounded p-1 border text-[10px]",
                          clue.revealed
                            ? "border-emerald-500/40 text-emerald-300"
                            : "border-[#2C2C3E] text-zinc-500"
                        )}
                      >
                        {clue.revealed ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateCampaign(campaign.id, (prev) => ({
                            ...prev,
                            clues: prev.clues.filter((c) => c.id !== clue.id),
                          }))
                        }
                        className="rounded p-1 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Reference: Doenças, Venenos & Condições (Arquivos Secretos #3 e #6) */}
          <div className="space-y-2 border-t border-[#20202C] pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Consulta Rápida — Doenças, Venenos & Condições (
                {COMMUNITY_DISEASES_AND_POISONS.length})
              </span>
              <SourceBadge source="arquivos_secretos" />
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {COMMUNITY_DISEASES_AND_POISONS.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-sm border border-[#22222A] bg-[#0D0D14] p-2 text-xs space-y-0.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-100">
                      {entry.name}
                    </span>
                    <span className="font-mono text-[10px] text-amber-300">
                      {entry.kind} · {entry.resistance}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-snug">
                    {entry.stagesOrEffect}
                  </p>
                </div>
              ))}

              {filterByEnabledSources(
                COMMUNITY_CONDITIONS,
                campaign.enabledSources
              ).map((cond) => (
                <div
                  key={cond.id}
                  className="rounded-sm border border-[#22222A] bg-[#0B0B10] p-2 text-xs space-y-0.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-100">
                      Condição: {cond.name}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">
                      {cond.kind}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {cond.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
        )}
      </div>

      {/* Modal: Manage Participating Agents */}
      <Modal
        open={manageAgentsOpen}
        onClose={() => setManageAgentsOpen(false)}
        title="Gerenciar Agentes da Campanha"
      >
        <div className="space-y-2">
          {agents.length === 0 ? (
            <p className="text-xs text-zinc-400">
              Nenhum agente cadastrado no aplicativo ainda.
            </p>
          ) : (
            agents.map((ag) => {
              const inCamp = campaign.agentIds.includes(ag.id);
              return (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() =>
                    updateCampaign(campaign.id, (prev) => ({
                      ...prev,
                      agentIds: inCamp
                        ? prev.agentIds.filter((x) => x !== ag.id)
                        : [...prev.agentIds, ag.id],
                    }))
                  }
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm border px-3.5 py-2.5 text-left text-xs transition-colors",
                    inCamp
                      ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                      : "border-[#22222A] bg-[#0D0D11] text-[#8E8E9E] hover:text-[#D4D4D8]"
                  )}
                >
                  <div>
                    <p className="font-semibold text-sm">{ag.name}</p>
                    <p className="text-[11px] text-[#8E8E9E]">
                      Jogador: {ag.player} · NEX {ag.nex}%
                    </p>
                  </div>
                  {inCamp && <Check className="h-4 w-4 text-[#F4F4F5]" />}
                </button>
              );
            })
          )}
        </div>
      </Modal>

      {/* Modal: Add Combatant to Initiative */}
      <Modal
        open={addCombatantOpen}
        onClose={() => setAddCombatantOpen(false)}
        title="Adicionar ao Rastreador de Iniciativa"
        description="Adicione agentes da equipe, ameaças do Bestiário ou um combatente avulso."
      >
        <div className="space-y-5">
          {/* Party agents quick-add */}
          {partyAgents.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Agentes da Campanha (rola Iniciativa automático)
              </p>
              <div className="flex flex-wrap gap-2">
                {partyAgents.map((ag) => (
                  <Button
                    key={ag.id}
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      addAgentToInitiative(ag);
                      setAddCombatantOpen(false);
                    }}
                  >
                    <Dices className="h-3.5 w-3.5 text-purple-400" /> {ag.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Threats quick-add */}
          {threats.length > 0 && (
            <div className="space-y-2 border-t border-[#242432] pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Ameaças do Bestiário
              </p>
              <div className="flex gap-2">
                <Select
                  value={selectedThreatId}
                  onChange={(e) => setSelectedThreatId(e.target.value)}
                >
                  {threats.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (VD {t.vd} • {t.element} • {t.pv} PV)
                    </option>
                  ))}
                </Select>
                <Button
                  variant="primary"
                  onClick={() => {
                    const th = threats.find((t) => t.id === selectedThreatId);
                    if (th) {
                      addThreatToInitiative(th);
                      setAddCombatantOpen(false);
                    }
                  }}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          )}

          {/* Custom combatant */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!customName.trim()) return;
              const entry: InitiativeEntry = {
                id: generateId("init"),
                type: "custom",
                name: customName.trim(),
                initiative: customInit,
                currentPv: customPv,
                maxPv: customPv,
              };
              updateCampaign(campaign.id, (prev) => ({
                ...prev,
                initiative: [...prev.initiative, entry].sort(
                  (a, b) => b.initiative - a.initiative
                ),
              }));
              setCustomName("");
              setAddCombatantOpen(false);
            }}
            className="space-y-3 border-t border-[#242432] pt-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              NPC / Combatente Customizado
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3 sm:col-span-1">
                <Input
                  placeholder="Nome (ex: Cultista)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>
              <Input
                type="number"
                placeholder="Iniciativa"
                value={customInit}
                onChange={(e) => setCustomInit(Number(e.target.value) || 0)}
                className="font-mono"
              />
              <Input
                type="number"
                placeholder="PV"
                value={customPv}
                onChange={(e) => setCustomPv(Number(e.target.value) || 1)}
                className="font-mono"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="default" size="sm">
                <Plus className="h-3.5 w-3.5" /> Adicionar Avulso
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
