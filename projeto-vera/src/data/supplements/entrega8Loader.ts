import rawEntrega8Json from "./entrega_8_arquivos_secretos_05_e_06.json";
import type {
  AgentClassId,
  AgentRitual,
  AllyTemplateId,
  ContentSource,
  CurseDefinition,
  InventoryItem,
  ItemCategory,
  ItemCategoryType,
  ModificationDefinition,
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

const CIRCLE_BASE_PE: Record<1 | 2 | 3 | 4, number> = {
  1: 1,
  2: 3,
  3: 6,
  4: 10,
};

function norm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseElement(rawEl: string | undefined): ParanormalElement {
  const n = norm(rawEl ?? "");
  if (
    n.startsWith("variavel") ||
    n.startsWith("intencao") ||
    n.startsWith("transmissao")
  ) {
    return "Variável";
  }
  if (n.startsWith("sangue")) return "Sangue";
  if (n.startsWith("morte")) return "Morte";
  if (n.startsWith("conhecimento")) return "Conhecimento";
  if (n.startsWith("energia")) return "Energia";
  if (n.startsWith("medo")) return "Medo";
  return "Realidade";
}

const SKILL_BY_NAME: Record<string, SkillKey> = {
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

const MOD_TARGET_LABELS: Record<string, string> = {
  medicamento: "Medicamento",
  explosivo: "Explosivo",
  arma_cac: "Arma Corpo a Corpo",
  arma_fogo: "Arma de Fogo",
  municao: "Munição",
  protecao: "Proteção",
  arma: "Arma",
  acessorio: "Acessório",
};

function parseAddonPe(
  text: string | undefined,
  basePe: number
): number | undefined {
  if (!text) return undefined;
  const m = text.match(/^\(?\s*\+(\d+)\s*PE\s*\)?/i);
  return m ? basePe + parseInt(m[1], 10) : basePe;
}

function parseDiceSpec(spec: string | undefined): {
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

function parseAttackCrit(spec: string): {
  threatRange: number;
  critMultiplier: number;
} {
  const full = spec.match(/\((\d+)\s*\/\s*x(\d+)\)/i);
  if (full) {
    return {
      threatRange: parseInt(full[1], 10),
      critMultiplier: parseInt(full[2], 10),
    };
  }
  const only = spec.match(/\((\d+)\)/);
  const mult = spec.match(/\(x(\d+)\)/i);
  return {
    threatRange: only ? parseInt(only[1], 10) : 20,
    critMultiplier: mult ? parseInt(mult[1], 10) : 2,
  };
}

function parseDamageSpec(rawDmg: string): { formula: string; type: string } {
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

/* ============================ 1. ORIGENS (5) ============================ */
export const ENTREGA8_ORIGINS: OriginDefinition[] =
  rawEntrega8Json.origens.map((o) => {
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
export const ENTREGA8_TRAILS: TrailDefinition[] = rawEntrega8Json.trilhas.map(
  (t) => ({
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
  })
);

/* ======================= 3. PODERES (13 + 3 + 10) ======================= */
export const ENTREGA8_CLASS_POWERS: PowerDefinition[] =
  rawEntrega8Json.poderesClasse.map((p) => ({
    id: p.id,
    name: p.nome,
    category: "classe",
    classId: p.classe as AgentClassId,
    prerequisites: "preRequisito" in p ? p.preRequisito : undefined,
    peCost: "custoPe" in p && typeof p.custoPe === "number" ? p.custoPe : 0,
    description: p.descricao,
    source: p.source as ContentSource,
  }));

export const ENTREGA8_GENERAL_POWERS: PowerDefinition[] =
  rawEntrega8Json.poderesGerais.map((p) => ({
    id: p.id,
    name: p.nome,
    category: "geral",
    prerequisites: "preRequisito" in p ? p.preRequisito : undefined,
    peCost: 0,
    description: p.descricao,
    source: p.source as ContentSource,
  }));

export const ENTREGA8_PARANORMAL_POWERS: PowerDefinition[] =
  rawEntrega8Json.poderesParanormais.map((p) => ({
    id: p.id,
    name: p.nome,
    category: "paranormal",
    element: parseElement(p.elemento),
    prerequisites: "preRequisito" in p ? p.preRequisito : undefined,
    peCost: 0,
    description: p.efeito,
    affinityDescription: "afinidade" in p ? p.afinidade : undefined,
    source: p.source as ContentSource,
  }));

/* ============================ 4. RITUAIS (1) ============================ */
export const ENTREGA8_RITUALS: AgentRitual[] = rawEntrega8Json.rituais.map(
  (r) => {
    const circle = r.circulo as 1 | 2 | 3 | 4;
    const basePe = CIRCLE_BASE_PE[circle];
    const discente = "discente" in r ? r.discente : undefined;
    const verdadeiro = "verdadeiro" in r ? r.verdadeiro : undefined;
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
      discente,
      discenteCost: parseAddonPe(discente, basePe),
      verdadeira: verdadeiro,
      verdadeiraCost: parseAddonPe(verdadeiro, basePe),
      source: r.source as ContentSource,
    };
  }
);

/* ========================= 5. EQUIPAMENTOS (9) ========================== */
export const ENTREGA8_EQUIPMENT: InventoryItem[] =
  rawEntrega8Json.equipamentos.map((e) => {
    const subtipo = "subtipo" in e ? e.subtipo : undefined;
    const vestivel = "vestivel" in e ? Boolean(e.vestivel) : undefined;
    const elemento =
      "elemento" in e && typeof e.elemento === "string"
        ? parseElement(e.elemento)
        : undefined;
    const isWeapon = e.tipo === "arma";
    const prefix = subtipo ? `${subtipo}. ` : "";

    return {
      id: e.id,
      name: e.nome,
      type: e.tipo as ItemCategoryType,
      subtype: subtipo,
      wearable: vestivel,
      category: e.categoria as ItemCategory,
      spaces: e.espacos,
      quantity: 1,
      equipped: false,
      element: elemento,
      ...(isWeapon
        ? {
            damageFormula: "4d6",
            damageType: "Frio",
            threatRange: 20,
            critMultiplier: 2,
            skill: "pontaria" as const,
            weaponCategory: "Pesada" as const,
            weaponSubtype: "Fogo" as const,
            weaponGrip: "Duas Mãos",
            weaponRange: "Curto" as const,
          }
        : {}),
      description: `${prefix}${e.descricao}`,
      source: e.source as ContentSource,
    };
  });

/* ============ 6. MODIFICAÇÕES & MALDIÇÕES DE MEDICAMENTOS (3) =========== */
export const ENTREGA8_MODIFICATIONS: ModificationDefinition[] =
  rawEntrega8Json.modificacoesEMaldicoesMedicamentos
    .filter((entry) => "categoriaBonus" in entry)
    .map((m) => ({
      id: m.id,
      name: m.nome,
      appliesTo: MOD_TARGET_LABELS[m.alvo] ?? m.alvo,
      categoryIncrease:
        "categoriaBonus" in m && typeof m.categoriaBonus === "number"
          ? m.categoriaBonus
          : 1,
      description: m.descricao,
      source: m.source as ContentSource,
    }));

export const ENTREGA8_CURSES: CurseDefinition[] =
  rawEntrega8Json.modificacoesEMaldicoesMedicamentos
    .filter((entry) => "elemento" in entry)
    .map((c) => ({
      id: c.id,
      name: c.nome,
      element: parseElement("elemento" in c ? c.elemento : "Morte"),
      appliesTo: MOD_TARGET_LABELS[c.alvo] ?? c.alvo,
      description: c.descricao,
      source: c.source as ContentSource,
    }));

/* ====================== 7. DOENÇAS E VENENOS (8) ======================== */
export interface DiseaseOrPoisonEntry {
  id: string;
  name: string;
  kind: string;
  resistance: string;
  stagesOrEffect: string;
  pacote: string;
  source: ContentSource;
}

export const ENTREGA8_DISEASES_AND_POISONS: DiseaseOrPoisonEntry[] =
  rawEntrega8Json.doencasEVenenos.map((d) => ({
    id: d.id,
    name: d.nome,
    kind: d.tipo,
    resistance: d.resistencia,
    stagesOrEffect:
      "estagios" in d && typeof d.estagios === "string"
        ? d.estagios
        : "efeito" in d && typeof d.efeito === "string"
        ? d.efeito
        : "",
    pacote: d.pacote,
    source: d.source as ContentSource,
  }));

/* =========================== 8. ALIADOS (3) ============================= */
function splitAllyAbility(text: string): {
  name: string;
  cost: number;
  description: string;
} {
  const m = text.match(/^(.+?)\s*\((?:[^)]*?)(\d+)\s*PE\)\s*:\s*([\s\S]+)$/);
  if (m) {
    return {
      name: m[1].trim(),
      cost: parseInt(m[2], 10),
      description: m[3].trim(),
    };
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

export const ENTREGA8_ALLY_TEMPLATES: AllyTemplateDefinition[] =
  rawEntrega8Json.aliados.map((a) => {
    const ab = splitAllyAbility(a.habilidade);
    return {
      id: a.id as AllyTemplateId,
      name: a.nome,
      kind: "aliado",
      sourceLabel: `Arquivos Secretos ${a.pacote.replace("AS ", "")}`,
      source: a.source as ContentSource,
      bonusSummary: a.bonus,
      abilityName: ab.name,
      abilityPeCost: ab.cost,
      abilityDescription: ab.description,
    };
  });

/* =========================== 9. AMEAÇAS (15) ============================ */
export const ENTREGA8_THREATS: Threat[] = rawEntrega8Json.ameacas.map((a) => {
  const isCreature = a.tipo !== "Pessoa";
  const attacks: ThreatAttack[] = (
    "ataques" in a && Array.isArray(a.ataques) ? a.ataques : []
  ).map((atk, idx) => {
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

  const abilities = (
    "habilidades" in a && Array.isArray(a.habilidades) ? a.habilidades : []
  ).map((h, idx) => ({
    id: `${a.id}_ab_${idx + 1}`,
    name: h.nome,
    description: h.descricao,
  }));

  const pp =
    "presencaPerturbadora" in a && a.presencaPerturbadora
      ? a.presencaPerturbadora
      : undefined;
  const secondaryElements =
    "elementosSecundarios" in a && Array.isArray(a.elementosSecundarios)
      ? a.elementosSecundarios.map(parseElement)
      : undefined;

  const imunidades =
    "imunidades" in a && typeof a.imunidades === "string"
      ? a.imunidades
      : undefined;
  const rdRaw =
    "resistenciasDano" in a && typeof a.resistenciasDano === "string"
      ? a.resistenciasDano
      : undefined;
  const resistenciasDano =
    imunidades && rdRaw
      ? `Imunidades: ${imunidades}. RD: ${rdRaw}`
      : rdRaw ?? (imunidades ? `Imunidades: ${imunidades}` : "—");
  const vulnerabilidades =
    "vulnerabilidades" in a && typeof a.vulnerabilidades === "string"
      ? a.vulnerabilidades
      : undefined;

  return {
    id: a.id,
    name: a.nome,
    vd: a.vd,
    element: parseElement(a.elemento),
    secondaryElements,
    size: a.tamanho,
    type: a.elemento === "Transmissão" ? `${a.tipo} (Alheio / Transmissão)` : a.tipo,
    threatKind: isCreature ? "Criatura Paranormal" : "Ameaça da Realidade",
    pv: a.pv,
    defense: a.defesa,
    displacement: a.deslocamento,
    disturbingPresence: {
      dt: pp?.dt ?? 0,
      damage: pp?.dano ?? "—",
      nexImmunity: pp?.imuneNex,
    },
    enigmaResolved: false,
    attributes: { AGI: 2, FOR: 2, INT: 2, PRE: 2, VIG: 2 },
    saves: {
      fortitude: 5,
      reflexos: 5,
      vontade: 5,
    },
    skills: [],
    resistances: resistenciasDano,
    vulnerabilities: vulnerabilidades,
    attacks,
    abilities,
    description: abilities[0]?.description ?? "",
    source: a.source as ContentSource,
  };
});

/* ======================== 10. REGRAS EXTRAS (4) ========================= */
export const ENTREGA8_OPTIONAL_RULES: OptionalRuleDefinition[] =
  rawEntrega8Json.regrasExtras.map((r) => ({
    id: r.id as OptionalRuleId,
    name: r.nome,
    source: r.source as ContentSource,
    summary: r.descricao,
    mechanicalEffect: r.descricao,
  }));

export const ENTREGA8_META = rawEntrega8Json.meta;
