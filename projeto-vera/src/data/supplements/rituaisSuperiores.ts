import type { AgentRitual, SuperiorRitualInfo } from "@/types/ordem";
import {
  ENTREGA1_SUPERIOR_FORMS,
  type OfficialSuperiorFormEntry,
} from "./entrega1Loader";

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Formas Superiores carregadas do JSON para os 4 rituais oficiais correspondentes. */
export const OFFICIAL_SUPERIOR_FORMS: OfficialSuperiorFormEntry[] =
  ENTREGA1_SUPERIOR_FORMS;

/** Rituais oficiais que recebem uma forma Superior (Rituais Superiores). */
export const SUPERIOR_FORM_TARGETS = OFFICIAL_SUPERIOR_FORMS.map((f) =>
  normalize(f.ritualAlvoNome)
);

const SUPERIOR_BY_NORMALIZED_NAME = new Map<string, OfficialSuperiorFormEntry>(
  OFFICIAL_SUPERIOR_FORMS.map((f) => [normalize(f.ritualAlvoNome), f])
);

/** Retorna o registro de Forma Superior para um ritual oficial pelo nome. */
export function getOfficialSuperiorForm(
  ritualName: string
): SuperiorRitualInfo | undefined {
  const entry = SUPERIOR_BY_NORMALIZED_NAME.get(normalize(ritualName));
  if (!entry) return undefined;
  return {
    id: entry.id,
    execution: entry.execucao,
    efeitoSuperior: entry.efeitoSuperior,
    source: entry.source,
  };
}

/**
 * Resolve o `superiorInfo` efetivo de qualquer ritual — prioriza `ritual.superiorInfo`
 * (ex.: os 5 Rituais Superiores próprios ou já acoplados) e faz fallback automático para
 * `formasSuperioresRituaisOficiais` (garantindo retrocompatibilidade com fichas já salvas).
 */
export function resolveSuperiorInfo(
  ritual: Pick<AgentRitual, "name" | "superiorInfo">
): SuperiorRitualInfo | undefined {
  return ritual.superiorInfo ?? getOfficialSuperiorForm(ritual.name);
}

export function hasSuperiorForm(
  ritual: Pick<AgentRitual, "name" | "isSuperior" | "superiorInfo">
): boolean {
  if (ritual.superiorInfo || ritual.isSuperior) return true;
  return SUPERIOR_BY_NORMALIZED_NAME.has(normalize(ritual.name));
}

/** Rodadas extras de tentativa na Conjuração Complexa por grau de Ocultismo. */
export function getSuperiorExtraRounds(ocultismoTraining: number): number {
  if (ocultismoTraining >= 15) return 3;
  if (ocultismoTraining >= 10) return 2;
  if (ocultismoTraining >= 5) return 1;
  return 0;
}

export const SUPERIOR_REQUIREMENT_TEXT =
  "Requer a regra opcional Conjuração Complexa (Sobrevivendo ao Horror, p. 114).";

export type { OfficialSuperiorFormEntry, SuperiorRitualInfo };
