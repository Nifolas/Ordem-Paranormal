import rawEntrega4 from "./entrega_4_grimorio_do_cataclisma_parte1.json";
import type {
  AgentClassId,
  ClassDefinition,
  ContentSource,
  OriginDefinition,
  OriginPassiveEffects,
  PowerDefinition,
  SkillKey,
  TrailDefinition,
} from "@/types/ordem";

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

function parseMarcoToNumber(marco: string): number {
  const match = marco.match(/\d+/);
  return match ? parseInt(match[0], 10) : 10;
}

function parsePeCostFromText(text: string): number {
  const m = text.match(/gasta(?:r)?\s+(\d+)\s*PE/i);
  return m ? parseInt(m[1], 10) : 0;
}

function normalizeOriginPassives(
  raw: Record<string, unknown> | undefined
): OriginPassiveEffects | undefined {
  if (!raw) return undefined;
  const eff: OriginPassiveEffects = {};
  if (typeof raw.nexBonus === "number") eff.nexBonus = raw.nexBonus;
  if (typeof raw.metadePvInicial === "boolean")
    eff.metadePvInicial = raw.metadePvInicial;
  if (typeof raw.metadePeInicial === "boolean")
    eff.metadePeInicial = raw.metadePeInicial;
  if (typeof raw.rdMentalPorPre === "number")
    eff.rdMentalPorPre = raw.rdMentalPorPre;

  if (raw.periciaBonus && typeof raw.periciaBonus === "object") {
    const mapped: Partial<Record<SkillKey, number>> = {};
    for (const [k, v] of Object.entries(
      raw.periciaBonus as Record<string, number>
    )) {
      const sk = parseSkillKey(k);
      if (sk && typeof v === "number") {
        mapped[sk] = v;
      }
    }
    if (Object.keys(mapped).length > 0) {
      eff.periciaBonus = mapped;
    }
  }
  return eff;
}

/* ============================================================================
 * 1. ORIGENS (24 origens — gdc_*)
 * ============================================================================ */
export const ENTREGA4_ORIGINS: OriginDefinition[] = rawEntrega4.origens.map(
  (o) => {
    const trainedSkills = o.pericias
      .map(parseSkillKey)
      .filter((k): k is SkillKey => k !== null);
    const efeitosPassivos = normalizeOriginPassives(
      "efeitosPassivos" in o
        ? (o.efeitosPassivos as Record<string, unknown>)
        : undefined
    );

    return {
      id: o.id,
      name: o.nome,
      source: o.source as ContentSource,
      description: o.poder.descricao,
      trainedSkills,
      powerName: o.poder.nome,
      powerDescription: o.poder.descricao,
      powerPeCost: parsePeCostFromText(o.poder.descricao),
      efeitosPassivos,
    };
  }
);

/* ============================================================================
 * 2. TRILHAS (25 trilhas — gdc_*)
 * ============================================================================ */
export const ENTREGA4_TRAILS: TrailDefinition[] = rawEntrega4.trilhas.map(
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
        peCost: parsePeCostFromText(h.descricao),
      })),
    };
  }
);

/* ============================================================================
 * 3. PODERES DE CLASSE (51 poderes — gdc_*)
 * ============================================================================ */
export const ENTREGA4_CLASS_POWERS: PowerDefinition[] =
  rawEntrega4.poderesClasse.map((p) => ({
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
 * 4. DUAS NOVAS CLASSES COMPLETAS (Devoto e Predador)
 * ============================================================================ */
export const ENTREGA4_CLASSES: ClassDefinition[] = rawEntrega4.classes.map(
  (cls) => {
    const id = cls.id as AgentClassId;
    const fixedSummary =
      "periciasFixas" in cls && Array.isArray(cls.periciasFixas)
        ? `${cls.periciasFixas.join(" + ")} + (${cls.periciasEscolhaBase} + INT) à escolha`
        : "periciasFixasEscolha" in cls && Array.isArray(cls.periciasFixasEscolha)
        ? `${cls.periciasFixasEscolha
            .map((g) => `(${g.join(" ou ")})`)
            .join(" + ")} + (${cls.periciasEscolhaBase} + INT) à escolha`
        : `${cls.periciasEscolhaBase} + INT à escolha`;

    const combinedBaseAbilityName = cls.habilidadesBase
      .map((h) => h.nome)
      .join(" & ");
    const combinedBaseAbilityDesc = cls.habilidadesBase
      .map((h) => `${h.nome}: ${h.descricao}`)
      .join(" | ");

    return {
      id,
      name: cls.nome,
      source: cls.source as ContentSource,
      description:
        id === "devoto"
          ? "Guiado pela fé — ou por algo que se faz passar por ela —, o Devoto canaliza o paranormal por meio de devoção, bênçãos (Abençoar) e rituais de Disruptura."
          : "Caçador marcado pelo Outro Lado, o Predador persegue alvos com equipamentos amaldiçoados (Marca da Maldição) e instinto implacável (Presa Marcada).",
      initialPv: cls.pvInicial,
      pvPerLevel: cls.pvPorNex,
      initialPe: cls.peInicial,
      pePerLevel: cls.pePorNex,
      initialSan: cls.sanInicial,
      sanPerLevel: cls.sanPorNex,
      initialPd: id === "devoto" ? 8 : 6,
      pdPerLevel: id === "devoto" ? 4 : 3,
      trainingDegreeCountBase: cls.grauTreinamentoBase,
      baseProficiencies: cls.proficiencias.join(" e "),
      defaultSkillCount: fixedSummary,
      baseAbility: {
        name: combinedBaseAbilityName,
        peCost: 2,
        description: combinedBaseAbilityDesc,
      },
      trilhas: ENTREGA4_TRAILS.filter((t) => t.classId === id),
    };
  }
);

/* ============================================================================
 * 5. REGRAS NEX 99%+ & ROLETA MALUCA (Corrompido NEX 99%)
 * ============================================================================ */
export interface Nex99PlusRuleEntry {
  classId: AgentClassId;
  source: ContentSource;
  effect: string;
}

export const ENTREGA4_NEX_99_PLUS: Nex99PlusRuleEntry[] =
  rawEntrega4.regrasNex99Plus.map((r) => ({
    classId: r.classe as AgentClassId,
    source: r.source as ContentSource,
    effect: r.efeito,
  }));

export interface RoletaMalucaOutcome {
  face: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  effect: string;
}

export const ROLETA_MALUCA_OUTCOMES: Record<
  1 | 2 | 3 | 4 | 5 | 6,
  RoletaMalucaOutcome
> = {
  1: {
    face: 1,
    title: "1 — Suporte Forçado",
    effect:
      "Realize uma ação de suporte em um aliado com +10 no teste, OU sofra -5 na Defesa até o próximo turno.",
  },
  2: {
    face: 2,
    title: "2 — Impulso Sem Sentido",
    effect:
      "Gaste uma ação completa realizando uma ação sem sentido, OU sofra 1d10 de dano mental.",
  },
  3: {
    face: 3,
    title: "3 — Disparo Descontrolado",
    effect:
      "Faça um ataque à distância com +2 dados de dano, OU cause 1d20 de dano em si mesmo.",
  },
  4: {
    face: 4,
    title: "4 — Canalização Instável",
    effect:
      "Conjure um ritual sem sofrer perda de Sanidade por O Custo do Paranormal, OU sofra -1d20 em testes de PRE e INT.",
  },
  5: {
    face: 5,
    title: "5 — Violência Corpo a Corpo",
    effect:
      "Faça um ataque corpo a corpo com +10 no teste, OU sofra -1d20 em testes de FOR, AGI e VIG.",
  },
  6: {
    face: 6,
    title: "6 — Ápice do Caos",
    effect:
      "Aja livremente neste turno recebendo +1d20 em todos os testes!",
  },
};

export function rollRoletaMaluca(
  rng: () => number = Math.random
): RoletaMalucaOutcome {
  const raw = Math.floor(rng() * 6) + 1;
  const face = Math.max(1, Math.min(6, raw)) as 1 | 2 | 3 | 4 | 5 | 6;
  return ROLETA_MALUCA_OUTCOMES[face];
}

export const ENTREGA4_META = rawEntrega4.meta;
