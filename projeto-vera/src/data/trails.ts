import type { AgentClassId, TrailDefinition } from "@/types/ordem";

/**
 * LOTE 2 — Todas as 27 Trilhas Oficiais:
 * - 15 do Livro Básico (5 Combatente, 5 Especialista, 5 Ocultista)
 * - 9 de Sobrevivendo ao Horror (3 Combatente, 3 Especialista, 3 Ocultista)
 * - 3 de Sobrevivente (Durão, Esperto, Esotérico — Estágios 2 e 4)
 */
interface RawTrail {
  id: string;
  nome: string;
  classe: AgentClassId;
  source: TrailDefinition["source"];
  habilidades: { marco: string; nome: string; descricao: string; peCost?: number }[];
}

function parseMarcoToNumber(marco: string): number {
  const match = marco.match(/\d+/);
  return match ? parseInt(match[0], 10) : 10;
}

const RAW_TRAILS: RawTrail[] = [
  // COMBATENTE — LIVRO BÁSICO (5)
  {
    id: "aniquilador",
    nome: "Aniquilador",
    classe: "combatente",
    source: "livro_basico",
    habilidades: [
      { marco: "10%", nome: "A Favorita", descricao: "Escolhe 1 arma favorita; categoria reduzida em I." },
      { marco: "40%", nome: "Técnica Secreta", peCost: 2, descricao: "Categoria da favorita -II. Ao atacar, gasta 2 PE/efeito: Amplo (atinge alvo adjacente extra) ou Destruidor (+1 multiplicador de crítico)." },
      { marco: "65%", nome: "Técnica Sublime", descricao: "Adiciona Letal (+2 margem; 2x dá +5) e Perfurante (ignora até 5 RD) à Técnica Secreta." },
      { marco: "99%", nome: "Máquina de Matar", descricao: "Categoria da favorita -III, +2 margem de ameaça e +1 dado de dano do mesmo tipo." },
    ],
  },
  {
    id: "comandante_de_campo",
    nome: "Comandante de Campo",
    classe: "combatente",
    source: "livro_basico",
    habilidades: [
      { marco: "10%", nome: "Inspirar Confiança", peCost: 2, descricao: "Reação e 2 PE para aliado em alcance curto rerrolar teste recém-realizado." },
      { marco: "40%", nome: "Estrategista", peCost: 1, descricao: "Padrão e 1 PE/aliado (máx. INT) em alcance curto para ganharem 1 ação de movimento extra no próximo turno." },
      { marco: "65%", nome: "Brecha na Guarda", peCost: 2, descricao: "1x/rodada, quando aliado causa dano em alcance curto, reação e 2 PE para você ou outro aliado atacar. Inspirar/Estrategista viram alcance médio." },
      { marco: "99%", nome: "Oficial Comandante", peCost: 5, descricao: "Padrão e 5 PE para cada aliado visível em alcance médio receber 1 ação padrão extra no próximo turno." },
    ],
  },
  {
    id: "guerreiro",
    nome: "Guerreiro",
    classe: "combatente",
    source: "livro_basico",
    habilidades: [
      { marco: "10%", nome: "Técnica Letal", descricao: "+2 na margem de ameaça em ataques corpo a corpo." },
      { marco: "40%", nome: "Revidar", peCost: 2, descricao: "Ao bloquear um ataque, reação e 2 PE para ataque corpo a corpo contra o atacante." },
      { marco: "65%", nome: "Força Opressora", peCost: 1, descricao: "Ao acertar corpo a corpo, gasta 1 PE para derrubar ou empurrar livre (+5 por 10 de dano em empurrar; se derrubar, +1 PE para ataque extra)." },
      { marco: "99%", nome: "Potência Máxima", descricao: "Dobra todos os bônus numéricos de Ataque Especial em ataques corpo a corpo." },
    ],
  },
  {
    id: "operacoes_especiais",
    nome: "Operações Especiais",
    classe: "combatente",
    source: "livro_basico",
    habilidades: [
      { marco: "10%", nome: "Iniciativa Aprimorada", descricao: "+5 em Iniciativa e 1 ação de movimento adicional na 1ª rodada." },
      { marco: "40%", nome: "Ataque Extra", peCost: 2, descricao: "1x/rodada ao atacar, gasta 2 PE para fazer 1 ataque adicional." },
      { marco: "65%", nome: "Surto de Adrenalina", peCost: 5, descricao: "1x/rodada gasta 5 PE para 1 ação padrão ou de movimento adicional." },
      { marco: "99%", nome: "Sempre Alerta", descricao: "Recebe 1 ação padrão adicional no início de cada cena de combate." },
    ],
  },
  {
    id: "tropa_de_choque",
    nome: "Tropa de Choque",
    classe: "combatente",
    source: "livro_basico",
    habilidades: [
      { marco: "10%", nome: "Casca Grossa", descricao: "+1 PV por 5% de NEX e soma VIG na RD recebida ao bloquear." },
      { marco: "40%", nome: "Cai Dentro", peCost: 1, descricao: "Reação e 1 PE quando inimigo em alcance curto ataca aliado para forçá-lo a atacar você (Vontade DT Vig evita)." },
      { marco: "65%", nome: "Duro de Matar", peCost: 2, descricao: "Reação e 2 PE para reduzir dano não paranormal pela metade (NEX 85%: funciona contra paranormal)." },
      { marco: "99%", nome: "Inquebrável", descricao: "Machucado: +5 Defesa e RD 5. Morrendo: não fica indefeso e age normalmente." },
    ],
  },
  // COMBATENTE — SOBREVIVENDO AO HORROR (3)
  {
    id: "agente_secreto",
    nome: "Agente Secreto",
    classe: "combatente",
    source: "sobrevivendo_ao_horror",
    habilidades: [
      { marco: "10%", nome: "Carteirada", descricao: "Treinamento (ou +2) em Diplomacia ou Enganação e documentos oficiais (0 esp)." },
      { marco: "40%", nome: "O Sorriso", peCost: 2, descricao: "+2 Diplomacia/Enganação; gasta 2 PE para rerrolar falha; 1x/cena usa Diplomacia para se acalmar." },
      { marco: "65%", nome: "Método Investigativo", peCost: 2, descricao: "+1 rodada de urgência em investigações; gasta 2 PE (+2/uso) para anular evento de investigação." },
      { marco: "99%", nome: "Multifacetado", descricao: "1x/cena gasta 5 SAN (só recupera ao fim da missão) para copiar todas as habilidades até 65% de outra trilha de combatente/especialista." },
    ],
  },
  {
    id: "cacador",
    nome: "Caçador",
    classe: "combatente",
    source: "sobrevivendo_ao_horror",
    habilidades: [
      { marco: "10%", nome: "Rastrear o Paranormal", descricao: "Treinamento (ou +2) em Sobrevivência; usa-a no lugar de Ocultismo (identificar criaturas), Investigação e Percepção para rastros paranormais." },
      { marco: "40%", nome: "Estudar Fraquezas", descricao: "Interlúdio com pista revela informação útil e dá +1 em perícias contra o ser por pista até fim da missão." },
      { marco: "65%", nome: "Atacar das Sombras", descricao: "Move normal em Furtividade; armas silenciosas reduzem penalidade de atacar furtivo para -1d20; visibilidade inicial -1." },
      { marco: "99%", nome: "Estudar a Presa", descricao: "Marca tipo de ser como presa: +1d20 perícias, +1 margem, +1 multiplicador e RD 5 contra ele." },
    ],
  },
  {
    id: "monstruoso",
    nome: "Monstruoso",
    classe: "combatente",
    source: "sobrevivendo_ao_horror",
    habilidades: [
      { marco: "10%", nome: "Ser Amaldiçoado", descricao: "Treino (ou +2) em Ocultismo. Escolhe elemento (Sangue/Morte/Conhecimento/Energia); etapa ritualística diária dá RD 5 e bônus/penalidade elementais." },
      { marco: "40%", nome: "Ser Modificado", descricao: "RD sobe para 10, muda atributo de PE (Sangue FOR, Morte VIG, Conhecimento INT, Energia AGI) e ganha habilidade ativa elemental." },
      { marco: "65%", nome: "Ser Assustador", descricao: "RD 15, PRE -1 permanente e poder monstruoso avançado do elemento." },
      { marco: "99%", nome: "Ser Aterrorizante", descricao: "Efeitos permanentes, RD 20, conta como criatura paranormal, transformação final e ritual de 4º círculo do elemento." },
    ],
  },

  // ESPECIALISTA — LIVRO BÁSICO (5)
  {
    id: "atirador_de_elite",
    nome: "Atirador de Elite",
    classe: "especialista",
    source: "livro_basico",
    habilidades: [
      { marco: "10%", nome: "Mira de Elite", descricao: "Proficiência com armas de fogo de balas longas e soma INT no dano com elas." },
      { marco: "40%", nome: "Disparo Letal", peCost: 1, descricao: "Ao mirar, gasta 1 PE para +2 na margem de ameaça do próximo ataque." },
      { marco: "65%", nome: "Disparo Impactante", peCost: 2, descricao: "Com calibre grosso, gasta 2 PE para derrubar, desarmar, empurrar ou quebrar à distância." },
      { marco: "99%", nome: "Atirar para Matar", descricao: "Críticos com armas de fogo causam dano máximo automaticamente." },
    ],
  },
  {
    id: "infiltrador",
    nome: "Infiltrador",
    classe: "especialista",
    source: "livro_basico",
    habilidades: [
      { marco: "10%", nome: "Ataque Furtivo", peCost: 1, descricao: "1x/rodada contra desprevenido/flanqueado (corpo a corpo ou curto), gasta 1 PE para +1d6 dano (2d6 em 40%, 3d6 em 65%, 4d6 em 99%)." },
      { marco: "40%", nome: "Gatuno", descricao: "+5 Atletismo e Crime; move-se normal sem penalidade em Furtividade." },
      { marco: "65%", nome: "Assassinar", peCost: 3, descricao: "Movimento e 3 PE analisa alvo em alcance curto; próximo Ataque Furtivo dobra dados extras e deixa inconsciente/morrendo (Fortitude DT Agi evita)." },
      { marco: "99%", nome: "Sombra Fugaz", peCost: 3, descricao: "Gasta 3 PE para ignorar a penalidade de -3d20 em Furtividade após atacar." },
    ],
  },
  {
    id: "medico_de_campo",
    nome: "Médico de Campo",
    classe: "especialista",
    source: "livro_basico",
    habilidades: [
      { marco: "10%", nome: "Paramédico", peCost: 2, descricao: "Requer Medicina e kit. Padrão e 2 PE cura 2d10 PV adjacente (+1d10 por +1 PE em 40%/65%/99%)." },
      { marco: "40%", nome: "Equipe de Trauma", peCost: 2, descricao: "Padrão e 2 PE remove 1 condição negativa (exceto morrendo) de aliado adjacente." },
      { marco: "65%", nome: "Resgate", descricao: "1x/rodada aproxima-se livre de aliado machucado/morrendo em alcance curto; curar/remover condição dá +5 Defesa a ambos; carregar pessoas ocupa metade dos espaços." },
      { marco: "99%", nome: "Reanimação", peCost: 10, descricao: "1x/cena, completa e 10 PE traz de volta à vida personagem morto na mesma cena (exceto dano massivo)." },
    ],
  },
  {
    id: "negociador",
    nome: "Negociador",
    classe: "especialista",
    source: "livro_basico",
    habilidades: [
      { marco: "10%", nome: "Eloquência", peCost: 1, descricao: "Completa e 1 PE/alvo em curto; Diplomacia/Enganação/Intimidação vs. Vontade fascina enquanto se concentrar." },
      { marco: "40%", nome: "Discurso Motivador", peCost: 4, descricao: "Padrão e 4 PE dá +1d20 em perícias a aliados em alcance curto na cena (65%: 8 PE para +2d20)." },
      { marco: "65%", nome: "Eu Conheço um Cara", descricao: "1x/missão aciona contatos para favor (trocar equipamentos, descanso luxuoso ou resgate)." },
      { marco: "99%", nome: "Truque de Mestre", peCost: 5, descricao: "Gasta 5 PE para simular habilidade vista de um aliado na mesma cena (pagando custos)." },
    ],
  },
  {
    id: "tecnico",
    nome: "Técnico",
    classe: "especialista",
    source: "livro_basico",
    habilidades: [
      { marco: "10%", nome: "Inventário Otimizado", descricao: "Soma INT à FOR para calcular capacidade de carga." },
      { marco: "40%", nome: "Remendão", peCost: 1, descricao: "Completa e 1 PE remove quebrado de equipamento adjacente; equipamentos gerais têm categoria -I." },
      { marco: "65%", nome: "Improvisar", peCost: 2, descricao: "Completa e 2 PE + 2 PE/cat cria equipamento geral funcional na cena." },
      { marco: "99%", nome: "Preparado para Tudo", peCost: 3, descricao: "Movimento e 3 PE/cat saca qualquer item (exceto armas) necessário da bolsa." },
    ],
  },
  // ESPECIALISTA — SOBREVIVENDO AO HORROR (3)
  {
    id: "bibliotecario",
    nome: "Bibliotecário",
    classe: "especialista",
    source: "sobrevivendo_ao_horror",
    habilidades: [
      { marco: "10%", nome: "Conhecimento Prático", peCost: 2, descricao: "Gasta 2 PE para trocar atributo-base de perícia (exceto Luta/Pontaria) para INT." },
      { marco: "40%", nome: "Leitor Contumaz", peCost: 2, descricao: "Ação ler sobe para 1d8 em qualquer perícia; +2 PE para rolar 2d8." },
      { marco: "65%", nome: "Rato de Biblioteca", descricao: "1x/cena em local com livros obtém benefício de ler ou revisar caso rapidamente." },
      { marco: "99%", nome: "A Força do Saber", descricao: "+1 INT, soma INT ao PE total e escolhe 1 perícia para usar INT como base." },
    ],
  },
  {
    id: "muambeiro",
    nome: "Muambeiro",
    classe: "especialista",
    source: "sobrevivendo_ao_horror",
    habilidades: [
      { marco: "10%", nome: "Mascate", descricao: "Treino em Profissão técnica, +5 espaços de carga e -10 DT para fabricar improvisados." },
      { marco: "40%", nome: "Fabricação Própria", descricao: "Metade do tempo para fabricar itens mundanos." },
      { marco: "65%", nome: "Laboratório de Campo", descricao: "Treino (ou +5) em outra Profissão técnica; fabrica e conserta itens paranormais em campo." },
      { marco: "99%", nome: "Achado Conveniente", peCost: 5, descricao: "Completa e 5 PE produz item até Cat III (exceto paranormais) até o fim da cena." },
    ],
  },
  {
    id: "perseverante",
    nome: "Perseverante",
    classe: "especialista",
    source: "sobrevivendo_ao_horror",
    habilidades: [
      { marco: "10%", nome: "Soluções Improvisadas", peCost: 2, descricao: "Gasta 2 PE para rerrolar 1 dado de teste recém-feito (1x/teste) e ficar com o melhor." },
      { marco: "40%", nome: "Fuga Obstinada", descricao: "+1d20 para fugir e aguenta até 4 falhas como presa em perseguição." },
      { marco: "65%", nome: "Determinação Inquestionável", peCost: 5, descricao: "1x/cena, padrão e 5 PE remove condição de medo, mental ou paralisia de si." },
      { marco: "99%", nome: "Só Mais um Passo...", peCost: 5, descricao: "1x/rodada ao cair a 0 PV (exceto dano massivo), gasta 5 PE para ficar com 1 PV." },
    ],
  },

  // OCULTISTA — LIVRO BÁSICO (5)
  {
    id: "conduite",
    nome: "Conduíte",
    classe: "ocultista",
    source: "livro_basico",
    habilidades: [
      { marco: "10%", nome: "Ampliar Ritual", peCost: 2, descricao: "+2 PE aumenta alcance em 1 passo ou dobra área do ritual." },
      { marco: "40%", nome: "Acelerar Ritual", peCost: 4, descricao: "1x/rodada +4 PE conjura ritual como ação livre." },
      { marco: "65%", nome: "Anular Ritual", descricao: "Gasta PE igual ao ritual alvo e vence Ocultismo oposto para anulá-lo." },
      { marco: "99%", nome: "Canalizar o Medo", descricao: "Aprende o ritual Canalizar o Medo." },
    ],
  },
  {
    id: "flagelador",
    nome: "Flagelador",
    classe: "ocultista",
    source: "livro_basico",
    habilidades: [
      { marco: "10%", nome: "Poder do Flagelo", descricao: "Paga PE de rituais usando PV (2 PV por 1 PE; só recupera com descanso)." },
      { marco: "40%", nome: "Abraçar a Dor", peCost: 2, descricao: "Reação e 2 PE reduz dano não paranormal pela metade." },
      { marco: "65%", nome: "Absorver Agonia", descricao: "Ao zerar PV de inimigo com ritual, ganha PE temporários iguais ao círculo." },
      { marco: "99%", nome: "Medo Tangível", descricao: "Aprende o ritual Medo Tangível." },
    ],
  },
  {
    id: "graduado",
    nome: "Graduado",
    classe: "ocultista",
    source: "livro_basico",
    habilidades: [
      { marco: "10%", nome: "Saber Ampliado", descricao: "+1 ritual de 1º círculo e +1 sempre que desbloquear novo círculo." },
      { marco: "40%", nome: "Grimório Ritualístico", descricao: "Grimório (1 esp) com rituais extras de 1º/2º círculo iguais a INT (+1 por novo círculo)." },
      { marco: "65%", nome: "Rituais Eficientes", descricao: "+5 na DT para resistir a todos os seus rituais." },
      { marco: "99%", nome: "Conhecendo o Medo", descricao: "Aprende o ritual Conhecendo o Medo." },
    ],
  },
  {
    id: "intuitivo",
    nome: "Intuitivo",
    classe: "ocultista",
    source: "livro_basico",
    habilidades: [
      { marco: "10%", nome: "Mente Sã", descricao: "+5 em testes de resistência contra efeitos paranormais." },
      { marco: "40%", nome: "Presença Poderosa", descricao: "Soma PRE ao limite de PE por turno para conjurar rituais (não afeta DT)." },
      { marco: "65%", nome: "Inabalável", descricao: "RD mental e paranormal 10; passar em Vontade que reduziria dano à metade zera o dano." },
      { marco: "99%", nome: "Presença do Medo", descricao: "Aprende o ritual Presença do Medo." },
    ],
  },
  {
    id: "lamina_paranormal",
    nome: "Lâmina Paranormal",
    classe: "ocultista",
    source: "livro_basico",
    habilidades: [
      { marco: "10%", nome: "Lâmina Maldita", descricao: "Aprende Amaldiçoar Arma (-1 PE se já conhece) e usa Ocultismo para atacar com ela." },
      { marco: "40%", nome: "Gladiador Paranormal", descricao: "Ao acertar corpo a corpo, ganha 2 PE temporários (máx. limite de PE na cena)." },
      { marco: "65%", nome: "Conjuração Marcial", peCost: 2, descricao: "1x/rodada ao lançar ritual de ação padrão, gasta 2 PE para ataque corpo a corpo livre." },
      { marco: "99%", nome: "Lâmina do Medo", descricao: "Aprende o ritual Lâmina do Medo." },
    ],
  },
  // OCULTISTA — SOBREVIVENDO AO HORROR (3)
  {
    id: "exorcista",
    nome: "Exorcista",
    classe: "ocultista",
    source: "sobrevivendo_ao_horror",
    habilidades: [
      { marco: "10%", nome: "Revelação do Mal", descricao: "Treino (ou +2) em Religião; usa Religião no lugar de Ocultismo e para pistas paranormais." },
      { marco: "40%", nome: "Poder da Fé", peCost: 2, descricao: "Veterano (ou +1d20) em Religião; gasta 2 PE para repetir teste de resistência falho usando Religião." },
      { marco: "65%", nome: "Parareligiosidade", peCost: 2, descricao: "+2 PE ao conjurar ritual aplica efeito de 1 catalisador ritualístico à escolha." },
      { marco: "99%", nome: "Chagas da Resistência", descricao: "Ao cair a 0 SAN, pode gastar 10 PV para ficar com 1 SAN." },
    ],
  },
  {
    id: "parapsicologo",
    nome: "Parapsicólogo",
    classe: "ocultista",
    source: "sobrevivendo_ao_horror",
    habilidades: [
      { marco: "10%", nome: "Terapia", peCost: 2, descricao: "Requer Profissão (psicólogo). Usa como Diplomacia; 1x/rodada gasta 2 PE para substituir falha contra dano mental em alcance curto." },
      { marco: "40%", nome: "Palavras-Chave", peCost: 1, descricao: "Ao acalmar, gasta PE (até limite) para alvo recuperar 1 SAN/PD por PE gasto." },
      { marco: "65%", nome: "Reprogramação Mental", peCost: 5, descricao: "5 PE no interlúdio dá a aliado 1 poder geral, de classe ou 1º poder de outra trilha até o próximo interlúdio." },
      { marco: "99%", nome: "A Sanidade Está Lá Fora", peCost: 5, descricao: "Movimento e 5 PE remove todas as condições de medo/mentais adjacentes." },
    ],
  },
  {
    id: "possuido",
    nome: "Possuído",
    classe: "ocultista",
    source: "sobrevivendo_ao_horror",
    habilidades: [
      { marco: "10%", nome: "Poder Não Desejado", descricao: "Todo poder de ocultista vira Transcender. Reserva de Pontos de Possessão (3 + 2/Transcender; limite gasto/turno = PRE; 1 PP = 10 PV ou 2 PE)." },
      { marco: "40%", nome: "As Sombras Dentro de Mim", peCost: 2, descricao: "Recupera 2 PP ao dormir; 2 PE dá +1d20 em Acrobacia/Atletismo/Furtividade por 1 rodada e -1 visibilidade." },
      { marco: "65%", nome: "Ele me Ensina", descricao: "Escolhe Transcender ou a 1ª habilidade de outra trilha de ocultista." },
      { marco: "99%", nome: "Tornamo-nos Um", peCost: 6, descricao: "Recebe poder supremo do elemento de sua afinidade (ex.: Sangue gasta 6 PE para curar 50 PV e mudar perícias de FOR/VIG/Intimidação para +35)." },
    ],
  },
  {
    id: "criptologista_do_oculto",
    nome: "Criptologista do Oculto",
    classe: "ocultista",
    source: "arquivos_secretos",
    habilidades: [
      { marco: "10%", nome: "Método Intuitivo", descricao: "Recebe Criar Selo (se já tiver, dobra o limite máximo). Cria 2 selos por interlúdio (+1 selo por cada habilidade seguinte desta trilha)." },
      { marco: "40%", nome: "Decifrar Sigilos", descricao: "Facilita ativação de selos paranormais e compreensão de símbolos ritualísticos em campo." },
      { marco: "65%", nome: "Reproduzir Maldição", peCost: 3, descricao: "Ação de interlúdio e 3 PE memoriza maldição vista e aplica a um item (Ocultismo DT 10 + 5/cat; perde 1d8+1 SAN ou 2d8+2 na falha)." },
      { marco: "99%", nome: "Maldição Suprema", descricao: "Ao usar Reproduzir Maldição, considera o item 3 categorias efetivas abaixo para aplicar múltiplas maldições até Cat IV." },
    ],
  },

  // SOBREVIVENTE — SOBREVIVENDO AO HORROR (3)
  {
    id: "durao",
    nome: "Durão",
    classe: "sobrevivente",
    source: "sobrevivendo_ao_horror",
    habilidades: [
      { marco: "Estágio 2", nome: "Durão", descricao: "+4 PV (e +2 PV adicionais no Estágio 3)." },
      { marco: "Estágio 4", nome: "Pancada Forte", peCost: 1, descricao: "Gasta 1 PE ao atacar para +1d20 (ao virar Combatente, vira -1 PE em Ataque Especial)." },
    ],
  },
  {
    id: "esperto",
    nome: "Esperto",
    classe: "sobrevivente",
    source: "sobrevivendo_ao_horror",
    habilidades: [
      { marco: "Estágio 2", nome: "Esperto", descricao: "Torna-se treinado em 1 perícia adicional à escolha." },
      { marco: "Estágio 4", nome: "Entendido", peCost: 1, descricao: "Escolhe 2 perícias treinadas (exceto Luta/Pontaria); gasta 1 PE para +1d4 (ao virar Especialista, vira -1 PE em Perito)." },
    ],
  },
  {
    id: "esoterico",
    nome: "Esotérico",
    classe: "sobrevivente",
    source: "sobrevivendo_ao_horror",
    habilidades: [
      { marco: "Estágio 2", nome: "Esotérico", peCost: 1, descricao: "Padrão e 1 PE para sentir energias paranormais em alcance curto." },
      { marco: "Estágio 4", nome: "Iniciado", descricao: "Aprende e pode conjurar 1 ritual de 1º círculo (soma aos iniciais se virar Ocultista)." },
    ],
  },
];

export const BASE_TRAILS: TrailDefinition[] = RAW_TRAILS.map((t) => ({
  id: t.id,
  classId: t.classe,
  name: t.nome,
  source: t.source,
  description: t.habilidades[0]?.descricao ?? "",
  abilitiesByNex: t.habilidades.map((h) => ({
    nex: parseMarcoToNumber(h.marco),
    name: h.nome,
    description: h.descricao,
    peCost: h.peCost ?? 0,
  })),
}));

export function getTrailsByClass(classId: AgentClassId): TrailDefinition[] {
  return BASE_TRAILS.filter((t) => t.classId === classId);
}
