export type GlossaryTermKey =
  | "NEX"
  | "PV"
  | "SAN"
  | "PE"
  | "PD"
  | "DT"
  | "VD"
  | "RD"
  | "Patente"
  | "Categoria"
  | "Margem de Ameaça"
  | "Crítico"
  | "Afinidade"
  | "Membrana"
  | "Interlúdio"
  | "Defesa"
  | "Esquiva"
  | "Bloqueio";

export interface GlossaryEntry {
  term: GlossaryTermKey;
  title: string;
  shortExplanation: string;
  example?: string;
}

export const GLOSSARY: Record<GlossaryTermKey, GlossaryEntry> = {
  NEX: {
    term: "NEX",
    title: "Nível de Exposição Paranormal (NEX)",
    shortExplanation:
      "Mede de 5% a 99% o quanto seu personagem já teve contato com o Outro Lado. Funciona como o 'nível' do agente: a cada +5% de NEX você fica mais forte, mas também mais próximo do paranormal.",
    example: "Um agente iniciante começa em NEX 5% (ou NEX 0% se for Sobrevivente).",
  },
  PV: {
    term: "PV",
    title: "Pontos de Vida (PV)",
    shortExplanation:
      "Sua saúde e resistência física. Se chegar à metade você fica Machucado; se cair a 0 PV, entra em estado de Morrendo e precisa ser socorrido em até 3 rodadas.",
  },
  SAN: {
    term: "SAN",
    title: "Sanidade (SAN)",
    shortExplanation:
      "Sua estabilidade mental diante dos horrores do Outro Lado. Cai ao presenciar criaturas ou falhar no Custo do Paranormal. Se zerar, seu agente entra em Enlouquecendo.",
  },
  PE: {
    term: "PE",
    title: "Pontos de Esforço (PE)",
    shortExplanation:
      "Sua energia para ativar habilidades especiais, poderes e conjurar rituais. Você só pode gastar por turno até o seu Limite de PE.",
  },
  PD: {
    term: "PD",
    title: "Pontos de Determinação (PD)",
    shortExplanation:
      "Regra opcional de Sobrevivendo ao Horror que unifica Sanidade e Esforço em uma única barra de força de vontade.",
  },
  DT: {
    term: "DT",
    title: "Dificuldade do Teste (DT)",
    shortExplanation:
      "O número-alvo que você precisa igualar ou superar ao rolar seus dados (d20 + bônus da perícia) para ter sucesso em uma ação ou resistir a um efeito.",
    example: "Se a DT é 20 e você tirou 16 no dado + 5 de perícia = 21, você passou!",
  },
  VD: {
    term: "VD",
    title: "Valor de Desafio (VD)",
    shortExplanation:
      "Mede o quão letal é uma criatura ou ameaça (de VD 15 até VD 400). Para um combate equilibrado, a soma do VD dos inimigos costuma ser próxima à soma do NEX dos agentes.",
  },
  RD: {
    term: "RD",
    title: "Resistência a Dano (RD)",
    shortExplanation:
      "Reduz automaticamente o dano sofrido daquele tipo. Por exemplo, RD Corte 5 subtrai 5 pontos de qualquer dano de corte recebido.",
  },
  Patente: {
    term: "Patente",
    title: "Patente na Ordem",
    shortExplanation:
      "Seu cargo dentro da Ordo Realitas (de Recruta a Agente de Elite). Define quantos equipamentos de Categoria I, II, III e IV você pode requisitar para a missão.",
  },
  Categoria: {
    term: "Categoria",
    title: "Categoria de Item (0, I, II, III, IV)",
    shortExplanation:
      "Representa a raridade e o poder de um equipamento. Itens de Categoria 0 são livres; Categorias I a IV são limitadas pela sua Patente. Modificações e maldições aumentam a categoria do item.",
  },
  "Margem de Ameaça": {
    term: "Margem de Ameaça",
    title: "Margem de Ameaça (Crítico)",
    shortExplanation:
      "O valor mínimo no dado natural (d20) para conseguir um Acerto Crítico. Por padrão é 20, mas uma arma 18/x2 faz crítico tirando 18, 19 ou 20 no dado.",
  },
  Crítico: {
    term: "Crítico",
    title: "Multiplicador de Crítico (x2, x3, x4)",
    shortExplanation:
      "Ao acertar um ataque crítico, você multiplica os dados base de dano da arma pelo multiplicador (ex.: 1d8 com crítico x3 rola 3d8). Bônus fixos (+2) e dados extras não multiplicam.",
  },
  Afinidade: {
    term: "Afinidade",
    title: "Afinidade com Elemento (NEX 50%+)",
    shortExplanation:
      "Ao atingir NEX 50% e Transcender, você se conecta permanentemente a um elemento (Sangue, Morte, Conhecimento ou Energia), liberando os efeitos avançados de poderes paranormais daquele elemento.",
  },
  Membrana: {
    term: "Membrana",
    title: "Estado da Membrana",
    shortExplanation:
      "A barreira invisível que separa a nossa Realidade do Outro Lado. Quanto mais medo e violência em um local, mais fraca ela fica (Intacta → Estável → Danificada → Arruinada → Rompida).",
  },
  Interlúdio: {
    term: "Interlúdio",
    title: "Cena de Interlúdio",
    shortExplanation:
      "Momento de pausa e abrigo entre cenas de ação ou investigação. Cada agente pode realizar até 2 ações (Dormir, Relaxar, Alimentar-se, Exercitar-se, Ler ou Manutenção) para recuperar PV, SAN e PE.",
  },
  Defesa: {
    term: "Defesa",
    title: "Defesa Passiva",
    shortExplanation:
      "O valor que os inimigos precisam igualar ou superar no teste de ataque para acertar você. Calculada como 10 + Agilidade + bônus de Proteção/Escudo.",
  },
  Esquiva: {
    term: "Esquiva",
    title: "Reação de Esquiva",
    shortExplanation:
      "Se você for treinado em Reflexos, pode usar sua reação especial da rodada ao ser atacado para somar seu bônus de Reflexos à sua Defesa.",
  },
  Bloqueio: {
    term: "Bloqueio",
    title: "Reação de Bloqueio",
    shortExplanation:
      "Se você for treinado em Fortitude, pode usar sua reação especial ao sofrer um ataque corpo a corpo para ganhar RD igual ao seu bônus de Fortitude contra aquele golpe.",
  },
};
