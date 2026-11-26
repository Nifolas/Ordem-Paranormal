import type { OrganizationId } from "@/types/ordem";

export interface OrganizationDefinition {
  id: OrganizationId;
  name: string;
  summary: string;
  abilityName: string;
  abilityDescription: string;
  rules: string[];
}

export const DEFAULT_ORGANIZATION: OrganizationId = "ordo_realitas";

export const ORGANIZATIONS: OrganizationDefinition[] = [
  {
    id: "ordo_realitas",
    name: "Ordo Realitas",
    summary: "Regras padrão do Livro Básico.",
    abilityName: "—",
    abilityDescription: "Sem habilidade adicional.",
    rules: ["Regras padrão do Livro Básico."],
  },
  {
    id: "hell_hunters",
    name: "Hell Hunters",
    summary: "Armas com categoria -1; sem itens paranormais fornecidos.",
    abilityName: "Arsenal de Qualidade",
    abilityDescription:
      "+3 de dano com armas; +5 a partir da patente Oficial de Operações.",
    rules: [
      "Todas as armas têm categoria -1.",
      "Proíbe itens paranormais/amaldiçoados fornecidos pela organização.",
      "Possui tabela própria de PP/Crédito (consulte o suplemento).",
    ],
  },
  {
    id: "famiglia_leone",
    name: "Famiglia Leone",
    summary: "Recruta com Crédito Médio; paranormais com categoria +1.",
    abilityName: "Contrabando Leone",
    abilityDescription:
      "1x por missão, solicita equipamentos/veículos conforme a patente.",
    rules: [
      "Recruta começa com Crédito Médio.",
      "Itens paranormais/amaldiçoados têm categoria +1.",
    ],
  },
  {
    id: "obscurite",
    name: "Obscurité",
    summary: "Sem armas pesadas fornecidas; paranormais com categoria -1.",
    abilityName: "Treinamento da Obscurité",
    abilityDescription:
      "Aprende 1 ritual extra em NEX 10% e a cada +15% de NEX.",
    rules: [
      "Proíbe armas pesadas fornecidas.",
      "Itens paranormais/amaldiçoados têm categoria -1.",
    ],
  },
  {
    id: "ordo_calamitas",
    name: "Ordo Calamitas",
    summary: "Créditos elevados e Transcender amenizado.",
    abilityName: "Guerreiro da Calamidade",
    abilityDescription:
      "Ao Transcender, perde apenas 2 pontos da SAN daquele nível em vez de zerar o ganho.",
    rules: [
      "Recruta com Crédito Médio; Agente Especial com Crédito Alto.",
    ],
  },
];

export function getOrganization(id: OrganizationId | undefined) {
  return ORGANIZATIONS.find((o) => o.id === id) ?? ORGANIZATIONS[0];
}
