import type { ContentSource, OrganizationId } from "@/types/ordem";
import { ENTREGA2_ORGANIZATIONS } from "@/data/supplements/entrega2Loader";

export interface OrganizationDefinition {
  id: OrganizationId;
  jsonId: string;
  name: string;
  source: ContentSource;
  summary: string;
  equipmentRules: string;
  creditRules: string;
  prestigeTable: { evento: string; pp: number }[];
  abilityName: string;
  abilityDescription: string;
  rules: string[];
}

export const DEFAULT_ORGANIZATION: OrganizationId = "ordo_realitas";

export function normalizeOrganizationId(
  id: OrganizationId | string | undefined
): "ordo_realitas" | "hell_hunters" | "famiglia_leone" | "obscurite" | "ordo_calamitas" {
  if (!id) return "ordo_realitas";
  const stripped = id.replace(/^mol_org_/, "");
  if (
    stripped === "ordo_realitas" ||
    stripped === "hell_hunters" ||
    stripped === "famiglia_leone" ||
    stripped === "obscurite" ||
    stripped === "ordo_calamitas"
  ) {
    return stripped;
  }
  return "ordo_realitas";
}

export const ORGANIZATIONS: OrganizationDefinition[] =
  ENTREGA2_ORGANIZATIONS.map((org) => ({
    id: org.id,
    jsonId: org.jsonId,
    name: org.name,
    source: org.source,
    summary: org.equipmentRules,
    equipmentRules: org.equipmentRules,
    creditRules: org.creditRules,
    prestigeTable: org.prestigeTable,
    abilityName: org.abilityName,
    abilityDescription: org.abilityDescription,
    rules: [
      `Equipamentos: ${org.equipmentRules}`,
      `Crédito: ${org.creditRules}`,
    ],
  }));

export function getOrganization(id: OrganizationId | undefined) {
  const canonical = normalizeOrganizationId(id);
  return (
    ORGANIZATIONS.find((o) => o.id === canonical || o.jsonId === id) ??
    ORGANIZATIONS[0]
  );
}
