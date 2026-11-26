"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Dices,
  FolderOpen,
  Plus,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { BASE_ORIGINS } from "@/data/origins";
import { BASE_TRAILS } from "@/data/trails";
import { BASE_RITUALS } from "@/data/rituals";
import { BASE_CLASS_POWERS } from "@/data/classPowers";
import { BASE_GENERAL_POWERS } from "@/data/generalPowers";
import { BASE_PARANORMAL_POWERS } from "@/data/paranormalPowers";
import { BASE_ITEMS } from "@/data/equipment";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/primitives";

export default function LandingPage() {
  const router = useRouter();
  const { agents, campaigns, threats, homebrew, loadSampleAgents, setQuickRollerOpen } =
    useAppStore();

  const handleLoadSamples = () => {
    loadSampleAgents();
    router.push("/agentes");
  };

  const modules = [
    {
      index: "01",
      title: "Dossiês de Agentes",
      meta: `${agents.length} REGISTROS LOCAIS`,
      summary: `Fichas digitais com motor v1.2 + Sobrevivendo ao Horror, ${BASE_ORIGINS.length} origens, ${BASE_TRAILS.length} trilhas, ${BASE_RITUALS.length} rituais e ${BASE_ITEMS.length} itens catalogados.`,
      href: "/agentes",
    },
    {
      index: "02",
      title: "Campanhas & Escudo do Mestre",
      meta: `${campaigns.length} OPERAÇÕES ATIVAS`,
      summary:
        "Controle de Membrana, regras opcionais da mesa, gestão de PV/SAN/PE/PD em tempo real, iniciativa e pistas.",
      href: "/campanhas",
    },
    {
      index: "03",
      title: "Bestiário do Outro Lado",
      meta: `${threats.length} AMEAÇAS CATALOGADAS`,
      summary:
        "Criaturas de VD 15 a 400, Relíquias, Ameaças da Realidade, Enigma de Medo interativo e ataques clicáveis.",
      href: "/ameacas",
    },
    {
      index: "04",
      title: "Oficina Homebrew",
      meta: `${
        homebrew.rituals.length +
        homebrew.origins.length +
        (homebrew.trails?.length ?? 0) +
        (homebrew.powers?.length ?? 0)
      } ITENS CUSTOM`,
      summary:
        "Editor local integrado à ficha e ao wizard para origens, trilhas, poderes, rituais, equipamentos e criaturas com JSON.",
      href: "/homebrew",
    },
  ];

  const totalPowers =
    BASE_CLASS_POWERS.length +
    BASE_GENERAL_POWERS.length +
    BASE_PARANORMAL_POWERS.length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#09090B]">
      <div className="mx-auto max-w-[1380px] px-4 py-12 sm:px-6 lg:py-16">
        {/* Top classification hairline */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22222A] pb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#8E8E9E]">
          <span>V.E.R.A. // ARQUIVO CONFIDENCIAL</span>
          <span>ORDEM PARANORMAL v1.2 · SAH · ARQUIVOS SECRETOS</span>
        </div>

        {/* Asymmetric editorial grid */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_1fr] items-start">
          {/* Left: System Identity & Primary Actions */}
          <section className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <BrandLogo className="w-11 h-11 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-2xl sm:text-3xl font-bold tracking-[0.22em] text-[#F4F4F5]">
                      V.E.R.A.
                    </span>
                    <span className="rounded-sm border border-[#22222A] bg-[#141419] px-1.5 py-0.5 font-mono text-[10px] text-[#8E8E9E]">
                      v1.2
                    </span>
                  </div>
                  <span className="block font-mono text-[11px] uppercase tracking-[0.16em] text-[#8E8E9E]">
                    Vigilância Especial de Registros Anômalos
                  </span>
                </div>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F4F5] leading-[1.1]">
                Dossiês táticos, rolagem oficial e operações de campo.
              </h1>
              <p className="text-[15px] leading-relaxed text-[#D4D4D8] max-w-xl">
                Ambiente offline para criação de investigadores, rolagem com a
                matemática oficial de Ordem Paranormal RPG, condução de sessões
                no Escudo do Mestre e consulta de ameaças do Outro Lado.
              </p>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link href="/agentes/novo">
                <Button variant="primary" size="lg">
                  <Plus className="h-4 w-4" />
                  Novo Dossiê de Agente
                </Button>
              </Link>

              <Button variant="default" size="lg" onClick={handleLoadSamples}>
                <FolderOpen className="h-4 w-4 text-[#8E8E9E]" />
                Carregar 2 Agentes Exemplo
              </Button>

              {agents.length > 0 && (
                <Link href="/agentes">
                  <Button variant="outline" size="lg">
                    Meus Agentes ({agents.length})
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="lg"
                onClick={() => setQuickRollerOpen(true)}
              >
                <Dices className="h-4 w-4" />
                Rolador
              </Button>
            </div>

            {/* Technical Spec Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#22222A] rounded-md bg-[#101014] divide-y sm:divide-y-0 sm:divide-x divide-[#22222A]">
              {[
                { label: "ORIGENS", value: String(BASE_ORIGINS.length) },
                { label: "TRILHAS", value: String(BASE_TRAILS.length) },
                { label: "PODERES", value: String(totalPowers) },
                { label: "RITUAIS", value: String(BASE_RITUALS.length) },
              ].map((stat) => (
                <div key={stat.label} className="p-4">
                  <span className="block font-mono text-[10px] tracking-[0.16em] text-[#8E8E9E]">
                    {stat.label}
                  </span>
                  <span className="mt-1 block font-mono text-2xl font-bold text-[#F4F4F5]">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Restrained Element Index */}
            <div className="flex flex-wrap items-center gap-5 pt-2 border-t border-[#22222A]">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8E8E9E]">
                ELEMENTOS
              </span>
              {[
                { name: "Sangue", color: "#DC2626" },
                { name: "Morte", color: "#A1A1AA" },
                { name: "Conhecimento", color: "#EAB308" },
                { name: "Energia", color: "#9333EA" },
                { name: "Medo", color: "#E2E8F0" },
              ].map((el) => (
                <span
                  key={el.name}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-[#D4D4D8]"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-none"
                    style={{ backgroundColor: el.color }}
                  />
                  {el.name}
                </span>
              ))}
            </div>
          </section>

          {/* Right: Structured Module Directory */}
          <section className="border border-[#22222A] rounded-md bg-[#101014] divide-y divide-[#22222A]">
            <div className="flex items-center justify-between px-5 py-3 bg-[#0C0C10]">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#8E8E9E]">
                ÍNDICE DE MÓDULOS
              </span>
              <span className="font-mono text-[10px] text-[#6E6E7E]">
                LOCALSTORAGE · JSON
              </span>
            </div>

            {modules.map((mod) => (
              <Link
                key={mod.index}
                href={mod.href}
                className="group block px-5 py-4 hover:bg-[#16161C] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[11px] text-[#8E8E9E]">
                        {mod.index} //
                      </span>
                      <h2 className="font-display text-base font-semibold text-[#F4F4F5] group-hover:text-white">
                        {mod.title}
                      </h2>
                    </div>
                    <p className="text-[13px] leading-relaxed text-[#8E8E9E] group-hover:text-[#D4D4D8] transition-colors">
                      {mod.summary}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[#6E6E7E] group-hover:text-[#F4F4F5] transition-colors mt-0.5" />
                </div>
                <span className="mt-2.5 inline-block font-mono text-[10px] uppercase tracking-wider text-[#8E8E9E]">
                  {mod.meta}
                </span>
              </Link>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
