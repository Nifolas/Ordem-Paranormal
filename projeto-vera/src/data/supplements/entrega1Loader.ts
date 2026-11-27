import rawEntrega1 from "./entrega_1_extras_mascaras_superiores_guia1.json";
import type {
  AgentClassId,
  AgentRitual,
  ConditionDefinition,
  ContentSource,
  InventoryItem,
  ItemCategory,
  OptionalRuleDefinition,
  OptionalRuleId,
  OriginDefinition,
  OriginPassiveEffects,
  ParanormalElement,
  PowerDefinition,
  SkillKey,
  SuperiorRitualInfo,
  Threat,
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

const SKILL_NAME_TO_KEY: Record<string, SkillKey> = {
  acrobacia: "acrobacia",
  adestramento: "adestramento",
  artes: "artes",
  atletismo: "atletismo",
  atualidades: "atualidades",
  ciencias: "ciencias",
  crime: "crime",
  diplomacia: "diplomacia",
  enganacao: "enganacao",
  fortitude: "fortitude",
  furtividade: "furtividade",
  iniciativa: "iniciativa",
  intimidacao: "intimidacao",
  intuicao: "intuicao",
  investigacao: "investigacao",
  luta: "luta",
  medicina: "medicina",
  ocultismo: "ocultismo",
  percepcao: "percepcao",
  pilotagem: "pilotagem",
  pontaria: "pontaria",
  profissao: "profissao",
  reflexos: "reflexos",
  religiao: "religiao",
  sobrevivencia: "sobrevivencia",
  tatica: "tatica",
  tecnologia: "tecnologia",
  vontade: "vontade",
};

function parseSkillKey(label: string): SkillKey | null {
  return SKILL_NAME_TO_KEY[normalizeText(label)] ?? null;
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

function parseDiceSpec(spec: string): { diceCount: number; testBonus: number } {
  const m = spec.match(/(\d+)d20\s*([+-]\s*\d+)?/i);
  if (!m) return { diceCount: 2, testBonus: 5 };
  return {
    diceCount: parseInt(m[1], 10),
    testBonus: m[2] ? parseInt(m[2].replace(/\s+/g, ""), 10) : 0,
  };
}

function parseDamageSpec(raw: string): {
  formula: string;
  damageType: string;
  notes?: string;
} {
  const diceTokens = raw.match(/\d+d\d+(?:[+-]\d+)?/gi);
  const formula = diceTokens ? diceTokens.join("+") : "1d6";
  const cleanedType = raw
    .replace(/\d+d\d+(?:[+-]\d+)?/gi, "")
    .replace(/\+/g, "/")
    .replace(/\s+/g, " ")
    .replace(/^[\s/]+|[\s/]+$/g, "");
  return {
    formula,
    damageType: cleanedType || "Físico",
    notes: raw !== `${formula} ${cleanedType}` ? raw : undefined,
  };
}

export interface OfficialSuperiorFormEntry {
  id: string;
  ritualAlvoNome: string;
  elemento: ParanormalElement;
  circulo: 1 | 2 | 3 | 4;
  source: ContentSource;
  execucao: string;
  efeitoSuperior: string;
}

/* ============================================================================
 * 1. ORIGENS (Guia Confidencial Vol. I — 4 origens)
 * ============================================================================ */
export const ENTREGA1_ORIGINS: OriginDefinition[] = rawEntrega1.origens.map(
  (o) => {
    const trainedSkills = o.pericias
      .map(parseSkillKey)
      .filter((k): k is SkillKey => k !== null);
    const efeitosPassivos = o.efeitosPassivos as
      | OriginPassiveEffects
      | undefined;
    const preRequisito =
      "preRequisito" in o && typeof o.preRequisito === "string"
        ? o.preRequisito
        : undefined;

    return {
      id: o.id,
      name: o.nome,
      source: o.source as ContentSource,
      description: preRequisito
        ? `Pré-requisito: ${preRequisito}. ${o.poder.descricao}`
        : o.poder.descricao,
      prerequisites: preRequisito,
      trainedSkills,
      powerName: o.poder.nome,
      powerDescription: o.poder.descricao,
      powerPeCost: 0,
      halfInitialSan: Boolean(efeitosPassivos?.metadeSanInicial),
      efeitosPassivos,
    };
  }
);

/* ============================================================================
 * 2. TRILHAS (Extras da Comunidade — Dr. Frankenstein)
 * ============================================================================ */
export const ENTREGA1_TRAILS: TrailDefinition[] = rawEntrega1.trilhas.map(
  (t) => ({
    id: t.id,
    classId: t.classe as AgentClassId,
    name: t.nome,
    source: t.source as ContentSource,
    description:
      t.habilidades[0]?.descricao ??
      `Trilha de ${t.classe} (${t.nome}) — suplemento da comunidade.`,
    abilitiesByNex: t.habilidades.map((h) => ({
      nex: parseMarcoToNumber(h.marco),
      name: h.nome,
      description: h.descricao,
    })),
  })
);

/* ============================================================================
 * 3. PODERES DE CLASSE, GERAIS E PARANORMAIS
 * ============================================================================ */
export const ENTREGA1_CLASS_POWERS: PowerDefinition[] =
  rawEntrega1.poderesClasse.map((p) => ({
    id: p.id,
    name: p.nome,
    category: "classe",
    classId: p.classe as AgentClassId,
    prerequisites: p.preRequisito,
    peCost: 0,
    description: p.descricao,
    source: p.source as ContentSource,
  }));

export const ENTREGA1_GENERAL_POWERS: PowerDefinition[] =
  rawEntrega1.poderesGerais.map((p) => ({
    id: p.id,
    name: p.nome,
    category: "geral",
    prerequisites: p.preRequisito,
    peCost: 0,
    description: p.descricao,
    source: p.source as ContentSource,
  }));

export const ENTREGA1_PARANORMAL_POWERS: PowerDefinition[] =
  rawEntrega1.poderesParanormais.map((p) => ({
    id: p.id,
    name: p.nome,
    category: "paranormal",
    element: parseElement(p.elemento),
    prerequisites: p.preRequisito,
    peCost: 0,
    description: p.efeito,
    affinityDescription: p.afinidade,
    source: p.source as ContentSource,
  }));

/* ============================================================================
 * 4. RITUAIS (16 rituais: 1 Extras + 5 Rituais Superiores + 10 Guia Conf. Vol. I)
 * ============================================================================ */
export const ENTREGA1_RITUALS: AgentRitual[] = rawEntrega1.rituais.map((r) => {
  const circle = r.circulo as 1 | 2 | 3 | 4;
  const basePe = CIRCLE_BASE_PE[circle];
  const discente = "discente" in r ? r.discente : undefined;
  const verdadeiro = "verdadeiro" in r ? r.verdadeiro : undefined;
  const isSuperior = "isSuperior" in r ? Boolean(r.isSuperior) : false;
  const exclusiveTrail =
    "exclusivoTrilha" in r ? r.exclusivoTrilha : undefined;
  const rawSupInfo = "superiorInfo" in r ? r.superiorInfo : undefined;

  const superiorInfo: SuperiorRitualInfo | undefined = rawSupInfo
    ? {
        id: r.id,
        execution: r.execucao,
        conjuracao: rawSupInfo.conjuracao,
        consequencias: rawSupInfo.consequencias,
        efeitoSuperior: r.efeitoPadrao,
        peCost: basePe,
        source: r.source as ContentSource,
      }
    : undefined;

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
    isSuperior,
    superiorInfo,
    exclusiveTrail,
    source: r.source as ContentSource,
  };
});

/* ============================================================================
 * 5. FORMAS SUPERIORES PARA RITUAIS OFICIAIS (4 acoplamentos)
 * ============================================================================ */
export const ENTREGA1_SUPERIOR_FORMS: OfficialSuperiorFormEntry[] =
  rawEntrega1.formasSuperioresRituaisOficiais.map((f) => ({
    id: f.id,
    ritualAlvoNome: f.ritualAlvoNome,
    elemento: parseElement(f.elemento),
    circulo: f.circulo as 1 | 2 | 3 | 4,
    source: f.source as ContentSource,
    execucao: f.execucao,
    efeitoSuperior: f.efeitoSuperior,
  }));

/* ============================================================================
 * 6. ITENS AMALDIÇOADOS (Máscaras Teatrais — 5 itens)
 * ============================================================================ */
export const ENTREGA1_CURSED_ITEMS: InventoryItem[] =
  rawEntrega1.itensAmaldicoados.map((item) => ({
    id: item.id,
    name: item.nome,
    type: "amaldicoado",
    subtype: item.subtipo,
    wearable: Boolean(item.vestivel),
    category: item.categoria as ItemCategory,
    spaces: item.espacos,
    quantity: 1,
    equipped: false,
    element: parseElement(item.elemento),
    description: `${item.subtipo}. ${item.descricao}`,
    source: item.source as ContentSource,
  }));

/* ============================================================================
 * 7. CONDIÇÕES (Guia Confidencial Vol. I — Desorientado)
 * ============================================================================ */
export const ENTREGA1_CONDITIONS: ConditionDefinition[] =
  rawEntrega1.condicoes.map((c) => ({
    id: c.id,
    name: c.nome,
    kind: c.tipo,
    source: c.source as ContentSource,
    description: c.descricao,
  }));

/* ============================================================================
 * 8. REGRAS EXTRAS (Rituais Superiores — Conjuração Complexa)
 * ============================================================================ */
export const ENTREGA1_OPTIONAL_RULES: OptionalRuleDefinition[] =
  rawEntrega1.regrasExtras.map((r) => ({
    id: r.id as OptionalRuleId,
    name: r.nome,
    source: r.source as ContentSource,
    summary: r.descricao,
    mechanicalEffect:
      "Requer Conjuração Complexa (SaH p. 114). Rodadas extras de tentativa: Treinado (+1), Veterano (+2), Expert (+3).",
  }));

/* ============================================================================
 * 9. AMEAÇAS (Guia Confidencial Vol. I — Prematuro)
 * ============================================================================ */
export const ENTREGA1_THREATS: Threat[] = rawEntrega1.ameacas.map((a) => {
  const perc = parseDiceSpec(a.sentidos.percepcao);
  const init = parseDiceSpec(a.sentidos.iniciativa);
  const fort = parseDiceSpec(a.resistenciasTestes.fortitude);
  const ref = parseDiceSpec(a.resistenciasTestes.reflexos);
  const von = parseDiceSpec(a.resistenciasTestes.vontade);

  const sensesNote =
    a.sentidos.especiais.length > 0
      ? `Sentidos especiais: ${a.sentidos.especiais.join(", ")}. `
      : "";

  return {
    id: a.id,
    name: a.nome,
    vd: a.vd,
    element: parseElement(a.elemento),
    secondaryElements: a.elementosSecundarios.map(parseElement),
    size: a.tamanho,
    type: a.tipo,
    threatKind: "Criatura Paranormal",
    pv: a.pv,
    defense: a.defesa,
    displacement: a.deslocamento,
    disturbingPresence: {
      dt: a.presencaPerturbadora.dt,
      damage: a.presencaPerturbadora.dano,
      nexImmunity: a.presencaPerturbadora.imuneNex,
    },
    enigmaOfFear: a.enigmaDeMedo,
    enigmaResolved: false,
    attributes: a.atributos,
    saves: {
      fortitude: fort.testBonus,
      reflexos: ref.testBonus,
      vontade: von.testBonus,
    },
    skills: [
      { name: "Iniciativa", dice: init.diceCount, bonus: init.testBonus },
      { name: "Percepção", dice: perc.diceCount, bonus: perc.testBonus },
      { name: "Fortitude", dice: fort.diceCount, bonus: fort.testBonus },
      { name: "Reflexos", dice: ref.diceCount, bonus: ref.testBonus },
      { name: "Vontade", dice: von.diceCount, bonus: von.testBonus },
    ],
    resistances: a.resistenciasDano,
    vulnerabilities: a.vulnerabilidades,
    attacks: a.ataques.map((atk, idx) => {
      const test = parseDiceSpec(atk.teste);
      const dmg = parseDamageSpec(atk.dano);
      return {
        id: `${a.id}_atk_${idx + 1}`,
        name: atk.nome,
        diceCount: test.diceCount,
        testBonus: test.testBonus,
        damageFormula: dmg.formula,
        damageType: dmg.damageType,
        threatRange: 20,
        critMultiplier: 2,
        notes: [atk.alcance, dmg.notes].filter(Boolean).join(" • ") || undefined,
      };
    }),
    abilities: a.habilidades.map((h, idx) => ({
      id: `${a.id}_ab_${idx + 1}`,
      name: h.nome,
      description: h.descricao,
    })),
    description: `${sensesNote}${a.habilidades[0]?.descricao ?? ""}`.trim(),
    source: a.source as ContentSource,
  };
});

export const ENTREGA1_META = rawEntrega1.meta;
