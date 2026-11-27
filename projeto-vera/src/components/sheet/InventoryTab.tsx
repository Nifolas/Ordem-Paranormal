"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Backpack,
  Minus,
  Pill,
  Plus,
  RotateCcw,
  Search,
  Swords,
  Trash2,
  Weight,
  Wrench,
} from "lucide-react";
import type {
  Agent,
  AgentAttack,
  AppliedCurse,
  AppliedModification,
  InventoryItem,
  ItemCategory,
  ItemCategoryType,
} from "@/types/ordem";
import {
  BASE_CURSES,
  BASE_MODIFICATIONS,
  ITEM_CATEGORY_BY_KEY,
  ITEM_CATEGORY_META,
} from "@/data/equipment";
import {
  COMMUNITY_CURSES,
  COMMUNITY_MODIFICATIONS,
} from "@/data/supplements";
import { filterByEnabledSources } from "@/lib/sources";
import { SourceBadge } from "@/components/SourceToggles";
import {
  calculateItemFinalCategory,
  calculateLoadAndCategories,
  canAddCurseToItem,
  getAmmoShotsPerPack,
  getDefaultMagazineCapacity,
  getTrailCarryBonus,
  normalizeItemCategoryType,
} from "@/lib/ordem-rules";
import { cn, ELEMENT_STYLES, generateId } from "@/lib/utils";
import { ITEM_CATEGORY_VISUALS, getItemVisualIcon } from "@/lib/ui-icons";
import { TermTooltip } from "@/components/ui/TermTooltip";
import { useAppStore } from "@/store/useAppStore";
import { InventoryCatalogModal } from "./InventoryCatalogModal";
import { Badge, Button, Input, Modal } from "@/components/ui/primitives";

const ROMAN_CAT: Record<ItemCategory, string> = {
  0: "0",
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
};

export function InventoryTab({
  agent,
  onUpdate,
}: {
  agent: Agent;
  onUpdate: (updater: (prev: Agent) => Agent) => void;
}) {
  const { homebrew } = useAppStore();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"todos" | ItemCategoryType>(
    "todos"
  );
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [editingModsItemId, setEditingModsItemId] = useState<string | null>(
    null
  );
  const [curseError, setCurseError] = useState<string | null>(null);
  const [attackNotice, setAttackNotice] = useState<string | null>(null);

  const loadStats = calculateLoadAndCategories({
    forAttr: agent.attributes.FOR,
    patente: agent.patente,
    inventory: agent.inventory,
    extraCapacityBonus: getTrailCarryBonus(agent),
    organization: agent.organization,
  });

  const allModifications = useMemo(
    () => [
      ...(homebrew.modifications ?? []),
      ...filterByEnabledSources(COMMUNITY_MODIFICATIONS, agent.enabledSources),
      ...BASE_MODIFICATIONS,
    ],
    [homebrew.modifications, agent.enabledSources]
  );

  const allCurses = useMemo(
    () => [
      ...(homebrew.curses ?? []),
      ...filterByEnabledSources(COMMUNITY_CURSES, agent.enabledSources),
      ...BASE_CURSES,
    ],
    [homebrew.curses, agent.enabledSources]
  );

  const editingItem = useMemo(
    () => agent.inventory.find((i) => i.id === editingModsItemId) ?? null,
    [agent.inventory, editingModsItemId]
  );

  // Counts across all 9 standardized categories
  const countsByType = useMemo(() => {
    const counts: Record<ItemCategoryType, number> = {
      arma: 0,
      protecao: 0,
      municao: 0,
      acessorio: 0,
      explosivo: 0,
      operacional: 0,
      medicamento: 0,
      paranormal: 0,
      amaldicoado: 0,
    };
    for (const item of agent.inventory) {
      counts[normalizeItemCategoryType(item)]++;
    }
    return counts;
  }, [agent.inventory]);

  // Filtered & grouped into the 9 standardized categories
  const groupedInventory = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matching = agent.inventory.filter((item) => {
      const catKey = normalizeItemCategoryType(item);
      if (typeFilter !== "todos" && catKey !== typeFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        ITEM_CATEGORY_BY_KEY[catKey].label.toLowerCase().includes(q) ||
        (item.element?.toLowerCase().includes(q) ?? false)
      );
    });

    return ITEM_CATEGORY_META.map((meta) => ({
      meta,
      items: matching.filter(
        (it) => normalizeItemCategoryType(it) === meta.key
      ),
    })).filter((g) => g.items.length > 0);
  }, [agent.inventory, search, typeFilter]);

  const toggleModOnItem = (itemId: string, mod: AppliedModification) => {
    onUpdate((prev) => ({
      ...prev,
      inventory: prev.inventory.map((it) => {
        if (it.id !== itemId) return it;
        const current = it.modifications ?? [];
        const exists = current.some((m) => m.id === mod.id);
        return {
          ...it,
          modifications: exists
            ? current.filter((m) => m.id !== mod.id)
            : [...current, mod],
        };
      }),
    }));
  };

  const toggleCurseOnItem = (itemId: string, curse: AppliedCurse) => {
    const target = agent.inventory.find((i) => i.id === itemId);
    if (!target) return;
    const current = target.curses ?? [];
    const exists = current.some((c) => c.id === curse.id);
    if (!exists) {
      const check = canAddCurseToItem(current, curse.element);
      if (!check.allowed) {
        setCurseError(
          `Bloqueado: maldições de ${curse.element} são opressoras a ${check.conflictingElement} no mesmo item (Sangue ↔ Morte, Conhecimento ↔ Energia).`
        );
        return;
      }
    }
    setCurseError(null);
    onUpdate((prev) => ({
      ...prev,
      inventory: prev.inventory.map((it) => {
        if (it.id !== itemId) return it;
        const list = it.curses ?? [];
        return {
          ...it,
          curses: exists
            ? list.filter((c) => c.id !== curse.id)
            : [...list, curse],
        };
      }),
    }));
  };

  const adjustQuantity = (itemId: string, delta: number) => {
    onUpdate((prev) => ({
      ...prev,
      inventory: prev.inventory.map((i) =>
        i.id === itemId
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i
      ),
    }));
  };

  const consumeMedicineDose = (item: InventoryItem) => {
    const maxUses = item.maxUses ?? 2;
    const currentUses = item.currentUses ?? maxUses;
    if (currentUses <= 0) return;
    const nextUses = currentUses - 1;
    const gr = item.riskGrade ?? 0;

    onUpdate((prev) => ({
      ...prev,
      dailyMedicineUses: (prev.dailyMedicineUses ?? 0) + 1,
      dailyRiskGradeSum: (prev.dailyRiskGradeSum ?? 0) + gr,
      inventory: prev.inventory.map((i) =>
        i.id === item.id ? { ...i, currentUses: nextUses, maxUses } : i
      ),
    }));
  };

  const restoreMedicineDoses = (item: InventoryItem) => {
    const maxUses = item.maxUses ?? 2;
    onUpdate((prev) => ({
      ...prev,
      inventory: prev.inventory.map((i) =>
        i.id === item.id ? { ...i, currentUses: maxUses, maxUses } : i
      ),
    }));
  };

  const hasRiskMedicinesInInventory = useMemo(
    () =>
      agent.inventory.some(
        (i) => i.riskGrade !== undefined || i.maxUses !== undefined
      ) ||
      (agent.dailyMedicineUses ?? 0) > 0 ||
      (agent.dailyRiskGradeSum ?? 0) > 0 ||
      (agent.enabledSources ?? []).includes("grimorio_do_cataclisma"),
    [
      agent.inventory,
      agent.dailyMedicineUses,
      agent.dailyRiskGradeSum,
      agent.enabledSources,
    ]
  );

  const dailyUses = agent.dailyMedicineUses ?? 0;
  const dailyGrSum = agent.dailyRiskGradeSum ?? 0;
  const isOverdoseAlert = dailyUses >= 3 && dailyGrSum >= 7;

  const sendWeaponToCombat = (item: InventoryItem) => {
    const ammoInfo = getDefaultMagazineCapacity(item.name);
    const isRanged =
      ammoInfo.isRanged ||
      item.weaponSubtype === "Fogo" ||
      item.weaponSubtype === "Disparo" ||
      item.skill === "pontaria";
    const cap = ammoInfo.capacity > 0 ? ammoInfo.capacity : isRanged ? 12 : 0;

    const atk: AgentAttack = {
      id: generateId("atk"),
      name: item.name,
      skill: item.skill ?? (isRanged ? "pontaria" : "luta"),
      attackBonus: 0,
      damageFormula: item.damageFormula ?? "1d6",
      extraDamageFormula: "",
      extraDamageMultipliesOnCrit: false,
      damageType: item.damageType ?? "Corte",
      threatRange: item.threatRange ?? 20,
      critMultiplier: item.critMultiplier ?? 2,
      range: item.weaponRange ?? "Corpo a Corpo",
      notes: item.weaponGrip ?? "",
      ammoEnabled: isRanged,
      ammoCurrent: isRanged ? cap : undefined,
      ammoMax: isRanged ? cap : undefined,
      supportsBurst: ammoInfo.supportsBurst,
      burstMode: false,
    };
    onUpdate((prev) => ({ ...prev, attacks: [atk, ...prev.attacks] }));
    setAttackNotice(`"${item.name}" adicionado à aba Combate.`);
    window.setTimeout(() => setAttackNotice(null), 2800);
  };

  return (
    <div className="space-y-5">
      {/* Load & Category Limits Summary */}
      <div className="rounded-md border border-[#22222A] bg-[#0D0D11] p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E8E9E]">
              <Weight className="h-3 w-3 text-zinc-400" />
              Capacidade de Carga · FOR {agent.attributes.FOR} ·{" "}
              <TermTooltip term="Patente" label={agent.patente} />
            </span>
            <p className="font-mono text-sm text-[#F4F4F5] mt-0.5 tabular-nums">
              <strong>{loadStats.usedSpaces}</strong> / {loadStats.maxSpaces}{" "}
              espaços{" "}
              <span className="text-xs text-[#6E6E7E]">
                (máx. absoluto {loadStats.absoluteMaxSpaces})
              </span>
              {loadStats.extraCarry > 0 && (
                <span className="text-xs text-emerald-400">
                  {" "}
                  +{loadStats.extraCarry} bônus
                </span>
              )}
            </p>
          </div>

          {loadStats.exceedsAbsoluteMax ? (
            <Badge variant="danger" className="gap-1">
              <AlertTriangle className="h-3 w-3" /> Acima do Limite 2×
            </Badge>
          ) : loadStats.isOverloaded ? (
            <Badge variant="warning" className="gap-1">
              <AlertTriangle className="h-3 w-3" /> Sobrecarregado (-5
              Def/Carga, -3m)
            </Badge>
          ) : (
            <Badge variant="success">Carga Normal</Badge>
          )}
        </div>

        {/* Architectural Load Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-sm bg-[#1A1A22]">
          <div
            className={cn(
              "h-full transition-all",
              loadStats.exceedsAbsoluteMax
                ? "bg-[#DC2626]"
                : loadStats.isOverloaded
                ? "bg-[#D97706]"
                : "bg-[#F4F4F5]"
            )}
            style={{
              width: `${Math.min(
                100,
                (loadStats.usedSpaces /
                  Math.max(1, loadStats.absoluteMaxSpaces)) *
                  100
              )}%`,
            }}
          />
        </div>

        {/* Category Limits vs Patente */}
        <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-xs tabular-nums">
          {([1, 2, 3, 4] as const).map((cat) => {
            const count = loadStats.categoryCounts[cat];
            const limit = loadStats.categoryLimits[cat];
            const exceeded = loadStats.categoryExceeded[cat];
            return (
              <div
                key={cat}
                className={cn(
                  "rounded-sm border px-2.5 py-2 text-center",
                  exceeded
                    ? "border-red-500/50 bg-red-600/10 text-red-300"
                    : "border-[#22222A] bg-[#121217] text-[#D4D4D8]"
                )}
              >
                <span className="text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
                  <TermTooltip term="Categoria" label={`Cat ${ROMAN_CAT[cat]}`} />
                </span>
                <span className="font-bold">
                  {count}/{limit}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optional Daily G.R. (Grau de Risco) & Overdose Tracker */}
      {hasRiskMedicinesInInventory && (
        <div
          className={cn(
            "rounded-md border p-3.5 space-y-2 transition-colors",
            isOverdoseAlert
              ? "border-red-500/60 bg-red-950/20"
              : "border-[#22222A] bg-[#0D0D11]"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Pill className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4D4D8]">
                G.R. Consumido no Dia (Remédios)
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">
                USOS NO DIA: {dailyUses}
              </Badge>
              <Badge
                variant={isOverdoseAlert ? "danger" : "warning"}
                className="font-mono text-[10px]"
              >
                SOMA G.R.: {dailyGrSum}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <button
                type="button"
                onClick={() =>
                  onUpdate((prev) => ({
                    ...prev,
                    dailyMedicineUses: Math.max(
                      0,
                      (prev.dailyMedicineUses ?? 0) - 1
                    ),
                  }))
                }
                className="rounded-sm border border-[#22222A] bg-[#141419] px-2 py-0.5 text-[#A1A1AA] hover:text-[#F4F4F5]"
                title="Diminuir usos no dia"
              >
                -1 Uso
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdate((prev) => ({
                    ...prev,
                    dailyMedicineUses: (prev.dailyMedicineUses ?? 0) + 1,
                  }))
                }
                className="rounded-sm border border-[#22222A] bg-[#141419] px-2 py-0.5 text-[#A1A1AA] hover:text-[#F4F4F5]"
                title="Adicionar uso no dia"
              >
                +1 Uso
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdate((prev) => ({
                    ...prev,
                    dailyRiskGradeSum: Math.max(
                      0,
                      (prev.dailyRiskGradeSum ?? 0) - 1
                    ),
                  }))
                }
                className="rounded-sm border border-[#22222A] bg-[#141419] px-2 py-0.5 text-[#A1A1AA] hover:text-[#F4F4F5]"
                title="Diminuir G.R. acumulado"
              >
                -1 G.R.
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdate((prev) => ({
                    ...prev,
                    dailyRiskGradeSum: (prev.dailyRiskGradeSum ?? 0) + 1,
                  }))
                }
                className="rounded-sm border border-[#22222A] bg-[#141419] px-2 py-0.5 text-[#A1A1AA] hover:text-[#F4F4F5]"
                title="Somar +1 G.R."
              >
                +1 G.R.
              </button>
              {(dailyUses > 0 || dailyGrSum > 0) && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdate((prev) => ({
                      ...prev,
                      dailyMedicineUses: 0,
                      dailyRiskGradeSum: 0,
                    }))
                  }
                  className="inline-flex items-center gap-1 rounded-sm border border-[#22222A] bg-[#141419] px-2 py-0.5 text-[#8E8E9E] hover:text-[#F4F4F5]"
                  title="Zerar contador diário de G.R."
                >
                  <RotateCcw className="h-2.5 w-2.5" /> Zerar Dia
                </button>
              )}
            </div>
          </div>

          {isOverdoseAlert ? (
            <div className="flex items-center gap-2 rounded-sm border border-red-500/50 bg-red-600/15 px-3 py-1.5 text-xs text-red-200 font-mono">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
              <span>
                <strong>ALERTA DE OVERDOSE:</strong> {dailyUses} usos no dia e
                soma de G.R. = {dailyGrSum} (&ge; 3 usos e G.R. &ge; 7). Exige
                teste de Fortitude contra Overdose!
              </span>
            </div>
          ) : (
            <p className="font-mono text-[10px] text-[#8E8E9E]">
              Regra de Remédios (Grimório do Cataclisma): consumir 3 ou mais
              doses no mesmo dia cuja soma de Grau de Risco (G.R.) seja &ge; 7
              exige teste contra Overdose.
            </p>
          )}
        </div>
      )}

      {/* Search + Add Item Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6E6E7E]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar itens do inventário..."
            className="h-9 pl-9 text-xs"
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCatalogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar Item
        </Button>
      </div>

      {/* 9-Type Filter Pills */}
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => setTypeFilter("todos")}
          className={cn(
            "rounded-sm border px-2.5 py-1 text-[11px] font-medium transition-colors",
            typeFilter === "todos"
              ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
              : "border-[#22222A] bg-[#0D0D11] text-[#8E8E9E] hover:text-[#D4D4D8]"
          )}
        >
          Todos{" "}
          <span className="font-mono text-[10px] opacity-75">
            ({agent.inventory.length})
          </span>
        </button>

        {ITEM_CATEGORY_META.map((cat) => {
          const count = countsByType[cat.key];
          const active = typeFilter === cat.key;
          const vis = ITEM_CATEGORY_VISUALS[cat.key];
          const CatIcon = vis.icon;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setTypeFilter(cat.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                  : count > 0
                  ? "border-[#22222A] bg-[#0D0D11] text-[#D4D4D8] hover:border-[#32323E]"
                  : "border-[#1A1A22] bg-[#0B0B0F] text-[#52525E] hover:text-[#8E8E9E]"
              )}
            >
              <CatIcon className={cn("h-3 w-3", count > 0 || active ? "opacity-90" : "text-[#52525E]")} />
              {cat.shortLabel}{" "}
              <span className="font-mono text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {attackNotice && (
        <div className="rounded-sm border border-emerald-500/40 bg-emerald-600/10 px-3.5 py-2 text-xs text-emerald-300">
          {attackNotice}
        </div>
      )}

      {/* Grouped 9-Category Inventory List */}
      {groupedInventory.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2A2A35] bg-[#0C0C10]/90 p-10 text-center flex flex-col items-center justify-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Backpack className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-md">
            <p className="text-sm font-semibold text-[#F4F4F5]">
              {agent.inventory.length === 0
                ? "Sua mochila de campo ainda está vazia"
                : "Nenhum item encontrado nesta categoria"}
            </p>
            <p className="text-xs text-[#8E8E9E] leading-relaxed">
              Adicione armas, coletes, kits de perícia, medicamentos ou itens amaldiçoados. O sistema calcula automaticamente seus espaços de carga e limites de Patente.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCatalogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar Primeiro Item
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedInventory.map(({ meta, items }) => {
            const catVis = ITEM_CATEGORY_VISUALS[meta.key];
            const CatHeaderIcon = catVis.icon;
            return (
            <div key={meta.key}>
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-md border", catVis.iconBoxCls)}>
                    <CatHeaderIcon className="h-3.5 w-3.5" />
                  </span>
                  <h3 className="font-display text-sm font-bold tracking-tight text-zinc-100">
                    {meta.label}
                  </h3>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 tabular-nums">
                    {items.length}
                  </span>
                </div>
                <span className="hidden sm:inline font-mono text-[10px] text-zinc-400">
                  {Number(
                    items
                      .reduce((s, it) => s + it.spaces * Math.max(1, it.quantity), 0)
                      .toFixed(1)
                  )}{" "}
                  esp.
                </span>
              </div>

              <div className="space-y-2.5">
                {items.map((item) => {
                  const finalCat = calculateItemFinalCategory(item, agent.organization);
                  const modCount = item.modifications?.length ?? 0;
                  const curseCount = item.curses?.length ?? 0;
                  const accentElement =
                    item.element ?? item.curses?.[0]?.element;
                  const elemStyle = accentElement
                    ? ELEMENT_STYLES[accentElement]
                    : null;
                  const catKey = normalizeItemCategoryType(item);
                  const ItemRowIcon = getItemVisualIcon(item);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-md border border-[#22222A] bg-[#0D0D11] hover:border-[#32323E] px-4 py-3.5 space-y-2 transition-colors",
                        elemStyle && cn("border-l-[3px]", elemStyle.borderLeft)
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                                catVis.iconBoxCls
                              )}
                            >
                              <ItemRowIcon className="h-3.5 w-3.5" />
                            </span>
                            <span className="font-display text-sm font-bold text-[#F4F4F5]">
                              {item.name}
                            </span>
                            {item.element && elemStyle && (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
                                  elemStyle.badge
                                )}
                              >
                                <span
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    elemStyle.dot
                                  )}
                                />
                                {item.element}
                              </span>
                            )}
                            <Badge
                              variant={
                                finalCat > item.category ? "warning" : "outline"
                              }
                              className="font-mono text-[10px]"
                            >
                              CAT {ROMAN_CAT[finalCat]}
                              {finalCat !== item.category &&
                                ` (base ${ROMAN_CAT[item.category]})`}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px]"
                            >
                              {Number(
                                (item.spaces * Math.max(1, item.quantity)).toFixed(
                                  1
                                )
                              )}{" "}
                              ESP.
                            </Badge>
                            {item.damageFormula && (
                              <Badge
                                variant="outline"
                                className="font-mono text-[10px] text-[#D4D4D8]"
                              >
                                {item.damageFormula} · {item.threatRange ?? 20}
                                /×{item.critMultiplier ?? 2}
                              </Badge>
                            )}
                            {item.defenseBonus ? (
                              <Badge
                                variant="success"
                                className="font-mono text-[10px]"
                              >
                                +{item.defenseBonus} DEF
                              </Badge>
                            ) : null}
                            {catKey === "municao" && (
                              <Badge
                                variant="warning"
                                className="font-mono text-[10px]"
                              >
                                {item.ammoShotsRemaining !== undefined
                                  ? `${item.ammoShotsRemaining} DISP.`
                                  : `${
                                      Math.max(1, item.quantity) *
                                      getAmmoShotsPerPack(item.name)
                                    } DISP.`}
                              </Badge>
                            )}
                            {item.carryBonus ? (
                              <Badge
                                variant="success"
                                className="font-mono text-[10px]"
                              >
                                +{item.carryBonus} CARGA
                              </Badge>
                            ) : null}
                            {item.maxUses !== undefined && (
                              <Badge
                                variant={
                                  (item.currentUses ?? item.maxUses) === 0
                                    ? "danger"
                                    : "outline"
                                }
                                className="font-mono text-[10px] text-sky-300 border-sky-500/40"
                              >
                                Usos ({item.currentUses ?? item.maxUses}/
                                {item.maxUses})
                              </Badge>
                            )}
                            {item.riskGrade !== undefined && (
                              <Badge
                                variant="warning"
                                className="font-mono text-[10px]"
                              >
                                G.R. {item.riskGrade}
                              </Badge>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-[13px] leading-relaxed text-[#A1A1AA]">
                              {item.description}
                            </p>
                          )}

                          {(modCount > 0 || curseCount > 0) && (
                            <div className="pt-1 flex flex-wrap gap-1.5">
                              {item.modifications?.map((m) => (
                                <Badge
                                  key={m.id}
                                  variant="outline"
                                  className="font-mono text-[10px] text-[#D4D4D8] border-[#32323E] bg-[#16161C]"
                                >
                                  MOD · {m.name}
                                </Badge>
                              ))}
                              {item.curses?.map((c) => (
                                <span
                                  key={c.id}
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium",
                                    ELEMENT_STYLES[c.element].badge
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "h-1.5 w-1.5 rounded-full",
                                      ELEMENT_STYLES[c.element].dot
                                    )}
                                  />
                                  {c.name} ({c.element})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Item Action Controls */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          {/* Medicine Usos (2/2) quick controls */}
                          {item.maxUses !== undefined && (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => consumeMedicineDose(item)}
                                disabled={
                                  (item.currentUses ?? item.maxUses) <= 0
                                }
                                className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-2 py-1 font-mono text-[10px] text-amber-200 hover:bg-amber-500/20 disabled:opacity-35"
                                title="Consumir 1 dose deste medicamento e somar o G.R. no contador diário"
                              >
                                Usar Dose (
                                {item.currentUses ?? item.maxUses}/
                                {item.maxUses})
                              </button>
                              {(item.currentUses ?? item.maxUses) <
                                item.maxUses && (
                                <button
                                  type="button"
                                  onClick={() => restoreMedicineDoses(item)}
                                  className="rounded-sm border border-[#22222A] bg-[#141419] p-1 text-[#8E8E9E] hover:text-[#F4F4F5]"
                                  title="Restaurar usos (2/2)"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Quantity stepper */}
                          <div className="inline-flex items-center rounded-sm border border-[#22222A] bg-[#121217] font-mono text-[11px]">
                            <button
                              type="button"
                              onClick={() => adjustQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                              className="px-1.5 py-1 text-[#8E8E9E] hover:text-[#F4F4F5] disabled:opacity-35"
                              title="Diminuir quantidade"
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </button>
                            <span className="px-1.5 text-[#F4F4F5] tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => adjustQuantity(item.id, 1)}
                              className="px-1.5 py-1 text-[#8E8E9E] hover:text-[#F4F4F5]"
                              title="Aumentar quantidade"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          </div>

                          {catKey === "arma" && item.damageFormula && (
                            <button
                              type="button"
                              onClick={() => sendWeaponToCombat(item)}
                              title="Enviar arma para a aba Combate (Ataques)"
                              className="rounded-sm border border-[#22222A] bg-[#141419] p-1.5 text-[#8E8E9E] hover:border-[#32323E] hover:text-[#F4F4F5] transition-colors"
                            >
                              <Swords className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setCurseError(null);
                              setEditingModsItemId(item.id);
                            }}
                            title="Modificações & Maldições"
                            className="rounded-sm border border-[#22222A] bg-[#141419] p-1.5 text-[#8E8E9E] hover:border-[#32323E] hover:text-[#F4F4F5] transition-colors"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onUpdate((prev) => ({
                                ...prev,
                                inventory: prev.inventory.map((i) =>
                                  i.id === item.id
                                    ? { ...i, equipped: !i.equipped }
                                    : i
                                ),
                              }))
                            }
                            className={cn(
                              "rounded-sm border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
                              item.equipped
                                ? "border-emerald-500/40 bg-emerald-600/10 text-emerald-300"
                                : "border-[#22222A] bg-[#141419] text-[#8E8E9E] hover:border-[#32323E] hover:text-[#D4D4D8]"
                            )}
                          >
                            {item.equipped ? "Equipado" : "Equipar"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onUpdate((prev) => ({
                                ...prev,
                                inventory: prev.inventory.filter(
                                  (i) => i.id !== item.id
                                ),
                              }))
                            }
                            className="rounded-sm p-1.5 text-[#6E6E7E] hover:bg-[#16161C] hover:text-red-400 transition-colors"
                            title="Remover item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* 2-Column 9-Category Catalog Modal */}
      <InventoryCatalogModal
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        agent={agent}
        onUpdate={onUpdate}
        initialTab={typeFilter === "todos" ? "todos" : typeFilter}
      />

      {/* Modal: Modificações & Maldições */}
      <Modal
        open={Boolean(editingItem)}
        onClose={() => {
          setEditingModsItemId(null);
          setCurseError(null);
        }}
        title={
          editingItem
            ? `Modificações & Maldições — ${editingItem.name}`
            : "Modificações & Maldições"
        }
        maxWidth="max-w-3xl"
      >
        {editingItem && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#22222A] bg-[#0D0D11] px-4 py-2.5 font-mono text-xs tabular-nums">
              <span className="text-[#A1A1AA]">
                BASE: CAT {ROMAN_CAT[editingItem.category]} · MODS:{" "}
                {editingItem.modifications?.length ?? 0} · MALDIÇÕES:{" "}
                {editingItem.curses?.length ?? 0}
              </span>
              <Badge variant="warning">
                CATEGORIA FINAL:{" "}
                {ROMAN_CAT[
                  calculateItemFinalCategory(editingItem, agent.organization)
                ]}
              </Badge>
            </div>

            {curseError && (
              <div className="rounded-sm border border-red-500/50 bg-red-600/10 p-3 text-xs text-red-300">
                {curseError}
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E8E9E]">
                Modificações (+1 Categoria cada · {allModifications.length}{" "}
                disponíveis)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {allModifications.map((mod) => {
                  const active = (editingItem.modifications ?? []).some(
                    (m) => m.id === mod.id
                  );
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() =>
                        toggleModOnItem(editingItem.id, {
                          id: mod.id,
                          name: mod.name,
                          description: mod.description,
                        })
                      }
                      className={cn(
                        "rounded-sm border p-2.5 text-left transition-colors",
                        active
                          ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                          : "border-[#22222A] bg-[#0D0D11] text-[#D4D4D8] hover:border-[#32323E]"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-semibold truncate">
                            {mod.name}
                          </span>
                          <SourceBadge source={mod.source} />
                        </div>
                        <span className="font-mono text-[9px] uppercase text-[#6E6E7E] shrink-0">
                          {mod.appliesTo}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8E8E9E] mt-1 leading-snug">
                        {mod.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E8E9E]">
                Maldições (+2 Cat na 1ª, +1 nas demais · Bloqueia Sangue↔Morte e
                Conhecimento↔Energia)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {allCurses.map((curse) => {
                  const active = (editingItem.curses ?? []).some(
                    (c) => c.id === curse.id
                  );
                  const st = ELEMENT_STYLES[curse.element];
                  return (
                    <button
                      key={curse.id}
                      type="button"
                      onClick={() =>
                        toggleCurseOnItem(editingItem.id, {
                          id: curse.id,
                          name: curse.name,
                          element: curse.element,
                          description: curse.description,
                        })
                      }
                      className={cn(
                        "rounded-sm border border-l-[3px] p-2.5 text-left transition-colors",
                        st.borderLeft,
                        active
                          ? st.badge
                          : "border-[#22222A] bg-[#0D0D11] text-[#D4D4D8] hover:border-[#32323E]"
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-semibold truncate">
                            {curse.name}
                          </span>
                          <SourceBadge source={curse.source} />
                        </div>
                        <span className="font-mono text-[9px] uppercase shrink-0">
                          {curse.element}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-80 mt-1 leading-snug">
                        {curse.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#22222A]">
              <Button
                variant="primary"
                onClick={() => {
                  setEditingModsItemId(null);
                  setCurseError(null);
                }}
              >
                Concluir
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
