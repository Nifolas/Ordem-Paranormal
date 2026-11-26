import type {
  AgentRitual,
  ClassDefinition,
  PowerDefinition,
  TrailDefinition,
} from "@/types/ordem";
import {
  EXTRAS_CLASS_POWERS,
  EXTRAS_GENERAL_POWERS,
  EXTRAS_PARANORMAL_POWERS,
  EXTRAS_RITUALS,
  EXTRAS_TRAILS,
} from "./extrasComunidade";
import { COMMUNITY_CLASSES } from "./grimorioCataclisma";

/**
 * Registro central de conteúdo de suplementos da comunidade.
 * Novos PDFs (Mistérios do Outro Lado, Grimório do Cataclisma, Guia Confidencial,
 * Máscaras Teatrais, Rituais Superiores) devem ser adicionados aqui, em arquivos
 * próprios, sem jamais sobrescrever registros oficiais.
 */
export const COMMUNITY_TRAILS: TrailDefinition[] = [...EXTRAS_TRAILS];

export const COMMUNITY_POWERS: PowerDefinition[] = [
  ...EXTRAS_CLASS_POWERS,
  ...EXTRAS_GENERAL_POWERS,
  ...EXTRAS_PARANORMAL_POWERS,
];

export const COMMUNITY_RITUALS: AgentRitual[] = [...EXTRAS_RITUALS];

export { COMMUNITY_CLASSES };
export type { ClassDefinition };
