import type { AgentClassId, ContentSource, PowerDefinition } from "@/types/ordem";

/**
 * LOTE 3 (Parte A) — Todos os Poderes de Classe (Combatente, Especialista e Ocultista):
 * Livro Básico v1.2 + Sobrevivendo ao Horror + Arquivos Secretos.
 */
interface RawClassPower {
  id: string;
  nome: string;
  classe: AgentClassId;
  source: ContentSource;
  prereq: string;
  descricao: string;
  peCost?: number;
}

const RAW_CLASS_POWERS: RawClassPower[] = [
  // COMBATENTE (19)
  { id: "armamento_pesado", nome: "Armamento Pesado", classe: "combatente", source: "livro_basico", prereq: "FOR 2", descricao: "Recebe proficiência com armas pesadas." },
  { id: "artista_marcial_comb", nome: "Artista Marcial", classe: "combatente", source: "livro_basico", prereq: "", descricao: "Ataques desarmados causam 1d6 (1d8 NEX 35%, 1d10 NEX 70%), são ágeis e letais." },
  { id: "ataque_de_oportunidade", nome: "Ataque de Oportunidade", classe: "combatente", source: "livro_basico", prereq: "", peCost: 1, descricao: "Quando inimigo sai de espaço adjacente, reação e 1 PE para fazer 1 ataque corpo a corpo." },
  { id: "combate_defensivo", nome: "Combate Defensivo", classe: "combatente", source: "livro_basico", prereq: "INT 2", descricao: "Ao usar ação agredir, pode sofrer -1d20 nos ataques para ganhar +5 Defesa até seu próximo turno." },
  { id: "combater_duas_armas", nome: "Combater com Duas Armas", classe: "combatente", source: "livro_basico", prereq: "AGI 3, Luta ou Pontaria", descricao: "Empunhando duas armas (ao menos uma leve), ao agredir faz 1 ataque extra com -1d20 em todos (sem penalidade se ambas leves)." },
  { id: "golpe_demolidor", nome: "Golpe Demolidor", classe: "combatente", source: "livro_basico", prereq: "FOR 2, Luta", peCost: 1, descricao: "Ao usar manobra quebrar ou atacar objeto, gasta 1 PE para +2 dados de dano do mesmo tipo." },
  { id: "golpe_pesado", nome: "Golpe Pesado", classe: "combatente", source: "livro_basico", prereq: "", descricao: "O dano de suas armas corpo a corpo aumenta em +1 dado do mesmo tipo." },
  { id: "incansavel", nome: "Incansável", classe: "combatente", source: "livro_basico", prereq: "", peCost: 2, descricao: "1x/cena gasta 2 PE para fazer 1 ação de investigação adicional usando FOR ou AGI." },
  { id: "protecao_pesada", nome: "Proteção Pesada", classe: "combatente", source: "livro_basico", prereq: "NEX 30%", descricao: "Recebe proficiência com proteções pesadas." },
  { id: "reflexos_defensivos", nome: "Reflexos Defensivos", classe: "combatente", source: "livro_basico", prereq: "AGI 2", descricao: "Recebe +2 em Defesa e +2 em testes de resistência." },
  { id: "saque_rapido", nome: "Saque Rápido", classe: "combatente", source: "livro_basico", prereq: "Iniciativa", descricao: "Saca/guarda itens como ação livre; recarregar armas cai um passo (movimento vira livre)." },
  { id: "segurar_o_gatilho", nome: "Segurar o Gatilho", classe: "combatente", source: "livro_basico", prereq: "NEX 60%", peCost: 2, descricao: "Ao acertar ataque com arma de fogo, gasta 2 PE para novo ataque no mesmo alvo (custo +2 PE por repetição)." },
  { id: "sentido_tatico", nome: "Sentido Tático", classe: "combatente", source: "livro_basico", prereq: "INT 2, Percepção e Tática", peCost: 2, descricao: "Padrão e 2 PE analisa cena de combate; soma INT na Defesa e em Reflexos até o fim da cena." },
  { id: "tanque_de_guerra", nome: "Tanque de Guerra", classe: "combatente", source: "livro_basico", prereq: "Proteção Pesada", descricao: "Usando proteção pesada, Defesa e RD fornecidas por ela aumentam em +2." },
  { id: "tiro_certeiro", nome: "Tiro Certeiro", classe: "combatente", source: "livro_basico", prereq: "Pontaria", descricao: "Sem penalidade de disparo em combate corpo a corpo; soma AGI no dano de armas de disparo." },
  { id: "tiro_de_cobertura", nome: "Tiro de Cobertura", classe: "combatente", source: "livro_basico", prereq: "", peCost: 1, descricao: "Padrão e 1 PE dispara na direção de inimigo: ele faz Vontade (DT Agi) ou não sai do lugar; até próximo turno aliados têm +5 Defesa contra ele." },
  { id: "paranoia_defensiva", nome: "Paranoia Defensiva", classe: "combatente", source: "sobrevivendo_ao_horror", prereq: "", peCost: 2, descricao: "Gasta PE para receber +5 em um único teste de perícia feito até o fim da cena." },
  { id: "guardiao_da_tropa", nome: "Guardião da Tropa", classe: "combatente", source: "arquivos_secretos", prereq: "Ataque Especial, Casca Grossa", peCost: 2, descricao: "Reação e 2 PE para sofrer ataque/habilidade de alvo único destinado a aliado adjacente; se não vencer Defesa/resistir, recupera 1 SAN." },
  { id: "vitalidade_sofrida", nome: "Vitalidade Sofrida", classe: "combatente", source: "arquivos_secretos", prereq: "Ataque Especial", descricao: "Muda sua base de PV de Combatente para 24 + VIG iniciais e +6 + VIG por aumento de NEX (retroativo)." },
  { id: "transcender_comb", nome: "Transcender", classe: "combatente", source: "livro_basico", prereq: "", descricao: "Recebe 1 Poder Paranormal à escolha (não ganha SAN deste aumento de NEX)." },

  // ESPECIALISTA (16)
  { id: "artista_marcial_esp", nome: "Artista Marcial", classe: "especialista", source: "livro_basico", prereq: "", descricao: "Ataques desarmados causam 1d6 (1d8 NEX 35%, 1d10 NEX 70%), são ágeis e letais." },
  { id: "balistica_avancada", nome: "Balística Avançada", classe: "especialista", source: "livro_basico", prereq: "", descricao: "Proficiência com armas táticas de fogo e +2 no dano com armas de fogo." },
  { id: "conhecimento_aplicado", nome: "Conhecimento Aplicado", classe: "especialista", source: "livro_basico", prereq: "INT 2", peCost: 2, descricao: "Ao fazer teste de perícia (exceto Luta/Pontaria), gasta 2 PE para trocar atributo-base para INT." },
  { id: "hacker", nome: "Hacker", classe: "especialista", source: "livro_basico", prereq: "Tecnologia", descricao: "+5 em Tecnologia para invadir sistemas e reduz tempo de invasão para ação completa." },
  { id: "maos_rapidas", nome: "Mãos Rápidas", classe: "especialista", source: "livro_basico", prereq: "AGI 3, Crime", peCost: 1, descricao: "Ao fazer teste de Crime, gasta 1 PE para fazê-lo como ação livre." },
  { id: "mochila_de_utilidades", nome: "Mochila de Utilidades", classe: "especialista", source: "livro_basico", prereq: "", descricao: "Um item à escolha (exceto arma) tem categoria reduzida em I e peso reduzido em 1 espaço." },
  { id: "movimento_tatico", nome: "Movimento Tático", classe: "especialista", source: "livro_basico", prereq: "Atletismo", peCost: 1, descricao: "Gasta 1 PE para ignorar penalidades de terreno difícil e escalada até o fim do turno." },
  { id: "na_mosca", nome: "Na Mosca", classe: "especialista", source: "livro_basico", prereq: "Perito", peCost: 2, descricao: "Ao fazer teste de ataque, pode gastar 2 PE para somar o dado de Perito no ataque." },
  { id: "nerd", nome: "Nerd", classe: "especialista", source: "livro_basico", prereq: "", peCost: 2, descricao: "1x/cena gasta 2 PE e faz Atualidades DT 20 para receber uma informação útil do mestre." },
  { id: "ninja_urbano", nome: "Ninja Urbano", classe: "especialista", source: "livro_basico", prereq: "", descricao: "Proficiência com armas táticas corpo a corpo e de disparo (exceto fogo) e +2 no dano com elas." },
  { id: "pensamento_agil", nome: "Pensamento Ágil", classe: "especialista", source: "livro_basico", prereq: "", peCost: 2, descricao: "1x/rodada em cena de investigação, gasta 2 PE para fazer 1 ação adicional de procurar pistas." },
  { id: "perito_em_explosivos", nome: "Perito em Explosivos", classe: "especialista", source: "livro_basico", prereq: "", descricao: "Soma INT na DT de explosivos e pode excluir até INT alvos da área da explosão." },
  { id: "primeira_impressao", nome: "Primeira Impressão", classe: "especialista", source: "livro_basico", prereq: "", descricao: "+2d20 no primeiro teste de Diplomacia, Enganação, Intimidação ou Intuição na cena." },
  { id: "rapido_no_gatilho", nome: "Rápido no Gatilho", classe: "especialista", source: "livro_basico", prereq: "AGI 3", peCost: 2, descricao: "1x/rodada com arma de fogo, gasta 2 PE para fazer 1 ataque extra." },
  { id: "acolher_o_terror", nome: "Acolher o Terror", classe: "especialista", source: "sobrevivendo_ao_horror", prereq: "", descricao: "Pode se entregar para o medo uma vez adicional por sessão de jogo." },
  { id: "doutor_em_emergencias", nome: "Doutor em Emergências", classe: "especialista", source: "sobrevivendo_ao_horror", prereq: "Medicina", descricao: "Potencializa medicamentos aplicados em campo (ex.: Anti-inflamatório concede 2d8+2 PV temporários)." },
  { id: "transcender_esp", nome: "Transcender", classe: "especialista", source: "livro_basico", prereq: "", descricao: "Recebe 1 Poder Paranormal à escolha (não ganha SAN deste aumento de NEX)." },

  // OCULTISTA (17)
  { id: "camuflar_ocultismo", nome: "Camuflar Ocultismo", classe: "ocultista", source: "livro_basico", prereq: "", peCost: 2, descricao: "Gasta +2 PE ao conjurar para fazer sem componentes ou gestos; observadores precisam passar em Percepção vs. Ocultismo." },
  { id: "criar_selo", nome: "Criar Selo", classe: "ocultista", source: "livro_basico", prereq: "", descricao: "Cria selos paranormais no interlúdio com rituais conhecidos (limite igual a PRE; gasta PE do ritual)." },
  { id: "envolto_em_misterio", nome: "Envolto em Mistério", classe: "ocultista", source: "livro_basico", prereq: "", descricao: "+5 em Enganação e Intimidação contra pessoas alheias ao paranormal." },
  { id: "especialista_em_elemento", nome: "Especialista em Elemento", classe: "ocultista", source: "livro_basico", prereq: "", descricao: "Escolhe 1 elemento (exceto Medo); +2 na DT para resistir aos seus rituais desse elemento." },
  { id: "ferramentas_paranormais", nome: "Ferramentas Paranormais", classe: "ocultista", source: "livro_basico", prereq: "", descricao: "Reduz em I a categoria de um item paranormal e pode ativar itens paranormais sem gastar PE (1x/cena)." },
  { id: "fluxo_de_poder", nome: "Fluxo de Poder", classe: "ocultista", source: "livro_basico", prereq: "NEX 60%", descricao: "Pode manter 2 efeitos sustentados de rituais ativos simultaneamente (pagando o custo de ambos)." },
  { id: "guiado_pelo_paranormal", nome: "Guiado pelo Paranormal", classe: "ocultista", source: "livro_basico", prereq: "", peCost: 2, descricao: "1x/cena gasta 2 PE para fazer 1 ação de investigação adicional." },
  { id: "identificacao_paranormal", nome: "Identificação Paranormal", classe: "ocultista", source: "livro_basico", prereq: "", descricao: "+10 em testes de Ocultismo para identificar criaturas, objetos ou rituais." },
  { id: "improvisar_componentes", nome: "Improvisar Componentes", classe: "ocultista", source: "livro_basico", prereq: "", descricao: "1x/cena ação completa e Investigação DT 15 para improvisar componentes ritualísticos de 1 elemento." },
  { id: "intuicao_paranormal", nome: "Intuição Paranormal", classe: "ocultista", source: "livro_basico", prereq: "", descricao: "Usa Ocultismo no lugar de Investigação para procurar pistas em cenas com presença paranormal." },
  { id: "mestre_em_elemento", nome: "Mestre em Elemento", classe: "ocultista", source: "livro_basico", prereq: "Especialista em Elemento, NEX 45%", descricao: "Reduz em -1 PE o custo de todos os rituais do elemento escolhido." },
  { id: "ritual_potente", nome: "Ritual Potente", classe: "ocultista", source: "livro_basico", prereq: "INT 2", descricao: "Soma seu Intelecto nas rolagens de dano ou cura de seus rituais." },
  { id: "ritual_predileto", nome: "Ritual Predileto", classe: "ocultista", source: "livro_basico", prereq: "", descricao: "Escolhe 1 ritual conhecido; seu custo em PE é reduzido em -1 PE (cumulativo com outras reduções)." },
  { id: "tatuagem_ritualistica", nome: "Tatuagem Ritualística", classe: "ocultista", source: "livro_basico", prereq: "", descricao: "Símbolos tatuados reduzem em -1 PE o custo de rituais de alcance pessoal que tenham você como alvo." },
  { id: "explorador_da_nevoa", nome: "Explorador da Névoa", classe: "ocultista", source: "arquivos_secretos", prereq: "", peCost: 2, descricao: "1x/cena gasta 2 PE para identificar estado da Membrana; se Danificada ou pior, perde 1 SAN e reduz custo de todos os rituais em -1 PE na cena." },
  { id: "terrores_noturnos", nome: "Terrores Noturnos", classe: "ocultista", source: "arquivos_secretos", prereq: "", descricao: "Ao dormir rola 1d100: <=50 descanso precário e perde 1d4 SAN, mas ganha uso único de 1 ritual ou poder paranormal até o próximo interlúdio." },
  { id: "dominar_habilidade_ritualistica", nome: "Dominar Habilidade Ritualística", classe: "ocultista", source: "arquivos_secretos", prereq: "INT 3, Ocultismo, conjurar rituais", descricao: "Aprende uma habilidade de qualquer trilha de Ocultista (respeitando NEX e dependências). Pode ser escolhido até 3 vezes." },
  { id: "saude_sobrenatural", nome: "Saúde Sobrenatural", classe: "ocultista", source: "arquivos_secretos", prereq: "", peCost: 3, descricao: "1x/cena, ação de movimento e 3 PE recebe PV temporários iguais a PRE x 10." },
  { id: "transcender_ocu", nome: "Transcender", classe: "ocultista", source: "livro_basico", prereq: "", descricao: "Recebe 1 Poder Paranormal à escolha (não ganha SAN deste aumento de NEX)." },
];

export const BASE_CLASS_POWERS: PowerDefinition[] = RAW_CLASS_POWERS.map((p) => ({
  id: p.id,
  name: p.nome,
  category: "classe",
  classId: p.classe,
  prerequisites: p.prereq || undefined,
  peCost: p.peCost ?? 0,
  description: p.descricao,
  source: p.source,
}));
