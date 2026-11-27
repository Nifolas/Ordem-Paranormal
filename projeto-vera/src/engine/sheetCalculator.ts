import type {
  Agent,
  AgentClassId,
  AppliedCurse,
  AttributeKey,
  BonusSource,
  InterludeDish,
  ItemCategory,
  ItemCategoryType,
  InventoryItem,
  OptionalRuleId,
  OrganizationId,
  OriginPassiveEffects,
  ParanormalElement,
  Patente,
  RestCondition,
  SkillKey,
  TrainingDegree,
} from "@/types/ordem";
import { getOriginById } from "@/data/origins";

export type RngFn = () => number;

export const NEX_STEPS = [
  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99,
] as const;

export const SURVIVOR_STAGES = [1, 2, 3, 4, 5] as const;

export const TRAINING_LABELS: Record<TrainingDegree, string> = {
  0: "Destreinado",
  5: "Treinado",
  10: "Veterano",
  15: "Expert",
};

/**
 * Official Ordem Paranormal v1.2 + Sobrevivendo ao Horror progression constants.
 */
export const CLASS_PROGRESSION: Record<
  AgentClassId,
  {
    initialPv: number;
    pvPerLevel: number;
    initialPe: number;
    pePerLevel: number;
    initialSan: number;
    sanPerLevel: number;
    initialPd: number;
    pdPerLevel: number;
    trainingDegreeBase: number;
  }
> = {
  combatente: {
    initialPv: 20,
    pvPerLevel: 4,
    initialPe: 2,
    pePerLevel: 2,
    initialSan: 12,
    sanPerLevel: 3,
    initialPd: 6,
    pdPerLevel: 3,
    trainingDegreeBase: 3,
  },
  especialista: {
    initialPv: 16,
    pvPerLevel: 3,
    initialPe: 3,
    pePerLevel: 3,
    initialSan: 16,
    sanPerLevel: 4,
    initialPd: 8,
    pdPerLevel: 4,
    trainingDegreeBase: 5,
  },
  ocultista: {
    initialPv: 12,
    pvPerLevel: 2,
    initialPe: 4,
    pePerLevel: 4,
    initialSan: 20,
    sanPerLevel: 5,
    initialPd: 10,
    pdPerLevel: 5,
    trainingDegreeBase: 3,
  },
  sobrevivente: {
    initialPv: 8,
    pvPerLevel: 2,
    initialPe: 2,
    pePerLevel: 1,
    initialSan: 8,
    sanPerLevel: 2,
    initialPd: 4,
    pdPerLevel: 2,
    trainingDegreeBase: 1,
  },
  // Grimório do Cataclisma v0.3 (suplemento da comunidade)
  // Devoto: PV (14+VIG)+k(2+VIG) | PE (3+PRE)+k(3+PRE) | SAN 18+4k
  devoto: {
    initialPv: 14,
    pvPerLevel: 2,
    initialPe: 3,
    pePerLevel: 3,
    initialSan: 18,
    sanPerLevel: 4,
    initialPd: 8,
    pdPerLevel: 4,
    trainingDegreeBase: 4,
  },
  // Predador: PV (18+VIG)+k(4+VIG) | PE (2+PRE)+k(3+PRE) | SAN 14+3k
  predador: {
    initialPv: 18,
    pvPerLevel: 4,
    initialPe: 2,
    pePerLevel: 3,
    initialSan: 14,
    sanPerLevel: 3,
    initialPd: 6,
    pdPerLevel: 3,
    trainingDegreeBase: 3,
  },
};

export const PATENTE_CATEGORY_LIMITS: Record<
  Patente,
  Record<1 | 2 | 3 | 4, number>
> = {
  Recruta: { 1: 2, 2: 0, 3: 0, 4: 0 },
  Operador: { 1: 3, 2: 1, 3: 0, 4: 0 },
  "Agente Especial": { 1: 3, 2: 2, 3: 1, 4: 0 },
  "Oficial de Operações": { 1: 3, 2: 3, 3: 2, 4: 1 },
  "Agente de Elite": { 1: 3, 2: 3, 3: 3, 4: 2 },
};

export const PATENTE_PD_LIMITS: Record<Patente, number> = {
  Recruta: 1,
  Operador: 3,
  "Agente Especial": 6,
  "Oficial de Operações": 10,
  "Agente de Elite": 15,
};

export const PATENTE_DETAILS: Record<
  Patente,
  {
    minPrestige: number;
    credit: "Baixo" | "Médio" | "Alto" | "Ilimitado";
    categoryLimits: Record<1 | 2 | 3 | 4, number>;
    pdLimitByPatent: number;
  }
> = {
  Recruta: {
    minPrestige: 0,
    credit: "Baixo",
    categoryLimits: { 1: 2, 2: 0, 3: 0, 4: 0 },
    pdLimitByPatent: 1,
  },
  Operador: {
    minPrestige: 20,
    credit: "Médio",
    categoryLimits: { 1: 3, 2: 1, 3: 0, 4: 0 },
    pdLimitByPatent: 3,
  },
  "Agente Especial": {
    minPrestige: 50,
    credit: "Médio",
    categoryLimits: { 1: 3, 2: 2, 3: 1, 4: 0 },
    pdLimitByPatent: 6,
  },
  "Oficial de Operações": {
    minPrestige: 100,
    credit: "Alto",
    categoryLimits: { 1: 3, 2: 3, 3: 2, 4: 1 },
    pdLimitByPatent: 10,
  },
  "Agente de Elite": {
    minPrestige: 200,
    credit: "Ilimitado",
    categoryLimits: { 1: 3, 2: 3, 3: 3, 4: 2 },
    pdLimitByPatent: 15,
  },
};

export const RITUAL_CIRCLE_BASE_PE: Record<1 | 2 | 3 | 4, number> = {
  1: 1,
  2: 3,
  3: 6,
  4: 10,
};

export function calculateRitualPeCost(params: {
  circle: 1 | 2 | 3 | 4;
  version: "Normal" | "Discente" | "Verdadeira" | "Superior";
  basePeOverride?: number;
  discenteCost?: number;
  verdadeiraCost?: number;
  superiorCost?: number;
}): number {
  const base = params.basePeOverride ?? RITUAL_CIRCLE_BASE_PE[params.circle];
  if (params.version === "Discente") {
    return params.discenteCost ?? base + 2;
  }
  if (params.version === "Superior") {
    return params.superiorCost ?? params.verdadeiraCost ?? base + 5;
  }
  if (params.version === "Verdadeira") {
    return params.verdadeiraCost ?? base + 5;
  }
  return base;
}

/* ============================================================================
 * ORGANIZAÇÕES DA REALIDADE (Mistérios do Outro Lado)
 * ============================================================================ */

function normalizeOrgKey(
  organization?: OrganizationId
): "ordo_realitas" | "hell_hunters" | "famiglia_leone" | "obscurite" | "ordo_calamitas" {
  if (!organization) return "ordo_realitas";
  const stripped = organization.replace(/^mol_org_/, "");
  if (
    stripped === "hell_hunters" ||
    stripped === "famiglia_leone" ||
    stripped === "obscurite" ||
    stripped === "ordo_calamitas"
  ) {
    return stripped;
  }
  return "ordo_realitas";
}

/** Ajuste de categoria de item imposto pela organização do agente. */
export function getOrganizationCategoryDelta(
  item: Pick<InventoryItem, "type" | "name" | "element">,
  organization?: OrganizationId
): number {
  const org = normalizeOrgKey(organization);
  if (org === "ordo_realitas") return 0;
  const cat = normalizeItemCategoryType(item);
  const isParanormal = cat === "paranormal" || cat === "amaldicoado";
  if (org === "hell_hunters" && cat === "arma") return -1;
  if (org === "famiglia_leone" && isParanormal) return 1;
  if (org === "obscurite" && isParanormal) return -1;
  return 0;
}

/** Hell Hunters — Arsenal de Qualidade: +3 de dano com armas; +5 a partir de Oficial de Operações. */
export function getOrganizationWeaponDamageBonus(
  organization: OrganizationId | undefined,
  patente: Patente
): number {
  if (normalizeOrgKey(organization) !== "hell_hunters") return 0;
  const high = patente === "Oficial de Operações" || patente === "Agente de Elite";
  return high ? 5 : 3;
}

/** Ordo Calamitas — Guerreiro da Calamidade: Transcender custa apenas 2 SAN do nível. */
export function getTranscenderSanPenaltyPerCount(
  organization: OrganizationId | undefined
): number | undefined {
  return normalizeOrgKey(organization) === "ordo_calamitas" ? 2 : undefined;
}

/**
 * Opposing Paranormal Element Pairs for Curses on the same item:
 * Sangue <-> Morte and Conhecimento <-> Energia. Medo has no opposing pair.
 */
export const ELEMENT_OPPRESSES: Partial<
  Record<ParanormalElement, ParanormalElement>
> = {
  Sangue: "Morte",
  Morte: "Sangue",
  Conhecimento: "Energia",
  Energia: "Conhecimento",
};

export function areElementsOpposing(
  a: ParanormalElement,
  b: ParanormalElement
): boolean {
  if (a === "Medo" || b === "Medo" || a === b) return false;
  return ELEMENT_OPPRESSES[a] === b || ELEMENT_OPPRESSES[b] === a;
}

/**
 * Validates whether a new curse element can be added to an item already carrying existingCurses.
 */
export function canAddCurseToItem(
  existingCurses: AppliedCurse[] | undefined,
  newElement: ParanormalElement
): { allowed: boolean; conflictingElement?: ParanormalElement } {
  if (!existingCurses || existingCurses.length === 0) return { allowed: true };
  for (const curse of existingCurses) {
    if (areElementsOpposing(curse.element, newElement)) {
      return { allowed: false, conflictingElement: curse.element };
    }
  }
  return { allowed: true };
}

/**
 * Computes item final category:
 * Base + (mods * 1) + (curses > 0 ? 2 + (curses - 1) : 0) - categoryReduction
 */
export function calculateItemFinalCategory(
  item: InventoryItem,
  organization?: OrganizationId
): ItemCategory {
  const modCount = item.modifications?.length ?? 0;
  const curseCount = item.curses?.length ?? 0;
  const curseCategoryAdd = curseCount > 0 ? 2 + (curseCount - 1) : 0;
  const reduction = item.categoryReduction ?? 0;
  const orgDelta = getOrganizationCategoryDelta(item, organization);
  const raw =
    item.category + modCount + curseCategoryAdd - reduction + orgDelta;
  return Math.max(0, Math.min(4, raw)) as ItemCategory;
}

/**
 * Converts NEX (5..99) or Level (1..20) or Sobrevivente Stage (1..5) into progression index `n`.
 */
export function getProgressionLevel(
  classId: AgentClassId,
  nex: number,
  stage = 1,
  options?: {
    separateNexAndLevel?: boolean;
    level?: number;
  }
): number {
  if (classId === "sobrevivente") {
    return Math.max(1, Math.min(5, Math.floor(stage)));
  }
  if (options?.separateNexAndLevel && options.level !== undefined) {
    return Math.max(1, Math.min(20, Math.floor(options.level)));
  }
  if (nex >= 99) return 20;
  return Math.max(1, Math.min(19, Math.floor(nex / 5)));
}

/**
 * Computes PE (or PD) spend limit per turn.
 * - Sobrevivente: always 1.
 * - Optional rule `evolucao_por_patentes`: 1 / 3 / 6 / 10 / 15 by Patente.
 * - Standard: equal to progression index n (1..20).
 */
export function calculatePeLimit(
  classId: AgentClassId,
  nex: number,
  stage = 1,
  options?: {
    patente?: Patente;
    optionalRules?: OptionalRuleId[];
    level?: number;
  }
): number {
  if (classId === "sobrevivente") {
    return 1;
  }
  const rules = options?.optionalRules ?? [];
  if (rules.includes("evolucao_por_patentes") && options?.patente) {
    return PATENTE_PD_LIMITS[options.patente];
  }
  return getProgressionLevel(classId, nex, stage, {
    separateNexAndLevel: rules.includes("nex_e_experiencia"),
    level: options?.level,
  });
}

/**
 * Pure vitals calculation for PV, PE, SAN, PD, and PE/PD spend limit.
 * Strictly implements Ordem Paranormal v1.2 + Sobrevivendo ao Horror formulas:
 * - Sobrevivente: PV = (8+VIG)+(stage-1)*2, PE = (2+PRE)+(stage-1)*1, SAN = 8+(stage-1)*2, PD = (4+PRE)+(stage-1)*2
 * - Standard classes: PV = (initPv+VIG)+k*(pvPerLvl+VIG), PE = (initPe+PRE)+k*(pePerLvl+PRE), SAN = initSan+k*sanPerLvl, PD = (initPd+PRE)+k*(pdPerLvl+PRE)
 * - Transcender: each Transcender does NOT gain sanPerLevel (subtracts `transcenderCount * sanPerLevel`).
 * - Cultista Arrependido: starts with half initial SAN (subtracts `Math.floor(initialSan / 2)`).
 * - Permanent SAN loss: subtracted from max SAN.
 */
export function calculateVitals(params: {
  classId: AgentClassId;
  nex: number;
  stage?: number;
  level?: number;
  vig: number;
  pre: number;
  patente?: Patente;
  optionalRules?: OptionalRuleId[];
  transcenderCount?: number;
  halfInitialSan?: boolean;
  permanentSanLoss?: number;
  /** Poder Vitalidade Sofrida (AS #3): Combatente com PV inicial 24 + VIG e +6 + VIG por NEX. */
  vitalidadeSofrida?: boolean;
  /** Ordo Calamitas: penalidade fixa de SAN por Transcender (em vez de zerar o ganho do nível). */
  transcenderSanPenaltyPerCount?: number;
}): {
  maxPv: number;
  maxSan: number;
  maxPe: number;
  maxPd: number;
  peLimit: number;
  level: number;
} {
  const {
    classId,
    nex,
    stage = 1,
    level: explicitLevel,
    vig,
    pre,
    patente,
    optionalRules = [],
    transcenderCount = 0,
    halfInitialSan = false,
    permanentSanLoss = 0,
    vitalidadeSofrida = false,
    transcenderSanPenaltyPerCount,
  } = params;

  const prog = CLASS_PROGRESSION[classId];
  const separateLevel = optionalRules.includes("nex_e_experiencia");
  const level = getProgressionLevel(classId, nex, stage, {
    separateNexAndLevel: separateLevel,
    level: explicitLevel,
  });
  const k = Math.max(0, level - 1);

  let maxPv: number;
  let maxPe: number;
  let maxSan: number;
  let maxPd: number;

  if (classId === "sobrevivente") {
    // Sobrevivendo ao Horror official Sobrevivente formulas (Estágios 1–5)
    maxPv = Math.max(1, prog.initialPv + vig + k * prog.pvPerLevel);
    maxPe = Math.max(1, prog.initialPe + pre + k * prog.pePerLevel);
    maxSan = Math.max(1, prog.initialSan + k * prog.sanPerLevel);
    maxPd = Math.max(1, prog.initialPd + pre + k * prog.pdPerLevel);
  } else {
    const pvGainPerLevel = Math.max(1, prog.pvPerLevel + vig);
    const peGainPerLevel = Math.max(1, prog.pePerLevel + pre);
    const pdGainPerLevel = Math.max(1, prog.pdPerLevel + pre);

    if (vitalidadeSofrida && classId === "combatente") {
      maxPv = Math.max(1, 24 + vig + k * Math.max(1, 6 + vig));
    } else {
      maxPv = Math.max(1, prog.initialPv + vig + k * pvGainPerLevel);
    }
    maxPe = Math.max(1, prog.initialPe + pre + k * peGainPerLevel);
    maxPd = Math.max(1, prog.initialPd + pre + k * pdGainPerLevel);

    const rawSan = prog.initialSan + k * prog.sanPerLevel;
    const cultistPenalty = halfInitialSan ? Math.floor(prog.initialSan / 2) : 0;
    const transcenderPenalty =
      Math.max(0, transcenderCount) *
      (transcenderSanPenaltyPerCount !== undefined
        ? Math.min(transcenderSanPenaltyPerCount, prog.sanPerLevel)
        : prog.sanPerLevel);
    maxSan = Math.max(
      1,
      rawSan - cultistPenalty - transcenderPenalty - Math.max(0, permanentSanLoss)
    );
  }

  const peLimit = calculatePeLimit(classId, nex, stage, {
    patente,
    optionalRules,
    level: explicitLevel,
  });

  return { maxPv, maxSan, maxPe, maxPd, peLimit, level };
}

/**
 * Counts how many Transcender instances an agent has (explicit counter + abilities flagged isTranscender).
 */
export function getAgentTranscenderCount(agent: Agent): number {
  const fromAbilities = agent.abilities.filter(
    (a) =>
      a.isTranscender ||
      a.name.trim().toLowerCase().startsWith("transcender")
  ).length;
  return Math.max(agent.transcenderCount ?? 0, fromAbilities);
}

/**
 * Resolves normalized trail ID (supports both underscore and hyphen legacy IDs).
 */
export function normalizeCatalogId(id: string | null | undefined): string {
  return (id ?? "").replace(/-/g, "_");
}

/**
 * Computes effective attributes including trail passives (e.g. Bibliotecário 99% +1 INT).
 */
export function getAgentEffectiveAttributes(
  agent: Agent
): Record<AttributeKey, number> {
  const attrs = { ...agent.attributes };
  const trail = normalizeCatalogId(agent.trilhaId);
  if (
    agent.classId === "especialista" &&
    trail === "bibliotecario" &&
    agent.nex >= 99
  ) {
    attrs.INT += 1;
  }
  return attrs;
}

/**
 * Computes extra carry spaces from trail passives:
 * - Técnico (NEX 10%+): +INT spaces
 * - Muambeiro (NEX 10%+): +5 spaces
 */
export function getTrailCarryBonus(agent: Agent): number {
  const trail = normalizeCatalogId(agent.trilhaId);
  if (agent.classId !== "especialista" || agent.nex < 10) return 0;
  const effAttrs = getAgentEffectiveAttributes(agent);
  if (trail === "tecnico") return effAttrs.INT;
  if (trail === "muambeiro") return 5;
  if (trail === "mol_armeiro") {
    const tatica = agent.skills?.tatica;
    return (tatica?.training ?? 0) + (tatica?.bonus ?? 0);
  }
  return 0;
}

/**
 * Computes automatic Origin + Trail passive skill bonuses and dice penalties.
 */
export function getPassiveSkillModifiers(
  agent: Agent,
  skillKey: SkillKey
): { flatBonus: number; diceModifier: number } {
  let flatBonus = 0;
  let diceModifier = 0;

  const origin = getOriginById(agent.originId);
  const eff: OriginPassiveEffects | undefined = origin?.efeitosPassivos;
  if (eff?.periciaBonus?.[skillKey]) {
    flatBonus += eff.periciaBonus[skillKey] ?? 0;
  }
  if (eff?.penalidadeDados?.[skillKey]) {
    diceModifier += eff.penalidadeDados[skillKey] ?? 0;
  }

  const trail = normalizeCatalogId(agent.trilhaId);
  if (
    skillKey === "iniciativa" &&
    agent.classId === "combatente" &&
    trail === "operacoes_especiais" &&
    agent.nex >= 10
  ) {
    flatBonus += 5;
  }

  return { flatBonus, diceModifier };
}

/**
 * Computes effective Max PV/SAN/PE/PD respecting manual overrides, Transcender,
 * Origin passives (Cultista Arrependido, Desgarrado, Vítima, Universitário, Mergulhador),
 * and Trail passives (Tropa de Choque Casca Grossa, Bibliotecário 99%, Durão Estágio 2/3).
 */
export function hasVitalidadeSofrida(agent: Agent): boolean {
  if (agent.classId !== "combatente") return false;
  return (agent.abilities ?? []).some(
    (a) =>
      a.id === "as3_vitalidade_sofrida" ||
      a.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() === "vitalidade sofrida"
  );
}

export function getAgentEffectiveVitals(agent: Agent) {
  const origin = getOriginById(agent.originId);
  const eff = origin?.efeitosPassivos;
  const originIdNorm = normalizeCatalogId(agent.originId);
  const trail = normalizeCatalogId(agent.trilhaId);
  const halfInitialSan =
    Boolean(eff?.metadeSanInicial) || originIdNorm === "cultista_arrependido";
  const transcenderCount = getAgentTranscenderCount(agent);
  const effAttrs = getAgentEffectiveAttributes(agent);

  const auto = calculateVitals({
    classId: agent.classId,
    nex: agent.nex,
    stage: agent.stage,
    level: agent.level,
    vig: effAttrs.VIG,
    pre: effAttrs.PRE,
    patente: agent.patente,
    optionalRules: agent.optionalRules,
    transcenderCount,
    halfInitialSan,
    permanentSanLoss: agent.permanentSanLoss ?? 0,
    vitalidadeSofrida: hasVitalidadeSofrida(agent),
    transcenderSanPenaltyPerCount: getTranscenderSanPenaltyPerCount(
      agent.organization
    ),
  });

  // Origin passives
  const prog = CLASS_PROGRESSION[agent.classId];
  const halfPvPenalty = eff?.metadePvInicial
    ? Math.floor(prog.initialPv / 2)
    : 0;
  const halfPePenalty = eff?.metadePeInicial
    ? Math.floor(prog.initialPe / 2)
    : 0;

  let bonusPv = (eff?.pvFixo ?? 0) - halfPvPenalty;
  let bonusSan = 0;
  let bonusPe = -halfPePenalty;
  let bonusPeLimit = eff?.limitePeBonus ?? 0;

  if (agent.classId !== "sobrevivente") {
    const isHellHuntersOrigin =
      originIdNorm === "treinado_hell_hunters" ||
      originIdNorm === "as9_treinado_hell_hunters";

    if (isHellHuntersOrigin) {
      // Undo generic pvFixo/pvPor10Nex from eff so we can apply the exact branch
      bonusPv -= eff?.pvFixo ?? 0;
      const pontariaTr = agent.skills?.pontaria?.training ?? 0;
      const reflexosTr = agent.skills?.reflexos?.training ?? 0;
      const lutaTr = agent.skills?.luta?.training ?? 0;
      const fortitudeTr = agent.skills?.fortitude?.training ?? 0;
      const choseRangedBranch =
        pontariaTr > 0 &&
        reflexosTr > 0 &&
        !(lutaTr > 0 && fortitudeTr > 0 && pontariaTr === 0);

      // Milestones at 5% (+2 PV or +1 PE) and every +10% NEX from 5% (15%, 25%, ..., 95%)
      // Also support standard floor(nex / 10) when NEX is an even multiple of 10 (10%, 20%...)
      const stepsEvery10 =
        agent.nex % 10 === 5
          ? Math.floor(Math.max(0, agent.nex - 5) / 10)
          : Math.floor(agent.nex / 10);

      if (choseRangedBranch) {
        bonusPe += 1 + stepsEvery10;
      } else {
        bonusPv += 2 + stepsEvery10;
      }
    } else {
      if (eff?.pvPor10Nex) {
        bonusPv += eff.pvPor10Nex * Math.floor(agent.nex / 10);
      }
    }

    if (eff?.pvPor5Nex) {
      bonusPv += eff.pvPor5Nex * auto.level;
    }
    if (eff?.sanPor5Nex) {
      bonusSan += eff.sanPor5Nex * auto.level;
    }
    if (eff?.peInicial) {
      bonusPe += eff.peInicial;
    }
    if (eff?.peNexImpar) {
      // Odd NEX steps >= 15%: 15%(lvl 3), 25%(lvl 5), ..., 95%(lvl 19) => floor((level - 1) / 2)
      bonusPe += eff.peNexImpar * Math.floor(Math.max(0, auto.level - 1) / 2);
    }

    // Trail passives
    if (
      agent.classId === "combatente" &&
      trail === "tropa_de_choque" &&
      agent.nex >= 10
    ) {
      bonusPv += auto.level; // Casca Grossa: +1 PV por 5% NEX
    }
    if (
      agent.classId === "especialista" &&
      trail === "bibliotecario" &&
      agent.nex >= 99
    ) {
      bonusPe += effAttrs.INT; // A Força do Saber: soma INT ao PE total
    }
  } else {
    // Sobrevivente trail Durão: +4 PV no Estágio 2 e +2 PV adicionais no Estágio 3
    if (trail === "durao") {
      const st = agent.stage ?? 1;
      if (st >= 2) bonusPv += 4;
      if (st >= 3) bonusPv += 2;
    }
  }

  const autoMaxPv = auto.maxPv + bonusPv;
  const autoMaxSan = auto.maxSan + bonusSan;
  const missionPePenalty = Math.max(0, agent.missionPeMaxPenalty ?? 0);
  const retainedPeTotal = (agent.retainedRituals ?? []).reduce(
    (sum, r) => sum + Math.max(0, r.peCost),
    0
  );
  const autoMaxPe = Math.max(
    1,
    auto.maxPe + bonusPe - missionPePenalty - retainedPeTotal
  );
  const autoMaxPd = Math.max(
    1,
    auto.maxPd + bonusPe - missionPePenalty - retainedPeTotal
  );
  const effectivePeLimit = auto.peLimit + bonusPeLimit;

  const maxPv =
    !agent.status.pv.autoCalc && agent.status.pv.maxOverride !== null
      ? Math.max(1, agent.status.pv.maxOverride)
      : autoMaxPv;
  const maxSan =
    !agent.status.san.autoCalc && agent.status.san.maxOverride !== null
      ? Math.max(1, agent.status.san.maxOverride)
      : autoMaxSan;
  const maxPe =
    !agent.status.pe.autoCalc && agent.status.pe.maxOverride !== null
      ? Math.max(1, agent.status.pe.maxOverride)
      : autoMaxPe;
  const maxPd =
    agent.status.pd &&
    !agent.status.pd.autoCalc &&
    agent.status.pd.maxOverride !== null
      ? Math.max(1, agent.status.pd.maxOverride)
      : autoMaxPd;

  return {
    ...auto,
    maxPv,
    maxSan,
    maxPe,
    maxPd,
    peLimit: effectivePeLimit,
    basePeLimitForDt: auto.peLimit,
    transcenderCount,
    usingPd: (agent.optionalRules ?? []).includes("jogando_sem_sanidade"),
  };
}

/**
 * Official Bonus Stacking Rule (Ordem Paranormal v1.2):
 * 4 sources: Habilidade, Item, Ritual, Aliado.
 * - Different sources ALWAYS stack.
 * - Same source does NOT stack (keep highest positive, lowest negative),
 *   EXCEPT `Habilidade` (different abilities stack) or entries marked `stacksWithSameSource: true`.
 */
export interface BonusEntry {
  source: BonusSource;
  value: number;
  label?: string;
  stacksWithSameSource?: boolean;
}

export function calculateStackedBonus(bonuses: BonusEntry[]): number {
  let total = 0;
  const nonStackingMaxPos: Partial<Record<BonusSource, number>> = {};
  const nonStackingMinNeg: Partial<Record<BonusSource, number>> = {};

  for (const b of bonuses) {
    if (b.value === 0) continue;
    if (b.source === "Habilidade" || b.stacksWithSameSource) {
      total += b.value;
    } else if (b.value > 0) {
      nonStackingMaxPos[b.source] = Math.max(
        nonStackingMaxPos[b.source] ?? 0,
        b.value
      );
    } else {
      nonStackingMinNeg[b.source] = Math.min(
        nonStackingMinNeg[b.source] ?? 0,
        b.value
      );
    }
  }

  for (const val of Object.values(nonStackingMaxPos)) {
    total += val ?? 0;
  }
  for (const val of Object.values(nonStackingMinNeg)) {
    total += val ?? 0;
  }
  return total;
}

/**
 * Computes Carry Capacity, Used Load, Overload (-5 DEF, -5 load skills, -3m speed),
 * and Category counts using each item's FINAL category (with modifications & curses).
 */
export function calculateLoadAndCategories(params: {
  forAttr: number;
  patente: Patente;
  inventory: InventoryItem[];
  extraCapacityBonus?: number;
  organization?: OrganizationId;
  classId?: AgentClassId;
}) {
  const {
    forAttr,
    patente,
    inventory,
    extraCapacityBonus = 0,
    organization,
    classId,
  } = params;

  const extraCarryFromItems = inventory
    .filter((item) => item.equipped && item.carryBonus)
    .reduce(
      (sum, item) => sum + (item.carryBonus ?? 0) * Math.max(1, item.quantity),
      0
    );

  const baseMaxSpaces = forAttr > 0 ? forAttr * 5 : 2;
  const extraCarry = extraCarryFromItems + extraCapacityBonus;
  const maxSpaces = baseMaxSpaces + extraCarry;
  const absoluteMaxSpaces = maxSpaces * 2;

  const usedSpaces = Number(
    inventory
      .reduce((sum, item) => sum + item.spaces * Math.max(1, item.quantity), 0)
      .toFixed(1)
  );

  const isOverloaded = usedSpaces > maxSpaces;
  const exceedsAbsoluteMax = usedSpaces > absoluteMaxSpaces;

  const categoryCounts: Record<ItemCategory, number> = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  };

  for (const item of inventory) {
    const qty = Math.max(1, item.quantity);
    const finalCat = calculateItemFinalCategory(item, organization);
    categoryCounts[finalCat] = (categoryCounts[finalCat] ?? 0) + qty;
  }

  const baseCategoryLimits = PATENTE_CATEGORY_LIMITS[patente];
  const categoryLimits: Record<1 | 2 | 3 | 4, number> = {
    ...baseCategoryLimits,
    // Predador — Marca da Maldição: reduz em 1 o limite de itens de Categoria I
    1:
      classId === "predador"
        ? Math.max(0, baseCategoryLimits[1] - 1)
        : baseCategoryLimits[1],
  };
  const categoryExceeded: Record<1 | 2 | 3 | 4, boolean> = {
    1: categoryCounts[1] > categoryLimits[1],
    2: categoryCounts[2] > categoryLimits[2],
    3: categoryCounts[3] > categoryLimits[3],
    4: categoryCounts[4] > categoryLimits[4],
  };

  return {
    baseMaxSpaces,
    extraCarry,
    maxSpaces,
    absoluteMaxSpaces,
    usedSpaces,
    isOverloaded,
    exceedsAbsoluteMax,
    overloadDefensePenalty: isOverloaded ? -5 : 0,
    overloadSkillPenalty: isOverloaded ? -5 : 0,
    overloadDisplacementPenalty: isOverloaded ? -3 : 0,
    categoryCounts,
    categoryLimits,
    categoryExceeded,
  };
}

/**
 * Normalizes both standardized 9-category types and legacy InventoryItemType strings
 * into one of the 9 official ItemCategoryType buckets.
 */
export function normalizeItemCategoryType(
  item: Pick<InventoryItem, "type" | "name" | "element">
): ItemCategoryType {
  switch (item.type) {
    case "arma":
    case "Arma":
      return "arma";
    case "protecao":
    case "Proteção":
    case "Escudo":
      return "protecao";
    case "municao":
    case "Munição":
      return "municao";
    case "acessorio":
      return "acessorio";
    case "explosivo":
      return "explosivo";
    case "operacional":
    case "Equipamento":
      return "operacional";
    case "medicamento":
      return "medicamento";
    case "amaldicoado":
    case "Acessório Paranormal":
      return "amaldicoado";
    case "paranormal":
    case "Item Paranormal":
      return item.element ? "amaldicoado" : "paranormal";
    default:
      return "operacional";
  }
}

/**
 * Computes passive combat numbers:
 * - Defense = 10 + AGI + Proteção + Escudo + Acessório Paranormal + Habilidades + Outros + Overload(-5)
 * - Defensive Reactions:
 *   - Bloqueio (requires Fortitude trained): RD = Fortitude bonus
 *   - Esquiva (requires Reflexos trained): Defense + Reflexos bonus
 *   - Contra-ataque (requires Luta trained): boolean
 * - Ritual DT = 10 + Limite PE/PD + PRE + bonus
 */
export function calculateCombatStats(agent: Agent) {
  const origin = getOriginById(agent.originId);
  const originDefenseBonus = origin?.efeitosPassivos?.defesa ?? 0;
  const trail = normalizeCatalogId(agent.trilhaId);
  const effAttrs = getAgentEffectiveAttributes(agent);

  const load = calculateLoadAndCategories({
    forAttr: effAttrs.FOR,
    patente: agent.patente,
    inventory: agent.inventory,
    extraCapacityBonus: getTrailCarryBonus(agent),
    organization: agent.organization,
  });

  const isShieldItem = (item: InventoryItem) =>
    Boolean(item.isShield) ||
    item.type === "Escudo" ||
    (normalizeItemCategoryType(item) === "protecao" &&
      /escudo/i.test(item.name));

  // Exception to same-source rule: Proteção + Escudo + Acessório Paranormal stack!
  const equippedProtections = agent.inventory.filter(
    (item) =>
      item.equipped &&
      normalizeItemCategoryType(item) === "protecao" &&
      !isShieldItem(item) &&
      item.defenseBonus
  );
  const highestProtection = equippedProtections.reduce(
    (max, i) => Math.max(max, i.defenseBonus ?? 0),
    0
  );

  const equippedShield = agent.inventory
    .filter((item) => item.equipped && isShieldItem(item) && item.defenseBonus)
    .reduce((max, i) => Math.max(max, i.defenseBonus ?? 0), 0);

  const equippedParanormalAccessory = agent.inventory
    .filter((item) => {
      if (!item.equipped || !item.defenseBonus) return false;
      const cat = normalizeItemCategoryType(item);
      return cat === "paranormal" || cat === "amaldicoado" || cat === "acessorio";
    })
    .reduce((max, i) => Math.max(max, i.defenseBonus ?? 0), 0);

  const protectionBonus = highestProtection + agent.defense.protectionBonus;
  const shieldBonus = equippedShield + (agent.defense.shieldBonus ?? 0);
  const accessoryBonus =
    equippedParanormalAccessory + (agent.defense.paranormalAccessoryBonus ?? 0);
  const abilityBonus = (agent.defense.abilityBonus ?? 0) + originDefenseBonus;

  const vulnerableDefensePenalty = agent.status?.vulneravel ? -2 : 0;
  const disorientedDefensePenalty = agent.status?.desorientado ? -3 : 0;

  const defense = Math.max(
    0,
    10 +
      effAttrs.AGI +
      protectionBonus +
      shieldBonus +
      accessoryBonus +
      abilityBonus +
      agent.defense.otherBonus +
      load.overloadDefensePenalty +
      vulnerableDefensePenalty +
      disorientedDefensePenalty
  );

  const reflexosSkill = agent.skills.reflexos;
  const canDodge = (reflexosSkill?.training ?? 0) >= 5;
  const reflexosBonus = reflexosSkill
    ? reflexosSkill.training + reflexosSkill.bonus
    : 0;
  const dodge = defense + reflexosBonus;

  const fortitudeSkill = agent.skills.fortitude;
  const canBlock = (fortitudeSkill?.training ?? 0) >= 5;
  const cascaGrossaBlockBonus =
    agent.classId === "combatente" &&
    trail === "tropa_de_choque" &&
    agent.nex >= 10
      ? effAttrs.VIG
      : 0;
  const blockRd =
    (fortitudeSkill ? fortitudeSkill.training + fortitudeSkill.bonus : 0) +
    cascaGrossaBlockBonus;

  const lutaSkill = agent.skills.luta;
  const canCounterAttack = (lutaSkill?.training ?? 0) >= 5;

  // Note: Universitário +1 PE limit does NOT affect Ritual DT
  const basePeLimit = calculatePeLimit(agent.classId, agent.nex, agent.stage, {
    patente: agent.patente,
    optionalRules: agent.optionalRules,
    level: agent.level,
  });
  const peLimit = basePeLimit + (origin?.efeitosPassivos?.limitePeBonus ?? 0);
  const ritualDT = 10 + basePeLimit + effAttrs.PRE + (agent.ritualDTBonus ?? 0);

  return {
    defense,
    protectionBonus,
    shieldBonus,
    accessoryBonus,
    overloadDefensePenalty: load.overloadDefensePenalty,
    vulnerableDefensePenalty,
    dodge,
    canDodge,
    blockRd,
    canBlock,
    canCounterAttack,
    peLimit,
    ritualDT,
  };
}

/**
 * Checks allowed max training degree for a given NEX / Level.
 * - Veterano (+10): requires NEX >= 35% (or Level >= 7)
 * - Expert (+15): requires NEX >= 70% (or Level >= 14)
 */
export function getMaxAllowedTrainingDegree(
  classId: AgentClassId,
  nex: number,
  level?: number,
  optionalRules?: OptionalRuleId[]
): TrainingDegree {
  if (classId === "sobrevivente") return 5;
  const effectiveLevel = getProgressionLevel(classId, nex, 1, {
    separateNexAndLevel: optionalRules?.includes("nex_e_experiencia"),
    level,
  });
  if (effectiveLevel >= 14) return 15;
  if (effectiveLevel >= 7) return 10;
  return 5;
}

/**
 * Returns the NEX progression milestones unlocked at a given NEX/level.
 */
export function getNexMilestones(classId: AgentClassId, nex: number, stage = 1) {
  if (classId === "sobrevivente") {
    return {
      attributeIncreases: stage >= 3 ? 1 : 0,
      classPowersCount: 0,
      trailAbilitiesUnlocked: stage >= 4 ? 2 : stage >= 2 ? 1 : 0,
      trainingUpgrades: 0,
      hasVersatility: false,
      hasAffinity: false,
      maxRitualCircle: 0,
    };
  }

  const attributeIncreases = [20, 50, 80, 95].filter((m) => nex >= m).length;
  const classPowersCount = [15, 30, 45, 60, 75, 90].filter((m) => nex >= m).length;
  const trailAbilitiesUnlocked = [10, 40, 65, 99].filter((m) => nex >= m).length;
  const trainingUpgrades = [35, 70].filter((m) => nex >= m).length;
  const hasVersatility = nex >= 50;
  const hasAffinity = nex >= 50;
  const maxRitualCircle =
    classId === "ocultista" || classId === "devoto"
      ? nex >= 85
        ? 4
        : nex >= 55
        ? 3
        : nex >= 25
        ? 2
        : 1
      : 0;

  return {
    attributeIncreases,
    classPowersCount,
    trailAbilitiesUnlocked,
    trainingUpgrades,
    hasVersatility,
    hasAffinity,
    maxRitualCircle,
  };
}

/**
 * Computes total flat bonus for a skill (training + extra bonus + optional load/kit penalties).
 */
export function getSkillBonus(
  agent: Agent,
  skillKey: SkillKey,
  options?: {
    applyLoadPenalty?: boolean;
    loadPenaltyFlag?: boolean;
    usesKit?: boolean;
  }
): number {
  const state = agent.skills[skillKey];
  if (!state) return 0;
  const loadPen =
    options?.applyLoadPenalty && options?.loadPenaltyFlag ? -5 : 0;
  const kitPen =
    options?.usesKit && state.hasKit === false ? -5 : 0;
  return state.training + state.bonus + loadPen + kitPen;
}

/**
 * Validates initial attribute distribution during agent creation.
 * - Standard Agent (NEX 5%): start at 1 each, +4 points (max 3), may lower 1 attribute to 0 for +1 point.
 * - Sobrevivente (NEX 0% / Estágio 1): start at 1 each, +3 points (max 3), may lower 1 attribute to 0 for +1 point.
 */
export function validateInitialAttributes(
  attributes: Record<AttributeKey, number>,
  classId: AgentClassId
) {
  const values = Object.values(attributes);
  const basePoints = classId === "sobrevivente" ? 3 : 4;
  const zeroCount = values.filter((v) => v === 0).length;
  const belowZero = values.some((v) => v < 0);
  const aboveMax = values.some((v) => v > 3);

  const currentSum = values.reduce((acc, v) => acc + v, 0);
  const expectedSum = 5 + basePoints;
  const pointsRemaining = expectedSum - currentSum;

  const errors: string[] = [];
  if (belowZero) errors.push("Atributos não podem ser negativos.");
  if (aboveMax) errors.push("Na criação inicial, o valor máximo por atributo é 3.");
  if (zeroCount > 1) errors.push("Você pode reduzir no máximo 1 atributo para 0.");
  if (pointsRemaining > 0) errors.push(`Faltam ${pointsRemaining} ponto(s) para distribuir.`);
  if (pointsRemaining < 0) errors.push(`Você excedeu ${Math.abs(pointsRemaining)} ponto(s).`);

  return {
    valid: errors.length === 0,
    pointsRemaining,
    zeroCount,
    errors,
  };
}

/**
 * Evaluates Custo do Paranormal outcome (Occultism vs DT 20 + PE spent).
 */
export function evaluateParanormalCost(params: {
  rollTotal: number;
  peSpent: number;
  isFearRitual?: boolean;
}) {
  const { rollTotal, peSpent, isFearRitual = false } = params;
  if (isFearRitual) {
    return {
      dt: 0,
      passed: true,
      sanLost: 0,
      permanentSanLost: 0,
      summary: "Ritual de Medo não exige teste de Custo do Paranormal.",
    };
  }
  const dt = 20 + peSpent;
  if (rollTotal >= dt) {
    return {
      dt,
      passed: true,
      sanLost: 0,
      permanentSanLost: 0,
      summary: `Passou na DT ${dt} (0 SAN perdida).`,
    };
  }
  const margin = dt - rollTotal;
  const permanentSanLost = margin >= 5 ? 1 : 0;
  return {
    dt,
    passed: false,
    sanLost: peSpent,
    permanentSanLost,
    summary:
      permanentSanLost > 0
        ? `Falhou por ${margin} (DT ${dt}): perde ${peSpent} SAN e 1 SAN permanente!`
        : `Falhou na DT ${dt}: perde ${peSpent} SAN.`,
  };
}

function rollSingleDie(sides: number, rng: RngFn = Math.random): number {
  return Math.floor(rng() * sides) + 1;
}

export interface OrdemTestRollResult {
  diceCount: number;
  mode: "highest" | "lowest";
  diceRolled: number[];
  chosenDie: number;
  bonus: number;
  total: number;
  isNat20: boolean;
  isNat1: boolean;
  isCriticalThreat: boolean;
  formula: string;
}

/**
 * Official Ordem Paranormal d20 pool roll:
 * - effectiveDice = attributeValue + bonusDice
 * - If effectiveDice >= 1: roll N d20, keep HIGHEST + bonus
 * - If effectiveDice <= 0: roll (2 + |effectiveDice|) d20, keep LOWEST + bonus
 */
export function rollOrdemTest(params: {
  attributeValue: number;
  bonus?: number;
  bonusDice?: number;
  threatRange?: number;
  rng?: RngFn;
}): OrdemTestRollResult {
  const {
    attributeValue,
    bonus = 0,
    bonusDice = 0,
    threatRange = 20,
    rng = Math.random,
  } = params;

  const effectiveDice = attributeValue + bonusDice;
  const mode: "highest" | "lowest" = effectiveDice >= 1 ? "highest" : "lowest";
  const diceCount = effectiveDice >= 1 ? effectiveDice : 2 + Math.abs(effectiveDice);

  const diceRolled: number[] = [];
  for (let i = 0; i < diceCount; i++) {
    diceRolled.push(rollSingleDie(20, rng));
  }

  const chosenDie =
    mode === "highest" ? Math.max(...diceRolled) : Math.min(...diceRolled);
  const total = chosenDie + bonus;
  const isNat20 = chosenDie === 20;
  const isNat1 = chosenDie === 1;
  const isCriticalThreat = chosenDie >= threatRange;

  const keepTag = mode === "highest" ? "kh1" : "kl1";
  const bonusStr = bonus === 0 ? "" : bonus > 0 ? `+${bonus}` : `${bonus}`;
  const formula = `${diceCount}d20(${keepTag})${bonusStr}`;

  return {
    diceCount,
    mode,
    diceRolled,
    chosenDie,
    bonus,
    total,
    isNat20,
    isNat1,
    isCriticalThreat,
    formula,
  };
}

export interface FormulaRollResult {
  formula: string;
  effectiveFormula: string;
  diceRolled: number[];
  bonus: number;
  total: number;
  isCriticalDamage: boolean;
  breakdown: string;
}

/**
 * Parses and rolls arbitrary dice formulas ("3d6+2", "1d100", "2d8+1d6+4", "1d12-1").
 * On critical hit, multiplies ONLY the dice counts (preserving flat modifiers).
 */
export function rollDiceFormula(params: {
  formula: string;
  isCritical?: boolean;
  critMultiplier?: number;
  rng?: RngFn;
}): FormulaRollResult {
  const {
    formula,
    isCritical = false,
    critMultiplier = 2,
    rng = Math.random,
  } = params;

  const cleaned = formula.replace(/\s+/g, "").toLowerCase();
  if (!cleaned) {
    throw new Error("Fórmula de dados vazia.");
  }

  const tokenRegex = /([+-]?)(\d*d\d+|\d+)/g;
  const tokens: { sign: 1 | -1; raw: string }[] = [];
  let matchedLength = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(cleaned)) !== null) {
    const sign: 1 | -1 = match[1] === "-" ? -1 : 1;
    tokens.push({ sign, raw: match[2] });
    matchedLength += match[0].length;
  }

  if (tokens.length === 0 || matchedLength !== cleaned.length) {
    throw new Error(`Fórmula inválida: "${formula}"`);
  }

  const multiplier = isCritical ? Math.max(1, Math.floor(critMultiplier)) : 1;
  const diceRolled: number[] = [];
  let flatBonus = 0;
  let total = 0;
  const effectiveParts: string[] = [];
  const breakdownParts: string[] = [];

  tokens.forEach((token, idx) => {
    const signPrefix = token.sign === -1 ? "-" : idx === 0 ? "" : "+";

    if (token.raw.includes("d")) {
      const [countStr, sidesStr] = token.raw.split("d");
      const baseCount = countStr === "" ? 1 : parseInt(countStr, 10);
      const sides = parseInt(sidesStr, 10);

      if (
        !Number.isFinite(baseCount) ||
        !Number.isFinite(sides) ||
        baseCount <= 0 ||
        sides <= 0
      ) {
        throw new Error(`Dado inválido na fórmula: "${token.raw}"`);
      }

      const finalCount = baseCount * multiplier;
      effectiveParts.push(`${signPrefix}${finalCount}d${sides}`);

      const termRolls: number[] = [];
      let termSum = 0;
      for (let i = 0; i < finalCount; i++) {
        const val = rollSingleDie(sides, rng);
        termRolls.push(val);
        diceRolled.push(token.sign * val);
        termSum += val;
      }

      total += token.sign * termSum;
      breakdownParts.push(`${signPrefix}[${termRolls.join(", ")}]`);
    } else {
      const num = parseInt(token.raw, 10);
      flatBonus += token.sign * num;
      total += token.sign * num;
      effectiveParts.push(`${signPrefix}${num}`);
      breakdownParts.push(`${signPrefix}${num}`);
    }
  });

  return {
    formula: cleaned,
    effectiveFormula: effectiveParts.join(""),
    diceRolled,
    bonus: flatBonus,
    total: Math.max(0, total),
    isCriticalDamage: isCritical && multiplier > 1,
    breakdown: breakdownParts.join(" "),
  };
}

export interface ExtraDamageTerm {
  formula: string;
  label?: string;
  multiplicaNoCritico?: boolean;
}

export interface WeaponDamageResult extends FormulaRollResult {
  baseRolls: number[];
  extraRolls: number[];
}

/**
 * Official Ordem Paranormal v1.2 Weapon Damage & Critical Hit Calculator:
 * - Multiplies ONLY the weapon's base dice by `critMultiplier` (e.g. `1d8+4` x3 -> `3d8+4`).
 * - Flat bonuses (+FOR, +2, etc.) are NEVER multiplied.
 * - Extra dice (Ataque Furtivo, maldições, rituais) are NOT multiplied UNLESS `multiplicaNoCritico: true`.
 */
export function rollWeaponDamage(params: {
  baseFormula: string;
  extraTerms?: ExtraDamageTerm[];
  isCritical?: boolean;
  critMultiplier?: number;
  rng?: RngFn;
}): WeaponDamageResult {
  const {
    baseFormula,
    extraTerms = [],
    isCritical = false,
    critMultiplier = 2,
    rng = Math.random,
  } = params;

  const baseRes = rollDiceFormula({
    formula: baseFormula,
    isCritical,
    critMultiplier,
    rng,
  });

  const allDice = [...baseRes.diceRolled];
  const extraRolls: number[] = [];
  let total = baseRes.total;
  let totalBonus = baseRes.bonus;
  const formulaParts = [baseRes.effectiveFormula];
  const breakdownParts = [baseRes.breakdown];

  for (const extra of extraTerms) {
    const trimmed = extra.formula.trim();
    if (!trimmed) continue;
    const multiplyExtra = Boolean(isCritical && extra.multiplicaNoCritico);
    const extraRes = rollDiceFormula({
      formula: trimmed,
      isCritical: multiplyExtra,
      critMultiplier,
      rng,
    });
    allDice.push(...extraRes.diceRolled);
    extraRolls.push(...extraRes.diceRolled);
    total += extraRes.total;
    totalBonus += extraRes.bonus;
    formulaParts.push(
      extraRes.effectiveFormula.startsWith("-")
        ? extraRes.effectiveFormula
        : `+${extraRes.effectiveFormula}`
    );
    const tag = extra.label ? ` (${extra.label})` : "";
    breakdownParts.push(`+ ${extraRes.breakdown}${tag}`);
  }

  return {
    formula: [baseFormula, ...extraTerms.map((e) => e.formula).filter(Boolean)].join(" + "),
    effectiveFormula: formulaParts.join(""),
    diceRolled: allDice,
    baseRolls: baseRes.diceRolled,
    extraRolls,
    bonus: totalBonus,
    total: Math.max(0, total),
    isCriticalDamage: isCritical && critMultiplier > 1,
    breakdown: breakdownParts.join(" "),
  };
}

/**
 * Evaluates automatic vital-threshold conditions (Ordem Paranormal v1.2):
 * - Machucado: PV <= 50% maxPv
 * - Perturbado: SAN <= 50% maxSan (when not using PD)
 */
export function evaluateVitalConditions(params: {
  currentPv: number;
  maxPv: number;
  currentSan: number;
  maxSan: number;
  usingPd?: boolean;
}) {
  return {
    machucado: params.currentPv <= Math.floor(params.maxPv / 2),
    morrendo: params.currentPv <= 0,
    perturbado:
      !params.usingPd && params.currentSan <= Math.floor(params.maxSan / 2),
    enlouquecendo: !params.usingPd && params.currentSan <= 0,
  };
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

function stripAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Validates power prerequisites against an Agent (attributes, NEX, trained skills,
 * elemental paranormal power counts, or named powers/abilities).
 */
export function checkPowerPrerequisites(
  agent: Agent,
  prereq?: string
): { met: boolean; missing: string[] } {
  if (!prereq || !prereq.trim()) return { met: true, missing: [] };

  const effAttrs = getAgentEffectiveAttributes(agent);
  const clauses = prereq
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const missing: string[] = [];

  for (const clause of clauses) {
    // 1. Attribute threshold: e.g. "FOR 2", "AGI 3", "INT 2"
    const attrMatch = clause.match(/^(AGI|FOR|INT|PRE|VIG)\s+(\d+)$/i);
    if (attrMatch) {
      const key = attrMatch[1].toUpperCase() as AttributeKey;
      const req = parseInt(attrMatch[2], 10);
      if ((effAttrs[key] ?? 0) < req) {
        missing.push(`${key} ${req}`);
      }
      continue;
    }

    // 2. NEX threshold: e.g. "NEX 30%"
    const nexMatch = clause.match(/^NEX\s+(\d+)%?$/i);
    if (nexMatch) {
      const req = parseInt(nexMatch[1], 10);
      if (agent.nex < req) {
        missing.push(`NEX ${req}%`);
      }
      continue;
    }

    // 3. Elemental power count: e.g. "Sangue 1", "Morte 2"
    const elemMatch = clause.match(
      /^(Sangue|Morte|Conhecimento|Energia)\s+(\d+)$/i
    );
    if (elemMatch) {
      const targetElem = stripAccents(elemMatch[1]);
      const req = parseInt(elemMatch[2], 10);
      const count = agent.abilities.filter(
        (a) =>
          a.source === "Paranormal" &&
          a.element &&
          stripAccents(a.element) === targetElem
      ).length;
      if (count < req) {
        missing.push(`${elemMatch[1]} ${req}`);
      }
      continue;
    }

    // 3b. "Veterano em Furtividade" / "Expert em Luta" / "Treinado em X"
    const gradeMatch = clause.match(/^(Treinado|Veterano|Expert)\s+em\s+(.+)$/i);
    if (gradeMatch) {
      const gradeReq =
        gradeMatch[1].toLowerCase() === "expert"
          ? 15
          : gradeMatch[1].toLowerCase() === "veterano"
          ? 10
          : 5;
      const skKey = SKILL_NAME_TO_KEY[stripAccents(gradeMatch[2])];
      if (!skKey || (agent.skills[skKey]?.training ?? 0) < gradeReq) {
        missing.push(clause);
      }
      continue;
    }

    // 4. "Luta ou Pontaria" (OR skill check)
    if (/\bou\b/i.test(clause)) {
      const options = clause.split(/\bou\b/i).map((o) => o.trim());
      const anyMet = options.some((opt) => {
        const skKey = SKILL_NAME_TO_KEY[stripAccents(opt)];
        return skKey ? (agent.skills[skKey]?.training ?? 0) >= 5 : false;
      });
      if (!anyMet) missing.push(clause);
      continue;
    }

    // 5. "Percepção e Tática" (AND skill check)
    if (/\be\b/i.test(clause)) {
      const parts = clause.split(/\be\b/i).map((o) => o.trim());
      const allSkills = parts.every((p) => Boolean(SKILL_NAME_TO_KEY[stripAccents(p)]));
      if (allSkills) {
        for (const p of parts) {
          const skKey = SKILL_NAME_TO_KEY[stripAccents(p)];
          if (skKey && (agent.skills[skKey]?.training ?? 0) < 5) {
            missing.push(p);
          }
        }
        continue;
      }
    }

    // 6. Single skill trained check
    const singleSkillKey = SKILL_NAME_TO_KEY[stripAccents(clause)];
    if (singleSkillKey) {
      if ((agent.skills[singleSkillKey]?.training ?? 0) < 5) {
        missing.push(`Treinado em ${clause}`);
      }
      continue;
    }

    // 7. Generic "Treinado na perícia" (informational)
    if (/treinado na pericia/i.test(stripAccents(clause))) {
      continue;
    }

    // 8. Required ability/power by name
    const targetName = stripAccents(clause);
    const hasAbility = agent.abilities.some((a) =>
      stripAccents(a.name).includes(targetName)
    );
    if (!hasAbility) {
      missing.push(clause);
    }
  }

  return { met: missing.length === 0, missing };
}

/* ============================================================================
 * ALLIES & PETS PASSIVE MODIFIERS (Non-stacking same source "Aliado")
 * ============================================================================ */

export function getAllySkillModifiers(
  agent: Agent,
  skillKey: SkillKey
): { flatBonus: number; diceModifier: number; grantsTrained: boolean } {
  const activeAllies = (agent.allies ?? []).filter(
    (a) => a.helping && (!a.dangerRuleEnabled || (a.wounds ?? 0) < 2)
  );
  let maxFlat = 0;
  let maxDice = 0;
  let grantsTrained = false;

  for (const ally of activeAllies) {
    const flat = ally.skillFlatBonuses?.[skillKey] ?? 0;
    if (flat > maxFlat) maxFlat = flat;

    const dice = ally.skillDiceBonuses?.[skillKey] ?? 0;
    if (dice > maxDice) maxDice = dice;

    if (ally.trainedSkills?.includes(skillKey)) {
      grantsTrained = true;
    }
  }

  return { flatBonus: maxFlat, diceModifier: maxDice, grantsTrained };
}

export function getAllyAttackDiceBonus(agent: Agent): number {
  const activeAllies = (agent.allies ?? []).filter(
    (a) => a.helping && (!a.dangerRuleEnabled || (a.wounds ?? 0) < 2)
  );
  let maxDice = 0;
  for (const ally of activeAllies) {
    if ((ally.attackDiceBonus ?? 0) > maxDice) {
      maxDice = ally.attackDiceBonus ?? 0;
    }
  }
  return maxDice;
}

/* ============================================================================
 * INTERLUDE SCENE CALCULATOR (Livro Básico v1.2 + Sobrevivendo ao Horror)
 * ============================================================================ */

export const REST_CONDITION_MULTIPLIERS: Record<RestCondition, number> = {
  precaria: 0.5,
  normal: 1,
  confortavel: 2,
  luxuosa: 3,
};

export interface InterludeCalculationInput {
  restCondition: RestCondition;
  baseRecovery: number; // Limite de PE por turno (ou valor da Patente se Evolução por Patentes)
  usingPd?: boolean;
  didSleep: boolean;
  didRelax: boolean;
  alliesRelaxingTogether?: number;
  dishes: InterludeDish[];
  exerciseCount?: number;
  readCount?: number;
  maintenanceCount?: number;
  vig?: number;
  originId?: string;
  trilhaId?: string | null;
  nex?: number;
}

export interface InterludeCalculationResult {
  pvRecovered: number;
  peRecovered: number;
  sanRecovered: number;
  pdRecovered: number;
  pdTempBonus: number;
  reviewCaseBonus: number;
  exerciseDiceCount: number;
  readDiceCount: number;
  readDieFormula: "1d6" | "2d6" | "1d8" | "1d10" | "1d12";
  sanLostFromParanormalFood: number;
  paranormalFoodNotes: string[];
  maxMaintenanceItems: number;
  exerciseWholeScene: boolean;
  readWholeScene: boolean;
  nextScenePeDiscount: number;
}

const PARANORMAL_FOOD_IDS = new Set<InterludeDish>([
  "mol_alimento_sangue",
  "mol_alimento_morte",
  "mol_alimento_conhecimento",
  "mol_alimento_energia",
]);

export function calculateInterludeRecovery(
  input: InterludeCalculationInput
): InterludeCalculationResult {
  const mult = REST_CONDITION_MULTIPLIERS[input.restCondition];
  const base = Math.max(1, input.baseRecovery);
  const usingPd = Boolean(input.usingPd);
  const dishes = input.dishes ?? [];
  const hasNutritivo = dishes.includes("nutritivo");
  const hasEnergetico = dishes.includes("energetico");
  const hasFavorito = dishes.includes("favorito");
  const hasRapido = dishes.includes("rapido");
  const hasAlimentoSangue = dishes.includes("mol_alimento_sangue");
  const hasAlimentoMorte = dishes.includes("mol_alimento_morte");
  const hasAlimentoConhecimento = dishes.includes("mol_alimento_conhecimento");
  const hasAlimentoEnergia = dishes.includes("mol_alimento_energia");

  let pvRecovered = 0;
  let peRecovered = 0;
  let sanRecovered = 0;
  let pdRecovered = 0;
  let pdTempBonus = 0;

  if (input.didSleep) {
    const pvMult = mult + (hasNutritivo ? 1 : 0);
    pvRecovered = Math.floor(base * pvMult);
    if (!usingPd) {
      const peMult = mult + (hasEnergetico ? 1 : 0);
      peRecovered = Math.floor(base * peMult);
    }
  }

  if (input.didRelax) {
    const baseRelax = Math.floor(base * mult);
    const alliesBonus = Math.max(0, Math.floor(input.alliesRelaxingTogether ?? 0));
    if (usingPd) {
      pdRecovered = baseRelax + alliesBonus;
    } else {
      sanRecovered = baseRelax + alliesBonus + (hasFavorito ? 2 : 0);
    }
  }

  if (usingPd && hasFavorito) {
    pdTempBonus = 2;
  }

  const originNorm = normalizeCatalogId(input.originId);
  const trailNorm = normalizeCatalogId(input.trilhaId);
  const nex = input.nex ?? 0;

  let readDieFormula: "1d6" | "2d6" | "1d8" | "1d10" | "1d12" = "1d6";
  if (originNorm === "nerd_entusiasta") {
    readDieFormula = "2d6";
  } else if (trailNorm === "mol_detetive") {
    if (nex >= 65) readDieFormula = "1d12";
    else if (nex >= 40) readDieFormula = "1d10";
    else if (nex >= 10) readDieFormula = "1d8";
  } else if (trailNorm === "bibliotecario" && nex >= 40) {
    readDieFormula = "1d8";
  }

  const exerciseDiceCount = Math.max(0, Math.floor(input.exerciseCount ?? 0));
  const readDiceCount = Math.max(0, Math.floor(input.readCount ?? 0));
  const maintenanceCount = Math.max(0, Math.floor(input.maintenanceCount ?? 0));

  const paranormalFoodsCount = dishes.filter((d) =>
    PARANORMAL_FOOD_IDS.has(d)
  ).length;
  const sanLostFromParanormalFood =
    paranormalFoodsCount * Math.max(0, Math.floor(input.vig ?? 0));

  const paranormalFoodNotes: string[] = [];
  const exerciseWholeScene = hasAlimentoSangue && exerciseDiceCount > 0;
  const readWholeScene = hasAlimentoConhecimento && readDiceCount > 0;
  const nextScenePeDiscount = hasAlimentoMorte && input.didSleep ? 1 : 0;
  const maxMaintenanceItems =
    hasAlimentoEnergia && maintenanceCount > 0 ? 3 : 1;

  if (hasAlimentoSangue) {
    paranormalFoodNotes.push(
      exerciseWholeScene
        ? "Alimento de Sangue: bônus de Exercitar-se vale para todos os testes de AGI, FOR ou VIG (escolha um) durante toda a cena."
        : "Alimento de Sangue (cena): +5 resistência contra fadiga, fraqueza, venenos e doenças e RD 5 até o fim da cena."
    );
  }
  if (hasAlimentoMorte) {
    paranormalFoodNotes.push(
      nextScenePeDiscount > 0
        ? "Alimento de Morte + Dormir: todas as habilidades e rituais custam -1 PE até o fim da próxima cena."
        : "Alimento de Morte (cena): ações completas (exceto rituais) têm execução reduzida para padrão até o fim da cena."
    );
  }
  if (hasAlimentoConhecimento) {
    paranormalFoodNotes.push(
      readWholeScene
        ? "Alimento de Conhecimento: bônus de Ler vale para todos os testes de INT ou PRE (escolha um) durante toda a cena."
        : "Alimento de Conhecimento (cena): +5 Vontade e pode usar perícias sem kits ou sem treinamento até o fim da cena."
    );
  }
  if (hasAlimentoEnergia) {
    paranormalFoodNotes.push(
      maxMaintenanceItems > 1
        ? "Alimento de Energia + Manutenção: conserta até 3 itens em uma única ação."
        : "Alimento de Energia (cena): +5 Reflexos e +6m de deslocamento até o fim da cena."
    );
  }

  return {
    pvRecovered,
    peRecovered,
    sanRecovered,
    pdRecovered,
    pdTempBonus,
    reviewCaseBonus: hasRapido ? 5 : 0,
    exerciseDiceCount,
    readDiceCount,
    readDieFormula,
    sanLostFromParanormalFood,
    paranormalFoodNotes,
    maxMaintenanceItems,
    exerciseWholeScene,
    readWholeScene,
    nextScenePeDiscount,
  };
}

/* ============================================================================
 * AMMUNITION COUNTING RULES (Regra Opcional: Contagem de Munição)
 * ============================================================================ */

export function getDefaultMagazineCapacity(weaponName: string): {
  capacity: number;
  isRanged: boolean;
  supportsBurst: boolean;
} {
  const norm = stripAccents(weaponName);
  if (norm.includes("pistola pesada")) {
    return { capacity: 10, isRanged: true, supportsBurst: false };
  }
  if (norm.includes("pistola taser") || norm.includes("taser")) {
    return { capacity: 10, isRanged: true, supportsBurst: false };
  }
  if (norm.includes("pistola") || norm.includes("sinalizador")) {
    return { capacity: 12, isRanged: true, supportsBurst: false };
  }
  if (norm.includes("revolver compacto")) {
    return { capacity: 5, isRanged: true, supportsBurst: false };
  }
  if (norm.includes("revolver")) {
    return { capacity: 6, isRanged: true, supportsBurst: false };
  }
  if (norm.includes("fuzil de caca")) {
    return { capacity: 4, isRanged: true, supportsBurst: false };
  }
  if (norm.includes("submetralhadora")) {
    return { capacity: 20, isRanged: true, supportsBurst: true };
  }
  if (norm.includes("cano duplo")) {
    return { capacity: 2, isRanged: true, supportsBurst: false };
  }
  if (norm.includes("espingarda")) {
    return { capacity: 6, isRanged: true, supportsBurst: false };
  }
  if (norm.includes("fuzil de assalto")) {
    return { capacity: 30, isRanged: true, supportsBurst: true };
  }
  if (norm.includes("fuzil de precisao")) {
    return { capacity: 1, isRanged: true, supportsBurst: false };
  }
  if (norm.includes("metralhadora")) {
    return { capacity: 50, isRanged: true, supportsBurst: true };
  }
  if (norm.includes("lancador de granadas") || norm.includes("bazuca")) {
    return { capacity: 6, isRanged: true, supportsBurst: false };
  }
  if (
    norm.includes("arco") ||
    norm.includes("besta") ||
    norm.includes("balestra")
  ) {
    return { capacity: 1, isRanged: true, supportsBurst: false };
  }
  return { capacity: 0, isRanged: false, supportsBurst: false };
}

export function getAmmoShotsPerPack(itemName: string): number {
  const norm = stripAccents(itemName);
  if (norm.includes("foguete") || norm.includes("granada")) return 1;
  return 20;
}

export function consumeAttackAmmo(params: {
  current: number;
  burstMode?: boolean;
}): {
  ok: boolean;
  consumed: number;
  nextCurrent: number;
  reason?: "empty" | "insufficient_burst";
} {
  const required = params.burstMode ? 10 : 1;
  const cur = Math.max(0, Math.floor(params.current));
  if (cur === 0) {
    return { ok: false, consumed: 0, nextCurrent: 0, reason: "empty" };
  }
  if (cur < required) {
    return {
      ok: false,
      consumed: 0,
      nextCurrent: cur,
      reason: "insufficient_burst",
    };
  }
  return {
    ok: true,
    consumed: required,
    nextCurrent: cur - required,
  };
}

export function reloadAttackAmmo(params: {
  current: number;
  max: number;
  reserve?: number | null;
}): {
  nextCurrent: number;
  loaded: number;
  nextReserve: number | null;
} {
  const max = Math.max(1, Math.floor(params.max));
  const cur = Math.max(0, Math.min(max, Math.floor(params.current)));
  const needed = max - cur;

  if (needed <= 0) {
    return {
      nextCurrent: cur,
      loaded: 0,
      nextReserve: params.reserve ?? null,
    };
  }

  if (params.reserve === undefined || params.reserve === null) {
    return {
      nextCurrent: max,
      loaded: needed,
      nextReserve: null,
    };
  }

  const avail = Math.max(0, Math.floor(params.reserve));
  const loaded = Math.min(needed, avail);
  return {
    nextCurrent: cur + loaded,
    loaded,
    nextReserve: avail - loaded,
  };
}

export function getBurstExtraDiceFormula(
  baseDamageFormula: string,
  extraDice = 2
): string {
  const match = baseDamageFormula.replace(/\s+/g, "").match(/(\d*)d(\d+)/i);
  if (!match) return "";
  const sides = parseInt(match[2], 10);
  if (!Number.isFinite(sides) || sides <= 0) return "";
  return `${extraDice}d${sides}`;
}

/* ============================================================================
 * SPECIAL SCENES PROGRESSIVE ROLLS (Sobrevivendo ao Horror)
 * ============================================================================ */

export function rollObstinateSearch(
  usageNumber: number,
  rng: RngFn = Math.random
): {
  usageNumber: number;
  formula: string;
  diceRolled: number[];
  sanLoss: number;
} {
  const count = Math.max(1, Math.floor(usageNumber));
  const formula = `${count}d4`;
  const res = rollDiceFormula({ formula, rng });
  return {
    usageNumber: count,
    formula,
    diceRolled: res.diceRolled,
    sanLoss: res.total,
  };
}

export function rollExtraEffortDamage(
  usageNumber: number,
  rng: RngFn = Math.random
): {
  usageNumber: number;
  formula: string;
  diceRolled: number[];
  pvLoss: number;
} {
  const count = Math.max(1, Math.floor(usageNumber));
  const formula = `${count}d4`;
  const res = rollDiceFormula({ formula, rng });
  return {
    usageNumber: count,
    formula,
    diceRolled: res.diceRolled,
    pvLoss: res.total,
  };
}
