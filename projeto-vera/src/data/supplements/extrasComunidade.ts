import type {
  AgentRitual,
  PowerDefinition,
  TrailDefinition,
} from "@/types/ordem";

/**
 * BLOCO A — Cards extras da Comunidade (source: comunidade_avulsos)
 * IDs sempre com prefixo `ext_` (regra anti-colisão).
 */

export const EXTRAS_TRAILS: TrailDefinition[] = [
  {
    id: "ext_dr_frankenstein",
    classId: "ocultista",
    name: "Dr. Frankenstein",
    source: "comunidade_avulsos",
    description:
      "Trilha de Ocultista dedicada a estudar, preservar e recombinar criaturas paranormais.",
    abilitiesByNex: [
      {
        nex: 10,
        name: "Análise Monstruosa",
        description:
          "Quanto mais tempo em combate com uma criatura, você recebe bônus (não cumulativos, aplicados no início da rodada): 2ª rodada +1 em testes de Resistência; 3ª rodada +1 na DT de Rituais; 4ª rodada +2 em testes de Resistência; 5ª rodada +2 na DT de Rituais; 6ª rodada +1 de dano por dado em rituais (ex.: 6d6 vira 6d6+6). Se já enfrentou esse tipo de criatura antes, conta como 1 rodada à frente. Reduz em I a categoria do Leitor Neural de Criaturas Paranormais.",
      },
      {
        nex: 40,
        name: "Preservação Assombrosa",
        description:
          "O cadáver de uma criatura demora o dobro do tempo para se decompor. Com Ciências ou Ocultismo (DT 25), você extrai 1 Essência de Criatura (líquido, 1 espaço, dura 1 semana se refrigerado). Beber a essência com uma ação de movimento reduz sua SAN atual pela metade e concede +5 em testes contra aquele tipo de criatura até o fim da cena.",
      },
      {
        nex: 65,
        name: "Réplica Aberrante",
        description:
          "Com 1 ação de interlúdio, você transforma até 5 essências em partes de criaturas que replicam 1 habilidade ativa (com custo de ação) daquela criatura, uma única vez, com as estatísticas originais. O Leitor Neural passa a ver períodos de 10 minutos em vez de 5.",
      },
      {
        nex: 99,
        name: "Recriando o Terror",
        description: "Você aprende o ritual Recriando o Terror (4º círculo, Medo).",
      },
    ],
  },
];

export const EXTRAS_CLASS_POWERS: PowerDefinition[] = [
  {
    id: "ext_aspecto_imperceptivel",
    name: "Aspecto Imperceptível",
    category: "classe",
    classId: "ocultista",
    prerequisites: "Veterano em Furtividade",
    peCost: 0,
    description:
      "Sua presença é imperceptível para criaturas no início da cena, até que você realize uma ação chamativa. O alvo escolhido fica Desprevenido contra o seu primeiro ataque se não tiver feito uma ação chamativa antes.",
    source: "comunidade_avulsos",
  },
];

export const EXTRAS_PARANORMAL_POWERS: PowerDefinition[] = [
  {
    id: "ext_imbuir_sistema",
    name: "Imbuir Sistema",
    category: "paranormal",
    element: "Sangue",
    prerequisites: "Sangue 2",
    peCost: 0,
    description:
      "Uma vez por rodada (ação livre), você concentra o Paranormal em uma parte do corpo. Cabeça: Faro, Visão na Penumbra e +2 para Observar/Ouvir. Articulações: +2 em Atletismo, Acrobacia e Reflexos. Pernas: +3m de deslocamento e ignora terreno difícil. Braços: +2 em testes de ataque corpo a corpo e +2 espaços de carga. Coração: +1d20 em Fortitude e RD 2 a dano físico.",
    affinityDescription:
      "Você pode imbuir duas partes do corpo ao mesmo tempo.",
    source: "comunidade_avulsos",
  },
];

export const EXTRAS_GENERAL_POWERS: PowerDefinition[] = [
  {
    id: "ext_desacreditado",
    name: "Desacreditado",
    category: "geral",
    prerequisites: "NEX 30%",
    peCost: 0,
    description:
      "Incompatível com Afinidade. Concede benefícios progressivos (retroativos se escolhido em NEX maior; não cumulativos entre si): 30% +2 em Vontade contra paranormal; 35% +2 Defesa contra criaturas; 40% +2 de dano contra criaturas; 45% +1 PV por NEX; 50% +1 atributo; 55% +2 em Fortitude contra paranormal; 60% +5 Defesa contra criaturas; 65% +2 em ataque contra criaturas; 70% +1 SAN por NEX; 75% +1 atributo (diferente); 80% +2 em Reflexos contra paranormal; 85% +5 em ataque contra criaturas; 90% +5 de dano; 95% +1 PE por NEX; 99% +1 atributo (diferente). Usar voluntariamente item amaldiçoado, poder paranormal ou ritual desativa este poder até o fim da missão; receber efeito aliado dessas fontes deixa você Alquebrado. Você não adquire novas alterações de NEX.",
    source: "comunidade_avulsos",
  },
];

export const EXTRAS_RITUALS: AgentRitual[] = [
  {
    id: "ext_recriando_o_terror",
    name: "Recriando o Terror",
    element: "Medo",
    circle: 4,
    execution: "Completa",
    range: "Toque",
    target: "4 partes de criaturas criadas por Réplica Aberrante",
    duration: "Cena",
    resistance: "Vontade (teste oposto)",
    peCost: 10,
    description:
      "Exclusivo da trilha Dr. Frankenstein. Combina 4 partes de criaturas para formar uma aberração paranormal sob controle parcial (teste oposto de Vontade + ação padrão para dar um comando na próxima rodada). 4 partes iguais: cria uma cópia da criatura com metade dos PV e sem RD (ela não ataca você). Partes diferentes: cria uma criatura de Medo com 1 habilidade ativa de cada criatura de origem e 4 grupos de estatísticas distribuídos entre as partes — Atributos e Testes; Defesa e Resistências; Imunidades e PV (metade dos PV da maior); Demais Estatísticas. A criatura se desfaz ao chegar a 0 PV ou no fim da cena.",
    source: "comunidade_avulsos",
  },
];
