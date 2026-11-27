import rawEntrega3 from "./entrega_3_misterios_do_outro_lado_parte2.json";
import { BASE_THREATS } from "@/data/threats";
import type {
  ContentSource,
  InventoryItem,
  ItemCategory,
  ItemCategoryType,
  ParanormalElement,
  RelicDefinition,
  Threat,
  ThreatAttack,
} from "@/types/ordem";

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

function parseDiceSpec(spec: string): { diceCount: number; testBonus: number } {
  const m = spec.match(/(\d+)d20\s*([+-]\s*\d+)?/i);
  if (!m) return { diceCount: 2, testBonus: 5 };
  return {
    diceCount: parseInt(m[1], 10),
    testBonus: m[2] ? parseInt(m[2].replace(/\s+/g, ""), 10) : 0,
  };
}

function parseSkillEntry(entry: string): {
  name: string;
  dice: number;
  bonus: number;
} {
  const m = entry.match(/^(.+?)\s+(\d+)d20\s*([+-]\s*\d+)?$/i);
  if (!m) return { name: entry, dice: 2, bonus: 5 };
  return {
    name: m[1].trim(),
    dice: parseInt(m[2], 10),
    bonus: m[3] ? parseInt(m[3].replace(/\s+/g, ""), 10) : 0,
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

function extractWeaponCategory(
  subtipo: string | undefined
): "Simples" | "Tática" | "Pesada" | undefined {
  if (!subtipo) return undefined;
  const n = normalizeText(subtipo);
  if (n.includes("pesada")) return "Pesada";
  if (n.includes("tatica")) return "Tática";
  if (n.includes("simples")) return "Simples";
  return "Tática";
}

function extractWeaponGrip(subtipo: string | undefined): string | undefined {
  if (!subtipo) return undefined;
  const n = normalizeText(subtipo);
  if (n.includes("uma/duas")) return "Uma ou Duas Mãos";
  if (n.includes("duas maos")) return "Duas Mãos";
  if (n.includes("uma mao")) return "Uma Mão";
  if (n.includes("leve")) return "Leve";
  return undefined;
}

/* ============================================================================
 * 1. ITENS AMALDIÇOADOS & RECOMPENSAS PARANORMAIS (58 itens — mol_*)
 * ============================================================================ */
export const ENTREGA3_ITEMS: InventoryItem[] =
  rawEntrega3.itensAmaldicoadosERecompensas.map((raw) => {
    const tipo = raw.tipo as ItemCategoryType;
    const element =
      "elemento" in raw && typeof raw.elemento === "string"
        ? parseElement(raw.elemento)
        : undefined;
    const subtipo =
      "subtipo" in raw && typeof raw.subtipo === "string"
        ? raw.subtipo
        : undefined;
    const origemCriatura =
      "origemCriatura" in raw && typeof raw.origemCriatura === "string"
        ? raw.origemCriatura
        : undefined;
    const dano =
      "dano" in raw && typeof raw.dano === "string" ? raw.dano : undefined;
    const tipoDano =
      "tipoDano" in raw && typeof raw.tipoDano === "string"
        ? raw.tipoDano
        : undefined;
    const critico =
      "critico" in raw && typeof raw.critico === "string"
        ? raw.critico
        : undefined;
    const rd = "rd" in raw && typeof raw.rd === "string" ? raw.rd : undefined;

    const crit = parseCritSpec(critico);
    const isWeapon = tipo === "arma";
    const normalizedDamage = dano ? dano.split("/")[0].trim() : undefined;

    const headerParts: string[] = [];
    if (origemCriatura) headerParts.push(`Origem: ${origemCriatura}`);
    if (subtipo) headerParts.push(subtipo);
    const prefix = headerParts.length > 0 ? `${headerParts.join(" · ")}. ` : "";

    return {
      id: raw.id,
      name: raw.nome,
      type: tipo,
      subtype: subtipo,
      wearable: subtipo
        ? normalizeText(subtipo).includes("vestimenta")
        : undefined,
      category: raw.categoria as ItemCategory,
      spaces: raw.espacos,
      quantity: 1,
      equipped: false,
      element,
      rdBonus: parseRdNumber(rd),
      ...(isWeapon
        ? {
            damageFormula: normalizedDamage ?? "1d6",
            damageType: tipoDano ?? "Corte",
            threatRange: crit.threatRange,
            critMultiplier: crit.critMultiplier,
            skill: "luta" as const,
            weaponCategory: extractWeaponCategory(subtipo),
            weaponSubtype: "Corpo a corpo" as const,
            weaponGrip: extractWeaponGrip(subtipo),
            weaponRange: "Corpo a Corpo" as const,
          }
        : {}),
      description: `${prefix}${raw.descricao}`,
      source: raw.source as ContentSource,
    };
  });

/* ============================================================================
 * 2. RELÍQUIAS DA CALAMIDADE (4 registros — mol_rel_*)
 * ============================================================================ */
export const ENTREGA3_RELICS: RelicDefinition[] = rawEntrega3.reliquias.map(
  (rel) => ({
    id: rel.id,
    name: rel.nome,
    element: parseElement(rel.elemento),
    source: rel.source as ContentSource,
    objectEffect: rel.efeitoObjeto,
    bearerRelation: rel.relacaoPortador,
    ally: {
      general: rel.aliado.geral,
      bonus: rel.aliado.bonus,
      ability: rel.aliado.habilidade,
    },
    optionalAbilities: rel.habilidadesOpcionais.map((h) => ({
      name: h.nome,
      description: h.descricao,
    })),
  })
);

/* ============================================================================
 * 3. AMEAÇAS INÉDITAS (7 criaturas — mol_*)
 * ============================================================================ */
export const ENTREGA3_NEW_THREATS: Threat[] = rawEntrega3.ameacasIneditas.map(
  (a) => {
    const perc = parseDiceSpec(a.sentidos.percepcao);
    const init = parseDiceSpec(a.sentidos.iniciativa);
    const fort = parseDiceSpec(a.resistenciasTestes.fortitude);
    const ref = parseDiceSpec(a.resistenciasTestes.reflexos);
    const von = parseDiceSpec(a.resistenciasTestes.vontade);

    const especiais =
      "especiais" in a.sentidos && Array.isArray(a.sentidos.especiais)
        ? a.sentidos.especiais
        : [];
    const periciasExtra =
      "pericias" in a && Array.isArray(a.pericias)
        ? a.pericias.map(parseSkillEntry)
        : [];
    const ataques =
      "ataques" in a && Array.isArray(a.ataques)
        ? a.ataques.map((atk, idx): ThreatAttack => {
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
              notes:
                [atk.alcance, dmg.notes].filter(Boolean).join(" • ") ||
                undefined,
            };
          })
        : [];

    const imunidades =
      "imunidades" in a && typeof a.imunidades === "string"
        ? a.imunidades
        : undefined;
    const resistances = imunidades
      ? `Imunidades: ${imunidades}. RD: ${a.resistenciasDano}`
      : a.resistenciasDano;

    const imuneNex =
      "imuneNex" in a.presencaPerturbadora &&
      typeof a.presencaPerturbadora.imuneNex === "number"
        ? a.presencaPerturbadora.imuneNex
        : undefined;

    const sensesNote =
      especiais.length > 0 ? `Sentidos especiais: ${especiais.join(", ")}. ` : "";

    return {
      id: a.id,
      name: a.nome,
      vd: a.vd,
      element: parseElement(a.elemento),
      secondaryElements:
        "elementosSecundarios" in a && Array.isArray(a.elementosSecundarios)
          ? a.elementosSecundarios.map(parseElement)
          : undefined,
      size: a.tamanho,
      type: a.tipo,
      threatKind: "Criatura Paranormal",
      pv: a.pv,
      defense: a.defesa,
      displacement: a.deslocamento,
      disturbingPresence: {
        dt: a.presencaPerturbadora.dt,
        damage: a.presencaPerturbadora.dano,
        nexImmunity: imuneNex,
      },
      enigmaOfFear:
        "enigmaDeMedo" in a && typeof a.enigmaDeMedo === "string"
          ? a.enigmaDeMedo
          : undefined,
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
        ...periciasExtra,
      ],
      resistances,
      vulnerabilities: a.vulnerabilidades,
      attacks: ataques,
      abilities: a.habilidades.map((h, idx) => ({
        id: `${a.id}_ab_${idx + 1}`,
        name: h.nome,
        description: h.descricao,
      })),
      description: `${sensesNote}${a.habilidades[0]?.descricao ?? ""}`.trim(),
      source: a.source as ContentSource,
    };
  }
);

/* ============================================================================
 * 4. VARIANTES DE CRIATURAS (44 variantes — mol_var_*)
 * ============================================================================ */
const BASE_THREAT_BY_NORM_NAME = new Map<string, Threat>(
  BASE_THREATS.map((t) => [normalizeText(t.name), t])
);

function parseVariantAbility(raw: string, id: string) {
  const idx = raw.indexOf(":");
  if (idx > 0 && idx < 70) {
    return {
      id,
      name: raw.slice(0, idx).trim(),
      description: raw.slice(idx + 1).trim(),
    };
  }
  return {
    id,
    name: "Habilidade de Variante",
    description: raw,
  };
}

function estimateStatsByVd(vd: number, element: ParanormalElement) {
  const isReality = element === "Realidade";
  const pv = Math.max(20, Math.round(vd * (isReality ? 1.4 : 1.8)));
  const defense = Math.min(55, 14 + Math.round(vd / 12));
  const save = Math.max(5, Math.round(vd / 14) * 5);
  const attr = Math.max(1, Math.min(5, Math.round(vd / 75) + 1));
  const ppDt = isReality ? 0 : Math.min(42, 14 + Math.round(vd / 14));
  const ppDice = Math.max(2, Math.min(8, Math.round(vd / 45) + 1));
  return {
    pv,
    defense,
    save,
    attr,
    ppDt,
    ppDamage: isReality ? "0" : `${ppDice}d6 mental`,
  };
}

function extractOverrideNumber(text: string, regex: RegExp): number | null {
  const m = text.match(regex);
  return m ? parseInt(m[1], 10) : null;
}

export const ENTREGA3_VARIANT_THREATS: Threat[] =
  rawEntrega3.variantesCriaturas.map((v) => {
    const element = parseElement(v.elemento);
    const base = BASE_THREAT_BY_NORM_NAME.get(normalizeText(v.base));
    const est = estimateStatsByVd(v.vd, element);

    const pvOverride = extractOverrideNumber(v.alteracoes, /(\d+)\s*PV/i);
    const defOverride = extractOverrideNumber(v.alteracoes, /Defesa\s*(\d+)/i);
    const deslMatch = v.alteracoes.match(/Desl\.?\s*([\d.,]+m)/i);
    const sizeOverride = /Enorme/i.test(v.alteracoes)
      ? "Enorme"
      : /Grande/i.test(v.alteracoes)
      ? "Grande"
      : /M[eé]dio/i.test(v.alteracoes)
      ? "Médio"
      : undefined;

    const enigmaMatch = v.alteracoes.match(/Enigma de Medo[:\s]+([^.]+)/i);

    const isReality = element === "Realidade";

    return {
      id: v.id,
      name: v.nome,
      vd: v.vd,
      element,
      size: sizeOverride ?? base?.size ?? "Médio",
      type: isReality ? "Ameaça da Realidade (Variante)" : "Criatura (Variante)",
      threatKind: isReality ? "Ameaça da Realidade" : "Criatura Paranormal",
      pv: pvOverride ?? base?.pv ?? est.pv,
      defense: defOverride ?? base?.defense ?? est.defense,
      displacement: deslMatch?.[1] ?? base?.displacement ?? "9m",
      disturbingPresence: base?.disturbingPresence ?? {
        dt: est.ppDt,
        damage: est.ppDamage,
      },
      enigmaOfFear: enigmaMatch?.[1]?.trim() ?? base?.enigmaOfFear,
      enigmaResolved: false,
      attributes: base?.attributes ?? {
        AGI: est.attr,
        FOR: est.attr,
        INT: isReality ? 2 : 1,
        PRE: est.attr,
        VIG: est.attr,
      },
      saves: base?.saves ?? {
        fortitude: est.save,
        reflexos: est.save,
        vontade: est.save,
      },
      skills: base?.skills ?? [
        { name: "Iniciativa", dice: est.attr, bonus: est.save },
        { name: "Percepção", dice: est.attr, bonus: est.save },
      ],
      resistances: base?.resistances ?? `Consulte criatura base (${v.base})`,
      vulnerabilities: base?.vulnerabilities,
      attacks:
        base?.attacks.map((atk, idx) => ({
          ...atk,
          id: `${v.id}_atk_${idx + 1}`,
        })) ?? [],
      abilities: v.habilidades.map((rawAb, idx) =>
        parseVariantAbility(rawAb, `${v.id}_ab_${idx + 1}`)
      ),
      description: `Variante de ${v.base}. Alterações: ${v.alteracoes}`,
      isVariant: true,
      baseCreatureName: v.base,
      variantAlterations: v.alteracoes,
      source: v.source as ContentSource,
    };
  });

export const ENTREGA3_THREATS: Threat[] = [
  ...ENTREGA3_NEW_THREATS,
  ...ENTREGA3_VARIANT_THREATS,
];

export const ENTREGA3_META = rawEntrega3.meta;
