"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Flame,
  Minus,
  Plus,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { BASE_ORIGINS } from "@/data/origins";
import { ALL_CLASSES, getClassById } from "@/data/classes";
import {
  COMMUNITY_ORIGINS,
  COMMUNITY_POWERS,
  COMMUNITY_RITUALS,
  COMMUNITY_TRAILS,
} from "@/data/supplements";
import { SOURCE_LABELS, isCommunitySource } from "@/lib/sources";
import { SourceBadge, SourceToggleGroup, setCommunityList } from "@/components/SourceToggles";
import { BASE_TRAILS } from "@/data/trails";
import { BASE_CLASS_POWERS } from "@/data/classPowers";
import { BASE_GENERAL_POWERS } from "@/data/generalPowers";
import { BASE_PARANORMAL_POWERS } from "@/data/paranormalPowers";
import { BASE_RITUALS } from "@/data/rituals";
import { createDefaultSkills, SKILLS_BY_KEY, SKILLS_LIST } from "@/data/skills";
import {
  calculateVitals,
  getNexMilestones,
  getProgressionLevel,
  NEX_STEPS,
  SURVIVOR_STAGES,
  validateInitialAttributes,
} from "@/lib/ordem-rules";
import { cn, ELEMENT_STYLES, generateId } from "@/lib/utils";
import type {
  Agent,
  AgentAbility,
  AgentClassId,
  AttributeKey,
  ContentSource,
  Patente,
  SkillKey,
} from "@/types/ordem";
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  Textarea,
} from "@/components/ui/primitives";

const STEPS = [
  { id: 1, title: "Modo & Conceito" },
  { id: 2, title: "Atributos" },
  { id: 3, title: "Origem" },
  { id: 4, title: "Classe & Trilha" },
  { id: 5, title: "Perícias, Poderes & Rituais" },
];

const ATTRIBUTES_META: { key: AttributeKey; label: string; desc: string }[] = [
  { key: "AGI", label: "Agilidade", desc: "Defesa, Esquiva, Pontaria, Furtividade, Reflexos" },
  { key: "FOR", label: "Força", desc: "Capacidade de Carga, Luta, Atletismo, dano corpo a corpo" },
  { key: "INT", label: "Intelecto", desc: "Investigação, Ocultismo, Perícias extras, Tecnologia" },
  { key: "PRE", label: "Presença", desc: "PE, PD, DT de Rituais, Vontade, Percepção" },
  { key: "VIG", label: "Vigor", desc: "Pontos de Vida (PV), Fortitude, Bloqueio" },
];

const PATENTES: Patente[] = [
  "Recruta",
  "Operador",
  "Agente Especial",
  "Oficial de Operações",
  "Agente de Elite",
];

export default function NovoAgenteWizardPage() {
  const router = useRouter();
  const { homebrew, addAgent } = useAppStore();

  const [step, setStep] = useState(1);

  // Step 1: Mode & Concept
  const [mode, setMode] = useState<"agente" | "sobrevivente">("agente");
  const [enabledSources, setEnabledSources] = useState<ContentSource[]>([
    "livro_basico",
    "sobrevivendo_ao_horror",
    "arquivos_secretos",
    "homebrew",
  ]);
  const [usePdRule, setUsePdRule] = useState(false);
  const [name, setName] = useState("");
  const [player, setPlayer] = useState("");
  const [patente, setPatente] = useState<Patente>("Recruta");
  const [avatar, setAvatar] = useState("");
  const [background, setBackground] = useState("");
  const [nex, setNex] = useState<number>(5);
  const [stage, setStage] = useState<number>(1);

  // Step 2: Attributes (Official rule: all 5 start at 1; distribute +4 Agente / +3 Sobrevivente)
  const [attributes, setAttributes] = useState<Record<AttributeKey, number>>({
    AGI: 1,
    FOR: 1,
    INT: 1,
    PRE: 1,
    VIG: 1,
  });

  // Step 3: Origin
  const filteredOrigins = useMemo(() => {
    const all = [...BASE_ORIGINS, ...COMMUNITY_ORIGINS, ...homebrew.origins];
    return all.filter((o) => enabledSources.includes(o.source ?? "livro_basico"));
  }, [homebrew.origins, enabledSources]);

  const [originId, setOriginId] = useState<string>(BASE_ORIGINS[0].id);
  const selectedOrigin = useMemo(
    () =>
      filteredOrigins.find((o) => o.id === originId) ??
      filteredOrigins[0] ??
      BASE_ORIGINS[0],
    [filteredOrigins, originId]
  );

  // Step 4: Class & Trail
  const [classId, setClassId] = useState<AgentClassId>("combatente");
  const [trilhaId, setTrilhaId] = useState<string | null>(null);

  const effectiveClassId: AgentClassId =
    mode === "sobrevivente" ? "sobrevivente" : classId === "sobrevivente" ? "combatente" : classId;

  const selectedClass = useMemo(
    () => getClassById(effectiveClassId),
    [effectiveClassId]
  );

  const availableTrails = useMemo(() => {
    const all = [...BASE_TRAILS, ...COMMUNITY_TRAILS, ...(homebrew.trails ?? [])];
    return all.filter(
      (t) =>
        t.classId === effectiveClassId &&
        enabledSources.includes(t.source ?? "livro_basico")
    );
  }, [effectiveClassId, homebrew.trails, enabledSources]);

  const trilhaUnlocked =
    effectiveClassId === "sobrevivente" ? stage >= 2 : nex >= 10;

  // Step 5: Skills, Powers & Initial Rituals
  const [chosenSkills, setChosenSkills] = useState<SkillKey[]>([]);
  const [combatentAtkSkill, setCombatentAtkSkill] = useState<"luta" | "pontaria">("luta");
  const [combatentDefSkill, setCombatentDefSkill] = useState<"fortitude" | "reflexos">("fortitude");
  const [predadorSecondSkill, setPredadorSecondSkill] = useState<
    "percepcao" | "sobrevivencia"
  >("percepcao");
  const [selectedPowerIds, setSelectedPowerIds] = useState<string[]>([]);
  const [selectedRitualIds, setSelectedRitualIds] = useState<string[]>([]);
  const [originSearch, setOriginSearch] = useState("");
  const [powerSearch, setPowerSearch] = useState("");
  const [ritualSearch, setRitualSearch] = useState("");

  const toggleSource = (src: ContentSource) => {
    setEnabledSources((prev) => {
      if (prev.includes(src)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== src);
      }
      return [...prev, src];
    });
  };

  const handleModeChange = (nextMode: "agente" | "sobrevivente") => {
    setMode(nextMode);
    if (nextMode === "sobrevivente") {
      setClassId("sobrevivente");
      setNex(0);
      setStage(1);
      setTrilhaId(null);
      setAttributes({ AGI: 1, FOR: 1, INT: 1, PRE: 1, VIG: 1 });
      if (!enabledSources.includes("sobrevivendo_ao_horror")) {
        setEnabledSources((prev) => [...prev, "sobrevivendo_ao_horror"]);
      }
    } else {
      if (classId === "sobrevivente") setClassId("combatente");
      setNex(5);
      setTrilhaId(null);
      setAttributes({ AGI: 1, FOR: 1, INT: 1, PRE: 1, VIG: 1 });
    }
    setChosenSkills([]);
    setSelectedPowerIds([]);
    setSelectedRitualIds([]);
  };

  const attrValidation = useMemo(
    () => validateInitialAttributes(attributes, effectiveClassId),
    [attributes, effectiveClassId]
  );

  const milestones = useMemo(
    () =>
      getNexMilestones(
        effectiveClassId,
        effectiveClassId === "sobrevivente" ? 0 : nex,
        stage
      ),
    [effectiveClassId, nex, stage]
  );

  // Automatic locked skills from Origin + Class mandatory
  const lockedSkills = useMemo(() => {
    const set = new Set<SkillKey>(selectedOrigin.trainedSkills);
    if (effectiveClassId === "combatente") {
      set.add(combatentAtkSkill);
      set.add(combatentDefSkill);
    } else if (effectiveClassId === "ocultista") {
      set.add("ocultismo");
      set.add("vontade");
    } else if (effectiveClassId === "devoto") {
      set.add("religiao");
      set.add("diplomacia");
    } else if (effectiveClassId === "predador") {
      set.add(combatentAtkSkill);
      set.add(predadorSecondSkill);
    }
    return set;
  }, [
    selectedOrigin,
    effectiveClassId,
    combatentAtkSkill,
    combatentDefSkill,
    predadorSecondSkill,
  ]);

  const freeSkillQuota = useMemo(() => {
    const intVal = attributes.INT;
    if (effectiveClassId === "combatente") return Math.max(1, 1 + intVal);
    if (effectiveClassId === "especialista") return Math.max(1, 7 + intVal);
    if (effectiveClassId === "ocultista") return Math.max(1, 3 + intVal);
    if (effectiveClassId === "devoto") return Math.max(1, 4 + intVal);
    if (effectiveClassId === "predador") return Math.max(1, 3 + intVal);
    return Math.max(1, 1 + intVal); // sobrevivente
  }, [effectiveClassId, attributes.INT]);

  const availablePowers = useMemo(() => {
    const all = [
      ...BASE_CLASS_POWERS.filter((p) => p.classId === effectiveClassId),
      ...BASE_GENERAL_POWERS,
      ...BASE_PARANORMAL_POWERS,
      ...COMMUNITY_POWERS.filter(
        (p) => p.category !== "classe" || p.classId === effectiveClassId
      ),
      ...(homebrew.powers ?? []).filter(
        (p) => !p.classId || p.classId === effectiveClassId
      ),
    ];
    return all.filter((p) => enabledSources.includes(p.source ?? "livro_basico"));
  }, [effectiveClassId, homebrew.powers, enabledSources]);

  const availableRituals = useMemo(() => {
    const maxCircle = milestones.maxRitualCircle;
    return [...homebrew.rituals, ...COMMUNITY_RITUALS, ...BASE_RITUALS].filter(
      (r) =>
        r.circle <= Math.max(1, maxCircle) &&
        enabledSources.includes(r.source ?? "livro_basico")
    );
  }, [homebrew.rituals, milestones.maxRitualCircle, enabledSources]);

  const initialRitualQuota = useMemo(() => {
    if (effectiveClassId === "devoto") {
      // Disruptura: 2 rituais de 1º círculo + 1 por novo círculo desbloqueado
      return 2 + Math.max(0, milestones.maxRitualCircle - 1);
    }
    if (effectiveClassId !== "ocultista") return 0;
    const lvl = getProgressionLevel("ocultista", nex);
    // 3 at NEX 5% (lvl 1) + 1 per NEX step increase
    return 3 + (lvl - 1);
  }, [effectiveClassId, nex, milestones.maxRitualCircle]);

  const transcenderSelectedCount = useMemo(() => {
    return selectedPowerIds.filter((id) => {
      const p = availablePowers.find((x) => x.id === id);
      return p?.name.toLowerCase().startsWith("transcender");
    }).length;
  }, [selectedPowerIds, availablePowers]);

  const previewVitals = useMemo(
    () =>
      calculateVitals({
        classId: effectiveClassId,
        nex: effectiveClassId === "sobrevivente" ? 0 : nex,
        stage,
        vig: attributes.VIG,
        pre: attributes.PRE,
        patente,
        optionalRules: usePdRule ? ["jogando_sem_sanidade"] : [],
        halfInitialSan: Boolean(
          selectedOrigin.efeitosPassivos?.metadeSanInicial ||
            selectedOrigin.halfInitialSan
        ),
        transcenderCount: transcenderSelectedCount,
      }),
    [
      effectiveClassId,
      nex,
      stage,
      attributes.VIG,
      attributes.PRE,
      patente,
      usePdRule,
      selectedOrigin.id,
      transcenderSelectedCount,
    ]
  );

  const adjustAttribute = (key: AttributeKey, delta: number) => {
    setAttributes((prev) => {
      const next = prev[key] + delta;
      if (next < 0 || next > 3) return prev;
      return { ...prev, [key]: next };
    });
  };

  const toggleFreeSkill = (key: SkillKey) => {
    if (lockedSkills.has(key)) return;
    setChosenSkills((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= freeSkillQuota) return prev;
      return [...prev, key];
    });
  };

  const togglePower = (id: string) => {
    setSelectedPowerIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= Math.max(milestones.classPowersCount, 0)) return prev;
      return [...prev, id];
    });
  };

  const toggleRitual = (id: string) => {
    setSelectedRitualIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= initialRitualQuota) return prev;
      return [...prev, id];
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFinish = () => {
    const now = new Date().toISOString();
    const allTrained = Array.from(
      new Set<SkillKey>([...lockedSkills, ...chosenSkills])
    );
    const skills = createDefaultSkills(allTrained);

    const abilities: AgentAbility[] = [
      {
        id: generateId("ab"),
        name: selectedOrigin.powerName,
        source: "Origem",
        peCost: selectedOrigin.powerPeCost ?? 0,
        description: selectedOrigin.powerDescription,
        bookSource: selectedOrigin.source,
      },
      {
        id: generateId("ab"),
        name: selectedClass.baseAbility.name,
        source: "Classe",
        peCost: selectedClass.baseAbility.peCost,
        description: selectedClass.baseAbility.description,
        bookSource: selectedClass.source,
      },
    ];

    // Trail abilities unlocked at current NEX/Stage
    const chosenTrail = availableTrails.find((t) => t.id === trilhaId);
    if (chosenTrail && trilhaUnlocked) {
      chosenTrail.abilitiesByNex.forEach((ta) => {
        const thresholdOk =
          effectiveClassId === "sobrevivente"
            ? stage >= ta.nex
            : nex >= ta.nex;
        if (thresholdOk) {
          abilities.push({
            id: generateId("ab"),
            name: ta.name,
            source: "Trilha",
            peCost: ta.peCost ?? 0,
            description: ta.description,
            bookSource: chosenTrail.source,
          });
        }
      });
    }

    // Selected powers from Step 5
    selectedPowerIds.forEach((pid) => {
      const def = availablePowers.find((p) => p.id === pid);
      if (!def) return;
      abilities.push({
        id: generateId("ab"),
        name: def.name,
        source:
          def.category === "paranormal"
            ? "Paranormal"
            : def.category === "geral"
            ? "Geral"
            : "Classe",
        peCost: def.peCost,
        element: def.element,
        description: def.description,
        affinityDescription: def.affinityDescription,
        isTranscender: def.name.toLowerCase().startsWith("transcender"),
        bookSource: def.source,
      });
    });

    // Apply RD passives from Origin (PV/PE/SAN/Defense passives are computed dynamically by ordem-rules!)
    const eff = selectedOrigin.efeitosPassivos;
    const initialResistances: Record<string, number> = {};
    if (eff?.rdMentalPorInt && attributes.INT > 0) {
      initialResistances.Mental = attributes.INT * eff.rdMentalPorInt;
    }
    if (eff?.rdMentalPorPre && attributes.PRE > 0) {
      initialResistances.Mental =
        (initialResistances.Mental ?? 0) + attributes.PRE * eff.rdMentalPorPre;
    }
    if (eff?.rdGeral && eff.rdGeral > 0) {
      initialResistances.Geral = eff.rdGeral;
    }

    const chosenRituals = availableRituals.filter((r) =>
      selectedRitualIds.includes(r.id)
    );

    const newAgent: Agent = {
      id: generateId("agent"),
      name: name.trim() || "Agente Sem Nome",
      player: player.trim() || "Jogador",
      avatar: avatar.trim(),
      originId: selectedOrigin.id,
      classId: effectiveClassId,
      trilhaId: trilhaUnlocked ? trilhaId : null,
      nex: effectiveClassId === "sobrevivente" ? 0 : nex,
      stage: effectiveClassId === "sobrevivente" ? stage : undefined,
      patente,
      transcenderCount: transcenderSelectedCount,
      permanentSanLoss: 0,
      enabledSources,
      optionalRules: usePdRule ? ["jogando_sem_sanidade"] : [],
      attributes,
      status: {
        pv: {
          current: previewVitals.maxPv,
          temp: 0,
          maxOverride: null,
          autoCalc: true,
        },
        san: {
          current: previewVitals.maxSan,
          temp: 0,
          maxOverride: null,
          autoCalc: true,
        },
        pe: {
          current: previewVitals.maxPe,
          temp: 0,
          maxOverride: null,
          autoCalc: true,
        },
        pd: {
          current: previewVitals.maxPd,
          temp: 0,
          maxOverride: null,
          autoCalc: true,
        },
        machucado: false,
        morrendo: false,
        morrendoTurns: 0,
        perturbado: false,
        enlouquecendo: false,
        enlouquecendoTurns: 0,
        vulneravel: false,
      },
      defense: {
        protectionBonus: 0,
        shieldBonus: 0,
        paranormalAccessoryBonus: 0,
        abilityBonus: 0,
        otherBonus: 0,
        displacement: 9,
        resistances: initialResistances,
      },
      ritualDTBonus: 0,
      skills,
      attacks: [
        {
          id: generateId("atk"),
          name: "Ataque Desarmado",
          skill: "luta",
          attackBonus: 0,
          damageFormula: `1d3+${attributes.FOR + (eff?.danoCorpoACorpo ?? 0)}`,
          damageType: "Impacto",
          threatRange: 20,
          critMultiplier: 2,
          range: "Corpo a Corpo",
        },
      ],
      abilities,
      rituals: chosenRituals,
      inventory: [],
      description: {
        appearance: "",
        personality: "",
        background: background.trim(),
        objective: "",
        favorites: "",
        notes: "",
      },
      createdAt: now,
      updatedAt: now,
    };

    addAgent(newAgent);
    router.push(`/agente/${newAgent.id}`);
  };

  const canAdvance =
    step === 1
      ? name.trim().length > 0
      : step === 2
      ? attrValidation.valid
      : true;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#22222A] pb-5">
        <div>
          <Link
            href="/agentes"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#8E8E9E] hover:text-[#F4F4F5] mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Meus Agentes
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F4F5]">
            Recrutamento de Investigador
          </h1>
          <p className="text-xs text-[#8E8E9E] mt-0.5">
            Ordem Paranormal RPG v1.2 · Suporte a Sobrevivendo ao Horror e Homebrew
          </p>
        </div>

        {/* Live Vitals Preview Strip */}
        <div className="flex items-center gap-3 rounded-md border border-[#22222A] bg-[#101014] px-4 py-2.5 font-mono text-xs tabular-nums">
          <div>
            <span className="text-[10px] text-red-400 block">PV</span>
            <span className="font-bold text-[#F4F4F5]">{previewVitals.maxPv}</span>
          </div>
          {usePdRule ? (
            <div>
              <span className="text-[10px] text-purple-400 block">PD</span>
              <span className="font-bold text-[#F4F4F5]">{previewVitals.maxPd}</span>
            </div>
          ) : (
            <>
              <div>
                <span className="text-[10px] text-sky-400 block">SAN</span>
                <span className="font-bold text-[#F4F4F5]">{previewVitals.maxSan}</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-400 block">PE</span>
                <span className="font-bold text-[#F4F4F5]">{previewVitals.maxPe}</span>
              </div>
            </>
          )}
          <div className="border-l border-[#22222A] pl-3">
            <span className="text-[10px] text-[#8E8E9E] block">LIM. PE</span>
            <span className="font-bold text-[#F4F4F5]">{previewVitals.peLimit}</span>
          </div>
        </div>
      </div>

      {/* 5-Step Progress Indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {STEPS.map((s) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (s.id < step) setStep(s.id);
              }}
              className={cn(
                "flex items-center gap-2 rounded-sm border px-3 py-2.5 text-left transition-colors",
                active
                  ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                  : done
                  ? "border-emerald-500/40 bg-emerald-600/10 text-emerald-200"
                  : "border-[#22222A] bg-[#101014] text-[#6E6E7E]"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm font-mono text-[11px] font-bold border",
                  active
                    ? "border-[#F4F4F5] bg-[#F4F4F5] text-[#09090B]"
                    : done
                    ? "border-emerald-500/50 bg-emerald-600 text-white"
                    : "border-[#22222A] bg-[#0D0D11] text-[#6E6E7E]"
                )}
              >
                {done ? <Check className="h-3 w-3" /> : s.id}
              </span>
              <span className="text-xs font-semibold leading-tight">{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* ================= STEP 1: MODO & CONCEITO ================= */}
      {step === 1 && (
        <Card className="p-6 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleModeChange("agente")}
              className={cn(
                "rounded-md border p-4 text-left transition-colors",
                mode === "agente"
                  ? "border-[#F4F4F5] bg-[#16161C]"
                  : "border-[#22222A] bg-[#0D0D11] hover:border-[#32323E]"
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-bold text-[#F4F4F5]">
                  Agente da Ordem (NEX 5%–99%)
                </h2>
                <Badge variant="outline">LIVRO BÁSICO</Badge>
              </div>
              <p className="mt-1.5 text-xs text-[#8E8E9E] leading-relaxed">
                +4 pontos de atributo, escolha entre Combatente, Especialista ou Ocultista, Trilhas em NEX 10% e Limite de PE escalável.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("sobrevivente")}
              className={cn(
                "rounded-md border p-4 text-left transition-colors",
                mode === "sobrevivente"
                  ? "border-red-500/70 bg-red-600/10"
                  : "border-[#22222A] bg-[#0D0D11] hover:border-[#32323E]"
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-bold text-[#F4F4F5]">
                  Sobrevivente (NEX 0% · Estágios 1–5)
                </h2>
                <Badge variant="danger">SAH</Badge>
              </div>
              <p className="mt-1.5 text-xs text-[#8E8E9E] leading-relaxed">
                +3 pontos de atributo, Limite de PE fixo em 1, Trilhas Durão / Esperto / Esotérico nos Estágios 2 e 4.
              </p>
            </button>
          </div>

          {/* Active Books Filter */}
          <div className="rounded-md border border-[#22222A] bg-[#0D0D11] p-4 space-y-2.5">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#A1A1AA]">
              <BookOpen className="h-3.5 w-3.5 text-[#8E8E9E]" />
              Livros e Suplementos Ativos na Ficha
            </div>
            <SourceToggleGroup
              enabled={enabledSources}
              onToggle={toggleSource}
              onSetCommunity={(on) =>
                setEnabledSources((prev) => setCommunityList(prev, on))
              }
            />
            <label className="mt-2 inline-flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={usePdRule}
                onChange={(e) => setUsePdRule(e.target.checked)}
                className="rounded border-[#2C2C3E] bg-[#12121A] text-purple-600 focus:ring-purple-500"
              />
              Usar regra opcional <strong>Pontos de Determinação (PD)</strong> — substitui PE e SAN por barra unificada (SaH)
            </label>
          </div>

          {/* Identity Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                Nome do Agente *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Arthur Cervero, Liz Webber..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                Nome do Jogador
              </label>
              <Input
                value={player}
                onChange={(e) => setPlayer(e.target.value)}
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                {mode === "sobrevivente" ? "Estágio Inicial (1 a 5)" : "NEX Inicial"}
              </label>
              {mode === "sobrevivente" ? (
                <Select
                  value={stage}
                  onChange={(e) => {
                    const st = Number(e.target.value);
                    setStage(st);
                    if (st < 2) setTrilhaId(null);
                  }}
                  className="font-mono"
                >
                  {SURVIVOR_STAGES.map((st) => (
                    <option key={st} value={st}>
                      Estágio {st} (NEX 0%)
                    </option>
                  ))}
                </Select>
              ) : (
                <Select
                  value={nex}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setNex(val);
                    if (val < 10) setTrilhaId(null);
                  }}
                  className="font-mono"
                >
                  {NEX_STEPS.map((n) => (
                    <option key={n} value={n}>
                      NEX {n}%
                    </option>
                  ))}
                </Select>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                Patente na Ordem
              </label>
              <Select
                value={patente}
                onChange={(e) => setPatente(e.target.value as Patente)}
              >
                {PATENTES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">
                Avatar (URL de imagem ou upload local)
              </label>
              <Input
                value={avatar.startsWith("data:") ? "(Imagem carregada via arquivo)" : avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#2C2C3E] bg-[#181824] px-3 text-xs font-medium text-zinc-200 hover:bg-[#222234]">
              <Upload className="h-3.5 w-3.5" /> Enviar Imagem
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              Histórico Resumido (opcional)
            </label>
            <Textarea
              rows={2}
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="Como o paranormal cruzou o seu caminho?"
            />
          </div>
        </Card>
      )}

      {/* ================= STEP 2: ATRIBUTOS ================= */}
      {step === 2 && (
        <Card className="p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#F4F4F5]">
                Distribuição de Atributos ({mode === "sobrevivente" ? "+3 pontos" : "+4 pontos"})
              </h2>
              <p className="text-xs text-[#8E8E9E] mt-0.5">
                Todos os atributos começam em <strong className="text-[#F4F4F5]">1</strong>. Máximo <strong className="text-[#F4F4F5]">3</strong> na criação inicial; reduza até 1 atributo para <strong className="text-[#F4F4F5]">0</strong> para ganhar +1 ponto extra.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() =>
                  setAttributes({ AGI: 1, FOR: 1, INT: 1, PRE: 1, VIG: 1 })
                }
              >
                Resetar (todos em 1)
              </Button>
              <Badge
                variant={attrValidation.pointsRemaining === 0 && attrValidation.valid ? "success" : "warning"}
                className="font-mono text-xs px-3 py-1 tabular-nums"
              >
                Restantes: {attrValidation.pointsRemaining} pt(s)
                {attrValidation.zeroCount > 0 ? " (+1 de atributo 0)" : ""}
              </Badge>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-5">
            {ATTRIBUTES_META.map((meta) => {
              const val = attributes[meta.key];
              const canDecrease =
                val > 0 && !(val === 1 && attrValidation.zeroCount >= 1);
              const canIncrease = val < 3 && attrValidation.pointsRemaining > 0;
              return (
                <div
                  key={meta.key}
                  className="rounded-md border border-[#22222A] bg-[#0D0D11] p-4 flex flex-col items-center text-center justify-between gap-3"
                >
                  <div>
                    <span className="font-mono text-xs font-bold tracking-[0.18em] text-[#F4F4F5]">
                      {meta.key}
                    </span>
                    <p className="text-xs font-semibold text-[#D4D4D8] mt-0.5">{meta.label}</p>
                    <p className="mt-1 text-[10px] text-[#6E6E7E] leading-snug">
                      {meta.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => adjustAttribute(meta.key, -1)}
                      disabled={!canDecrease}
                      title={
                        val === 1 && attrValidation.zeroCount >= 1
                          ? "Limite de 1 atributo em 0 já atingido"
                          : "Reduzir atributo"
                      }
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-8 font-mono text-2xl font-bold text-[#F4F4F5] tabular-nums">
                      {val}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => adjustAttribute(meta.key, 1)}
                      disabled={!canIncrease}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {!attrValidation.valid && (
            <div className="rounded-sm border border-amber-500/40 bg-amber-600/10 p-3 text-xs text-amber-200 space-y-1">
              {attrValidation.errors.map((err, i) => (
                <p key={i}>• {err}</p>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ================= STEP 3: ORIGEM ================= */}
      {step === 3 && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#22222A] pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#F4F4F5]">
                Escolha sua Origem ({filteredOrigins.length} disponíveis)
              </h2>
              <p className="text-xs text-[#8E8E9E] mt-0.5">
                Aplica automaticamente as perícias treinadas e o poder de origem (incluindo bônus passivos).
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6E6E7E]" />
              <Input
                value={originSearch}
                onChange={(e) => setOriginSearch(e.target.value)}
                placeholder="Buscar origem, perícia ou poder..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {filteredOrigins
              .filter((origin) => {
                const q = originSearch.trim().toLowerCase();
                if (!q) return true;
                return (
                  origin.name.toLowerCase().includes(q) ||
                  origin.powerName.toLowerCase().includes(q) ||
                  origin.powerDescription.toLowerCase().includes(q) ||
                  origin.description.toLowerCase().includes(q) ||
                  origin.trainedSkills.some((sk) =>
                    (SKILLS_BY_KEY[sk]?.name ?? sk).toLowerCase().includes(q)
                  )
                );
              })
              .map((origin) => {
                const selected = selectedOrigin.id === origin.id;
                const showNarrativeDesc =
                  origin.description &&
                  origin.description.trim() !== origin.powerDescription.trim();
                return (
                  <button
                    key={origin.id}
                    type="button"
                    onClick={() => setOriginId(origin.id)}
                    className={cn(
                      "w-full rounded-md border border-l-[3px] px-4 py-3.5 text-left transition-colors space-y-2.5",
                      selected
                        ? "border-[#F4F4F5] border-l-[#F4F4F5] bg-[#16161C]"
                        : "border-[#22222A] border-l-[#32323E] bg-[#0D0D11] hover:border-[#32323E] hover:bg-[#111117]"
                    )}
                  >
                    {/* Header Row: Name + Perícias + Fonte */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border font-mono text-[10px]",
                            selected
                              ? "border-[#F4F4F5] bg-[#F4F4F5] text-[#09090B]"
                              : "border-[#32323E] bg-[#09090B] text-transparent"
                          )}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                        <h3 className="font-display text-[15px] font-bold text-[#F4F4F5]">
                          {origin.name}
                        </h3>
                        <SourceBadge source={origin.source} />
                        <span className="font-mono text-[10px] text-[#6E6E7E]">
                          {SOURCE_LABELS[origin.source ?? "livro_basico"]}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {origin.trainedSkills.map((sk) => (
                          <Badge
                            key={sk}
                            variant="purple"
                            className="font-mono text-[10px]"
                          >
                            {SKILLS_BY_KEY[sk]?.name ?? sk}
                          </Badge>
                        ))}
                        {origin.trainedSkillNotes?.map((note, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="font-mono text-[10px] text-[#D4D4D8]"
                          >
                            {note}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {origin.prerequisites && (
                      <p className="font-mono text-[11px] text-amber-300">
                        Pré-requisito: {origin.prerequisites}
                      </p>
                    )}

                    {showNarrativeDesc && (
                      <p className="text-xs text-[#A1A1AA] leading-relaxed">
                        {origin.description}
                      </p>
                    )}

                    {/* Power & Full Description Below */}
                    <div className="rounded-sm border border-[#1E1E26] bg-[#0A0A0E] px-3.5 py-2.5 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-purple-300">
                          PODER DE ORIGEM · {origin.powerName}
                        </span>
                        {(origin.powerPeCost ?? 0) > 0 && (
                          <span className="font-mono text-[10px] text-amber-300">
                            ({origin.powerPeCost} PE)
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-[#D4D4D8] leading-relaxed">
                        {origin.powerDescription}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        </Card>
      )}

      {/* ================= STEP 4: CLASSE & TRILHA ================= */}
      {step === 4 && (
        <Card className="p-6 space-y-6">
          <div className="border-b border-[#22222A] pb-3">
            <h2 className="font-display text-base font-bold text-[#F4F4F5]">
              Classe{" "}
              {trilhaUnlocked
                ? "& Trilha"
                : "(Trilha desbloqueia em NEX 10% / Estágio 2)"}
            </h2>
            <p className="text-xs text-[#8E8E9E] mt-0.5">
              Define PV, PE, SAN, PD, proficiências e habilidades base do personagem.
            </p>
          </div>

          {/* Single-Column Vertical Class List */}
          <div className="flex flex-col gap-3">
            {ALL_CLASSES.filter((c) =>
              mode === "sobrevivente"
                ? c.id === "sobrevivente"
                : c.id !== "sobrevivente" &&
                  (!isCommunitySource(c.source) ||
                    enabledSources.includes(c.source))
            ).map((cls) => {
              const selected = effectiveClassId === cls.id;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => {
                    setClassId(cls.id);
                    setTrilhaId(null);
                    setChosenSkills([]);
                    setSelectedPowerIds([]);
                    setSelectedRitualIds([]);
                  }}
                  className={cn(
                    "w-full rounded-md border border-l-[3px] px-4 py-4 text-left transition-colors space-y-3",
                    selected
                      ? "border-[#F4F4F5] border-l-[#F4F4F5] bg-[#16161C]"
                      : "border-[#22222A] border-l-[#32323E] bg-[#0D0D11] hover:border-[#32323E] hover:bg-[#111117]"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border font-mono text-[10px]",
                          selected
                            ? "border-[#F4F4F5] bg-[#F4F4F5] text-[#09090B]"
                            : "border-[#32323E] bg-[#09090B] text-transparent"
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      <h3 className="font-display text-base font-bold text-[#F4F4F5]">
                        {cls.name}
                      </h3>
                      <SourceBadge source={cls.source} />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                      <Badge variant="outline">
                        PV {cls.initialPv}+VIG (+{cls.pvPerLevel}+VIG/NEX)
                      </Badge>
                      <Badge variant="outline">
                        PE {cls.initialPe}+PRE (+{cls.pePerLevel}+PRE/NEX)
                      </Badge>
                      <Badge variant="outline">
                        SAN {cls.initialSan} (+{cls.sanPerLevel}/NEX)
                      </Badge>
                    </div>
                  </div>

                  {/* Description directly below title */}
                  <p className="text-[13px] text-[#D4D4D8] leading-relaxed">
                    {cls.description}
                  </p>

                  {/* Base Ability & Proficiencies Box */}
                  <div className="rounded-sm border border-[#1E1E26] bg-[#0A0A0E] px-3.5 py-2.5 space-y-1.5 text-xs">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-[#A1A1AA]">
                      <span>
                        <strong className="text-[#F4F4F5]">Perícias:</strong>{" "}
                        {cls.defaultSkillCount}
                      </span>
                      <span>
                        <strong className="text-[#F4F4F5]">
                          Proficiências:
                        </strong>{" "}
                        {cls.baseProficiencies}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#D4D4D8] leading-relaxed pt-1 border-t border-[#181820]">
                      <strong className="font-mono text-[10px] uppercase tracking-wider text-purple-300">
                        HABILIDADE BASE · {cls.baseAbility.name}:
                      </strong>{" "}
                      {cls.baseAbility.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Single-Column Vertical Trail Selection */}
          <div className="space-y-3 pt-4 border-t border-[#22222A]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-bold text-[#F4F4F5]">
                  Trilha de {selectedClass.name} ({availableTrails.length}{" "}
                  disponíveis)
                </h3>
                <p className="text-xs text-[#8E8E9E]">
                  Cada trilha concede habilidades progressivas em NEX 10%, 40%,
                  65% e 99%.
                </p>
              </div>
              {!trilhaUnlocked && (
                <Badge variant="warning" className="text-[10px]">
                  {effectiveClassId === "sobrevivente"
                    ? "Disponível a partir do Estágio 2"
                    : "Disponível a partir de NEX 10%"}
                </Badge>
              )}
            </div>

            {trilhaUnlocked ? (
              <div className="flex flex-col gap-2.5">
                {availableTrails.map((t) => {
                  const selected = trilhaId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTrilhaId(selected ? null : t.id)}
                      className={cn(
                        "w-full rounded-md border border-l-[3px] px-4 py-3.5 text-left transition-colors space-y-2.5",
                        selected
                          ? "border-[#F4F4F5] border-l-[#F4F4F5] bg-[#16161C]"
                          : "border-[#22222A] border-l-[#32323E] bg-[#0D0D11] hover:border-[#32323E] hover:bg-[#111117]"
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border font-mono text-[10px]",
                              selected
                                ? "border-[#F4F4F5] bg-[#F4F4F5] text-[#09090B]"
                                : "border-[#32323E] bg-[#09090B] text-transparent"
                            )}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                          <span className="font-display text-[15px] font-bold text-[#F4F4F5]">
                            {t.name}
                          </span>
                          <SourceBadge source={t.source} />
                          <span className="font-mono text-[10px] text-[#6E6E7E]">
                            {SOURCE_LABELS[t.source ?? "livro_basico"]}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          {t.abilitiesByNex.map((ab) => (
                            <Badge
                              key={`${t.id}-${ab.nex}`}
                              variant="outline"
                              className="font-mono text-[10px]"
                            >
                              {effectiveClassId === "sobrevivente"
                                ? `Est. ${ab.nex}`
                                : `${ab.nex}%`}{" "}
                              · {ab.name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 rounded-sm border border-[#1E1E26] bg-[#0A0A0E] px-3.5 py-2.5">
                        {t.abilitiesByNex.map((ab) => (
                          <p
                            key={`${t.id}-desc-${ab.nex}`}
                            className="text-[12.5px] text-[#D4D4D8] leading-relaxed"
                          >
                            <strong className="font-mono text-[10px] uppercase tracking-wider text-purple-300">
                              {effectiveClassId === "sobrevivente"
                                ? `ESTÁGIO ${ab.nex}`
                                : `NEX ${ab.nex}%`}{" "}
                              — {ab.name}:
                            </strong>{" "}
                            {ab.description}
                          </p>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">
                Você poderá escolher sua Trilha na ficha assim que atingir{" "}
                {effectiveClassId === "sobrevivente"
                  ? "o Estágio 2"
                  : "NEX 10%"}
                .
              </p>
            )}
          </div>
        </Card>
      )}

      {/* ================= STEP 5: PERÍCIAS, PODERES & RITUAIS ================= */}
      {step === 5 && (
        <div className="space-y-5">
          {/* Skills */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-zinc-100">
                  Perícias Treinadas
                </h2>
                <p className="text-xs text-zinc-400">
                  Origem + Obrigatórias da Classe já incluídas. Escolha mais{" "}
                  <strong className="text-purple-300">{freeSkillQuota}</strong> perícia(s).
                </p>
              </div>
              <Badge variant="purple" className="font-mono">
                {chosenSkills.length} / {freeSkillQuota} livres
              </Badge>
            </div>

            {effectiveClassId === "combatente" && (
              <div className="grid gap-3 sm:grid-cols-2 rounded-xl border border-[#242432] bg-[#0D0D14] p-3 text-xs">
                <div>
                  <span className="text-[11px] text-zinc-400 block mb-1">
                    Obrigatória de Combate:
                  </span>
                  <div className="flex gap-2">
                    {(["luta", "pontaria"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          setCombatentAtkSkill(k);
                          setChosenSkills((prev) => prev.filter((s) => s !== k));
                        }}
                        className={cn(
                          "flex-1 rounded-lg border py-1.5 font-medium",
                          combatentAtkSkill === k
                            ? "border-purple-500 bg-purple-500/20 text-purple-100"
                            : "border-[#242432] bg-[#12121A] text-zinc-400"
                        )}
                      >
                        {SKILLS_BY_KEY[k].name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block mb-1">
                    Obrigatória de Defesa:
                  </span>
                  <div className="flex gap-2">
                    {(["fortitude", "reflexos"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          setCombatentDefSkill(k);
                          setChosenSkills((prev) => prev.filter((s) => s !== k));
                        }}
                        className={cn(
                          "flex-1 rounded-lg border py-1.5 font-medium",
                          combatentDefSkill === k
                            ? "border-purple-500 bg-purple-500/20 text-purple-100"
                            : "border-[#242432] bg-[#12121A] text-zinc-400"
                        )}
                      >
                        {SKILLS_BY_KEY[k].name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {effectiveClassId === "predador" && (
              <div className="grid gap-3 sm:grid-cols-2 rounded-sm border border-[#22222A] bg-[#0D0D11] p-3 text-xs">
                {(
                  [
                    {
                      label: "Obrigatória (Combate):",
                      opts: ["luta", "pontaria"] as const,
                      value: combatentAtkSkill,
                      set: (k: "luta" | "pontaria") => setCombatentAtkSkill(k),
                    },
                    {
                      label: "Obrigatória (Instinto):",
                      opts: ["percepcao", "sobrevivencia"] as const,
                      value: predadorSecondSkill,
                      set: (k: "percepcao" | "sobrevivencia") =>
                        setPredadorSecondSkill(k),
                    },
                  ] as const
                ).map((grp) => (
                  <div key={grp.label}>
                    <span className="text-[11px] text-zinc-400 block mb-1">
                      {grp.label}
                    </span>
                    <div className="flex gap-2">
                      {grp.opts.map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => {
                            (grp.set as (v: typeof k) => void)(k);
                            setChosenSkills((prev) => prev.filter((s) => s !== k));
                          }}
                          className={cn(
                            "flex-1 rounded-sm border py-1.5 font-medium",
                            grp.value === k
                              ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                              : "border-[#22222A] bg-[#101014] text-zinc-400"
                          )}
                        >
                          {SKILLS_BY_KEY[k].name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SKILLS_LIST.map((sk) => {
                const isLocked = lockedSkills.has(sk.key);
                const isPicked = chosenSkills.includes(sk.key);
                return (
                  <button
                    key={sk.key}
                    type="button"
                    disabled={isLocked}
                    onClick={() => toggleFreeSkill(sk.key)}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition-all",
                      isLocked
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 cursor-default"
                        : isPicked
                        ? "border-purple-500 bg-purple-600/20 text-purple-100"
                        : "border-[#242432] bg-[#0D0D14] text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    <span className="truncate">{sk.name}</span>
                    <span className="font-mono text-[10px] opacity-75">
                      {isLocked ? "AUTO" : sk.defaultAttribute}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Powers unlocked by NEX */}
          {milestones.classPowersCount > 0 && (
            <Card className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#22222A] pb-3">
                <div>
                  <h2 className="font-display text-base font-bold text-zinc-100">
                    Poderes por NEX ({nex}%)
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Escolha até {milestones.classPowersCount} poder(es) de Classe, Gerais ou Paranormais.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6E6E7E]" />
                    <Input
                      value={powerSearch}
                      onChange={(e) => setPowerSearch(e.target.value)}
                      placeholder="Filtrar poderes..."
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                  <Badge variant="purple" className="font-mono shrink-0">
                    {selectedPowerIds.length} / {milestones.classPowersCount}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                {availablePowers
                  .filter((pw) => {
                    const q = powerSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      pw.name.toLowerCase().includes(q) ||
                      pw.description.toLowerCase().includes(q) ||
                      pw.category.toLowerCase().includes(q) ||
                      (pw.prerequisites?.toLowerCase().includes(q) ?? false)
                    );
                  })
                  .map((pw) => {
                    const picked = selectedPowerIds.includes(pw.id);
                    return (
                      <button
                        key={pw.id}
                        type="button"
                        onClick={() => togglePower(pw.id)}
                        className={cn(
                          "w-full rounded-md border border-l-[3px] px-4 py-3 text-left transition-colors space-y-1.5",
                          picked
                            ? "border-[#F4F4F5] border-l-[#F4F4F5] bg-[#16161C]"
                            : "border-[#22222A] border-l-[#32323E] bg-[#0D0D11] hover:border-[#32323E] hover:bg-[#111117]"
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border font-mono text-[10px]",
                                picked
                                  ? "border-[#F4F4F5] bg-[#F4F4F5] text-[#09090B]"
                                  : "border-[#32323E] bg-[#09090B] text-transparent"
                              )}
                            >
                              <Check className="h-3 w-3" />
                            </span>
                            <span className="font-display text-sm font-bold text-[#F4F4F5]">
                              {pw.name}
                            </span>
                            <SourceBadge source={pw.source} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            {pw.prerequisites && (
                              <span className="font-mono text-[10px] text-amber-300">
                                Req: {pw.prerequisites}
                              </span>
                            )}
                            <Badge variant="outline" className="text-[9px] uppercase font-mono">
                              {pw.category}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-[12.5px] text-[#D4D4D8] leading-relaxed">
                          {pw.description}
                        </p>
                      </button>
                    );
                  })}
              </div>
            </Card>
          )}

          {/* Initial Rituals for Ocultista / Devoto */}
          {(effectiveClassId === "ocultista" || effectiveClassId === "devoto") && (
            <Card className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#22222A] pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-purple-400" />
                  <div>
                    <h2 className="font-display text-base font-bold text-zinc-100">
                      Rituais Iniciais de{" "}
                      {effectiveClassId === "devoto"
                        ? "Devoto (Disruptura)"
                        : "Ocultista"}
                    </h2>
                    <p className="text-xs text-zinc-400">
                      {effectiveClassId === "devoto"
                        ? "2 de 1º círculo em NEX 5% + 1 a cada novo círculo desbloqueado"
                        : "3 de 1º círculo em NEX 5% + 1 por aumento de NEX"}{" "}
                      (até {milestones.maxRitualCircle}º círculo).
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6E6E7E]" />
                    <Input
                      value={ritualSearch}
                      onChange={(e) => setRitualSearch(e.target.value)}
                      placeholder="Filtrar rituais..."
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                  <Badge variant="purple" className="font-mono shrink-0">
                    {selectedRitualIds.length} / {initialRitualQuota}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
                {availableRituals
                  .filter((rit) => {
                    const q = ritualSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      rit.name.toLowerCase().includes(q) ||
                      rit.description.toLowerCase().includes(q) ||
                      rit.element.toLowerCase().includes(q)
                    );
                  })
                  .map((rit) => {
                    const picked = selectedRitualIds.includes(rit.id);
                    const st = ELEMENT_STYLES[rit.element];
                    return (
                      <button
                        key={rit.id}
                        type="button"
                        onClick={() => toggleRitual(rit.id)}
                        className={cn(
                          "w-full rounded-md border border-l-[3px] px-4 py-3 text-left transition-colors space-y-1.5",
                          st.borderLeft,
                          picked
                            ? "border-[#F4F4F5] bg-[#16161C]"
                            : "border-[#22222A] bg-[#0D0D11] hover:border-[#32323E] hover:bg-[#111117]"
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border font-mono text-[10px]",
                                picked
                                  ? "border-[#F4F4F5] bg-[#F4F4F5] text-[#09090B]"
                                  : "border-[#32323E] bg-[#09090B] text-transparent"
                              )}
                            >
                              <Check className="h-3 w-3" />
                            </span>
                            <span className="font-display text-sm font-bold text-[#F4F4F5]">
                              {rit.name}
                            </span>
                            <SourceBadge source={rit.source} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "rounded border px-1.5 py-0.5 font-mono text-[10px]",
                                st.badge
                              )}
                            >
                              {rit.element}
                            </span>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {rit.circle}º Círculo
                            </Badge>
                          </div>
                        </div>
                        <p className="text-[12.5px] text-[#D4D4D8] leading-relaxed">
                          {rit.description}
                        </p>
                      </button>
                    );
                  })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          disabled={step === 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
        >
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>

        {step < 5 ? (
          <Button
            variant="primary"
            disabled={!canAdvance}
            onClick={() => setStep((s) => Math.min(5, s + 1))}
          >
            Próximo <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="primary" onClick={handleFinish}>
            <Sparkles className="h-4 w-4" /> Criar Ficha do Agente
          </Button>
        )}
      </div>
    </div>
  );
}
