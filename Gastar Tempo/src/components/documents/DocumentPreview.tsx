"use client";

import React from "react";
import type { HandoutDocument, HandoutImageFilter } from "@/types/ordem";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

function renderRedactedText(
  text: string,
  reveal: boolean,
  isDarkSurface: boolean
): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\[\[[\s\S]*?\]\])/g);
  return parts.map((part, idx) => {
    if (part.startsWith("[[") && part.endsWith("]]")) {
      const inner = part.slice(2, -2);
      if (reveal) {
        return (
          <span
            key={idx}
            className={cn(
              "px-1 rounded-[1px] font-mono border",
              isDarkSurface
                ? "bg-amber-500/20 border-amber-400/50 text-amber-200"
                : "bg-amber-200/80 border-amber-700/40 text-zinc-900"
            )}
          >
            {inner}
          </span>
        );
      }
      return (
        <span
          key={idx}
          aria-label="Trecho censurado"
          className={cn(
            "inline-block px-1 mx-0.5 rounded-[1px] select-none leading-tight",
            isDarkSurface
              ? "bg-zinc-200 text-zinc-200"
              : "bg-[#09090B] text-[#09090B]"
          )}
        >
          {inner || "████████"}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function getImageFilterClass(filter: HandoutImageFilter | undefined): string {
  switch (filter) {
    case "bw":
      return "grayscale contrast-125";
    case "sepia":
      return "sepia contrast-110 brightness-95";
    case "evidence":
      return "grayscale contrast-150 brightness-90";
    default:
      return "";
  }
}

function StampBadge({
  stamp,
  dark = false,
}: {
  stamp: HandoutDocument["stamp"];
  dark?: boolean;
}) {
  if (!stamp || stamp === "NONE") return null;
  const isDanger = stamp === "ULTRASSECRETO" || stamp === "ANOMALIA ATIVA";
  return (
    <div
      className={cn(
        "pointer-events-none select-none border-[3px] px-3 py-1 font-mono text-xs sm:text-sm font-black uppercase tracking-[0.22em] -rotate-12 inline-block",
        isDanger
          ? dark
            ? "border-red-500/80 text-red-400 bg-red-950/30"
            : "border-red-800/80 text-red-800/90 bg-red-900/5"
          : dark
          ? "border-amber-400/80 text-amber-300 bg-amber-950/30"
          : "border-zinc-900/80 text-zinc-900/90 bg-zinc-900/5"
      )}
    >
      {stamp}
    </div>
  );
}

export const DocumentPreview = React.forwardRef<
  HTMLDivElement,
  { doc: HandoutDocument; id?: string }
>(({ doc, id }, ref) => {
  const reveal = Boolean(doc.revealRedactions);
  const imgFilter = getImageFilterClass(doc.imageFilter);

  /* ==================== 1. RELATÓRIO CONFIDENCIAL ==================== */
  if (doc.template === "relatorio") {
    return (
      <div
        ref={ref}
        id={id}
        className="relative overflow-hidden bg-[#ECE9DF] text-[#141416] p-7 sm:p-10 min-h-[680px] border border-[#C8C3B4] shadow-xl flex flex-col justify-between"
      >
        {/* V.E.R.A. Watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.05]">
          <BrandLogo className="w-80 h-80 invert" />
        </div>

        <div className="relative z-10 space-y-5">
          {/* Technical Header */}
          <div className="flex items-start justify-between gap-4 border-b-2 border-[#18181B] pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#09090B] p-1.5 rounded-sm">
                <BrandLogo className="w-8 h-8" />
              </div>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#3F3F46]">
                  ORDO REALITAS // V.E.R.A.
                </p>
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#52525B]">
                  Vigilância Especial de Registros Anômalos
                </p>
              </div>
            </div>
            <div className="text-right font-mono text-[10px] text-[#3F3F46] space-y-0.5">
              <p className="font-bold">{doc.subtitle || "PROTOCOLO #VR-0042"}</p>
              <p>{doc.date || "DATA NÃO INFORMADA"}</p>
            </div>
          </div>

          {/* Title + Stamp */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#52525B] block">
                RELATÓRIO DE CAMPO CLASSIFICADO
              </span>
              <h1 className="font-typewriter text-2xl sm:text-3xl font-bold tracking-tight text-[#111113] leading-tight">
                {doc.title || "Sem Título"}
              </h1>
            </div>
            <div className="shrink-0 pt-1">
              <StampBadge stamp={doc.stamp} />
            </div>
          </div>

          {/* Evidence Photo */}
          {doc.imageDataUrl && (
            <div className="border border-[#18181B]/30 bg-[#DFDACB] p-2 max-w-sm">
              <img
                src={doc.imageDataUrl}
                alt="Evidência anexa"
                className={cn("w-full max-h-56 object-cover", imgFilter)}
              />
              <p className="font-mono text-[9px] uppercase tracking-wider text-[#3F3F46] mt-1.5">
                ANEXO FOTOGRÁFICO // REGISTRO DE EVIDÊNCIA
              </p>
            </div>
          )}

          {/* Body */}
          <div className="font-typewriter text-[13.5px] leading-[1.85] text-[#1C1C1E] whitespace-pre-wrap">
            {renderRedactedText(doc.body, reveal, false)}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-10 pt-4 border-t border-[#18181B]/30 flex flex-wrap items-end justify-between gap-4 font-mono text-[10px] text-[#3F3F46]">
          <div>
            <p className="uppercase tracking-wider text-[#52525B]">
              Responsável / Assinatura:
            </p>
            <p className="font-typewriter text-sm text-[#111113] mt-0.5">
              {doc.author || "Agente Verificador — Ordo Realitas"}
            </p>
          </div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-[#52525B] text-right">
            PROIBIDA A REPRODUÇÃO SEM AUTORIZAÇÃO DO VERÍSSIMO
          </p>
        </div>
      </div>
    );
  }

  /* ==================== 2. LAUDO DE NECROPSIA / PERÍCIA ==================== */
  if (doc.template === "necropsia") {
    return (
      <div
        ref={ref}
        id={id}
        className="relative overflow-hidden bg-[#F4F5F6] text-[#111318] p-7 sm:p-10 min-h-[680px] border border-[#CBD0D8] shadow-xl flex flex-col justify-between"
      >
        <div className="space-y-5">
          {/* Medico-Legal Banner */}
          <div className="flex items-start justify-between gap-4 border-b-2 border-[#1E293B] pb-3.5">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#475569]">
                INSTITUTO MÉDICO-LEGAL // DIVISÃO DE PERÍCIA ANÔMALA
              </p>
              <h1 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wide text-[#0F172A] mt-1">
                {doc.title || "Laudo Pericial de Necropsia"}
              </h1>
            </div>
            <StampBadge stamp={doc.stamp} />
          </div>

          {/* Structured Forensics Grid */}
          <div className="grid grid-cols-2 gap-px bg-[#CBD5E1] border border-[#94A3B8] font-mono text-xs">
            <div className="bg-white p-2.5">
              <span className="text-[9px] uppercase tracking-wider text-[#64748B] block">
                Nº do Caso / Guia
              </span>
              <span className="font-bold text-[#0F172A]">
                {doc.subtitle || "IML-2026-0891"}
              </span>
            </div>
            <div className="bg-white p-2.5">
              <span className="text-[9px] uppercase tracking-wider text-[#64748B] block">
                Data do Exame
              </span>
              <span className="font-bold text-[#0F172A]">
                {doc.date || "—"}
              </span>
            </div>
            <div className="bg-white p-2.5">
              <span className="text-[9px] uppercase tracking-wider text-[#64748B] block">
                Vítima / Identificação
              </span>
              <span className="font-bold text-[#0F172A]">
                {renderRedactedText(doc.victimName || "Não identificada", reveal, false)}
              </span>
            </div>
            <div className="bg-white p-2.5">
              <span className="text-[9px] uppercase tracking-wider text-[#64748B] block">
                Hora Estimada do Óbito
              </span>
              <span className="font-bold text-[#0F172A]">
                {doc.estimatedTime || "Entre 02h30 e 04h00"}
              </span>
            </div>
            <div className="bg-white p-2.5 col-span-2">
              <span className="text-[9px] uppercase tracking-wider text-[#64748B] block">
                Causa Mortis Preliminar
              </span>
              <span className="font-bold text-[#991B1B]">
                {renderRedactedText(
                  doc.causeOfDeath || "Indeterminada — requer exame complementar",
                  reveal,
                  false
                )}
              </span>
            </div>
            {doc.paranormalFindings && (
              <div className="bg-[#FEF2F2] p-2.5 col-span-2">
                <span className="text-[9px] uppercase tracking-wider text-[#991B1B] block font-bold">
                  Achados Paranormais / Anomalias Biológicas
                </span>
                <span className="text-[#450A0A]">
                  {renderRedactedText(doc.paranormalFindings, reveal, false)}
                </span>
              </div>
            )}
          </div>

          {doc.imageDataUrl && (
            <div className="border border-[#94A3B8] bg-white p-2 max-w-xs">
              <img
                src={doc.imageDataUrl}
                alt="Registro pericial"
                className={cn("w-full max-h-48 object-cover", imgFilter)}
              />
              <p className="font-mono text-[9px] uppercase text-[#64748B] mt-1">
                FIG. 01 — REGISTRO CADAVÉRICO / EVIDÊNCIA
              </p>
            </div>
          )}

          {/* Detailed Report Body */}
          <div className="space-y-1.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#475569] block">
              Descrição Técnica & Observações
            </span>
            <div className="font-mono text-[12.5px] leading-[1.8] text-[#1E293B] whitespace-pre-wrap">
              {renderRedactedText(doc.body, reveal, false)}
            </div>
          </div>
        </div>

        {/* Forensic Signature */}
        <div className="mt-10 pt-4 border-t border-[#94A3B8] flex items-end justify-between font-mono text-[10px] text-[#475569]">
          <div className="space-y-1">
            <div className="w-52 border-b border-[#0F172A] pb-1 font-handwriting text-xl text-[#0F172A]">
              {doc.author || "Dr. Legista"}
            </div>
            <p className="uppercase tracking-wider">Médico Legista / Perito Criminal</p>
          </div>
          <span className="uppercase tracking-widest">CADERNO DE PERÍCIA // V.E.R.A.</span>
        </div>
      </div>
    );
  }

  /* ==================== 3. DIÁRIO / CARTA MANUSCRITA ==================== */
  if (doc.template === "diario") {
    return (
      <div
        ref={ref}
        id={id}
        className="relative overflow-hidden bg-[#E5D7B8] text-[#2A2016] p-8 sm:p-11 min-h-[680px] border border-[#BFA97E] shadow-xl flex flex-col justify-between"
        style={{
          backgroundImage:
            "repeating-linear-gradient(transparent, transparent 31px, rgba(94, 71, 44, 0.14) 32px)",
        }}
      >
        {/* Aged Paper Vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: "inset 0 0 70px rgba(72, 48, 22, 0.35)",
          }}
        />

        {/* Optional Blood / Lodo Stain */}
        {doc.bloodStain && (
          <svg
            viewBox="0 0 200 200"
            className="pointer-events-none absolute -top-6 -right-6 w-56 h-56 opacity-45"
            aria-hidden="true"
          >
            <path
              d="M112,24 C144,18 176,42 172,78 C168,108 188,136 164,158 C142,178 106,162 84,174 C58,188 30,158 42,126 C52,98 22,74 44,48 C62,28 84,28 112,24 Z"
              fill="#4A0909"
            />
            <circle cx="34" cy="172" r="9" fill="#3B0707" />
            <circle cx="154" cy="182" r="5" fill="#2A0505" />
          </svg>
        )}

        <div className="relative z-10 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="font-serif italic text-xs text-[#5A442A]">
              {doc.subtitle || "Página arrancada de caderno"}
            </div>
            <div className="font-handwriting text-lg font-semibold text-[#4A3620]">
              {doc.date || "14 de Outubro"}
            </div>
          </div>

          <h1 className="font-handwriting text-3xl sm:text-4xl font-bold text-[#1F150C] leading-tight">
            {doc.title || "Querido diário..."}
          </h1>

          {doc.imageDataUrl && (
            <div className="bg-[#F2E9D6] p-2 pb-6 shadow-md border border-[#BFA97E] max-w-xs -rotate-1">
              <img
                src={doc.imageDataUrl}
                alt="Fotografia colada"
                className={cn("w-full max-h-48 object-cover", imgFilter)}
              />
            </div>
          )}

          <div className="font-handwriting text-[22px] leading-[1.48] text-[#22180E] whitespace-pre-wrap">
            {renderRedactedText(doc.body, reveal, false)}
          </div>
        </div>

        <div className="relative z-10 mt-10 flex items-end justify-between">
          <StampBadge stamp={doc.stamp} />
          <div className="text-right font-handwriting text-2xl font-bold text-[#1F150C]">
            — {doc.author || "Anônimo"}
          </div>
        </div>
      </div>
    );
  }

  /* ==================== 4. RECORTE DE JORNAL ==================== */
  if (doc.template === "jornal") {
    return (
      <div
        ref={ref}
        id={id}
        className="relative overflow-hidden bg-[#E7E3D7] text-[#151515] p-7 sm:p-10 min-h-[680px] border border-[#BEB8A8] shadow-xl flex flex-col justify-between"
      >
        <div className="space-y-4">
          {/* Masthead */}
          <div className="border-y-4 border-double border-[#181818] py-2.5 text-center space-y-1">
            <p className="font-serif text-xs uppercase tracking-[0.3em] text-[#404040]">
              {doc.subtitle || "GAZETA METROPOLITANA · EDIÇÃO EXTRA"}
            </p>
            <div className="flex items-center justify-between font-mono text-[10px] uppercase text-[#525252] border-t border-[#181818]/30 pt-1">
              <span>ANO XLII · Nº 4.198</span>
              <span>{doc.date || "QUINTA-FEIRA, 26 DE NOVEMBRO"}</span>
              <span>CADERNO POLICIAL</span>
            </div>
          </div>

          {/* Dramatic Headline */}
          <div className="text-center space-y-2 border-b border-[#181818]/40 pb-4">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold uppercase leading-[1.08] tracking-tight text-[#0D0D0D]">
              {doc.title || "MISTÉRIO SEM EXPLICAÇÃO ABALA A CIDADE"}
            </h1>
            {doc.author && (
              <p className="font-serif italic text-xs text-[#404040]">
                Por {doc.author}
              </p>
            )}
          </div>

          {doc.imageDataUrl && (
            <div className="border border-[#181818]/40 bg-[#D8D3C4] p-1.5">
              <img
                src={doc.imageDataUrl}
                alt="Foto jornalística"
                className={cn(
                  "w-full max-h-60 object-cover",
                  doc.imageFilter && doc.imageFilter !== "none"
                    ? imgFilter
                    : "grayscale contrast-125"
                )}
              />
              <p className="font-serif italic text-[11px] text-[#3F3F3F] mt-1">
                Registro fotográfico obtido no local do incidente.
              </p>
            </div>
          )}

          {/* 2-Column Press Body */}
          <div className="sm:columns-2 gap-6 font-serif text-[14.5px] leading-[1.65] text-justify text-[#1A1A1A] whitespace-pre-wrap">
            {renderRedactedText(doc.body, reveal, false)}
          </div>
        </div>

        <div className="mt-8 pt-3 border-t border-[#181818]/40 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#525252]">
            ARQUIVO HEMEROTECA // RECORTE ANEXADO AO DOSSIÊ
          </span>
          <StampBadge stamp={doc.stamp} />
        </div>
      </div>
    );
  }

  /* ==================== 5. TERMINAL / E-MAIL INTERCEPTADO ==================== */
  return (
    <div
      ref={ref}
      id={id}
      className="relative overflow-hidden bg-[#0A0C0E] text-[#D4E4DC] p-6 sm:p-9 min-h-[680px] border border-[#24302B] shadow-xl flex flex-col justify-between font-mono"
    >
      <div className="space-y-5">
        {/* Terminal Top Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-[#1E2E26] pb-3 text-[11px]">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="uppercase tracking-[0.18em] font-bold">
              V.E.R.A. // INTERCEPTAÇÃO DE REDE
            </span>
          </div>
          <span className="text-[10px] text-[#6E8B7D]">
            {doc.subtitle || "NODE://ORDO-SIGINT-09"}
          </span>
        </div>

        {/* Email / Log Headers */}
        <div className="rounded-sm border border-[#1E2E26] bg-[#0D1210] p-3.5 text-xs space-y-1.5">
          <div className="flex gap-2">
            <span className="text-[#6E8B7D] w-24 shrink-0">DE:</span>
            <span className="text-emerald-300">
              {doc.emailFrom || doc.author || "desconhecido@oculto.net"}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-[#6E8B7D] w-24 shrink-0">PARA:</span>
            <span className="text-[#D4E4DC]">
              {doc.emailTo || "central.vera@ordorealitas.org"}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-[#6E8B7D] w-24 shrink-0">ASSUNTO:</span>
            <span className="font-bold text-white">
              {doc.title || "TRANSMISSÃO INTERCEPTADA"}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-[#6E8B7D] w-24 shrink-0">TIMESTAMP:</span>
            <span className="text-[#A3B8AE]">
              {doc.date || "2026-11-26T03:13:07Z"}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-[#6E8B7D] w-24 shrink-0">SHA-256:</span>
            <span className="text-[10px] text-[#6E8B7D] truncate">
              {doc.emailHash || "8f4b2c91e7a044d9c3b112a67d4f891e0b2a5c3d"}
            </span>
          </div>
        </div>

        {doc.imageDataUrl && (
          <div className="border border-[#1E2E26] bg-[#0D1210] p-2 max-w-sm">
            <img
              src={doc.imageDataUrl}
              alt="Anexo interceptado"
              className={cn("w-full max-h-52 object-cover", imgFilter)}
            />
            <p className="text-[9px] text-emerald-400/80 mt-1">
              &gt; ATTACHMENT_DECODED.IMG [OK]
            </p>
          </div>
        )}

        {/* Terminal Payload */}
        <div className="text-[13px] leading-[1.85] text-[#D4E4DC] whitespace-pre-wrap">
          {renderRedactedText(doc.body, reveal, true)}
        </div>
      </div>

      <div className="mt-8 pt-3 border-t border-[#1E2E26] flex items-center justify-between text-[10px] text-[#6E8B7D]">
        <span>&gt; EOF // PACKET CAPTURED BY V.E.R.A.</span>
        <StampBadge stamp={doc.stamp} dark />
      </div>
    </div>
  );
});
DocumentPreview.displayName = "DocumentPreview";
