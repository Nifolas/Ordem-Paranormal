import type { ContentSource, ParanormalElement, PowerDefinition } from "@/types/ordem";

/**
 * LOTE 4 — Todos os 24 Poderes Paranormais (Livro Básico v1.2 + Sobrevivendo ao Horror),
 * incluindo elemento, pré-requisito, efeito base e efeito de Afinidade (NEX 50%+).
 */
interface RawParanormalPower {
  id: string;
  nome: string;
  elemento: ParanormalElement;
  source: ContentSource;
  prereq: string;
  efeito: string;
  afinidade: string;
  peCost?: number;
}

const RAW_PARANORMAL_POWERS: RawParanormalPower[] = [
  // VARIÁVEL (2)
  { id: "aprender_ritual", nome: "Aprender Ritual", elemento: "Variável", source: "livro_basico", prereq: "", efeito: "Aprende e pode conjurar 1 ritual de 1º círculo (até 2º em NEX 45%, 3º em NEX 75%). Conta como poder do elemento do ritual escolhido.", afinidade: "Não possui efeito de afinidade." },
  { id: "resistir_elemento", nome: "Resistir a <Elemento>", elemento: "Variável", source: "livro_basico", prereq: "", efeito: "Escolhe Sangue, Morte, Conhecimento ou Energia: recebe RD 10 contra esse elemento e +2 em testes contra efeitos dele.", afinidade: "RD sobe para 20 e bônus em testes sobe para +5." },

  // SANGUE (5)
  { id: "anatomia_insana", nome: "Anatomia Insana", elemento: "Sangue", source: "livro_basico", prereq: "Sangue 2", efeito: "50% de chance (par em 1d4) de ignorar dano adicional de acertos críticos e ataques furtivos.", afinidade: "Imune aos efeitos extras de críticos e ataques furtivos." },
  { id: "arma_de_sangue", nome: "Arma de Sangue", elemento: "Sangue", source: "livro_basico", prereq: "", peCost: 2, efeito: "Movimento e 2 PE manifesta arma corpo a corpo de Sangue (1d6 corte, 20/x2, leve/ágil); 1x/turno gasta 1 PE para ataque extra com ela.", afinidade: "Arma permanente, dano sobe para 1d10." },
  { id: "sangue_de_ferro", nome: "Sangue de Ferro", elemento: "Sangue", source: "livro_basico", prereq: "", efeito: "+2 PV por 5% de NEX.", afinidade: "+5 em Fortitude e imune a venenos e doenças." },
  { id: "sangue_fervente", nome: "Sangue Fervente", elemento: "Sangue", source: "livro_basico", prereq: "Sangue 2", efeito: "Enquanto Machucado, recebe +1 em AGI ou FOR à escolha.", afinidade: "O bônus sobe para +2." },
  { id: "sangue_vivo", nome: "Sangue Vivo", elemento: "Sangue", source: "livro_basico", prereq: "Sangue 1", efeito: "Na 1ª vez que fica Machucado na cena, ganha Cura Acelerada 2 até deixar de estar Machucado ou acabar a cena.", afinidade: "Cura Acelerada sobe para 5." },

  // MORTE (6)
  { id: "encarar_a_morte", nome: "Encarar a Morte", elemento: "Morte", source: "livro_basico", prereq: "", efeito: "Em cenas de ação, seu limite de PE por turno aumenta em +1 (não afeta DT).", afinidade: "O aumento no limite de PE sobe para +2." },
  { id: "escapar_da_morte", nome: "Escapar da Morte", elemento: "Morte", source: "livro_basico", prereq: "Morte 1", efeito: "1x/cena, ao sofrer dano que reduziria PV a 0 (não massivo), fica com 1 PV.", afinidade: "Funciona mesmo contra dano massivo." },
  { id: "potencial_aprimorado", nome: "Potencial Aprimorado", elemento: "Morte", source: "livro_basico", prereq: "", efeito: "+1 PE por 5% de NEX.", afinidade: "Recebe +1 PE adicional por 5% de NEX (total +2/5% NEX)." },
  { id: "potencial_reaproveitado", nome: "Potencial Reaproveitado", elemento: "Morte", source: "livro_basico", prereq: "", efeito: "1x/rodada, ao passar em teste de resistência, ganha 2 PE temporários até o fim da cena.", afinidade: "Ganha 3 PE temporários." },
  { id: "surto_temporal", nome: "Surto Temporal", elemento: "Morte", source: "livro_basico", prereq: "Morte 2", peCost: 3, efeito: "1x/cena gasta 3 PE para realizar 1 ação padrão adicional no seu turno.", afinidade: "Pode usar 1x por rodada." },
  { id: "aura_de_pavor", nome: "Aura de Pavor", elemento: "Morte", source: "sobrevivendo_ao_horror", prereq: "", peCost: 2, efeito: "Movimento e 2 PE deixa 1 pessoa/animal em alcance médio apavorado (Vontade DT Pre reduz para abalado).", afinidade: "DT aumenta em +5 e afeta quaisquer pessoas/animais escolhidos no alcance." },

  // CONHECIMENTO (6)
  { id: "expansao_de_conhecimento", nome: "Expansão de Conhecimento", elemento: "Conhecimento", source: "livro_basico", prereq: "Conhecimento 1", efeito: "Aprende 1 poder de classe que não pertence à sua classe (cumprindo pré-requisitos).", afinidade: "Pode escolher um segundo poder de outra classe." },
  { id: "percepcao_paranormal", nome: "Percepção Paranormal", elemento: "Conhecimento", source: "livro_basico", prereq: "", efeito: "Em cenas de investigação, pode rolar novamente 1 dado com resultado menor que 10 ao procurar pistas.", afinidade: "Pode rolar novamente até 2 dados com resultado menor que 10." },
  { id: "precognicao", nome: "Precognição", elemento: "Conhecimento", source: "livro_basico", prereq: "Conhecimento 1", efeito: "+2 em Defesa e +2 em testes de resistência.", afinidade: "Fica imune à condição desprevenido." },
  { id: "sensitivo", nome: "Sensitivo", elemento: "Conhecimento", source: "livro_basico", prereq: "", efeito: "+5 em Diplomacia, Intimidação e Intuição.", afinidade: "Aprende e pode conjurar Detecção de Ameaças (ou -1 PE se já conhece)." },
  { id: "visao_do_oculto", nome: "Visão do Oculto", elemento: "Conhecimento", source: "livro_basico", prereq: "", efeito: "+5 em Percepção e enxerga no escuro.", afinidade: "Ignora camuflagem (inclusive total)." },
  { id: "absorver_conhecimento", nome: "Absorver Conhecimento", elemento: "Conhecimento", source: "sobrevivendo_ao_horror", prereq: "", peCost: 1, efeito: "Completa e 1 PE empunhando livro/texto obtém resposta armazenada automaticamente; aumenta dado da ação de interlúdio ler em 1 passo.", afinidade: "Ação reduz para padrão e soma +2 no teste com a informação." },

  // ENERGIA (5)
  { id: "afortunado", nome: "Afortunado", elemento: "Energia", source: "livro_basico", prereq: "", efeito: "1x/rolagem pode rerrolar 1 resultado '1' em qualquer dado que não seja d20.", afinidade: "1x/teste pode rerrolar 1 resultado '1' em um d20." },
  { id: "campo_protetor", nome: "Campo Protetor", elemento: "Energia", source: "livro_basico", prereq: "Energia 1", peCost: 1, efeito: "Ao usar a reação Esquiva, pode gastar 1 PE para ganhar +5 Defesa adicional.", afinidade: "Também recebe +5 em Reflexos e, ao passar em Reflexos que reduziria dano à metade, não sofre dano." },
  { id: "causalidade_fortuita", nome: "Causalidade Fortuita", elemento: "Energia", source: "livro_basico", prereq: "", efeito: "Em cenas de investigação, a DT para procurar pistas diminui em -5 para você até encontrar 1 pista.", afinidade: "A DT diminui em -5 para todas as pistas da cena." },
  { id: "golpe_de_sorte", nome: "Golpe de Sorte", elemento: "Energia", source: "livro_basico", prereq: "Energia 1", efeito: "+1 na margem de ameaça de seus ataques.", afinidade: "+1 no multiplicador de crítico de seus ataques." },
  { id: "manipular_entropia", nome: "Manipular Entropia", elemento: "Energia", source: "livro_basico", prereq: "Energia 1", peCost: 2, efeito: "Reação e 2 PE força alvo em alcance curto a rerrolar um dos dados em um teste de perícia (exceto ataques).", afinidade: "Alvo rerrola todos os dados do teste." },
  { id: "salto_de_dados", nome: "Salto de Dados", elemento: "Energia", source: "arquivos_secretos", prereq: "Energia 2", peCost: 2, efeito: "Gasta 2 PE para marcar símbolo no corpo (dura 1 dia). Como reação, gasta 3 PE para retornar PV, PE, condições e estado ao momento da marca, mas perde a memória do período e fica frustrado até o fim da cena.", afinidade: "Não sofre a condição frustrado ao retornar à marca." },
];

export const BASE_PARANORMAL_POWERS: PowerDefinition[] = RAW_PARANORMAL_POWERS.map((p) => ({
  id: p.id,
  name: p.nome,
  category: "paranormal",
  element: p.elemento,
  prerequisites: p.prereq || undefined,
  peCost: p.peCost ?? 0,
  description: p.efeito,
  affinityDescription: p.afinidade,
  source: p.source,
}));
