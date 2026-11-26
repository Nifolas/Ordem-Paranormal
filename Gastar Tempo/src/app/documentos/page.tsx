"use client";

import React from "react";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { DocumentStudio } from "@/components/documents/DocumentStudio";

export default function DocumentosPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 space-y-6">
      <div className="border-b border-[#22222A] pb-4 vera-no-print">
        <div className="flex items-center gap-2.5 flex-wrap">
          <FileText className="h-5 w-5 text-[#A1A1AA]" />
          <h1 className="font-display text-xl sm:text-2xl font-bold text-[#F4F4F5]">
            Gerador de Documentos Confidenciais
          </h1>
          <Badge variant="outline" className="font-mono">
            HANDOUTS // V.E.R.A.
          </Badge>
        </div>
        <p className="text-xs text-[#8E8E9E] mt-1">
          Crie relatórios classificados, laudos de necropsia, páginas de diário,
          recortes de jornal e e-mails interceptados com tarjas{" "}
          <code className="font-mono text-[#D4D4D8]">[[censuradas]]</code> e
          exporte em PNG ou PDF.
        </p>
      </div>

      <DocumentStudio />
    </div>
  );
}
