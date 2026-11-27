"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Backpack,
  BookOpen,
  Briefcase,
  ChevronRight,
  Compass,
  Dices,
  Flame,
  Heart,
  Layers,
  Search,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Wand2,
  Wrench,
  Zap,
} from "lucide-react";
import type {
  ClassDefinition as AgentClassDefinition,
  AgentClassId,
  AgentRitual,
  ContentSource,
  CurseDefinition,
  InventoryItem,
  ItemCategoryType,
  ModificationDefinition,
  OriginDefinition,
  ParanormalElement,
  PowerDefinition,
  Threat,
  TrailDefinition,
} from "@/types/ordem";
import { BASE_ORIGINS } from "@/data/origins";
import { ALL_CLASSES } from "@/data/classes";
import { BASE_TRAILS } from "@/data/trails";
import { BASE_CLASS_POWERS } from "@/data/classPowers";
import { BASE_GENERAL_POWERS } from "@/data/generalPowers";
import { BASE_PARANORMAL_POWERS } from "@/data/paranormalPowers";
import { BASE_RITUALS } from "@/data/rituals";
import {
  BASE_CURSES,
  BASE_ITEMS,
  BASE_MODIFICATIONS,
  ITEM_CATEGORY_META,
} from "@/data/equipment";
import {
  COMMUNITY_CURSES,
  COMMUNITY_ITEMS,
  COMMUNITY_MODIFICATIONS,
  COMMUNITY_ORIGINS,
  COMMUNITY_POWERS,
  COMMUNITY_RITUALS,
  COMMUNITY_THREATS,
  COMMUNITY_TRAILS,
} from "@/data/supplements";
import { SKILLS_BY_KEY } from "@/data/skills";
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
import {
  normalizeItemCategoryType,
  rollDiceFormula,
  rollOrdemTest,
} from "@/lib/ordem-rules";
import {
  CLASS_VISUALS,
  ELEMENT_VISUALS,
  getItemVisualIcon,
  ITEM_CATEGORY_VISUALS,
} from "@/lib/ui-icons";
import { TermTooltip } from "@/components/ui/TermTooltip";
import { BeginnerGuideContent } from "@/components/guide/BeginnerGuideModal";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { Badge, Button, Card, Input, Modal } from "@/components/ui/primitives";

type HubSectionId =
  | "hub"
  | "guia"
  | "origens"
  | "classes"
  | "poderes"
  | "rituais"
  | "equipamentos"
  | "bestiario";

type PowerSubmenu = "todos" | "classe" | "geral" | "paranormal";
type EquipmentSubmenu =
  | "todos"
  | ItemCategoryType
  | "modificacoes"
  | "maldicoes";

const ROMAN_CAT: Record<number, string> = {
  0: "0",
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
};

export default function CompendioHubPage() {
  const { threats, homebrew, pushRoll } = useAppStore();

  const [section, setSection] = useState<HubSectionId>("hub");
  const [search, setSearch] = useState("");
  const [enabledSources, setEnabledSources] = useState<ContentSource[]>([
    ...DEFAULT_ENABLED_SOURCES,
    "guia_confidencial_vol1",
    "misterios_do_outro_lado",
    "grimorio_do_cataclisma",
  ]);
  const [showSourcesPanel, setShowSourcesPanel] = useState(false);

  // Submenus (Menu -> Submenu -> Conteúdo)
  const [selectedClassFilter, setSelectedClassFilter] = useState<
    "todas" | AgentClassId
  >("todas");
  const [powerSubmenu, setPowerSubmenu] = useState<PowerSubmenu>("todos");
  const [powerElementFilter, setPowerElementFilter] = useState<
    "Todos" | ParanormalElement
  >("Todos");
  const [ritualElementFilter, setRitualElementFilter] = useState<
    "Todos" | ParanormalElement
  >("Todos");
  const [ritualCircleFilter, setRitualCircleFilter] = useState<number>(0);
  const [equipSubmenu, setEquipSubmenu] = useState<EquipmentSubmenu>("todos");
  const [bestiaryElementFilter, setBestiaryElementFilter] = useState<
    "Todos" | ParanormalElement
  >("Todos");

  // Detail modal state (progressive disclosure on click)
  const [detailOrigin, setDetailOrigin] = useState<OriginDefinition | null>(
    null
  );
  const [detailTrail, setDetailTrail] = useState<TrailDefinition | null>(null);
  const [detailClass, setDetailClass] = useState<AgentClassDefinition | null>(
    null
  );
  const [detailPower, setDetailPower] = useState<PowerDefinition | null>(null);
  const [detailRitual, setDetailRitual] = useState<AgentRitual | null>(null);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [detailMod, setDetailMod] = useState<ModificationDefinition | null>(
    null
  );
  const [detailCurse, setDetailCurse] = useState<CurseDefinition | null>(null);
  const [detailThreat, setDetailThreat] = useState<Threat | null>(null);

  // Aggregated catalogs filtered by enabled sources
  const allOrigins = useMemo(
    () =>
      filterByEnabledSources(
        [...BASE_ORIGINS, ...COMMUNITY_ORIGINS, ...homebrew.origins],
        enabledSources
      ),
    [enabledSources, homebrew.origins]
  );

  const allClasses = useMemo(
    () => filterByEnabledSources(ALL_CLASSES, enabledSources),
    [enabledSources]
  );

  const allTrails = useMemo(
    () =>
      filterByEnabledSources(
        [...BASE_TRAILS, ...COMMUNITY_TRAILS, ...(homebrew.trails ?? [])],
        enabledSources
      ),
    [enabledSources, homebrew.trails]
  );

  const allPowers = useMemo(
    () =>
      filterByEnabledSources(
        [
          ...BASE_CLASS_POWERS,
          ...BASE_GENERAL_POWERS,
          ...BASE_PARANORMAL_POWERS,
          ...COMMUNITY_POWERS,
          ...(homebrew.powers ?? []),
        ],
        enabledSources
      ),
    [enabledSources, homebrew.powers]
  );

  const allRituals = useMemo(
    () =>
      filterByEnabledSources(
        [...BASE_RITUALS, ...COMMUNITY_RITUALS, ...homebrew.rituals],
        enabledSources
      ),
    [enabledSources, homebrew.rituals]
  );

  const allItems = useMemo(
    () =>
      filterByEnabledSources(
        [
          ...BASE_ITEMS,
          ...COMMUNITY_ITEMS,
          ...homebrew.weapons,
          ...homebrew.items,
        ],
        enabledSources
      ),
    [enabledSources, homebrew.weapons, homebrew.items]
  );

  const allMods = useMemo(
    () =>
      filterByEnabledSources(
        [
          ...BASE_MODIFICATIONS,
          ...COMMUNITY_MODIFICATIONS,
          ...(homebrew.modifications ?? []),
        ],
        enabledSources
      ),
    [enabledSources, homebrew.modifications]
  );

  const allCurses = useMemo(
    () =>
      filterByEnabledSources(
        [...BASE_CURSES, ...COMMUNITY_CURSES, ...(homebrew.curses ?? [])],
        enabledSources
      ),
    [enabledSources, homebrew.curses]
  );

  const allThreats = useMemo(() => {
    const storeIds = new Set(threats.map((t) => t.id));
    const extra = COMMUNITY_THREATS.filter((ct) => !storeIds.has(ct.id));
    return filterByEnabledSources([...threats, ...extra], enabledSources);
  }, [threats, enabledSources]);

  const navigateToSection = (next: HubSectionId) => {
    setSection(next);
    setSearch("");
  };

  const HUB_CARDS: {
    id: Exclude<HubSectionId, "hub">;
    title: string;
    subtitle: string;
    countLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBoxCls: string;
  }[] = [
    {
      id: "guia",
      title: "Guia do Iniciante",
      subtitle: "O que é NEX, testes de dados, elementos e como jogar",
      countLabel: "4 passos + Glossário",
      icon: Compass,
      iconBoxCls: "border-sky-500/40 bg-sky-500/10 text-sky-300",
    },
    {
      id: "origens",
      title: "Origens",
      subtitle: "O que seu personagem fazia antes de entrar na Ordem",
      countLabel: `${allOrigins.length} origens`,
      icon: Briefcase,
      iconBoxCls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    },
    {
      id: "classes",
      title: "Classes & Trilhas",
      subtitle: "Combatente, Especialista, Ocultista e especializações",
      countLabel: `${allClasses.length} classes · ${allTrails.length} trilhas`,
      icon: Shield,
      iconBoxCls: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300",
    },
    {
      id: "poderes",
      title: "Poderes",
      subtitle: "Habilidades de classe, poderes gerais e paranormais",
      countLabel: `${allPowers.length} poderes`,
      icon: Zap,
      iconBoxCls: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    },
    {
      id: "rituais",
      title: "Rituais",
      subtitle: "Magias e manifestações paranormais do 1º ao 4º círculo",
      countLabel: `${allRituals.length} rituais`,
      icon: Flame,
      iconBoxCls: "border-purple-500/40 bg-purple-500/10 text-purple-300",
    },
    {
      id: "equipamentos",
      title: "Equipamentos",
      subtitle: "Armas, proteções, itens táticos, modificações e maldições",
      countLabel: `${allItems.length + allMods.length + allCurses.length} itens`,
      icon: Backpack,
      iconBoxCls: "border-orange-500/40 bg-orange-500/10 text-orange-300",
    },
    {
      id: "bestiario",
      title: "Bestiário",
      subtitle: "Criaturas paranormais, Relíquias e ameaças da Realidade",
      countLabel: `${allThreats.length} ameaças`,
      icon: Skull,
      iconBoxCls: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    },
  ];

  // Breadcrumb trail generator
  const breadcrumbs = useMemo(() => {
    const items: { label: string; onClick?: () => void }[] = [
      {
        label: "Compêndio",
        onClick: section !== "hub" ? () => navigateToSection("hub") : undefined,
      },
    ];
    if (section === "hub") return items;

    const currentCard = HUB_CARDS.find((c) => c.id === section);
    if (currentCard) {
      items.push({
        label: currentCard.title,
        onClick: () => {
          setSelectedClassFilter("todas");
          setPowerSubmenu("todos");
          setRitualElementFilter("Todos");
          setEquipSubmenu("todos");
          setBestiaryElementFilter("Todos");
        },
      });
    }

    if (section === "classes" && selectedClassFilter !== "todas") {
      const clsName =
        allClasses.find((c) => c.id === selectedClassFilter)?.name ??
        selectedClassFilter;
      items.push({ label: clsName });
    }
    if (section === "poderes" && powerSubmenu !== "todos") {
      const labels: Record<Exclude<PowerSubmenu, "todos">, string> = {
        classe: "Poderes de Classe",
        geral: "Poderes Gerais",
        paranormal: "Poderes Paranormais",
      };
      items.push({ label: labels[powerSubmenu] });
    }
    if (section === "rituais" && ritualElementFilter !== "Todos") {
      items.push({ label: ritualElementFilter });
    }
    if (section === "equipamentos" && equipSubmenu !== "todos") {
      if (equipSubmenu === "modificacoes") {
        items.push({ label: "Modificações" });
      } else if (equipSubmenu === "maldicoes") {
        items.push({ label: "Maldições" });
      } else {
        items.push({ label: ITEM_CATEGORY_VISUALS[equipSubmenu].label });
      }
    }
    if (section === "bestiario" && bestiaryElementFilter !== "Todos") {
      items.push({ label: bestiaryElementFilter });
    }

    return items;
  }, [
    section,
    selectedClassFilter,
    powerSubmenu,
    ritualElementFilter,
    equipSubmenu,
    bestiaryElementFilter,
    allClasses,
  ]);

  const q = search.trim().toLowerCase();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      {/* Top Bar: Breadcrumbs + ← Voltar + Fontes */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {section !== "hub" && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => navigateToSection("hub")}
              className="mr-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar ao Hub</span>
            </Button>
          )}

          {/* Breadcrumb Trail */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-xs"
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={`${crumb.label}-${idx}`}>
                  {idx > 0 && (
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                  )}
                  {crumb.onClick && !isLast ? (
                    <button
                      type="button"
                      onClick={crumb.onClick}
                      className="text-zinc-400 hover:text-white transition-colors font-medium"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span
                      className={cn(
                        "font-semibold",
                        isLast ? "text-zinc-100" : "text-zinc-400"
                      )}
                    >
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {section === "bestiario" && (
            <Link href="/ameacas">
              <Button variant="outline" size="xs">
                <Skull className="h-3.5 w-3.5 text-rose-400" /> Gerenciador de
                Ameaças & Relíquias
              </Button>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setShowSourcesPanel((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              showSourcesPanel
                ? "border-white bg-[#16161C] text-white"
                : "border-white/15 bg-[#121218] text-zinc-300 hover:text-white"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Livros & Suplementos</span>
          </button>
        </div>
      </div>

      {showSourcesPanel && (
        <Card className="p-4">
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

      {/* =====================================================================
          NÍVEL 1: HUB PRINCIPAL (7 CARDS GRANDES CLICÁVEIS)
         ===================================================================== */}
      {section === "hub" && (
        <div className="space-y-6">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">
              <BookOpen className="h-3.5 w-3.5" /> Biblioteca Visual · Ordem
              Paranormal RPG
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50">
              Compêndio V.E.R.A.
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl">
              Explore todas as regras, origens, classes, poderes, rituais,
              equipamentos e criaturas organizados passo a passo. Escolha uma
              categoria abaixo para começar:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {HUB_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => navigateToSection(card.id)}
                  className="group text-left"
                >
                  <Card className="h-full p-5 flex flex-col justify-between gap-4 transition-all duration-150 hover:border-white/30 hover:bg-[#14141C] hover:-translate-y-0.5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl border transition-transform group-hover:scale-105",
                            card.iconBoxCls
                          )}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
                      </div>

                      <div className="space-y-1">
                        <h2 className="font-display text-lg font-bold text-zinc-100 group-hover:text-white">
                          {card.title}
                        </h2>
                        <p className="text-xs leading-relaxed text-zinc-400">
                          {card.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-3">
                      <span className="font-mono text-[11px] font-semibold text-zinc-300">
                        {card.countLabel}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 group-hover:text-zinc-100">
                        Explorar <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          SEÇÃO 1: GUIA DO INICIANTE
         ===================================================================== */}
      {section === "guia" && (
        <div className="space-y-5">
          <div>
            <h1 className="font-display text-2xl font-bold text-zinc-100">
              Guia do Iniciante
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tudo o que você precisa saber para criar seu agente e jogar sua
              primeira sessão sem complicação.
            </p>
          </div>
          <BeginnerGuideContent />
        </div>
      )}

      {/* =====================================================================
          SEÇÃO 2: ORIGENS
         ===================================================================== */}
      {section === "origens" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-zinc-100">
                Origens ({allOrigins.length})
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Sua profissão ou passado antes de conhecer o Outro Lado. Cada
                origem concede <strong>2 perícias treinadas</strong> e{" "}
                <strong>1 poder exclusivo</strong>.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar origem, perícia ou poder..."
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {allOrigins
              .filter((o) => {
                if (!q) return true;
                return (
                  o.name.toLowerCase().includes(q) ||
                  o.powerName.toLowerCase().includes(q) ||
                  o.powerDescription.toLowerCase().includes(q)
                );
              })
              .map((origin) => {
                const skillsText = (
                  origin.trainedSkillNotes &&
                  origin.trainedSkillNotes.length > 0
                    ? origin.trainedSkillNotes
                    : origin.trainedSkills.map(
                        (k) => SKILLS_BY_KEY[k]?.name ?? k
                      )
                ).join(" · ");

                return (
                  <button
                    key={origin.id}
                    type="button"
                    onClick={() => setDetailOrigin(origin)}
                    className="group text-left"
                  >
                    <Card className="h-full p-4 space-y-3 transition-all hover:border-white/30 hover:bg-[#14141C]">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/35 bg-emerald-500/10 text-emerald-300">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-display text-sm font-bold text-zinc-100 truncate group-hover:text-white">
                              {origin.name}
                            </h3>
                            <SourceBadge source={origin.source} />
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <Badge variant="success" className="text-[10px]">
                              {skillsText}
                            </Badge>
                            <Badge variant="default" className="text-[10px]">
                              {origin.powerName}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {origin.powerDescription}
                      </p>
                    </Card>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* =====================================================================
          SEÇÃO 3: CLASSES & TRILHAS (SUBMENU DE CLASSES)
         ===================================================================== */}
      {section === "classes" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-zinc-100">
                Classes & Trilhas
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Escolha uma classe abaixo para filtrar suas trilhas de
                especialização (liberadas em{" "}
                <TermTooltip term="NEX" label="NEX 10%" />
                ).
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar trilha ou habilidade..."
                className="pl-9 text-xs"
              />
            </div>
          </div>

          {/* Submenu Visual de Classes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allClasses.map((cls) => {
              const vis = CLASS_VISUALS[cls.id] ?? CLASS_VISUALS.combatente;
              const Icon = vis.icon;
              const active = selectedClassFilter === cls.id;
              const trailCount = allTrails.filter(
                (t) => t.classId === cls.id
              ).length;

              return (
                <div
                  key={cls.id}
                  className={cn(
                    "rounded-lg border p-4 space-y-3 transition-all",
                    active
                      ? "border-white bg-[#181822]"
                      : "border-white/10 bg-zinc-950/80 hover:border-white/25"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedClassFilter(active ? "todas" : cls.id)
                      }
                      className="flex items-center gap-3 text-left min-w-0 flex-1"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                          vis.iconBoxCls
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-bold text-zinc-100">
                          {cls.name}
                        </h3>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {vis.roleTag}
                        </p>
                      </div>
                    </button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setDetailClass(cls)}
                    >
                      Detalhes
                    </Button>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px]">
                    <span className="font-mono text-zinc-400">
                      PV {cls.initialPv} · PE {cls.initialPe} · SAN{" "}
                      {cls.initialSan}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedClassFilter(active ? "todas" : cls.id)
                      }
                      className={cn(
                        "font-mono text-[11px] font-semibold",
                        active
                          ? "text-white underline"
                          : "text-zinc-300 hover:text-white"
                      )}
                    >
                      {active
                        ? "Mostrando trilhas ✓"
                        : `Ver ${trailCount} trilhas →`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lista de Trilhas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="font-display text-sm font-bold text-zinc-100">
                Trilhas de Especialização{" "}
                {selectedClassFilter !== "todas"
                  ? `— ${
                      allClasses.find((c) => c.id === selectedClassFilter)?.name
                    }`
                  : `(${allTrails.length})`}
              </h2>
              {selectedClassFilter !== "todas" && (
                <button
                  type="button"
                  onClick={() => setSelectedClassFilter("todas")}
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  Mostrar todas as classes
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {allTrails
                .filter((t) => {
                  if (
                    selectedClassFilter !== "todas" &&
                    t.classId !== selectedClassFilter
                  )
                    return false;
                  if (!q) return true;
                  return (
                    t.name.toLowerCase().includes(q) ||
                    t.description.toLowerCase().includes(q) ||
                    t.abilitiesByNex.some(
                      (a) =>
                        a.name.toLowerCase().includes(q) ||
                        a.description.toLowerCase().includes(q)
                    )
                  );
                })
                .map((trail) => {
                  const clsVis =
                    CLASS_VISUALS[trail.classId] ?? CLASS_VISUALS.combatente;
                  const Icon = clsVis.icon;
                  const clsName =
                    allClasses.find((c) => c.id === trail.classId)?.name ??
                    trail.classId;

                  return (
                    <button
                      key={trail.id}
                      type="button"
                      onClick={() => setDetailTrail(trail)}
                      className="group text-left"
                    >
                      <Card className="h-full p-4 space-y-3 transition-all hover:border-white/30 hover:bg-[#14141C]">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                              clsVis.iconBoxCls
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-display text-sm font-bold text-zinc-100 truncate group-hover:text-white">
                                {trail.name}
                              </h3>
                              <SourceBadge source={trail.source} />
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <Badge variant="default" className="text-[10px]">
                                {clsName}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {trail.abilitiesByNex.length} marcos
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {trail.description}
                        </p>
                      </Card>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SEÇÃO 4: PODERES (SUBMENU VISUAL: CLASSE / GERAIS / PARANORMAIS)
         ===================================================================== */}
      {section === "poderes" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-zinc-100">
                Poderes ({allPowers.length})
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Habilidades escolhidas a cada 15% de{" "}
                <TermTooltip term="NEX" label="NEX" /> (15%, 30%, 45%, 60%, 75%,
                90%).
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar poder ou pré-requisito..."
                className="pl-9 text-xs"
              />
            </div>
          </div>

          {/* Submenu Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(
              [
                {
                  id: "todos" as const,
                  label: "Todos os Poderes",
                  count: allPowers.length,
                  icon: Zap,
                  box: "border-zinc-400/35 bg-zinc-400/10 text-zinc-200",
                },
                {
                  id: "classe" as const,
                  label: "Poderes de Classe",
                  count: allPowers.filter((p) => p.category === "classe")
                    .length,
                  icon: Shield,
                  box: "border-sky-500/35 bg-sky-500/10 text-sky-300",
                },
                {
                  id: "geral" as const,
                  label: "Poderes Gerais",
                  count: allPowers.filter((p) => p.category === "geral").length,
                  icon: Compass,
                  box: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
                },
                {
                  id: "paranormal" as const,
                  label: "Poderes Paranormais",
                  count: allPowers.filter((p) => p.category === "paranormal")
                    .length,
                  icon: Sparkles,
                  box: "border-purple-500/35 bg-purple-500/10 text-purple-300",
                },
              ] as const
            ).map((sub) => {
              const Icon = sub.icon;
              const active = powerSubmenu === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setPowerSubmenu(sub.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all",
                    active
                      ? "border-white bg-[#181822]"
                      : "border-white/10 bg-zinc-950/80 hover:border-white/25"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                      sub.box
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-100 truncate">
                      {sub.label}
                    </div>
                    <div className="font-mono text-[10px] text-zinc-400">
                      {sub.count} opções
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {powerSubmenu === "paranormal" && (
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                ["Todos", "Sangue", "Morte", "Conhecimento", "Energia"] as const
              ).map((el) => (
                <button
                  key={el}
                  type="button"
                  onClick={() => setPowerElementFilter(el)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    powerElementFilter === el
                      ? "border-white bg-[#181822] text-white"
                      : "border-white/10 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {el}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {allPowers
              .filter((p) => {
                if (powerSubmenu !== "todos" && p.category !== powerSubmenu)
                  return false;
                if (
                  powerSubmenu === "paranormal" &&
                  powerElementFilter !== "Todos" &&
                  p.element !== powerElementFilter
                )
                  return false;
                if (!q) return true;
                return (
                  p.name.toLowerCase().includes(q) ||
                  p.description.toLowerCase().includes(q)
                );
              })
              .map((power) => {
                const elVis = power.element
                  ? ELEMENT_VISUALS[power.element]
                  : null;
                const clsVis = power.classId
                  ? CLASS_VISUALS[power.classId]
                  : null;
                const Icon = elVis?.icon ?? clsVis?.icon ?? Zap;
                const iconBoxCls =
                  elVis?.iconBoxCls ??
                  clsVis?.iconBoxCls ??
                  "border-amber-500/35 bg-amber-500/10 text-amber-300";

                return (
                  <button
                    key={power.id}
                    type="button"
                    onClick={() => setDetailPower(power)}
                    className="group text-left"
                  >
                    <Card className="h-full p-4 space-y-3 transition-all hover:border-white/30 hover:bg-[#14141C]">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                            iconBoxCls
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-display text-sm font-bold text-zinc-100 truncate group-hover:text-white">
                              {power.name}
                            </h3>
                            <SourceBadge source={power.source} />
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {power.element ? (
                              <span
                                className={cn(
                                  "rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
                                  elVis?.badgeCls
                                )}
                              >
                                {power.element}
                              </span>
                            ) : (
                              <Badge variant="default" className="text-[10px]">
                                {power.classId ?? "Geral"}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px]">
                              {(power.peCost ?? 0) > 0
                                ? `${power.peCost} PE`
                                : "Passiva"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {power.description}
                      </p>
                    </Card>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* =====================================================================
          SEÇÃO 5: RITUAIS (SUBMENU POR ELEMENTO & CÍRCULO)
         ===================================================================== */}
      {section === "rituais" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-zinc-100">
                Rituais ({allRituals.length})
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Manifestações paranormais de 1º a 4º Círculo. Conjurar exige
                gastar <TermTooltip term="PE" label="PE" /> e passar no Custo do
                Paranormal (<TermTooltip term="DT" label="DT 20 + PE" />
                ).
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ritual por nome ou efeito..."
                className="pl-9 text-xs"
              />
            </div>
          </div>

          {/* Submenu de Elementos com Ícones */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <button
              type="button"
              onClick={() => setRitualElementFilter("Todos")}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all",
                ritualElementFilter === "Todos"
                  ? "border-white bg-[#181822]"
                  : "border-white/10 bg-zinc-950/80 hover:border-white/25"
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5 text-zinc-200">
                <Wand2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-100">Todos</div>
                <div className="font-mono text-[10px] text-zinc-400">
                  {allRituals.length}
                </div>
              </div>
            </button>

            {(
              ["Sangue", "Morte", "Conhecimento", "Energia", "Medo"] as const
            ).map((el) => {
              const vis = ELEMENT_VISUALS[el];
              const Icon = vis.icon;
              const active = ritualElementFilter === el;
              const count = allRituals.filter((r) => r.element === el).length;

              return (
                <button
                  key={el}
                  type="button"
                  onClick={() =>
                    setRitualElementFilter(active ? "Todos" : el)
                  }
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all",
                    active
                      ? "border-white bg-[#181822]"
                      : "border-white/10 bg-zinc-950/80 hover:border-white/25"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
                      vis.iconBoxCls
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-100 truncate">
                      {el}
                    </div>
                    <div className="font-mono text-[10px] text-zinc-400">
                      {count} rituais
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Circle Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { c: 0, label: "Todos os Círculos" },
              { c: 1, label: "1º Círculo (1 PE)" },
              { c: 2, label: "2º Círculo (3 PE)" },
              { c: 3, label: "3º Círculo (6 PE)" },
              { c: 4, label: "4º Círculo (10 PE)" },
            ].map((opt) => (
              <button
                key={opt.c}
                type="button"
                onClick={() => setRitualCircleFilter(opt.c)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  ritualCircleFilter === opt.c
                    ? "border-white bg-[#181822] text-white"
                    : "border-white/10 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {allRituals
              .filter((r) => {
                if (
                  ritualElementFilter !== "Todos" &&
                  r.element !== ritualElementFilter
                )
                  return false;
                if (ritualCircleFilter > 0 && r.circle !== ritualCircleFilter)
                  return false;
                if (!q) return true;
                return (
                  r.name.toLowerCase().includes(q) ||
                  r.description.toLowerCase().includes(q)
                );
              })
              .map((ritual) => {
                const vis =
                  ELEMENT_VISUALS[ritual.element] ?? ELEMENT_VISUALS.Variável;
                const Icon = vis.icon;

                return (
                  <button
                    key={ritual.id}
                    type="button"
                    onClick={() => setDetailRitual(ritual)}
                    className="group text-left"
                  >
                    <Card
                      className={cn(
                        "h-full p-4 space-y-3 transition-all hover:border-white/30 hover:bg-[#14141C]",
                        vis.cardBorderCls
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                            vis.iconBoxCls
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-display text-sm font-bold text-zinc-100 truncate group-hover:text-white">
                              {ritual.name}
                            </h3>
                            <SourceBadge source={ritual.source} />
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span
                              className={cn(
                                "rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
                                vis.badgeCls
                              )}
                            >
                              {ritual.element} · {ritual.circle}ºC
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {ritual.execution} · {ritual.range}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {ritual.description}
                      </p>
                    </Card>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* =====================================================================
          SEÇÃO 6: EQUIPAMENTOS (SUBMENU VISUAL EM CARDS COM ÍCONES)
         ===================================================================== */}
      {section === "equipamentos" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-zinc-100">
                Equipamentos & Arsenal
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Armas, proteções, itens operacionais, paranormais, amaldiçoados,
                modificações e maldições classificados por{" "}
                <TermTooltip term="Categoria" label="Categoria (0 a IV)" />.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar arma, item ou modificação..."
                className="pl-9 text-xs"
              />
            </div>
          </div>

          {/* Submenu de Categorias de Equipamentos com Ícones */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <button
              type="button"
              onClick={() => setEquipSubmenu("todos")}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all",
                equipSubmenu === "todos"
                  ? "border-white bg-[#181822]"
                  : "border-white/10 bg-zinc-950/80 hover:border-white/25"
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5 text-zinc-200">
                <Backpack className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-100">Todos</div>
                <div className="font-mono text-[10px] text-zinc-400">
                  {allItems.length} itens
                </div>
              </div>
            </button>

            {ITEM_CATEGORY_META.map((cat) => {
              const vis = ITEM_CATEGORY_VISUALS[cat.key];
              const Icon = vis.icon;
              const active = equipSubmenu === cat.key;
              const count = allItems.filter(
                (i) => normalizeItemCategoryType(i) === cat.key
              ).length;

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() =>
                    setEquipSubmenu(active ? "todos" : cat.key)
                  }
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all",
                    active
                      ? "border-white bg-[#181822]"
                      : "border-white/10 bg-zinc-950/80 hover:border-white/25"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
                      vis.iconBoxCls
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-100 truncate">
                      {cat.shortLabel}
                    </div>
                    <div className="font-mono text-[10px] text-zinc-400">
                      {count}
                    </div>
                  </div>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() =>
                setEquipSubmenu(
                  equipSubmenu === "modificacoes" ? "todos" : "modificacoes"
                )
              }
              className={cn(
                "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all",
                equipSubmenu === "modificacoes"
                  ? "border-white bg-[#181822]"
                  : "border-white/10 bg-zinc-950/80 hover:border-white/25"
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-cyan-500/35 bg-cyan-500/10 text-cyan-300">
                <Wrench className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-100 truncate">
                  Modificações
                </div>
                <div className="font-mono text-[10px] text-zinc-400">
                  {allMods.length}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                setEquipSubmenu(
                  equipSubmenu === "maldicoes" ? "todos" : "maldicoes"
                )
              }
              className={cn(
                "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all",
                equipSubmenu === "maldicoes"
                  ? "border-white bg-[#181822]"
                  : "border-white/10 bg-zinc-950/80 hover:border-white/25"
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-purple-500/35 bg-purple-500/10 text-purple-300">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-100 truncate">
                  Maldições
                </div>
                <div className="font-mono text-[10px] text-zinc-400">
                  {allCurses.length}
                </div>
              </div>
            </button>
          </div>

          {equipSubmenu === "modificacoes" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {allMods
                .filter(
                  (m) =>
                    !q ||
                    m.name.toLowerCase().includes(q) ||
                    m.description.toLowerCase().includes(q)
                )
                .map((mod) => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setDetailMod(mod)}
                    className="group text-left"
                  >
                    <Card className="h-full p-4 space-y-3 transition-all hover:border-white/30 hover:bg-[#14141C]">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-500/35 bg-cyan-500/10 text-cyan-300">
                          <Wrench className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-display text-sm font-bold text-zinc-100 truncate">
                              {mod.name}
                            </h3>
                            <SourceBadge source={mod.source} />
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant="default" className="text-[10px]">
                              {mod.appliesTo}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              +{mod.categoryIncrease} Cat.
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2">
                        {mod.description}
                      </p>
                    </Card>
                  </button>
                ))}
            </div>
          ) : equipSubmenu === "maldicoes" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {allCurses
                .filter(
                  (c) =>
                    !q ||
                    c.name.toLowerCase().includes(q) ||
                    c.description.toLowerCase().includes(q)
                )
                .map((curse) => {
                  const vis = ELEMENT_VISUALS[curse.element];
                  const Icon = vis.icon;
                  return (
                    <button
                      key={curse.id}
                      type="button"
                      onClick={() => setDetailCurse(curse)}
                      className="group text-left"
                    >
                      <Card
                        className={cn(
                          "h-full p-4 space-y-3 transition-all hover:border-white/30 hover:bg-[#14141C]",
                          vis.cardBorderCls
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                              vis.iconBoxCls
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-display text-sm font-bold text-zinc-100 truncate">
                                {curse.name}
                              </h3>
                              <SourceBadge source={curse.source} />
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span
                                className={cn(
                                  "rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
                                  vis.badgeCls
                                )}
                              >
                                {curse.element}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {curse.appliesTo}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2">
                          {curse.description}
                        </p>
                      </Card>
                    </button>
                  );
                })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {allItems
                .filter((it) => {
                  const catKey = normalizeItemCategoryType(it);
                  if (equipSubmenu !== "todos" && catKey !== equipSubmenu)
                    return false;
                  if (!q) return true;
                  return (
                    it.name.toLowerCase().includes(q) ||
                    it.description.toLowerCase().includes(q)
                  );
                })
                .map((item) => {
                  const catKey = normalizeItemCategoryType(item);
                  const catVis = ITEM_CATEGORY_VISUALS[catKey];
                  const ItemIcon = getItemVisualIcon(item);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDetailItem(item)}
                      className="group text-left"
                    >
                      <Card className="h-full p-4 space-y-3 transition-all hover:border-white/30 hover:bg-[#14141C]">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                              catVis.iconBoxCls
                            )}
                          >
                            <ItemIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-display text-sm font-bold text-zinc-100 truncate group-hover:text-white">
                                {item.name}
                              </h3>
                              <SourceBadge source={item.source} />
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <Badge variant="default" className="text-[10px]">
                                Cat. {ROMAN_CAT[item.category]} · {item.spaces}{" "}
                                esp.
                              </Badge>
                              {item.damageFormula && (
                                <Badge variant="danger" className="text-[10px]">
                                  {item.damageFormula} ({item.threatRange ?? 20}
                                  /x{item.critMultiplier ?? 2})
                                </Badge>
                              )}
                              {item.defenseBonus ? (
                                <Badge
                                  variant="success"
                                  className="text-[10px]"
                                >
                                  +{item.defenseBonus} Def
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </Card>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SEÇÃO 7: BESTIÁRIO (SUBMENU VISUAL POR ELEMENTO)
         ===================================================================== */}
      {section === "bestiario" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-zinc-100">
                Bestiário ({allThreats.length})
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Criaturas do Outro Lado e ameaças da Realidade classificadas por{" "}
                <TermTooltip term="VD" label="VD (Valor de Desafio)" />. Clique
                em uma criatura para abrir a ficha completa e rolar ataques.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar criatura ou VD..."
                className="pl-9 text-xs"
              />
            </div>
          </div>

          {/* Submenu de Elementos do Bestiário */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <button
              type="button"
              onClick={() => setBestiaryElementFilter("Todos")}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all",
                bestiaryElementFilter === "Todos"
                  ? "border-white bg-[#181822]"
                  : "border-white/10 bg-zinc-950/80 hover:border-white/25"
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5 text-zinc-200">
                <Skull className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-100">Todas</div>
                <div className="font-mono text-[10px] text-zinc-400">
                  {allThreats.length}
                </div>
              </div>
            </button>

            {(
              [
                "Sangue",
                "Morte",
                "Conhecimento",
                "Energia",
                "Medo",
                "Realidade",
              ] as const
            ).map((el) => {
              const vis = ELEMENT_VISUALS[el];
              const Icon = vis.icon;
              const active = bestiaryElementFilter === el;
              const count = allThreats.filter((t) => t.element === el).length;

              return (
                <button
                  key={el}
                  type="button"
                  onClick={() =>
                    setBestiaryElementFilter(active ? "Todos" : el)
                  }
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all",
                    active
                      ? "border-white bg-[#181822]"
                      : "border-white/10 bg-zinc-950/80 hover:border-white/25"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
                      vis.iconBoxCls
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-100 truncate">
                      {el}
                    </div>
                    <div className="font-mono text-[10px] text-zinc-400">
                      {count}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {allThreats
              .filter((t) => {
                if (
                  bestiaryElementFilter !== "Todos" &&
                  t.element !== bestiaryElementFilter
                )
                  return false;
                if (!q) return true;
                return (
                  t.name.toLowerCase().includes(q) ||
                  t.description.toLowerCase().includes(q) ||
                  String(t.vd).includes(q)
                );
              })
              .map((threat) => {
                const vis =
                  ELEMENT_VISUALS[threat.element] ?? ELEMENT_VISUALS.Sangue;
                const Icon = vis.icon;

                return (
                  <button
                    key={threat.id}
                    type="button"
                    onClick={() => setDetailThreat(threat)}
                    className="group text-left"
                  >
                    <Card
                      className={cn(
                        "h-full p-4 space-y-3 transition-all hover:border-white/30 hover:bg-[#14141C]",
                        vis.cardBorderCls
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                            vis.iconBoxCls
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-display text-sm font-bold text-zinc-100 truncate group-hover:text-white">
                              {threat.name}
                            </h3>
                            <Badge variant="default" className="font-mono">
                              VD {threat.vd}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span
                              className={cn(
                                "rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase",
                                vis.badgeCls
                              )}
                            >
                              {threat.element}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-400">
                              PV {threat.pv} · DEF {threat.defense}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {threat.description ||
                          `${threat.type} (${threat.size}) · ${threat.attacks.length} ataque(s) e ${threat.abilities.length} habilidade(s).`}
                      </p>
                    </Card>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAIS DE DETALHES (PROGRESSIVE DISCLOSURE AO CLICAR NOS CARDS)
         ===================================================================== */}

      {/* Modal: Origem */}
      <Modal
        open={Boolean(detailOrigin)}
        onClose={() => setDetailOrigin(null)}
        title={detailOrigin?.name ?? "Origem"}
        description="Origem de Investigador"
      >
        {detailOrigin && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge source={detailOrigin.source} />
              <Badge variant="success">
                Perícias:{" "}
                {(detailOrigin.trainedSkillNotes &&
                detailOrigin.trainedSkillNotes.length > 0
                  ? detailOrigin.trainedSkillNotes
                  : detailOrigin.trainedSkills.map(
                      (k) => SKILLS_BY_KEY[k]?.name ?? k
                    )
                ).join(" e ")}
              </Badge>
            </div>
            {detailOrigin.description && (
              <p className="text-zinc-300 leading-relaxed">
                {detailOrigin.description}
              </p>
            )}
            <div className="rounded-lg border border-white/15 bg-[#0C0C10] p-4 space-y-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-300 block">
                Poder de Origem · {detailOrigin.powerName}
              </span>
              <p className="text-sm text-zinc-200 leading-relaxed">
                {detailOrigin.powerDescription}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Classe */}
      <Modal
        open={Boolean(detailClass)}
        onClose={() => setDetailClass(null)}
        title={detailClass?.name ?? "Classe"}
        description={detailClass?.description}
      >
        {detailClass && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-2.5 font-mono">
              <div className="rounded-lg border border-white/10 bg-[#0C0C10] p-3">
                <span className="text-[10px] text-rose-400 block">
                  PV INICIAL
                </span>
                <span className="text-sm font-bold text-zinc-100">
                  {detailClass.initialPv} (+{detailClass.pvPerLevel}/NEX)
                </span>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#0C0C10] p-3">
                <span className="text-[10px] text-amber-400 block">
                  PE INICIAL
                </span>
                <span className="text-sm font-bold text-zinc-100">
                  {detailClass.initialPe} (+{detailClass.pePerLevel}/NEX)
                </span>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#0C0C10] p-3">
                <span className="text-[10px] text-sky-400 block">
                  SAN INICIAL
                </span>
                <span className="text-sm font-bold text-zinc-100">
                  {detailClass.initialSan} (+{detailClass.sanPerLevel}/NEX)
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#0C0C10] p-3.5 space-y-1">
              <span className="font-mono text-[10px] uppercase text-zinc-400 block">
                Perícias & Proficiências
              </span>
              <p className="text-zinc-200">
                <strong>Perícias:</strong> {detailClass.defaultSkillCount}
              </p>
              <p className="text-zinc-300">
                <strong>Proficiências:</strong>{" "}
                {detailClass.baseProficiencies}
              </p>
            </div>

            <div className="rounded-lg border border-white/15 bg-[#0C0C10] p-4 space-y-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-amber-300 block">
                Habilidade Base · {detailClass.baseAbility.name} (
                {detailClass.baseAbility.peCost} PE)
              </span>
              <p className="text-sm text-zinc-200 leading-relaxed">
                {detailClass.baseAbility.description}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Trilha */}
      <Modal
        open={Boolean(detailTrail)}
        onClose={() => setDetailTrail(null)}
        title={detailTrail?.name ?? "Trilha"}
        description={detailTrail?.description}
      >
        {detailTrail && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <SourceBadge source={detailTrail.source} />
              <Badge variant="default">
                Classe:{" "}
                {allClasses.find((c) => c.id === detailTrail.classId)?.name ??
                  detailTrail.classId}
              </Badge>
            </div>
            <div className="space-y-2.5">
              {detailTrail.abilitiesByNex.map((m) => (
                <div
                  key={`${detailTrail.id}-${m.nex}`}
                  className="rounded-lg border border-white/10 bg-[#0C0C10] p-3.5 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-zinc-100">
                      {m.name}
                    </span>
                    <Badge variant="outline" className="font-mono">
                      {detailTrail.classId === "sobrevivente"
                        ? `Estágio ${m.nex}`
                        : `NEX ${m.nex}%`}
                    </Badge>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">
                    {m.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Poder */}
      <Modal
        open={Boolean(detailPower)}
        onClose={() => setDetailPower(null)}
        title={detailPower?.name ?? "Poder"}
      >
        {detailPower && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge source={detailPower.source} />
              {detailPower.element && (
                <Badge variant="warning">{detailPower.element}</Badge>
              )}
              <Badge variant="outline">
                {(detailPower.peCost ?? 0) > 0
                  ? `${detailPower.peCost} PE`
                  : "Passiva"}
              </Badge>
              {detailPower.prerequisites && (
                <Badge variant="default">
                  Pré-req: {detailPower.prerequisites}
                </Badge>
              )}
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
              {detailPower.description}
            </p>
            {detailPower.affinityDescription && (
              <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 p-3.5 space-y-1">
                <span className="font-mono text-[10px] font-bold uppercase text-amber-300 block">
                  Afinidade (NEX 50%+)
                </span>
                <p className="text-zinc-100 leading-relaxed">
                  {detailPower.affinityDescription}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal: Ritual */}
      <Modal
        open={Boolean(detailRitual)}
        onClose={() => setDetailRitual(null)}
        title={
          detailRitual
            ? `${detailRitual.name} (${detailRitual.circle}º Círculo · ${detailRitual.element})`
            : "Ritual"
        }
      >
        {detailRitual && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
              <div className="rounded border border-white/10 bg-[#0C0C10] p-2.5">
                <span className="text-[10px] text-zinc-400 block">
                  EXECUÇÃO
                </span>
                <span className="font-bold text-zinc-100">
                  {detailRitual.execution}
                </span>
              </div>
              <div className="rounded border border-white/10 bg-[#0C0C10] p-2.5">
                <span className="text-[10px] text-zinc-400 block">ALCANCE</span>
                <span className="font-bold text-zinc-100">
                  {detailRitual.range}
                </span>
              </div>
              <div className="rounded border border-white/10 bg-[#0C0C10] p-2.5">
                <span className="text-[10px] text-zinc-400 block">ALVO</span>
                <span className="font-bold text-zinc-100">
                  {detailRitual.target}
                </span>
              </div>
              <div className="rounded border border-white/10 bg-[#0C0C10] p-2.5">
                <span className="text-[10px] text-zinc-400 block">DURAÇÃO</span>
                <span className="font-bold text-zinc-100">
                  {detailRitual.duration}
                </span>
              </div>
            </div>

            {detailRitual.resistance && (
              <p className="font-mono text-xs text-amber-300">
                Resistência: {detailRitual.resistance}
              </p>
            )}

            <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
              {detailRitual.description}
            </p>

            {detailRitual.discente && (
              <div className="rounded-lg border border-sky-500/35 bg-sky-500/10 p-3 space-y-1">
                <span className="font-mono text-[10px] font-bold uppercase text-sky-300 block">
                  Discente
                </span>
                <p className="text-zinc-100 leading-relaxed">
                  {detailRitual.discente}
                </p>
              </div>
            )}

            {detailRitual.verdadeira && (
              <div className="rounded-lg border border-purple-500/35 bg-purple-500/10 p-3 space-y-1">
                <span className="font-mono text-[10px] font-bold uppercase text-purple-300 block">
                  Verdadeira
                </span>
                <p className="text-zinc-100 leading-relaxed">
                  {detailRitual.verdadeira}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal: Equipamento / Item */}
      <Modal
        open={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        title={detailItem?.name ?? "Equipamento"}
      >
        {detailItem && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge source={detailItem.source} />
              <Badge variant="default">
                Categoria {ROMAN_CAT[detailItem.category]}
              </Badge>
              <Badge variant="outline">{detailItem.spaces} espaço(s)</Badge>
              {detailItem.damageFormula && (
                <Badge variant="danger">
                  Dano {detailItem.damageFormula} ({detailItem.damageType}) ·
                  Crítico {detailItem.threatRange ?? 20}/x
                  {detailItem.critMultiplier ?? 2}
                </Badge>
              )}
              {detailItem.defenseBonus ? (
                <Badge variant="success">
                  +{detailItem.defenseBonus} Defesa
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
              {detailItem.description}
            </p>
          </div>
        )}
      </Modal>

      {/* Modal: Modificação */}
      <Modal
        open={Boolean(detailMod)}
        onClose={() => setDetailMod(null)}
        title={detailMod?.name ?? "Modificação"}
      >
        {detailMod && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <SourceBadge source={detailMod.source} />
              <Badge variant="default">Aplica-se a: {detailMod.appliesTo}</Badge>
              <Badge variant="outline">
                +{detailMod.categoryIncrease} Categoria
              </Badge>
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed">
              {detailMod.description}
            </p>
          </div>
        )}
      </Modal>

      {/* Modal: Maldição */}
      <Modal
        open={Boolean(detailCurse)}
        onClose={() => setDetailCurse(null)}
        title={detailCurse?.name ?? "Maldição"}
      >
        {detailCurse && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <SourceBadge source={detailCurse.source} />
              <Badge variant="warning">{detailCurse.element}</Badge>
              <Badge variant="default">
                Aplica-se a: {detailCurse.appliesTo}
              </Badge>
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed">
              {detailCurse.description}
            </p>
          </div>
        )}
      </Modal>

      {/* Modal: Criatura do Bestiário (com ataques clicáveis) */}
      <Modal
        open={Boolean(detailThreat)}
        onClose={() => setDetailThreat(null)}
        title={
          detailThreat
            ? `${detailThreat.name} — VD ${detailThreat.vd} (${detailThreat.element})`
            : "Criatura"
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
                  ? `Fortitude ${detailThreat.saveFormulas.fortitude} • Reflexos ${detailThreat.saveFormulas.reflexos} • Vontade ${detailThreat.saveFormulas.vontade}`
                  : `Fortitude +${detailThreat.saves.fortitude} • Reflexos +${detailThreat.saves.reflexos} • Vontade +${detailThreat.saves.vontade}`}
              </p>
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
              <div className="rounded-lg border border-sky-400/40 bg-sky-500/10 p-3 space-y-1">
                <span className="font-mono text-[10px] font-bold uppercase text-sky-200 block">
                  Enigma de Medo
                </span>
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
                        onClick={() => {
                          const res = rollOrdemTest({
                            attributeValue: atk.diceCount,
                            bonus: atk.testBonus,
                            threatRange: atk.threatRange,
                          });
                          pushRoll({
                            actorName: detailThreat.name,
                            label: `Ataque: ${atk.name}`,
                            kind: "threat",
                            element: detailThreat.element,
                            formula: res.formula,
                            diceRolled: res.diceRolled,
                            chosenDie: res.chosenDie,
                            mode: res.mode,
                            bonus: res.bonus,
                            total: res.total,
                            isNat20: res.isNat20,
                            isNat1: res.isNat1,
                            isCriticalThreat: res.isCriticalThreat,
                          });
                        }}
                      >
                        <Dices className="h-3 w-3" /> Rolar Ataque
                      </Button>
                      <Button
                        size="xs"
                        variant="default"
                        onClick={() => {
                          const res = rollDiceFormula({
                            formula: atk.damageFormula,
                            isCritical: false,
                            critMultiplier: atk.critMultiplier,
                          });
                          pushRoll({
                            actorName: detailThreat.name,
                            label: `Dano: ${atk.name} (${atk.damageType})`,
                            kind: "damage",
                            element: detailThreat.element,
                            formula: res.effectiveFormula,
                            diceRolled: res.diceRolled,
                            mode: "sum",
                            bonus: res.bonus,
                            total: res.total,
                            details: res.breakdown,
                          });
                        }}
                      >
                        <Swords className="h-3 w-3 text-rose-400" /> Rolar Dano
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
