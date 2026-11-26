"use client";

import React, { useMemo, useState } from "react";
import {
  Dices,
  Edit3,
  Heart,
  Plus,
  Search,
  Send,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Trash2,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { rollDiceFormula, rollOrdemTest } from "@/lib/ordem-rules";
import { cn, ELEMENT_STYLES, generateId } from "@/lib/utils";
import type { ParanormalElement, Threat, ThreatAttack } from "@/types/ordem";
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui/primitives";

const ELEMENTS: ParanormalElement[] = [
  "Sangue",
  "Morte",
  "Conhecimento",
  "Energia",
  "Medo",
  "Realidade",
];

function createEmptyThreat(): Threat {
  return {
    id: generateId("threat"),
    name: "",
    vd: 20,
    element: "Sangue",
    size: "Médio",
    type: "Criatura",
    pv: 45,
    defense: 16,
    displacement: "9m / 6q",
    disturbingPresence: { dt: 15, damage: "2d6 mental", nexImmunity: 25 },
    attributes: { AGI: 2, FOR: 2, INT: 1, PRE: 1, VIG: 2 },
    saves: { fortitude: 5, reflexos: 5, vontade: 5 },
    skills: [{ name: "Iniciativa", dice: 2, bonus: 5 }],
    resistances: "Balístico, corte e perfuração 5",
    vulnerabilities: "",
    attacks: [
      {
        id: generateId("tatk"),
        name: "Golpe Paranormal",
        diceCount: 2,
        testBonus: 10,
        damageFormula: "2d6+4",
        damageType: "Sangue",
        threatRange: 20,
        critMultiplier: 2,
      },
    ],
    abilities: [
      {
        id: generateId("tab"),
        name: "Habilidade Especial",
        description: "Descreva a habilidade especial da ameaça.",
      },
    ],
    description: "",
    isHomebrew: true,
  };
}

export default function AmeacasPage() {
  const {
    threats,
    campaigns,
    addThreat,
    updateThreat,
    deleteThreat,
    toggleThreatEnigmaResolved,
    sendThreatToCampaignInitiative,
    pushRoll,
  } = useAppStore();

  const [search, setSearch] = useState("");
  const [elementFilter, setElementFilter] = useState<"Todos" | ParanormalElement>(
    "Todos"
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Threat>(createEmptyThreat());

  const [sendModalThreat, setSendModalThreat] = useState<Threat | null>(null);
  const [targetCampaignId, setTargetCampaignId] = useState(
    campaigns[0]?.id ?? ""
  );
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threats.filter((t) => {
      if (elementFilter !== "Todos" && t.element !== elementFilter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        String(t.vd).includes(q)
      );
    });
  }, [threats, search, elementFilter]);

  const handleRollThreatAttack = (threat: Threat, atk: ThreatAttack) => {
    const res = rollOrdemTest({
      attributeValue: atk.diceCount,
      bonus: atk.testBonus,
      threatRange: atk.threatRange,
    });
    pushRoll({
      actorName: threat.name,
      label: `Ataque: ${atk.name}`,
      kind: "threat",
      element: threat.element,
      formula: res.formula,
      diceRolled: res.diceRolled,
      chosenDie: res.chosenDie,
      mode: res.mode,
      bonus: res.bonus,
      total: res.total,
      isNat20: res.isNat20,
      isNat1: res.isNat1,
      isCriticalThreat: res.isCriticalThreat,
      details: atk.notes || `VD ${threat.vd} • ${threat.element}`,
    });
  };

  const handleRollThreatDamage = (
    threat: Threat,
    atk: ThreatAttack,
    isCrit: boolean
  ) => {
    try {
      const res = rollDiceFormula({
        formula: atk.damageFormula,
        isCritical: isCrit,
        critMultiplier: atk.critMultiplier,
      });
      pushRoll({
        actorName: threat.name,
        label: `${isCrit ? "Dano Crítico" : "Dano"}: ${atk.name} (${atk.damageType})`,
        kind: "damage",
        element: threat.element,
        formula: res.effectiveFormula,
        diceRolled: res.diceRolled,
        mode: "sum",
        bonus: res.bonus,
        total: res.total,
        isCriticalDamage: res.isCriticalDamage,
        details: res.breakdown,
      });
    } catch {
      // ignore invalid formula
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(createEmptyThreat());
    setEditorOpen(true);
  };

  const openEdit = (threat: Threat) => {
    setEditingId(threat.id);
    setForm(JSON.parse(JSON.stringify(threat)));
    setEditorOpen(true);
  };

  const handleSaveThreat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      updateThreat(editingId, () => form);
    } else {
      addThreat({ ...form, id: generateId("threat") });
    }
    setEditorOpen(false);
  };

  const handleSendToInitiative = () => {
    if (!sendModalThreat || !targetCampaignId) return;
    const initSkill = sendModalThreat.skills.find((s) =>
      s.name.toLowerCase().includes("iniciativa")
    );
    const roll = rollOrdemTest({
      attributeValue: initSkill?.dice ?? sendModalThreat.attributes.AGI,
      bonus: initSkill?.bonus ?? 0,
    });
    sendThreatToCampaignInitiative(targetCampaignId, sendModalThreat, roll.total);
    pushRoll({
      actorName: sendModalThreat.name,
      campaignId: targetCampaignId,
      label: "Iniciativa (Enviado à Campanha)",
      kind: "threat",
      element: sendModalThreat.element,
      formula: roll.formula,
      diceRolled: roll.diceRolled,
      chosenDie: roll.chosenDie,
      mode: roll.mode,
      bonus: roll.bonus,
      total: roll.total,
    });
    const campName =
      campaigns.find((c) => c.id === targetCampaignId)?.name ?? "Campanha";
    setSentNotice(
      `"${sendModalThreat.name}" enviado para "${campName}" com iniciativa ${roll.total}!`
    );
    window.setTimeout(() => setSentNotice(null), 4500);
    setSendModalThreat(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#22222A] pb-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8E8E9E]">
            Arquivo Paranormal · Bestiário
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F4F5] mt-1">
            Ameaças
          </h1>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nova Ameaça
        </Button>
      </div>

      {sentNotice && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
          {sentNotice}
        </div>
      )}

      {/* Search & Element Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ameaça por nome ou VD..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setElementFilter("Todos")}
            className={cn(
              "rounded-sm border px-2.5 py-1 text-xs transition-colors",
              elementFilter === "Todos"
                ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                : "border-[#22222A] bg-[#101014] text-[#8E8E9E] hover:text-[#D4D4D8]"
            )}
          >
            Todos ({threats.length})
          </button>
          {ELEMENTS.map((el) => {
            const st = ELEMENT_STYLES[el];
            return (
              <button
                key={el}
                type="button"
                onClick={() => setElementFilter(el)}
                className={cn(
                  "rounded-sm border px-2.5 py-1 text-xs transition-colors",
                  elementFilter === el
                    ? st.badge
                    : "border-[#22222A] bg-[#101014] text-[#8E8E9E] hover:text-[#D4D4D8]"
                )}
              >
                {el}
              </button>
            );
          })}
        </div>
      </div>

      {/* Threat Cards */}
      <div className="grid gap-5 lg:grid-cols-2">
        {filtered.map((threat) => {
          const st = ELEMENT_STYLES[threat.element];
          return (
            <Card
              key={threat.id}
              className={cn(
                "p-5 space-y-4 border-l-[3px] hover:border-[#32323E] transition-colors",
                st.borderLeft
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Skull className={cn("h-4 w-4", st.text)} />
                    <h2 className="text-lg font-bold text-zinc-50">
                      {threat.name}
                    </h2>
                    <span
                      className={cn(
                        "rounded border px-2 py-0.5 text-[11px] font-semibold uppercase",
                        st.badge
                      )}
                    >
                      {threat.element}
                    </span>
                    <Badge variant="default" className="font-mono">
                      VD {threat.vd}
                    </Badge>
                    {threat.isHomebrew && <Badge variant="purple">HB</Badge>}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {threat.type} • {threat.size} • Deslocamento {threat.displacement}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => {
                      setTargetCampaignId(campaigns[0]?.id ?? "");
                      setSendModalThreat(threat);
                    }}
                    title="Enviar para iniciativa de uma campanha"
                  >
                    <Send className="h-3 w-3 text-purple-400" /> Iniciativa
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEdit(threat)}
                    title="Editar ameaça"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:text-red-400"
                    onClick={() => {
                      if (window.confirm(`Excluir "${threat.name}"?`)) {
                        deleteThreat(threat.id);
                      }
                    }}
                    title="Excluir ameaça"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {threat.description && (
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {threat.description}
                </p>
              )}

              {/* Core Stats */}
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-2.5">
                  <span className="text-[10px] text-red-400 flex items-center gap-1">
                    <Heart className="h-3 w-3" /> PV
                  </span>
                  <span className="text-lg font-bold text-[#F4F4F5] tabular-nums">
                    {threat.pv}
                  </span>
                </div>
                <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-2.5">
                  <span className="text-[10px] text-[#A1A1AA] flex items-center gap-1">
                    <Shield className="h-3 w-3" /> DEFESA
                  </span>
                  <span className="text-lg font-bold text-[#F4F4F5] tabular-nums">
                    {threat.defense}
                  </span>
                </div>
                <div className="rounded-sm border border-[#22222A] bg-[#0D0D11] p-2.5">
                  <span className="text-[10px] text-amber-400 block">
                    PRES. PERTURB.
                  </span>
                  <span className="text-xs font-bold text-[#F4F4F5] block mt-0.5 tabular-nums">
                    DT {threat.disturbingPresence.dt} ({threat.disturbingPresence.damage})
                  </span>
                </div>
              </div>

              {/* Attributes */}
              <div className="grid grid-cols-5 gap-1.5 text-center font-mono">
                {(["AGI", "FOR", "INT", "PRE", "VIG"] as const).map((k) => (
                  <div
                    key={k}
                    className="rounded-sm border border-[#22222A] bg-[#0D0D11] py-1.5"
                  >
                    <span className="text-[10px] text-[#6E6E7E] block">{k}</span>
                    <span className="text-sm font-bold text-[#F4F4F5] tabular-nums">
                      {threat.attributes[k]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Resistances */}
              <div className="text-[11px] text-zinc-400 space-y-0.5">
                {threat.resistances && (
                  <p>
                    <strong className="text-zinc-300">Resistências:</strong>{" "}
                    {threat.resistances}
                  </p>
                )}
                {threat.vulnerabilities && (
                  <p>
                    <strong className="text-red-300">Vulnerabilidades:</strong>{" "}
                    {threat.vulnerabilities}
                  </p>
                )}
              </div>

              {/* Enigma de Medo (com toggle Resolvido) */}
              {threat.enigmaOfFear && (
                <div
                  className={cn(
                    "rounded-xl border p-3 space-y-1.5 transition-all",
                    threat.enigmaResolved
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-sky-400/40 bg-sky-500/10"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-200">
                      Enigma de Medo
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleThreatEnigmaResolved(threat.id)}
                      className={cn(
                        "rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors",
                        threat.enigmaResolved
                          ? "border-emerald-400 bg-emerald-600/30 text-emerald-100"
                          : "border-sky-400/50 bg-[#0D0D14] text-sky-200 hover:bg-sky-500/20"
                      )}
                    >
                      {threat.enigmaResolved ? "✓ Resolvido" : "Marcar Resolvido"}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-200 leading-relaxed">
                    {threat.enigmaOfFear}
                  </p>
                </div>
              )}

              {/* Clickable Attacks */}
              <div className="space-y-2 border-t border-[#20202C] pt-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                  Ataques (clique para rolar)
                </span>
                {threat.attacks.map((atk) => (
                  <div
                    key={atk.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#242432] bg-[#0D0D14] p-2.5"
                  >
                    <div>
                      <p className="text-xs font-semibold text-zinc-100">
                        {atk.name}
                      </p>
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
                        onClick={() => handleRollThreatAttack(threat, atk)}
                      >
                        <Dices className="h-3 w-3" /> Teste
                      </Button>
                      <Button
                        size="xs"
                        variant="default"
                        onClick={() => handleRollThreatDamage(threat, atk, false)}
                      >
                        <Swords className="h-3 w-3 text-red-400" /> Dano
                      </Button>
                      <Button
                        size="xs"
                        variant="danger"
                        onClick={() => handleRollThreatDamage(threat, atk, true)}
                      >
                        <Sparkles className="h-3 w-3" /> x{atk.critMultiplier}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Abilities */}
              {threat.abilities.length > 0 && (
                <div className="space-y-1.5 border-t border-[#20202C] pt-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                    Habilidades
                  </span>
                  {threat.abilities.map((ab) => (
                    <div key={ab.id} className="text-xs text-zinc-400">
                      <strong className="text-zinc-200">{ab.name}:</strong>{" "}
                      {ab.description}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Send to Initiative Modal */}
      <Modal
        open={Boolean(sendModalThreat)}
        onClose={() => setSendModalThreat(null)}
        title={`Enviar "${sendModalThreat?.name ?? ""}" para Iniciativa`}
        description="Selecione a campanha de destino. A iniciativa da ameaça será rolada automaticamente."
        maxWidth="max-w-md"
      >
        {campaigns.length === 0 ? (
          <p className="text-xs text-zinc-400">
            Você ainda não possui nenhuma campanha. Crie uma na aba{" "}
            <strong className="text-zinc-200">Campanhas</strong> primeiro.
          </p>
        ) : (
          <div className="space-y-4">
            <Select
              value={targetCampaignId}
              onChange={(e) => setTargetCampaignId(e.target.value)}
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSendModalThreat(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSendToInitiative}>
                <Send className="h-3.5 w-3.5" /> Rolar & Enviar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Threat Modal */}
      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? "Editar Ameaça" : "Nova Ameaça do Outro Lado"}
      >
        <form onSubmit={handleSaveThreat} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-zinc-400 block mb-1">Nome *</label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Aberração de Carne"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Elemento</label>
              <Select
                value={form.element}
                onChange={(e) =>
                  setForm({
                    ...form,
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
            <div>
              <label className="text-xs text-zinc-400 block mb-1">VD</label>
              <Input
                type="number"
                value={form.vd}
                onChange={(e) =>
                  setForm({ ...form, vd: Number(e.target.value) || 0 })
                }
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">PV</label>
              <Input
                type="number"
                value={form.pv}
                onChange={(e) =>
                  setForm({ ...form, pv: Number(e.target.value) || 1 })
                }
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Defesa</label>
              <Input
                type="number"
                value={form.defense}
                onChange={(e) =>
                  setForm({ ...form, defense: Number(e.target.value) || 10 })
                }
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">
                Presença Perturb. DT
              </label>
              <Input
                type="number"
                value={form.disturbingPresence.dt}
                onChange={(e) =>
                  setForm({
                    ...form,
                    disturbingPresence: {
                      ...form.disturbingPresence,
                      dt: Number(e.target.value) || 10,
                    },
                  })
                }
                className="font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-zinc-400 block mb-1">
                Dano Mental da Presença
              </label>
              <Input
                value={form.disturbingPresence.damage}
                onChange={(e) =>
                  setForm({
                    ...form,
                    disturbingPresence: {
                      ...form.disturbingPresence,
                      damage: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {(["AGI", "FOR", "INT", "PRE", "VIG"] as const).map((k) => (
              <div key={k}>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1 text-center">
                  {k}
                </label>
                <Input
                  type="number"
                  value={form.attributes[k]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      attributes: {
                        ...form.attributes,
                        [k]: Number(e.target.value) || 0,
                      },
                    })
                  }
                  className="font-mono text-center"
                />
              </div>
            ))}
          </div>

          {/* First Attack Quick Editor */}
          {form.attacks[0] && (
            <div className="rounded-lg border border-[#242432] bg-[#0D0D14] p-3 space-y-2">
              <p className="text-xs font-semibold text-zinc-300">
                Ataque Principal
              </p>
              <div className="grid gap-2 sm:grid-cols-4">
                <Input
                  placeholder="Nome do ataque"
                  value={form.attacks[0].name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      attacks: [
                        { ...form.attacks[0], name: e.target.value },
                        ...form.attacks.slice(1),
                      ],
                    })
                  }
                  className="sm:col-span-2"
                />
                <Input
                  type="number"
                  placeholder="Bônus"
                  value={form.attacks[0].testBonus}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      attacks: [
                        {
                          ...form.attacks[0],
                          testBonus: Number(e.target.value) || 0,
                        },
                        ...form.attacks.slice(1),
                      ],
                    })
                  }
                  className="font-mono"
                />
                <Input
                  placeholder="Dano (ex: 2d8+4)"
                  value={form.attacks[0].damageFormula}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      attacks: [
                        { ...form.attacks[0], damageFormula: e.target.value },
                        ...form.attacks.slice(1),
                      ],
                    })
                  }
                  className="font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-zinc-400 block mb-1">
              Enigma de Medo (opcional)
            </label>
            <Textarea
              rows={2}
              value={form.enigmaOfFear ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  enigmaOfFear: e.target.value || undefined,
                })
              }
              placeholder="Condição para quebrar a imunidade / resolver o Enigma de Medo..."
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Descrição</label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditorOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Ameaça
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
