import type { ContentSource, PowerDefinition } from "@/types/ordem";

/**
 * LOTE 3 (Parte B) — Todos os 18 Poderes Gerais (Sobrevivendo ao Horror).
 */
interface RawGeneralPower {
  id: string;
  nome: string;
  source: ContentSource;
  prereq: string;
  descricao: string;
  peCost?: number;
}

const RAW_GENERAL_POWERS: RawGeneralPower[] = [
  { id: "acrobatico", nome: "Acrobático", source: "sobrevivendo_ao_horror", prereq: "AGI 2", descricao: "Treino (ou +2) em Acrobacia; levanta-se como ação livre e ignora terreno difícil ao correr." },
  { id: "as_do_volante", nome: "Ás do Volante", source: "sobrevivendo_ao_horror", prereq: "AGI 2", peCost: 2, descricao: "Treino (ou +2) em Pilotagem; gasta 2 PE para +5 em Pilotagem ou evitar dano de colisão." },
  { id: "atletico", nome: "Atlético", source: "sobrevivendo_ao_horror", prereq: "FOR 2", descricao: "Treino (ou +2) em Atletismo e +3m de deslocamento." },
  { id: "atraente", nome: "Atraente", source: "sobrevivendo_ao_horror", prereq: "PRE 2", descricao: "+5 em Diplomacia, Enganação e Artes contra pessoas que possam se sentir atraídas por você." },
  { id: "combate_adaptavel", nome: "Combate Adaptável", source: "sobrevivendo_ao_horror", prereq: "INT 2", descricao: "Sem penalidade ao usar armas improvisadas; dano delas aumenta em 1 passo." },
  { id: "detector_de_mentiras", nome: "Detector de Mentiras", source: "sobrevivendo_ao_horror", prereq: "PRE 2", peCost: 2, descricao: "Treino (ou +2) em Intuição; gasta 2 PE para +5 em Intuição contra Enganação." },
  { id: "foco_em_pericia", nome: "Foco em Perícia", source: "sobrevivendo_ao_horror", prereq: "Treinado na perícia", peCost: 2, descricao: "Escolhe 1 perícia treinada (exceto Luta/Pontaria); pode gastar 2 PE para +1d20 no teste." },
  { id: "mentiroso_nato", nome: "Mentiroso Nato", source: "sobrevivendo_ao_horror", prereq: "PRE 2", peCost: 2, descricao: "Treino (ou +2) em Enganação; gasta 2 PE para rerrolar falha em Enganação." },
  { id: "palavras_de_devocao", nome: "Palavras de Devoção", source: "sobrevivendo_ao_horror", prereq: "PRE 2", peCost: 3, descricao: "Treino (ou +2) em Religião; 1x/cena completa e 3 PE dá RD mental 5 na cena para até 2x PRE pessoas." },
  { id: "parceiro", nome: "Parceiro", source: "sobrevivendo_ao_horror", prereq: "Diplomacia, NEX 30%", descricao: "Recebe um aliado fixo de um tipo à escolha (OPRPG p. 170)." },
  { id: "persuasivo", nome: "Persuasivo", source: "sobrevivendo_ao_horror", prereq: "PRE 2", peCost: 2, descricao: "Treino (ou +2) em Diplomacia; reduz tempo de persuasão e pode gastar 2 PE para +5." },
  { id: "racionalidade_inflexivel", nome: "Racionalidade Inflexível", source: "sobrevivendo_ao_horror", prereq: "INT 3", descricao: "Usa INT em vez de PRE em Vontade e para calcular PE (ou PD) iniciais e por nível." },
  { id: "saque_rapido_geral", nome: "Saque Rápido", source: "sobrevivendo_ao_horror", prereq: "Iniciativa", descricao: "Saca/guarda itens como livre; recarga diminui em 1 passo." },
  { id: "sentidos_agucados", nome: "Sentidos Aguçados", source: "sobrevivendo_ao_horror", prereq: "PRE 2", descricao: "Treino (ou +2) em Percepção; não fica desprevenido contra inimigos invisíveis e rerrola chance de falha por camuflagem." },
  { id: "sorrateiro", nome: "Sorrateiro", source: "sobrevivendo_ao_horror", prereq: "AGI 2", descricao: "Treino (ou +2) em Furtividade; reduz penalidades em cenas de furtividade." },
  { id: "teimosia_obstinada", nome: "Teimosia Obstinada", source: "sobrevivendo_ao_horror", prereq: "PRE 2", peCost: 2, descricao: "Treino (ou +2) em Vontade; gasta 2 PE para +5 em Vontade contra condições mentais ou mudança de atitude." },
  { id: "vitalidade_reforcada", nome: "Vitalidade Reforçada", source: "sobrevivendo_ao_horror", prereq: "VIG 2", descricao: "+1 PV a cada 5% de NEX (ou +2 PV/estágio) e +2 em Fortitude." },
  { id: "vontade_inabalavel", nome: "Vontade Inabalável", source: "sobrevivendo_ao_horror", prereq: "PRE 2", descricao: "+1 PE a cada 10% de NEX e +2 em Vontade." },
  { id: "pratica_materiais_ritualisticos", nome: "Prática com Materiais Ritualísticos", source: "arquivos_secretos", prereq: "INT 2, Ocultismo, conjurar rituais", descricao: "Ao executar conjuração complexa, não sofre penalidade para empregar materiais específicos de uma Entidade na 1ª etapa." },
  { id: "sintonizacao_mental_arma", nome: "Sintonização Mental com Arma", source: "arquivos_secretos", prereq: "INT 2 ou PRE 2, Ocultismo, conjurar rituais", peCost: 3, descricao: "Ação de interlúdio e 3 PE sintoniza 1 arma empunhada até o próximo interlúdio para usar um atributo à escolha em ataques e dano." },
];

export const BASE_GENERAL_POWERS: PowerDefinition[] = RAW_GENERAL_POWERS.map((p) => ({
  id: p.id,
  name: p.nome,
  category: "geral",
  prerequisites: p.prereq || undefined,
  peCost: p.peCost ?? 0,
  description: p.descricao,
  source: p.source,
}));
