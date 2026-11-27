"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Backpack,
  Check,
  Crosshair,
  Dices,
  FileText,
  Flame,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Swords,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import type {
  Agent,
  AgentAbility,
  AgentAttack,
  AgentRitual,
  AgentSkill,
  ContentSource,
  InventoryItem,
  ParanormalElement,
  RitualVersion,
  SkillKey,
} from "@/types/ordem";
import { BASE_RITUALS } from "@/data/rituals";
import { BASE_ITEMS } from "@/data/equipment";
import { getAgentSkillList, SKILLS_BY_KEY, SKILLS_LIST } from "@/data/skills";
import {
  calculateCombatStats,
  calculateRitualPeCost,
  consumeAttackAmmo,
  evaluateParanormalCost,
  getAgentEffectiveVitals,
  getAllyAttackDiceBonus,
  getAmmoShotsPerPack,
  getBurstExtraDiceFormula,
  getDefaultMagazineCapacity,
  getOrganizationWeaponDamageBonus,
  normalizeItemCategoryType,
  reloadAttackAmmo,
  rollOrdemTest,
  rollWeaponDamage,
} from "@/lib/ordem-rules";
import { cn, ELEMENT_STYLES, formatSigned, generateId } from "@/lib/utils";
import { COMMUNITY_ITEMS, COMMUNITY_RITUALS } from "@/data/supplements";
import {
  COMMUNITY_SOURCES,
  OFFICIAL_SOURCES,
  SOURCE_LABELS,
  filterByEnabledSources,
} from "@/lib/sources";
import {
  getSuperiorExtraRounds,
  hasSuperiorForm,
  resolveSuperiorInfo,
  SUPERIOR_REQUIREMENT_TEXT,
} from "@/data/supplements/rituaisSuperiores";
import {
  SourceBadge,
  SourceToggleGroup,
  setCommunityList,
  toggleSourceList,
} from "@/components/SourceToggles";
import { useAppStore } from "@/store/useAppStore";
import { AbilitiesTab } from "./AbilitiesTab";
import { AlliesTab } from "./AlliesTab";
import { InventoryTab } from "./InventoryTab";
import { SkillsColumn } from "./SkillsColumn";
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

export type SheetWorkspaceTab =
  | "pericias"
  | "combate"
  | "habilidades"
  | "rituais"
  | "inventario"
  | "aliados"
  | "descricao";

const ELEMENTS: ParanormalElement[] = [
  "Sangue",
  "Morte",
  "Conhecimento",
  "Energia",
  "Medo",
  "Variável",
];

interface ParanormalCostPrompt {
  ritualName: string;
  element: ParanormalElement;
  peSpent: number;
  dt: number;
  rolled?: {
    total: number;
    passed: boolean;
    sanLost: number;
    permanentSanLost: number;
    summary: string;
    applied: boolean;
  };
}

function EditorialSectionHeader({
  title,
  count,
  rightSlot,
}: {
  index?: string;
  title: string;
  count?: number;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2 mb-3">
      <div className="flex items-center gap-2">
        <h3 className="font-display text-sm font-bold tracking-tight text-zinc-100">
          {title}
        </h3>
        {count !== undefined && (
          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 tabular-nums">
            {count}
          </span>
        )}
      </div>
      {rightSlot}
    </div>
  );
}

export function RightTabsColumn({
  agent,
  onUpdate,
  onRollSkill,
  activeTab: controlledTab,
  onTabChange,
  hideHeaderOnMobile = false,
}: {
  agent: Agent;
  onUpdate: (updater: (prev: Agent) => Agent) => void;
  onRollSkill?: (skill: AgentSkill) => void;
  activeTab?: SheetWorkspaceTab;
  onTabChange?: (tab: SheetWorkspaceTab) => void;
  hideHeaderOnMobile?: boolean;
}) {
  const { homebrew, pushRoll, quickDiceMod } = useAppStore();
  const [internalTab, setInternalTab] = useState<SheetWorkspaceTab>("habilidades");
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (next: SheetWorkspaceTab) => {
    setInternalTab(next);
    onTabChange?.(next);
  };

  // Combat modal state
  const [attackModalOpen, setAttackModalOpen] = useState(false);
  const [atkForm, setAtkForm] = useState<Omit<AgentAttack, "id">>({
    name: "",
    skill: "luta",
    attackBonus: 0,
    damageFormula: "1d8",
    extraDamageFormula: "",
    extraDamageMultipliesOnCrit: false,
    damageType: "Corte",
    threatRange: 20,
    critMultiplier: 2,
    range: "Corpo a Corpo",
    notes: "",
    ammoEnabled: false,
    ammoCurrent: 12,
    ammoMax: 12,
    reserveAmmo: undefined,
    supportsBurst: false,
    burstMode: false,
  });
  const [ammoWarnings, setAmmoWarnings] = useState<Record<string, string>>({});

  // Ritual filters, version per ritual, modal, Paranormal Cost modal
  const [ritCircleFilter, setRitCircleFilter] = useState<number>(0);
  const [ritElementFilter, setRitElementFilter] = useState<
    "Todos" | ParanormalElement
  >("Todos");
  const [ritVersions, setRitVersions] = useState<Record<string, RitualVersion>>(
    {}
  );
  const [ritModalOpen, setRitModalOpen] = useState(false);
  const [ritSearch, setRitSearch] = useState("");
  const [ritSourceFilter, setRitSourceFilter] = useState<
    "todos" | ContentSource
  >("todos");
  const [showRitSourcesPanel, setShowRitSourcesPanel] = useState(false);
  const [costPrompt, setCostPrompt] = useState<ParanormalCostPrompt | null>(
    null
  );

  const [peAlert, setPeAlert] = useState<string | null>(null);

  const vitals = getAgentEffectiveVitals(agent);
  const combatStats = calculateCombatStats(agent);

  const allLibraryRituals = useMemo(
    () => [
      ...homebrew.rituals,
      ...filterByEnabledSources(COMMUNITY_RITUALS, agent.enabledSources),
      ...BASE_RITUALS,
    ],
    [homebrew.rituals, agent.enabledSources]
  );

  const allLibraryWeapons = useMemo(
    () =>
      [
        ...homebrew.weapons,
        ...homebrew.items,
        ...filterByEnabledSources(COMMUNITY_ITEMS, agent.enabledSources),
        ...BASE_ITEMS,
      ].filter((i) => normalizeItemCategoryType(i) === "arma"),
    [homebrew.weapons, homebrew.items, agent.enabledSources]
  );

  const showPeAlert = (msg: string) => {
    setPeAlert(msg);
    window.setTimeout(() => setPeAlert(null), 4000);
  };

  // Helper to spend PE (or PD when usingPd is ON)
  const getResourceAvailable = () =>
    vitals.usingPd
      ? (agent.status.pd?.current ?? vitals.maxPd) + (agent.status.pd?.temp ?? 0)
      : agent.status.pe.current + (agent.status.pe.temp ?? 0);

  const spendResource = (cost: number): boolean => {
    if (cost <= 0) return true;
    const avail = getResourceAvailable();
    const resName = vitals.usingPd ? "PD" : "PE";
    if (avail < cost) {
      showPeAlert(
        `${resName} insuficiente: custa ${cost} ${resName}, disponível ${avail} ${resName}.`
      );
      return false;
    }
    onUpdate((prev) => {
      if (vitals.usingPd) {
        const curPd = prev.status.pd ?? {
          current: vitals.maxPd,
          temp: 0,
          maxOverride: null,
          autoCalc: true,
        };
        const tempUsed = Math.min(curPd.temp ?? 0, cost);
        const rem = cost - tempUsed;
        return {
          ...prev,
          status: {
            ...prev.status,
            pd: {
              ...curPd,
              temp: Math.max(0, (curPd.temp ?? 0) - tempUsed),
              current: Math.max(0, curPd.current - rem),
            },
          },
        };
      }
      const tempUsed = Math.min(prev.status.pe.temp ?? 0, cost);
      const rem = cost - tempUsed;
      return {
        ...prev,
        status: {
          ...prev.status,
          pe: {
            ...prev.status.pe,
            temp: Math.max(0, (prev.status.pe.temp ?? 0) - tempUsed),
            current: Math.max(0, prev.status.pe.current - rem),
          },
        },
      };
    });
    return true;
  };

  // --- COMBAT ACTIONS ---
  const inventoryAmmoItems = useMemo(
    () =>
      agent.inventory.filter((i) => normalizeItemCategoryType(i) === "municao"),
    [agent.inventory]
  );

  const getLinkedPackShots = (item: InventoryItem): number => {
    const perPack = getAmmoShotsPerPack(item.name);
    if (item.ammoShotsRemaining !== undefined) {
      return Math.max(0, item.ammoShotsRemaining);
    }
    return Math.max(1, item.quantity) * perPack;
  };

  const updateAttack = (atkId: string, patch: Partial<AgentAttack>) => {
    onUpdate((prev) => ({
      ...prev,
      attacks: prev.attacks.map((a) =>
        a.id === atkId ? { ...a, ...patch } : a
      ),
    }));
  };

  const handleEnableAmmo = (atk: AgentAttack) => {
    const defaults = getDefaultMagazineCapacity(atk.name);
    const cap = atk.ammoMax ?? (defaults.capacity > 0 ? defaults.capacity : 12);
    updateAttack(atk.id, {
      ammoEnabled: !atk.ammoEnabled,
      ammoMax: cap,
      ammoCurrent: atk.ammoCurrent ?? cap,
      supportsBurst: atk.supportsBurst ?? defaults.supportsBurst,
    });
  };

  const handleReloadAttack = (atk: AgentAttack) => {
    const max = Math.max(1, atk.ammoMax ?? 12);
    const cur = Math.max(0, atk.ammoCurrent ?? 0);

    if (atk.linkedAmmoItemId) {
      const linked = agent.inventory.find((i) => i.id === atk.linkedAmmoItemId);
      if (!linked) {
        updateAttack(atk.id, { ammoCurrent: max, linkedAmmoItemId: undefined });
        setAmmoWarnings((prev) => {
          const next = { ...prev };
          delete next[atk.id];
          return next;
        });
        return;
      }
      const availShots = getLinkedPackShots(linked);
      const res = reloadAttackAmmo({ current: cur, max, reserve: availShots });
      const perPack = getAmmoShotsPerPack(linked.name);
      const remShots = res.nextReserve ?? 0;

      onUpdate((prev) => ({
        ...prev,
        attacks: prev.attacks.map((a) =>
          a.id === atk.id ? { ...a, ammoCurrent: res.nextCurrent } : a
        ),
        inventory: prev.inventory
          .map((it) =>
            it.id === linked.id
              ? {
                  ...it,
                  ammoShotsRemaining: remShots,
                  quantity: Math.max(1, Math.ceil(remShots / perPack)),
                }
              : it
          )
          .filter((it) => !(it.id === linked.id && remShots <= 0)),
      }));
    } else {
      const res = reloadAttackAmmo({
        current: cur,
        max,
        reserve: atk.reserveAmmo ?? null,
      });
      updateAttack(atk.id, {
        ammoCurrent: res.nextCurrent,
        ...(res.nextReserve !== null ? { reserveAmmo: res.nextReserve } : {}),
      });
    }

    setAmmoWarnings((prev) => {
      const next = { ...prev };
      delete next[atk.id];
      return next;
    });
  };

  const handleRollAttack = (atk: AgentAttack, forceWithoutAmmo = false) => {
    if (atk.ammoEnabled && !forceWithoutAmmo) {
      const check = consumeAttackAmmo({
        current: atk.ammoCurrent ?? 0,
        burstMode: Boolean(atk.burstMode),
      });
      if (!check.ok) {
        setAmmoWarnings((prev) => ({
          ...prev,
          [atk.id]:
            check.reason === "insufficient_burst"
              ? `Rajada exige 10 balas (restam ${atk.ammoCurrent ?? 0}) — recarregue ou desative Rajada.`
              : "Sem munição — recarregue antes de disparar.",
        }));
        return;
      }
      updateAttack(atk.id, { ammoCurrent: check.nextCurrent });
      setAmmoWarnings((prev) => {
        const next = { ...prev };
        delete next[atk.id];
        return next;
      });
    }

    const skillState = agent.skills[atk.skill];
    const attrKey = atk.attributeOverride ?? skillState?.attribute ?? "FOR";
    const attrVal = agent.attributes[attrKey];
    const skillBonus = (skillState?.training ?? 0) + (skillState?.bonus ?? 0);
    const totalBonus = skillBonus + atk.attackBonus;
    const allyAtkDice = getAllyAttackDiceBonus(agent);

    const res = rollOrdemTest({
      attributeValue: attrVal,
      bonus: totalBonus,
      bonusDice: quickDiceMod + allyAtkDice,
      threatRange: atk.threatRange,
    });

    pushRoll({
      actorName: agent.name,
      actorId: agent.id,
      label: `Ataque: ${atk.name}${atk.ammoEnabled && atk.burstMode ? " [RAJADA]" : ""}`,
      kind: "attack",
      formula: res.formula,
      diceRolled: res.diceRolled,
      chosenDie: res.chosenDie,
      mode: res.mode,
      bonus: res.bonus,
      total: res.total,
      isNat20: res.isNat20,
      isNat1: res.isNat1,
      isCriticalThreat: res.isCriticalThreat,
      details: `${
        res.isCriticalThreat
          ? `AMEAÇA DE CRÍTICO (${atk.threatRange}/x${atk.critMultiplier})! Role o Dano Crítico.`
          : `Perícia ${SKILLS_BY_KEY[atk.skill]?.name ?? atk.skill} (${attrKey}) • Crítico ${atk.threatRange}/x${atk.critMultiplier}`
      }${allyAtkDice > 0 ? ` • +${allyAtkDice}d20 Aliado` : ""}${
        atk.ammoEnabled && !forceWithoutAmmo
          ? ` • -${atk.burstMode ? 10 : 1} bala(s)`
          : ""
      }`,
    });
  };

  const handleRollDamage = (atk: AgentAttack, isCritical: boolean) => {
    try {
      const extraTerms = atk.extraDamageFormula?.trim()
        ? [
            {
              formula: atk.extraDamageFormula.trim(),
              label: "Extra",
              multiplicaNoCritico: Boolean(atk.extraDamageMultipliesOnCrit),
            },
          ]
        : [];
      if (atk.ammoEnabled && atk.burstMode) {
        const burstDice = getBurstExtraDiceFormula(atk.damageFormula, 2);
        if (burstDice) {
          extraTerms.push({
            formula: burstDice,
            label: "Rajada +2d",
            multiplicaNoCritico: false,
          });
        }
      }
      const orgBonus = getOrganizationWeaponDamageBonus(
        agent.organization,
        agent.patente
      );
      const res = rollWeaponDamage({
        baseFormula:
          orgBonus > 0 ? `${atk.damageFormula}+${orgBonus}` : atk.damageFormula,
        extraTerms,
        isCritical,
        critMultiplier: atk.critMultiplier,
      });
      pushRoll({
        actorName: agent.name,
        actorId: agent.id,
        label: `${isCritical ? "Dano Crítico" : "Dano"}: ${atk.name}${
          atk.ammoEnabled && atk.burstMode ? " [RAJADA]" : ""
        } (${atk.damageType})`,
        kind: "damage",
        formula: res.effectiveFormula,
        diceRolled: res.diceRolled,
        mode: "sum",
        bonus: res.bonus,
        total: res.total,
        isCriticalDamage: res.isCriticalDamage,
        details: `${res.breakdown} • Tipo: ${atk.damageType}${
          isCritical && extraTerms.length > 0 && !atk.extraDamageMultipliesOnCrit
            ? " • Dados extras NÃO multiplicados"
            : ""
        }`,
      });
    } catch {
      showPeAlert(`Fórmula de dano inválida: ${atk.damageFormula}`);
    }
  };

  const handleAddAttack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!atkForm.name.trim()) return;
    const created: AgentAttack = {
      ...atkForm,
      id: generateId("atk"),
    };
    onUpdate((prev) => ({ ...prev, attacks: [created, ...prev.attacks] }));
    setAttackModalOpen(false);
    setAtkForm({
      name: "",
      skill: "luta",
      attackBonus: 0,
      damageFormula: "1d8",
      extraDamageFormula: "",
      extraDamageMultipliesOnCrit: false,
      damageType: "Corte",
      threatRange: 20,
      critMultiplier: 2,
      range: "Corpo a Corpo",
      notes: "",
      ammoEnabled: false,
      ammoCurrent: 12,
      ammoMax: 12,
      reserveAmmo: undefined,
      supportsBurst: false,
      burstMode: false,
    });
  };

  const populateAttackFromWeapon = (w: InventoryItem) => {
    const ammoInfo = getDefaultMagazineCapacity(w.name);
    const isRangedWeapon =
      ammoInfo.isRanged ||
      w.weaponSubtype === "Fogo" ||
      w.weaponSubtype === "Disparo" ||
      w.skill === "pontaria";
    const cap = ammoInfo.capacity > 0 ? ammoInfo.capacity : isRangedWeapon ? 12 : 0;

    setAtkForm({
      name: w.name,
      skill: w.skill ?? (isRangedWeapon ? "pontaria" : "luta"),
      attackBonus: 0,
      damageFormula: w.damageFormula ?? "1d8",
      extraDamageFormula: "",
      extraDamageMultipliesOnCrit: false,
      damageType: w.damageType ?? "Corte",
      threatRange: w.threatRange ?? 20,
      critMultiplier: w.critMultiplier ?? 2,
      range: w.weaponRange ?? "Corpo a Corpo",
      notes: w.weaponGrip ?? w.description,
      ammoEnabled: isRangedWeapon,
      ammoCurrent: cap || 12,
      ammoMax: cap || 12,
      reserveAmmo: undefined,
      supportsBurst: ammoInfo.supportsBurst,
      burstMode: false,
    });
  };

  // --- ABILITY ACTIONS ---
  const handleUseAbility = (ability: AgentAbility) => {
    if (ability.peCost > 0 && !spendResource(ability.peCost)) return;
    const resName = vitals.usingPd ? "PD" : "PE";

    pushRoll({
      actorName: agent.name,
      actorId: agent.id,
      label: `Habilidade: ${ability.name}`,
      kind: "ability",
      element: ability.element,
      formula:
        ability.peCost > 0 ? `-${ability.peCost} ${resName}` : "Passiva / 0 PE",
      diceRolled: [],
      bonus: 0,
      total: ability.peCost,
      details:
        ability.hasAffinity && ability.affinityDescription
          ? `${ability.description} | AFINIDADE: ${ability.affinityDescription}`
          : ability.description,
    });
  };

  // --- RITUAL ACTIONS ---
  const reterRitualEnabled = (agent.optionalRules ?? []).includes(
    "reter_ritual"
  );
  const retainedRituals = agent.retainedRituals ?? [];
  const retainedPeTotal = retainedRituals.reduce((s, r) => s + r.peCost, 0);

  const handleRetainRitual = (ritual: AgentRitual, cost: number) => {
    if (retainedRituals.some((r) => r.ritualId === ritual.id)) return;
    const newMax = Math.max(1, vitals.maxPe - cost);
    onUpdate((prev) => ({
      ...prev,
      retainedRituals: [
        ...(prev.retainedRituals ?? []),
        {
          id: generateId("ret"),
          ritualId: ritual.id,
          name: ritual.name,
          peCost: cost,
        },
      ],
      status: {
        ...prev.status,
        pe: {
          ...prev.status.pe,
          current: Math.min(prev.status.pe.current, newMax),
        },
        san: {
          ...prev.status.san,
          current: Math.max(0, prev.status.san.current - 1),
        },
      },
    }));
  };

  const handleReleaseRitual = (retainedId: string) => {
    onUpdate((prev) => ({
      ...prev,
      retainedRituals: (prev.retainedRituals ?? []).filter(
        (r) => r.id !== retainedId
      ),
    }));
  };

  const handleCastRitual = (ritual: AgentRitual, version: RitualVersion) => {
    const resolvedSuperior = resolveSuperiorInfo(ritual);
    const cost = calculateRitualPeCost({
      circle: ritual.circle,
      version,
      basePeOverride: ritual.peCost,
      discenteCost: ritual.discenteCost,
      verdadeiraCost: ritual.verdadeiraCost,
      superiorCost: resolvedSuperior?.peCost,
    });

    if (!spendResource(cost)) return;
    const resName = vitals.usingPd ? "PD" : "PE";

    pushRoll({
      actorName: agent.name,
      actorId: agent.id,
      label: `Conjurar: ${ritual.name} (${version})`,
      kind: "ritual",
      element: ritual.element,
      formula: `-${cost} ${resName} • DT ${combatStats.ritualDT}`,
      diceRolled: [],
      bonus: 0,
      total: combatStats.ritualDT,
      details: `${ritual.element} (${ritual.circle}º Círculo) • ${ritual.execution} • ${ritual.range}`,
    });

    if (ritual.element !== "Medo") {
      setCostPrompt({
        ritualName: `${ritual.name} (${version})`,
        element: ritual.element,
        peSpent: cost,
        dt: 20 + cost,
      });
    }
  };

  const handleRollParanormalCost = () => {
    if (!costPrompt) return;
    const occState = agent.skills.ocultismo;
    const attrVal = agent.attributes[occState?.attribute ?? "INT"];
    const bonus = (occState?.training ?? 0) + (occState?.bonus ?? 0);
    const res = rollOrdemTest({
      attributeValue: attrVal,
      bonus,
      bonusDice: quickDiceMod,
    });

    const outcome = evaluateParanormalCost({
      rollTotal: res.total,
      peSpent: costPrompt.peSpent,
      isFearRitual: costPrompt.element === "Medo",
    });

    pushRoll({
      actorName: agent.name,
      actorId: agent.id,
      label: `Custo do Paranormal: ${costPrompt.ritualName}`,
      kind: "ritual",
      element: costPrompt.element,
      formula: res.formula,
      diceRolled: res.diceRolled,
      chosenDie: res.chosenDie,
      mode: res.mode,
      bonus: res.bonus,
      total: res.total,
      isNat20: res.isNat20,
      isNat1: res.isNat1,
      details: outcome.summary,
    });

    setCostPrompt({
      ...costPrompt,
      rolled: {
        total: res.total,
        passed: outcome.passed,
        sanLost: outcome.sanLost,
        permanentSanLost: outcome.permanentSanLost,
        summary: outcome.summary,
        applied: false,
      },
    });
  };

  const handleApplyParanormalCostLoss = () => {
    if (!costPrompt?.rolled || costPrompt.rolled.passed || costPrompt.rolled.applied)
      return;
    const { sanLost, permanentSanLost } = costPrompt.rolled;
    onUpdate((prev) => {
      if (vitals.usingPd) {
        const curPd = prev.status.pd ?? {
          current: vitals.maxPd,
          temp: 0,
          maxOverride: null,
          autoCalc: true,
        };
        return {
          ...prev,
          status: {
            ...prev.status,
            pd: { ...curPd, current: Math.max(0, curPd.current - sanLost) },
          },
        };
      }
      const nextSan = Math.max(0, prev.status.san.current - sanLost);
      return {
        ...prev,
        permanentSanLoss: (prev.permanentSanLoss ?? 0) + permanentSanLost,
        status: {
          ...prev.status,
          san: { ...prev.status.san, current: nextSan },
          enlouquecendo: nextSan === 0 ? true : prev.status.enlouquecendo,
        },
      };
    });
    setCostPrompt((prev) =>
      prev?.rolled ? { ...prev, rolled: { ...prev.rolled, applied: true } } : prev
    );
  };

  // Grouped Rituals by Circle
  const filteredRituals = useMemo(() => {
    return agent.rituals.filter((r) => {
      if (ritCircleFilter > 0 && r.circle !== ritCircleFilter) return false;
      if (ritElementFilter !== "Todos" && r.element !== ritElementFilter)
        return false;
      return true;
    });
  }, [agent.rituals, ritCircleFilter, ritElementFilter]);

  const ritualsByCircle = useMemo(() => {
    const groups: { circle: number; items: AgentRitual[] }[] = [];
    for (const c of [1, 2, 3, 4]) {
      const items = filteredRituals.filter((r) => r.circle === c);
      if (items.length > 0) groups.push({ circle: c, items });
    }
    return groups;
  }, [filteredRituals]);

  const skillList = useMemo(() => getAgentSkillList(agent), [agent]);
  const trainedSkillsCount = useMemo(
    () => skillList.filter((s) => s.treinamento > 0).length,
    [skillList]
  );

  const tabs: {
    id: SheetWorkspaceTab;
    label: string;
    icon: React.ReactNode;
    count?: number | string;
  }[] = [
    {
      id: "pericias",
      label: "Perícias",
      icon: <SlidersHorizontal className="h-3.5 w-3.5" />,
      count: `${trainedSkillsCount}/${skillList.length}`,
    },
    {
      id: "combate",
      label: "Combate",
      icon: <Swords className="h-3.5 w-3.5" />,
      count: agent.attacks.length,
    },
    {
      id: "habilidades",
      label: "Habilidades",
      icon: <Sparkles className="h-3.5 w-3.5" />,
      count: agent.abilities.length,
    },
    {
      id: "rituais",
      label: "Rituais",
      icon: <Flame className="h-3.5 w-3.5" />,
      count: agent.rituals.length,
    },
    {
      id: "inventario",
      label: "Inventário",
      icon: <Backpack className="h-3.5 w-3.5" />,
      count: agent.inventory.length,
    },
    {
      id: "aliados",
      label: "Aliados & Pets",
      icon: <Users className="h-3.5 w-3.5" />,
      count: agent.allies?.length ?? 0,
    },
    {
      id: "descricao",
      label: "Descrição",
      icon: <FileText className="h-3.5 w-3.5" />,
    },
  ];

  const resUnit = vitals.usingPd ? "PD" : "PE";

  return (
    <Card className="flex flex-col">
      {/* Architectural Tabs Header */}
      <div
        className={cn(
          "items-center justify-between gap-2 border-b border-white/10 bg-[#0C0C10]/90 px-3 pt-1",
          hideHeaderOnMobile ? "hidden xl:flex" : "flex"
        )}
      >
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium transition-colors",
                  active
                    ? "border-[#F4F4F5] text-[#F4F4F5]"
                    : "border-transparent text-[#8E8E9E] hover:text-[#D4D4D8]"
                )}
              >
                {t.icon}
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span
                    className={cn(
                      "rounded-sm px-1.5 py-0.5 font-mono text-[10px] tabular-nums",
                      active
                        ? "bg-[#1C1C24] text-[#F4F4F5]"
                        : "bg-[#141419] text-[#6E6E7E]"
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {peAlert && (
        <div className="mx-5 mt-4 rounded-sm border border-red-500/40 bg-red-600/10 px-3.5 py-2.5 text-xs text-red-300">
          {peAlert}
        </div>
      )}

      {/* Generous breathing workspace — zero max-h clipping */}
      <div className="p-5 sm:p-6">
        {/* ================= PERÍCIAS (2 COLUNAS AMPLAS) ================= */}
        {activeTab === "pericias" && (
          <SkillsColumn
            agent={agent}
            onUpdate={onUpdate}
            onRollSkill={(sk) => onRollSkill?.(sk)}
          />
        )}

        {/* ================= COMBATE ================= */}
        {activeTab === "combate" && (
          <div className="space-y-5">
            <EditorialSectionHeader
              index="01"
              title="Ataques & Armas"
              count={agent.attacks.length}
              rightSlot={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setAttackModalOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Novo Ataque
                </Button>
              }
            />

            <p className="font-mono text-[11px] text-[#8E8E9E] -mt-2">
              Crítico multiplica apenas dados base da arma — bônus fixos e dados
              extras permanecem separados (OP v1.2).
            </p>

            {agent.attacks.length === 0 ? (
              <div className="rounded-md border border-dashed border-[#22222A] bg-[#0C0C10] p-10 text-center space-y-2">
                <p className="text-sm text-[#A1A1AA]">
                  Nenhum ataque cadastrado no dossiê.
                </p>
                <p className="text-xs text-[#6E6E7E]">
                  Adicione armas da biblioteca oficial ou configure ataques
                  customizados.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {agent.attacks.map((atk) => {
                  const sk = agent.skills[atk.skill];
                  const attrKey = atk.attributeOverride ?? sk?.attribute ?? "FOR";
                  const totalAtkBonus =
                    (sk?.training ?? 0) + (sk?.bonus ?? 0) + atk.attackBonus;

                  return (
                    <div
                      key={atk.id}
                      className="rounded-md border border-[#22222A] bg-[#0D0D11] hover:border-[#32323E] p-4 space-y-3.5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-display text-[15px] font-bold text-[#F4F4F5]">
                              {atk.name}
                            </h4>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {SKILLS_BY_KEY[atk.skill]?.name} · {attrKey}{" "}
                              {formatSigned(totalAtkBonus)}
                            </Badge>
                            <Badge variant="warning" className="font-mono text-[10px]">
                              CRÍT {atk.threatRange}/×{atk.critMultiplier}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-[#A1A1AA] tabular-nums">
                            <span>
                              BASE:{" "}
                              <strong className="text-[#F4F4F5]">
                                {atk.damageFormula}
                              </strong>
                            </span>
                            {atk.extraDamageFormula ? (
                              <span>
                                EXTRA:{" "}
                                <strong className="text-amber-300">
                                  +{atk.extraDamageFormula}
                                </strong>
                                {!atk.extraDamageMultipliesOnCrit && (
                                  <span className="text-[10px] text-[#6E6E7E]">
                                    {" "}
                                    (não mult.)
                                  </span>
                                )}
                              </span>
                            ) : null}
                            <span className="text-[#8E8E9E]">
                              {atk.damageType}
                            </span>
                            {atk.range && (
                              <span className="text-[#6E6E7E]">
                                · {atk.range}
                              </span>
                            )}
                          </div>

                          {atk.notes && (
                            <p className="text-[13px] leading-relaxed text-[#A1A1AA] pt-0.5">
                              {atk.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEnableAmmo(atk)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-sm border px-2 py-1 font-mono text-[10px] transition-colors",
                              atk.ammoEnabled
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                                : "border-[#22222A] bg-[#141419] text-[#8E8E9E] hover:text-[#F4F4F5]"
                            )}
                            title="Ativar/desativar Contador de Munição nesta arma"
                          >
                            <Crosshair className="h-3 w-3" />
                            {atk.ammoEnabled ? "Munição ON" : "Munição"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdate((prev) => ({
                                ...prev,
                                attacks: prev.attacks.filter(
                                  (a) => a.id !== atk.id
                                ),
                              }))
                            }
                            className="rounded-sm p-1.5 text-[#6E6E7E] hover:bg-[#16161C] hover:text-red-400 transition-colors"
                            title="Excluir ataque"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Ammunition Counter Strip */}
                      {atk.ammoEnabled && (() => {
                        const ammoMax = Math.max(1, atk.ammoMax ?? 12);
                        const ammoCur = Math.max(0, atk.ammoCurrent ?? 0);
                        const ammoPct = Math.min(100, (ammoCur / ammoMax) * 100);
                        const linkedPack = atk.linkedAmmoItemId
                          ? agent.inventory.find(
                              (i) => i.id === atk.linkedAmmoItemId
                            )
                          : undefined;
                        const reserveCount = linkedPack
                          ? getLinkedPackShots(linkedPack)
                          : atk.reserveAmmo;
                        const canBurst =
                          Boolean(atk.supportsBurst) || ammoMax >= 10;
                        const warning = ammoWarnings[atk.id];

                        return (
                          <div className="rounded-sm border border-[#22222A] bg-[#09090B] p-3 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 font-mono text-xs">
                                <span className="text-[10px] uppercase tracking-wider text-[#8E8E9E]">
                                  CARREGADOR
                                </span>
                                <NumericInput
                                  min={0}
                                  value={ammoCur}
                                  onValueChange={(v) =>
                                    updateAttack(atk.id, {
                                      ammoCurrent: Math.max(0, v),
                                    })
                                  }
                                  aria-label={`Munição atual de ${atk.name}`}
                                  className={cn(
                                    "w-11 rounded-sm border bg-[#101014] px-1.5 py-0.5 text-center font-bold tabular-nums focus:outline-none",
                                    ammoCur === 0
                                      ? "border-red-500/60 text-red-400"
                                      : "border-[#22222A] text-[#F4F4F5]"
                                  )}
                                />
                                <span className="text-[#6E6E7E]">/</span>
                                <NumericInput
                                  min={1}
                                  fallback={1}
                                  value={ammoMax}
                                  onValueChange={(v) =>
                                    updateAttack(atk.id, {
                                      ammoMax: Math.max(1, v),
                                    })
                                  }
                                  aria-label={`Capacidade do pente de ${atk.name}`}
                                  className="w-11 rounded-sm border border-[#22222A] bg-[#101014] px-1.5 py-0.5 text-center text-[#A1A1AA] tabular-nums focus:outline-none"
                                />
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                {canBurst && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateAttack(atk.id, {
                                        burstMode: !atk.burstMode,
                                      })
                                    }
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-sm border px-2 py-1 font-mono text-[10px] font-semibold transition-colors",
                                      atk.burstMode
                                        ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                                        : "border-[#22222A] bg-[#141419] text-[#8E8E9E] hover:text-[#D4D4D8]"
                                    )}
                                    title="Modo Rajada: consome 10 balas no ataque e soma +2 dados de dano extras"
                                  >
                                    <Zap className="h-3 w-3" /> Rajada (10 · +2d)
                                  </button>
                                )}

                                <Button
                                  size="xs"
                                  variant="default"
                                  onClick={() => handleReloadAttack(atk)}
                                  disabled={
                                    ammoCur >= ammoMax ||
                                    (reserveCount !== undefined &&
                                      reserveCount <= 0)
                                  }
                                  className="h-7 font-mono text-[10px]"
                                >
                                  <RefreshCw className="h-3 w-3" /> Recarregar
                                </Button>
                              </div>
                            </div>

                            {/* Visual Pips (<=20) or Clean Progress Bar */}
                            {ammoMax <= 20 ? (
                              <div className="flex flex-wrap gap-1">
                                {Array.from({ length: ammoMax }).map((_, idx) => (
                                  <span
                                    key={idx}
                                    className={cn(
                                      "h-2 flex-1 min-w-[6px] max-w-[14px] rounded-[1px] transition-colors",
                                      idx < ammoCur
                                        ? atk.burstMode
                                          ? "bg-amber-400"
                                          : "bg-[#E4E4E7]"
                                        : "bg-[#1C1C24]"
                                    )}
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="h-1.5 w-full bg-[#1C1C24] overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full transition-all",
                                    ammoCur === 0
                                      ? "bg-red-500"
                                      : atk.burstMode
                                      ? "bg-amber-400"
                                      : "bg-[#E4E4E7]"
                                  )}
                                  style={{ width: `${ammoPct}%` }}
                                />
                              </div>
                            )}

                            {/* Reserve & Inventory Ammo Link */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#1A1A22] font-mono text-[10px]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[#6E6E7E]">RESERVA:</span>
                                <select
                                  value={atk.linkedAmmoItemId ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateAttack(atk.id, {
                                      linkedAmmoItemId: val || undefined,
                                    });
                                  }}
                                  className="h-6 rounded-sm border border-[#22222A] bg-[#101014] px-1.5 text-[10px] text-[#D4D4D8] focus:outline-none"
                                >
                                  <option value="">
                                    Manual / Sem vínculo
                                  </option>
                                  {inventoryAmmoItems.map((pack) => (
                                    <option key={pack.id} value={pack.id}>
                                      {pack.name} ({getLinkedPackShots(pack)}{" "}
                                      disp.)
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {linkedPack ? (
                                <span className="text-[#D4D4D8] tabular-nums">
                                  {getLinkedPackShots(linkedPack)} disparos no
                                  inventário
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[#8E8E9E]">
                                    Balas reserva:
                                  </span>
                                  {atk.reserveAmmo === undefined ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateAttack(atk.id, {
                                          reserveAmmo: 20,
                                        })
                                      }
                                      className="rounded-sm border border-[#22222A] bg-[#141419] px-1.5 py-0.5 text-[#A1A1AA] hover:text-[#F4F4F5]"
                                    >
                                      + Rastrear (20)
                                    </button>
                                  ) : (
                                    <>
                                      <NumericInput
                                        min={0}
                                        value={atk.reserveAmmo}
                                        onValueChange={(v) =>
                                          updateAttack(atk.id, {
                                            reserveAmmo: Math.max(0, v),
                                          })
                                        }
                                        className="w-12 rounded-sm border border-[#22222A] bg-[#101014] px-1 py-0.5 text-center text-[#F4F4F5] tabular-nums focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateAttack(atk.id, {
                                            reserveAmmo:
                                              (atk.reserveAmmo ?? 0) + 20,
                                          })
                                        }
                                        className="rounded-sm border border-[#22222A] bg-[#141419] px-1.5 py-0.5 text-[#A1A1AA] hover:text-[#F4F4F5]"
                                        title="Adicionar 1 pacote (+20 disparos)"
                                      >
                                        +20
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateAttack(atk.id, {
                                            reserveAmmo: undefined,
                                          })
                                        }
                                        className="text-[#6E6E7E] hover:text-[#D4D4D8]"
                                        title="Desvincular reserva"
                                      >
                                        ×
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {warning && (
                              <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-red-500/40 bg-red-600/10 px-2.5 py-1.5 text-[11px] text-red-300">
                                <span className="inline-flex items-center gap-1.5">
                                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                  {warning}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRollAttack(atk, true)}
                                  className="font-mono text-[10px] underline hover:text-white"
                                >
                                  Rolar mesmo assim
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#1A1A22]">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleRollAttack(atk)}
                        >
                          <Dices className="h-3.5 w-3.5" /> Ataque
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleRollDamage(atk, false)}
                        >
                          <Swords className="h-3.5 w-3.5 text-red-400" /> Dano
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRollDamage(atk, true)}
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Crítico ×
                          {atk.critMultiplier}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= HABILIDADES ================= */}
        {activeTab === "habilidades" && (
          <AbilitiesTab
            agent={agent}
            onUpdate={onUpdate}
            onUseAbility={handleUseAbility}
          />
        )}

        {/* ================= RITUAIS ================= */}
        {activeTab === "rituais" && (
          <div className="space-y-5">
            {/* Ritual DT Technical Strip */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-[#22222A] bg-[#0D0D11] px-4 py-3.5">
              <div className="space-y-0.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8E8E9E]">
                  DT de Rituais · 10 + Lim. PE + PRE + Extra
                </p>
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-2xl font-bold text-[#F4F4F5] tabular-nums">
                    DT {combatStats.ritualDT}
                  </span>
                  <span className="font-mono text-xs text-[#8E8E9E] tabular-nums">
                    (10 + {combatStats.peLimit} + {agent.attributes.PRE}
                    {agent.ritualDTBonus
                      ? formatSigned(agent.ritualDTBonus)
                      : ""}
                    )
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-[#8E8E9E]">
                    BÔNUS DT
                  </span>
                  <Input
                    type="number"
                    value={agent.ritualDTBonus ?? 0}
                    onChange={(e) =>
                      onUpdate((prev) => ({
                        ...prev,
                        ritualDTBonus: Number(e.target.value) || 0,
                      }))
                    }
                    className="h-8 w-14 font-mono text-xs text-center tabular-nums"
                  />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setRitModalOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Aprender Ritual
                </Button>
              </div>
            </div>

            {/* Circle & Element Filters */}
            {reterRitualEnabled && (
              <div className="rounded-md border border-[#22222A] bg-[#0D0D11] p-3.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4D4D8]">
                    Rituais Retidos · Reter Ritual
                  </span>
                  <span className="font-mono text-[10px] text-[#8E8E9E] tabular-nums">
                    {retainedRituals.length} retido(s) · −{retainedPeTotal}{" "}
                    {resUnit} máx. · {vitals.maxPe} {resUnit} máx. efetivo
                  </span>
                </div>
                {retainedRituals.length === 0 ? (
                  <p className="font-mono text-[10px] text-[#6E6E7E]">
                    Use &ldquo;Reter&rdquo; em um ritual de duração cena (após
                    conjurar): custa 1 SAN e desconta o custo em PE do máximo e
                    do atual até liberar.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {retainedRituals.map((r) => (
                      <span
                        key={r.id}
                        className="inline-flex items-center gap-2 rounded-sm border border-amber-500/40 bg-amber-500/10 px-2 py-1 font-mono text-[10px] text-amber-200"
                      >
                        {r.name} · −{r.peCost} {resUnit}
                        <button
                          type="button"
                          onClick={() => handleReleaseRitual(r.id)}
                          className="rounded-sm border border-amber-500/40 px-1 hover:bg-amber-500/20"
                          title="Liberar ritual e restaurar o PE máximo"
                        >
                          Liberar
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Circle & Element Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
              <div className="flex flex-wrap items-center gap-1">
                {[0, 1, 2, 3, 4].map((c) => {
                  const active = ritCircleFilter === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setRitCircleFilter(c)}
                      className={cn(
                        "rounded-sm border px-2.5 py-1 font-mono text-[11px] transition-colors",
                        active
                          ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                          : "border-[#22222A] bg-[#0D0D11] text-[#8E8E9E] hover:border-[#32323E] hover:text-[#D4D4D8]"
                      )}
                    >
                      {c === 0 ? "Todos" : `${c}º Círculo`}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setRitElementFilter("Todos")}
                  className={cn(
                    "rounded-sm border px-2 py-1 text-[11px] transition-colors",
                    ritElementFilter === "Todos"
                      ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                      : "border-[#22222A] bg-[#0D0D11] text-[#8E8E9E] hover:text-[#D4D4D8]"
                  )}
                >
                  Todos Elementos
                </button>
                {ELEMENTS.map((el) => {
                  const st = ELEMENT_STYLES[el];
                  const active = ritElementFilter === el;
                  return (
                    <button
                      key={el}
                      type="button"
                      onClick={() => setRitElementFilter(el)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[11px] transition-colors",
                        active
                          ? st.badge
                          : "border-[#22222A] bg-[#0D0D11] text-[#8E8E9E] hover:border-[#32323E] hover:text-[#D4D4D8]"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
                      {el}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ritual Cards grouped by Circle */}
            {ritualsByCircle.length === 0 ? (
              <div className="rounded-md border border-dashed border-[#22222A] bg-[#0C0C10] p-10 text-center space-y-2">
                <p className="text-sm text-[#A1A1AA]">
                  Nenhum ritual encontrado com esses filtros.
                </p>
                <p className="text-xs text-[#6E6E7E]">
                  Clique em &ldquo;Aprender Ritual&rdquo; para consultar todos
                  os {allLibraryRituals.length} rituais do catálogo oficial e
                  Homebrew.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {ritualsByCircle.map((group) => (
                  <div key={group.circle}>
                    <EditorialSectionHeader
                      index={`0${group.circle}`}
                      title={`${group.circle}º Círculo`}
                      count={group.items.length}
                    />

                    <div className="space-y-3">
                      {group.items.map((ritual) => {
                        const st = ELEMENT_STYLES[ritual.element];
                        const version: RitualVersion =
                          ritVersions[ritual.id] ?? "Normal";
                        const superiorInfo = resolveSuperiorInfo(ritual);
                        const versionCost = calculateRitualPeCost({
                          circle: ritual.circle,
                          version,
                          basePeOverride: ritual.peCost,
                          discenteCost: ritual.discenteCost,
                          verdadeiraCost: ritual.verdadeiraCost,
                          superiorCost: superiorInfo?.peCost,
                        });
                        const showSuperior = hasSuperiorForm(ritual);
                        const ocultismoTraining =
                          agent.skills.ocultismo?.training ?? 0;
                        const superiorRounds =
                          getSuperiorExtraRounds(ocultismoTraining);
                        const versionText =
                          version === "Discente"
                            ? ritual.discente ||
                              "Sem versão Discente cadastrada."
                            : version === "Verdadeira"
                            ? ritual.verdadeira ||
                              "Sem versão Verdadeira cadastrada."
                            : version === "Superior"
                            ? superiorInfo?.efeitoSuperior ||
                              ritual.description
                            : ritual.description;

                        return (
                          <div
                            key={ritual.id}
                            className={cn(
                              "rounded-md border border-[#22222A] border-l-[3px] bg-[#0D0D11] hover:border-[#32323E] p-4 space-y-3.5 transition-colors",
                              st.borderLeft
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-2 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-display text-[15px] font-bold text-[#F4F4F5]">
                                    {ritual.name}
                                  </h4>
                                  <SourceBadge source={ritual.source} />
                                  {ritual.isCorrentesDaRealidade && (
                                    <Badge
                                      variant="purple"
                                      className="font-mono text-[9px]"
                                    >
                                      CORRENTES DA REALIDADE
                                    </Badge>
                                  )}
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
                                      st.badge
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        st.dot
                                      )}
                                    />
                                    {ritual.element}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="font-mono text-[10px]"
                                  >
                                    {ritual.circle}º CÍRCULO
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 rounded-sm border border-[#1E1E26] bg-[#121217] px-3 py-2 text-[11px]">
                                  <div>
                                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
                                      Execução
                                    </span>
                                    <span className="text-[#D4D4D8]">
                                      {ritual.execution}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
                                      Alcance
                                    </span>
                                    <span className="text-[#D4D4D8]">
                                      {ritual.range}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
                                      Alvo / Área
                                    </span>
                                    <span className="text-[#D4D4D8]">
                                      {ritual.target}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
                                      Duração
                                    </span>
                                    <span className="text-[#D4D4D8]">
                                      {ritual.duration}
                                    </span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
                                      Resistência
                                    </span>
                                    <span className="text-[#D4D4D8]">
                                      {ritual.resistance}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  onUpdate((prev) => ({
                                    ...prev,
                                    rituals: prev.rituals.filter(
                                      (r) => r.id !== ritual.id
                                    ),
                                  }))
                                }
                                className="rounded-sm p-1.5 text-[#6E6E7E] hover:bg-[#16161C] hover:text-red-400 transition-colors"
                                title="Esquecer ritual"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div
                              className={cn(
                                "grid gap-1 rounded-sm bg-[#121217] p-1 border border-[#22222A]",
                                showSuperior ? "grid-cols-4" : "grid-cols-3"
                              )}
                            >
                              {(showSuperior
                                ? ([
                                    "Normal",
                                    "Discente",
                                    "Verdadeira",
                                    "Superior",
                                  ] as const)
                                : (["Normal", "Discente", "Verdadeira"] as const)
                              ).map((ver) => {
                                const vCost = calculateRitualPeCost({
                                  circle: ritual.circle,
                                  version: ver,
                                  basePeOverride: ritual.peCost,
                                  discenteCost: ritual.discenteCost,
                                  verdadeiraCost: ritual.verdadeiraCost,
                                  superiorCost: superiorInfo?.peCost,
                                });
                                const active = version === ver;
                                return (
                                  <button
                                    key={ver}
                                    type="button"
                                    onClick={() =>
                                      setRitVersions((prev) => ({
                                        ...prev,
                                        [ritual.id]: ver,
                                      }))
                                    }
                                    className={cn(
                                      "rounded-sm py-1.5 font-mono text-[11px] font-medium transition-colors tabular-nums",
                                      active
                                        ? "bg-[#1C1C24] text-[#F4F4F5] border border-[#32323E]"
                                        : "border border-transparent text-[#8E8E9E] hover:text-[#D4D4D8]"
                                    )}
                                  >
                                    {ver} · {vCost} {resUnit}
                                  </button>
                                );
                              })}
                            </div>

                            <p className="text-[14px] leading-[1.65] text-[#D4D4D8] whitespace-pre-line">
                              {versionText}
                            </p>

                            {(version === "Superior" || ritual.isSuperior) && (
                              <div className="rounded-sm border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5 text-xs">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300">
                                    Forma Superior · Conjuração Complexa
                                  </p>
                                  <SourceBadge
                                    source={
                                      superiorInfo?.source ?? "rituais_superiores"
                                    }
                                  />
                                </div>
                                <p className="text-[#D4D4D8]">
                                  {SUPERIOR_REQUIREMENT_TEXT}
                                </p>
                                {superiorInfo?.execution && (
                                  <p className="font-mono text-[11px] text-[#D4D4D8]">
                                    Execução Superior:{" "}
                                    <strong className="text-amber-200">
                                      {superiorInfo.execution}
                                    </strong>
                                  </p>
                                )}
                                <p className="font-mono text-[11px] text-[#A1A1AA]">
                                  Rodadas extras de tentativa (Ocultismo{" "}
                                  {ocultismoTraining >= 15
                                    ? "Expert"
                                    : ocultismoTraining >= 10
                                    ? "Veterano"
                                    : ocultismoTraining >= 5
                                    ? "Treinado"
                                    : "Destreinado"}
                                  ):{" "}
                                  <strong className="text-[#F4F4F5]">
                                    +{superiorRounds}
                                  </strong>
                                </p>
                                {superiorInfo && (
                                  <div className="space-y-1 text-[#D4D4D8]">
                                    {superiorInfo.conjuracao && (
                                      <p>
                                        <strong>Conjuração:</strong>{" "}
                                        {superiorInfo.conjuracao}
                                      </p>
                                    )}
                                    {superiorInfo.consequencias && (
                                      <p>
                                        <strong>Consequências:</strong>{" "}
                                        {superiorInfo.consequencias}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1A1A22]">
                              <span className="font-mono text-[11px] text-[#8E8E9E]">
                                {ritual.element === "Medo"
                                  ? "MEDO · ISENTO DE CUSTO DO PARANORMAL"
                                  : `CUSTO DO PARANORMAL · OCULTISMO DT ${20 + versionCost}`}
                              </span>
                              <div className="flex flex-wrap items-center gap-2">
                                {reterRitualEnabled &&
                                  (() => {
                                    const retained = retainedRituals.find(
                                      (r) => r.ritualId === ritual.id
                                    );
                                    return retained ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleReleaseRitual(retained.id)
                                        }
                                        title="Liberar ritual retido e restaurar PE máximo"
                                      >
                                        Liberar (+{retained.peCost} {resUnit}{" "}
                                        máx.)
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleRetainRitual(
                                            ritual,
                                            versionCost
                                          )
                                        }
                                        title="Reter: −1 SAN e −custo de PE do máximo e atual enquanto retido"
                                      >
                                        Reter (−{versionCost} {resUnit} máx.)
                                      </Button>
                                    );
                                  })()}
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() =>
                                    handleCastRitual(ritual, version)
                                  }
                                >
                                  <Flame className="h-3.5 w-3.5" /> Conjurar (-
                                  {versionCost} {resUnit})
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= INVENTÁRIO (9 CATEGORIAS) ================= */}
        {activeTab === "inventario" && (
          <InventoryTab agent={agent} onUpdate={onUpdate} />
        )}

        {/* ================= ALIADOS & PETS ================= */}
        {activeTab === "aliados" && (
          <AlliesTab
            agent={agent}
            onUpdate={onUpdate}
            spendResource={spendResource}
          />
        )}

        {/* ================= DESCRIÇÃO ================= */}
        {activeTab === "descricao" && (
          <div className="space-y-4">
            <EditorialSectionHeader
              index="01"
              title="Registro Biográfico & Campo"
            />
            {(
              [
                { key: "appearance", label: "Aparência", rows: 2 },
                { key: "personality", label: "Personalidade", rows: 2 },
                { key: "background", label: "Histórico", rows: 4 },
                { key: "objective", label: "Objetivo", rows: 2 },
                { key: "favorites", label: "Favoritos", rows: 2 },
                { key: "notes", label: "Anotações de Investigação", rows: 5 },
              ] as const
            ).map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E8E9E] block">
                  {field.label}
                </label>
                <Textarea
                  rows={field.rows}
                  value={agent.description[field.key]}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      description: {
                        ...prev.description,
                        [field.key]: e.target.value,
                      },
                    }))
                  }
                  placeholder={`Registrar ${field.label.toLowerCase()}...`}
                  className="text-sm leading-relaxed"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= MODAL: NOVO ATAQUE ================= */}
      <Modal
        open={attackModalOpen}
        onClose={() => setAttackModalOpen(false)}
        title="Adicionar Ataque / Arma"
      >
        <form onSubmit={handleAddAttack} className="space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1.5">
              Preencher a partir da Biblioteca de Armas (opcional)
            </label>
            <Select
              value=""
              onChange={(e) => {
                const found = allLibraryWeapons.find(
                  (w) => w.id === e.target.value
                );
                if (found) populateAttackFromWeapon(found);
              }}
            >
              <option value="">Selecionar arma da biblioteca...</option>
              {allLibraryWeapons.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.damageFormula} • {w.threatRange}/x
                  {w.critMultiplier})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Nome do Ataque *
              </label>
              <Input
                required
                value={atkForm.name}
                onChange={(e) =>
                  setAtkForm({ ...atkForm, name: e.target.value })
                }
                placeholder="Ex: Fuzil de Assalto, Katana..."
              />
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Perícia
              </label>
              <Select
                value={atkForm.skill}
                onChange={(e) =>
                  setAtkForm({ ...atkForm, skill: e.target.value as SkillKey })
                }
              >
                {SKILLS_LIST.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Bônus Ataque Extra
              </label>
              <Input
                type="number"
                value={atkForm.attackBonus}
                onChange={(e) =>
                  setAtkForm({
                    ...atkForm,
                    attackBonus: Number(e.target.value) || 0,
                  })
                }
                className="font-mono"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Dano Base (multiplica no crítico) *
              </label>
              <Input
                required
                value={atkForm.damageFormula}
                onChange={(e) =>
                  setAtkForm({ ...atkForm, damageFormula: e.target.value })
                }
                placeholder="Ex: 1d10+3"
                className="font-mono"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Dano Extra (Furtivo/Maldição)
              </label>
              <Input
                value={atkForm.extraDamageFormula ?? ""}
                onChange={(e) =>
                  setAtkForm({ ...atkForm, extraDamageFormula: e.target.value })
                }
                placeholder="Ex: 2d6 (opcional)"
                className="font-mono"
              />
            </div>

            <div className="col-span-2">
              <label className="inline-flex items-center gap-2 text-xs text-[#A1A1AA] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(atkForm.extraDamageMultipliesOnCrit)}
                  onChange={(e) =>
                    setAtkForm({
                      ...atkForm,
                      extraDamageMultipliesOnCrit: e.target.checked,
                    })
                  }
                />
                Dano extra multiplica no crítico? (Por padrão NÃO multiplica em
                OP v1.2)
              </label>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Tipo de Dano
              </label>
              <Input
                value={atkForm.damageType}
                onChange={(e) =>
                  setAtkForm({ ...atkForm, damageType: e.target.value })
                }
                placeholder="Corte, Balístico, Sangue..."
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Margem
                </label>
                <Input
                  type="number"
                  min={10}
                  max={20}
                  value={atkForm.threatRange}
                  onChange={(e) =>
                    setAtkForm({
                      ...atkForm,
                      threatRange: Number(e.target.value) || 20,
                    })
                  }
                  className="font-mono"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Mult (×)
                </label>
                <Input
                  type="number"
                  min={2}
                  max={5}
                  value={atkForm.critMultiplier}
                  onChange={(e) =>
                    setAtkForm({
                      ...atkForm,
                      critMultiplier: Number(e.target.value) || 2,
                    })
                  }
                  className="font-mono"
                />
              </div>
            </div>

            {/* Optional Ammo Counter Config in Modal */}
            <div className="col-span-2 rounded-sm border border-[#22222A] bg-[#0B0B0F] p-3 space-y-2.5">
              <label className="inline-flex items-center gap-2 text-xs text-[#D4D4D8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(atkForm.ammoEnabled)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const defaults = getDefaultMagazineCapacity(atkForm.name);
                    const cap =
                      defaults.capacity > 0
                        ? defaults.capacity
                        : atkForm.ammoMax ?? 12;
                    setAtkForm({
                      ...atkForm,
                      ammoEnabled: checked,
                      ammoMax: cap,
                      ammoCurrent: cap,
                      supportsBurst: defaults.supportsBurst,
                    });
                  }}
                />
                Ativar Contagem de Munição para esta arma
              </label>

              {atkForm.ammoEnabled && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-[#8E8E9E] block mb-1">
                      Capacidade do Pente
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={atkForm.ammoMax ?? 12}
                      onChange={(e) => {
                        const cap = Math.max(1, Number(e.target.value) || 1);
                        setAtkForm({
                          ...atkForm,
                          ammoMax: cap,
                          ammoCurrent: cap,
                        });
                      }}
                      className="font-mono"
                    />
                  </div>
                  <div className="flex items-end pb-1.5">
                    <label className="inline-flex items-center gap-2 text-xs text-[#A1A1AA] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(atkForm.supportsBurst)}
                        onChange={(e) =>
                          setAtkForm({
                            ...atkForm,
                            supportsBurst: e.target.checked,
                          })
                        }
                      />
                      Arma automática (Rajada)
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#22222A]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAttackModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Ataque
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: APRENDER RITUAL ================= */}
      <Modal
        open={ritModalOpen}
        onClose={() => setRitModalOpen(false)}
        title={`Biblioteca de Rituais (${allLibraryRituals.length})`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6E6E7E]" />
              <Input
                value={ritSearch}
                onChange={(e) => setRitSearch(e.target.value)}
                placeholder="Buscar ritual por nome, elemento ou círculo..."
                className="pl-9"
              />
            </div>
            <Select
              value={ritSourceFilter}
              onChange={(e) =>
                setRitSourceFilter(e.target.value as "todos" | ContentSource)
              }
              className="h-9 w-auto text-xs"
            >
              <option value="todos">Todas as Fontes</option>
              {OFFICIAL_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>
                  {SOURCE_LABELS[s.id]}
                </option>
              ))}
              {COMMUNITY_SOURCES.filter((s) =>
                (agent.enabledSources ?? []).includes(s.id)
              ).map((s) => (
                <option key={s.id} value={s.id}>
                  {SOURCE_LABELS[s.id]}
                </option>
              ))}
              <option value="homebrew">{SOURCE_LABELS.homebrew}</option>
            </Select>
            <button
              type="button"
              onClick={() => setShowRitSourcesPanel((v) => !v)}
              className={cn(
                "h-9 rounded-sm border px-2.5 font-mono text-[10px] transition-colors",
                showRitSourcesPanel
                  ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                  : "border-[#32323E] bg-[#141419] text-[#A1A1AA] hover:text-[#F4F4F5]"
              )}
            >
              {showRitSourcesPanel ? "Ocultar Fontes" : "Fontes & Suplementos"}
            </button>
          </div>
          {showRitSourcesPanel && (
            <div className="rounded-sm border border-[#22222A] bg-[#0C0C10] p-2.5">
              <SourceToggleGroup
                compact
                enabled={agent.enabledSources}
                onToggle={(src) =>
                  onUpdate((prev) => ({
                    ...prev,
                    enabledSources: toggleSourceList(prev.enabledSources, src),
                  }))
                }
                onSetCommunity={(on) =>
                  onUpdate((prev) => ({
                    ...prev,
                    enabledSources: setCommunityList(prev.enabledSources, on),
                  }))
                }
              />
            </div>
          )}
          <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
            {allLibraryRituals
              .filter((r) => {
                if (
                  ritSourceFilter !== "todos" &&
                  (r.source ?? "livro_basico") !== ritSourceFilter
                ) {
                  return false;
                }
                const q = ritSearch.trim().toLowerCase();
                if (!q) return true;
                return (
                  r.name.toLowerCase().includes(q) ||
                  r.element.toLowerCase().includes(q) ||
                  `${r.circle}º`.includes(q)
                );
              })
              .map((rit) => {
                const alreadyKnown = agent.rituals.some((x) => x.id === rit.id);
                const st = ELEMENT_STYLES[rit.element];
                const hasSup = hasSuperiorForm(rit);
                return (
                  <div
                    key={rit.id}
                    className={cn(
                      "flex items-start justify-between gap-3 rounded-md border border-[#22222A] border-l-[3px] bg-[#0D0D11] p-3.5",
                      st.borderLeft
                    )}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-sm font-bold text-[#F4F4F5]">
                          {rit.name}
                        </span>
                        <SourceBadge source={rit.source} />
                        {rit.isCorrentesDaRealidade && (
                          <Badge
                            variant="purple"
                            className="font-mono text-[9px]"
                          >
                            CORRENTES DA REALIDADE
                          </Badge>
                        )}
                        {hasSup && (
                          <Badge
                            variant="warning"
                            className="font-mono text-[9px]"
                          >
                            {rit.isSuperior ? "SUPERIOR" : "+ SUPERIOR"}
                          </Badge>
                        )}
                        <span
                          className={cn(
                            "rounded-sm border px-1.5 py-0.5 font-mono text-[10px]",
                            st.badge
                          )}
                        >
                          {rit.element}
                        </span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {rit.circle}ºC · {rit.peCost} PE
                        </Badge>
                      </div>
                      <p className="text-[13px] leading-relaxed text-[#A1A1AA]">
                        {rit.description}
                      </p>
                    </div>
                    <Button
                      size="xs"
                      variant={alreadyKnown ? "secondary" : "primary"}
                      disabled={alreadyKnown}
                      className="shrink-0"
                      onClick={() =>
                        onUpdate((prev) => ({
                          ...prev,
                          rituals: [rit, ...prev.rituals],
                        }))
                      }
                    >
                      {alreadyKnown ? (
                        <>
                          <Check className="h-3 w-3" /> Conhecido
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" /> Aprender
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
          </div>
        </div>
      </Modal>

      {/* ================= MODAL: CUSTO DO PARANORMAL ================= */}
      <Modal
        open={Boolean(costPrompt)}
        onClose={() => setCostPrompt(null)}
        title="Custo do Paranormal"
      >
        {costPrompt && (
          <div className="space-y-4">
            <div
              className={cn(
                "rounded-md border border-[#22222A] border-l-[3px] bg-[#0D0D11] p-4 space-y-1.5",
                ELEMENT_STYLES[costPrompt.element].borderLeft
              )}
            >
              <p className="font-display text-sm font-bold text-[#F4F4F5]">
                {costPrompt.ritualName} ({costPrompt.element})
              </p>
              <p className="font-mono text-xs text-[#D4D4D8]">
                Teste de Ocultismo contra DT {costPrompt.dt} (20 +{" "}
                {costPrompt.peSpent} PE gastos)
              </p>
              <p className="text-xs leading-relaxed text-[#8E8E9E]">
                Falha: perde {costPrompt.peSpent} {resUnit === "PD" ? "PD" : "SAN"}.
                Falha por 5 ou mais: também perde 1 SAN máxima permanentemente.
              </p>
            </div>

            {!costPrompt.rolled ? (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCostPrompt(null)}>
                  Ignorar
                </Button>
                <Button variant="primary" onClick={handleRollParanormalCost}>
                  <Dices className="h-4 w-4" /> Rolar Ocultismo (DT{" "}
                  {costPrompt.dt})
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className={cn(
                    "rounded-md border p-4 text-xs space-y-1.5",
                    costPrompt.rolled.passed
                      ? "border-emerald-500/40 bg-emerald-600/10 text-emerald-200"
                      : "border-red-500/50 bg-red-600/10 text-red-200"
                  )}
                >
                  <p className="font-mono text-base font-bold tabular-nums">
                    Resultado: {costPrompt.rolled.total} vs DT {costPrompt.dt}
                  </p>
                  <p className="leading-relaxed">{costPrompt.rolled.summary}</p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCostPrompt(null)}>
                    Fechar
                  </Button>
                  {!costPrompt.rolled.passed && !costPrompt.rolled.applied && (
                    <Button
                      variant="danger"
                      onClick={handleApplyParanormalCostLoss}
                    >
                      Aplicar -{costPrompt.rolled.sanLost}{" "}
                      {vitals.usingPd ? "PD" : "SAN"}
                      {costPrompt.rolled.permanentSanLost > 0
                        ? " (-1 SAN Máx.)"
                        : ""}
                    </Button>
                  )}
                  {costPrompt.rolled.applied && (
                    <Badge variant="danger">Perda aplicada na ficha</Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}
