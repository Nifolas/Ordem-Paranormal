import type { ClassDefinition } from "@/types/ordem";

/**
 * Grimório do Cataclisma v0.3 — Classes completas (fórmulas e habilidades base).
 * As trilhas, poderes, origens, equipamentos e rituais deste suplemento dependem
 * do PDF original e devem ser adicionados neste diretório quando o arquivo estiver
 * disponível (IDs com prefixo `gdc_`).
 */
export const COMMUNITY_CLASSES: ClassDefinition[] = [
  {
    id: "devoto",
    name: "Devoto",
    source: "grimorio_do_cataclisma",
    description:
      "Guiado pela fé — ou por algo que se faz passar por ela —, o Devoto canaliza o paranormal por meio de devoção, bênçãos e rituais de Disruptura.",
    initialPv: 14,
    pvPerLevel: 2,
    initialPe: 3,
    pePerLevel: 3,
    initialSan: 18,
    sanPerLevel: 4,
    initialPd: 8,
    pdPerLevel: 4,
    trainingDegreeCountBase: 4,
    baseProficiencies: "Armas simples",
    defaultSkillCount: "Religião + Diplomacia + (4 + INT) à escolha",
    baseAbility: {
      name: "Abençoar & Disruptura",
      peCost: 2,
      description:
        "Abençoar: escolha 3 perícias treinadas (exceto Luta, Pontaria e Ocultismo); um aliado recebe bônus nelas (5%: 2 PE/+1d6; 40%: 4 PE/+1d8; 75%: 6 PE/+1d10). Disruptura: você conjura rituais — 1º círculo em 5%, 2º em 25%, 3º em 55% e 4º em 85%. Começa com 2 rituais de 1º círculo e aprende +1 a cada novo círculo desbloqueado, fora do limite.",
    },
    trilhas: [],
  },
  {
    id: "predador",
    name: "Predador",
    source: "grimorio_do_cataclisma",
    description:
      "Caçador marcado pelo Outro Lado, o Predador persegue alvos com armas amaldiçoadas e instinto implacável.",
    initialPv: 18,
    pvPerLevel: 4,
    initialPe: 2,
    pePerLevel: 3,
    initialSan: 14,
    sanPerLevel: 3,
    initialPd: 6,
    pdPerLevel: 3,
    trainingDegreeCountBase: 3,
    baseProficiencies: "Armas simples e armas táticas",
    defaultSkillCount:
      "(Luta ou Pontaria) + (Percepção ou Sobrevivência) + (3 + INT) à escolha",
    baseAbility: {
      name: "Marca da Maldição & Presa Marcada",
      peCost: 2,
      description:
        "Marca da Maldição: começa com 1 arma, proteção ou utensílio amaldiçoado (perde 1 SAN ao falhar em teste do atributo da maldição; reduz em 1 o limite de itens Cat I). Presa Marcada: marca 1 alvo (5%: 2 PE/+1d6; 25%: 3 PE/+1d8; 55%: 4 PE/+1d10; 85%: 5 PE/+1d12). No 1º turno vale para todos os aliados, exceto rituais; depois, só para você.",
    },
    trilhas: [],
  },
];
