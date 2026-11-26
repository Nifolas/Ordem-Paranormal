import type { AgentAlly, AllyTemplateId, AllyType, SkillKey } from "@/types/ordem";

export interface AllyTemplateDefinition {
  id: AllyTemplateId;
  name: string;
  kind: AllyType;
  sourceLabel: string;
  bonusSummary: string;
  skillFlatBonuses?: Partial<Record<SkillKey, number>>;
  skillDiceBonuses?: Partial<Record<SkillKey, number>>;
  trainedSkills?: SkillKey[];
  attackDiceBonus?: number;
  dispensesRitualComponents?: boolean;
  requiresSkillChoice?: {
    count: number;
    maxCount?: number;
    mode: "trained" | "flat2";
    exclude?: SkillKey[];
    prompt: string;
  };
  abilityName: string;
  abilityPeCost: number;
  abilityDescription: string;
  abilityRollFormula?: string;
  defaultCombatStats?: {
    petPv: number;
    petDefense: number;
    petAttack: string;
  };
}

export const ALLY_TEMPLATES: AllyTemplateDefinition[] = [
  {
    id: "acolito",
    name: "Acólito",
    kind: "aliado",
    sourceLabel: "Livro Básico",
    bonusSummary: "+1d20 em Ocultismo e dispensa componentes ritualísticos.",
    skillDiceBonuses: { ocultismo: 1 },
    dispensesRitualComponents: true,
    abilityName: "Conjuração Conjunta",
    abilityPeCost: 1,
    abilityDescription:
      "Gasta 1 PE ao conjurar um ritual para aumentar a DT do ritual em +2.",
  },
  {
    id: "faz_tudo",
    name: "Faz-Tudo",
    kind: "aliado",
    sourceLabel: "Livro Básico",
    bonusSummary:
      "Você conta como treinado em 2 perícias à escolha (exceto Luta e Pontaria).",
    requiresSkillChoice: {
      count: 2,
      maxCount: 2,
      mode: "trained",
      exclude: ["luta", "pontaria"],
      prompt: "Escolha 2 perícias (exceto Luta e Pontaria)",
    },
    abilityName: "Dica Valiosa",
    abilityPeCost: 1,
    abilityDescription:
      "Gasta 1 PE ao fazer um teste de uma das perícias do Faz-Tudo para somar +1d6 no resultado.",
    abilityRollFormula: "1d6",
  },
  {
    id: "guerrilheiro",
    name: "Guerrilheiro",
    kind: "aliado",
    sourceLabel: "Livro Básico",
    bonusSummary: "+1d20 em testes de ataque.",
    attackDiceBonus: 1,
    abilityName: "Ataque Conjunto",
    abilityPeCost: 1,
    abilityDescription:
      "Gasta 1 PE ao acertar um ataque para somar +1d8 de dano extra no alvo.",
    abilityRollFormula: "1d8",
  },
  {
    id: "socorrista",
    name: "Socorrista",
    kind: "aliado",
    sourceLabel: "Livro Básico",
    bonusSummary: "Você conta como treinado em Medicina.",
    trainedSkills: ["medicina"],
    abilityName: "Bolsa de Remédios",
    abilityPeCost: 1,
    abilityDescription:
      "Gasta 1 PE (ação de movimento) para curar 1d8+1 PV em si mesmo ou em um aliado adjacente.",
    abilityRollFormula: "1d8+1",
  },
  {
    id: "cao_adestrado",
    name: "Cão Adestrado",
    kind: "pet",
    sourceLabel: "Sobrevivendo ao Horror",
    bonusSummary: "+2 em Investigação e Percepção.",
    skillFlatBonuses: { investigacao: 2, percepcao: 2 },
    abilityName: "Ladrar e Morder",
    abilityPeCost: 1,
    abilityDescription:
      "Gasta 1 PE para o cão distrair o agressor, concedendo +2 na Defesa por 1 rodada.",
    defaultCombatStats: {
      petPv: 15,
      petDefense: 14,
      petAttack: "Mordida 1d6+1 (Perfuração)",
    },
  },
  {
    id: "companheiro_animal",
    name: "Companheiro Animal / Pai de Pet",
    kind: "pet",
    sourceLabel: "Sobrevivendo ao Horror",
    bonusSummary: "+2 em 1 ou 2 perícias escolhidas vinculadas ao pet.",
    requiresSkillChoice: {
      count: 1,
      maxCount: 2,
      mode: "flat2",
      prompt: "Escolha 1 ou 2 perícias para receber +2",
    },
    abilityName: "Apoio Fiel",
    abilityPeCost: 1,
    abilityDescription:
      "Gasta 1 PE para acionar o truque ou apoio especial do seu companheiro animal.",
    defaultCombatStats: {
      petPv: 12,
      petDefense: 13,
      petAttack: "Investida 1d4+1",
    },
  },
];

export function buildAllyFromTemplate(params: {
  id: string;
  template: AllyTemplateDefinition;
  customName?: string;
  chosenSkills?: SkillKey[];
  customAbilityName?: string;
  customAbilityDescription?: string;
}): AgentAlly {
  const { template, chosenSkills = [] } = params;
  const skillFlatBonuses: Partial<Record<SkillKey, number>> = {
    ...(template.skillFlatBonuses ?? {}),
  };
  let trainedSkills = template.trainedSkills ? [...template.trainedSkills] : undefined;
  let bonusSummary = template.bonusSummary;

  if (template.requiresSkillChoice && chosenSkills.length > 0) {
    if (template.requiresSkillChoice.mode === "trained") {
      trainedSkills = chosenSkills;
      bonusSummary = `Treinado em ${chosenSkills.join(", ")}.`;
    } else {
      for (const sk of chosenSkills) {
        skillFlatBonuses[sk] = 2;
      }
      bonusSummary = `+2 em ${chosenSkills.join(", ")}.`;
    }
  }

  return {
    id: params.id,
    templateId: template.id,
    name: params.customName?.trim() || template.name,
    kind: template.kind,
    helping: true,
    bonusSummary,
    skillFlatBonuses:
      Object.keys(skillFlatBonuses).length > 0 ? skillFlatBonuses : undefined,
    skillDiceBonuses: template.skillDiceBonuses
      ? { ...template.skillDiceBonuses }
      : undefined,
    trainedSkills,
    attackDiceBonus: template.attackDiceBonus,
    dispensesRitualComponents: template.dispensesRitualComponents,
    abilityName: params.customAbilityName?.trim() || template.abilityName,
    abilityPeCost: template.abilityPeCost,
    abilityDescription:
      params.customAbilityDescription?.trim() || template.abilityDescription,
    abilityRollFormula: template.abilityRollFormula,
    dangerRuleEnabled: false,
    wounds: 0,
    combatStatsEnabled: false,
    petPv: template.defaultCombatStats?.petPv ?? 12,
    petMaxPv: template.defaultCombatStats?.petPv ?? 12,
    petDefense: template.defaultCombatStats?.petDefense ?? 12,
    petAttack: template.defaultCombatStats?.petAttack ?? "Ataque 1d4",
  };
}
