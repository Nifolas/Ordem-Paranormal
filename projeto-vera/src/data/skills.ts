import type {
  Agent,
  AgentSkill,
  AgentSkillState,
  SkillDefinition,
  SkillKey,
} from "@/types/ordem";

export const SKILLS_LIST: SkillDefinition[] = [
  { key: "acrobacia", name: "Acrobacia", defaultAttribute: "AGI", trainedOnly: false, loadPenalty: true, usesKit: false, source: "livro_basico", description: "Amortecer quedas, equilibrar-se em superfícies estreitas, passar por espaços apertados e escapar de amarras." },
  { key: "adestramento", name: "Adestramento", defaultAttribute: "PRE", trainedOnly: true, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Acalmar, manejar, comandar e treinar animais." },
  { key: "artes", name: "Artes", defaultAttribute: "PRE", trainedOnly: true, loadPenalty: false, usesKit: true, source: "livro_basico", description: "Expressão artística, criação de obras, música, atuação e análise estética." },
  { key: "atletismo", name: "Atletismo", defaultAttribute: "FOR", trainedOnly: false, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Corrida, saltos, escalada, natação e feitos de esforço físico." },
  { key: "atualidades", name: "Atualidades", defaultAttribute: "INT", trainedOnly: false, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Conhecimentos gerais, notícias recentes, cultura pop, política e acontecimentos do mundo." },
  { key: "ciencias", name: "Ciências", defaultAttribute: "INT", trainedOnly: true, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Biologia, física, química, matemática e análise científica de evidências." },
  { key: "crime", name: "Crime", defaultAttribute: "AGI", trainedOnly: true, loadPenalty: true, usesKit: true, source: "livro_basico", description: "Arrombar fechaduras, furtar objetos, sabotar mecanismos e ocultar itens." },
  { key: "diplomacia", name: "Diplomacia", defaultAttribute: "PRE", trainedOnly: false, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Persuasão, negociação, mudar atitude de NPCs e acalmar aliados." },
  { key: "enganacao", name: "Enganação", defaultAttribute: "PRE", trainedOnly: false, loadPenalty: false, usesKit: true, source: "livro_basico", description: "Mentir, blefar, criar disfarces, falsificar documentos e fintar em combate." },
  { key: "fortitude", name: "Fortitude", defaultAttribute: "VIG", trainedOnly: false, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Resistência física contra venenos, doenças, fadiga e reação defensiva de Bloqueio." },
  { key: "furtividade", name: "Furtividade", defaultAttribute: "AGI", trainedOnly: false, loadPenalty: true, usesKit: false, source: "livro_basico", description: "Esconder-se, mover-se em silêncio e evitar detecção." },
  { key: "iniciativa", name: "Iniciativa", defaultAttribute: "AGI", trainedOnly: false, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Velocidade de reação no início de cenas de ação e ordem de turnos em combate." },
  { key: "intimidacao", name: "Intimidação", defaultAttribute: "PRE", trainedOnly: false, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Coagir, assustar e abalar a determinação de alvos." },
  { key: "intuicao", name: "Intuição", defaultAttribute: "PRE", trainedOnly: false, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Perceber mentiras, ler intenções ocultas e captar pressentimentos." },
  { key: "investigacao", name: "Investigação", defaultAttribute: "INT", trainedOnly: false, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Procurar pistas em cenas de crime, examinar documentos e conectar indícios." },
  { key: "luta", name: "Luta", defaultAttribute: "FOR", trainedOnly: false, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Ataques corpo a corpo, manobras de combate e reação de Contra-ataque." },
  { key: "medicina", name: "Medicina", defaultAttribute: "INT", trainedOnly: false, loadPenalty: false, usesKit: true, source: "livro_basico", description: "Primeiros socorros, estabilizar aliados morrendo, necropsia e tratamento de ferimentos." },
  { key: "ocultismo", name: "Ocultismo", defaultAttribute: "INT", trainedOnly: true, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Conhecimento sobre o Outro Lado, identificar criaturas/rituais e testes de Custo do Paranormal." },
  { key: "percepcao", name: "Percepção", defaultAttribute: "PRE", trainedOnly: false, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Notar detalhes, emboscadas, sons sutis e seres escondidos." },
  { key: "pilotagem", name: "Pilotagem", defaultAttribute: "AGI", trainedOnly: true, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Conduzir veículos terrestres, aquáticos ou aéreos sob pressão." },
  { key: "pontaria", name: "Pontaria", defaultAttribute: "AGI", trainedOnly: false, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Ataques à distância com armas de disparo, armas de fogo e arremesso." },
  { key: "profissao", name: "Profissão", defaultAttribute: "INT", trainedOnly: true, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Ofício especializado do investigador (ex.: Engenheiro, Psicólogo, Cozinheiro, Armeiro)." },
  { key: "reflexos", name: "Reflexos", defaultAttribute: "AGI", trainedOnly: false, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Esquivar-se de explosões, armadilhas e reação defensiva de Esquiva." },
  { key: "religiao", name: "Religião", defaultAttribute: "PRE", trainedOnly: true, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Teologia, mitologia, ritos religiosos e acalmar mentes perturbadas." },
  { key: "sobrevivencia", name: "Sobrevivência", defaultAttribute: "INT", trainedOnly: false, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Rastrear, orientar-se em ambientes hostis, acampar e resistir ao clima." },
  { key: "tatica", name: "Tática", defaultAttribute: "INT", trainedOnly: true, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Analisar terrenos, planejar emboscadas e coordenar ações de combate." },
  { key: "tecnologia", name: "Tecnologia", defaultAttribute: "INT", trainedOnly: true, loadPenalty: false, usesKit: true, source: "livro_basico", description: "Invadir sistemas digitais, operar equipamentos eletrônicos, drones e câmeras." },
  { key: "vontade", name: "Vontade", defaultAttribute: "PRE", trainedOnly: false, loadPenalty: false, usesKit: false, source: "livro_basico", description: "Resistência mental contra medo, Presença Perturbadora, rituais e manipulação." },
];

export const SKILLS_BY_KEY: Record<SkillKey, SkillDefinition> = SKILLS_LIST.reduce(
  (acc, skill) => {
    acc[skill.key] = skill;
    return acc;
  },
  {} as Record<SkillKey, SkillDefinition>
);

export const STANDARD_SKILL_KEYS = new Set<string>(
  SKILLS_LIST.map((s) => s.key)
);

export function createDefaultSkills(
  trainedSkills: SkillKey[] = []
): Record<SkillKey, AgentSkillState> {
  const trainedSet = new Set(trainedSkills);
  return SKILLS_LIST.reduce((acc, def) => {
    acc[def.key] = {
      attribute: def.defaultAttribute,
      training: trainedSet.has(def.key) ? 5 : 0,
      bonus: 0,
      hasKit: true,
    };
    return acc;
  }, {} as Record<SkillKey, AgentSkillState>);
}

/**
 * Builds a complete AgentSkill[] array from the legacy Record<SkillKey, AgentSkillState> map.
 */
export function buildSkillListFromRecord(
  record?: Partial<Record<SkillKey, AgentSkillState>>
): AgentSkill[] {
  return SKILLS_LIST.map((def) => {
    const st = record?.[def.key];
    return {
      id: def.key,
      nome: def.name,
      especializacao: def.key === "profissao" ? "" : undefined,
      descricao: def.description ?? "",
      atributoBase: st?.attribute ?? def.defaultAttribute,
      treinamento: (Number(st?.training) || 0) as AgentSkill["treinamento"],
      bonusOutros: Number(st?.bonus) || 0,
      somenteTreinada: def.trainedOnly,
      penalidadeCarga: def.loadPenalty,
      requerKit: def.usesKit,
      hasKit: st?.hasKit ?? true,
      isCustom: false,
    };
  });
}

/**
 * Safely returns the dynamic skill list of an agent, migrating legacy agents on the fly.
 */
export function getAgentSkillList(agent: Agent): AgentSkill[] {
  if (Array.isArray(agent.skillList) && agent.skillList.length > 0) {
    return agent.skillList.map((sk) => ({
      ...sk,
      treinamento: (Number(sk.treinamento) || 0) as AgentSkill["treinamento"],
      bonusOutros: Number(sk.bonusOutros) || 0,
    }));
  }
  return buildSkillListFromRecord(agent.skills);
}

/**
 * Updates `agent.skillList` and keeps `agent.skills` (Record<SkillKey, AgentSkillState>)
 * synchronized for all official engine calculations (Defesa/Esquiva/Bloqueio, Ataques, Ocultismo, Iniciativa).
 */
export function applyAgentSkillList(
  agent: Agent,
  nextList: AgentSkill[]
): Agent {
  const nextRecord: Record<SkillKey, AgentSkillState> = {
    ...createDefaultSkills(),
    ...agent.skills,
  };

  const presentIds = new Set<string>();
  for (const sk of nextList) {
    if (STANDARD_SKILL_KEYS.has(sk.id)) {
      const key = sk.id as SkillKey;
      presentIds.add(key);
      nextRecord[key] = {
        attribute: sk.atributoBase,
        training: (Number(sk.treinamento) || 0) as AgentSkill["treinamento"],
        bonus: Number(sk.bonusOutros) || 0,
        hasKit: sk.hasKit ?? true,
      };
    }
  }

  // If a standard skill was deleted from skillList, zero out its training/bonus in the map
  for (const def of SKILLS_LIST) {
    if (!presentIds.has(def.key)) {
      nextRecord[def.key] = {
        attribute: def.defaultAttribute,
        training: 0,
        bonus: 0,
        hasKit: true,
      };
    }
  }

  return {
    ...agent,
    skillList: nextList.map((sk) => ({
      ...sk,
      treinamento: (Number(sk.treinamento) || 0) as AgentSkill["treinamento"],
      bonusOutros: Number(sk.bonusOutros) || 0,
    })),
    skills: nextRecord,
  };
}

/**
 * Migrates and sanitizes a persisted or imported Agent so it always has numeric fields and a valid `skillList`.
 */
export function migrateAgentSkillList(agent: Agent): Agent {
  const rawSkills = agent.skills ?? ({} as Record<SkillKey, AgentSkillState>);
  const sanitizedSkills: Record<SkillKey, AgentSkillState> = {
    ...createDefaultSkills(),
  };
  for (const def of SKILLS_LIST) {
    const st = rawSkills[def.key];
    sanitizedSkills[def.key] = {
      attribute: st?.attribute ?? def.defaultAttribute,
      training: (Number(st?.training) || 0) as AgentSkillState["training"],
      bonus: Number(st?.bonus) || 0,
      hasKit: st?.hasKit ?? true,
    };
  }

  const sanitizedSkillList =
    Array.isArray(agent.skillList) && agent.skillList.length > 0
      ? agent.skillList.map((sk) => ({
          ...sk,
          treinamento: (Number(sk.treinamento) || 0) as AgentSkill["treinamento"],
          bonusOutros: Number(sk.bonusOutros) || 0,
        }))
      : buildSkillListFromRecord(sanitizedSkills);

  // Sync sanitizedSkillList into sanitizedSkills so both are 100% consistent
  for (const sk of sanitizedSkillList) {
    if (STANDARD_SKILL_KEYS.has(sk.id)) {
      const key = sk.id as SkillKey;
      sanitizedSkills[key] = {
        attribute: sk.atributoBase,
        training: (Number(sk.treinamento) || 0) as AgentSkill["treinamento"],
        bonus: Number(sk.bonusOutros) || 0,
        hasKit: sk.hasKit ?? true,
      };
    }
  }

  const rawRes = agent.defense?.resistances ?? {};
  const sanitizedResistances: Record<string, number> = {};
  for (const [k, v] of Object.entries(rawRes)) {
    sanitizedResistances[k] = Number(v) || 0;
  }

  return {
    ...agent,
    nex: Number(agent.nex) || 0,
    stage: agent.stage !== undefined ? Number(agent.stage) || 1 : undefined,
    transcenderCount: Number(agent.transcenderCount) || 0,
    permanentSanLoss: Number(agent.permanentSanLoss) || 0,
    ritualDTBonus: Number(agent.ritualDTBonus) || 0,
    attributes: {
      AGI: Number(agent.attributes?.AGI) || 0,
      FOR: Number(agent.attributes?.FOR) || 0,
      INT: Number(agent.attributes?.INT) || 0,
      PRE: Number(agent.attributes?.PRE) || 0,
      VIG: Number(agent.attributes?.VIG) || 0,
    },
    defense: {
      protectionBonus: Number(agent.defense?.protectionBonus) || 0,
      shieldBonus: Number(agent.defense?.shieldBonus) || 0,
      paranormalAccessoryBonus:
        Number(agent.defense?.paranormalAccessoryBonus) || 0,
      abilityBonus: Number(agent.defense?.abilityBonus) || 0,
      otherBonus: Number(agent.defense?.otherBonus) || 0,
      displacement:
        agent.defense?.displacement !== undefined
          ? Number(agent.defense.displacement) || 9
          : 9,
      resistances: sanitizedResistances,
    },
    skills: sanitizedSkills,
    skillList: sanitizedSkillList,
  };
}

/**
 * Formats skill display label including specialization (e.g. "Profissão (Psicólogo)").
 */
export function formatSkillDisplayName(skill: Pick<AgentSkill, "nome" | "especializacao">): string {
  const spec = skill.especializacao?.trim();
  return spec ? `${skill.nome} (${spec})` : skill.nome;
}
