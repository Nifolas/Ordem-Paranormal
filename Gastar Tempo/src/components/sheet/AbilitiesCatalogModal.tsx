"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import type {
  AbilitySource,
  Agent,
  AgentAbility,
  ContentSource,
  ParanormalElement,
  PowerDefinition,
} from "@/types/ordem";
import { BASE_CLASS_POWERS } from "@/data/classPowers";
import { BASE_GENERAL_POWERS } from "@/data/generalPowers";
import { BASE_PARANORMAL_POWERS } from "@/data/paranormalPowers";
import { COMMUNITY_POWERS } from "@/data/supplements";
import { filterByEnabledSources } from "@/data/sources";
import { SourceBadge } from "@/components/SourceToggles";
import { checkPowerPrerequisites } from "@/lib/ordem-rules";
import { cn, ELEMENT_STYLES, generateId } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import {
  Badge,
  Button,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui/primitives";

type CatalogTab =
  | "classe"
  | "gerais"
  | "paranormais"
  | "versatilidade"
  | "homebrew"
  | "custom";

const SOURCE_LABELS: Record<ContentSource, string> = {
  livro_basico: "Livro Básico",
  sobrevivendo_ao_horror: "SaH",
  arquivos_secretos: "Arq. Secretos",
  homebrew: "Homebrew",
};

const PARANORMAL_ELEMENTS: ParanormalElement[] = [
  "Sangue",
  "Morte",
  "Conhecimento",
  "Energia",
  "Variável",
];

export function AbilitiesCatalogModal({
  open,
  onClose,
  agent,
  onAddAbility,
}: {
  open: boolean;
  onClose: () => void;
  agent: Agent;
  onAddAbility: (ability: AgentAbility, isTranscender: boolean) => void;
}) {
  const { homebrew } = useAppStore();

  const [tab, setTab] = useState<CatalogTab>("classe");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"todos" | ContentSource>("todos");
  const [elementFilter, setElementFilter] = useState<"todos" | ParanormalElement>("todos");
  const [selectedPowerId, setSelectedPowerId] = useState<string | null>(null);

  // Custom ability form state
  const [cName, setCName] = useState("");
  const [cSource, setCSource] = useState<AbilitySource>("Classe");
  const [cElement, setCElement] = useState<"" | ParanormalElement>("");
  const [cPe, setCPe] = useState(0);
  const [cDesc, setCDesc] = useState("");
  const [cAffinity, setCAffinity] = useState("");
  const [cTranscender, setCTranscender] = useState(false);

  const catalogList: PowerDefinition[] = useMemo(() => {
    const hbPowers = homebrew.powers ?? [];
    const community = filterByEnabledSources(
      COMMUNITY_POWERS,
      agent.enabledSources
    );
    if (tab === "classe") {
      return [
        ...BASE_CLASS_POWERS.filter((p) => p.classId === agent.classId),
        ...community.filter(
          (p) => p.category === "classe" && p.classId === agent.classId
        ),
        ...hbPowers.filter(
          (p) => p.category === "classe" && p.classId === agent.classId
        ),
      ];
    }
    if (tab === "gerais") {
      return [
        ...BASE_GENERAL_POWERS,
        ...community.filter((p) => p.category === "geral"),
        ...hbPowers.filter((p) => p.category === "geral"),
      ];
    }
    if (tab === "paranormais") {
      return [
        ...BASE_PARANORMAL_POWERS,
        ...community.filter((p) => p.category === "paranormal"),
        ...hbPowers.filter((p) => p.category === "paranormal"),
      ];
    }
    if (tab === "versatilidade") {
      return [
        ...BASE_CLASS_POWERS.filter((p) => p.classId !== agent.classId),
        ...community.filter(
          (p) => p.category === "classe" && p.classId !== agent.classId
        ),
      ];
    }
    if (tab === "homebrew") {
      const legacyAsPowers: PowerDefinition[] = (homebrew.abilities ?? []).map(
        (ab) => ({
          id: ab.id,
          name: ab.name,
          category: ab.element ? "paranormal" : "geral",
          element: ab.element,
          peCost: ab.peCost,
          description: ab.description,
          affinityDescription: ab.affinityDescription,
          source: "homebrew",
        })
      );
      return [...hbPowers, ...legacyAsPowers];
    }
    return [];
  }, [tab, agent.classId, agent.enabledSources, homebrew.powers, homebrew.abilities]);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalogList.filter((p) => {
      if (sourceFilter !== "todos" && p.source !== sourceFilter) return false;
      if (
        tab === "paranormais" &&
        elementFilter !== "todos" &&
        p.element !== elementFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.prerequisites?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [catalogList, search, sourceFilter, elementFilter, tab]);

  const selectedPower = useMemo(() => {
    if (filteredList.length === 0) return null;
    return (
      filteredList.find((p) => p.id === selectedPowerId) ?? filteredList[0]
    );
  }, [filteredList, selectedPowerId]);

  const alreadyHasSelected = useMemo(() => {
    if (!selectedPower) return false;
    return agent.abilities.some(
      (a) => a.name.toLowerCase() === selectedPower.name.toLowerCase()
    );
  }, [agent.abilities, selectedPower]);

  const prereqCheck = useMemo(() => {
    if (!selectedPower) return { met: true, missing: [] };
    return checkPowerPrerequisites(agent, selectedPower.prerequisites);
  }, [agent, selectedPower]);

  const handleConfirmAdd = (pw: PowerDefinition) => {
    const isTrans = pw.name.toLowerCase().startsWith("transcender");
    const ability: AgentAbility = {
      id: generateId("ab"),
      name: pw.name,
      source:
        pw.source === "homebrew"
          ? "Homebrew"
          : pw.category === "paranormal"
          ? "Paranormal"
          : pw.category === "geral"
          ? "Geral"
          : "Classe",
      peCost: pw.peCost,
      element: pw.element,
      description: pw.description,
      affinityDescription: pw.affinityDescription,
      hasAffinity: Boolean(
        pw.category === "paranormal" &&
          agent.affinityElement &&
          pw.element === agent.affinityElement
      ),
      isTranscender: isTrans,
      bookSource: pw.source,
    };
    onAddAbility(ability, isTrans);
    onClose();
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim()) return;
    const ability: AgentAbility = {
      id: generateId("ab"),
      name: cName.trim(),
      source: cSource,
      peCost: cPe,
      element: cElement || undefined,
      description: cDesc.trim(),
      affinityDescription: cAffinity.trim() || undefined,
      hasAffinity: false,
      isTranscender: cTranscender,
      bookSource: "homebrew",
    };
    onAddAbility(ability, cTranscender);
    setCName("");
    setCDesc("");
    setCAffinity("");
    setCPe(0);
    onClose();
  };

  const tabs: { id: CatalogTab; label: string }[] = [
    { id: "classe", label: "Poderes de Classe" },
    { id: "gerais", label: "Poderes Gerais" },
    { id: "paranormais", label: "Paranormais" },
    { id: "versatilidade", label: "Versatilidade / Outras" },
    { id: "homebrew", label: "Homebrew" },
    { id: "custom", label: "+ Criar Custom" },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Catálogo de Habilidades & Poderes"
      description="Selecione uma categoria, inspecione pré-requisitos e efeitos completos no painel à direita e adicione à ficha."
      maxWidth="max-w-4xl"
      heightClass="h-[82vh]"
      noPadding
    >
      <div className="flex flex-col h-full">
        {/* Category Tab Strip */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-[#22222A] bg-[#0C0C10] px-4 py-2 shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setSelectedPowerId(null);
              }}
              className={cn(
                "whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-medium transition-colors border",
                tab === t.id
                  ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                  : "border-transparent text-[#8E8E9E] hover:text-[#D4D4D8] hover:bg-[#16161C]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "custom" ? (
          <form
            onSubmit={handleCreateCustom}
            className="flex-1 overflow-y-auto p-6 max-w-2xl space-y-4"
          >
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Nome da Habilidade *
              </label>
              <Input
                required
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                placeholder="Ex: Golpe Especial, Poder Customizado..."
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Categoria
                </label>
                <Select
                  value={cSource}
                  onChange={(e) => setCSource(e.target.value as AbilitySource)}
                >
                  <option value="Classe">Classe</option>
                  <option value="Geral">Geral</option>
                  <option value="Paranormal">Paranormal</option>
                  <option value="Trilha">Trilha</option>
                  <option value="Origem">Origem</option>
                  <option value="Homebrew">Homebrew</option>
                </Select>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Elemento (Opcional)
                </label>
                <Select
                  value={cElement}
                  onChange={(e) =>
                    setCElement(e.target.value as "" | ParanormalElement)
                  }
                >
                  <option value="">Nenhum</option>
                  {PARANORMAL_ELEMENTS.map((el) => (
                    <option key={el} value={el}>
                      {el}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Custo PE
                </label>
                <Input
                  type="number"
                  min={0}
                  value={cPe}
                  onChange={(e) => setCPe(Number(e.target.value) || 0)}
                  className="font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Descrição / Efeito Base *
              </label>
              <Textarea
                required
                rows={4}
                value={cDesc}
                onChange={(e) => setCDesc(e.target.value)}
                placeholder="Descreva regras, execução e bônus..."
              />
            </div>

            {cSource === "Paranormal" && (
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Efeito de Afinidade (NEX 50%+, opcional)
                </label>
                <Textarea
                  rows={2}
                  value={cAffinity}
                  onChange={(e) => setCAffinity(e.target.value)}
                  placeholder="Efeito adicional com Afinidade..."
                />
              </div>
            )}

            <label className="inline-flex items-center gap-2 text-xs text-[#D4D4D8] cursor-pointer">
              <input
                type="checkbox"
                checked={cTranscender}
                onChange={(e) => setCTranscender(e.target.checked)}
              />
              Conta como Transcender (reduz ganho de SAN máxima do nível)
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#22222A]">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                <Plus className="h-4 w-4" /> Adicionar à Ficha
              </Button>
            </div>
          </form>
        ) : (
          /* 2-Column Master-Detail Browser */
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[44%_56%]">
            {/* Left: Filterable Navigable List */}
            <div className="flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-[#22222A] bg-[#101014]">
              <div className="p-3.5 border-b border-[#22222A] space-y-2.5 shrink-0">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6E6E7E]" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar poder ou pré-requisito..."
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                {/* Source Filter Pills */}
                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      "todos",
                      "livro_basico",
                      "sobrevivendo_ao_horror",
                      "arquivos_secretos",
                      "homebrew",
                    ] as const
                  ).map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setSourceFilter(src)}
                      className={cn(
                        "rounded-sm border px-2 py-0.5 font-mono text-[10px] transition-colors",
                        sourceFilter === src
                          ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                          : "border-[#22222A] bg-[#09090B] text-[#8E8E9E] hover:text-[#D4D4D8]"
                      )}
                    >
                      {src === "todos" ? "Todos Livros" : SOURCE_LABELS[src]}
                    </button>
                  ))}
                </div>

                {/* Element Filter Pills (when on Paranormais) */}
                {tab === "paranormais" && (
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setElementFilter("todos")}
                      className={cn(
                        "rounded-sm border px-2 py-0.5 font-mono text-[10px]",
                        elementFilter === "todos"
                          ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                          : "border-[#22222A] bg-[#09090B] text-[#8E8E9E]"
                      )}
                    >
                      Todos
                    </button>
                    {PARANORMAL_ELEMENTS.map((el) => {
                      const st = ELEMENT_STYLES[el];
                      return (
                        <button
                          key={el}
                          type="button"
                          onClick={() => setElementFilter(el)}
                          className={cn(
                            "rounded-sm border px-2 py-0.5 font-mono text-[10px] transition-colors",
                            elementFilter === el
                              ? st.badge
                              : "border-[#22222A] bg-[#09090B] text-[#8E8E9E] hover:text-[#D4D4D8]"
                          )}
                        >
                          {el}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Power List */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#1A1A22]">
                {filteredList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#6E6E7E]">
                    Nenhum poder encontrado para os filtros aplicados.
                  </div>
                ) : (
                  filteredList.map((pw) => {
                    const active = selectedPower?.id === pw.id;
                    const req = checkPowerPrerequisites(agent, pw.prerequisites);
                    const hasIt = agent.abilities.some(
                      (a) => a.name.toLowerCase() === pw.name.toLowerCase()
                    );
                    const elStyle = pw.element ? ELEMENT_STYLES[pw.element] : null;

                    return (
                      <button
                        key={pw.id}
                        type="button"
                        onClick={() => setSelectedPowerId(pw.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 transition-colors border-l-[3px] flex items-center justify-between gap-2",
                          elStyle ? elStyle.borderLeft : "border-l-transparent",
                          active
                            ? "bg-[#16161C]"
                            : "bg-transparent hover:bg-[#14141A]"
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "text-sm font-medium truncate",
                                active ? "text-[#F4F4F5]" : "text-[#D4D4D8]"
                              )}
                            >
                              {pw.name}
                            </span>
                            <SourceBadge source={pw.source} />
                            {hasIt && (
                              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-[#8E8E9E]">
                            <span>{SOURCE_LABELS[pw.source]}</span>
                            {pw.classId && tab === "versatilidade" && (
                              <span className="uppercase">{pw.classId}</span>
                            )}
                            {pw.prerequisites && (
                              <span
                                className={
                                  req.met ? "text-emerald-400" : "text-amber-400"
                                }
                              >
                                {req.met ? "✓ REQ" : "⚠ REQ"}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="font-mono text-[10px] text-[#8E8E9E] shrink-0">
                          {pw.peCost > 0 ? `${pw.peCost} PE` : "PASSIVA"}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right: Reading & Preview Panel */}
            <div className="flex flex-col min-h-0 bg-[#0C0C10]">
              {selectedPower ? (
                <>
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    <div className="space-y-2 border-b border-[#22222A] pb-4">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
                        <Badge variant="default">
                          {SOURCE_LABELS[selectedPower.source]}
                        </Badge>
                        {selectedPower.classId && (
                          <Badge variant="outline">
                            {selectedPower.classId}
                          </Badge>
                        )}
                        {selectedPower.element && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5",
                              ELEMENT_STYLES[selectedPower.element].badge
                            )}
                          >
                            {selectedPower.element}
                          </span>
                        )}
                        <Badge variant="outline">
                          {selectedPower.peCost > 0
                            ? `${selectedPower.peCost} PE`
                            : "PASSIVA"}
                        </Badge>
                      </div>

                      <h3 className="font-display text-xl font-bold text-[#F4F4F5] tracking-tight">
                        {selectedPower.name}
                      </h3>
                    </div>

                    {/* Prerequisite Check Box */}
                    {selectedPower.prerequisites && (
                      <div
                        className={cn(
                          "rounded-sm border px-3.5 py-2.5 flex items-start gap-2.5 text-xs",
                          prereqCheck.met
                            ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-300"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                        )}
                      >
                        {prereqCheck.met ? (
                          <Check className="h-4 w-4 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-0.5">
                          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                            Pré-requisito: {selectedPower.prerequisites}
                          </p>
                          <p className="text-xs opacity-90">
                            {prereqCheck.met
                              ? "Este agente cumpre todos os pré-requisitos."
                              : `Faltando na ficha atual: ${prereqCheck.missing.join(", ")} (ainda é possível adicionar manualmente).`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Effect Description */}
                    <div className="space-y-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8E8E9E] block">
                        EFEITO BASE
                      </span>
                      <p className="text-[14px] leading-[1.7] text-[#D4D4D8]">
                        {selectedPower.description}
                      </p>
                    </div>

                    {/* Affinity Block */}
                    {selectedPower.affinityDescription && (
                      <div className="rounded-sm border border-[#22222A] border-l-[3px] border-l-amber-400 bg-[#101014] p-4 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-amber-300">
                          <Sparkles className="h-3 w-3" /> AFINIDADE (NEX 50%+)
                        </div>
                        <p className="text-[14px] leading-[1.65] text-[#D4D4D8]">
                          {selectedPower.affinityDescription}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sticky Add Footer */}
                  <div className="border-t border-[#22222A] bg-[#101014] px-6 py-4 flex items-center justify-between gap-3 shrink-0">
                    <span className="font-mono text-[11px] text-[#8E8E9E]">
                      {alreadyHasSelected
                        ? "Já presente na ficha (pode adicionar novamente se acumulável)"
                        : selectedPower.name.toLowerCase().startsWith("transcender")
                        ? "Reduz automaticamente o ganho de SAN deste NEX"
                        : "Pronto para integrar à ficha"}
                    </span>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleConfirmAdd(selectedPower)}
                    >
                      <Plus className="h-4 w-4" /> Adicionar à Ficha
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 text-xs text-[#6E6E7E]">
                  Selecione um poder na lista ao lado para inspecionar os detalhes.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
