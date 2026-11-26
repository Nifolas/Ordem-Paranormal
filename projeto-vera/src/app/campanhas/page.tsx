"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  ExternalLink,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getAgentEffectiveVitals } from "@/lib/ordem-rules";
import { generateId } from "@/lib/utils";
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  Textarea,
} from "@/components/ui/primitives";

export default function CampanhasPage() {
  const {
    campaigns,
    agents,
    addCampaign,
    deleteCampaign,
    loadSampleAgents,
  } = useAppStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  const toggleAgent = (id: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const initialInitiative = selectedAgentIds.map((aid) => {
      const ag = agents.find((a) => a.id === aid);
      const vitals = ag ? getAgentEffectiveVitals(ag) : null;
      return {
        id: generateId("init"),
        type: "agent" as const,
        refId: aid,
        name: ag?.name ?? "Agente",
        initiative: 10,
        currentPv: ag?.status.pv.current ?? 20,
        maxPv: vitals?.maxPv ?? 20,
      };
    });

    addCampaign({
      name: name.trim(),
      description: description.trim(),
      agentIds: selectedAgentIds,
      initiative: initialInitiative,
      activeTurnIndex: 0,
      round: 1,
      gmNotes: "",
      clues: [],
    });

    setName("");
    setDescription("");
    setSelectedAgentIds([]);
    setModalOpen(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#22222A] pb-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8E8E9E]">
            Operações · Escudo do Mestre
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F4F5] mt-1">
            Campanhas
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {campaigns.length === 0 && (
            <Button variant="secondary" size="sm" onClick={() => loadSampleAgents()}>
              <Sparkles className="h-3.5 w-3.5 text-yellow-400" /> Carregar Campanha Demo
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Nova Campanha
          </Button>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Shield className="mx-auto h-10 w-10 text-zinc-600" />
          <h2 className="mt-3 text-base font-semibold text-zinc-200">
            Nenhuma campanha criada
          </h2>
          <p className="mt-1 text-xs text-zinc-400 max-w-md mx-auto">
            Crie uma campanha para agrupar seus agentes e abrir o Escudo do Mestre
            com rastreador de iniciativa, dano rápido e pistas da sessão.
          </p>
          <div className="mt-5 flex justify-center gap-2.5">
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> Criar Campanha
            </Button>
            <Button variant="default" onClick={() => loadSampleAgents()}>
              <Sparkles className="h-4 w-4 text-yellow-400" /> Carregar Demo
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((camp) => {
            const members = agents.filter((a) => camp.agentIds.includes(a.id));
            return (
              <Card
                key={camp.id}
                className="flex flex-col justify-between p-5 hover:border-[#32323E] transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-base font-bold text-[#F4F4F5]">
                      {camp.name}
                    </h2>
                    <Badge variant="outline" className="font-mono shrink-0">
                      RODADA {camp.round}
                    </Badge>
                  </div>
                  <p className="mt-2 text-[13px] text-[#A1A1AA] leading-relaxed line-clamp-3">
                    {camp.description || "Sem sinopse registrada."}
                  </p>

                  <div className="mt-4 space-y-1.5">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E]">
                      <Users className="h-3.5 w-3.5 text-[#A1A1AA]" />
                      Agentes ({members.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {members.length === 0 ? (
                        <span className="text-[11px] text-zinc-500">
                          Nenhum agente vinculado ainda.
                        </span>
                      ) : (
                        members.map((m) => (
                          <Badge key={m.id} variant="outline" className="text-[11px]">
                            {m.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#20202C] pt-3">
                  <Link href={`/campanhas/${camp.id}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      <ExternalLink className="h-3.5 w-3.5" /> Abrir Escudo do Mestre
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:text-red-400"
                    title="Excluir campanha"
                    onClick={() => {
                      if (window.confirm(`Excluir a campanha "${camp.name}"?`)) {
                        deleteCampaign(camp.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova Campanha"
        description="Defina o caso investigativo e selecione os agentes participantes."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              Nome da Campanha / Caso *
            </label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Caso 07: A Mansão do Relógio Parado"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1">
              Descrição / Sinopse
            </label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Resumo da missão, local e anomalias reportadas..."
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-300 block mb-1.5">
              Agentes Participantes ({selectedAgentIds.length})
            </label>
            {agents.length === 0 ? (
              <p className="text-xs text-[#6E6E7E] rounded-sm border border-dashed border-[#22222A] p-3">
                Você ainda não tem agentes cadastrados. Crie agentes ou carregue
                os exemplos depois.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto">
                {agents.map((ag) => {
                  const selected = selectedAgentIds.includes(ag.id);
                  return (
                    <button
                      key={ag.id}
                      type="button"
                      onClick={() => toggleAgent(ag.id)}
                      className={`flex items-center justify-between rounded-sm border px-3 py-2 text-left text-xs transition-colors ${
                        selected
                          ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                          : "border-[#22222A] bg-[#0D0D11] text-[#8E8E9E] hover:text-[#D4D4D8]"
                      }`}
                    >
                      <span className="truncate font-medium">{ag.name}</span>
                      {selected && <Check className="h-3.5 w-3.5 text-[#F4F4F5] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Criar Campanha
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
