import type { OptionalRuleDefinition } from "@/types/ordem";

/**
 * LOTE 7 (Parte B) — Todas as 16 Regras Opcionais Oficiais:
 * - 6 do Livro Básico
 * - 9 de Sobrevivendo ao Horror
 * - 1 dos Arquivos Secretos
 */
export const OPTIONAL_RULES_LIST: OptionalRuleDefinition[] = [
  // LIVRO BÁSICO (6)
  {
    id: "nex_0_mundano",
    name: "Personagens de NEX 0%",
    source: "livro_basico",
    summary: "Criação de civis comuns antes do recrutamento pela Ordem.",
    mechanicalEffect: "Permite jogar com humanos comuns sem treinamento paranormal inicial.",
  },
  {
    id: "idade_variada",
    name: "Personagens de Idade Variada",
    source: "livro_basico",
    summary: "Ajustes de atributos/poderes para jovens, adultos ou idosos.",
    mechanicalEffect: "Aplica modificadores de idade (ex.: maturidade vs. vigor físico).",
  },
  {
    id: "contagem_municao",
    name: "Contagem de Munição",
    source: "livro_basico",
    summary: "Controle exato de balas por pente em vez de pacotes por cena.",
    mechanicalEffect: "Exige controle individual de disparos e recargas em combate.",
  },
  {
    id: "lesoes",
    name: "Lesões",
    source: "livro_basico",
    summary: "Dano massivo ou cair morrendo pode causar sequelas físicas.",
    mechanicalEffect: "Aplica sequelas duradouras até tratamento médico adequado.",
  },
  {
    id: "inspiracao_resoluta",
    name: "Inspiração Resoluta",
    source: "livro_basico",
    summary: "Recupera PE/SAN ao realizar feitos heroicos ou interpretar objetivos.",
    mechanicalEffect: "Recompensa interpretação alinhada aos objetivos do agente.",
  },
  {
    id: "loucura_nao_letal",
    name: "Loucura Não Letal",
    source: "livro_basico",
    summary: "Zerar SAN gera traumas/efeitos duradouros em vez de perda definitiva imediata do personagem.",
    mechanicalEffect: "Substitui perda irreversível do personagem por efeitos psicológicos persistentes.",
  },

  // SOBREVIVENDO AO HORROR (9)
  {
    id: "nex_e_experiencia",
    name: "NEX & Experiência",
    source: "sobrevivendo_ao_horror",
    summary: "Separa Nível de Experiência (1–20, classe/status) de NEX (0–99%, exposição/alterações paranormais).",
    mechanicalEffect: "Evolução de PV/PE/SAN/poderes segue Nível (1–20) independente do NEX.",
  },
  {
    id: "jogando_sem_sanidade",
    name: "Jogando sem Sanidade (PD)",
    source: "sobrevivendo_ao_horror",
    summary: "Substitui PE e SAN pela estatística unificada Pontos de Determinação (PD).",
    mechanicalEffect: "Unifica PE e SAN em uma barra única de PD na ficha e no Escudo do Mestre.",
  },
  {
    id: "ferimentos_debilitantes",
    name: "Ferimentos Debilitantes",
    source: "sobrevivendo_ao_horror",
    summary: "Dano pesado impõe fraturas, sangramentos e sequelas específicas.",
    mechanicalEffect: "Impõe penalidades mecânicas específicas ao sofrer dano severo.",
  },
  {
    id: "jogando_sem_mapa",
    name: "Jogando sem Mapa",
    source: "sobrevivendo_ao_horror",
    summary: "Combate por zonas abstratas de alcance (adjacente, curto, médio, longo).",
    mechanicalEffect: "Substitui grid tático por posicionamento narrativo em zonas.",
  },
  {
    id: "evolucao_por_patentes",
    name: "Evolução por Patentes",
    source: "sobrevivendo_ao_horror",
    summary: "Substitui 20 níveis pelas 5 patentes da Ordem (Limites de PD: 1, 3, 6, 10, 15).",
    mechanicalEffect: "Recruta=1, Operador=3, Agente Especial=6, Oficial=10, Elite=15.",
  },
  {
    id: "limites_compreensao",
    name: "Os Limites da Compreensão Humana",
    source: "sobrevivendo_ao_horror",
    summary: "Aprender rituais exige fontes físicas (grimórios, pergaminhos, artefatos).",
    mechanicalEffect: "Impede aprender rituais espontaneamente sem acesso a fonte ocultista.",
  },
  {
    id: "conjuracao_complexa",
    name: "Conjuração Complexa",
    source: "sobrevivendo_ao_horror",
    summary: "Conjurar rituais exige etapas de preparo, desenho de símbolos e canalização.",
    mechanicalEffect: "Aumenta o risco e o tempo necessário para invocar rituais em cena.",
  },
  {
    id: "rituais_desconhecidos",
    name: "Conjurando Rituais Desconhecidos",
    source: "sobrevivendo_ao_horror",
    summary: "Permite arriscar conjurar um ritual lendo direto de uma fonte sem tê-lo aprendido.",
    mechanicalEffect: "Exige testes elevados de Ocultismo e risco ampliado de perda de SAN.",
  },
  {
    id: "combate_narrativo",
    name: "Combate Narrativo",
    source: "sobrevivendo_ao_horror",
    summary: "Resolve confrontos de forma cinematográfica com foco em sobrevivência e tensão.",
    mechanicalEffect: "Prioriza testes dramáticos e consequências narrativas rápidas.",
  },

  // ARQUIVOS SECRETOS (3)
  {
    id: "reter_ritual",
    name: "Reter Ritual",
    source: "arquivos_secretos",
    summary: "Permite manter um ritual ativo reduzindo seu PE máximo enquanto retido.",
    mechanicalEffect: "O conjurador reserva PE do seu total máximo para manter o ritual engatilhado.",
  },
  {
    id: "transcender_itens",
    name: "Transcender com Itens Amaldiçoados",
    source: "arquivos_secretos",
    summary: "Consome um item amaldiçoado no interlúdio para receber 1 poder paranormal do mesmo elemento (limites por faixa de NEX: 1/2/3/4).",
    mechanicalEffect: "Permite converter itens amaldiçoados em poderes paranormais do elemento correspondente.",
  },
  {
    id: "evolucao_modular",
    name: "Evolução Modular",
    source: "arquivos_secretos",
    summary: "Recebe poderes de utilidade em NEX pares (10%, 20%...) e poderes de combate em NEX ímpares (15%, 25%...).",
    mechanicalEffect: "Alterna progressão de poderes utilitários e ofensivos ao longo dos marcos de NEX.",
  },
];
