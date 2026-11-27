"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  FlaskConical,
  Plus,
  Shield,
  Skull,
  Users,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getClassById } from "@/data/classes";
import { Button, Card } from "@/components/ui/primitives";

const RECENT_LIMIT = 4;

export default function LandingPage() {
  const router = useRouter();
  const { agents, campaigns, threats, homebrew, loadSampleAgents } =
    useAppStore();

  const handleLoadSamples = () => {
    loadSampleAgents();
    router.push("/agentes");
  };

  const recentAgents = useMemo(
    () =>
      [...agents]
        .sort(
          (a, b) =>
            (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0)
        )
        .slice(0, RECENT_LIMIT),
    [agents]
  );

  const homebrewCount =
    homebrew.rituals.length +
    homebrew.origins.length +
    (homebrew.trails?.length ?? 0) +
    (homebrew.powers?.length ?? 0);

  const shortcuts = [
    {
      title: "Agentes",
      description: "Fichas e dossiês dos investigadores.",
      count: `${agents.length} fichas`,
      href: "/agentes",
      icon: Users,
    },
    {
      title: "Campanhas",
      description: "Escudo do Mestre, iniciativa e Membrana.",
      count: `${campaigns.length} campanhas`,
      href: "/campanhas",
      icon: Shield,
    },
    {
      title: "Bestiário",
      description: "Criaturas, relíquias e ameaças do Outro Lado.",
      count: `${threats.length} ameaças`,
      href: "/ameacas",
      icon: Skull,
    },
    {
      title: "Homebrew",
      description: "Origens, trilhas, poderes e rituais próprios.",
      count: `${homebrewCount} itens`,
      href: "/homebrew",
      icon: FlaskConical,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#09090B]">
      <div className="mx-auto max-w-[1100px] space-y-14 px-4 py-12 sm:px-6 lg:py-16">
        {/* Agentes recentes */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#F4F4F5] sm:text-3xl">
                Agentes recentes
              </h1>
              <p className="text-sm text-zinc-400">
                Continue de onde parou ou abra um novo dossiê.
              </p>
            </div>
            <Link href="/agentes/novo">
              <Button variant="primary" size="lg">
                <Plus className="h-4 w-4" />
                Novo Agente
              </Button>
            </Link>
          </div>

          {recentAgents.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {recentAgents.map((agent) => {
                  const cls = getClassById(agent.classId);
                  const level =
                    agent.classId === "sobrevivente"
                      ? `Estágio ${agent.stage ?? 1}`
                      : `NEX ${agent.nex}%`;
                  return (
                    <Link key={agent.id} href={`/agente/${agent.id}`}>
                      <Card className="h-full p-5 transition-colors hover:border-[#32323E] hover:bg-[#16161C]">
                        <h2 className="truncate font-display text-base font-semibold text-[#F4F4F5]">
                          {agent.name}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-400">
                          {cls.name} · {level}
                        </p>
                      </Card>
                    </Link>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Link
                  href="/agentes"
                  className="text-zinc-400 transition-colors hover:text-[#F4F4F5]"
                >
                  Ver todos ({agents.length})
                </Link>
                <button
                  type="button"
                  onClick={handleLoadSamples}
                  className="text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  Carregar agentes de exemplo
                </button>
              </div>
            </>
          ) : (
            <Card className="flex flex-col items-start gap-4 border-dashed p-8">
              <p className="text-sm text-zinc-400">
                Nenhum agente por aqui ainda. Crie o primeiro dossiê ou
                explore com dois agentes de exemplo.
              </p>
              <Button variant="outline" onClick={handleLoadSamples}>
                Carregar 2 agentes de exemplo
              </Button>
            </Card>
          )}
        </section>

        {/* Atalhos */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="group">
                <Card className="flex h-full flex-col gap-3 p-5 transition-colors hover:border-[#32323E] hover:bg-[#16161C]">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-zinc-400 transition-colors group-hover:text-[#F4F4F5]" />
                    <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-[#F4F4F5]" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="font-display text-base font-semibold text-[#F4F4F5]">
                      {item.title}
                    </h2>
                    <p className="text-sm text-zinc-400">{item.description}</p>
                  </div>
                  <span className="mt-auto font-mono text-xs text-zinc-500">
                    {item.count}
                  </span>
                </Card>
              </Link>
            );
          })}
        </section>
      </div>
    </div>
  );
}
