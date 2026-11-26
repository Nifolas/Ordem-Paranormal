"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dices,
  FileText,
  FlaskConical,
  Menu,
  Shield,
  Skull,
  Users,
  X,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/primitives";

const NAV_ITEMS = [
  { href: "/agentes", label: "Agentes", icon: Users },
  { href: "/campanhas", label: "Campanhas", icon: Shield },
  { href: "/ameacas", label: "Ameaças", icon: Skull },
  { href: "/documentos", label: "Documentos", icon: FileText },
  { href: "/homebrew", label: "Homebrew", icon: FlaskConical },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { setQuickRollerOpen, quickRollerOpen, quickDiceMod, rollHistory } =
    useAppStore();

  return (
    <header className="sticky top-0 z-40 border-b border-[#22222A] bg-[#09090B]/95">
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
                <span className="rounded-sm border border-[#22222A] bg-[#141419] px-1 py-0.5 font-mono text-[9px] font-medium tracking-wider text-[#8E8E9E]">
                  v1.2
                </span>
              </div>
              <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-[#6E6E7E] mt-0.5">
                Registros Anômalos
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center h-full gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href)) ||
                (item.href === "/agentes" && pathname.startsWith("/agente/"));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex h-full items-center gap-2 px-3 text-xs font-medium tracking-wide transition-colors",
                    active
                      ? "text-[#F4F4F5]"
                      : "text-[#8E8E9E] hover:text-[#D4D4D8]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
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
          <Button
            variant={quickRollerOpen ? "primary" : "outline"}
            size="sm"
            onClick={() => setQuickRollerOpen(!quickRollerOpen)}
            className="font-mono text-xs"
          >
            <Dices className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Rolador</span>
            {quickDiceMod !== 0 && (
              <span className="rounded-sm bg-[#16161C] border border-[#32323E] px-1.5 py-0.2 text-[10px] text-[#F4F4F5]">
                {quickDiceMod > 0 ? `+${quickDiceMod}d20` : `${quickDiceMod}d20`}
              </span>
            )}
            {rollHistory.length > 0 && quickDiceMod === 0 && (
              <span className="text-[10px] text-[#8E8E9E]">
                [{rollHistory.length}]
              </span>
            )}
          </Button>

          <button
            type="button"
            className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#22222A] bg-[#101014] text-[#D4D4D8] hover:text-[#F4F4F5]"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#22222A] bg-[#101014] px-4 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              pathname.startsWith(item.href) ||
              (item.href === "/agentes" && pathname.startsWith("/agente/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-sm px-3 py-2 text-xs font-medium",
                  active
                    ? "bg-[#16161C] text-[#F4F4F5] border border-[#32323E]"
                    : "text-[#8E8E9E] hover:bg-[#16161C] hover:text-[#F4F4F5]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
