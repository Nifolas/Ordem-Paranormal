import rawEntrega9Json from "./entrega_9_arquivos_secretos_07_e_09.json";
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

function parseCritSpec(crit: string | undefined): {
  threatRange: number;
  critMultiplier: number;
} {
  if (!crit) return { threatRange: 20, critMultiplier: 2 };
  const m = crit.match(/(\d+)\s*\/\s*[x×](\d+)/i);
  if (!m) return { threatRange: 20, critMultiplier: 2 };
  return {
    threatRange: parseInt(m[1], 10),
    critMultiplier: parseInt(m[2], 10),
  };
}

function parseRdNumber(rd: string | undefined): number | undefined {
  if (!rd) return undefined;
  const match = rd.match(/\d+/);
  return match ? parseInt(match[0], 10) : undefined;
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

function mapWeaponRange(
  raw: string | undefined
): "Corpo a Corpo" | "Curto" | "Médio" | "Longo" {
  const n = norm(raw ?? "");
  if (n.includes("longo")) return "Longo";
  if (n.includes("medio")) return "Médio";
  if (n.includes("curto")) return "Curto";
  return "Corpo a Corpo";
}

/* ============================ 1. ORIGENS (4) ============================ */
export const ENTREGA9_ORIGINS: OriginDefinition[] =
  rawEntrega9Json.origens.map((o) => {
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
      efeitosPassivos:
        o.id === "as9_treinado_hell_hunters"
          ? { pvFixo: 2, pvPor10Nex: 1 }
          : undefined,
    };
  });

/* ============================ 2. TRILHAS (4) ============================ */
export const ENTREGA9_TRAILS: TrailDefinition[] = rawEntrega9Json.trilhas.map(
  (t) => {
    const especial =
      "especial" in t && typeof t.especial === "string"
        ? t.especial
        : undefined;
    const baseDesc = t.habilidades[0]?.descricao ?? `Trilha ${t.nome}.`;
    return {
      id: t.id,
      classId: t.classe as AgentClassId,
      name: t.nome,
      source: t.source as ContentSource,
      description: especial ? `${especial} ${baseDesc}` : baseDesc,
      abilitiesByNex: t.habilidades.map((h) => ({
        nex: parseInt(h.marco, 10),
        name: h.nome,
        description: h.descricao,
      })),
    };
  }
);

/* ========================= 3. PODERES DE CLASSE (3) ===================== */
export const ENTREGA9_CLASS_POWERS: PowerDefinition[] =
  rawEntrega9Json.poderesClasse.map((p) => ({
    id: p.id,
    name: p.nome,
    category: "classe",
    classId: p.classe as AgentClassId,
    prerequisites: "preRequisito" in p ? p.preRequisito : undefined,
    peCost: "custoPe" in p && typeof p.custoPe === "number" ? p.custoPe : 0,
    description: p.descricao,
    source: p.source as ContentSource,
  }));

/* ============================ 4. RITUAIS (1) ============================ */
export const ENTREGA9_RITUALS: AgentRitual[] = rawEntrega9Json.rituais.map(
  (r) => {
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
      source: r.source as ContentSource,
    };
  }
);

/* ========================= 5. EQUIPAMENTOS (15) ========================= */
export const ENTREGA9_EQUIPMENT: InventoryItem[] =
  rawEntrega9Json.equipamentos.map((e) => {
    const subtipo = "subtipo" in e ? e.subtipo : undefined;
    const vestivel = "vestivel" in e ? Boolean(e.vestivel) : undefined;
    const elemento =
      "elemento" in e && typeof e.elemento === "string"
        ? parseElement(e.elemento)
        : undefined;
    const dano = "dano" in e && typeof e.dano === "string" ? e.dano : undefined;
    const tipoDano =
      "tipoDano" in e && typeof e.tipoDano === "string"
        ? e.tipoDano
        : undefined;
    const critico =
      "critico" in e && typeof e.critico === "string" ? e.critico : undefined;
    const alcance =
      "alcance" in e && typeof e.alcance === "string" ? e.alcance : undefined;
    const empunhadura =
      "empunhadura" in e && typeof e.empunhadura === "string"
        ? e.empunhadura
        : undefined;
    const proficiencia =
      "proficiencia" in e && typeof e.proficiencia === "string"
        ? (e.proficiencia as "Simples" | "Tática" | "Pesada")
        : undefined;
    const defesa =
      "defesa" in e && typeof e.defesa === "number" ? e.defesa : undefined;
    const rd = "rd" in e && typeof e.rd === "string" ? e.rd : undefined;
    const usos = "usos" in e && typeof e.usos === "number" ? e.usos : undefined;

    const crit = parseCritSpec(critico);
    const isWeapon = e.tipo === "arma" || Boolean(dano);
    const isRanged =
      norm(empunhadura ?? "").includes("fogo") ||
      norm(empunhadura ?? "").includes("disparo");
    const isShield = e.id === "as9_escudo_balistico_led";
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
      defenseBonus: defesa,
      rdBonus: parseRdNumber(rd),
      isShield,
      maxUses: usos,
      currentUses: usos,
      ...(isWeapon
        ? {
            damageFormula: dano ?? "6d6",
            damageType: tipoDano ?? "Impacto",
            threatRange: crit.threatRange,
            critMultiplier: crit.critMultiplier,
            skill: (isRanged ? "pontaria" : "luta") as SkillKey,
            weaponCategory: proficiencia ?? "Tática",
            weaponSubtype: (norm(empunhadura ?? "").includes("fogo")
              ? "Fogo"
              : isRanged
              ? "Disparo"
              : "Corpo a corpo") as "Corpo a corpo" | "Disparo" | "Fogo",
            weaponGrip: empunhadura ?? subtipo,
            weaponRange: mapWeaponRange(alcance),
          }
        : {}),
      description: `${prefix}${e.descricao}`,
      source: e.source as ContentSource,
    };
  });

/* ================== 6. ALIADOS HELL HUNTERS (8) & DRONES (6) ============= */
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

export const ENTREGA9_HELL_HUNTERS_ALLY_TEMPLATES: AllyTemplateDefinition[] =
  rawEntrega9Json.aliados.map((a) => {
    const ab = splitAllyAbility(a.habilidade);
    const tpl: AllyTemplateDefinition = {
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

    if (a.id === "as9_aliado_jason") tpl.skillDiceBonuses = { fortitude: 1 };
    if (a.id === "as9_aliado_karen") {
      tpl.skillDiceBonuses = { pontaria: 1 };
      tpl.abilityRollFormula = "3d6";
    }
    if (a.id === "as9_aliado_troy") tpl.skillDiceBonuses = { luta: 1 };
    if (a.id === "as9_aliado_roy") {
      tpl.trainedSkills = ["medicina"];
      tpl.skillDiceBonuses = { medicina: 1 };
      tpl.abilityRollFormula = "3d10";
    }
    if (a.id === "as9_aliado_stella") tpl.skillDiceBonuses = { pilotagem: 1 };
    if (a.id === "as9_aliado_chloe") tpl.skillDiceBonuses = { investigacao: 1 };

    return tpl;
  });

export const ENTREGA9_DRONE_ALLY_TEMPLATES: AllyTemplateDefinition[] = [
  {
    id: "as9_drone_atirador",
    name: "Aliado Drone — Atirador",
    kind: "aliado",
    sourceLabel: "Arquivos Secretos #9",
    source: "arquivos_secretos",
    bonusSummary: "+1d20 em testes de ataque.",
    attackDiceBonus: 1,
    abilityName: "Disparo Sincronizado",
    abilityPeCost: 2,
    abilityDescription:
      "Gasta 2 PE ao acertar um ataque para causar +2d8 pontos de dano balístico.",
    abilityRollFormula: "2d8",
  },
  {
    id: "as9_drone_espiao",
    name: "Aliado Drone — Espião",
    kind: "aliado",
    sourceLabel: "Arquivos Secretos #9",
    source: "arquivos_secretos",
    bonusSummary:
      "+1d20 em Investigação e Percepção e concede Visão no Escuro pela câmera.",
    skillDiceBonuses: { investigacao: 1, percepcao: 1 },
    abilityName: "Varredura Térmica & Rádio",
    abilityPeCost: 2,
    abilityDescription:
      "Gasta 2 PE para ativar visão térmica e interceptação/transmissão de rádio na cena.",
  },
  {
    id: "as9_drone_inteligente",
    name: "Aliado Drone — Inteligente",
    kind: "aliado",
    sourceLabel: "Arquivos Secretos #9",
    source: "arquivos_secretos",
    bonusSummary:
      "Operado por comando de voz sem ocupar as mãos do operador.",
    abilityName: "Braços Articulados",
    abilityPeCost: 2,
    abilityDescription:
      "Gasta 2 PE para manipular objetos à distância e carregar até 5 espaços de itens.",
  },
  {
    id: "as9_drone_medico",
    name: "Aliado Drone — Médico",
    kind: "aliado",
    sourceLabel: "Arquivos Secretos #9",
    source: "arquivos_secretos",
    bonusSummary: "Treinado em Medicina (ou +1d20 se já treinado).",
    trainedSkills: ["medicina"],
    skillDiceBonuses: { medicina: 1 },
    abilityName: "Socorro Remoto",
    abilityPeCost: 2,
    abilityDescription:
      "Gasta 2 PE para curar 2d8+2 PV em um ser adjacente ao drone.",
    abilityRollFormula: "2d8+2",
  },
  {
    id: "as9_drone_protetor",
    name: "Aliado Drone — Protetor",
    kind: "aliado",
    sourceLabel: "Arquivos Secretos #9",
    source: "arquivos_secretos",
    bonusSummary: "+5 na Defesa enquanto o drone escolta você.",
    abilityName: "Interceptação Defensiva",
    abilityPeCost: 2,
    abilityDescription:
      "Gasta 2 PE (reação) para receber +5 em um teste de resistência.",
  },
  {
    id: "as9_drone_utilitario",
    name: "Aliado Drone — Utilitário",
    kind: "aliado",
    sourceLabel: "Arquivos Secretos #9",
    source: "arquivos_secretos",
    bonusSummary:
      "Suporte tático versátil: transporte leve, iluminação direcional e auxílio operacional em campo.",
    abilityName: "Suporte Utilitário",
    abilityPeCost: 2,
    abilityDescription:
      "Gasta 2 PE para prestar auxílio automático (+2) ou entregar/recolher equipamento em alcance médio.",
  },
];

export const ENTREGA9_ALLY_TEMPLATES: AllyTemplateDefinition[] = [
  ...ENTREGA9_HELL_HUNTERS_ALLY_TEMPLATES,
  ...ENTREGA9_DRONE_ALLY_TEMPLATES,
];

/* =========================== 7. AMEAÇAS (15) ============================ */
export const ENTREGA9_THREATS: Threat[] = rawEntrega9Json.ameacas.map((a) => {
  const isCreature = a.tipo === "Criatura";
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
  const resistenciasDano =
    "resistenciasDano" in a && typeof a.resistenciasDano === "string"
      ? a.resistenciasDano
      : "—";
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
    type: a.tipo,
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
    attributes: { AGI: 3, FOR: 3, INT: 2, PRE: 2, VIG: 3 },
    saves: {
      fortitude: 10,
      reflexos: 10,
      vontade: 10,
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

/* ======================== 8. REGRAS EXTRAS (2) ========================== */
export const ENTREGA9_OPTIONAL_RULES: OptionalRuleDefinition[] =
  rawEntrega9Json.regrasExtras.map((r) => ({
    id: r.id as OptionalRuleId,
    name: r.nome,
    source: r.source as ContentSource,
    summary: r.descricao,
    mechanicalEffect: r.descricao,
  }));

export const ENTREGA9_META = rawEntrega9Json.meta;
