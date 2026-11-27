import type {
  AgentRitual,
  ClassDefinition,
  ConditionDefinition,
  CurseDefinition,
  InventoryItem,
  ModificationDefinition,
  OptionalRuleDefinition,
  OriginDefinition,
  PowerDefinition,
  RelicDefinition,
  Threat,
  TrailDefinition,
} from "@/types/ordem";
import {
  ENTREGA1_CLASS_POWERS,
  ENTREGA1_CONDITIONS,
  ENTREGA1_CURSED_ITEMS,
  ENTREGA1_GENERAL_POWERS,
  ENTREGA1_OPTIONAL_RULES,
  ENTREGA1_ORIGINS,
  ENTREGA1_PARANORMAL_POWERS,
  ENTREGA1_RITUALS,
  ENTREGA1_SUPERIOR_FORMS,
  ENTREGA1_THREATS,
  ENTREGA1_TRAILS,
  type OfficialSuperiorFormEntry,
} from "./entrega1Loader";
import {
  ENTREGA2_CLASS_POWERS,
  ENTREGA2_CURSES,
  ENTREGA2_EQUIPMENT,
  ENTREGA2_MODIFICATIONS,
  ENTREGA2_ORGANIZATIONS,
  ENTREGA2_PARANORMAL_FOODS,
  ENTREGA2_RITUALS,
  ENTREGA2_TRAILS,
  type ParanormalFoodEntry,
  type RawOrganizationEntry,
} from "./entrega2Loader";
import {
  ENTREGA3_ITEMS,
  ENTREGA3_NEW_THREATS,
  ENTREGA3_RELICS,
  ENTREGA3_THREATS,
  ENTREGA3_VARIANT_THREATS,
} from "./entrega3Loader";
import { COMMUNITY_CLASSES } from "./grimorioCataclisma";

/**
 * Registro central de conteúdo de suplementos da comunidade.
 * Registra automaticamente todo o conteúdo das Entregas 1, 2 e 3 sem jamais
 * sobrescrever registros oficiais.
 */
export const COMMUNITY_ORIGINS: OriginDefinition[] = [...ENTREGA1_ORIGINS];

export const COMMUNITY_TRAILS: TrailDefinition[] = [
  ...ENTREGA1_TRAILS,
  ...ENTREGA2_TRAILS,
];

export const COMMUNITY_CLASS_POWERS: PowerDefinition[] = [
  ...ENTREGA1_CLASS_POWERS,
  ...ENTREGA2_CLASS_POWERS,
];

export const COMMUNITY_GENERAL_POWERS: PowerDefinition[] = [
  ...ENTREGA1_GENERAL_POWERS,
];

export const COMMUNITY_PARANORMAL_POWERS: PowerDefinition[] = [
  ...ENTREGA1_PARANORMAL_POWERS,
];

export const COMMUNITY_POWERS: PowerDefinition[] = [
  ...COMMUNITY_CLASS_POWERS,
  ...COMMUNITY_GENERAL_POWERS,
  ...COMMUNITY_PARANORMAL_POWERS,
];

export const COMMUNITY_RITUALS: AgentRitual[] = [
  ...ENTREGA1_RITUALS,
  ...ENTREGA2_RITUALS,
];

export const COMMUNITY_CURSED_ITEMS: InventoryItem[] = [
  ...ENTREGA1_CURSED_ITEMS,
  ...ENTREGA2_EQUIPMENT.filter((it) => it.type === "amaldicoado"),
  ...ENTREGA3_ITEMS.filter((it) => it.type === "amaldicoado"),
];

export const COMMUNITY_ITEMS: InventoryItem[] = [
  ...ENTREGA1_CURSED_ITEMS,
  ...ENTREGA2_EQUIPMENT,
  ...ENTREGA3_ITEMS,
];

export const COMMUNITY_PARANORMAL_FOODS: ParanormalFoodEntry[] = [
  ...ENTREGA2_PARANORMAL_FOODS,
];

export const COMMUNITY_MODIFICATIONS: ModificationDefinition[] = [
  ...ENTREGA2_MODIFICATIONS,
];

export const COMMUNITY_CURSES: CurseDefinition[] = [...ENTREGA2_CURSES];

export const COMMUNITY_ORGANIZATIONS: RawOrganizationEntry[] = [
  ...ENTREGA2_ORGANIZATIONS,
];

export const COMMUNITY_CONDITIONS: ConditionDefinition[] = [
  ...ENTREGA1_CONDITIONS,
];

export const COMMUNITY_OPTIONAL_RULES: OptionalRuleDefinition[] = [
  ...ENTREGA1_OPTIONAL_RULES,
];

export const COMMUNITY_THREATS: Threat[] = [
  ...ENTREGA1_THREATS,
  ...ENTREGA3_THREATS,
];

export const COMMUNITY_NEW_THREATS: Threat[] = [...ENTREGA3_NEW_THREATS];

export const COMMUNITY_VARIANT_THREATS: Threat[] = [...ENTREGA3_VARIANT_THREATS];

export const COMMUNITY_RELICS: RelicDefinition[] = [...ENTREGA3_RELICS];

export const OFFICIAL_SUPERIOR_FORMS: OfficialSuperiorFormEntry[] = [
  ...ENTREGA1_SUPERIOR_FORMS,
];

export { COMMUNITY_CLASSES };
export type {
  ClassDefinition,
  OfficialSuperiorFormEntry,
  ParanormalFoodEntry,
  RawOrganizationEntry,
};
