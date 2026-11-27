"use client";

import React, { useMemo, useState } from "react";
import {
  Check,
  Layers,
  Plus,
  Search,
  Swords,
} from "lucide-react";
import type {
  Agent,
  AgentAttack,
  ContentSource,
  InventoryItem,
  ItemCategory,
  ItemCategoryType,
  ParanormalElement,
} from "@/types/ordem";
import {
  BASE_ITEMS,
  ITEM_CATEGORY_BY_KEY,
  ITEM_CATEGORY_META,
} from "@/data/equipment";
import { COMMUNITY_ITEMS } from "@/data/supplements";
import { normalizeItemCategoryType } from "@/lib/ordem-rules";
import {
  COMMUNITY_SOURCES,
  OFFICIAL_SOURCES,
  SOURCE_LABELS,
  filterByEnabledSources,
} from "@/lib/sources";
import {
  SourceBadge,
  SourceToggleGroup,
  setCommunityList,
  toggleSourceList,
} from "@/components/SourceToggles";
import { cn, ELEMENT_STYLES, generateId } from "@/lib/utils";
import { ITEM_CATEGORY_VISUALS, getItemVisualIcon } from "@/lib/ui-icons";
import { TermTooltip } from "@/components/ui/TermTooltip";
import { useAppStore } from "@/store/useAppStore";
import {
  Badge,
  Button,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui/primitives";

type CatalogTab = "todos" | ItemCategoryType | "custom";

const ROMAN_CAT: Record<ItemCategory, string> = {
  0: "0",
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
};

const ELEMENTS: ParanormalElement[] = [
  "Sangue",
  "Morte",
  "Conhecimento",
  "Energia",
  "Medo",
  "Variável",
];

export function InventoryCatalogModal({
  open,
  onClose,
  agent,
  onUpdate,
  initialTab = "todos",
}: {
  open: boolean;
  onClose: () => void;
  agent: Agent;
  onUpdate: (updater: (prev: Agent) => Agent) => void;
  initialTab?: CatalogTab;
}) {
  const { homebrew } = useAppStore();

  const [activeTab, setActiveTab] = useState<CatalogTab>(initialTab);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"todos" | ContentSource>(
    "todos"
  );
  const [showSourcesPanel, setShowSourcesPanel] = useState(false);
  const [weaponProfFilter, setWeaponProfFilter] = useState<
    "Todas" | "Simples" | "Tática" | "Pesada"
  >("Todas");
  const [elementFilter, setElementFilter] = useState<
    "Todos" | ParanormalElement
  >("Todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [alsoAddAttack, setAlsoAddAttack] = useState<boolean>(true);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Custom item form state
  const [customItem, setCustomItem] = useState<Omit<InventoryItem, "id">>({
    name: "",
    type: "operacional",
    category: 0,
    spaces: 1,
    quantity: 1,
    equipped: false,
    description: "",
    defenseBonus: 0,
    rdBonus: 0,
    isShield: false,
    carryBonus: 0,
    element: undefined,
    modifications: [],
    curses: [],
    source: "homebrew",
  });

  const allLibraryItems = useMemo(
    () => [
      ...homebrew.weapons,
      ...homebrew.items,
      ...filterByEnabledSources(COMMUNITY_ITEMS, agent.enabledSources),
      ...BASE_ITEMS,
    ],
    [homebrew.weapons, homebrew.items, agent.enabledSources]
  );

  // Counts per standardized category
  const categoryCounts = useMemo(() => {
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
    for (const item of allLibraryItems) {
      counts[normalizeItemCategoryType(item)]++;
    }
    return counts;
  }, [allLibraryItems]);

  const filteredItems = useMemo(() => {
    if (activeTab === "custom") return [];
    const q = search.trim().toLowerCase();
    return allLibraryItems.filter((item) => {
      const catKey = normalizeItemCategoryType(item);
      if (activeTab !== "todos" && catKey !== activeTab) return false;
      if (
        sourceFilter !== "todos" &&
        (item.source ?? "livro_basico") !== sourceFilter
      ) {
        return false;
      }
      if (
        activeTab === "arma" &&
        weaponProfFilter !== "Todas" &&
        item.weaponCategory !== weaponProfFilter
      ) {
        return false;
      }
      if (
        activeTab === "amaldicoado" &&
        elementFilter !== "Todos" &&
        item.element !== elementFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        ITEM_CATEGORY_BY_KEY[catKey].label.toLowerCase().includes(q) ||
        (item.element?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [
    allLibraryItems,
    activeTab,
    search,
    sourceFilter,
    weaponProfFilter,
    elementFilter,
  ]);

  const selectedItem = useMemo(() => {
    if (filteredItems.length === 0) return null;
    return (
      filteredItems.find((it) => it.id === selectedId) ?? filteredItems[0]
    );
  }, [filteredItems, selectedId]);

  const handleAddSelected = () => {
    if (!selectedItem) return;
    const catKey = normalizeItemCategoryType(selectedItem);
    const created: InventoryItem = {
      ...selectedItem,
      id: generateId("inv"),
      type: catKey,
      quantity: Math.max(1, addQuantity),
      equipped: false,
      modifications: [],
      curses: [],
    };

    const attackToAdd: AgentAttack | null =
      catKey === "arma" && alsoAddAttack && selectedItem.damageFormula
        ? {
            id: generateId("atk"),
            name: selectedItem.name,
            skill: selectedItem.skill ?? "luta",
            attackBonus: 0,
            damageFormula: selectedItem.damageFormula,
            extraDamageFormula: "",
            extraDamageMultipliesOnCrit: false,
            damageType: selectedItem.damageType ?? "Corte",
            threatRange: selectedItem.threatRange ?? 20,
            critMultiplier: selectedItem.critMultiplier ?? 2,
            range: selectedItem.weaponRange ?? "Corpo a Corpo",
            notes: selectedItem.weaponGrip ?? "",
          }
        : null;

    onUpdate((prev) => ({
      ...prev,
      inventory: [created, ...prev.inventory],
      attacks: attackToAdd ? [attackToAdd, ...prev.attacks] : prev.attacks,
    }));

    setJustAddedId(selectedItem.id);
    window.setTimeout(() => setJustAddedId(null), 1600);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItem.name.trim()) return;
    const created: InventoryItem = {
      ...customItem,
      id: generateId("inv"),
      name: customItem.name.trim(),
      quantity: Math.max(1, customItem.quantity || 1),
    };
    onUpdate((prev) => ({
      ...prev,
      inventory: [created, ...prev.inventory],
    }));
    setCustomItem({
      name: "",
      type: "operacional",
      category: 0,
      spaces: 1,
      quantity: 1,
      equipped: false,
      description: "",
      defenseBonus: 0,
      rdBonus: 0,
      isShield: false,
      carryBonus: 0,
      element: undefined,
      modifications: [],
      curses: [],
      source: "homebrew",
    });
    onClose();
  };

  const selectedCatKey = selectedItem
    ? normalizeItemCategoryType(selectedItem)
    : null;
  const selectedElemStyle = selectedItem?.element
    ? ELEMENT_STYLES[selectedItem.element]
    : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Catálogo de Equipamentos & Itens"
      description="Selecione por tipo de item (9 categorias oficiais) ou crie um equipamento customizado."
      maxWidth="max-w-5xl"
      heightClass="h-[84vh]"
      noPadding
    >
      <div className="flex flex-col h-full min-h-0">
        {/* Top Category Tabs Strip */}
        <div className="shrink-0 border-b border-[#22222A] bg-[#0C0C10] px-4 py-2.5 space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab("todos");
                setSelectedId(null);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-medium transition-colors",
                activeTab === "todos"
                  ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                  : "border-[#22222A] bg-[#101014] text-[#8E8E9E] hover:text-[#D4D4D8]"
              )}
            >
              <Layers className="h-3.5 w-3.5 text-zinc-400" />
              Todos{" "}
              <span className="font-mono text-[10px] opacity-75">
                ({allLibraryItems.length})
              </span>
            </button>

            {ITEM_CATEGORY_META.map((cat) => {
              const active = activeTab === cat.key;
              const vis = ITEM_CATEGORY_VISUALS[cat.key];
              const CatIcon = vis.icon;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(cat.key);
                    setSelectedId(null);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    active
                      ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                      : "border-[#22222A] bg-[#101014] text-[#8E8E9E] hover:text-[#D4D4D8]"
                  )}
                >
                  <CatIcon className="h-3.5 w-3.5 opacity-85" />
                  {cat.shortLabel}{" "}
                  <span className="font-mono text-[10px] opacity-70">
                    ({categoryCounts[cat.key]})
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={cn(
                "ml-auto inline-flex items-center gap-1 rounded-sm border px-2.5 py-1 font-mono text-[11px] font-medium transition-colors",
                activeTab === "custom"
                  ? "border-[#F4F4F5] bg-[#F4F4F5] text-[#09090B]"
                  : "border-[#32323E] bg-[#141419] text-[#D4D4D8] hover:border-[#F4F4F5]"
              )}
            >
              <Plus className="h-3 w-3" /> Criar Custom
            </button>
          </div>

          {/* Search & contextual sub-filters */}
          {activeTab !== "custom" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6E6E7E]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar item por nome, efeito ou elemento..."
                  className="h-8 pl-8 text-xs"
                />
              </div>

              <Select
                value={sourceFilter}
                onChange={(e) =>
                  setSourceFilter(e.target.value as "todos" | ContentSource)
                }
                className="h-8 w-auto text-xs"
              >
                <option value="todos">Todos os Livros</option>
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
                onClick={() => setShowSourcesPanel((v) => !v)}
                className={cn(
                  "h-8 rounded-sm border px-2.5 font-mono text-[10px] transition-colors",
                  showSourcesPanel
                    ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                    : "border-[#32323E] bg-[#141419] text-[#A1A1AA] hover:text-[#F4F4F5]"
                )}
              >
                {showSourcesPanel ? "Ocultar Fontes" : "Fontes & Suplementos"}
              </button>

              {activeTab === "arma" && (
                <Select
                  value={weaponProfFilter}
                  onChange={(e) =>
                    setWeaponProfFilter(
                      e.target.value as "Todas" | "Simples" | "Tática" | "Pesada"
                    )
                  }
                  className="h-8 w-auto text-xs"
                >
                  <option value="Todas">Todas Proficiências</option>
                  <option value="Simples">Simples</option>
                  <option value="Tática">Tática</option>
                  <option value="Pesada">Pesada</option>
                </Select>
              )}

              {activeTab === "amaldicoado" && (
                <Select
                  value={elementFilter}
                  onChange={(e) =>
                    setElementFilter(
                      e.target.value as "Todos" | ParanormalElement
                    )
                  }
                  className="h-8 w-auto text-xs"
                >
                  <option value="Todos">Todos Elementos</option>
                  {ELEMENTS.map((el) => (
                    <option key={el} value={el}>
                      {el}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          )}
          {activeTab !== "custom" && showSourcesPanel && (
            <div className="rounded-sm border border-[#22222A] bg-[#101014] p-2.5">
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
        </div>

        {/* Body: Custom Form OR 2-Column Master-Detail */}
        {activeTab === "custom" ? (
          <form
            onSubmit={handleCreateCustom}
            className="flex-1 overflow-y-auto p-6 space-y-4 max-w-2xl"
          >
            <div>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#F4F4F5]">
                Criar Equipamento Customizado
              </h3>
              <p className="text-xs text-[#8E8E9E] mt-0.5">
                Escolha uma das 9 categorias oficiais para manter o inventário
                organizado.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Nome do Item *
                </label>
                <Input
                  required
                  value={customItem.name}
                  onChange={(e) =>
                    setCustomItem({ ...customItem, name: e.target.value })
                  }
                  placeholder="Ex: Revólver Tático, Maleta de Perícia, Relíquia..."
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Tipo de Item (Categoria)
                </label>
                <Select
                  value={customItem.type}
                  onChange={(e) =>
                    setCustomItem({
                      ...customItem,
                      type: e.target.value as ItemCategoryType,
                    })
                  }
                >
                  {ITEM_CATEGORY_META.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.index} · {cat.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Categoria de Patente
                </label>
                <Select
                  value={customItem.category}
                  onChange={(e) =>
                    setCustomItem({
                      ...customItem,
                      category: Number(e.target.value) as ItemCategory,
                    })
                  }
                  className="font-mono"
                >
                  {[0, 1, 2, 3, 4].map((c) => (
                    <option key={c} value={c}>
                      Categoria {ROMAN_CAT[c as ItemCategory]}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Espaços
                </label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={customItem.spaces}
                  onChange={(e) =>
                    setCustomItem({
                      ...customItem,
                      spaces: Number(e.target.value) || 0,
                    })
                  }
                  className="font-mono"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Quantidade
                </label>
                <Input
                  type="number"
                  min={1}
                  value={customItem.quantity}
                  onChange={(e) =>
                    setCustomItem({
                      ...customItem,
                      quantity: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className="font-mono"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Bônus Defesa
                </label>
                <Input
                  type="number"
                  value={customItem.defenseBonus ?? 0}
                  onChange={(e) =>
                    setCustomItem({
                      ...customItem,
                      defenseBonus: Number(e.target.value) || 0,
                    })
                  }
                  className="font-mono"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Bônus Carga (Espaços)
                </label>
                <Input
                  type="number"
                  value={customItem.carryBonus ?? 0}
                  onChange={(e) =>
                    setCustomItem({
                      ...customItem,
                      carryBonus: Number(e.target.value) || 0,
                    })
                  }
                  className="font-mono"
                />
              </div>

              {customItem.type === "amaldicoado" && (
                <div className="sm:col-span-2">
                  <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                    Elemento Paranormal
                  </label>
                  <Select
                    value={customItem.element ?? "Sangue"}
                    onChange={(e) =>
                      setCustomItem({
                        ...customItem,
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
              )}
            </div>

            {customItem.type === "protecao" && (
              <label className="inline-flex items-center gap-2 text-xs text-[#D4D4D8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(customItem.isShield)}
                  onChange={(e) =>
                    setCustomItem({ ...customItem, isShield: e.target.checked })
                  }
                />
                Tratar como Escudo (acumula bônus de Defesa com Proteção)
              </label>
            )}

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Descrição & Regras
              </label>
              <Textarea
                rows={4}
                value={customItem.description}
                onChange={(e) =>
                  setCustomItem({ ...customItem, description: e.target.value })
                }
                placeholder="Descreva propriedades, bônus em perícias ou efeitos paranormais..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#22222A]">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                <Plus className="h-3.5 w-3.5" /> Adicionar Item Customizado
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[310px_minmax(0,1fr)] divide-y md:divide-y-0 md:divide-x divide-[#22222A]">
            {/* Left Master List */}
            <div className="overflow-y-auto p-3 space-y-1 bg-[#0B0B0F]">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#6E6E7E]">
                  Nenhum item encontrado com esses filtros.
                </div>
              ) : (
                filteredItems.map((item) => {
                  const catKey = normalizeItemCategoryType(item);
                  const active = selectedItem?.id === item.id;
                  const elStyle = item.element
                    ? ELEMENT_STYLES[item.element]
                    : null;
                  const ItemIcon = getItemVisualIcon(item);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(item.id);
                        setAddQuantity(1);
                      }}
                      className={cn(
                        "w-full rounded-sm border px-3 py-2.5 text-left transition-colors",
                        elStyle && cn("border-l-[3px]", elStyle.borderLeft),
                        active
                          ? "border-[#F4F4F5] bg-[#16161C]"
                          : "border-[#1C1C24] bg-[#101014] hover:border-[#32323E]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <ItemIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                          <span className="text-xs font-semibold text-[#F4F4F5] leading-snug">
                            {item.name}
                          </span>
                          <SourceBadge source={item.source} />
                        </div>
                        <span className="shrink-0 font-mono text-[10px] text-[#8E8E9E] tabular-nums">
                          <TermTooltip term="Categoria" label={`CAT ${ROMAN_CAT[item.category]}`} />
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap font-mono text-[10px] text-[#6E6E7E]">
                        <span>{ITEM_CATEGORY_BY_KEY[catKey].singular}</span>
                        <span>·</span>
                        <span>{item.spaces} esp.</span>
                        {item.damageFormula && (
                          <>
                            <span>·</span>
                            <span className="text-[#D4D4D8]">
                              {item.damageFormula}
                            </span>
                          </>
                        )}
                        {item.defenseBonus ? (
                          <>
                            <span>·</span>
                            <span className="text-emerald-400">
                              +{item.defenseBonus} DEF
                            </span>
                          </>
                        ) : null}
                        {item.maxUses !== undefined && (
                          <>
                            <span>·</span>
                            <span className="text-sky-300">
                              Usos ({item.currentUses ?? item.maxUses}/
                              {item.maxUses})
                            </span>
                          </>
                        )}
                        {item.riskGrade !== undefined && (
                          <>
                            <span>·</span>
                            <span className="text-amber-300">
                              G.R. {item.riskGrade}
                            </span>
                          </>
                        )}
                        {item.element && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1",
                              elStyle?.text
                            )}
                          >
                            · {item.element}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Right Detail Panel */}
            <div className="flex flex-col min-h-0 bg-[#101014]">
              {selectedItem && selectedCatKey ? (
                <>
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    <div
                      className={cn(
                        "space-y-2 pb-4 border-b border-[#22222A]",
                        selectedElemStyle &&
                          cn("border-l-[3px] pl-3.5", selectedElemStyle.borderLeft)
                      )}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {ITEM_CATEGORY_BY_KEY[selectedCatKey].index} //{" "}
                          {ITEM_CATEGORY_BY_KEY[selectedCatKey].label.toUpperCase()}
                        </Badge>
                        {selectedItem.element && selectedElemStyle && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
                              selectedElemStyle.badge
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                selectedElemStyle.dot
                              )}
                            />
                            {selectedItem.element}
                          </span>
                        )}
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {SOURCE_LABELS[selectedItem.source ?? "livro_basico"]}
                        </Badge>
                      </div>

                      <h3 className="font-display text-xl font-bold text-[#F4F4F5]">
                        {selectedItem.name}
                      </h3>
                    </div>

                    {/* Technical Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                      <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-3">
                        <span className="text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
                          Categoria
                        </span>
                        <span className="text-sm font-bold text-[#F4F4F5]">
                          Cat {ROMAN_CAT[selectedItem.category]}
                        </span>
                      </div>
                      <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-3">
                        <span className="text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
                          Espaços
                        </span>
                        <span className="text-sm font-bold text-[#F4F4F5] tabular-nums">
                          {selectedItem.spaces}
                        </span>
                      </div>
                      {selectedItem.damageFormula && (
                        <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-3">
                          <span className="text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
                            Dano / Crítico
                          </span>
                          <span className="text-sm font-bold text-[#F4F4F5] tabular-nums">
                            {selectedItem.damageFormula} ·{" "}
                            {selectedItem.threatRange ?? 20}/×
                            {selectedItem.critMultiplier ?? 2}
                          </span>
                        </div>
                      )}
                      {selectedItem.damageType && (
                        <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-3">
                          <span className="text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
                            Tipo de Dano
                          </span>
                          <span className="text-sm font-bold text-[#F4F4F5]">
                            {selectedItem.damageType}
                          </span>
                        </div>
                      )}
                      {selectedItem.weaponCategory && (
                        <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-3">
                          <span className="text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
                            Proficiência
                          </span>
                          <span className="text-sm font-bold text-[#F4F4F5]">
                            {selectedItem.weaponCategory}
                          </span>
                        </div>
                      )}
                      {selectedItem.weaponRange && (
                        <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-3">
                          <span className="text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
                            Alcance
                          </span>
                          <span className="text-sm font-bold text-[#F4F4F5]">
                            {selectedItem.weaponRange}
                          </span>
                        </div>
                      )}
                      {selectedItem.defenseBonus ? (
                        <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-3">
                          <span className="text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
                            Defesa
                          </span>
                          <span className="text-sm font-bold text-emerald-400 tabular-nums">
                            +{selectedItem.defenseBonus}
                          </span>
                        </div>
                      ) : null}
                      {selectedItem.rdBonus ? (
                        <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-3">
                          <span className="text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
                            RD Física
                          </span>
                          <span className="text-sm font-bold text-[#F4F4F5] tabular-nums">
                            {selectedItem.rdBonus}
                          </span>
                        </div>
                      ) : null}
                      {selectedItem.carryBonus ? (
                        <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-3">
                          <span className="text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
                            Bônus Carga
                          </span>
                          <span className="text-sm font-bold text-emerald-400 tabular-nums">
                            +{selectedItem.carryBonus} esp.
                          </span>
                        </div>
                      ) : null}
                      {selectedItem.maxUses !== undefined && (
                        <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-3">
                          <span className="text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
                            Usos
                          </span>
                          <span className="text-sm font-bold text-sky-300 tabular-nums">
                            {selectedItem.currentUses ?? selectedItem.maxUses}/
                            {selectedItem.maxUses}
                          </span>
                        </div>
                      )}
                      {selectedItem.riskGrade !== undefined && (
                        <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-3">
                          <span className="text-[9px] uppercase tracking-wider text-[#6E6E7E] block">
                            Grau de Risco
                          </span>
                          <span className="text-sm font-bold text-amber-300 tabular-nums">
                            G.R. {selectedItem.riskGrade}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Full Description */}
                    <div className="space-y-1.5">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E8E9E] block">
                        Descrição & Propriedades
                      </span>
                      <p className="text-[14px] leading-[1.65] text-[#D4D4D8]">
                        {selectedItem.description}
                      </p>
                    </div>

                    {selectedCatKey === "arma" && (
                      <label className="flex items-center gap-2 rounded-sm border border-[#22222A] bg-[#0D0D11] px-3.5 py-2.5 text-xs text-[#D4D4D8] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={alsoAddAttack}
                          onChange={(e) => setAlsoAddAttack(e.target.checked)}
                        />
                        <Swords className="h-3.5 w-3.5 text-[#8E8E9E]" />
                        Cadastrar também como ataque rolável na aba{" "}
                        <strong className="text-[#F4F4F5]">Combate</strong>
                      </label>
                    )}
                  </div>

                  {/* Sticky Action Footer */}
                  <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-[#22222A] bg-[#0C0C10] px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E]">
                        QTD
                      </span>
                      <Input
                        type="number"
                        min={1}
                        max={99}
                        value={addQuantity}
                        onChange={(e) =>
                          setAddQuantity(Math.max(1, Number(e.target.value) || 1))
                        }
                        className="h-8 w-16 font-mono text-xs text-center tabular-nums"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={onClose}>
                        Fechar
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddSelected}
                      >
                        {justAddedId === selectedItem.id ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> Adicionado!
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" /> Adicionar ao
                            Inventário
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-xs text-[#6E6E7E]">
                  Selecione um item à esquerda para ver detalhes completos.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
