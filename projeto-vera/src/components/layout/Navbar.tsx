"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Dices,
  HelpCircle,
  Map,
  Menu,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/BrandLogo";
import { BeginnerGuideModal } from "@/components/guide/BeginnerGuideModal";
import { Button } from "@/components/ui/primitives";

const NAV_ITEMS = [
  {
    href: "/agentes",
    label: "Agentes",
    icon: Users,
    matches: ["/agentes", "/agente/"],
  },
  {
    href: "/campanhas",
    label: "Campanhas",
    icon: Map,
    matches: ["/campanhas", "/documentos"],
  },
  {
    href: "/compendio",
    label: "Compêndio",
    icon: BookOpen,
    matches: ["/compendio", "/ameacas"],
  },
  {
    href: "/homebrew",
    label: "Homebrew",
    icon: Sparkles,
    matches: ["/homebrew"],
  },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const { setQuickRollerOpen, quickRollerOpen, quickDiceMod, rollHistory } =
    useAppStore();

  const isNavItemActive = (matches: readonly string[]) =>
    matches.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix)
    );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09090B]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1680px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-8 h-full">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              <BrandLogo className="w-7 h-7 shrink-0 transition-opacity group-hover:opacity-90" />
              <div className="leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-sm font-bold tracking-[0.22em] text-[#F4F4F5]">
                    V.E.R.A.
                  </span>
                  <span className="rounded-sm border border-white/10 bg-[#141419] px-1 py-0.5 font-mono text-[9px] font-medium tracking-wider text-zinc-400">
                    v1.2
                  </span>
                </div>
                <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500 mt-0.5">
                  Registros Anômalos
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center h-full gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(item.matches);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex h-full items-center gap-2 px-3.5 text-xs font-medium tracking-wide transition-colors",
                      active
                        ? "text-[#F4F4F5]"
                        : "text-zinc-400 hover:text-zinc-100"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        active ? "text-white" : "text-zinc-400"
                      )}
                    />
                    <span>{item.label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#F4F4F5]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Discreto de Ajuda / Guia do Iniciante */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGuideOpen(true)}
              className="text-xs text-zinc-300 hover:text-white"
              title="Abrir Guia do Iniciante & Glossário de Ordem Paranormal"
            >
              <HelpCircle className="h-4 w-4 text-sky-400" />
              <span className="hidden sm:inline">Ajuda</span>
            </Button>

            {/* Botão de Destaque: Rolador */}
            <Button
              variant={quickRollerOpen ? "primary" : "default"}
              size="sm"
              onClick={() => setQuickRollerOpen(!quickRollerOpen)}
              className={cn(
                "font-mono text-xs",
                !quickRollerOpen &&
                  "border-white/20 bg-[#16161E] hover:border-white/40 text-zinc-100"
              )}
            >
              <Dices className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline font-sans font-semibold">
                Rolador
              </span>
              {quickDiceMod !== 0 && (
                <span className="rounded-sm bg-[#16161C] border border-white/20 px-1.5 py-0.2 text-[10px] text-[#F4F4F5]">
                  {quickDiceMod > 0 ? `+${quickDiceMod}d20` : `${quickDiceMod}d20`}
                </span>
              )}
              {rollHistory.length > 0 && quickDiceMod === 0 && (
                <span className="text-[10px] opacity-75">
                  [{rollHistory.length}]
                </span>
              )}
            </Button>

            <button
              type="button"
              className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 bg-[#101014] text-[#D4D4D8] hover:text-[#F4F4F5]"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Menu"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#101014] px-4 py-2 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isNavItemActive(item.matches);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium",
                    active
                      ? "bg-[#16161C] text-[#F4F4F5] border border-white/15"
                      : "text-zinc-400 hover:bg-[#16161C] hover:text-[#F4F4F5]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      <BeginnerGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </>
  );
}
