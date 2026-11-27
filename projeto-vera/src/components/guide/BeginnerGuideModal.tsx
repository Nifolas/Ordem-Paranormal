"use client";

import React from "react";
import Link from "next/link";
import {
  Brain,
  Compass,
  Dices,
  Heart,
  Plus,
  Shield,
  Sparkles,
  UserPlus,
  Zap,
} from "lucide-react";
import { ELEMENT_VISUALS } from "@/lib/ui-icons";
import { GLOSSARY, type GlossaryTermKey } from "@/lib/glossary";
import { cn } from "@/lib/utils";
import { Button, Card, Modal } from "@/components/ui/primitives";

const CORE_ELEMENTS = [
  "Sangue",
  "Morte",
  "Conhecimento",
  "Energia",
  "Medo",
] as const;

const HIGHLIGHT_TERMS: GlossaryTermKey[] = [
  "NEX",
  "DT",
  "VD",
  "RD",
  "Patente",
  "Categoria",
  "Margem de Ameaça",
  "Crítico",
  "Afinidade",
  "Membrana",
  "Interlúdio",
];

export function BeginnerGuideContent({
  onCloseModal,
}: {
  onCloseModal?: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* 4 Blocos Visuais de Introdução */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bloco 1: O que é a Ordem e os 5 Elementos */}
        <Card className="p-5 space-y-3.5 border-white/15">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-purple-500/35 bg-purple-500/10 text-purple-300">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-purple-300">
                Passo 1 · O Universo
              </span>
              <h3 className="font-display text-base font-bold text-zinc-100">
                O que é a Ordem e os 5 Elementos?
              </h3>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-zinc-300">
            Você joga como um investigador da{" "}
            <strong className="text-zinc-100">Ordo Realitas</strong>, uma
            organização secreta que protege a nossa Realidade quando a{" "}
            <strong className="text-zinc-100">Membrana</strong> enfraquece e o{" "}
            <strong className="text-zinc-100">Outro Lado</strong> (o paranormal)
            vaza através de 5 entidades chamadas Elementos:
          </p>

          <div className="space-y-2 pt-1">
            {CORE_ELEMENTS.map((elKey) => {
              const vis = ELEMENT_VISUALS[elKey];
              const Icon = vis.icon;
              return (
                <div
                  key={elKey}
                  className="flex items-center gap-2.5 rounded-md border border-white/10 bg-[#0C0C10] px-3 py-2"
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                      vis.iconBoxCls
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-100">
                      {vis.label}
                    </div>
                    <div className="text-[11px] text-zinc-400 leading-snug">
                      {vis.tagline}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Bloco 2: Como funcionam os Testes (Atributo + Perícia) */}
        <Card className="p-5 space-y-3.5 border-white/15">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sky-500/35 bg-sky-500/10 text-sky-300">
              <Dices className="h-5 w-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-sky-300">
                Passo 2 · Rolando Dados
              </span>
              <h3 className="font-display text-base font-bold text-zinc-100">
                Como funcionam os Testes (Atributo + Perícia)?
              </h3>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-zinc-300">
            Sempre que tentar fazer algo arriscado (atirar, investigar uma
            pista, resistir ao medo), você faz um{" "}
            <strong className="text-zinc-100">Teste de Perícia</strong>:
          </p>

          <div className="space-y-2 text-xs">
            <div className="rounded-md border border-white/10 bg-[#0C0C10] p-3 space-y-1">
              <div className="font-semibold text-zinc-100">
                1. Quantidade de Dados (d20) = Valor do Atributo
              </div>
              <p className="text-[11px] text-zinc-400">
                Se você tem <strong className="text-zinc-200">Agilidade 3</strong>,
                rola <strong className="text-zinc-200">3 dados de 20 lados (3d20)</strong> e
                pega apenas o <strong className="text-emerald-300">MAIOR</strong> resultado.
                (Se o atributo for 0, você rola 2d20 e pega o menor).
              </p>
            </div>

            <div className="rounded-md border border-white/10 bg-[#0C0C10] p-3 space-y-1">
              <div className="font-semibold text-zinc-100">
                2. Bônus Somado = Grau de Treinamento na Perícia
              </div>
              <p className="text-[11px] text-zinc-400">
                Ao maior dado tirado, você soma o bônus da sua perícia:{" "}
                <strong className="text-zinc-300">Leigo (+0)</strong>,{" "}
                <strong className="text-emerald-300">Treinado (+5)</strong>,{" "}
                <strong className="text-sky-300">Veterano (+10)</strong> ou{" "}
                <strong className="text-amber-300">Expert (+15)</strong>.
              </p>
            </div>

            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
              <div className="font-semibold text-emerald-300">
                3. Na Ficha V.E.R.A. é só 1 Clique!
              </div>
              <p className="text-[11px] text-zinc-300">
                Você não precisa fazer conta: basta clicar no círculo do{" "}
                <strong>Atributo</strong>, no botão da <strong>Perícia</strong>{" "}
                ou do <strong>Ataque</strong> e o sistema rola e calcula tudo
                automaticamente.
              </p>
            </div>
          </div>
        </Card>

        {/* Bloco 3: Vida, Sanidade e Esforço */}
        <Card className="p-5 space-y-3.5 border-white/15">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-500/35 bg-rose-500/10 text-rose-300">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-rose-300">
                Passo 3 · Sobrevivência
              </span>
              <h3 className="font-display text-base font-bold text-zinc-100">
                Vida (PV), Sanidade (SAN) e Esforço (PE)
              </h3>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-zinc-300">
            No topo da sua ficha ficam as 3 barras que mantêm seu investigador
            vivo e lúcido durante a missão:
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5 rounded-md border border-rose-500/25 bg-rose-500/5 p-2.5">
              <Heart className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-rose-300">
                  Pontos de Vida (PV)
                </div>
                <p className="text-[11px] text-zinc-300">
                  Sua resistência física. Com metade ou menos você fica{" "}
                  <strong>Machucado</strong>; com 0 PV entra em{" "}
                  <strong>Morrendo</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-md border border-sky-500/25 bg-sky-500/5 p-2.5">
              <Brain className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sky-300">Sanidade (SAN)</div>
                <p className="text-[11px] text-zinc-300">
                  Sua saúde mental diante do horror. Com metade ou menos fica{" "}
                  <strong>Perturbado</strong>; com 0 SAN entra em{" "}
                  <strong>Enlouquecendo</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-md border border-amber-500/25 bg-amber-500/5 p-2.5">
              <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-300">
                  Pontos de Esforço (PE)
                </div>
                <p className="text-[11px] text-zinc-300">
                  Energia gasta para ativar poderes, habilidades de classe e
                  rituais (respeitando seu <strong>Limite de PE</strong> por
                  turno).
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Bloco 4: Como criar seu primeiro Agente */}
        <Card className="p-5 space-y-3.5 border-white/15 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/35 bg-emerald-500/10 text-emerald-300">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                  Passo 4 · Primeiros Passos
                </span>
                <h3 className="font-display text-base font-bold text-zinc-100">
                  Como criar seu primeiro Agente?
                </h3>
              </div>
            </div>

            <ol className="space-y-2 text-xs text-zinc-300">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] font-bold text-zinc-100">
                  1
                </span>
                <span>
                  <strong className="text-zinc-100">Distribua os Atributos:</strong>{" "}
                  Todos começam em 1 e você tem +4 pontos para colocar onde
                  preferir (máximo 3 inicial).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] font-bold text-zinc-100">
                  2
                </span>
                <span>
                  <strong className="text-zinc-100">Escolha sua Origem:</strong>{" "}
                  O que você fazia antes da Ordem (concede 2 perícias treinadas e
                  1 poder único).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] font-bold text-zinc-100">
                  3
                </span>
                <span>
                  <strong className="text-zinc-100">Escolha sua Classe:</strong>{" "}
                  <strong>Combatente</strong> (luta e armas),{" "}
                  <strong>Especialista</strong> (perícias e investigação) ou{" "}
                  <strong>Ocultista</strong> (rituais do Outro Lado).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] font-bold text-zinc-100">
                  4
                </span>
                <span>
                  <strong className="text-zinc-100">Equipe sua Mochila:</strong>{" "}
                  Adicione suas armas, proteção e itens operacionais respeitando
                  sua Patente.
                </span>
              </li>
            </ol>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <Link href="/agentes/novo" onClick={onCloseModal}>
              <Button variant="primary" size="sm">
                <Plus className="h-3.5 w-3.5" /> Criar Meu Primeiro Agente
              </Button>
            </Link>
            <Link href="/agentes" onClick={onCloseModal}>
              <Button variant="outline" size="sm">
                Ver Fichas de Exemplo
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Glossário Visual Rápido para Iniciantes */}
      <Card className="p-5 space-y-3.5 border-white/15">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h3 className="font-display text-sm font-bold text-zinc-100">
              Glossário Rápido de Termos (Ordem Paranormal)
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400">
            Passe o mouse nos termos pontilhados na ficha para ver estas dicas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {HIGHLIGHT_TERMS.map((tKey) => {
            const item = GLOSSARY[tKey];
            return (
              <div
                key={tKey}
                className="rounded-lg border border-white/10 bg-[#0C0C10] p-3 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-xs font-bold text-zinc-100">
                    {item.title}
                  </span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                    {item.term}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-400">
                  {item.shortExplanation}
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export function BeginnerGuideModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Guia do Iniciante — Ordem Paranormal & V.E.R.A."
      description="Resumo visual rápido de como funcionam os elementos, testes de dados, barras vitais e criação de agentes."
      maxWidth="max-w-5xl"
    >
      <BeginnerGuideContent onCloseModal={onClose} />
    </Modal>
  );
}
