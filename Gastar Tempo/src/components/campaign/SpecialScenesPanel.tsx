"use client";

import React, { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Check,
  Dices,
  Eye,
  EyeOff,
  Footprints,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserPlus,
  Zap,
} from "lucide-react";
import type {
  Agent,
  Campaign,
  ChaseParticipantState,
  SceneTrackerState,
  Threat,
} from "@/types/ordem";
import {
  CHASE_OBSTACLES,
  CHASE_QUICK_ACTIONS,
  CHASE_SHORTCUTS,
  INVESTIGATION_EVENTS_2D6,
  INVESTIGATION_URGENCY_PRESETS,
  lookupStealthEvent,
  mapD10ToAttribute,
  type ChaseEventItem,
  type StealthEventDef,
} from "@/data/scenes";
import {
  getAgentEffectiveVitals,
  rollDiceFormula,
  rollExtraEffortDamage,
  rollObstinateSearch,
} from "@/lib/ordem-rules";
import { cn, generateId } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import {
  Badge,
  Button,
  Card,
  Input,
  NumericInput,
  Select,
} from "@/components/ui/primitives";

const DEFAULT_SCENE: SceneTrackerState = {
  mode: "combate",
  investigationUrgencyRound: 1,
  investigationMaxRounds: 4,
  investigationTimeoutEvent: "",
  investigationFailures: 0,
  investigationRolledEvents: [],
  investigationObstinateCounts: {},
  investigationSuccessAnyCostAgents: [],
  stealthVisibility: 0,
  stealthGroupMode: false,
  stealthAgentVisibility: {},
  chaseRole: "presas",
  chaseBaseDt: 15,
  chaseTargetSuccesses: 3,
  chaseTargetFailures: 3,
  chaseSuccesses: 0,
  chaseFailures: 0,
  chaseParticipants: [],
  interludeActionsDone: [],
};

export function getCampaignScene(campaign: Campaign): SceneTrackerState {
  return {
    ...DEFAULT_SCENE,
    ...(campaign.scene ?? {}),
  };
}

export function SpecialScenesPanel({
  campaign,
  partyAgents,
  threats,
  activeSceneTab,
}: {
  campaign: Campaign;
  partyAgents: Agent[];
  threats: Threat[];
  activeSceneTab: "investigacao" | "perseguicao" | "furtividade";
}) {
  const { updateCampaign, updateAgent, pushRoll } = useAppStore();
  const scene = getCampaignScene(campaign);

  // Local rolled event previews
  const [lastInvEvent, setLastInvEvent] = useState<{
    roll: number;
    dice: number[];
    title: string;
    effect: string;
    repeated: boolean;
    targetAgentName?: string;
    attributeHurt?: string;
  } | null>(null);

  const [lastChaseEvent, setLastChaseEvent] = useState<{
    d20?: number;
    kind: "sem_evento" | "obstaculo" | "atalho";
    item?: ChaseEventItem;
  } | null>(null);

  const [lastStealthEvent, setLastStealthEvent] = useState<{
    d20: number;
    def: StealthEventDef;
    targetAgentId?: string;
    targetAgentName?: string;
    applied: boolean;
    mentalRoll?: number;
  } | null>(null);

  const [customChaseName, setCustomChaseName] = useState("");
  const [selectedChaseThreatId, setSelectedChaseThreatId] = useState(
    threats[0]?.id ?? ""
  );
  const [drawAttentionHelpTarget, setDrawAttentionHelpTarget] = useState<
    Record<string, string>
  >({});

  const updateScene = (
    updater: (prev: SceneTrackerState) => SceneTrackerState
  ) => {
    updateCampaign(campaign.id, (prev) => ({
      ...prev,
      scene: updater(getCampaignScene(prev)),
    }));
  };

  /* ==========================================================================
   * A. INVESTIGAÇÃO
   * ========================================================================== */
  const handleRollInvestigationEvent = () => {
    const roll = rollDiceFormula({ formula: "2d6" });
    const sum = roll.total;
    const def = INVESTIGATION_EVENTS_2D6[sum] ?? INVESTIGATION_EVENTS_2D6[7];
    const rolledBefore = (scene.investigationRolledEvents ?? []).includes(sum);
    const isRepeat = !def.isNoEvent && rolledBefore;

    let targetAgentName: string | undefined;
    let attributeHurt: string | undefined;

    if (!isRepeat) {
      if (def.picksRandomAgent && partyAgents.length > 0) {
        const picked =
          partyAgents[Math.floor(Math.random() * partyAgents.length)];
        targetAgentName = picked.name;
      }
      if (def.rollsRandomAttribute) {
        const d10 = Math.floor(Math.random() * 10) + 1;
        attributeHurt = `${mapD10ToAttribute(d10)} (1d10=${d10})`;
      }
      if (!def.isNoEvent) {
        updateScene((s) => ({
          ...s,
          investigationRolledEvents: [
            ...(s.investigationRolledEvents ?? []),
            sum,
          ],
        }));
      }
    }

    const finalTitle = isRepeat ? `Sem Evento (${def.title} já sorteado)` : def.title;
    const finalEffect = isRepeat
      ? "Este evento já ocorreu nesta cena de investigação — considere Sem Evento."
      : `${def.effect}${
          targetAgentName ? ` | Alvo sorteado: ${targetAgentName}` : ""
        }${attributeHurt ? ` | Atributo afetado: ${attributeHurt}` : ""}`;

    setLastInvEvent({
      roll: sum,
      dice: roll.diceRolled,
      title: finalTitle,
      effect: finalEffect,
      repeated: isRepeat,
      targetAgentName,
      attributeHurt,
    });

    pushRoll({
      actorName: campaign.name,
      campaignId: campaign.id,
      label: `Evento de Investigação: ${finalTitle}`,
      kind: "free",
      formula: "2d6 (Tabela de Investigação)",
      diceRolled: roll.diceRolled,
      mode: "sum",
      bonus: 0,
      total: sum,
      details: finalEffect,
    });
  };

  const handleRecordFailure = () => {
    updateScene((s) => {
      const nextFails = (s.investigationFailures ?? 0) + 1;
      const hitThreshold = nextFails % 3 === 0;
      return {
        ...s,
        investigationFailures: nextFails,
        investigationMaxRounds: hitThreshold
          ? Math.max(1, s.investigationMaxRounds - 1)
          : s.investigationMaxRounds,
      };
    });
  };

  const handleObstinateSearch = (agent: Agent) => {
    const currentCount = scene.investigationObstinateCounts?.[agent.id] ?? 0;
    const nextCount = currentCount + 1;
    const res = rollObstinateSearch(nextCount);
    const vitals = getAgentEffectiveVitals(agent);

    updateScene((s) => ({
      ...s,
      investigationObstinateCounts: {
        ...(s.investigationObstinateCounts ?? {}),
        [agent.id]: nextCount,
      },
    }));

    updateAgent(agent.id, (prev) => {
      const eff = getAgentEffectiveVitals(prev);
      if (eff.usingPd) {
        const curPd = prev.status.pd ?? {
          current: eff.maxPd,
          temp: 0,
          maxOverride: null,
          autoCalc: true,
        };
        return {
          ...prev,
          status: {
            ...prev.status,
            pd: {
              ...curPd,
              current: Math.max(0, curPd.current - res.sanLoss),
            },
          },
        };
      }
      const nextSan = Math.max(0, prev.status.san.current - res.sanLoss);
      return {
        ...prev,
        status: {
          ...prev.status,
          san: { ...prev.status.san, current: nextSan },
          perturbado: nextSan <= Math.floor(eff.maxSan / 2),
          enlouquecendo: nextSan === 0 ? true : prev.status.enlouquecendo,
        },
      };
    });

    pushRoll({
      actorName: agent.name,
      actorId: agent.id,
      campaignId: campaign.id,
      label: `Busca Obstinada (${nextCount}ª vez) — +1d20 em procurar pistas`,
      kind: "free",
      formula: `${res.formula} dano ${vitals.usingPd ? "PD" : "SAN"}`,
      diceRolled: res.diceRolled,
      mode: "sum",
      bonus: 0,
      total: res.sanLoss,
      details: `${agent.name} recebe +1d20 no teste de procurar pistas e perde ${res.sanLoss} ${
        vitals.usingPd ? "PD" : "SAN"
      }.`,
    });
  };

  const handleSuccessAnyCost = (agent: Agent) => {
    const vitals = getAgentEffectiveVitals(agent);
    const penalty = vitals.peLimit;
    updateAgent(agent.id, (prev) => {
      const nextPen = (prev.missionPeMaxPenalty ?? 0) + penalty;
      const nextVitals = getAgentEffectiveVitals({
        ...prev,
        missionPeMaxPenalty: nextPen,
      });
      return {
        ...prev,
        missionPeMaxPenalty: nextPen,
        status: {
          ...prev.status,
          pe: {
            ...prev.status.pe,
            current: Math.min(prev.status.pe.current, nextVitals.maxPe),
          },
        },
      };
    });

    pushRoll({
      actorName: agent.name,
      actorId: agent.id,
      campaignId: campaign.id,
      label: "Sucesso a Qualquer Custo",
      kind: "ability",
      formula: `-${penalty} ${vitals.usingPd ? "PD" : "PE"} máx. até o fim da missão`,
      diceRolled: [],
      bonus: 0,
      total: penalty,
      details: `${agent.name} garantiu sucesso na pista reduzindo seu máximo de ${
        vitals.usingPd ? "PD" : "PE"
      } em ${penalty} até o fim da missão.`,
    });
  };

  /* ==========================================================================
   * B. PERSEGUIÇÃO
   * ========================================================================== */
  const chaseParticipants = scene.chaseParticipants ?? [];
  const chaseRole = scene.chaseRole ?? "presas";
  const targetSucc = Math.max(1, scene.chaseTargetSuccesses || 3);
  const defaultMaxFail = Math.max(1, scene.chaseTargetFailures || 3);

  const syncPartyToChase = () => {
    updateScene((s) => {
      const existing = s.chaseParticipants ?? [];
      const existingRefs = new Set(existing.map((p) => p.refId));
      const toAdd: ChaseParticipantState[] = partyAgents
        .filter((ag) => !existingRefs.has(ag.id))
        .map((ag) => ({
          id: generateId("chase"),
          refId: ag.id,
          type: "agent",
          name: ag.name,
          successes: 0,
          failures: 0,
          maxFailures: s.chaseTargetFailures ?? 3,
          extraEffortCount: 0,
        }));
      return { ...s, chaseParticipants: [...existing, ...toAdd] };
    });
  };

  const addChaseParticipant = (entry: Omit<ChaseParticipantState, "id">) => {
    updateScene((s) => ({
      ...s,
      chaseParticipants: [
        ...(s.chaseParticipants ?? []),
        { ...entry, id: generateId("chase") },
      ],
    }));
  };

  const updateChaseParticipant = (
    pid: string,
    updater: (p: ChaseParticipantState) => ChaseParticipantState
  ) => {
    updateScene((s) => ({
      ...s,
      chaseParticipants: (s.chaseParticipants ?? []).map((p) =>
        p.id === pid ? updater(p) : p
      ),
    }));
  };

  const handleChaseExtraEffort = (p: ChaseParticipantState) => {
    const nextCount = p.extraEffortCount + 1;
    const dmg = rollExtraEffortDamage(nextCount);
    updateChaseParticipant(p.id, (prev) => ({
      ...prev,
      extraEffortCount: nextCount,
    }));

    if (p.type === "agent" && p.refId) {
      updateAgent(p.refId, (prev) => {
        const eff = getAgentEffectiveVitals(prev);
        const nextPv = Math.max(0, prev.status.pv.current - dmg.pvLoss);
        return {
          ...prev,
          status: {
            ...prev.status,
            pv: { ...prev.status.pv, current: nextPv },
            machucado: nextPv <= Math.floor(eff.maxPv / 2),
            morrendo: nextPv === 0 ? true : prev.status.morrendo,
          },
        };
      });
    }

    pushRoll({
      actorName: p.name,
      actorId: p.refId,
      campaignId: campaign.id,
      label: `Perseguição · Esforço Extra (${nextCount}ª vez) — +1d20`,
      kind: "damage",
      formula: `${dmg.formula} dano PV`,
      diceRolled: dmg.diceRolled,
      mode: "sum",
      bonus: 0,
      total: dmg.pvLoss,
      details: `${p.name} recebe +1d20 no teste de Atletismo e perde ${dmg.pvLoss} PV.`,
    });
  };

  const rollChaseEvent = (forcedKind?: "obstaculo" | "atalho") => {
    if (forcedKind === "obstaculo") {
      const item =
        CHASE_OBSTACLES[Math.floor(Math.random() * CHASE_OBSTACLES.length)];
      setLastChaseEvent({ kind: "obstaculo", item });
      pushRoll({
        actorName: campaign.name,
        campaignId: campaign.id,
        label: `Perseguição · Obstáculo: ${item.title}`,
        kind: "free",
        formula: `${item.test} DT ${item.dt}`,
        diceRolled: [],
        bonus: 0,
        total: item.dt,
        details: item.effect,
      });
      return;
    }

    if (forcedKind === "atalho") {
      const item =
        CHASE_SHORTCUTS[Math.floor(Math.random() * CHASE_SHORTCUTS.length)];
      setLastChaseEvent({ kind: "atalho", item });
      pushRoll({
        actorName: campaign.name,
        campaignId: campaign.id,
        label: `Perseguição · Atalho: ${item.title}`,
        kind: "free",
        formula: `${item.test} DT ${item.dt}`,
        diceRolled: [],
        bonus: 0,
        total: item.dt,
        details: item.effect,
      });
      return;
    }

    const d20 = Math.floor(Math.random() * 20) + 1;
    if (d20 <= 8) {
      setLastChaseEvent({ d20, kind: "sem_evento" });
      pushRoll({
        actorName: campaign.name,
        campaignId: campaign.id,
        label: "Evento de Perseguição (1d20): Sem Evento",
        kind: "free",
        formula: "1d20 (Tabela 2.3)",
        diceRolled: [d20],
        mode: "sum",
        bonus: 0,
        total: d20,
        details: "1–8: Nenhum obstáculo ou atalho surge nesta rodada.",
      });
    } else if (d20 <= 15) {
      const item =
        CHASE_OBSTACLES[Math.floor(Math.random() * CHASE_OBSTACLES.length)];
      setLastChaseEvent({ d20, kind: "obstaculo", item });
      pushRoll({
        actorName: campaign.name,
        campaignId: campaign.id,
        label: `Evento de Perseguição (1d20=${d20}) · Obstáculo: ${item.title}`,
        kind: "free",
        formula: `1d20 · ${item.test} DT ${item.dt}`,
        diceRolled: [d20],
        mode: "sum",
        bonus: 0,
        total: d20,
        details: item.effect,
      });
    } else {
      const item =
        CHASE_SHORTCUTS[Math.floor(Math.random() * CHASE_SHORTCUTS.length)];
      setLastChaseEvent({ d20, kind: "atalho", item });
      pushRoll({
        actorName: campaign.name,
        campaignId: campaign.id,
        label: `Evento de Perseguição (1d20=${d20}) · Atalho: ${item.title}`,
        kind: "free",
        formula: `1d20 · ${item.test} DT ${item.dt}`,
        diceRolled: [d20],
        mode: "sum",
        bonus: 0,
        total: d20,
        details: item.effect,
      });
    }
  };

  /* ==========================================================================
   * C. FURTIVIDADE
   * ========================================================================== */
  const stealthMap = scene.stealthAgentVisibility ?? {};
  const groupVisibilityTotal = partyAgents.reduce(
    (sum, ag) => sum + (stealthMap[ag.id] ?? 0),
    0
  );

  const adjustAgentVisibility = (agentId: string, delta: number) => {
    updateScene((s) => {
      const cur = s.stealthAgentVisibility?.[agentId] ?? 0;
      const next = Math.max(0, Math.min(5, cur + delta));
      return {
        ...s,
        stealthAgentVisibility: {
          ...(s.stealthAgentVisibility ?? {}),
          [agentId]: next,
        },
      };
    });
  };

  const handleDrawAttention = (agentId: string) => {
    const allyId = drawAttentionHelpTarget[agentId];
    updateScene((s) => {
      const map = { ...(s.stealthAgentVisibility ?? {}) };
      map[agentId] = Math.min(5, (map[agentId] ?? 0) + 2);
      if (allyId && allyId !== agentId) {
        map[allyId] = Math.max(0, (map[allyId] ?? 0) - 1);
      }
      return { ...s, stealthAgentVisibility: map };
    });
  };

  const handleRollStealthEvent = () => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const def = lookupStealthEvent(d20);
    let targetAgentId: string | undefined;
    let targetAgentName: string | undefined;
    let mentalRoll: number | undefined;

    if (
      (def.applyMode === "random_plus_2" ||
        def.applyMode === "random_plus_1" ||
        def.applyMode === "random_minus_1") &&
      partyAgents.length > 0
    ) {
      const picked =
        partyAgents[Math.floor(Math.random() * partyAgents.length)];
      targetAgentId = picked.id;
      targetAgentName = picked.name;
    }

    if (def.applyMode === "mental_damage") {
      mentalRoll = Math.floor(Math.random() * 6) + 1;
    }

    setLastStealthEvent({
      d20,
      def,
      targetAgentId,
      targetAgentName,
      applied: false,
      mentalRoll,
    });

    pushRoll({
      actorName: campaign.name,
      campaignId: campaign.id,
      label: `Evento de Furtividade (1d20=${d20}): ${def.title}`,
      kind: "free",
      formula: "1d20 (Tabela 2.4)",
      diceRolled: [d20],
      mode: "sum",
      bonus: 0,
      total: d20,
      details: `${def.effect}${
        targetAgentName ? ` | Alvo: ${targetAgentName}` : ""
      }${mentalRoll ? ` | 1d6 Mental = ${mentalRoll}` : ""}`,
    });
  };

  const handleApplyStealthEvent = () => {
    if (!lastStealthEvent || lastStealthEvent.applied) return;
    const { def, targetAgentId } = lastStealthEvent;

    if (def.applyMode === "all_plus_2" || def.applyMode === "all_plus_1") {
      updateScene((s) => {
        const map = { ...(s.stealthAgentVisibility ?? {}) };
        for (const ag of partyAgents) {
          map[ag.id] = Math.max(0, Math.min(5, (map[ag.id] ?? 0) + def.delta));
        }
        return { ...s, stealthAgentVisibility: map };
      });
    } else if (
      (def.applyMode === "random_plus_2" ||
        def.applyMode === "random_plus_1" ||
        def.applyMode === "random_minus_1") &&
      targetAgentId
    ) {
      adjustAgentVisibility(targetAgentId, def.delta);
    }

    setLastStealthEvent((prev) => (prev ? { ...prev, applied: true } : prev));
  };

  /* ==========================================================================
   * RENDER BY ACTIVE SCENE TAB
   * ========================================================================== */
  if (activeSceneTab === "investigacao") {
    const isUrgencyOver =
      scene.investigationUrgencyRound > scene.investigationMaxRounds;

    return (
      <div className="space-y-4">
        {/* Urgency + Timer + Failures */}
        <Card className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22222A] pb-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-amber-400" />
              <h2 className="font-display text-sm font-bold text-[#F4F4F5]">
                Cena de Investigação · Urgência
              </h2>
              <Badge
                variant={isUrgencyOver ? "danger" : "warning"}
                className="font-mono"
              >
                Rodada {scene.investigationUrgencyRound} /{" "}
                {scene.investigationMaxRounds}
              </Badge>
            </div>
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                updateScene((s) => ({
                  ...s,
                  investigationUrgencyRound: 1,
                  investigationFailures: 0,
                  investigationRolledEvents: [],
                  investigationObstinateCounts: {},
                }))
              }
            >
              <RotateCcw className="h-3 w-3" /> Nova Cena
            </Button>
          </div>

          {/* Urgency Presets */}
          <div className="space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block">
              Urgência da Investigação (Sobrevivendo ao Horror)
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {INVESTIGATION_URGENCY_PRESETS.map((p) => {
                const active = scene.investigationMaxRounds === p.rounds;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      updateScene((s) => ({
                        ...s,
                        investigationMaxRounds: p.rounds,
                        investigationUrgencyRound: 1,
                      }))
                    }
                    className={cn(
                      "rounded-sm border px-2.5 py-1.5 font-mono text-[11px] transition-colors",
                      active
                        ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5] font-semibold"
                        : "border-[#22222A] bg-[#09090B] text-[#8E8E9E] hover:text-[#D4D4D8]"
                    )}
                  >
                    {p.label} ({p.rounds}r)
                  </button>
                );
              })}

              <div className="ml-auto flex items-center gap-2 font-mono text-xs">
                <span className="text-[10px] text-[#8E8E9E]">MÁX:</span>
                <NumericInput
                  min={1}
                  fallback={1}
                  value={scene.investigationMaxRounds}
                  onValueChange={(v) =>
                    updateScene((s) => ({
                      ...s,
                      investigationMaxRounds: Math.max(1, v),
                    }))
                  }
                  className="h-8 w-12 rounded-sm border border-[#22222A] bg-[#09090B] text-center font-bold text-[#F4F4F5] focus:outline-none"
                />
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    updateScene((s) => ({
                      ...s,
                      investigationUrgencyRound: Math.max(
                        1,
                        s.investigationUrgencyRound - 1
                      ),
                    }))
                  }
                >
                  -1
                </Button>
                <Button
                  size="xs"
                  variant="primary"
                  onClick={() =>
                    updateScene((s) => ({
                      ...s,
                      investigationUrgencyRound:
                        s.investigationUrgencyRound + 1,
                    }))
                  }
                >
                  Próxima Rodada
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Evento ao acabar o tempo
              </label>
              <Input
                value={scene.investigationTimeoutEvent ?? ""}
                onChange={(e) =>
                  updateScene((s) => ({
                    ...s,
                    investigationTimeoutEvent: e.target.value,
                  }))
                }
                placeholder="Ex: A criatura desperta no porão / A polícia cerca o prédio..."
                className="h-8 text-xs"
              />
            </div>

            <div className="rounded-sm border border-[#22222A] bg-[#09090B] px-3 py-2 flex items-center gap-3">
              <div>
                <span className="font-mono text-[9px] uppercase text-[#8E8E9E] block">
                  Falhas (3 = -1 rodada)
                </span>
                <span className="font-mono text-sm font-bold text-[#F4F4F5] tabular-nums">
                  {scene.investigationFailures ?? 0} falha(s)
                </span>
              </div>
              <Button size="xs" variant="danger" onClick={handleRecordFailure}>
                +1 Falha
              </Button>
            </div>
          </div>

          {isUrgencyOver && (
            <div className="rounded-sm border border-red-500/50 bg-red-600/10 px-3.5 py-2.5 text-xs text-red-200 flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-red-400 shrink-0" />
              <span>
                <strong>Tempo Esgotado!</strong>{" "}
                {scene.investigationTimeoutEvent ||
                  "Dispare o evento de fim da urgência."}
              </span>
            </div>
          )}
        </Card>

        {/* 2d6 Investigation Event Roller */}
        <Card className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-sm font-bold text-[#F4F4F5]">
                Eventos de Investigação (Tabela 2d6)
              </h3>
              <p className="font-mono text-[10px] text-[#8E8E9E]">
                Eventos sorteados nesta cena:{" "}
                {(scene.investigationRolledEvents ?? []).length > 0
                  ? (scene.investigationRolledEvents ?? []).join(", ")
                  : "nenhum"}{" "}
                (repetições viram Sem Evento)
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {(scene.investigationRolledEvents?.length ?? 0) > 0 && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    updateScene((s) => ({
                      ...s,
                      investigationRolledEvents: [],
                    }))
                  }
                >
                  <RotateCcw className="h-3 w-3" /> Resetar Tabela
                </Button>
              )}
              <Button
                size="sm"
                variant="primary"
                onClick={handleRollInvestigationEvent}
              >
                <Dices className="h-3.5 w-3.5" /> Rolar Evento (2d6)
              </Button>
            </div>
          </div>

          {lastInvEvent && (
            <div
              className={cn(
                "rounded-sm border p-3.5 space-y-1",
                lastInvEvent.repeated
                  ? "border-[#22222A] bg-[#09090B]"
                  : lastInvEvent.roll === 12
                  ? "border-emerald-500/40 bg-emerald-600/10"
                  : lastInvEvent.roll <= 5 || lastInvEvent.roll >= 9
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-[#22222A] bg-[#09090B]"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-bold text-[#F4F4F5]">
                  [{lastInvEvent.roll}] {lastInvEvent.title}
                </span>
                <span className="font-mono text-[11px] text-[#A1A1AA]">
                  2d6: [{lastInvEvent.dice.join(" + ")}]
                </span>
              </div>
              <p className="text-xs text-[#D4D4D8] leading-relaxed">
                {lastInvEvent.effect}
              </p>
            </div>
          )}
        </Card>

        {/* Per-Agent Obstinate Search & Success at Any Cost */}
        <Card className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22222A] pb-2.5">
            <div>
              <h3 className="font-display text-sm font-bold text-[#F4F4F5]">
                Ações de Investigação por Agente
              </h3>
              <p className="font-mono text-[10px] text-[#8E8E9E]">
                Busca Obstinada: +1d20 para procurar pistas (perde 1d4 / 2d4 / 3d4 SAN/PD progressivo) · Sucesso a Qualquer Custo: -Limite de PE máx.
              </p>
            </div>
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                updateScene((s) => ({
                  ...s,
                  investigationObstinateCounts: {},
                }))
              }
            >
              <RotateCcw className="h-3 w-3" /> Zerar Contadores
            </Button>
          </div>

          {partyAgents.length === 0 ? (
            <p className="text-xs text-[#8E8E9E] py-4 text-center">
              Vincule agentes à campanha para usar Busca Obstinada e Sucesso a Qualquer Custo.
            </p>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {partyAgents.map((ag) => {
                const count = scene.investigationObstinateCounts?.[ag.id] ?? 0;
                const vitals = getAgentEffectiveVitals(ag);
                const nextFormula = `${count + 1}d4`;
                return (
                  <div
                    key={ag.id}
                    className="rounded-sm border border-[#22222A] bg-[#0B0B0F] p-3 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-display text-sm font-bold text-[#F4F4F5]">
                          {ag.name}
                        </p>
                        <p className="font-mono text-[10px] text-[#8E8E9E]">
                          {vitals.usingPd
                            ? `PD ${ag.status.pd?.current ?? vitals.maxPd}/${vitals.maxPd}`
                            : `SAN ${ag.status.san.current}/${vitals.maxSan} · PE ${ag.status.pe.current}/${vitals.maxPe}`}
                        </p>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        Usos: {count}×
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => handleObstinateSearch(ag)}
                        className="flex-1 font-mono text-[11px]"
                      >
                        <Dices className="h-3 w-3" /> Busca Obstinada ({nextFormula})
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleSuccessAnyCost(ag)}
                        title={`Reduz PE máximo em ${vitals.peLimit} até o fim da missão`}
                        className="font-mono text-[10px]"
                      >
                        <Zap className="h-3 w-3 text-amber-400" /> Sucesso (-{vitals.peLimit} PE máx)
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (activeSceneTab === "perseguicao") {
    return (
      <div className="space-y-4">
        {/* Chase Config */}
        <Card className="p-4 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22222A] pb-3">
            <div className="flex items-center gap-2">
              <Footprints className="h-4 w-4 text-emerald-400" />
              <h2 className="font-display text-sm font-bold text-[#F4F4F5]">
                Cena de Perseguição
              </h2>
              <Badge variant="outline" className="font-mono">
                DT Base {scene.chaseBaseDt ?? 15}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="xs" variant="outline" onClick={syncPartyToChase}>
                <UserPlus className="h-3 w-3" /> Importar Equipe
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() =>
                  updateScene((s) => ({
                    ...s,
                    chaseParticipants: (s.chaseParticipants ?? []).map((p) => ({
                      ...p,
                      successes: 0,
                      failures: 0,
                      extraEffortCount: 0,
                    })),
                  }))
                }
              >
                <RotateCcw className="h-3 w-3" /> Zerar Placar
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-[#8E8E9E] block">
                Papel dos Agentes
              </span>
              <div className="grid grid-cols-2 gap-1 rounded-sm border border-[#22222A] bg-[#09090B] p-0.5 font-mono text-[11px]">
                {(
                  [
                    { id: "presas", label: "Presas" },
                    { id: "cacadores", label: "Caçadores" },
                  ] as const
                ).map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() =>
                      updateScene((s) => ({ ...s, chaseRole: role.id }))
                    }
                    className={cn(
                      "rounded-sm py-1 transition-colors",
                      chaseRole === role.id
                        ? "bg-[#F4F4F5] text-[#09090B] font-bold"
                        : "text-[#8E8E9E] hover:text-[#D4D4D8]"
                    )}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-[#8E8E9E] block">
                DT Base (Atletismo)
              </span>
              <div className="flex items-center gap-1">
                {[15, 20, 25].map((dt) => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() =>
                      updateScene((s) => ({ ...s, chaseBaseDt: dt }))
                    }
                    className={cn(
                      "rounded-sm border px-2 py-1 font-mono text-xs",
                      (scene.chaseBaseDt ?? 15) === dt
                        ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5] font-bold"
                        : "border-[#22222A] bg-[#09090B] text-[#8E8E9E]"
                    )}
                  >
                    {dt}
                  </button>
                ))}
                <NumericInput
                  min={5}
                  value={scene.chaseBaseDt ?? 15}
                  onValueChange={(v) =>
                    updateScene((s) => ({ ...s, chaseBaseDt: Math.max(5, v) }))
                  }
                  className="h-7 w-12 rounded-sm border border-[#22222A] bg-[#09090B] text-center font-mono text-xs text-[#F4F4F5] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-mono text-[10px] uppercase text-[#8E8E9E] block mb-1">
                  Meta Sucessos
                </span>
                <NumericInput
                  min={1}
                  fallback={3}
                  value={targetSucc}
                  onValueChange={(v) =>
                    updateScene((s) => ({
                      ...s,
                      chaseTargetSuccesses: Math.max(1, v),
                    }))
                  }
                  className="h-8 w-full rounded-sm border border-[#22222A] bg-[#09090B] text-center font-mono text-xs font-bold text-[#F4F4F5] focus:outline-none"
                />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase text-[#8E8E9E] block mb-1">
                  Falhas Padrão
                </span>
                <NumericInput
                  min={1}
                  fallback={3}
                  value={defaultMaxFail}
                  onValueChange={(v) =>
                    updateScene((s) => ({
                      ...s,
                      chaseTargetFailures: Math.max(1, v),
                    }))
                  }
                  className="h-8 w-full rounded-sm border border-[#22222A] bg-[#09090B] text-center font-mono text-xs font-bold text-[#F4F4F5] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Table 2.3 Chase Event Roller */}
        <Card className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-sm font-bold text-[#F4F4F5]">
                Eventos de Perseguição (Tabela 2.3)
              </h3>
              <p className="font-mono text-[10px] text-[#8E8E9E]">
                1–8 Sem evento · 9–15 Obstáculo · 16–20 Atalho
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button size="xs" variant="primary" onClick={() => rollChaseEvent()}>
                <Dices className="h-3.5 w-3.5" /> Sortear Evento (1d20)
              </Button>
              <Button
                size="xs"
                variant="danger"
                onClick={() => rollChaseEvent("obstaculo")}
              >
                Sortear Obstáculo
              </Button>
              <Button
                size="xs"
                variant="default"
                onClick={() => rollChaseEvent("atalho")}
              >
                Sortear Atalho
              </Button>
            </div>
          </div>

          {lastChaseEvent && (
            <div
              className={cn(
                "rounded-sm border p-3 space-y-1",
                lastChaseEvent.kind === "obstaculo"
                  ? "border-red-500/40 bg-red-600/10"
                  : lastChaseEvent.kind === "atalho"
                  ? "border-emerald-500/40 bg-emerald-600/10"
                  : "border-[#22222A] bg-[#09090B]"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-bold text-[#F4F4F5]">
                  {lastChaseEvent.kind === "sem_evento"
                    ? "Sem Evento na Rodada"
                    : `${
                        lastChaseEvent.kind === "obstaculo"
                          ? "OBSTÁCULO"
                          : "ATALHO"
                      }: ${lastChaseEvent.item?.title}`}
                </span>
                {lastChaseEvent.d20 !== undefined && (
                  <Badge variant="outline" className="font-mono text-[10px]">
                    1d20 = {lastChaseEvent.d20}
                  </Badge>
                )}
              </div>
              {lastChaseEvent.item ? (
                <p className="text-xs text-[#D4D4D8]">
                  <strong className="font-mono text-amber-300">
                    {lastChaseEvent.item.test} DT {lastChaseEvent.item.dt}
                  </strong>{" "}
                  — {lastChaseEvent.item.effect}
                </p>
              ) : (
                <p className="text-xs text-[#8E8E9E]">
                  O terreno segue livre nesta rodada.
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Participants Scoreboard */}
        <Card className="p-4 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22222A] pb-2.5">
            <h3 className="font-display text-sm font-bold text-[#F4F4F5]">
              Placar de Participantes ({chaseParticipants.length})
            </h3>

            <div className="flex flex-wrap items-center gap-1.5">
              {threats.length > 0 && (
                <div className="flex items-center gap-1">
                  <Select
                    value={selectedChaseThreatId}
                    onChange={(e) => setSelectedChaseThreatId(e.target.value)}
                    className="h-7 text-xs w-40"
                  >
                    {threats.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      const th = threats.find(
                        (t) => t.id === selectedChaseThreatId
                      );
                      if (!th) return;
                      addChaseParticipant({
                        refId: th.id,
                        type: "threat",
                        name: th.name,
                        successes: 0,
                        failures: 0,
                        maxFailures: defaultMaxFail,
                        extraEffortCount: 0,
                      });
                    }}
                  >
                    + Ameaça
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Input
                  value={customChaseName}
                  onChange={(e) => setCustomChaseName(e.target.value)}
                  placeholder="Participante avulso..."
                  className="h-7 text-xs w-36"
                />
                <Button
                  size="xs"
                  variant="default"
                  onClick={() => {
                    if (!customChaseName.trim()) return;
                    addChaseParticipant({
                      type: "custom",
                      name: customChaseName.trim(),
                      successes: 0,
                      failures: 0,
                      maxFailures: defaultMaxFail,
                      extraEffortCount: 0,
                    });
                    setCustomChaseName("");
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {chaseParticipants.length === 0 ? (
            <p className="text-xs text-[#8E8E9E] text-center py-6">
              Clique em &ldquo;Importar Equipe&rdquo; acima ou adicione uma ameaça para iniciar o placar da perseguição.
            </p>
          ) : (
            <div className="space-y-2.5">
              {chaseParticipants.map((p) => {
                const won = p.successes >= targetSucc;
                const lost = p.failures >= p.maxFailures;
                const statusLabel = won
                  ? chaseRole === "presas"
                    ? "Escapou!"
                    : "Alcançou!"
                  : lost
                  ? chaseRole === "presas"
                    ? "Pego!"
                    : "Perdeu!"
                  : chaseRole === "presas"
                  ? "Em Fuga"
                  : "Perseguindo";

                return (
                  <div
                    key={p.id}
                    className={cn(
                      "rounded-sm border p-3 space-y-2.5",
                      won
                        ? "border-emerald-500/45 bg-emerald-600/10"
                        : lost
                        ? "border-red-500/45 bg-red-600/10"
                        : "border-[#22222A] bg-[#0B0B0F]"
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-[#F4F4F5]">
                          {p.name}
                        </span>
                        <Badge
                          variant={
                            won ? "success" : lost ? "danger" : "outline"
                          }
                          className="font-mono text-[10px]"
                        >
                          {statusLabel}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[10px] text-[#8E8E9E]">
                        <label className="inline-flex items-center gap-1">
                          Máx Falhas:
                          <NumericInput
                            min={1}
                            max={6}
                            fallback={3}
                            value={p.maxFailures}
                            onValueChange={(v) =>
                              updateChaseParticipant(p.id, (prev) => ({
                                ...prev,
                                maxFailures: Math.max(1, Math.min(6, v)),
                              }))
                            }
                            title="Use 4 para agentes com Perseverante 40%"
                            className="w-8 rounded-sm border border-[#22222A] bg-[#101014] text-center text-[#F4F4F5] focus:outline-none"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            updateScene((s) => ({
                              ...s,
                              chaseParticipants: (
                                s.chaseParticipants ?? []
                              ).filter((x) => x.id !== p.id),
                            }))
                          }
                          className="text-[#6E6E7E] hover:text-red-400 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Clickable Success & Failure pips */}
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      <div className="flex items-center justify-between rounded-sm border border-[#22222A] bg-[#09090B] px-2.5 py-1.5">
                        <span className="font-mono text-[10px] uppercase text-emerald-400">
                          Sucessos ({p.successes}/{targetSucc})
                        </span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: targetSucc }).map((_, i) => {
                            const filled = p.successes >= i + 1;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() =>
                                  updateChaseParticipant(p.id, (prev) => ({
                                    ...prev,
                                    successes:
                                      prev.successes === i + 1 ? i : i + 1,
                                  }))
                                }
                                className={cn(
                                  "h-5 w-5 rounded-sm border font-mono text-[10px] font-bold",
                                  filled
                                    ? "border-emerald-500 bg-emerald-600 text-white"
                                    : "border-[#22222A] bg-[#141419] text-[#6E6E7E]"
                                )}
                              >
                                {filled ? "✓" : i + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-sm border border-[#22222A] bg-[#09090B] px-2.5 py-1.5">
                        <span className="font-mono text-[10px] uppercase text-red-400">
                          Falhas ({p.failures}/{p.maxFailures})
                        </span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: p.maxFailures }).map((_, i) => {
                            const filled = p.failures >= i + 1;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() =>
                                  updateChaseParticipant(p.id, (prev) => ({
                                    ...prev,
                                    failures:
                                      prev.failures === i + 1 ? i : i + 1,
                                  }))
                                }
                                className={cn(
                                  "h-5 w-5 rounded-sm border font-mono text-[10px] font-bold",
                                  filled
                                    ? "border-red-500 bg-red-600 text-white"
                                    : "border-[#22222A] bg-[#141419] text-[#6E6E7E]"
                                )}
                              >
                                {filled ? "✕" : i + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Quick Chase Actions */}
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#1A1A22]">
                      {CHASE_QUICK_ACTIONS.map((act) => (
                        <button
                          key={act.id}
                          type="button"
                          title={act.summary}
                          onClick={() => {
                            if (act.id === "esforco_extra") {
                              handleChaseExtraEffort(p);
                            } else if (act.id === "cortar_caminho") {
                              updateChaseParticipant(p.id, (prev) => ({
                                ...prev,
                                successes: Math.min(
                                  targetSucc,
                                  prev.successes + 2
                                ),
                              }));
                            } else if (act.id === "sacrificio") {
                              updateChaseParticipant(p.id, (prev) => ({
                                ...prev,
                                failures: Math.min(
                                  prev.maxFailures,
                                  prev.failures + 1
                                ),
                              }));
                            } else {
                              pushRoll({
                                actorName: p.name,
                                actorId: p.refId,
                                campaignId: campaign.id,
                                label: `Perseguição · ${act.label}`,
                                kind: "ability",
                                formula: act.label,
                                diceRolled: [],
                                bonus: 0,
                                total: 0,
                                details: act.summary,
                              });
                            }
                          }}
                          className="rounded-sm border border-[#22222A] bg-[#141419] px-2 py-1 font-mono text-[10px] text-[#D4D4D8] hover:border-[#32323E] hover:text-[#F4F4F5] transition-colors"
                        >
                          {act.label}
                          {act.id === "esforco_extra"
                            ? ` (${p.extraEffortCount + 1}d4 PV)`
                            : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    );
  }

  /* ==========================================================================
   * C. FURTIVIDADE
   * ========================================================================== */
  const groupAlert = Boolean(scene.stealthGroupMode && groupVisibilityTotal >= 5);

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22222A] pb-3">
          <div className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-purple-400" />
            <h2 className="font-display text-sm font-bold text-[#F4F4F5]">
              Cena de Furtividade · Visibilidade
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 rounded-sm border border-[#22222A] bg-[#09090B] px-2.5 py-1 font-mono text-[10px] text-[#D4D4D8] cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(scene.stealthGroupMode)}
                onChange={(e) =>
                  updateScene((s) => ({
                    ...s,
                    stealthGroupMode: e.target.checked,
                  }))
                }
              />
              Visibilidade do Grupo ({groupVisibilityTotal}/5)
            </label>
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                updateScene((s) => ({
                  ...s,
                  stealthAgentVisibility: {},
                }))
              }
            >
              <RotateCcw className="h-3 w-3" /> Zerar Todos
            </Button>
          </div>
        </div>

        {groupAlert && (
          <div className="rounded-sm border border-red-500/60 bg-red-600/15 px-3.5 py-2.5 text-xs text-red-200 flex items-center gap-2 animate-pulse">
            <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
            <span>
              <strong>ALERTA DE GRUPO (Visibilidade {groupVisibilityTotal} ≥ 5):</strong>{" "}
              Todos os agentes com Visibilidade ≥ 1 foram VISTOS!
            </span>
          </div>
        )}

        {partyAgents.length === 0 ? (
          <p className="text-xs text-[#8E8E9E] text-center py-6">
            Vincule agentes à campanha para rastrear a visibilidade individual e em grupo.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {partyAgents.map((ag) => {
              const vis = stealthMap[ag.id] ?? 0;
              const statusMeta =
                vis === 0
                  ? {
                      label: "Escondido",
                      badge: "border-emerald-600/40 bg-emerald-950/50 text-emerald-300",
                    }
                  : vis === 1
                  ? {
                      label: "Discreto",
                      badge: "border-amber-500/40 bg-amber-500/10 text-amber-300",
                    }
                  : vis === 2
                  ? {
                      label: "Quase Visto",
                      badge: "border-orange-500/50 bg-orange-500/15 text-orange-300",
                    }
                  : {
                      label: "VISTO / EXPOSTO!",
                      badge:
                        "border-red-500/60 bg-red-600/20 text-red-200 animate-pulse",
                    };
              const otherAgents = partyAgents.filter((o) => o.id !== ag.id);

              return (
                <div
                  key={ag.id}
                  className={cn(
                    "rounded-sm border p-3.5 space-y-3",
                    vis >= 3
                      ? "border-red-500/50 bg-red-950/10"
                      : "border-[#22222A] bg-[#0B0B0F]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold text-[#F4F4F5]">
                      {ag.name}
                    </span>
                    <span
                      className={cn(
                        "rounded-sm border px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
                        statusMeta.badge
                      )}
                    >
                      {vis} · {statusMeta.label}
                    </span>
                  </div>

                  {/* Segmented 0..3+ visual meter */}
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { lvl: 0, activeCls: "bg-emerald-700 border-emerald-500", lbl: "0" },
                      { lvl: 1, activeCls: "bg-amber-600 border-amber-400", lbl: "1" },
                      { lvl: 2, activeCls: "bg-orange-600 border-orange-400", lbl: "2" },
                      { lvl: 3, activeCls: "bg-red-600 border-red-400", lbl: "3+" },
                    ].map((seg) => {
                      const active = vis >= seg.lvl;
                      return (
                        <button
                          key={seg.lvl}
                          type="button"
                          onClick={() =>
                            updateScene((s) => ({
                              ...s,
                              stealthAgentVisibility: {
                                ...(s.stealthAgentVisibility ?? {}),
                                [ag.id]: seg.lvl,
                              },
                            }))
                          }
                          className={cn(
                            "h-6 rounded-sm border font-mono text-[10px] font-bold transition-colors",
                            active
                              ? `${seg.activeCls} text-white`
                              : "border-[#22222A] bg-[#09090B] text-[#6E6E7E]"
                          )}
                        >
                          {seg.lbl}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick buttons: -1 Esconder-se, +1 Ação Comum, +2 Chamar Atenção */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => adjustAgentVisibility(ag.id, -1)}
                      className="font-mono text-[10px]"
                    >
                      -1 Esconder
                    </Button>
                    <Button
                      size="xs"
                      variant="default"
                      onClick={() => adjustAgentVisibility(ag.id, 1)}
                      className="font-mono text-[10px]"
                    >
                      +1 Ação
                    </Button>
                    <Button
                      size="xs"
                      variant="danger"
                      onClick={() => handleDrawAttention(ag.id)}
                      className="font-mono text-[10px]"
                    >
                      +2 Chamar Atenção
                    </Button>
                  </div>

                  {otherAgents.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8E8E9E]">
                      <span>Ao chamar atenção (-1 em aliado):</span>
                      <select
                        value={drawAttentionHelpTarget[ag.id] ?? ""}
                        onChange={(e) =>
                          setDrawAttentionHelpTarget((prev) => ({
                            ...prev,
                            [ag.id]: e.target.value,
                          }))
                        }
                        className="h-6 rounded-sm border border-[#22222A] bg-[#09090B] px-1.5 text-[10px] text-[#D4D4D8] focus:outline-none"
                      >
                        <option value="">Nenhum</option>
                        {otherAgents.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Table 2.4 Stealth Event Roller */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-sm font-bold text-[#F4F4F5]">
              Eventos de Furtividade (Tabela 2.4 · 1d20)
            </h3>
            <p className="font-mono text-[10px] text-[#8E8E9E]">
              1–2 Algoz perto (1d6 mental) · 3–5 Todos +2 · 6–8 Aleatório +2 · 9–15 Todos +1 · 16–17 Aleatório +1 · 18–19 Sem efeito · 20 Aleatório -1
            </p>
          </div>
          <Button size="sm" variant="primary" onClick={handleRollStealthEvent}>
            <Dices className="h-3.5 w-3.5" /> Rolar Evento (1d20)
          </Button>
        </div>

        {lastStealthEvent && (
          <div className="rounded-sm border border-[#32323E] bg-[#0B0B0F] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="purple" className="font-mono">
                  1d20 = {lastStealthEvent.d20}
                </Badge>
                <span className="font-display text-sm font-bold text-[#F4F4F5]">
                  {lastStealthEvent.def.title}
                </span>
                {lastStealthEvent.targetAgentName && (
                  <Badge variant="warning" className="font-mono text-[10px]">
                    Alvo: {lastStealthEvent.targetAgentName}
                  </Badge>
                )}
                {lastStealthEvent.mentalRoll && (
                  <Badge variant="danger" className="font-mono text-[10px]">
                    1d6 Mental = {lastStealthEvent.mentalRoll}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#D4D4D8]">
                {lastStealthEvent.def.effect}
              </p>
            </div>

            {lastStealthEvent.def.delta !== 0 && (
              <Button
                size="xs"
                variant={lastStealthEvent.applied ? "secondary" : "primary"}
                disabled={lastStealthEvent.applied}
                onClick={handleApplyStealthEvent}
                className="shrink-0"
              >
                {lastStealthEvent.applied ? (
                  <>
                    <Check className="h-3 w-3" /> Aplicado
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" /> Aplicar na Cena
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
