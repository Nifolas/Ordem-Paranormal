import rawEntrega5 from "./entrega_5_grimorio_do_cataclisma_parte2.json";
import type {
  AgentRitual,
  AllyTemplateId,
  AttributeKey,
  ContentSource,
  InventoryItem,
  ItemCategory,
  ItemCategoryType,
  ModificationDefinition,
  OptionalRuleDefinition,
  OptionalRuleId,
  ParanormalElement,
  PowerDefinition,
  SkillKey,
  Threat,
  ThreatAttack,
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

function parseAddonPe(
  text: string | undefined,
  basePe: number
): number | undefined {
  if (!text) return undefined;
  const m = text.match(/^\(?\s*\+(\d+)\s*PE\s*\)?/i);
  return m ? basePe + parseInt(m[1], 10) : basePe;
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

function mapWeaponRange(
  raw: string | undefined
): "Corpo a Corpo" | "Curto" | "Médio" | "Longo" {
  const n = normalizeText(raw ?? "");
  if (n.includes("longo")) return "Longo";
  if (n.includes("medio")) return "Médio";
  if (n.includes("curto")) return "Curto";
  return "Corpo a Corpo";
}

function mapWeaponSubtype(
  empunhadura: string | undefined,
  municao: string | undefined
): {
  subtype: "Corpo a corpo" | "Disparo" | "Fogo";
  skill: SkillKey;
} {
  const n = normalizeText(empunhadura ?? "");
  if (n.includes("fogo")) {
    return { subtype: "Fogo", skill: "pontaria" };
  }
  if (n.includes("disparo") || n.includes("arremesso") || Boolean(municao)) {
    return { subtype: "Disparo", skill: "pontaria" };
  }
  return { subtype: "Corpo a corpo", skill: "luta" };
}

const MOD_TARGET_LABELS: Record<string, string> = {
  arma_cac: "Arma Corpo a Corpo",
  arma_fogo: "Arma de Fogo",
  municao: "Munição",
  explosivo: "Explosivo",
  protecao: "Proteção",
  arma: "Arma",
  acessorio: "Acessório",
};

/* ============================================================================
 * 1. ARMAS (20 armas — gdc_*)
 * ============================================================================ */
export const ENTREGA5_WEAPONS: InventoryItem[] = rawEntrega5.armas.map((w) => {
  const crit = parseCritSpec(w.critico);
  const municao = "municao" in w && typeof w.municao === "string" ? w.municao : undefined;
  const sub = mapWeaponSubtype(w.empunhadura, municao);
  const primaryDamage = w.dano.split("/")[0].trim();
  const extraHeader = [
    `${w.proficiencia} · ${w.empunhadura}`,
    w.dano.includes("/") ? `Dano versátil: ${w.dano}` : null,
    municao ? `Munição: ${municao}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    id: w.id,
    name: w.nome,
    type: "arma",
    category: w.categoria as ItemCategory,
    spaces: w.espacos,
    quantity: 1,
    equipped: false,
    damageFormula: primaryDamage,
    damageType: w.tipoDano,
    threatRange: crit.threatRange,
    critMultiplier: crit.critMultiplier,
    skill: sub.skill,
    weaponCategory: w.proficiencia as "Simples" | "Tática" | "Pesada",
    weaponSubtype: sub.subtype,
    weaponGrip: w.empunhadura,
    weaponRange: mapWeaponRange(w.alcance),
    description: `${extraHeader}. ${w.descricao}`,
    source: w.source as ContentSource,
  };
});

/* ============================================================================
 * 2. MUNIÇÕES E FLECHAS ESPECIAIS (8 itens — gdc_*)
 * ============================================================================ */
export const ENTREGA5_AMMO: InventoryItem[] = rawEntrega5.municoesEFlechas.map(
  (m) => ({
    id: m.id,
    name: m.nome,
    type: "municao",
    category: m.categoria as ItemCategory,
    spaces: m.espacos,
    quantity: 1,
    equipped: false,
    description: m.descricao,
    source: m.source as ContentSource,
  })
);

/* ============================================================================
 * 3. PROTEÇÕES & ESCUDOS (7 itens — gdc_*)
 * ============================================================================ */
export const ENTREGA5_PROTECTIONS: InventoryItem[] = rawEntrega5.protecoes.map(
  (p) => {
    const rd = "rd" in p && typeof p.rd === "string" ? p.rd : undefined;
    const isShield = p.id.startsWith("gdc_escudo_");
    return {
      id: p.id,
      name: p.nome,
      type: "protecao",
      category: p.categoria as ItemCategory,
      spaces: p.espacos,
      quantity: 1,
      equipped: false,
      defenseBonus: p.defesa,
      rdBonus: parseRdNumber(rd),
      isShield,
      description: p.descricao,
      source: p.source as ContentSource,
    };
  }
);

/* ============================================================================
 * 4. EQUIPAMENTOS GERAIS (39 itens: 10 explosivos, 7 operacionais, 10 paranormais, 12 medicamentos com G.R.)
 * ============================================================================ */
export const ENTREGA5_GENERAL_EQUIPMENT: InventoryItem[] =
  rawEntrega5.equipamentosGerais.map((eq) => {
    const usos =
      "usos" in eq && typeof eq.usos === "number" ? eq.usos : undefined;
    const grauRisco =
      "grauRisco" in eq && typeof eq.grauRisco === "number"
        ? eq.grauRisco
        : undefined;

    return {
      id: eq.id,
      name: eq.nome,
      type: eq.tipo as ItemCategoryType,
      category: eq.categoria as ItemCategory,
      spaces: eq.espacos,
      quantity: 1,
      equipped: false,
      maxUses: usos,
      currentUses: usos,
      riskGrade: grauRisco,
      description: eq.descricao,
      source: eq.source as ContentSource,
    };
  });

export const ENTREGA5_ITEMS: InventoryItem[] = [
  ...ENTREGA5_WEAPONS,
  ...ENTREGA5_AMMO,
  ...ENTREGA5_PROTECTIONS,
  ...ENTREGA5_GENERAL_EQUIPMENT,
];

/* ============================================================================
 * 5. MODIFICAÇÕES (23 modificações — gdc_mod_*)
 * ============================================================================ */
export const ENTREGA5_MODIFICATIONS: ModificationDefinition[] =
  rawEntrega5.modificacoes.map((m) => {
    const targetLabel = MOD_TARGET_LABELS[m.alvo] ?? m.alvo;
    const restricao =
      "restricao" in m && typeof m.restricao === "string"
        ? m.restricao
        : undefined;
    const espacosBonus =
      "espacosBonus" in m && typeof m.espacosBonus === "number"
        ? m.espacosBonus
        : undefined;
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
 * 6. PODERES PARANORMAIS (22 poderes — gdc_pp_*)
 * ============================================================================ */
export const ENTREGA5_PARANORMAL_POWERS: PowerDefinition[] =
  rawEntrega5.poderesParanormais.map((p) => ({
    id: p.id,
    name: p.nome,
    category: "paranormal",
    element: parseElement(p.elemento),
    prerequisites:
      "preRequisito" in p && typeof p.preRequisito === "string"
        ? p.preRequisito
        : undefined,
    peCost: 0,
    description: p.efeito,
    affinityDescription: p.afinidade,
    source: p.source as ContentSource,
  }));

/* ============================================================================
 * 7. RITUAIS (59 rituais — gdc_*)
 * ============================================================================ */
export const ENTREGA5_RITUALS: AgentRitual[] = rawEntrega5.rituais.map((r) => {
  const circle = r.circulo as 1 | 2 | 3 | 4;
  const basePe = CIRCLE_BASE_PE[circle];
  const discente =
    "discente" in r && typeof r.discente === "string" ? r.discente : undefined;
  const verdadeiro =
    "verdadeiro" in r && typeof r.verdadeiro === "string"
      ? r.verdadeiro
      : undefined;
  const exclusiveTrail =
    "exclusivoTrilha" in r && typeof r.exclusivoTrilha === "string"
      ? r.exclusivoTrilha
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
    exclusiveTrail,
    source: r.source as ContentSource,
  };
});

/* ============================================================================
 * 8. PETS COMPANHEIROS (9 animais — gdc_pet_*)
 * ============================================================================ */
export interface CompanionPetEntry {
  id: AllyTemplateId;
  name: string;
  petCategory: "Domesticado" | "Domado" | "Exótico";
  size: string;
  defense: number;
  pv: number;
  displacement: string;
  attributes: Record<AttributeKey, number>;
  attack: string;
  abilityName: string;
  abilityDescription: string;
  source: ContentSource;
}

function splitPetAbility(raw: string): { name: string; description: string } {
  const idx = raw.indexOf(":");
  if (idx > 0 && idx < 45) {
    return {
      name: raw.slice(0, idx).trim(),
      description: raw.slice(idx + 1).trim(),
    };
  }
  return {
    name: "Habilidade do Pet",
    description: raw,
  };
}

export const ENTREGA5_PETS: CompanionPetEntry[] =
  rawEntrega5.petsCompanheiros.map((pet) => {
    const ab = splitPetAbility(pet.habilidade);
    return {
      id: pet.id as AllyTemplateId,
      name: pet.nome,
      petCategory: pet.categoriaPet as "Domesticado" | "Domado" | "Exótico",
      size: pet.tamanho,
      defense: pet.defesa,
      pv: pet.pv,
      displacement: pet.deslocamento,
      attributes: pet.atributos as Record<AttributeKey, number>,
      attack: pet.ataque,
      abilityName: ab.name,
      abilityDescription: ab.description,
      source: pet.source as ContentSource,
    };
  });

/* ============================================================================
 * 9. AMEAÇAS (1 criatura — gdc_demonio_do_caos, VD 60, Energia)
 * ============================================================================ */
export const ENTREGA5_THREATS: Threat[] = rawEntrega5.ameacas.map((a) => {
  const perc = parseDiceSpec(a.sentidos.percepcao);
  const init = parseDiceSpec(a.sentidos.iniciativa);
  const fort = parseDiceSpec(a.resistenciasTestes.fortitude);
  const ref = parseDiceSpec(a.resistenciasTestes.reflexos);
  const von = parseDiceSpec(a.resistenciasTestes.vontade);

  const especiais = Array.isArray(a.sentidos.especiais)
    ? a.sentidos.especiais
    : [];

  const attacks: ThreatAttack[] = a.ataques.map((atk, idx) => {
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
  });

  const resistances = a.imunidades
    ? `Imunidades: ${a.imunidades}. RD: ${a.resistenciasDano}`
    : a.resistenciasDano;

  const sensesNote =
    especiais.length > 0 ? `Sentidos especiais: ${especiais.join(", ")}. ` : "";

  return {
    id: a.id,
    name: a.nome,
    vd: a.vd,
    element: parseElement(a.elemento),
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
    resistances,
    vulnerabilities: a.vulnerabilidades,
    attacks,
    abilities: a.habilidades.map((h, idx) => ({
      id: `${a.id}_ab_${idx + 1}`,
      name: h.nome,
      description: h.descricao,
    })),
    description: `${sensesNote}${a.habilidades[0]?.descricao ?? ""}`.trim(),
    source: a.source as ContentSource,
  };
});

/* ============================================================================
 * 10. BARALHO INFINITO (2d12 — valores 2 a 24)
 * ============================================================================ */
export interface BaralhoInfinitoCard {
  valor: string;
  minVal: number;
  maxVal: number;
  carta: string;
  efeito: string;
}

export const BARALHO_INFINITO_CARDS: BaralhoInfinitoCard[] =
  rawEntrega5.baralhoInfinito.map((entry) => {
    const parts = entry.valor.split("-").map((v) => parseInt(v.trim(), 10));
    const minVal = parts[0] ?? 2;
    const maxVal = parts[1] ?? minVal;
    return {
      valor: entry.valor,
      minVal,
      maxVal,
      carta: entry.carta,
      efeito: entry.efeito,
    };
  });

export function drawBaralhoInfinitoCard(rng: () => number = Math.random): {
  dice: [number, number];
  total: number;
  card: BaralhoInfinitoCard;
} {
  const d1 = Math.min(12, Math.max(1, Math.floor(rng() * 12) + 1));
  const d2 = Math.min(12, Math.max(1, Math.floor(rng() * 12) + 1));
  const total = d1 + d2;
  const matched =
    BARALHO_INFINITO_CARDS.find(
      (c) => total >= c.minVal && total <= c.maxVal
    ) ?? BARALHO_INFINITO_CARDS[BARALHO_INFINITO_CARDS.length - 1];
  return {
    dice: [d1, d2],
    total,
    card: matched,
  };
}

/* ============================================================================
 * 11. REGRAS EXTRAS (9 regras opcionais — gdc_reg_*)
 * ============================================================================ */
export const ENTREGA5_OPTIONAL_RULES: OptionalRuleDefinition[] =
  rawEntrega5.regrasExtras.map((reg) => ({
    id: reg.id as OptionalRuleId,
    name: reg.nome,
    source: reg.source as ContentSource,
    summary: reg.descricao,
    mechanicalEffect: reg.descricao,
  }));

export const ENTREGA5_META = rawEntrega5.meta;
