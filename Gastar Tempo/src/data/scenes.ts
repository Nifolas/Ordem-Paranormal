import type { AttributeKey } from "@/types/ordem";

export const INVESTIGATION_URGENCY_PRESETS = [
  { id: "muito_baixa", label: "Muito Baixa", rounds: 6 },
  { id: "baixa", label: "Baixa", rounds: 5 },
  { id: "media", label: "Média", rounds: 4 },
  { id: "alta", label: "Alta", rounds: 3 },
  { id: "muito_alta", label: "Muito Alta", rounds: 2 },
] as const;

export interface InvestigationEventDef {
  roll: number;
  title: string;
  effect: string;
  picksRandomAgent?: boolean;
  rollsRandomAttribute?: boolean;
  isNoEvent?: boolean;
}

export const INVESTIGATION_EVENTS_2D6: Record<number, InvestigationEventDef> = {
  2: {
    roll: 2,
    title: "Indício Traumático",
    effect:
      "Cada agente deve fazer um teste de Presença (DT 15). Quem falhar perde 1 ação no próximo interlúdio.",
  },
  3: {
    roll: 3,
    title: "Atenção Inesperada",
    effect:
      "Algo exige atenção imediata. 1 agente deve gastar sua ação na rodada para lidar com isso, ou a equipe perde -1 rodada disponível.",
  },
  4: {
    roll: 4,
    title: "Lembrança Opressiva",
    effect:
      "Até o fim da cena, sempre que um agente falhar em um teste de investigação, perde 1 PE (ou 1 PD).",
  },
  5: {
    roll: 5,
    title: "Momento de Tensão",
    effect:
      "Todos os agentes sofrem 1d4 de dano mental por Medo (Vontade DT 15 evita).",
  },
  6: {
    roll: 6,
    title: "Sem Evento",
    effect: "A investigação prossegue sem intercorrências nesta rodada.",
    isNoEvent: true,
  },
  7: {
    roll: 7,
    title: "Sem Evento",
    effect: "A investigação prossegue sem intercorrências nesta rodada.",
    isNoEvent: true,
  },
  8: {
    roll: 8,
    title: "Sem Evento",
    effect: "A investigação prossegue sem intercorrências nesta rodada.",
    isNoEvent: true,
  },
  9: {
    roll: 9,
    title: "Distração",
    effect: "Um agente aleatório da equipe sofre -1d20 em seus testes nesta rodada.",
    picksRandomAgent: true,
  },
  10: {
    roll: 10,
    title: "Ferimento",
    effect:
      "Um agente aleatório se machuca e sofre -2 em testes do atributo sorteado (1d10) até receber Medicina DT 20 ou Dormir em um interlúdio.",
    picksRandomAgent: true,
    rollsRandomAttribute: true,
  },
  11: {
    roll: 11,
    title: "Complicação",
    effect:
      "Todos os agentes sofrem -1d20 nos testes até que 1 agente gaste uma ação e passe em um teste de perícia apropriada (DT 20) para resolver.",
  },
  12: {
    roll: 12,
    title: "Auxílio Inesperado",
    effect:
      "Uma pista óbvia ou golpe de sorte ajuda a equipe: todos recebem +2 em testes de investigação nesta rodada.",
  },
};

export function mapD10ToAttribute(d10: number): AttributeKey {
  if (d10 <= 2) return "AGI";
  if (d10 <= 4) return "FOR";
  if (d10 <= 6) return "INT";
  if (d10 <= 8) return "PRE";
  return "VIG";
}

export interface ChaseEventItem {
  id: string;
  kind: "obstaculo" | "atalho";
  title: string;
  test: string;
  dt: number;
  effect: string;
}

export const CHASE_OBSTACLES: ChaseEventItem[] = [
  {
    id: "obs_entulhos",
    kind: "obstaculo",
    title: "Entulhos bloqueiam o caminho",
    test: "Força (Atletismo)",
    dt: 15,
    effect: "Falha impõe -2d20 no teste de Atletismo da perseguição nesta rodada.",
  },
  {
    id: "obs_piso",
    kind: "obstaculo",
    title: "Piso escorregadio",
    test: "Acrobacia",
    dt: 20,
    effect: "Falha impõe -2d20 no teste de Atletismo da perseguição nesta rodada.",
  },
  {
    id: "obs_rolando",
    kind: "obstaculo",
    title: "Entulho rola pelo caminho",
    test: "Reflexos",
    dt: 20,
    effect: "Falha impõe -2d20 no teste de Atletismo da perseguição nesta rodada.",
  },
  {
    id: "obs_multidao",
    kind: "obstaculo",
    title: "Multidão impedindo passagem",
    test: "Intimidação",
    dt: 20,
    effect: "Falha impõe -2d20 no teste de Atletismo da perseguição nesta rodada.",
  },
];

export const CHASE_SHORTCUTS: ChaseEventItem[] = [
  {
    id: "ata_pesado",
    kind: "atalho",
    title: "Caminho bloqueado por algo pesado",
    test: "Força (Atletismo)",
    dt: 15,
    effect: "Sucesso concede +2d20 no teste de Atletismo; falha impõe -2d20.",
  },
  {
    id: "ata_labirinto",
    kind: "atalho",
    title: "Vias labirínticas",
    test: "Percepção",
    dt: 20,
    effect: "Sucesso concede +2d20 no teste de Atletismo; falha impõe -2d20.",
  },
  {
    id: "ata_porta",
    kind: "atalho",
    title: "Porta trancada para atalho",
    test: "Crime",
    dt: 25,
    effect: "Sucesso concede +2d20 no teste de Atletismo; falha impõe -2d20.",
  },
  {
    id: "ata_vegetacao",
    kind: "atalho",
    title: "Caminho oculto por vegetação",
    test: "Sobrevivência",
    dt: 20,
    effect: "Sucesso concede +2d20 no teste de Atletismo; falha impõe -2d20.",
  },
];

export const CHASE_QUICK_ACTIONS = [
  {
    id: "cortar_caminho",
    label: "Cortar Caminho",
    summary: "-2d20 no teste de Atletismo; se passar, acumula +2 sucessos.",
    successDelta: 2,
  },
  {
    id: "esforco_extra",
    label: "Esforço Extra",
    summary:
      "+1d20 no teste; sofre dano de PV progressivo (1d4 na 1ª vez, 2d4 na 2ª, 3d4 na 3ª...).",
    rollsDamage: true,
  },
  {
    id: "criar_obstaculo",
    label: "Criar Obstáculo",
    summary:
      "Derruba objetos ou trava passagem (Atletismo/Crime DT 20) para impor -1d20 aos perseguidores.",
  },
  {
    id: "despistar",
    label: "Despistar",
    summary:
      "Substitui Atletismo por Furtividade ou Enganação contra Percepção/Intuição do perseguidor.",
  },
  {
    id: "sacrificio",
    label: "Sacrifício",
    summary:
      "Sofre 1 falha automática para conceder +1d20 ou +1 sucesso a um aliado na rodada.",
    failureDelta: 1,
  },
] as const;

export interface StealthEventDef {
  min: number;
  max: number;
  title: string;
  effect: string;
  applyMode:
    | "mental_damage"
    | "all_plus_2"
    | "random_plus_2"
    | "all_plus_1"
    | "random_plus_1"
    | "none"
    | "random_minus_1";
  delta: number;
}

export const STEALTH_EVENTS_1D20: StealthEventDef[] = [
  {
    min: 1,
    max: 2,
    title: "Algoz muito perto!",
    effect:
      "A presença da ameaça passa a centímetros. Todos sofrem 1d6 de dano mental (Vontade DT 15 reduz à metade).",
    applyMode: "mental_damage",
    delta: 0,
  },
  {
    min: 3,
    max: 5,
    title: "Iluminação ou Ruído Repentino",
    effect: "Todos os agentes aumentam sua Visibilidade em +2.",
    applyMode: "all_plus_2",
    delta: 2,
  },
  {
    min: 6,
    max: 8,
    title: "Passo em Falso",
    effect: "Um agente aleatório aumenta sua Visibilidade em +2.",
    applyMode: "random_plus_2",
    delta: 2,
  },
  {
    min: 9,
    max: 15,
    title: "Patrulha / Busca Ativa",
    effect: "Todos os agentes aumentam sua Visibilidade em +1.",
    applyMode: "all_plus_1",
    delta: 1,
  },
  {
    min: 16,
    max: 17,
    title: "Estalo / Sombra Suspeita",
    effect: "Um agente aleatório aumenta sua Visibilidade em +1.",
    applyMode: "random_plus_1",
    delta: 1,
  },
  {
    min: 18,
    max: 19,
    title: "Sem Efeito",
    effect: "O ambiente permanece silencioso. Nenhuma mudança na visibilidade.",
    applyMode: "none",
    delta: 0,
  },
  {
    min: 20,
    max: 20,
    title: "Cobertura Oportuna",
    effect: "Um agente aleatório reduz sua Visibilidade em -1 (mínimo 0).",
    applyMode: "random_minus_1",
    delta: -1,
  },
];

export function lookupStealthEvent(d20: number): StealthEventDef {
  return (
    STEALTH_EVENTS_1D20.find((e) => d20 >= e.min && d20 <= e.max) ??
    STEALTH_EVENTS_1D20[5]
  );
}
