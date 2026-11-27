"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dices, Menu, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/primitives";

const NAV_ITEMS = [
  { href: "/agentes", label: "Agentes", match: ["/agentes", "/agente/"] },
  { href: "/campanhas", label: "Campanhas", match: ["/campanhas"] },
  { href: "/ameacas", label: "Bestiário", match: ["/ameacas"] },
  { href: "/documentos", label: "Documentos", match: ["/documentos"] },
  { href: "/homebrew", label: "Homebrew", match: ["/homebrew"] },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { setQuickRollerOpen, quickRollerOpen, quickDiceMod, rollHistory } =
    useAppStore();

  const isActive = (match: readonly string[]) =>
    match.some((prefix) => pathname.startsWith(prefix));

  const rollerHint =
    quickDiceMod !== 0
      ? `${quickDiceMod > 0 ? "+" : ""}${quickDiceMod}d20`
      : rollHistory.length > 0
      ? String(rollHistory.length)
      : null;

  return (
    <header className="sticky top-0 z-40 border-b border-[#22222A] bg-[#09090B]/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1680px] items-center justify-between px-4 sm:px-6">
        <div className="flex h-full items-center gap-10">
          <Link
            href="/"
            title="Vigilância Especial de Registros Anômalos"
            className="group flex items-center gap-2.5 focus:outline-none"
          >
            <BrandLogo className="h-7 w-7 shrink-0 transition-opacity group-hover:opacity-90" />
            <span className="font-display text-sm font-bold tracking-[0.22em] text-[#F4F4F5]">
              V.E.R.A.
            </span>
          </Link>

          <nav className="hidden h-full items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.match);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex h-full items-center px-3 text-sm transition-colors",
                    active
                      ? "text-[#F4F4F5]"
                      : "text-zinc-400 hover:text-[#D4D4D8]"
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#F4F4F5]" />
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
          >
            <Dices className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Rolador</span>
            {rollerHint && (
              <span
                className={cn(
                  "font-mono text-[10px]",
                  quickRollerOpen ? "text-[#09090B]/70" : "text-zinc-400"
                )}
              >
                {rollerHint}
              </span>
            )}
          </Button>

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-zinc-400 hover:text-[#F4F4F5] md:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
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
        <nav className="space-y-1 border-t border-[#22222A] px-4 py-3 md:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block rounded-sm px-3 py-2 text-sm",
                isActive(item.match)
                  ? "bg-[#16161C] text-[#F4F4F5]"
                  : "text-zinc-400 hover:bg-[#16161C] hover:text-[#F4F4F5]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
