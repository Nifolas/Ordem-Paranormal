import type { OriginDefinition, OriginPassiveEffects, SkillKey } from "@/types/ordem";

/**
 * LOTE 1 — Todas as 49 Origens oficiais:
 * - 26 do Livro Básico (v1.2)
 * - 20 de Sobrevivendo ao Horror (SaH)
 * - 3 dos Arquivos Secretos
 */
interface RawOrigin {
  id: string;
  nome: string;
  source: OriginDefinition["source"];
  pericias: SkillKey[];
  periciasNotas?: string[];
  poder: { nome: string; descricao: string; peCost?: number };
  efeitosPassivos?: OriginPassiveEffects;
}

const RAW_ORIGINS: RawOrigin[] = [
  // LIVRO BÁSICO (26)
  {
    id: "academico",
    nome: "Acadêmico",
    source: "livro_basico",
    pericias: ["ciencias", "investigacao"],
    poder: {
      nome: "Saber é Poder",
      peCost: 2,
      descricao:
        "Ao fazer teste usando Intelecto, pode gastar 2 PE para receber +5 nesse teste.",
    },
  },
  {
    id: "agente_de_saude",
    nome: "Agente de Saúde",
    source: "livro_basico",
    pericias: ["intuicao", "medicina"],
    poder: {
      nome: "Técnica Medicinal",
      descricao:
        "Sempre que cura um personagem, adiciona seu Intelecto no total de PV curados.",
    },
  },
  {
    id: "amnesico",
    nome: "Amnésico",
    source: "livro_basico",
    pericias: [],
    periciasNotas: ["Escolha do Mestre (1)", "Escolha do Mestre (2)"],
    poder: {
      nome: "Vislumbres do Passado",
      descricao:
        "1x/sessão faz teste de INT (DT 10) para reconhecer pessoas ou lugares familiares; se passar, ganha 1d4 PE temporários e informação útil.",
    },
  },
  {
    id: "artista",
    nome: "Artista",
    source: "livro_basico",
    pericias: ["artes", "enganacao"],
    poder: {
      nome: "Magnum Opus",
      descricao:
        "1x/missão define que um NPC o reconhece por sua obra, recebendo +5 em testes de Presença e perícias de Presença contra ele.",
    },
  },
  {
    id: "atleta",
    nome: "Atleta",
    source: "livro_basico",
    pericias: ["acrobacia", "atletismo"],
    poder: {
      nome: "110%",
      peCost: 2,
      descricao:
        "Ao fazer teste de perícia usando FOR ou AGI (exceto Luta e Pontaria), pode gastar 2 PE para +5 nesse teste.",
    },
  },
  {
    id: "chef",
    nome: "Chef",
    source: "livro_basico",
    pericias: ["fortitude", "profissao"],
    periciasNotas: ["Fortitude", "Profissão (cozinheiro)"],
    poder: {
      nome: "Ingrediente Secreto",
      descricao:
        "No interlúdio, ao se alimentar, você e aliados que também se alimentarem recebem o benefício de dois pratos (iguais acumulam).",
    },
  },
  {
    id: "criminoso",
    nome: "Criminoso",
    source: "livro_basico",
    pericias: ["crime", "furtividade"],
    poder: {
      nome: "O Crime Compensa",
      descricao:
        "Ao fim de uma missão, escolhe um item encontrado nela para levá-lo na próxima sem contar no limite por patente.",
    },
  },
  {
    id: "cultista_arrependido",
    nome: "Cultista Arrependido",
    source: "livro_basico",
    pericias: ["ocultismo", "religiao"],
    poder: {
      nome: "Traços do Outro Lado",
      descricao:
        "Inicia com 1 poder paranormal à escolha, mas começa o jogo com metade da Sanidade inicial normal de sua classe.",
    },
    efeitosPassivos: { metadeSanInicial: true, poderParanormalExtra: 1 },
  },
  {
    id: "desgarrado",
    nome: "Desgarrado",
    source: "livro_basico",
    pericias: ["fortitude", "sobrevivencia"],
    poder: {
      nome: "Calejado",
      descricao: "Recebe +1 PV para cada 5% de NEX.",
    },
    efeitosPassivos: { pvPor5Nex: 1 },
  },
  {
    id: "engenheiro",
    nome: "Engenheiro",
    source: "livro_basico",
    pericias: ["profissao", "tecnologia"],
    poder: {
      nome: "Ferramenta Favorita",
      descricao:
        "Um item à escolha (exceto armas) conta como uma categoria abaixo.",
    },
  },
  {
    id: "executivo",
    nome: "Executivo",
    source: "livro_basico",
    pericias: ["diplomacia", "profissao"],
    poder: {
      nome: "Processo Otimizado",
      peCost: 2,
      descricao:
        "Em teste estendido ou revisão de documentos, pode pagar 2 PE para receber +5 no teste.",
    },
  },
  {
    id: "investigador",
    nome: "Investigador",
    source: "livro_basico",
    pericias: ["investigacao", "percepcao"],
    poder: {
      nome: "Faro para Pistas",
      peCost: 1,
      descricao:
        "1x/cena, ao procurar pistas, pode gastar 1 PE para receber +5 nesse teste.",
    },
  },
  {
    id: "lutador",
    nome: "Lutador",
    source: "livro_basico",
    pericias: ["luta", "reflexos"],
    poder: {
      nome: "Mão Pesada",
      descricao: "Recebe +2 em rolagens de dano com ataques corpo a corpo.",
    },
    efeitosPassivos: { danoCorpoACorpo: 2 },
  },
  {
    id: "magnata",
    nome: "Magnata",
    source: "livro_basico",
    pericias: ["diplomacia", "pilotagem"],
    poder: {
      nome: "Patrocinador da Ordem",
      descricao:
        "Seu limite de crédito é sempre considerado um nível acima do atual.",
    },
    efeitosPassivos: { limiteCreditoBonus: 1 },
  },
  {
    id: "mercenario",
    nome: "Mercenário",
    source: "livro_basico",
    pericias: ["iniciativa", "intimidacao"],
    poder: {
      nome: "Posição de Combate",
      peCost: 2,
      descricao:
        "No 1º turno de cada cena de ação, pode gastar 2 PE para receber 1 ação de movimento adicional.",
    },
  },
  {
    id: "militar",
    nome: "Militar",
    source: "livro_basico",
    pericias: ["pontaria", "tatica"],
    poder: {
      nome: "Para Bellum",
      descricao: "Recebe +2 em rolagens de dano com armas de fogo.",
    },
    efeitosPassivos: { danoArmasDeFogo: 2 },
  },
  {
    id: "operario",
    nome: "Operário",
    source: "livro_basico",
    pericias: ["fortitude", "profissao"],
    poder: {
      nome: "Ferramenta de Trabalho",
      descricao:
        "Escolhe 1 arma simples ou tática da profissão: ganha proficiência e +1 em ataque, dano e margem de ameaça com ela.",
    },
  },
  {
    id: "policial",
    nome: "Policial",
    source: "livro_basico",
    pericias: ["percepcao", "pontaria"],
    poder: {
      nome: "Patrulha",
      descricao: "Recebe +2 em Defesa.",
    },
    efeitosPassivos: { defesa: 2 },
  },
  {
    id: "religioso",
    nome: "Religioso",
    source: "livro_basico",
    pericias: ["religiao", "vontade"],
    poder: {
      nome: "Acalentar",
      descricao:
        "+5 em Religião para acalmar. Quem você acalmar recupera 1d6 + PRE pontos de Sanidade.",
    },
  },
  {
    id: "servidor_publico",
    nome: "Servidor Público",
    source: "livro_basico",
    pericias: ["intuicao", "vontade"],
    poder: {
      nome: "Espírito Cívico",
      peCost: 1,
      descricao:
        "Ao fazer teste para ajudar, pode gastar 1 PE para aumentar o bônus concedido em +2.",
    },
  },
  {
    id: "teorico_da_conspiracao",
    nome: "Teórico da Conspiração",
    source: "livro_basico",
    pericias: ["investigacao", "ocultismo"],
    poder: {
      nome: "Eu Já Sabia",
      descricao: "Recebe resistência a dano mental igual ao seu Intelecto.",
    },
    efeitosPassivos: { rdMentalPorInt: 1 },
  },
  {
    id: "ti",
    nome: "T.I.",
    source: "livro_basico",
    pericias: ["investigacao", "tecnologia"],
    poder: {
      nome: "Motor de Busca",
      peCost: 2,
      descricao:
        "Com acesso à internet e aprovação do mestre, gasta 2 PE para substituir qualquer teste de perícia por Tecnologia.",
    },
  },
  {
    id: "trabalhador_rural",
    nome: "Trabalhador Rural",
    source: "livro_basico",
    pericias: ["adestramento", "sobrevivencia"],
    poder: {
      nome: "Desbravador",
      peCost: 2,
      descricao:
        "Gasta 2 PE para +5 em Adestramento ou Sobrevivência. Ignora penalidade de terreno difícil.",
    },
  },
  {
    id: "trambiqueiro",
    nome: "Trambiqueiro",
    source: "livro_basico",
    pericias: ["crime", "enganacao"],
    poder: {
      nome: "Impostor",
      peCost: 2,
      descricao:
        "1x/cena, gasta 2 PE para substituir um teste de perícia qualquer por Enganação.",
    },
  },
  {
    id: "universitario",
    nome: "Universitário",
    source: "livro_basico",
    pericias: ["atualidades", "investigacao"],
    poder: {
      nome: "Dedicação",
      descricao:
        "+1 PE inicial e +1 PE em cada NEX ímpar (15%, 25%...). Limite de PE por turno aumenta em +1 (não afeta DT).",
    },
    efeitosPassivos: { peInicial: 1, peNexImpar: 1, limitePeBonus: 1 },
  },
  {
    id: "vitima",
    nome: "Vítima",
    source: "livro_basico",
    pericias: ["reflexos", "vontade"],
    poder: {
      nome: "Cicatrizes Psicológicas",
      descricao:
        "Recebe +1 de Sanidade para cada 5% de NEX (em modo PD: +1d20 em Vontade contra efeitos de medo).",
    },
    efeitosPassivos: { sanPor5Nex: 1 },
  },

  // SOBREVIVENDO AO HORROR (20)
  {
    id: "amigo_dos_animais",
    nome: "Amigo dos Animais",
    source: "sobrevivendo_ao_horror",
    pericias: ["adestramento", "percepcao"],
    poder: {
      nome: "Companheiro Animal",
      descricao:
        "Entende animais e possui animal aliado (+2 em uma perícia; NEX 35% ganha bônus de aliado; NEX 70% ganha habilidade do aliado). Se morrer, perde 10 SAN permanentes.",
    },
  },
  {
    id: "astronauta",
    nome: "Astronauta",
    source: "sobrevivendo_ao_horror",
    pericias: ["ciencias", "fortitude"],
    poder: {
      nome: "Acostumado ao Extremo",
      peCost: 1,
      descricao:
        "Ao sofrer dano de fogo, frio ou mental, gasta 1 PE (+1 PE por uso extra na cena) para reduzir o dano em 5.",
    },
  },
  {
    id: "chef_do_outro_lado",
    nome: "Chef do Outro Lado",
    source: "sobrevivendo_ao_horror",
    pericias: ["ocultismo", "profissao"],
    periciasNotas: ["Ocultismo", "Profissão (cozinheiro)"],
    poder: {
      nome: "Fome do Outro Lado",
      descricao:
        "Cozinha partes de criaturas (Cat I, 0,5 esp) no interlúdio com Profissão DT 15+1d20 oculto: sucesso dá RD 10 ao elemento na próxima cena; falha dá vulnerabilidade.",
    },
  },
  {
    id: "colegial",
    nome: "Colegial",
    source: "sobrevivendo_ao_horror",
    pericias: ["atualidades", "tecnologia"],
    poder: {
      nome: "Poder da Amizade",
      descricao:
        "Escolhe melhor amigo; trocando olhares em alcance médio ganha +2 em perícias. Se ele morrer, perde 1 PE por 5% NEX até o fim da missão.",
    },
  },
  {
    id: "cosplayer",
    nome: "Cosplayer",
    source: "sobrevivendo_ao_horror",
    pericias: ["artes", "vontade"],
    poder: {
      nome: "Não é fantasia, é cosplay!",
      descricao:
        "Usa Artes para disfarces e recebe +2 em testes ligados ao cosplay vestido.",
    },
  },
  {
    id: "diplomata",
    nome: "Diplomata",
    source: "sobrevivendo_ao_horror",
    pericias: ["atualidades", "diplomacia"],
    poder: {
      nome: "Conexões",
      peCost: 2,
      descricao:
        "+2 em Diplomacia. Gasta 10 min e 2 PE contatando NPC para substituir perícia ligada à área dele por Diplomacia até o fim da cena.",
    },
    efeitosPassivos: { periciaBonus: { diplomacia: 2 } },
  },
  {
    id: "explorador",
    nome: "Explorador",
    source: "sobrevivendo_ao_horror",
    pericias: ["fortitude", "sobrevivencia"],
    poder: {
      nome: "Manual do Sobrevivente",
      peCost: 2,
      descricao:
        "Gasta 2 PE para +5 contra armadilhas, clima, doenças, fome, sede, fumaça, sono, sufocamento ou veneno (mesmo paranormais). Sono precário conta como normal.",
    },
  },
  {
    id: "experimento",
    nome: "Experimento",
    source: "sobrevivendo_ao_horror",
    pericias: ["atletismo", "fortitude"],
    poder: {
      nome: "Mutação",
      descricao:
        "Recebe RD 2 e +2 em uma perícia de FOR, AGI ou VIG à escolha, mas sofre -1d20 em Diplomacia.",
    },
    efeitosPassivos: { rdGeral: 2, penalidadeDados: { diplomacia: -1 } },
  },
  {
    id: "fanatico_por_criaturas",
    nome: "Fanático por Criaturas",
    source: "sobrevivendo_ao_horror",
    pericias: ["investigacao", "ocultismo"],
    poder: {
      nome: "Conhecimento Oculto",
      descricao:
        "Identifica criaturas via Ocultismo por pistas/fotos/rastros; ao passar, recebe +2 em todos os testes contra ela até o fim da missão.",
    },
  },
  {
    id: "fotografo",
    nome: "Fotógrafo",
    source: "sobrevivendo_ao_horror",
    pericias: ["artes", "percepcao"],
    poder: {
      nome: "Através da Lente",
      peCost: 2,
      descricao:
        "Gasta 2 PE para +5 em Investigação, Percepção ou procurar pistas usando câmera ou analisando fotos.",
    },
  },
  {
    id: "inventor_paranormal",
    nome: "Inventor Paranormal",
    source: "sobrevivendo_ao_horror",
    pericias: ["profissao", "vontade"],
    periciasNotas: ["Profissão (engenheiro)", "Vontade"],
    poder: {
      nome: "Invenção Paranormal",
      descricao:
        "Escolhe 1 ritual de 1º círculo em invento (Cat 0, 1 esp). Ativa com Profissão (engenheiro) DT 15 (+5/uso na missão) sem PE; falha enguiça até manutenção.",
    },
  },
  {
    id: "jovem_mistico",
    nome: "Jovem Místico",
    source: "sobrevivendo_ao_horror",
    pericias: ["ocultismo", "religiao"],
    poder: {
      nome: "A Culpa é das Estrelas",
      peCost: 1,
      descricao:
        "Escolhe 1 número da sorte (1–6). No início da cena gasta 1 PE e rola 1d6: acerto dá +2 em perícias na cena e reseta; erro adiciona +1 número da sorte.",
    },
  },
  {
    id: "legista_do_turno_da_noite",
    nome: "Legista do Turno da Noite",
    source: "sobrevivendo_ao_horror",
    pericias: ["ciencias", "medicina"],
    poder: {
      nome: "Luto Habitual",
      peCost: 2,
      descricao:
        "Sofre metade do dano mental por cenas ligadas à rotina de legista. Gasta 2 PE para +5 em Medicina (primeiros socorros ou necropsia).",
    },
  },
  {
    id: "mateiro",
    nome: "Mateiro",
    source: "sobrevivendo_ao_horror",
    pericias: ["percepcao", "sobrevivencia"],
    poder: {
      nome: "Mapa Celeste",
      peCost: 2,
      descricao:
        "Não se perde em locais visitados vendo o céu. Gasta 2 PE para rerrolar Sobrevivência (fica com o melhor). Sono precário conta como normal.",
    },
  },
  {
    id: "mergulhador",
    nome: "Mergulhador",
    source: "sobrevivendo_ao_horror",
    pericias: ["atletismo", "fortitude"],
    poder: {
      nome: "Fôlego de Nadador",
      descricao:
        "Recebe +5 PV, prende respiração por 2x VIG rodadas e nada em deslocamento normal ao passar em Atletismo.",
    },
    efeitosPassivos: { pvFixo: 5 },
  },
  {
    id: "motorista",
    nome: "Motorista",
    source: "sobrevivendo_ao_horror",
    pericias: ["pilotagem", "reflexos"],
    poder: {
      nome: "Mãos no Volante",
      peCost: 2,
      descricao:
        "Sem penalidade ao atacar de veículos em movimento; pilotando, gasta 2 PE para +5 em Pilotagem ou resistência.",
    },
  },
  {
    id: "nerd_entusiasta",
    nome: "Nerd Entusiasta",
    source: "sobrevivendo_ao_horror",
    pericias: ["ciencias", "tecnologia"],
    poder: {
      nome: "O Inteligentão",
      descricao:
        "O bônus da ação de interlúdio ler aumenta em +1 dado (de +1d6 para +2d6).",
    },
  },
  {
    id: "profetizado",
    nome: "Profetizado",
    source: "sobrevivendo_ao_horror",
    pericias: ["vontade"],
    periciasNotas: ["Vontade", "Escolha ligada à premonição"],
    poder: {
      nome: "Luta ou Fuga",
      descricao:
        "+2 em Vontade. Quando surge referência real à sua premonição de morte, ganha +2 PE temporários até o fim da cena.",
    },
    efeitosPassivos: { periciaBonus: { vontade: 2 } },
  },
  {
    id: "psicologo",
    nome: "Psicólogo",
    source: "sobrevivendo_ao_horror",
    pericias: ["intuicao", "profissao"],
    periciasNotas: ["Intuição", "Profissão (psicólogo)"],
    poder: {
      nome: "Terapia",
      peCost: 2,
      descricao:
        "Usa Profissão (psicólogo) como Diplomacia. 1x/rodada gasta 2 PE para substituir teste falho contra dano mental seu ou de aliado em alcance curto pelo resultado de Profissão.",
    },
  },
  {
    id: "reporter_investigativo",
    nome: "Repórter Investigativo",
    source: "sobrevivendo_ao_horror",
    pericias: ["atualidades", "investigacao"],
    poder: {
      nome: "Encontrar a Verdade",
      peCost: 2,
      descricao:
        "Usa Investigação no lugar de Diplomacia para persuadir/mudar atitude; gasta 2 PE para +5 em Investigação.",
    },
  },

  // ARQUIVOS SECRETOS (4)
  {
    id: "ferido_por_ritual",
    nome: "Ferido por Ritual",
    source: "arquivos_secretos",
    pericias: ["fortitude", "ocultismo"],
    poder: {
      nome: "Marca Ritualística",
      descricao:
        "Aprende 1 ritual de 1º círculo diretamente e pode conjurá-lo 1 vez por cena sem gastar PE.",
    },
  },
  {
    id: "cientista_ex_panacea",
    nome: "Cientista Ex-Panacea",
    source: "arquivos_secretos",
    pericias: ["ciencias", "medicina"],
    poder: {
      nome: "Conhecimento Tóxico",
      descricao:
        "Experiência nos laboratórios das Indústrias Panacea: lida com compostos químicos, venenos e análises biológicas anômalas com maestria.",
    },
  },
  {
    id: "influencer_paranormal",
    nome: "Influencer Paranormal",
    source: "arquivos_secretos",
    pericias: ["enganacao", "tecnologia"],
    poder: {
      nome: "Registrar o Paranormal",
      peCost: 2,
      descricao:
        "1x/cena, padrão e 2 PE registra criatura ou ritual em foto/vídeo: +5 contra Presença Perturbadora da criatura registrada e pode gastar interlúdio para memorizar 1 ritual registrado até o próximo interlúdio (respeitando NEX de círculo).",
    },
  },
  {
    id: "treinado_hell_hunters",
    nome: "Treinado pela Hell Hunters",
    source: "arquivos_secretos",
    pericias: ["luta", "fortitude"],
    poder: {
      nome: "Resistência do Treinamento",
      descricao:
        "Recebe +2 PV no NEX 5% e +1 PV adicional a cada 10% de NEX.",
    },
    efeitosPassivos: { pvFixo: 2, pvPor10Nex: 1 },
  },
];

export const BASE_ORIGINS: OriginDefinition[] = RAW_ORIGINS.map((o) => ({
  id: o.id,
  name: o.nome,
  source: o.source,
  description: o.poder.descricao,
  trainedSkills: o.pericias,
  trainedSkillNotes: o.periciasNotas,
  powerName: o.poder.nome,
  powerDescription: o.poder.descricao,
  powerPeCost: o.poder.peCost ?? 0,
  halfInitialSan: o.efeitosPassivos?.metadeSanInicial,
  efeitosPassivos: o.efeitosPassivos,
  passiveBonuses: o.efeitosPassivos
    ? {
        defense: o.efeitosPassivos.defesa,
        meleeDamage: o.efeitosPassivos.danoCorpoACorpo,
        firearmDamage: o.efeitosPassivos.danoArmasDeFogo,
        pvPerNexStep: o.efeitosPassivos.pvPor5Nex,
        mentalRdEqualsInt: Boolean(o.efeitosPassivos.rdMentalPorInt),
      }
    : undefined,
}));

export function getOriginById(
  originId: string | undefined | null,
  extraOrigins: OriginDefinition[] = []
): OriginDefinition | undefined {
  if (!originId) return undefined;
  const normalized = originId.replace(/-/g, "_");
  return [...BASE_ORIGINS, ...extraOrigins].find(
    (o) => o.id === originId || o.id === normalized
  );
}
