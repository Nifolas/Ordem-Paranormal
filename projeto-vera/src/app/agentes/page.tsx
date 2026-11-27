"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Copy,
  DatabaseBackup,
  Download,
  ExternalLink,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { BASE_ORIGINS, getOriginById } from "@/data/origins";
import { getClassById } from "@/data/classes";
import { BASE_TRAILS } from "@/data/trails";
import { COMMUNITY_TRAILS } from "@/data/supplements";
import { getAgentEffectiveVitals, normalizeCatalogId } from "@/lib/ordem-rules";
import {
  exportAgentToJson,
  exportFullBackupToJson,
  parseImportedAgent,
  parseImportedBackup,
} from "@/services/storage";
import { clamp, cn, ELEMENT_STYLES } from "@/lib/utils";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";

export default function AgentesPage() {
  const {
    agents,
    homebrew,
    loadSampleAgents,
    duplicateAgent,
    deleteAgent,
    importAgent,
    getBackupSnapshot,
    restoreBackup,
  } = useAppStore();

  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const importAgentInputRef = useRef<HTMLInputElement>(null);
  const importBackupInputRef = useRef<HTMLInputElement>(null);

  const allTrails = useMemo(
    () => [...BASE_TRAILS, ...COMMUNITY_TRAILS, ...(homebrew.trails ?? [])],
    [homebrew.trails]
  );

  const filteredAgents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter((a) => {
      const cls = getClassById(a.classId);
      const origin = getOriginById(a.originId, homebrew.origins);
      return (
        a.name.toLowerCase().includes(q) ||
        a.player.toLowerCase().includes(q) ||
        cls.name.toLowerCase().includes(q) ||
        (origin?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [agents, query, homebrew.origins]);

  const showMsg = (type: "ok" | "err", text: string) => {
    setFeedback({ type, text });
    window.setTimeout(() => setFeedback(null), 4000);
  };

  const handleImportAgentFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseImportedAgent(text);
      const created = importAgent(parsed);
      showMsg("ok", `Dossiê "${created.name}" importado com sucesso.`);
    } catch (err) {
      showMsg(
        "err",
        err instanceof Error ? err.message : "Erro ao importar ficha."
      );
    } finally {
      e.target.value = "";
    }
  };

  const handleImportBackupFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const backup = parseImportedBackup(text);
      restoreBackup(backup);
      showMsg(
        "ok",
        `Backup restaurado (${backup.agents.length} agente(s), ${backup.campaigns.length} campanha(s)).`
      );
    } catch (err) {
      showMsg(
        "err",
        err instanceof Error ? err.message : "Erro ao restaurar backup."
      );
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-8 sm:px-6 space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#22222A] pb-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#8E8E9E]">
            01 // ORDO REALITAS · REGISTROS ATIVOS
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F4F5] mt-1">
            Meus Agentes
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={importAgentInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportAgentFile}
            className="hidden"
          />
          <input
            ref={importBackupInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportBackupFile}
            className="hidden"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => importAgentInputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" /> Importar Ficha
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportFullBackupToJson(getBackupSnapshot())}
          >
            <DatabaseBackup className="h-3.5 w-3.5" /> Backup JSON
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => importBackupInputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" /> Restaurar
          </Button>

          <Link href="/agentes/novo">
            <Button variant="primary" size="sm">
              <Plus className="h-3.5 w-3.5" /> Novo Agente
            </Button>
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          className={cn(
            "rounded-sm border px-4 py-2.5 text-xs font-medium",
            feedback.type === "ok"
              ? "border-emerald-600/40 bg-emerald-600/10 text-emerald-300"
              : "border-red-600/40 bg-red-600/10 text-red-300"
          )}
        >
          {feedback.text}
        </div>
      )}

      {/* Search + sample loader */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6E6E7E]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar dossiês por nome, jogador, classe ou origem..."
            className="pl-9"
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            loadSampleAgents();
            showMsg("ok", "2 agentes de exemplo e campanha demo carregados.");
          }}
        >
          <FolderOpen className="h-3.5 w-3.5 text-[#8E8E9E]" />
          Carregar Agentes Exemplo
        </Button>
      </div>

      {filteredAgents.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <User className="mx-auto h-8 w-8 text-[#6E6E7E]" />
          <h2 className="mt-3 font-display text-base font-semibold text-[#F4F4F5]">
            Nenhum dossiê encontrado
          </h2>
          <p className="mt-1 text-xs text-[#8E8E9E] max-w-md mx-auto">
            Inicie um novo dossiê de investigador no Wizard ou carregue os 2
            agentes de demonstração.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <Link href="/agentes/novo">
              <Button variant="primary">
                <Plus className="h-4 w-4" /> Criar Novo Agente
              </Button>
            </Link>
            <Button
              variant="default"
              onClick={() => {
                loadSampleAgents();
                showMsg("ok", "2 agentes exemplo carregados.");
              }}
            >
              <FolderOpen className="h-4 w-4" /> Carregar Exemplos
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => {
            const cls = getClassById(agent.classId);
            const trilha = allTrails.find(
              (t) =>
                t.id === agent.trilhaId ||
                t.id === normalizeCatalogId(agent.trilhaId)
            );
            const origin =
              getOriginById(agent.originId, homebrew.origins) ??
              BASE_ORIGINS.find((o) => o.id === agent.originId);
            const vitals = getAgentEffectiveVitals(agent);
            const elemStyle = agent.affinityElement
              ? ELEMENT_STYLES[agent.affinityElement]
              : null;

            const pvPct = clamp(
              (agent.status.pv.current / Math.max(1, vitals.maxPv)) * 100,
              0,
              100
            );
            const sanPct = clamp(
              (agent.status.san.current / Math.max(1, vitals.maxSan)) * 100,
              0,
              100
            );
            const pePct = clamp(
              (agent.status.pe.current / Math.max(1, vitals.maxPe)) * 100,
              0,
              100
            );
            const pdCurrent = agent.status.pd?.current ?? vitals.maxPd;
            const pdPct = clamp(
              (pdCurrent / Math.max(1, vitals.maxPd)) * 100,
              0,
              100
            );

            return (
              <Card
                key={agent.id}
                className={cn(
                  "group flex flex-col justify-between overflow-hidden transition-colors hover:border-[#32323E] border-l-[3px]",
                  elemStyle ? elemStyle.borderLeft : "border-l-[#32323E]"
                )}
              >
                {/* Top dossier stamp bar */}
                <div className="flex items-center justify-between border-b border-[#22222A] bg-[#0C0C10] px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E]">
                  <span>{agent.patente}</span>
                  <span className="font-bold text-[#F4F4F5]">
                    {agent.classId === "sobrevivente"
                      ? `ESTÁGIO ${agent.stage ?? 1} · NEX 0%`
                      : `NEX ${agent.nex}%`}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-start gap-3.5">
                    {agent.avatar ? (
                      <img
                        src={agent.avatar}
                        alt={agent.name}
                        className="h-14 w-14 rounded-sm object-cover border border-[#22222A] shrink-0"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border border-[#22222A] bg-[#16161C] font-mono text-base font-bold text-[#D4D4D8]">
                        {agent.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/agente/${agent.id}`}
                        className="block truncate font-display text-lg font-bold tracking-tight text-[#F4F4F5] hover:underline"
                      >
                        {agent.name}
                      </Link>
                      <p className="font-mono text-[11px] text-[#8E8E9E] truncate mt-0.5">
                        {cls.name}
                        {trilha ? ` · ${trilha.name}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {origin && (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {origin.name}
                          </Badge>
                        )}
                        {agent.affinityElement && elemStyle && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px]",
                              elemStyle.badge
                            )}
                          >
                            {agent.affinityElement}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Clean horizontal mini-bars */}
                  <div className="space-y-2 pt-1 font-mono text-[11px]">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[#8E8E9E]">
                        <span>PV</span>
                        <span className="text-[#F4F4F5]">
                          {agent.status.pv.current}/{vitals.maxPv}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-[#1C1C24] overflow-hidden">
                        <div
                          className="h-full bg-[#DC2626]"
                          style={{ width: `${pvPct}%` }}
                        />
                      </div>
                    </div>

                    {vitals.usingPd ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[#8E8E9E]">
                          <span>PD</span>
                          <span className="text-[#F4F4F5]">
                            {pdCurrent}/{vitals.maxPd}
                          </span>
                        </div>
                        <div className="h-1 w-full bg-[#1C1C24] overflow-hidden">
                          <div
                            className="h-full bg-[#9333EA]"
                            style={{ width: `${pdPct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[#8E8E9E]">
                            <span>SAN</span>
                            <span className="text-[#F4F4F5]">
                              {agent.status.san.current}/{vitals.maxSan}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-[#1C1C24] overflow-hidden">
                            <div
                              className="h-full bg-sky-500"
                              style={{ width: `${sanPct}%` }}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[#8E8E9E]">
                            <span>PE</span>
                            <span className="text-[#F4F4F5]">
                              {agent.status.pe.current}/{vitals.maxPe}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-[#1C1C24] overflow-hidden">
                            <div
                              className="h-full bg-amber-500"
                              style={{ width: `${pePct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between gap-1.5 border-t border-[#22222A] bg-[#0C0C10] px-4 py-2.5">
                  <Link href={`/agente/${agent.id}`} className="flex-1">
                    <Button variant="default" size="sm" className="w-full">
                      <ExternalLink className="h-3.5 w-3.5" /> Abrir Dossiê
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Duplicar agente"
                    onClick={() => {
                      duplicateAgent(agent.id);
                      showMsg("ok", `Agente "${agent.name}" duplicado.`);
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Exportar JSON"
                    onClick={() => exportAgentToJson(agent)}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Excluir agente"
                    className="hover:text-red-400"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Excluir permanentemente o agente "${agent.name}"?`
                        )
                      ) {
                        deleteAgent(agent.id);
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
    </div>
  );
}
