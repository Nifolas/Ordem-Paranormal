"use client";

import React, { useMemo, useState } from "react";
import {
  BedDouble,
  BookOpen,
  Check,
  Coffee,
  Dices,
  Dumbbell,
  Minus,
  Plus,
  Search,
  Sparkles,
  Utensils,
  Wrench,
} from "lucide-react";
import type {
  Agent,
  InterludeBonusDie,
  InterludeDish,
  RestCondition,
  SkillKey,
} from "@/types/ordem";
import {
  calculateInterludeRecovery,
  calculateLoadAndCategories,
  evaluateVitalConditions,
  getAgentEffectiveAttributes,
  getAgentEffectiveVitals,
  getAllySkillModifiers,
  getPassiveSkillModifiers,
  getTrailCarryBonus,
  normalizeCatalogId,
  rollOrdemTest,
} from "@/lib/ordem-rules";
import {
  formatSkillDisplayName,
  getAgentSkillList,
  STANDARD_SKILL_KEYS,
} from "@/data/skills";
import { cn, formatSigned, generateId } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import {
  Badge,
  Button,
  Input,
  Modal,
  NumericInput,
  Select,
} from "@/components/ui/primitives";

const REST_OPTIONS: {
  id: RestCondition;
  label: string;
  multLabel: string;
  desc: string;
}[] = [
  {
    id: "precaria",
    label: "Precária",
    multLabel: "0.5×",
    desc: "Chão frio, carro ou relento (arred. baixo)",
  },
  {
    id: "normal",
    label: "Normal",
    multLabel: "1×",
    desc: "Cama simples, motel ou alojamento padrão",
  },
  {
    id: "confortavel",
    label: "Confortável",
    multLabel: "2×",
    desc: "Hotel bom, casa segura ou base equipada",
  },
  {
    id: "luxuosa",
    label: "Luxuosa",
    multLabel: "3×",
    desc: "Resort, mansão ou spa de alto padrão",
  },
];

const DISH_OPTIONS: {
  id: InterludeDish;
  label: string;
  effect: string;
}[] = [
  {
    id: "favorito",
    label: "Prato Favorito",
    effect: "+2 SAN ao Relaxar (ou +2 PD temp. sem Sanidade)",
  },
  {
    id: "nutritivo",
    label: "Prato Nutritivo",
    effect: "+1 multiplicador de PV ao Dormir (ex: 1× → 2×)",
  },
  {
    id: "energetico",
    label: "Prato Energético",
    effect: "+1 multiplicador de PE ao Dormir (ex: 1× → 2×)",
  },
  {
    id: "rapido",
    label: "Prato Rápido",
    effect: "+5 no teste de Revisar Caso neste interlúdio",
  },
];

export function InterludeModal({
  open,
  onClose,
  agent,
  onUpdate,
}: {
  open: boolean;
  onClose: () => void;
  agent: Agent;
  onUpdate: (updater: (prev: Agent) => Agent) => void;
}) {
  const { pushRoll, quickDiceMod } = useAppStore();

  const vitals = getAgentEffectiveVitals(agent);
  const effAttrs = getAgentEffectiveAttributes(agent);
  const skillList = useMemo(() => getAgentSkillList(agent), [agent]);
  const isChef = normalizeCatalogId(agent.originId) === "chef";
  const maxDishes = isChef ? 2 : 1;

  const [restCondition, setRestCondition] = useState<RestCondition>("normal");
  const [maxActions, setMaxActions] = useState<number>(2);

  // Actions state
  const [didSleep, setDidSleep] = useState(false);
  const [didRelax, setDidRelax] = useState(false);
  const [alliesRelaxing, setAlliesRelaxing] = useState(0);

  const [didEat, setDidEat] = useState(false);
  const [dishes, setDishes] = useState<InterludeDish[]>([]);

  const [exerciseCount, setExerciseCount] = useState(0);
  const [readCount, setReadCount] = useState(0);

  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [maintenanceItemId, setMaintenanceItemId] = useState<string>("");
  const [maintenanceNote, setMaintenanceNote] = useState<string>("");

  const [reviewCount, setReviewCount] = useState(0);
  const [reviewSkillId, setReviewSkillId] = useState<string>("investigacao");
  const [lastReviewLog, setLastReviewLog] = useState<string | null>(null);

  const existingExerciseDice = (agent.interludeBonusDice ?? []).filter(
    (d) => d.source === "exercitar"
  ).length;
  const existingReadDice = (agent.interludeBonusDice ?? []).filter(
    (d) => d.source === "ler"
  ).length;
  const maxExerciseCap = Math.max(0, effAttrs.VIG);
  const maxReadCap = Math.max(0, effAttrs.INT);

  const actionsUsed =
    (didSleep ? 1 : 0) +
    (didRelax ? 1 : 0) +
    (didEat ? 1 : 0) +
    exerciseCount +
    readCount +
    maintenanceCount +
    reviewCount;

  const actionsRemaining = maxActions - actionsUsed;

  const preview = useMemo(
    () =>
      calculateInterludeRecovery({
        restCondition,
        baseRecovery: vitals.peLimit,
        usingPd: vitals.usingPd,
        didSleep,
        didRelax,
        alliesRelaxingTogether: alliesRelaxing,
        dishes: didEat ? dishes : [],
        exerciseCount,
        readCount,
        originId: agent.originId,
        trilhaId: agent.trilhaId,
        nex: agent.nex,
      }),
    [
      restCondition,
      vitals.peLimit,
      vitals.usingPd,
      didSleep,
      didRelax,
      alliesRelaxing,
      didEat,
      dishes,
      exerciseCount,
      readCount,
      agent.originId,
      agent.trilhaId,
      agent.nex,
    ]
  );

  const toggleDish = (dish: InterludeDish) => {
    setDishes((prev) => {
      if (prev.includes(dish)) return prev.filter((d) => d !== dish);
      if (prev.length >= maxDishes) {
        return [...prev.slice(1), dish];
      }
      return [...prev, dish];
    });
  };

  const resetForm = () => {
    setRestCondition("normal");
    setMaxActions(2);
    setDidSleep(false);
    setDidRelax(false);
    setAlliesRelaxing(0);
    setDidEat(false);
    setDishes([]);
    setExerciseCount(0);
    setReadCount(0);
    setMaintenanceCount(0);
    setMaintenanceItemId("");
    setMaintenanceNote("");
    setReviewCount(0);
    setLastReviewLog(null);
  };

  const handleRollReviewCase = () => {
    const sk = skillList.find((s) => s.id === reviewSkillId) ?? skillList[0];
    if (!sk) return;

    const attrVal = effAttrs[sk.atributoBase];
    const load = calculateLoadAndCategories({
      forAttr: effAttrs.FOR,
      patente: agent.patente,
      inventory: agent.inventory,
      extraCapacityBonus: getTrailCarryBonus(agent),
    });
    const loadPen = sk.penalidadeCarga && load.isOverloaded ? -5 : 0;
    const kitPen = sk.requerKit && sk.hasKit === false ? -5 : 0;
    const passiveMod = STANDARD_SKILL_KEYS.has(sk.id)
      ? getPassiveSkillModifiers(agent, sk.id as SkillKey)
      : { flatBonus: 0, diceModifier: 0 };
    const allyMod = STANDARD_SKILL_KEYS.has(sk.id)
      ? getAllySkillModifiers(agent, sk.id as SkillKey)
      : { flatBonus: 0, diceModifier: 0, grantsTrained: false };

    const effTraining =
      sk.treinamento === 0 && allyMod.grantsTrained ? 5 : sk.treinamento;
    const fastDishBonus = preview.reviewCaseBonus;

    const bonus =
      effTraining +
      sk.bonusOutros +
      passiveMod.flatBonus +
      allyMod.flatBonus +
      loadPen +
      kitPen +
      fastDishBonus;

    const res = rollOrdemTest({
      attributeValue: attrVal,
      bonus,
      bonusDice: quickDiceMod + passiveMod.diceModifier + allyMod.diceModifier,
    });

    const displayName = formatSkillDisplayName(sk);
    pushRoll({
      actorName: agent.name,
      actorId: agent.id,
      label: `Interlúdio · Revisar Caso (${displayName})`,
      kind: "skill",
      formula: res.formula,
      diceRolled: res.diceRolled,
      chosenDie: res.chosenDie,
      mode: res.mode,
      bonus: res.bonus,
      total: res.total,
      isNat20: res.isNat20,
      isNat1: res.isNat1,
      details: `${displayName} (${sk.atributoBase})${
        fastDishBonus > 0 ? " • Prato Rápido +5" : ""
      }`,
    });

    setLastReviewLog(
      `${displayName}: ${res.total} [${res.diceRolled.join(", ")}] ${
        fastDishBonus > 0 ? "(inclui +5 Prato Rápido)" : ""
      }`
    );

    if (actionsRemaining > 0) {
      setReviewCount((c) => c + 1);
    }
  };

  const handleApplyInterlude = () => {
    const now = new Date().toISOString();

    const newBonusDice: InterludeBonusDie[] = [];
    const exerciseSlots = Math.max(0, maxExerciseCap - existingExerciseDice);
    const addExercise = Math.min(preview.exerciseDiceCount, exerciseSlots);
    for (let i = 0; i < addExercise; i++) {
      newBonusDice.push({
        id: generateId("ibd"),
        source: "exercitar",
        dieFormula: "1d6",
        appliesTo: ["AGI", "FOR", "VIG"],
        label: "Exercitar-se (+1d6 AGI/FOR/VIG)",
        createdAt: now,
      });
    }

    const readSlots = Math.max(0, maxReadCap - existingReadDice);
    const addRead = Math.min(preview.readDiceCount, readSlots);
    for (let i = 0; i < addRead; i++) {
      newBonusDice.push({
        id: generateId("ibd"),
        source: "ler",
        dieFormula: preview.readDieFormula,
        appliesTo: ["INT", "PRE"],
        label: `Leitura (+${preview.readDieFormula} INT/PRE)`,
        createdAt: now,
      });
    }

    onUpdate((prev) => {
      const effVitals = getAgentEffectiveVitals(prev);
      const nextPv = Math.min(
        effVitals.maxPv,
        prev.status.pv.current + preview.pvRecovered
      );
      const nextPe = Math.min(
        effVitals.maxPe,
        prev.status.pe.current + preview.peRecovered
      );
      const nextSan = Math.min(
        effVitals.maxSan,
        prev.status.san.current + preview.sanRecovered
      );

      const curPd = prev.status.pd ?? {
        current: effVitals.maxPd,
        temp: 0,
        maxOverride: null,
        autoCalc: true,
      };
      const nextPd = Math.min(
        effVitals.maxPd,
        curPd.current + preview.pdRecovered
      );

      const conds = evaluateVitalConditions({
        currentPv: nextPv,
        maxPv: effVitals.maxPv,
        currentSan: nextSan,
        maxSan: effVitals.maxSan,
        usingPd: effVitals.usingPd,
      });

      const nextInventory =
        maintenanceCount > 0 && maintenanceItemId
          ? prev.inventory.map((it) =>
              it.id === maintenanceItemId ? { ...it, broken: false } : it
            )
          : prev.inventory;

      const maintenanceAppend =
        maintenanceCount > 0 && maintenanceNote.trim()
          ? `\n[Interlúdio · Manutenção] ${maintenanceNote.trim()}`
          : "";

      return {
        ...prev,
        status: {
          ...prev.status,
          pv: { ...prev.status.pv, current: nextPv },
          pe: { ...prev.status.pe, current: nextPe },
          san: { ...prev.status.san, current: nextSan },
          pd: effVitals.usingPd
            ? {
                ...curPd,
                current: nextPd,
                temp: (curPd.temp ?? 0) + preview.pdTempBonus,
              }
            : prev.status.pd,
          machucado: conds.machucado,
          morrendo: nextPv > 0 ? false : prev.status.morrendo,
          perturbado: conds.perturbado,
          enlouquecendo: nextSan > 0 ? false : prev.status.enlouquecendo,
        },
        inventory: nextInventory,
        interludeBonusDice: [
          ...(prev.interludeBonusDice ?? []),
          ...newBonusDice,
        ],
        description: maintenanceAppend
          ? {
              ...prev.description,
              notes: `${prev.description.notes}${maintenanceAppend}`.trim(),
            }
          : prev.description,
      };
    });

    const summaryParts: string[] = [];
    if (preview.pvRecovered > 0) summaryParts.push(`+${preview.pvRecovered} PV`);
    if (preview.peRecovered > 0) summaryParts.push(`+${preview.peRecovered} PE`);
    if (preview.sanRecovered > 0)
      summaryParts.push(`+${preview.sanRecovered} SAN`);
    if (preview.pdRecovered > 0) summaryParts.push(`+${preview.pdRecovered} PD`);
    if (preview.pdTempBonus > 0)
      summaryParts.push(`+${preview.pdTempBonus} PD temp.`);
    if (addExercise > 0) summaryParts.push(`+${addExercise}× 1d6 Exercitar`);
    if (addRead > 0)
      summaryParts.push(`+${addRead}× ${preview.readDieFormula} Leitura`);
    if (maintenanceCount > 0) {
      const itemName = agent.inventory.find(
        (i) => i.id === maintenanceItemId
      )?.name;
      summaryParts.push(
        itemName ? `Manutenção (${itemName})` : "Manutenção realizada"
      );
    }

    pushRoll({
      actorName: agent.name,
      actorId: agent.id,
      label: `Cena de Interlúdio (${
        REST_OPTIONS.find((r) => r.id === restCondition)?.label ?? "Normal"
      })`,
      kind: "ability",
      formula: `${actionsUsed}/${maxActions} ações`,
      diceRolled: [],
      bonus: 0,
      total:
        preview.pvRecovered +
        preview.peRecovered +
        preview.sanRecovered +
        preview.pdRecovered,
      details:
        summaryParts.length > 0
          ? summaryParts.join(" · ")
          : "Interlúdio finalizado.",
    });

    resetForm();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assistente de Cena de Interlúdio"
      description={`Base de recuperação: ${vitals.peLimit} (${
        agent.optionalRules?.includes("evolucao_por_patentes")
          ? `Patente ${agent.patente}`
          : "Limite de PE/turno"
      }). Escolha suas ações e confirme ao final.`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Top Config Bar: Rest Condition & Actions Budget */}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-start rounded-md border border-[#22222A] bg-[#0B0B0F] p-3.5">
          <div className="space-y-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E8E9E] block">
              Condição de Descanso do Local
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {REST_OPTIONS.map((opt) => {
                const active = restCondition === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRestCondition(opt.id)}
                    title={opt.desc}
                    className={cn(
                      "rounded-sm border px-2.5 py-2 text-left transition-colors",
                      active
                        ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                        : "border-[#22222A] bg-[#09090B] text-[#8E8E9E] hover:border-[#32323E] hover:text-[#D4D4D8]"
                    )}
                  >
                    <div className="flex items-center justify-between font-mono text-xs font-bold">
                      <span>{opt.label}</span>
                      <span className="text-[10px] opacity-80">
                        {opt.multLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-sm border border-[#22222A] bg-[#09090B] px-3 py-2 space-y-1 sm:min-w-[164px]">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#8E8E9E] block">
              Ações de Interlúdio
            </span>
            <div className="flex items-center justify-between gap-2 font-mono">
              <span
                className={cn(
                  "text-base font-bold tabular-nums",
                  actionsRemaining < 0
                    ? "text-red-400"
                    : actionsRemaining === 0
                    ? "text-emerald-400"
                    : "text-[#F4F4F5]"
                )}
              >
                {actionsUsed} / {maxActions}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMaxActions((m) => Math.max(1, m - 1))}
                  className="h-6 w-6 inline-flex items-center justify-center rounded-sm border border-[#22222A] bg-[#141419] text-[#A1A1AA] hover:text-[#F4F4F5]"
                  title="Reduzir limite de ações"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setMaxActions((m) => Math.min(6, m + 1))}
                  className="h-6 w-6 inline-flex items-center justify-center rounded-sm border border-[#22222A] bg-[#141419] text-[#A1A1AA] hover:text-[#F4F4F5]"
                  title="Liberar ação extra de habilidade"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-[#6E6E7E]">
              Padrão: 2 ações (+extra p/ hab.)
            </p>
          </div>
        </div>

        {/* 7 Official Actions */}
        <div className="grid gap-2.5 sm:grid-cols-2">
          {/* 1. DORMIR */}
          <div
            className={cn(
              "rounded-md border p-3.5 space-y-2 transition-colors",
              didSleep
                ? "border-[#F4F4F5] bg-[#14141B]"
                : "border-[#22222A] bg-[#0D0D11]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-red-400" />
                <div>
                  <h4 className="font-display text-sm font-bold text-[#F4F4F5]">
                    Dormir
                  </h4>
                  <p className="font-mono text-[10px] text-[#8E8E9E]">
                    Máx. 1× ·{" "}
                    {vitals.usingPd
                      ? "Recupera PV (modo PD)"
                      : "Recupera PV e PE"}
                  </p>
                </div>
              </div>
              <Button
                size="xs"
                variant={didSleep ? "primary" : "outline"}
                disabled={!didSleep && actionsRemaining <= 0}
                onClick={() => setDidSleep((v) => !v)}
              >
                {didSleep ? (
                  <>
                    <Check className="h-3 w-3" /> Ativo
                  </>
                ) : (
                  "Selecionar"
                )}
              </Button>
            </div>
          </div>

          {/* 2. RELAXAR */}
          <div
            className={cn(
              "rounded-md border p-3.5 space-y-2.5 transition-colors",
              didRelax
                ? "border-[#F4F4F5] bg-[#14141B]"
                : "border-[#22222A] bg-[#0D0D11]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4 text-sky-400" />
                <div>
                  <h4 className="font-display text-sm font-bold text-[#F4F4F5]">
                    Relaxar
                  </h4>
                  <p className="font-mono text-[10px] text-[#8E8E9E]">
                    Máx. 1× · Recupera {vitals.usingPd ? "PD" : "SAN"}
                  </p>
                </div>
              </div>
              <Button
                size="xs"
                variant={didRelax ? "primary" : "outline"}
                disabled={!didRelax && actionsRemaining <= 0}
                onClick={() => setDidRelax((v) => !v)}
              >
                {didRelax ? (
                  <>
                    <Check className="h-3 w-3" /> Ativo
                  </>
                ) : (
                  "Selecionar"
                )}
              </Button>
            </div>

            {didRelax && (
              <div className="flex items-center justify-between gap-2 rounded-sm border border-[#22222A] bg-[#09090B] px-2.5 py-1.5">
                <span className="text-[11px] text-[#A1A1AA]">
                  Aliados relaxando juntos (+1 {vitals.usingPd ? "PD" : "SAN"}/cada)
                </span>
                <NumericInput
                  min={0}
                  max={20}
                  value={alliesRelaxing}
                  onValueChange={(v) => setAlliesRelaxing(Math.max(0, v))}
                  aria-label="Aliados relaxando juntos"
                  className="w-12 rounded-sm border border-[#22222A] bg-[#141419] px-1.5 py-0.5 text-center font-mono text-xs font-bold text-[#F4F4F5] focus:outline-none focus:border-[#525266]"
                />
              </div>
            )}
          </div>

          {/* 3. ALIMENTAR-SE */}
          <div
            className={cn(
              "sm:col-span-2 rounded-md border p-3.5 space-y-2.5 transition-colors",
              didEat
                ? "border-[#F4F4F5] bg-[#14141B]"
                : "border-[#22222A] bg-[#0D0D11]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-amber-400" />
                <div>
                  <h4 className="font-display text-sm font-bold text-[#F4F4F5]">
                    Alimentar-se{" "}
                    {isChef && (
                      <Badge variant="warning" className="ml-1 font-mono text-[9px]">
                        CHEF: ATÉ 2 PRATOS
                      </Badge>
                    )}
                  </h4>
                  <p className="font-mono text-[10px] text-[#8E8E9E]">
                    Máx. 1× · Escolha {maxDishes === 2 ? "até 2 pratos cumulativos" : "1 prato"}
                  </p>
                </div>
              </div>
              <Button
                size="xs"
                variant={didEat ? "primary" : "outline"}
                disabled={!didEat && actionsRemaining <= 0}
                onClick={() => {
                  setDidEat((v) => {
                    if (v) setDishes([]);
                    return !v;
                  });
                }}
              >
                {didEat ? (
                  <>
                    <Check className="h-3 w-3" /> Ativo
                  </>
                ) : (
                  "Selecionar"
                )}
              </Button>
            </div>

            {didEat && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {DISH_OPTIONS.map((d) => {
                  const selected = dishes.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDish(d.id)}
                      className={cn(
                        "rounded-sm border px-2.5 py-2 text-left transition-colors",
                        selected
                          ? "border-amber-400/70 bg-amber-500/10 text-[#F4F4F5]"
                          : "border-[#22222A] bg-[#09090B] text-[#A1A1AA] hover:border-[#32323E]"
                      )}
                    >
                      <div className="font-mono text-xs font-bold">{d.label}</div>
                      <p className="text-[11px] text-[#8E8E9E] mt-0.5">
                        {d.effect}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. EXERCITAR-SE */}
          <div
            className={cn(
              "rounded-md border p-3.5 space-y-2 transition-colors",
              exerciseCount > 0
                ? "border-[#F4F4F5] bg-[#14141B]"
                : "border-[#22222A] bg-[#0D0D11]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-emerald-400" />
                <div>
                  <h4 className="font-display text-sm font-bold text-[#F4F4F5]">
                    Exercitar-se
                  </h4>
                  <p className="font-mono text-[10px] text-[#8E8E9E]">
                    +1d6 em AGI/FOR/VIG · Acúmulo: {existingExerciseDice + exerciseCount}/{maxExerciseCap} (VIG)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 font-mono text-xs">
                <button
                  type="button"
                  disabled={exerciseCount <= 0}
                  onClick={() => setExerciseCount((c) => Math.max(0, c - 1))}
                  className="h-6 w-6 inline-flex items-center justify-center rounded-sm border border-[#22222A] bg-[#09090B] text-[#A1A1AA] disabled:opacity-35"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center font-bold text-[#F4F4F5]">
                  {exerciseCount}
                </span>
                <button
                  type="button"
                  disabled={
                    actionsRemaining <= 0 ||
                    existingExerciseDice + exerciseCount >= maxExerciseCap
                  }
                  onClick={() => setExerciseCount((c) => c + 1)}
                  className="h-6 w-6 inline-flex items-center justify-center rounded-sm border border-[#22222A] bg-[#09090B] text-[#A1A1AA] disabled:opacity-35"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* 5. LER */}
          <div
            className={cn(
              "rounded-md border p-3.5 space-y-2 transition-colors",
              readCount > 0
                ? "border-[#F4F4F5] bg-[#14141B]"
                : "border-[#22222A] bg-[#0D0D11]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-purple-400" />
                <div>
                  <h4 className="font-display text-sm font-bold text-[#F4F4F5]">
                    Ler
                  </h4>
                  <p className="font-mono text-[10px] text-[#8E8E9E]">
                    +{preview.readDieFormula} em INT/PRE · Acúmulo: {existingReadDice + readCount}/{maxReadCap} (INT)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 font-mono text-xs">
                <button
                  type="button"
                  disabled={readCount <= 0}
                  onClick={() => setReadCount((c) => Math.max(0, c - 1))}
                  className="h-6 w-6 inline-flex items-center justify-center rounded-sm border border-[#22222A] bg-[#09090B] text-[#A1A1AA] disabled:opacity-35"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center font-bold text-[#F4F4F5]">
                  {readCount}
                </span>
                <button
                  type="button"
                  disabled={
                    actionsRemaining <= 0 ||
                    existingReadDice + readCount >= maxReadCap
                  }
                  onClick={() => setReadCount((c) => c + 1)}
                  className="h-6 w-6 inline-flex items-center justify-center rounded-sm border border-[#22222A] bg-[#09090B] text-[#A1A1AA] disabled:opacity-35"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* 6. MANUTENÇÃO */}
          <div
            className={cn(
              "rounded-md border p-3.5 space-y-2.5 transition-colors",
              maintenanceCount > 0
                ? "border-[#F4F4F5] bg-[#14141B]"
                : "border-[#22222A] bg-[#0D0D11]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-[#D4D4D8]" />
                <div>
                  <h4 className="font-display text-sm font-bold text-[#F4F4F5]">
                    Manutenção
                  </h4>
                  <p className="font-mono text-[10px] text-[#8E8E9E]">
                    Restaura PV de item quebrado ou fabricação em campo
                  </p>
                </div>
              </div>
              <Button
                size="xs"
                variant={maintenanceCount > 0 ? "primary" : "outline"}
                disabled={maintenanceCount === 0 && actionsRemaining <= 0}
                onClick={() => setMaintenanceCount((c) => (c > 0 ? 0 : 1))}
              >
                {maintenanceCount > 0 ? "Ativo" : "Selecionar"}
              </Button>
            </div>

            {maintenanceCount > 0 && (
              <div className="space-y-2">
                <Select
                  value={maintenanceItemId}
                  onChange={(e) => setMaintenanceItemId(e.target.value)}
                  className="h-8 text-xs"
                >
                  <option value="">Selecionar item do inventário (opcional)...</option>
                  {agent.inventory.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} {it.broken ? "(Quebrado)" : ""}
                    </option>
                  ))}
                </Select>
                <Input
                  value={maintenanceNote}
                  onChange={(e) => setMaintenanceNote(e.target.value)}
                  placeholder="Nota de reparo ou fabricação em campo..."
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>

          {/* 7. REVISAR CASO */}
          <div
            className={cn(
              "rounded-md border p-3.5 space-y-2.5 transition-colors",
              reviewCount > 0
                ? "border-[#F4F4F5] bg-[#14141B]"
                : "border-[#22222A] bg-[#0D0D11]"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-amber-300" />
                <div>
                  <h4 className="font-display text-sm font-bold text-[#F4F4F5]">
                    Revisar Caso
                  </h4>
                  <p className="font-mono text-[10px] text-[#8E8E9E]">
                    Repetível ({reviewCount}×)
                    {preview.reviewCaseBonus > 0 ? " · Prato Rápido +5" : ""}
                  </p>
                </div>
              </div>
              {reviewCount > 0 && (
                <button
                  type="button"
                  onClick={() => setReviewCount((c) => Math.max(0, c - 1))}
                  className="font-mono text-[10px] text-[#8E8E9E] hover:text-[#F4F4F5]"
                >
                  Desfazer (-1)
                </button>
              )}
            </div>

            <div className="flex gap-1.5">
              <Select
                value={reviewSkillId}
                onChange={(e) => setReviewSkillId(e.target.value)}
                className="h-8 text-xs flex-1"
              >
                {skillList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatSkillDisplayName(s)} ({s.atributoBase}{" "}
                    {formatSigned(s.treinamento + s.bonusOutros)})
                  </option>
                ))}
              </Select>
              <Button
                size="xs"
                variant="default"
                onClick={handleRollReviewCase}
                disabled={actionsRemaining <= 0 && reviewCount === 0}
              >
                <Dices className="h-3.5 w-3.5" /> Rolar
              </Button>
            </div>
            {lastReviewLog && (
              <p className="font-mono text-[10px] text-emerald-300">
                Último teste: {lastReviewLog}
              </p>
            )}
          </div>
        </div>

        {/* Live Preview Summary */}
        <div className="rounded-md border border-[#32323E] bg-[#0B0B0F] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4D4D8]">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Resumo do Interlúdio (Preview)
            </span>
            <span className="font-mono text-[10px] text-[#8E8E9E]">
              Curas limitadas ao máximo da ficha
            </span>
          </div>

          <div className="flex flex-wrap gap-2 font-mono text-xs">
            <Badge variant={preview.pvRecovered > 0 ? "danger" : "outline"}>
              +{preview.pvRecovered} PV
            </Badge>
            {vitals.usingPd ? (
              <>
                <Badge variant={preview.pdRecovered > 0 ? "purple" : "outline"}>
                  +{preview.pdRecovered} PD
                </Badge>
                {preview.pdTempBonus > 0 && (
                  <Badge variant="success">
                    +{preview.pdTempBonus} PD Temp.
                  </Badge>
                )}
              </>
            ) : (
              <>
                <Badge variant={preview.peRecovered > 0 ? "warning" : "outline"}>
                  +{preview.peRecovered} PE
                </Badge>
                <Badge
                  variant={preview.sanRecovered > 0 ? "default" : "outline"}
                  className={
                    preview.sanRecovered > 0
                      ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                      : ""
                  }
                >
                  +{preview.sanRecovered} SAN
                </Badge>
              </>
            )}
            {preview.exerciseDiceCount > 0 && (
              <Badge variant="success">
                +{preview.exerciseDiceCount}× 1d6 Exercitar
              </Badge>
            )}
            {preview.readDiceCount > 0 && (
              <Badge variant="purple">
                +{preview.readDiceCount}× {preview.readDieFormula} Leitura
              </Badge>
            )}
            {preview.reviewCaseBonus > 0 && (
              <Badge variant="warning">+5 Revisar Caso</Badge>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#22222A]">
          <Button variant="ghost" size="sm" onClick={resetForm}>
            Limpar Seleção
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={actionsUsed === 0}
              onClick={handleApplyInterlude}
            >
              <Check className="h-3.5 w-3.5" /> Finalizar Interlúdio
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
