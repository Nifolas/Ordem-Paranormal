import type { ClassDefinition } from "@/types/ordem";
import { getTrailsByClass } from "./trails";
import { COMMUNITY_CLASSES } from "./supplements/grimorioCataclisma";

export const CLASSES_LIST: ClassDefinition[] = [
  {
    id: "combatente",
    name: "Combatente",
    source: "livro_basico",
    description:
      "Treinado para lutar com todo tipo de armas e com a força e a coragem para encarar os perigos do Outro Lado de frente.",
    initialPv: 20,
    pvPerLevel: 4,
    initialPe: 2,
    pePerLevel: 2,
    initialSan: 12,
    sanPerLevel: 3,
    initialPd: 6,
    pdPerLevel: 3,
    trainingDegreeCountBase: 3,
    baseProficiencies: "Armas simples, armas táticas e proteções leves",
    defaultSkillCount: "(Luta ou Pontaria) + (Fortitude ou Reflexos) + 1 + INT",
    baseAbility: {
      name: "Ataque Especial",
      peCost: 2,
      description:
        "Quando faz um ataque, você pode gastar 2 PE para receber +5 no teste de ataque ou na rolagem de dano. Conforme o NEX aumenta, pode gastar mais PE para bônus maiores (+10/+15/+20).",
    },
    trilhas: getTrailsByClass("combatente"),
  },
  {
    id: "especialista",
    name: "Especialista",
    source: "livro_basico",
    description:
      "Um agente que confia mais em esperteza do que em força bruta. Versátil em perícias, investigação, furtividade e suporte tático.",
    initialPv: 16,
    pvPerLevel: 3,
    initialPe: 3,
    pePerLevel: 3,
    initialSan: 16,
    sanPerLevel: 4,
    initialPd: 8,
    pdPerLevel: 4,
    trainingDegreeCountBase: 5,
    baseProficiencies: "Armas simples e proteções leves",
    defaultSkillCount: "7 + INT perícias à escolha",
    baseAbility: {
      name: "Perito",
      peCost: 2,
      description:
        "Escolha duas perícias nas quais você é treinado (exceto Luta e Pontaria). Quando faz um teste de uma dessas perícias, pode gastar 2 PE para somar +1d6 no resultado.",
    },
    trilhas: getTrailsByClass("especialista"),
  },
  {
    id: "ocultista",
    name: "Ocultista",
    source: "livro_basico",
    description:
      "O Outro Lado é misterioso, perigoso e, de certa forma, cativante. Você estuda o paranormal para moldá-lo em rituais poderosos.",
    initialPv: 12,
    pvPerLevel: 2,
    initialPe: 4,
    pePerLevel: 4,
    initialSan: 20,
    sanPerLevel: 5,
    initialPd: 10,
    pdPerLevel: 5,
    trainingDegreeCountBase: 3,
    baseProficiencies: "Armas simples",
    defaultSkillCount: "Ocultismo + Vontade + 3 + INT",
    baseAbility: {
      name: "Escolhido pelo Outro Lado",
      peCost: 0,
      description:
        "Você começa com 3 rituais de 1º círculo em NEX 5% e aprende +1 ritual por aumento de NEX (2º círculo em 25%, 3º em 55%, 4º em 85%).",
    },
    trilhas: getTrailsByClass("ocultista"),
  },
  {
    id: "sobrevivente",
    name: "Sobrevivente",
    source: "sobrevivendo_ao_horror",
    description:
      "Modo de baixa exposição paranormal em NEX 0% (Estágios 1 a 5 — Sobrevivendo ao Horror). Pessoas comuns tentando sobreviver ao inexplicável.",
    initialPv: 8,
    pvPerLevel: 2,
    initialPe: 2,
    pePerLevel: 1,
    initialSan: 8,
    sanPerLevel: 2,
    initialPd: 4,
    pdPerLevel: 2,
    trainingDegreeCountBase: 1,
    baseProficiencies: "Armas simples",
    defaultSkillCount: "1 + INT perícias à escolha",
    baseAbility: {
      name: "Empenho",
      peCost: 1,
      description:
        "Quando faz um teste de perícia, você pode gastar 1 PE (limite fixo de 1 PE por turno) para receber +2 nesse teste.",
    },
    trilhas: getTrailsByClass("sobrevivente"),
  },
];

export const ALL_CLASSES: ClassDefinition[] = [
  ...CLASSES_LIST,
  ...COMMUNITY_CLASSES,
];

export function getClassById(id: string): ClassDefinition {
  return ALL_CLASSES.find((c) => c.id === id) ?? CLASSES_LIST[0];
}
