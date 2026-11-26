"use client";

import React, { useRef, useState } from "react";
import {
  Backpack,
  BookOpen,
  Compass,
  Download,
  Flame,
  FlaskConical,
  Plus,
  Skull,
  Sparkles,
  Swords,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { SKILLS_LIST } from "@/data/skills";
import { cn, ELEMENT_STYLES, generateId } from "@/lib/utils";
import type {
  AgentClassId,
  ItemCategory,
  ItemCategoryType,
  ParanormalElement,
  PowerCategory,
  SkillKey,
} from "@/types/ordem";
import { ITEM_CATEGORY_META } from "@/data/equipment";
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  Textarea,
} from "@/components/ui/primitives";

type HomebrewTab =
  | "rituais"
  | "armas"
  | "itens"
  | "poderes"
  | "trilhas"
  | "origens"
  | "ameacas";

const ELEMENTS: ParanormalElement[] = [
  "Sangue",
  "Morte",
  "Conhecimento",
  "Energia",
  "Medo",
];

export default function HomebrewPage() {
  const {
    homebrew,
    threats,
    addHomebrewWeapon,
    deleteHomebrewWeapon,
    addHomebrewItem,
    deleteHomebrewItem,
    addHomebrewRitual,
    deleteHomebrewRitual,
    addHomebrewOrigin,
    deleteHomebrewOrigin,
    addHomebrewTrail,
    deleteHomebrewTrail,
    addHomebrewPower,
    deleteHomebrewPower,
    importHomebrewPackage,
    addThreat,
    deleteThreat,
  } = useAppStore();

  const importRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<HomebrewTab>("rituais");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const notify = (msg: string) => {
    setSavedMsg(msg);
    window.setTimeout(() => setSavedMsg(null), 3500);
  };

  // Trail state
  const [trName, setTrName] = useState("");
  const [trClass, setTrClass] = useState<AgentClassId>("combatente");
  const [trDesc, setTrDesc] = useState("");
  const [trAbName, setTrAbName] = useState("");
  const [trAbDesc, setTrAbDesc] = useState("");

  // Power state
  const [pName, setPName] = useState("");
  const [pCat, setPCat] = useState<PowerCategory>("paranormal");
  const [pClass, setPClass] = useState<"" | AgentClassId>("");
  const [pElement, setPElement] = useState<"" | ParanormalElement>("Sangue");
  const [pPe, setPPe] = useState(0);
  const [pDesc, setPDesc] = useState("");
  const [pAffinity, setPAffinity] = useState("");

  // Weapon state
  const [wName, setWName] = useState("");
  const [wDamage, setWDamage] = useState("2d8");
  const [wType, setWType] = useState("Corte");
  const [wCat, setWCat] = useState<ItemCategory>(1);
  const [wSpaces, setWSpaces] = useState(1);
  const [wDesc, setWDesc] = useState("");

  // Item state
  const [iName, setIName] = useState("");
  const [iType, setIType] = useState<ItemCategoryType>("operacional");
  const [iCat, setICat] = useState<ItemCategory>(1);
  const [iSpaces, setISpaces] = useState(1);
  const [iDef, setIDef] = useState(0);
  const [iCarry, setICarry] = useState(0);
  const [iDesc, setIDesc] = useState("");

  // Ritual state
  const [rName, setRName] = useState("");
  const [rElement, setRElement] = useState<ParanormalElement>("Energia");
  const [rCircle, setRCircle] = useState<1 | 2 | 3 | 4>(1);
  const [rPe, setRPe] = useState(1);
  const [rExec, setRExec] = useState("Padrão");
  const [rRange, setRRange] = useState("Curto");
  const [rTarget, setRTarget] = useState("1 ser");
  const [rDuration, setRDuration] = useState("Instantânea");
  const [rResist, setRResist] = useState("Fortitude parcial");
  const [rDesc, setRDesc] = useState("");
  const [rDiscente, setRDiscente] = useState("");
  const [rVerdadeira, setRVerdadeira] = useState("");

  // Origin state
  const [oName, setOName] = useState("");
  const [oSkill1, setOSkill1] = useState<SkillKey>("investigacao");
  const [oSkill2, setOSkill2] = useState<SkillKey>("ocultismo");
  const [oPowerName, setOPowerName] = useState("");
  const [oPowerDesc, setOPowerDesc] = useState("");
  const [oDesc, setODesc] = useState("");

  // Threat state
  const [tName, setTName] = useState("");
  const [tElement, setTElement] = useState<ParanormalElement>("Sangue");
  const [tVd, setTVd] = useState(40);
  const [tPv, setTPv] = useState(75);
  const [tDef, setTDef] = useState(19);
  const [tDesc, setTDesc] = useState("");

  const homebrewThreats = threats.filter((t) => t.isHomebrew);
  const homebrewTrails = homebrew.trails ?? [];
  const homebrewPowers = homebrew.powers ?? [];

  const handleExportHomebrew = () => {
    const payload = {
      ...homebrew,
      threats: homebrewThreats,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cris-homebrew-pack.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportHomebrew = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      importHomebrewPackage(parsed);
      notify("Pacote Homebrew importado e integrado com sucesso!");
    } catch {
      notify("Arquivo JSON inválido para pacote Homebrew.");
    } finally {
      e.target.value = "";
    }
  };

  const tabs: { id: HomebrewTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "rituais", label: "Rituais", icon: <Flame className="h-3.5 w-3.5" />, count: homebrew.rituals.length },
    { id: "poderes", label: "Poderes", icon: <Zap className="h-3.5 w-3.5" />, count: homebrewPowers.length },
    { id: "trilhas", label: "Trilhas", icon: <Compass className="h-3.5 w-3.5" />, count: homebrewTrails.length },
    { id: "origens", label: "Origens", icon: <BookOpen className="h-3.5 w-3.5" />, count: homebrew.origins.length },
    { id: "armas", label: "Armas", icon: <Swords className="h-3.5 w-3.5" />, count: homebrew.weapons.length },
    { id: "itens", label: "Itens", icon: <Backpack className="h-3.5 w-3.5" />, count: homebrew.items.length },
    { id: "ameacas", label: "Ameaças", icon: <Skull className="h-3.5 w-3.5" />, count: homebrewThreats.length },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#22222A] pb-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8E8E9E]">
            Oficina da Ordo Realitas
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F4F5] mt-1 flex items-center gap-2.5">
            <FlaskConical className="h-5 w-5 text-[#A1A1AA]" />
            Homebrew Customizado
          </h1>
          <p className="text-xs text-[#8E8E9E] mt-1">
            Crie, exporte e importe Origens, Trilhas, Poderes, Rituais, Equipamentos e Ameaças integrados à ficha.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={importRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportHomebrew}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => importRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" /> Importar JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportHomebrew}>
            <Download className="h-3.5 w-3.5" /> Exportar JSON
          </Button>
        </div>
      </div>

      {savedMsg && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
          {savedMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-[#22222A] pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors",
              tab === t.id
                ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                : "border-[#22222A] bg-[#101014] text-[#8E8E9E] hover:text-[#D4D4D8]"
            )}
          >
            {t.icon}
            {t.label}
            <span className="rounded-sm bg-[#1A1A22] px-1.5 font-mono text-[10px] text-[#A1A1AA] tabular-nums">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* RITUAIS HOMEBREW */}
      {tab === "rituais" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-zinc-100 mb-4">
              Criar Ritual Homebrew
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!rName.trim()) return;
                addHomebrewRitual({
                  id: generateId("hb-rit"),
                  name: rName.trim(),
                  element: rElement,
                  circle: rCircle,
                  peCost: rPe,
                  execution: rExec,
                  range: rRange,
                  target: rTarget,
                  duration: rDuration,
                  resistance: rResist,
                  description: rDesc.trim(),
                  discente: rDiscente.trim() || undefined,
                  discenteCost: rDiscente.trim() ? rPe + 2 : undefined,
                  verdadeira: rVerdadeira.trim() || undefined,
                  verdadeiraCost: rVerdadeira.trim() ? rPe + 5 : undefined,
                  source: "homebrew",
                });
                setRName("");
                setRDesc("");
                setRDiscente("");
                setRVerdadeira("");
                notify("Ritual Homebrew salvo e integrado à Ficha!");
              }}
              className="space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  required
                  placeholder="Nome do ritual *"
                  value={rName}
                  onChange={(e) => setRName(e.target.value)}
                />
                <Select
                  value={rElement}
                  onChange={(e) =>
                    setRElement(e.target.value as ParanormalElement)
                  }
                >
                  {ELEMENTS.map((el) => (
                    <option key={el} value={el}>
                      {el}
                    </option>
                  ))}
                </Select>
                <Select
                  value={rCircle}
                  onChange={(e) =>
                    setRCircle(Number(e.target.value) as 1 | 2 | 3 | 4)
                  }
                >
                  {[1, 2, 3, 4].map((c) => (
                    <option key={c} value={c}>
                      {c}º Círculo
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  min={1}
                  placeholder="Custo PE"
                  value={rPe}
                  onChange={(e) => setRPe(Number(e.target.value) || 1)}
                  className="font-mono"
                />
                <Input
                  placeholder="Execução"
                  value={rExec}
                  onChange={(e) => setRExec(e.target.value)}
                />
                <Input
                  placeholder="Alcance"
                  value={rRange}
                  onChange={(e) => setRRange(e.target.value)}
                />
                <Input
                  placeholder="Alvo"
                  value={rTarget}
                  onChange={(e) => setRTarget(e.target.value)}
                />
                <Input
                  placeholder="Duração"
                  value={rDuration}
                  onChange={(e) => setRDuration(e.target.value)}
                />
              </div>
              <Input
                placeholder="Resistência"
                value={rResist}
                onChange={(e) => setRResist(e.target.value)}
              />
              <Textarea
                rows={3}
                placeholder="Efeito Normal *"
                value={rDesc}
                onChange={(e) => setRDesc(e.target.value)}
              />
              <Textarea
                rows={2}
                placeholder="Versão Discente (opcional)"
                value={rDiscente}
                onChange={(e) => setRDiscente(e.target.value)}
              />
              <Textarea
                rows={2}
                placeholder="Versão Verdadeira (opcional)"
                value={rVerdadeira}
                onChange={(e) => setRVerdadeira(e.target.value)}
              />
              <Button type="submit" variant="primary" className="w-full">
                <Plus className="h-4 w-4" /> Salvar Ritual Homebrew
              </Button>
            </form>
          </Card>

          <div className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Rituais Salvos ({homebrew.rituals.length})
            </h2>
            {homebrew.rituals.length === 0 ? (
              <Card className="p-8 text-center border-dashed text-xs text-zinc-500">
                Nenhum ritual homebrew criado ainda.
              </Card>
            ) : (
              homebrew.rituals.map((r) => {
                const st = ELEMENT_STYLES[r.element];
                return (
                  <Card key={r.id} className={cn("p-4 space-y-1.5", st.border)}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-100">
                          {r.name}
                        </span>
                        <span className={cn("rounded border px-1.5 py-0.5 text-[10px]", st.badge)}>
                          {r.element}
                        </span>
                        <Badge className="font-mono text-[10px]">
                          {r.circle}ºC • {r.peCost} PE
                        </Badge>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteHomebrewRitual(r.id)}
                        className="text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-400">{r.description}</p>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ARMAS HOMEBREW */}
      {tab === "armas" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-zinc-100 mb-4">
              Criar Arma Homebrew
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!wName.trim()) return;
                addHomebrewWeapon({
                  id: generateId("hb-wpn"),
                  name: wName.trim(),
                  type: "arma",
                  category: wCat,
                  spaces: wSpaces,
                  quantity: 1,
                  equipped: false,
                  damageFormula: wDamage,
                  damageType: wType,
                  description: wDesc.trim() || `Dano ${wDamage} (${wType})`,
                  source: "homebrew",
                });
                setWName("");
                setWDesc("");
                notify("Arma Homebrew adicionada ao catálogo de Inventário!");
              }}
              className="space-y-3"
            >
              <Input
                required
                placeholder="Nome da arma *"
                value={wName}
                onChange={(e) => setWName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Dano (ex: 2d8)"
                  value={wDamage}
                  onChange={(e) => setWDamage(e.target.value)}
                  className="font-mono"
                />
                <Input
                  placeholder="Tipo de dano"
                  value={wType}
                  onChange={(e) => setWType(e.target.value)}
                />
                <Select
                  value={wCat}
                  onChange={(e) =>
                    setWCat(Number(e.target.value) as ItemCategory)
                  }
                >
                  {[0, 1, 2, 3, 4].map((c) => (
                    <option key={c} value={c}>
                      Categoria {c}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  placeholder="Espaços"
                  value={wSpaces}
                  onChange={(e) => setWSpaces(Number(e.target.value) || 0)}
                  className="font-mono"
                />
              </div>
              <Textarea
                rows={3}
                placeholder="Descrição, maldições e propriedades..."
                value={wDesc}
                onChange={(e) => setWDesc(e.target.value)}
              />
              <Button type="submit" variant="primary" className="w-full">
                <Plus className="h-4 w-4" /> Salvar Arma Homebrew
              </Button>
            </form>
          </Card>

          <div className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Armas Salvas ({homebrew.weapons.length})
            </h2>
            {homebrew.weapons.length === 0 ? (
              <Card className="p-8 text-center border-dashed text-xs text-zinc-500">
                Nenhuma arma homebrew criada ainda.
              </Card>
            ) : (
              homebrew.weapons.map((w) => (
                <Card key={w.id} className="p-4 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{w.name}</p>
                    <p className="font-mono text-xs text-purple-300 mt-0.5">
                      {w.damageFormula} ({w.damageType}) • Cat {w.category} • {w.spaces} esp.
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">{w.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteHomebrewWeapon(w.id)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ITENS HOMEBREW */}
      {tab === "itens" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-zinc-100 mb-4">
              Criar Item / Equipamento Homebrew
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!iName.trim()) return;
                addHomebrewItem({
                  id: generateId("hb-item"),
                  name: iName.trim(),
                  type: iType,
                  category: iCat,
                  spaces: iSpaces,
                  quantity: 1,
                  equipped: false,
                  defenseBonus: iDef || undefined,
                  carryBonus: iCarry || undefined,
                  description: iDesc.trim(),
                  source: "homebrew",
                });
                setIName("");
                setIDesc("");
                notify("Item Homebrew salvo!");
              }}
              className="space-y-3"
            >
              <Input
                required
                placeholder="Nome do item *"
                value={iName}
                onChange={(e) => setIName(e.target.value)}
              />
              <Select
                value={iType}
                onChange={(e) => setIType(e.target.value as ItemCategoryType)}
              >
                {ITEM_CATEGORY_META.filter((c) => c.key !== "arma").map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    Tipo: {cat.label}
                  </option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={iCat}
                  onChange={(e) =>
                    setICat(Number(e.target.value) as ItemCategory)
                  }
                >
                  {[0, 1, 2, 3, 4].map((c) => (
                    <option key={c} value={c}>
                      Categoria {c}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  placeholder="Espaços"
                  value={iSpaces}
                  onChange={(e) => setISpaces(Number(e.target.value) || 0)}
                  className="font-mono"
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Bônus Defesa"
                  value={iDef}
                  onChange={(e) => setIDef(Number(e.target.value) || 0)}
                  className="font-mono"
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Bônus Carga"
                  value={iCarry}
                  onChange={(e) => setICarry(Number(e.target.value) || 0)}
                  className="font-mono"
                />
              </div>
              <Textarea
                rows={3}
                placeholder="Descrição e efeito do item..."
                value={iDesc}
                onChange={(e) => setIDesc(e.target.value)}
              />
              <Button type="submit" variant="primary" className="w-full">
                <Plus className="h-4 w-4" /> Salvar Item Homebrew
              </Button>
            </form>
          </Card>

          <div className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Itens Salvos ({homebrew.items.length})
            </h2>
            {homebrew.items.length === 0 ? (
              <Card className="p-8 text-center border-dashed text-xs text-zinc-500">
                Nenhum item homebrew criado ainda.
              </Card>
            ) : (
              homebrew.items.map((item) => (
                <Card key={item.id} className="p-4 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{item.name}</p>
                    <p className="font-mono text-xs text-zinc-400">
                      Cat {item.category} • {item.spaces} esp.
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteHomebrewItem(item.id)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* PODERES HOMEBREW */}
      {tab === "poderes" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-zinc-100 mb-4">
              Criar Poder Homebrew (Classe / Geral / Paranormal)
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!pName.trim()) return;
                addHomebrewPower({
                  id: generateId("hb-pow"),
                  name: pName.trim(),
                  category: pCat,
                  classId: pCat === "classe" ? (pClass || "combatente") : undefined,
                  element: pCat === "paranormal" ? (pElement || "Sangue") : undefined,
                  peCost: pPe,
                  description: pDesc.trim(),
                  affinityDescription: pAffinity.trim() || undefined,
                  source: "homebrew",
                });
                setPName("");
                setPDesc("");
                setPAffinity("");
                notify("Poder Homebrew salvo e integrado à Ficha e ao Wizard!");
              }}
              className="space-y-3"
            >
              <Input
                required
                placeholder="Nome do poder *"
                value={pName}
                onChange={(e) => setPName(e.target.value)}
              />
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={pCat}
                  onChange={(e) => setPCat(e.target.value as PowerCategory)}
                >
                  <option value="paranormal">Paranormal</option>
                  <option value="classe">Classe</option>
                  <option value="geral">Geral</option>
                </Select>
                {pCat === "paranormal" ? (
                  <Select
                    value={pElement}
                    onChange={(e) =>
                      setPElement(e.target.value as "" | ParanormalElement)
                    }
                  >
                    {ELEMENTS.map((el) => (
                      <option key={el} value={el}>
                        {el}
                      </option>
                    ))}
                  </Select>
                ) : pCat === "classe" ? (
                  <Select
                    value={pClass}
                    onChange={(e) =>
                      setPClass(e.target.value as "" | AgentClassId)
                    }
                  >
                    <option value="combatente">Combatente</option>
                    <option value="especialista">Especialista</option>
                    <option value="ocultista">Ocultista</option>
                    <option value="sobrevivente">Sobrevivente</option>
                  </Select>
                ) : (
                  <div className="flex items-center justify-center rounded-lg border border-[#242432] bg-[#0D0D14] text-[11px] text-zinc-500">
                    Qualquer Classe
                  </div>
                )}
                <Input
                  type="number"
                  min={0}
                  placeholder="Custo PE"
                  value={pPe}
                  onChange={(e) => setPPe(Number(e.target.value) || 0)}
                  className="font-mono"
                />
              </div>
              <Textarea
                rows={3}
                placeholder="Descrição do efeito *"
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
              />
              {pCat === "paranormal" && (
                <Textarea
                  rows={2}
                  placeholder="Efeito de Afinidade (NEX 50%+, opcional)"
                  value={pAffinity}
                  onChange={(e) => setPAffinity(e.target.value)}
                />
              )}
              <Button type="submit" variant="primary" className="w-full">
                <Plus className="h-4 w-4" /> Salvar Poder Homebrew
              </Button>
            </form>
          </Card>

          <div className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Poderes Salvos ({homebrewPowers.length})
            </h2>
            {homebrewPowers.length === 0 ? (
              <Card className="p-8 text-center border-dashed text-xs text-zinc-500">
                Nenhum poder homebrew criado ainda.
              </Card>
            ) : (
              homebrewPowers.map((pw) => (
                <Card key={pw.id} className="p-4 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-zinc-100">{pw.name}</p>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {pw.category}
                      </Badge>
                      {pw.peCost > 0 && (
                        <span className="font-mono text-xs text-yellow-400">
                          ({pw.peCost} PE)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{pw.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteHomebrewPower(pw.id)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* TRILHAS HOMEBREW */}
      {tab === "trilhas" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-zinc-100 mb-4">
              Criar Trilha Homebrew
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!trName.trim()) return;
                addHomebrewTrail({
                  id: generateId("hb-trail"),
                  classId: trClass,
                  name: trName.trim(),
                  source: "homebrew",
                  description: trDesc.trim(),
                  abilitiesByNex: [
                    {
                      nex: trClass === "sobrevivente" ? 2 : 10,
                      name: trAbName.trim() || "Habilidade Inicial",
                      peCost: 0,
                      description: trAbDesc.trim() || trDesc.trim(),
                    },
                  ],
                });
                setTrName("");
                setTrDesc("");
                setTrAbName("");
                setTrAbDesc("");
                notify("Trilha Homebrew salva e disponível no Wizard e na Ficha!");
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <Input
                  required
                  placeholder="Nome da trilha *"
                  value={trName}
                  onChange={(e) => setTrName(e.target.value)}
                />
                <Select
                  value={trClass}
                  onChange={(e) => setTrClass(e.target.value as AgentClassId)}
                >
                  <option value="combatente">Combatente</option>
                  <option value="especialista">Especialista</option>
                  <option value="ocultista">Ocultista</option>
                  <option value="sobrevivente">Sobrevivente</option>
                </Select>
              </div>
              <Textarea
                rows={2}
                placeholder="Descrição da trilha..."
                value={trDesc}
                onChange={(e) => setTrDesc(e.target.value)}
              />
              <Input
                placeholder={`Habilidade inicial (${trClass === "sobrevivente" ? "Estágio 2" : "NEX 10%"})`}
                value={trAbName}
                onChange={(e) => setTrAbName(e.target.value)}
              />
              <Textarea
                rows={2}
                placeholder="Efeito da habilidade inicial..."
                value={trAbDesc}
                onChange={(e) => setTrAbDesc(e.target.value)}
              />
              <Button type="submit" variant="primary" className="w-full">
                <Plus className="h-4 w-4" /> Salvar Trilha Homebrew
              </Button>
            </form>
          </Card>

          <div className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Trilhas Salvas ({homebrewTrails.length})
            </h2>
            {homebrewTrails.length === 0 ? (
              <Card className="p-8 text-center border-dashed text-xs text-zinc-500">
                Nenhuma trilha homebrew criada ainda.
              </Card>
            ) : (
              homebrewTrails.map((tr) => (
                <Card key={tr.id} className="p-4 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-100">{tr.name}</p>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {tr.classId}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{tr.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteHomebrewTrail(tr.id)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ORIGENS HOMEBREW */}
      {tab === "origens" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-zinc-100 mb-4">
              Criar Origem Homebrew
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!oName.trim() || !oPowerName.trim()) return;
                addHomebrewOrigin({
                  id: generateId("hb-orig"),
                  name: oName.trim(),
                  source: "homebrew",
                  description: oDesc.trim(),
                  trainedSkills:
                    oSkill1 === oSkill2 ? [oSkill1] : [oSkill1, oSkill2],
                  powerName: oPowerName.trim(),
                  powerDescription: oPowerDesc.trim(),
                  isHomebrew: true,
                });
                setOName("");
                setODesc("");
                setOPowerName("");
                setOPowerDesc("");
                notify("Origem Homebrew salva e disponível no Wizard de Criação!");
              }}
              className="space-y-3"
            >
              <Input
                required
                placeholder="Nome da origem *"
                value={oName}
                onChange={(e) => setOName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={oSkill1}
                  onChange={(e) => setOSkill1(e.target.value as SkillKey)}
                >
                  {SKILLS_LIST.map((s) => (
                    <option key={s.key} value={s.key}>
                      Perícia 1: {s.name}
                    </option>
                  ))}
                </Select>
                <Select
                  value={oSkill2}
                  onChange={(e) => setOSkill2(e.target.value as SkillKey)}
                >
                  {SKILLS_LIST.map((s) => (
                    <option key={s.key} value={s.key}>
                      Perícia 2: {s.name}
                    </option>
                  ))}
                </Select>
              </div>
              <Input
                required
                placeholder="Nome do Poder de Origem *"
                value={oPowerName}
                onChange={(e) => setOPowerName(e.target.value)}
              />
              <Textarea
                rows={2}
                placeholder="Efeito do Poder de Origem..."
                value={oPowerDesc}
                onChange={(e) => setOPowerDesc(e.target.value)}
              />
              <Textarea
                rows={2}
                placeholder="Descrição da origem..."
                value={oDesc}
                onChange={(e) => setODesc(e.target.value)}
              />
              <Button type="submit" variant="primary" className="w-full">
                <Plus className="h-4 w-4" /> Salvar Origem Homebrew
              </Button>
            </form>
          </Card>

          <div className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Origens Salvas ({homebrew.origins.length})
            </h2>
            {homebrew.origins.length === 0 ? (
              <Card className="p-8 text-center border-dashed text-xs text-zinc-500">
                Nenhuma origem homebrew criada ainda.
              </Card>
            ) : (
              homebrew.origins.map((o) => (
                <Card key={o.id} className="p-4 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{o.name}</p>
                    <p className="text-xs text-purple-300 mt-0.5">
                      Poder: {o.powerName}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">{o.powerDescription}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteHomebrewOrigin(o.id)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* AMEAÇAS HOMEBREW */}
      {tab === "ameacas" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-zinc-100 mb-4">
              Criar Ameaça Homebrew Rápida
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!tName.trim()) return;
                addThreat({
                  id: generateId("hb-threat"),
                  name: tName.trim(),
                  vd: tVd,
                  element: tElement,
                  size: "Médio",
                  type: "Criatura",
                  pv: tPv,
                  defense: tDef,
                  displacement: "9m / 6q",
                  disturbingPresence: { dt: 16, damage: "2d6 mental" },
                  attributes: { AGI: 2, FOR: 3, INT: 1, PRE: 2, VIG: 3 },
                  saves: { fortitude: 5, reflexos: 5, vontade: 5 },
                  skills: [{ name: "Iniciativa", dice: 2, bonus: 5 }],
                  resistances: `${tElement} 10`,
                  attacks: [
                    {
                      id: generateId("tatk"),
                      name: "Ataque Paranormal",
                      diceCount: 3,
                      testBonus: 10,
                      damageFormula: "2d8+5",
                      damageType: tElement,
                      threatRange: 20,
                      critMultiplier: 2,
                    },
                  ],
                  abilities: [],
                  description: tDesc.trim(),
                  isHomebrew: true,
                });
                setTName("");
                setTDesc("");
                notify("Ameaça Homebrew adicionada ao Bestiário!");
              }}
              className="space-y-3"
            >
              <Input
                required
                placeholder="Nome da criatura *"
                value={tName}
                onChange={(e) => setTName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={tElement}
                  onChange={(e) =>
                    setTElement(e.target.value as ParanormalElement)
                  }
                >
                  {ELEMENTS.map((el) => (
                    <option key={el} value={el}>
                      {el}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  placeholder="VD"
                  value={tVd}
                  onChange={(e) => setTVd(Number(e.target.value) || 20)}
                  className="font-mono"
                />
                <Input
                  type="number"
                  placeholder="PV"
                  value={tPv}
                  onChange={(e) => setTPv(Number(e.target.value) || 40)}
                  className="font-mono"
                />
                <Input
                  type="number"
                  placeholder="Defesa"
                  value={tDef}
                  onChange={(e) => setTDef(Number(e.target.value) || 15)}
                  className="font-mono"
                />
              </div>
              <Textarea
                rows={3}
                placeholder="Descrição da criatura..."
                value={tDesc}
                onChange={(e) => setTDesc(e.target.value)}
              />
              <Button type="submit" variant="primary" className="w-full">
                <Plus className="h-4 w-4" /> Salvar Ameaça no Bestiário
              </Button>
            </form>
          </Card>

          <div className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Ameaças Homebrew ({homebrewThreats.length})
            </h2>
            {homebrewThreats.length === 0 ? (
              <Card className="p-8 text-center border-dashed text-xs text-zinc-500">
                Nenhuma ameaça homebrew criada ainda.
              </Card>
            ) : (
              homebrewThreats.map((t) => (
                <Card key={t.id} className="p-4 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">
                      {t.name}{" "}
                      <span className="font-mono text-xs text-zinc-400">
                        (VD {t.vd} • {t.element})
                      </span>
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">{t.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteThreat(t.id)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
