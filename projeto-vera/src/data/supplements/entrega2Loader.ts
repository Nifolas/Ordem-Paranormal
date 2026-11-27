import rawEntrega2 from "./entrega_2_misterios_do_outro_lado_parte1.json";
import type {
  AgentClassId,
  AgentRitual,
  ContentSource,
  CurseDefinition,
  InventoryItem,
  ItemCategory,
  ItemCategoryType,
  ModificationDefinition,
  OrganizationId,
  ParanormalElement,
  ParanormalFoodId,
  PowerDefinition,
  TrailDefinition,
} from "@/types/ordem";

const CIRCLE_BASE_PE: Record<1 | 2 | 3 | 4, number> = {
  1: 1,
  2: 3,
  3: 6,
  4: 10,
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseElement(raw: string): ParanormalElement {
  const n = normalizeText(raw);
  if (n.startsWith("variavel")) return "Variável";
  if (n.startsWith("sangue")) return "Sangue";
  if (n.startsWith("morte")) return "Morte";
  if (n.startsWith("conhecimento")) return "Conhecimento";
  if (n.startsWith("energia")) return "Energia";
  if (n.startsWith("medo")) return "Medo";
  return "Realidade";
}

function parseAddonPe(
  text: string | undefined,
  basePe: number
): number | undefined {
  if (!text) return undefined;
  const m = text.match(/^\(?\s*\+(\d+)\s*PE\s*\)?/i);
  return m ? basePe + parseInt(m[1], 10) : basePe;
}

function parseMarcoToNumber(marco: string): number {
  const match = marco.match(/\d+/);
  return match ? parseInt(match[0], 10) : 10;
}

function parseRdNumber(rd: string | undefined): number | undefined {
  if (!rd) return undefined;
  const match = rd.match(/\d+/);
  return match ? parseInt(match[0], 10) : undefined;
}

const MOD_TARGET_LABELS: Record<string, string> = {
  municao: "Munição",
  arma_fogo: "Arma de Fogo",
  protecao: "Proteção",
  arma: "Arma",
  acessorio: "Acessório",
};

function mapCanonicalOrgId(jsonId: string): OrganizationId {
  const stripped = jsonId.replace(/^mol_org_/, "");
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

export interface ParanormalFoodEntry {
  id: ParanormalFoodId;
  name: string;
  element: ParanormalElement;
  source: ContentSource;
  sceneEffect: string;
  interludeEffect: string;
  description: string;
}

export interface RawOrganizationEntry {
  id: OrganizationId;
  jsonId: string;
  name: string;
  source: ContentSource;
  equipmentRules: string;
  creditRules: string;
  prestigeTable: { evento: string; pp: number }[];
  abilityName: string;
  abilityDescription: string;
}

/* ============================================================================
 * 1. PODERES DE CLASSE (17 poderes — mol_*)
 * ============================================================================ */
export const ENTREGA2_CLASS_POWERS: PowerDefinition[] =
  rawEntrega2.poderesClasse.map((p) => ({
    id: p.id,
    name: p.nome,
    category: "classe",
    classId: p.classe as AgentClassId,
    prerequisites: "preRequisito" in p ? p.preRequisito : undefined,
    peCost: "custoPe" in p && typeof p.custoPe === "number" ? p.custoPe : 0,
    description: p.descricao,
    source: p.source as ContentSource,
  }));

/* ============================================================================
 * 2. TRILHAS (10 trilhas — mol_*)
 * ============================================================================ */
export const ENTREGA2_TRAILS: TrailDefinition[] = rawEntrega2.trilhas.map(
  (t) => {
    const especial =
      "especial" in t && typeof t.especial === "string" ? t.especial : undefined;
    const baseDesc =
      t.habilidades[0]?.descricao ?? `Trilha ${t.nome} (${t.classe}).`;
    return {
      id: t.id,
      classId: t.classe as AgentClassId,
      name: t.nome,
      source: t.source as ContentSource,
      description: especial ? `${especial} ${baseDesc}` : baseDesc,
      abilitiesByNex: t.habilidades.map((h) => ({
        nex: parseMarcoToNumber(h.marco),
        name: h.nome,
        description: h.descricao,
      })),
    };
  }
);

/* ============================================================================
 * 3. EQUIPAMENTOS & ALIMENTOS PARANORMAIS (12 itens — mol_*)
 * ============================================================================ */
export const ENTREGA2_EQUIPMENT: InventoryItem[] =
  rawEntrega2.equipamentos.map((eq) => {
    const subtype = "subtipo" in eq ? eq.subtipo : undefined;
    const element =
      "elemento" in eq && typeof eq.elemento === "string"
        ? parseElement(eq.elemento)
        : undefined;
    const defenseBonus = "defesa" in eq ? eq.defesa : undefined;
    const rdBonus = "rd" in eq ? parseRdNumber(eq.rd) : undefined;
    const wearable = "vestivel" in eq ? Boolean(eq.vestivel) : undefined;
    const carryBonus = eq.id === "mol_armazenador_paranormal" ? 3 : undefined;

    return {
      id: eq.id,
      name: eq.nome,
      type: eq.tipo as ItemCategoryType,
      subtype,
      wearable,
      category: eq.categoria as ItemCategory,
      spaces: eq.espacos,
      quantity: 1,
      equipped: false,
      defenseBonus,
      rdBonus,
      carryBonus,
      element,
      description: subtype ? `${subtype}. ${eq.descricao}` : eq.descricao,
      source: eq.source as ContentSource,
    };
  });

export const ENTREGA2_PARANORMAL_FOODS: ParanormalFoodEntry[] =
  rawEntrega2.equipamentos
    .filter(
      (eq) =>
        "subtipo" in eq &&
        eq.subtipo === "Alimento Paranormal" &&
        "elemento" in eq
    )
    .map((eq) => {
      const desc = eq.descricao;
      const sceneMatch = desc.match(/Efeito de cena:\s*([^]+?)\s*Interlúdio:/i);
      const interludeMatch = desc.match(/Interlúdio:\s*([^]+)$/i);
      return {
        id: eq.id as ParanormalFoodId,
        name: eq.nome,
        element: parseElement(
          "elemento" in eq && typeof eq.elemento === "string"
            ? eq.elemento
            : "Sangue"
        ),
        source: eq.source as ContentSource,
        sceneEffect: sceneMatch ? sceneMatch[1].trim() : desc,
        interludeEffect: interludeMatch ? interludeMatch[1].trim() : desc,
        description: desc,
      };
    });

/* ============================================================================
 * 4. MODIFICAÇÕES (3 modificações — mol_mod_*)
 * ============================================================================ */
export const ENTREGA2_MODIFICATIONS: ModificationDefinition[] =
  rawEntrega2.modificacoes.map((m) => {
    const targetLabel = MOD_TARGET_LABELS[m.alvo] ?? m.alvo;
    const restricao = "restricao" in m ? m.restricao : undefined;
    const espacosBonus = "espacosBonus" in m ? m.espacosBonus : undefined;
    const suffixParts: string[] = [];
    if (restricao) suffixParts.push(restricao);
    if (espacosBonus) suffixParts.push(`+${espacosBonus} espaço`);
    const extra = suffixParts.length > 0 ? ` (${suffixParts.join(" · ")})` : "";
    return {
      id: m.id,
      name: m.nome,
      appliesTo: targetLabel,
      categoryIncrease: m.categoriaBonus,
      description: `${m.descricao}${extra}`,
      source: m.source as ContentSource,
    };
  });

/* ============================================================================
 * 5. MALDIÇÕES DE MEDO (4 maldições — mol_mald_*)
 * ============================================================================ */
export const ENTREGA2_CURSES: CurseDefinition[] = rawEntrega2.maldicoes.map(
  (c) => ({
    id: c.id,
    name: c.nome,
    element: parseElement(c.elemento),
    appliesTo: MOD_TARGET_LABELS[c.alvo] ?? c.alvo,
    description: c.descricao,
    source: c.source as ContentSource,
  })
);

/* ============================================================================
 * 6. ORGANIZAÇÕES DA REALIDADE (5 organizações — mol_org_*)
 * ============================================================================ */
export const ENTREGA2_ORGANIZATIONS: RawOrganizationEntry[] =
  rawEntrega2.organizacoes.map((org) => ({
    id: mapCanonicalOrgId(org.id),
    jsonId: org.id,
    name: org.nome,
    source: org.source as ContentSource,
    equipmentRules: org.regrasEquipamento,
    creditRules: org.regrasCredito,
    prestigeTable:
      "tabelaPrestigio" in org && Array.isArray(org.tabelaPrestigio)
        ? org.tabelaPrestigio
        : [],
    abilityName: org.habilidade.nome,
    abilityDescription: org.habilidade.descricao,
  }));

/* ============================================================================
 * 7. RITUAIS (14 rituais — mol_*, incluindo 5 Correntes da Realidade)
 * ============================================================================ */
export const ENTREGA2_RITUALS: AgentRitual[] = rawEntrega2.rituais.map((r) => {
  const circle = r.circulo as 1 | 2 | 3 | 4;
  const basePe = CIRCLE_BASE_PE[circle];
  const discente = "discente" in r ? r.discente : undefined;
  const verdadeiro = "verdadeiro" in r ? r.verdadeiro : undefined;
  const exclusiveTrail =
    "exclusivoTrilha" in r ? r.exclusivoTrilha : undefined;
  const isCorrentes =
    "isCorrentesDaRealidade" in r ? Boolean(r.isCorrentesDaRealidade) : false;

  const description = exclusiveTrail
    ? `Exclusivo da trilha ${exclusiveTrail}. ${r.efeitoPadrao}`
    : r.efeitoPadrao;

  return {
    id: r.id,
    name: r.nome,
    element: parseElement(r.elemento),
    circle,
    execution: r.execucao,
    range: r.alcance,
    target: r.alvo,
    duration: r.duracao,
    resistance: r.resistencia,
    peCost: basePe,
    description,
    discente,
    discenteCost: parseAddonPe(discente, basePe),
    verdadeira: verdadeiro,
    verdadeiraCost: parseAddonPe(verdadeiro, basePe),
    exclusiveTrail,
    isCorrentesDaRealidade: isCorrentes,
    source: r.source as ContentSource,
  };
});

export const ENTREGA2_META = rawEntrega2.meta;
