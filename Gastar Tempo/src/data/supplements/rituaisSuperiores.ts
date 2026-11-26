import type { AgentRitual, SuperiorRitualInfo } from "@/types/ordem";

/** Rituais oficiais que recebem uma forma Superior (Rituais Superiores). */
export const SUPERIOR_FORM_TARGETS = [
  "involucro de carne",
  "desacelerar impacto",
  "videncia",
  "transfigurar terra",
] as const;

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function hasSuperiorForm(ritual: Pick<AgentRitual, "name" | "isSuperior" | "superiorInfo">): boolean {
  if (ritual.superiorInfo || ritual.isSuperior) return true;
  const n = normalize(ritual.name);
  return SUPERIOR_FORM_TARGETS.some((t) => n === t);
}

/** Rodadas extras de tentativa na Conjuração Complexa por grau de Ocultismo. */
export function getSuperiorExtraRounds(ocultismoTraining: number): number {
  if (ocultismoTraining >= 15) return 3;
  if (ocultismoTraining >= 10) return 2;
  if (ocultismoTraining >= 5) return 1;
  return 0;
}

export const SUPERIOR_REQUIREMENT_TEXT =
  "Requer a regra opcional Conjuração Complexa (Sobrevivendo ao Horror).";

export type { SuperiorRitualInfo };
