"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  Check,
  Download,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Plus,
  Printer,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type {
  HandoutDocument,
  HandoutImageFilter,
  HandoutStamp,
  HandoutTemplateId,
} from "@/types/ordem";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { DocumentPreview } from "./DocumentPreview";
import {
  Badge,
  Button,
  Card,
  Input,
  Select,
  Textarea,
} from "@/components/ui/primitives";

const TEMPLATES: {
  id: HandoutTemplateId;
  label: string;
  desc: string;
}[] = [
  {
    id: "relatorio",
    label: "Relatório V.E.R.A.",
    desc: "Documento classificado com protocolo e marca d'água",
  },
  {
    id: "necropsia",
    label: "Laudo de Necropsia",
    desc: "Exame médico-legal e achados paranormais",
  },
  {
    id: "diario",
    label: "Diário / Carta",
    desc: "Papel envelhecido manuscrito + mancha opcional",
  },
  {
    id: "jornal",
    label: "Recorte de Jornal",
    desc: "Manchete dramática e corpo em 2 colunas",
  },
  {
    id: "terminal",
    label: "Terminal / E-mail",
    desc: "Log interceptado em JetBrains Mono com hash",
  },
];

const STAMPS: { id: HandoutStamp; label: string }[] = [
  { id: "NONE", label: "Sem Carimbo" },
  { id: "CONFIDENCIAL", label: "CONFIDENCIAL" },
  { id: "ULTRASSECRETO", label: "ULTRASSECRETO" },
  { id: "ARQUIVO MORTO", label: "ARQUIVO MORTO" },
  { id: "ANOMALIA ATIVA", label: "ANOMALIA ATIVA" },
];

function createDefaultDraft(
  campaignId?: string | null
): Omit<HandoutDocument, "id" | "createdAt" | "updatedAt"> {
  return {
    template: "relatorio",
    title: "Incidente na Ala de Obras Raras",
    subtitle: "PROTOCOLO #VR-2026-041",
    date: "26/11/2026 · 03:13",
    author: "Agente Verificador — Setor de Análise",
    stamp: "CONFIDENCIAL",
    body: "Durante a varredura noturna na Biblioteca Municipal, a equipe identificou queda abrupta de temperatura e distorção eletromagnética na sala [[subsolo B-04]].\n\nO testemunho do vigia confirma que [[Sr. Augusto Mendes]] permaneceu no local após o fechamento portando um tomo encadernado em couro negro com inscrições em espiral.\n\nRecomenda-se envio imediato de equipe tática com contenção para anomalia de [[Morte]].",
    imageDataUrl: undefined,
    imageFilter: "evidence",
    bloodStain: false,
    revealRedactions: false,
    victimName: "Desconhecido (Sexo Masculino, aprox. 42 anos)",
    estimatedTime: "Entre 02h40 e 03h20",
    causeOfDeath: "Parada cardiorrespiratória por exaustão celular acelerada",
    paranormalFindings:
      "Resíduos de substância negra viscosa (Lodo) nos pulmões e marcas espirais nos pulsos.",
    emailFrom: "alerta.campo@ordorealitas.org",
    emailTo: "central.vera@ordorealitas.org",
    emailHash: "a91f30c4e8d209b6c7129f4a8e01c2d4b5f9e7a1",
    campaignId: campaignId ?? null,
  };
}

export function DocumentStudio({
  fixedCampaignId,
}: {
  fixedCampaignId?: string;
}) {
  const { handouts, campaigns, addHandout, updateHandout, deleteHandout } =
    useAppStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<
    Omit<HandoutDocument, "id" | "createdAt" | "updatedAt">
  >(() => createDefaultDraft(fixedCampaignId));
  const [exportingPng, setExportingPng] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const previewRef = useRef<HTMLDivElement | null>(null);

  const visibleHandouts = useMemo(() => {
    if (fixedCampaignId) {
      return handouts.filter((h) => h.campaignId === fixedCampaignId);
    }
    return handouts;
  }, [handouts, fixedCampaignId]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3200);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDraft((prev) => ({ ...prev, imageDataUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const payload = {
      ...draft,
      campaignId: fixedCampaignId ?? draft.campaignId ?? null,
    };
    if (editingId) {
      updateHandout(editingId, (prev) => ({ ...prev, ...payload }));
      showNotice("Documento atualizado na biblioteca.");
    } else {
      const created = addHandout(payload);
      setEditingId(created.id);
      showNotice("Documento salvo na biblioteca!");
    }
  };

  const handleLoadDocument = (doc: HandoutDocument) => {
    setEditingId(doc.id);
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = doc;
    setDraft(rest);
  };

  const handleNewDocument = () => {
    setEditingId(null);
    setDraft(createDefaultDraft(fixedCampaignId));
  };

  const handleDownloadPng = async () => {
    if (!previewRef.current) return;
    setExportingPng(true);
    try {
      const { toPng } = await import("html-to-image");
      let dataUrl: string;
      try {
        dataUrl = await toPng(previewRef.current, {
          pixelRatio: 2,
          cacheBust: true,
        });
      } catch {
        dataUrl = await toPng(previewRef.current, {
          pixelRatio: 2,
          cacheBust: true,
          skipFonts: true,
        });
      }
      const link = document.createElement("a");
      const slug = (draft.title || "documento-vera")
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "");
      link.download = `${slug || "documento"}-${draft.template}.png`;
      link.href = dataUrl;
      link.click();
      showNotice("Imagem PNG gerada em alta resolução!");
    } catch (err) {
      console.error(err);
      showNotice("Falha ao gerar PNG. Tente Imprimir/Salvar PDF.");
    } finally {
      setExportingPng(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const previewDoc: HandoutDocument = {
    ...draft,
    id: editingId ?? "preview",
    createdAt: "",
    updatedAt: "",
  };

  return (
    <div className="space-y-6">
      {/* Saved Library Strip */}
      <Card className="p-4 space-y-3 vera-no-print">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#A1A1AA]" />
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.14em] text-[#F4F4F5]">
              {fixedCampaignId
                ? `Documentos & Handouts desta Campanha (${visibleHandouts.length})`
                : `Biblioteca de Documentos Salvos (${visibleHandouts.length})`}
            </h2>
          </div>
          <Button size="xs" variant="outline" onClick={handleNewDocument}>
            <Plus className="h-3 w-3" /> Novo Documento
          </Button>
        </div>

        {visibleHandouts.length === 0 ? (
          <p className="text-xs text-[#6E6E7E]">
            Nenhum documento salvo ainda. Crie um abaixo e clique em &ldquo;Salvar na Biblioteca&rdquo;.
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {visibleHandouts.map((doc) => {
              const active = editingId === doc.id;
              const campName = doc.campaignId
                ? campaigns.find((c) => c.id === doc.campaignId)?.name
                : null;
              return (
                <div
                  key={doc.id}
                  className={cn(
                    "flex items-center gap-2 rounded-sm border px-3 py-2 shrink-0 transition-colors",
                    active
                      ? "border-[#F4F4F5] bg-[#16161C]"
                      : "border-[#22222A] bg-[#0B0B0F] hover:border-[#32323E]"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleLoadDocument(doc)}
                    className="text-left min-w-[140px] max-w-[220px]"
                  >
                    <p className="text-xs font-semibold text-[#F4F4F5] truncate">
                      {doc.title || "Sem título"}
                    </p>
                    <p className="font-mono text-[9px] uppercase text-[#8E8E9E] truncate">
                      {TEMPLATES.find((t) => t.id === doc.template)?.label}
                      {campName ? ` · ${campName}` : ""}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteHandout(doc.id);
                      if (editingId === doc.id) handleNewDocument();
                    }}
                    className="text-[#6E6E7E] hover:text-red-400 p-1"
                    title="Excluir documento"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {notice && (
        <div className="rounded-sm border border-emerald-500/40 bg-emerald-600/10 px-4 py-2 text-xs text-emerald-300 vera-no-print">
          {notice}
        </div>
      )}

      {/* 2-Column Studio: Left Form | Right Live High-Fidelity Preview */}
      <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)] items-start">
        {/* LEFT: EDITOR FORM */}
        <Card className="p-4 sm:p-5 space-y-4 vera-no-print">
          <div className="space-y-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#8E8E9E] block">
              Modelo Visual
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {TEMPLATES.map((tpl) => {
                const active = draft.template === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({ ...prev, template: tpl.id }))
                    }
                    className={cn(
                      "rounded-sm border px-2.5 py-2 text-left transition-colors",
                      active
                        ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                        : "border-[#22222A] bg-[#09090B] text-[#8E8E9E] hover:text-[#D4D4D8]"
                    )}
                  >
                    <p className="font-display text-xs font-bold">{tpl.label}</p>
                    <p className="text-[10px] opacity-75 leading-snug mt-0.5">
                      {tpl.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 border-t border-[#22222A] pt-3.5">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                Título / Manchete / Assunto
              </label>
              <Input
                value={draft.title}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Título do documento..."
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Código / Subtítulo
                </label>
                <Input
                  value={draft.subtitle}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, subtitle: e.target.value }))
                  }
                  placeholder="Ex: PROTOCOLO #VR-04"
                  className="text-xs font-mono"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Data / Hora
                </label>
                <Input
                  value={draft.date}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, date: e.target.value }))
                  }
                  placeholder="26/11/2026"
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Autor / Assinatura
                </label>
                <Input
                  value={draft.author}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, author: e.target.value }))
                  }
                  placeholder="Nome ou cargo..."
                  className="text-xs"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Carimbo
                </label>
                <Select
                  value={draft.stamp}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      stamp: e.target.value as HandoutStamp,
                    }))
                  }
                  className="text-xs font-mono"
                >
                  {STAMPS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Template-specific extra fields */}
            {draft.template === "necropsia" && (
              <div className="space-y-2.5 rounded-sm border border-[#22222A] bg-[#0B0B0F] p-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#8E8E9E] block">
                  Campos de Necropsia / Perícia
                </span>
                <Input
                  value={draft.victimName ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, victimName: e.target.value }))
                  }
                  placeholder="Vítima / Identificação"
                  className="h-8 text-xs"
                />
                <Input
                  value={draft.estimatedTime ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      estimatedTime: e.target.value,
                    }))
                  }
                  placeholder="Hora estimada do óbito"
                  className="h-8 text-xs"
                />
                <Input
                  value={draft.causeOfDeath ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      causeOfDeath: e.target.value,
                    }))
                  }
                  placeholder="Causa Mortis"
                  className="h-8 text-xs"
                />
                <Input
                  value={draft.paranormalFindings ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      paranormalFindings: e.target.value,
                    }))
                  }
                  placeholder="Achados Paranormais"
                  className="h-8 text-xs"
                />
              </div>
            )}

            {draft.template === "terminal" && (
              <div className="space-y-2 rounded-sm border border-[#22222A] bg-[#0B0B0F] p-3">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#8E8E9E] block">
                  Cabeçalho de Rede / E-mail
                </span>
                <Input
                  value={draft.emailFrom ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, emailFrom: e.target.value }))
                  }
                  placeholder="DE (remetente)"
                  className="h-8 text-xs font-mono"
                />
                <Input
                  value={draft.emailTo ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, emailTo: e.target.value }))
                  }
                  placeholder="PARA (destinatário)"
                  className="h-8 text-xs font-mono"
                />
                <Input
                  value={draft.emailHash ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, emailHash: e.target.value }))
                  }
                  placeholder="Hash SHA-256"
                  className="h-8 text-xs font-mono"
                />
              </div>
            )}

            {draft.template === "diario" && (
              <label className="inline-flex items-center gap-2 text-xs text-[#D4D4D8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(draft.bloodStain)}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      bloodStain: e.target.checked,
                    }))
                  }
                />
                Adicionar Mancha de Sangue / Lodo no canto da página
              </label>
            )}

            {/* Body Text + Redaction Helper */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E]">
                  Corpo do Texto · Use [[trecho]] p/ Tarja Preta
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      revealRedactions: !prev.revealRedactions,
                    }))
                  }
                  className="inline-flex items-center gap-1 font-mono text-[10px] text-[#A1A1AA] hover:text-[#F4F4F5]"
                >
                  {draft.revealRedactions ? (
                    <>
                      <Eye className="h-3 w-3 text-amber-400" /> Revelando tarjas
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3" /> Tarjas ocultas
                    </>
                  )}
                </button>
              </div>
              <Textarea
                rows={7}
                value={draft.body}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, body: e.target.value }))
                }
                placeholder="Digite o conteúdo. Use [[texto censurado]] para criar tarjas pretas..."
                className="text-xs font-mono"
              />
            </div>

            {/* Evidence Image Upload */}
            <div className="space-y-2 rounded-sm border border-[#22222A] bg-[#0B0B0F] p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E]">
                  Foto / Evidência Anexa (Opcional)
                </span>
                {draft.imageDataUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({ ...prev, imageDataUrl: undefined }))
                    }
                    className="inline-flex items-center gap-0.5 font-mono text-[10px] text-red-400 hover:text-red-300"
                  >
                    <X className="h-3 w-3" /> Remover
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-[#32323E] bg-[#16161C] px-3 py-1.5 font-mono text-[11px] text-[#F4F4F5] hover:border-[#F4F4F5]">
                  <ImageIcon className="h-3.5 w-3.5" /> Escolher Imagem
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                <Select
                  value={draft.imageFilter ?? "evidence"}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      imageFilter: e.target.value as HandoutImageFilter,
                    }))
                  }
                  className="h-8 text-xs flex-1"
                >
                  <option value="none">Cor Original</option>
                  <option value="bw">Preto & Branco</option>
                  <option value="sepia">Sépia Envelhecido</option>
                  <option value="evidence">Evidência Alto Contraste</option>
                </Select>
              </div>
            </div>

            {/* Link to Campaign */}
            {!fixedCampaignId && (
              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E] block mb-1">
                  Vincular à Campanha (opcional)
                </label>
                <Select
                  value={draft.campaignId ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      campaignId: e.target.value || null,
                    }))
                  }
                  className="text-xs"
                >
                  <option value="">Sem vínculo (Biblioteca Geral)</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Output Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#22222A]">
              <Button variant="primary" size="sm" onClick={handleSave}>
                {editingId ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Atualizar
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" /> Salvar
                  </>
                )}
              </Button>
              <Button
                variant="default"
                size="sm"
                disabled={exportingPng}
                onClick={handleDownloadPng}
              >
                <Download className="h-3.5 w-3.5" />{" "}
                {exportingPng ? "Gerando..." : "Baixar PNG"}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5" /> Imprimir/PDF
              </Button>
            </div>
          </div>
        </Card>

        {/* RIGHT: HIGH-FIDELITY LIVE PREVIEW */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between vera-no-print">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#8E8E9E]">
              PREVIEW AO VIVO // ALTA FIDELIDADE
            </span>
            <Badge variant="outline" className="font-mono text-[10px]">
              {TEMPLATES.find((t) => t.id === draft.template)?.label}
            </Badge>
          </div>

          <DocumentPreview
            ref={previewRef}
            id="vera-handout-print-area"
            doc={previewDoc}
          />
        </div>
      </div>
    </div>
  );
}
