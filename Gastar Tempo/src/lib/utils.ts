import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ParanormalElement } from "@/types/ordem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export interface ElementStyle {
  label: string;
  hex: string;
  text: string;
  bg: string;
  border: string;
  borderLeft: string;
  dot: string;
  badge: string;
  glow: string;
}

/**
 * Surgical element palette — restrained 10% tints and hairline left-bar accents.
 */
export const ELEMENT_STYLES: Record<ParanormalElement, ElementStyle> = {
  Sangue: {
    label: "Sangue",
    hex: "#DC2626",
    text: "text-red-400",
    bg: "bg-red-600/10",
    border: "border-[#22222A]",
    borderLeft: "border-l-[#DC2626]",
    dot: "bg-[#DC2626]",
    badge: "bg-red-600/10 text-red-400 border-red-600/30",
    glow: "",
  },
  Morte: {
    label: "Morte",
    hex: "#A1A1AA",
    text: "text-zinc-300",
    bg: "bg-zinc-400/10",
    border: "border-[#22222A]",
    borderLeft: "border-l-[#A1A1AA]",
    dot: "bg-[#A1A1AA]",
    badge: "bg-zinc-400/10 text-zinc-300 border-zinc-400/30",
    glow: "",
  },
  Conhecimento: {
    label: "Conhecimento",
    hex: "#EAB308",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-[#22222A]",
    borderLeft: "border-l-[#EAB308]",
    dot: "bg-[#EAB308]",
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    glow: "",
  },
  Energia: {
    label: "Energia",
    hex: "#9333EA",
    text: "text-purple-400",
    bg: "bg-purple-600/10",
    border: "border-[#22222A]",
    borderLeft: "border-l-[#9333EA]",
    dot: "bg-[#9333EA]",
    badge: "bg-purple-600/10 text-purple-300 border-purple-600/30",
    glow: "",
  },
  Medo: {
    label: "Medo",
    hex: "#E2E8F0",
    text: "text-slate-200",
    bg: "bg-slate-200/10",
    border: "border-[#22222A]",
    borderLeft: "border-l-[#E2E8F0]",
    dot: "bg-[#E2E8F0]",
    badge: "bg-slate-200/10 text-slate-200 border-slate-300/30",
    glow: "",
  },
  Variável: {
    label: "Variável",
    hex: "#38BDF8",
    text: "text-sky-300",
    bg: "bg-sky-500/10",
    border: "border-[#22222A]",
    borderLeft: "border-l-sky-400",
    dot: "bg-sky-400",
    badge: "bg-sky-500/10 text-sky-300 border-sky-500/30",
    glow: "",
  },
  Realidade: {
    label: "Realidade",
    hex: "#10B981",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-[#22222A]",
    borderLeft: "border-l-emerald-500",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    glow: "",
  },
};

export function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
