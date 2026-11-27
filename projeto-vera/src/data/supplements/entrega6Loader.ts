import rawEntrega6Json from "./entrega_6_arquivos_secretos_01_e_02.json";
import type {
  AgentClassId,
  AgentRitual,
  AllyTemplateId,
  ContentSource,
  InventoryItem,
  ItemCategory,
  ItemCategoryType,
  OptionalRuleDefinition,
  OptionalRuleId,
  OriginDefinition,
  ParanormalElement,
  PowerDefinition,
  SkillKey,
  Threat,
  ThreatAttack,
  TrailDefinition,
} from "@/types/ordem";
import type { AllyTemplateDefinition } from "@/data/allies";

/* ----------------------------- Tipos brutos ----------------------------- */
export interface RawOrigem {
  id: string;
  nome: string;
  source: string;
  pacote: string;
  pericias: string[];
  poder: { nome: string; descricao: string };
  efeitosPassivos?: Record<string, number>;
}
export interface RawTrilha {
  id: string;
  nome: string;
  classe: string;
  source: string;
  pacote: string;
  habilidades: { marco: string; nome: string; descricao: string }[];
}
export interface RawPoder {
  id: string;
  nome: string;
  classe?: string;
  elemento?: string;
  source: string;
  pacote: string;
  preRequisito?: string;
  custoPe?: number;
  descricao?: string;
  efeito?: string;
  afinidade?: string;
}
export interface RawRitual {
  id: string;
  nome: string;
  elemento: string;
  circulo: number;
  source: string;
  pacote: string;
  execucao: string;
  alcance: string;
  alvo: string;
  duracao: string;
  resistencia: string;
  efeitoPadrao: string;
  discente?: string;
  verdadeiro?: string;
}
export interface RawEquip {
  id: string;
  nome: string;
  tipo: string;
  subtipo?: string;
  elemento?: string;
  categoria: number;
  espacos: number;
  vestivel?: boolean;
  dano?: string;
  tipoDano?: string;
  critico?: string;
  source: string;
  pacote: string;
  descricao: string;
}
export interface RawAliado {
  id: string;
  nome: string;
  source: string;
  pacote: string;
  bonus: string;
  habilidade: string;
  tipo?: string;
}
export interface RawAmeaca {
  id: string;
  nome: string;
  vd: number;
  elemento: string;
  tipo: string;
  tamanho: string;
  source: string;
  pacote: string;
  presencaPerturbadora?: { dt: number; dano: string; imuneNex?: number };
  sentidos?: { percepcao: string; iniciativa: string; especiais?: string[] };
  defesa: number;
  resistenciasTestes?: { fortitude: string; reflexos: string; vontade: string };
  pv: number;
  resistenciasDano?: string;
  vulnerabilidades?: string;
  imunidades?: string;
  elementosSecundarios?: string[];
  atributos?: Record<"AGI" | "FOR" | "INT" | "PRE" | "VIG", number>;
  deslocamento: string;
  ataques?: { nome: string; alcance: string; teste: string; dano: string }[];
  habilidades?: { nome: string; descricao: string }[];
}
export interface RawRegra {
  id: string;
  nome: string;
  source: string;
  pacote: string;
  descricao: string;
}
export interface RawEntrega6 {
  meta: { entrega: number; titulo: string; source: string; pacotes: string[] };
  origens: RawOrigem[];
  trilhas: RawTrilha[];
  poderesClasse: RawPoder[];
  poderesGerais: RawPoder[];
  poderesParanormais: RawPoder[];
  rituais: RawRitual[];
  equipamentos: RawEquip[];
  aliados: RawAliado[];
  ameacas: RawAmeaca[];
  regrasExtras: RawRegra[];
}

const raw = rawEntrega6Json as unknown as RawEntrega6;

/* ------------------------------- Helpers -------------------------------- */
export const CIRCLE_BASE_PE: Record<1 | 2 | 3 | 4, number> = { 1: 1, 2: 3, 3: 6, 4: 10 };

export function norm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function parseElement(rawEl: string | undefined): ParanormalElement {
  const n = norm(rawEl ?? "");
  if (n.startsWith("variavel") || n.startsWith("intencao")) return "Variável";
  if (n.startsWith("sangue")) return "Sangue";
  if (n.startsWith("morte")) return "Morte";
  if (n.startsWith("conhecimento")) return "Conhecimento";
  if (n.startsWith("energia")) return "Energia";
  if (n.startsWith("medo")) return "Medo";
  return "Realidade";
}

export const SKILL_BY_NAME: Record<string, SkillKey> = {
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

export function parseAddonPe(text: string | undefined, basePe: number) {
  if (!text) return undefined;
  const m = text.match(/^\(?\s*\+(\d+)\s*PE\s*\)?/i);
  return m ? basePe + parseInt(m[1], 10) : basePe;
}

export function parseDiceSpec(spec: string | undefined): {
  diceCount: number;
  testBonus: number;
} {
  const m = (spec ?? "").match(/(\d+)d20\s*([+-]\s*\d+)?/i);
  if (!m) return { diceCount: 2, testBonus: 5 };
  return {
    diceCount: parseInt(m[1], 10),
    testBonus: m[2] ? parseInt(m[2].replace(/\s+/g, ""), 10) : 0,
  };
}

export function parseAttackCrit(spec: string): {
  threatRange: number;
  critMultiplier: number;
} {
  const full = spec.match(/\((\d+)\s*\/\s*x(\d+)\)/i);
  if (full)
    return {
      threatRange: parseInt(full[1], 10),
      critMultiplier: parseInt(full[2], 10),
    };
  const only = spec.match(/\((\d+)\)/);
  const mult = spec.match(/\(x(\d+)\)/i);
  return {
    threatRange: only ? parseInt(only[1], 10) : 20,
    critMultiplier: mult ? parseInt(mult[1], 10) : 2,
  };
}

export function parseDamageSpec(rawDmg: string): { formula: string; type: string } {
  const tokens = rawDmg.match(/\d+d\d+(?:[+-]\d+)?/gi);
  const formula = tokens ? tokens.join("+") : "1d6";
  const type =
    rawDmg
      .replace(/\d+d\d+(?:[+-]\d+)?/gi, "")
      .replace(/\+/g, "/")
      .replace(/\s+/g, " ")
      .replace(/^[\s/]+|[\s/]+$/g, "") || "Físico";
  return { formula, type };
}

/* ============================ 1. ORIGENS (2) ============================ */
export const ENTREGA6_ORIGINS: OriginDefinition[] = raw.origens.map((o) => {
  const trained: SkillKey[] = [];
  const notes: string[] = [];
  for (const p of o.pericias) {
    const key = SKILL_BY_NAME[norm(p)];
    if (key) trained.push(key);
    else notes.push(p);
  }
  return {
    id: o.id,
    name: o.nome,
    source: o.source as ContentSource,
    description: `Arquivos Secretos (${o.pacote}).`,
    trainedSkills: trained,
    trainedSkillNotes: notes.length ? notes : undefined,
    powerName: o.poder.nome,
    powerDescription: o.poder.descricao,
  };
});

/* ============================ 2. TRILHAS (1) ============================ */
export const ENTREGA6_TRAILS: TrailDefinition[] = raw.trilhas.map((t) => ({
  id: t.id,
  classId: t.classe as AgentClassId,
  name: t.nome,
  source: t.source as ContentSource,
  description: t.habilidades[0]?.descricao ?? `Trilha ${t.nome}.`,
  abilitiesByNex: t.habilidades.map((h) => ({
    nex: parseInt(h.marco, 10),
    name: h.nome,
    description: h.descricao,
  })),
}));

/* ======================= 3. PODERES (7 + 10 + 7) ======================== */
export const ENTREGA6_CLASS_POWERS: PowerDefinition[] = raw.poderesClasse.map(
  (p) => ({
    id: p.id,
    name: p.nome,
    category: "classe",
    classId: p.classe as AgentClassId,
    prerequisites: p.preRequisito,
    peCost: p.custoPe ?? 0,
    description: p.descricao ?? "",
    source: p.source as ContentSource,
  })
);

export const ENTREGA6_GENERAL_POWERS: PowerDefinition[] = raw.poderesGerais.map(
  (p) => ({
    id: p.id,
    name: p.nome,
    category: "geral",
    prerequisites: p.preRequisito,
    peCost: p.custoPe ?? 0,
    description: p.descricao ?? "",
    source: p.source as ContentSource,
  })
);

export const ENTREGA6_PARANORMAL_POWERS: PowerDefinition[] =
  raw.poderesParanormais.map((p) => ({
    id: p.id,
    name: p.nome,
    category: "paranormal",
    element: parseElement(p.elemento),
    prerequisites: p.preRequisito,
    peCost: p.custoPe ?? 0,
    description: p.efeito ?? p.descricao ?? "",
    affinityDescription: p.afinidade,
    source: p.source as ContentSource,
  }));

/* ============================ 4. RITUAIS (4) ============================ */
export const ENTREGA6_RITUALS: AgentRitual[] = raw.rituais.map((r) => {
  const circle = r.circulo as 1 | 2 | 3 | 4;
  const basePe = CIRCLE_BASE_PE[circle];
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
    description: r.efeitoPadrao,
    discente: r.discente,
    discenteCost: parseAddonPe(r.discente, basePe),
    verdadeira: r.verdadeiro,
    verdadeiraCost: parseAddonPe(r.verdadeiro, basePe),
    source: r.source as ContentSource,
  };
});

/* ========================= 5. EQUIPAMENTOS (14) ========================= */
export const ENTREGA6_EQUIPMENT: InventoryItem[] = raw.equipamentos.map((e) => {
  const crit = e.critico?.match(/(\d+)\s*\/\s*x(\d+)/i);
  const hasDamage = Boolean(e.dano);
  const prefix = e.subtipo ? `${e.subtipo}. ` : "";
  return {
    id: e.id,
    name: e.nome,
    type: e.tipo as ItemCategoryType,
    subtype: e.subtipo,
    wearable: e.vestivel,
    category: e.categoria as ItemCategory,
    spaces: e.espacos,
    quantity: 1,
    equipped: false,
    element: e.elemento ? parseElement(e.elemento) : undefined,
    ...(hasDamage
      ? {
          damageFormula: e.dano,
          damageType: e.tipoDano ?? "Impacto",
          threatRange: crit ? parseInt(crit[1], 10) : 20,
          critMultiplier: crit ? parseInt(crit[2], 10) : 2,
          skill: "luta" as const,
          weaponSubtype: "Corpo a corpo" as const,
          weaponRange: "Corpo a Corpo" as const,
        }
      : {}),
    description: `${prefix}${e.descricao}`,
    source: e.source as ContentSource,
  };
});

/* ========================== 6. ALIADOS (11) ============================= */
export function splitAllyAbility(text: string): { name: string; cost: number; description: string } {
  const m = text.match(/^(.+?)\s*\((?:[^)]*?)(\d+)\s*PE\)\s*:\s*([\s\S]+)$/);
  if (m) {
    return { name: m[1].trim(), cost: parseInt(m[2], 10), description: m[3].trim() };
  }
  const idx = text.indexOf(":");
  if (idx > 0 && idx < 60) {
    const head = text.slice(0, idx).trim();
    const cost = head.match(/(\d+)\s*PE/);
    return {
      name: head.replace(/\s*\(.*?\)\s*/g, "").trim(),
      cost: cost ? parseInt(cost[1], 10) : 0,
      description: text.slice(idx + 1).trim(),
    };
  }
  return { name: "Habilidade do Aliado", cost: 0, description: text };
}

export interface Entrega6AllyEntry {
  id: string;
  name: string;
  pacote: string;
  bonus: string;
  ability: string;
  source: ContentSource;
}

export const ENTREGA6_ALLIES: Entrega6AllyEntry[] = raw.aliados.map((a) => ({
  id: a.id,
  name: a.nome,
  pacote: a.pacote,
  bonus: a.bonus,
  ability: a.habilidade,
  source: a.source as ContentSource,
}));

export function mapAsAlly(a: RawAliado): AllyTemplateDefinition {
    const ab = splitAllyAbility(a.habilidade);
    const tpl: AllyTemplateDefinition = {
      id: a.id as AllyTemplateId,
      name: a.nome,
      kind: a.tipo === "Pet" ? "pet" : "aliado",
      sourceLabel: `Arquivos Secretos ${a.pacote.replace("AS ", "")}`,
      source: a.source as ContentSource,
      bonusSummary: a.bonus,
      abilityName: ab.name,
      abilityPeCost: ab.cost,
      abilityDescription: ab.description,
    };
    // Bônus mecânicos simples reconhecidos automaticamente
    const bonusNorm = norm(a.bonus);
    if (/\+1d20 em testes de ataque/.test(bonusNorm)) tpl.attackDiceBonus = 1;
    const dice = bonusNorm.match(/\+1d20 em ([a-z\s,e]+?)(?:\.|$| e \+)/);
    if (dice) {
      const found: Partial<Record<SkillKey, number>> = {};
      for (const word of dice[1].split(/\s+e\s+|,\s*/)) {
        const key = SKILL_BY_NAME[word.trim()];
        if (key) found[key] = 1;
      }
      if (Object.keys(found).length) tpl.skillDiceBonuses = found;
    }
    const trained = bonusNorm.match(/^treinado em ([a-z]+)/);
    if (trained && SKILL_BY_NAME[trained[1]]) {
      tpl.trainedSkills = [SKILL_BY_NAME[trained[1]]];
    }
    return tpl;
}

export const ENTREGA6_ALLY_TEMPLATES: AllyTemplateDefinition[] = raw.aliados.map(mapAsAlly);

/* ========================== 7. AMEAÇAS (10) ============================= */
export function mapAsThreat(a: RawAmeaca): Threat {
  const perc = parseDiceSpec(a.sentidos?.percepcao);
  const init = parseDiceSpec(a.sentidos?.iniciativa);
  const hasSaves = Boolean(a.resistenciasTestes);
  const fort = parseDiceSpec(a.resistenciasTestes?.fortitude);
  const ref = parseDiceSpec(a.resistenciasTestes?.reflexos);
  const von = parseDiceSpec(a.resistenciasTestes?.vontade);
  const isCreature = a.tipo !== "Pessoa";

  const attacks: ThreatAttack[] = (a.ataques ?? []).map((atk, idx) => {
    const test = parseDiceSpec(atk.teste);
    const crit = parseAttackCrit(atk.teste);
    const dmg = parseDamageSpec(atk.dano);
    return {
      id: `${a.id}_atk_${idx + 1}`,
      name: atk.nome,
      diceCount: test.diceCount,
      testBonus: test.testBonus,
      damageFormula: dmg.formula,
      damageType: dmg.type,
      threatRange: crit.threatRange,
      critMultiplier: crit.critMultiplier,
      notes: `${atk.alcance} • ${atk.teste} • ${atk.dano}`,
    };
  });

  const skills = [
    ...(a.sentidos
      ? [
          { name: "Iniciativa", dice: init.diceCount, bonus: init.testBonus },
          { name: "Percepção", dice: perc.diceCount, bonus: perc.testBonus },
        ]
      : []),
    ...(hasSaves
      ? [
          { name: "Fortitude", dice: fort.diceCount, bonus: fort.testBonus },
          { name: "Reflexos", dice: ref.diceCount, bonus: ref.testBonus },
          { name: "Vontade", dice: von.diceCount, bonus: von.testBonus },
        ]
      : []),
  ];

  const abilities = (a.habilidades ?? []).map((h, idx) => ({
    id: `${a.id}_ab_${idx + 1}`,
    name: h.nome,
    description: h.descricao,
  }));

  return {
    id: a.id,
    name: a.nome,
    vd: a.vd,
    element: parseElement(a.elemento),
    size: a.tamanho,
    type: a.tipo,
    threatKind: isCreature ? "Criatura Paranormal" : "Ameaça da Realidade",
    pv: a.pv,
    defense: a.defesa,
    displacement: a.deslocamento,
    disturbingPresence: {
      dt: a.presencaPerturbadora?.dt ?? 0,
      damage: a.presencaPerturbadora?.dano ?? "—",
      nexImmunity: a.presencaPerturbadora?.imuneNex,
    },
    enigmaResolved: false,
    attributes: a.atributos ?? { AGI: 1, FOR: 1, INT: 1, PRE: 1, VIG: 1 },
    saves: {
      fortitude: fort.testBonus,
      reflexos: ref.testBonus,
      vontade: von.testBonus,
    },
    skills,
    resistances:
      [a.imunidades ? "Imunidades: ${a.imunidades}" : null, a.resistenciasDano ? "RD: ${a.resistenciasDano}" : null].filter(Boolean).join(". ") || "—",
    vulnerabilities: a.vulnerabilidades,
    secondaryElements: a.elementosSecundarios?.map(parseElement),
    attacks,
    abilities,
    description:
      (a.sentidos?.especiais?.length
        ? `Sentidos especiais: ${a.sentidos.especiais.join(", ")}. `
        : "") + (abilities[0]?.description ?? ""),
    source: a.source as ContentSource,
  };
}

export const ENTREGA6_THREATS: Threat[] = raw.ameacas.map(mapAsThreat);

/* ======================= 8. REGRAS EXTRAS (5) =========================== */
export const ENTREGA6_OPTIONAL_RULES: OptionalRuleDefinition[] =
  raw.regrasExtras.map((r) => ({
    id: r.id as OptionalRuleId,
    name: r.nome,
    source: r.source as ContentSource,
    summary: r.descricao,
    mechanicalEffect: r.descricao,
  }));

export const ENTREGA6_META = raw.meta;
