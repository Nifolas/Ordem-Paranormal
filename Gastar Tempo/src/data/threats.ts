import type { ContentSource, ParanormalElement, Threat } from "@/types/ordem";

/**
 * LOTE 7 (Parte A) — Catálogo completo de 28 Ameaças
 * (Criaturas de Sangue, Morte, Conhecimento, Energia e Medo de VD 20 a 400 + Ameaças da Realidade).
 */
interface RawThreat {
  id: string;
  nome: string;
  elemento: ParanormalElement;
  vd: number;
  tamanho: string;
  pv: number;
  defesa: number;
  deslocamento: string;
  presencaPerturbadora: { dt: number; dano: string; nexImune: number };
  atributos: { AGI: number; FOR: number; INT: number; PRE: number; VIG: number };
  resistencias: { Fortitude: string; Reflexos: string; Vontade: string };
  rd: string;
  vulnerabilidades: string;
  ataques: { nome: string; teste: string; dano: string }[];
  habilidades: { nome: string; descricao: string }[];
  enigmaDeMedo?: string;
  source: ContentSource;
}

function parseTestSpec(teste: string): { diceCount: number; testBonus: number } {
  const m = teste.match(/(\d+)d20\s*([+-]\s*\d+)?/i);
  if (!m) return { diceCount: 2, testBonus: 5 };
  return {
    diceCount: parseInt(m[1], 10),
    testBonus: m[2] ? parseInt(m[2].replace(/\s+/g, ""), 10) : 0,
  };
}

function parseDamageSpec(raw: string): { formula: string; damageType: string; notes?: string } {
  const diceTokens = raw.match(/\d+d\d+(?:[+-]\d+)?/gi);
  const formula = diceTokens ? diceTokens.join("+") : "1d6";
  const cleanedType = raw
    .replace(/\d+d\d+(?:[+-]\d+)?/gi, "")
    .replace(/\+/g, "/")
    .replace(/\s+/g, " ")
    .replace(/^[\s/]+|[\s/]+$/g, "");
  return {
    formula,
    damageType: cleanedType || "Físico",
    notes: raw !== `${formula} ${cleanedType}` ? raw : undefined,
  };
}

function parseSave(val: string): number {
  const n = parseInt(val.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

const RAW_THREATS: RawThreat[] = [
  // SANGUE (6)
  { id: "zumbi_de_sangue", nome: "Zumbi de Sangue", elemento: "Sangue", vd: 20, tamanho: "Médio", pv: 45, defesa: 17, deslocamento: "9m", presencaPerturbadora: { dt: 15, dano: "2d6", nexImune: 25 }, atributos: { AGI: 2, FOR: 2, INT: 0, PRE: 1, VIG: 2 }, resistencias: { Fortitude: "+5", Reflexos: "+5", Vontade: "+5" }, rd: "Balístico/Corte/Perfuração 5, Sangue 10", vulnerabilidades: "Morte", ataques: [{ nome: "Garras", teste: "2d20+10", dano: "1d6+5 corte" }], habilidades: [{ nome: "Frenesi", descricao: "Quando fica machucado, faz 2 ataques de garras por ação agredir." }], source: "livro_basico" },
  { id: "aberracao_de_carne", nome: "Aberração de Carne", elemento: "Sangue", vd: 40, tamanho: "Grande", pv: 70, defesa: 19, deslocamento: "6m", presencaPerturbadora: { dt: 16, dano: "2d8", nexImune: 30 }, atributos: { AGI: 1, FOR: 3, INT: 0, PRE: 1, VIG: 3 }, resistencias: { Fortitude: "+10", Reflexos: "+5", Vontade: "+5" }, rd: "Sangue 10", vulnerabilidades: "Morte", ataques: [{ nome: "Pancada (2x)", teste: "3d20+10", dano: "2d6+6 impacto" }], habilidades: [{ nome: "Agarrão", descricao: "Ao acertar pancada, tenta agarrar como ação livre; pode absorver alvo agarrado causando 2d6 Sangue/turno." }], source: "livro_basico" },
  { id: "zumbi_bestial", nome: "Zumbi de Sangue Bestial", elemento: "Sangue", vd: 100, tamanho: "Grande", pv: 200, defesa: 23, deslocamento: "12m", presencaPerturbadora: { dt: 20, dano: "4d6", nexImune: 50 }, atributos: { AGI: 3, FOR: 4, INT: 0, PRE: 2, VIG: 4 }, resistencias: { Fortitude: "+15", Reflexos: "+10", Vontade: "+5" }, rd: "Físico 10, Sangue 20", vulnerabilidades: "Morte", ataques: [{ nome: "Mordida", teste: "4d20+15", dano: "2d10+10 perfuração" }, { nome: "Garras (2x)", teste: "4d20+15", dano: "2d6+10 corte" }], habilidades: [{ nome: "Bote", descricao: "Ao fazer investida, ataca com mordida e duas garras." }], source: "livro_basico" },
  { id: "enpap_x", nome: "Enpap-X", elemento: "Sangue", vd: 180, tamanho: "Grande", pv: 360, defesa: 32, deslocamento: "12m", presencaPerturbadora: { dt: 25, dano: "4d8", nexImune: 65 }, atributos: { AGI: 3, FOR: 5, INT: 1, PRE: 3, VIG: 5 }, resistencias: { Fortitude: "+20", Reflexos: "+15", Vontade: "+10" }, rd: "Físico 10, Sangue 20", vulnerabilidades: "Morte", ataques: [{ nome: "Correntes/Pancada (2x)", teste: "5d20+25", dano: "3d8+15 impacto" }], habilidades: [{ nome: "Fúria Desenfreada", descricao: "Recebe +1 ataque e +10 dano quando machucado; emite grito mental em alcance médio." }], source: "livro_basico" },
  { id: "carente", nome: "Carente", elemento: "Sangue", vd: 300, tamanho: "Grande", pv: 650, defesa: 42, deslocamento: "12m", presencaPerturbadora: { dt: 35, dano: "6d8", nexImune: 85 }, atributos: { AGI: 4, FOR: 5, INT: 2, PRE: 4, VIG: 5 }, resistencias: { Fortitude: "+25", Reflexos: "+20", Vontade: "+15" }, rd: "Físico 20, Sangue 20", vulnerabilidades: "Morte", ataques: [{ nome: "Garras (2x)", teste: "5d20+35", dano: "4d10+20 corte" }, { nome: "Ferrão", teste: "5d20+35", dano: "4d12+20 perfuração" }], habilidades: [{ nome: "Drenar Vitalidade", descricao: "Recupera PV iguais ao dano do Ferrão." }], source: "livro_basico" },
  { id: "o_diabo", nome: "O Diabo (Relíquia de Sangue)", elemento: "Sangue", vd: 400, tamanho: "Médio", pv: 1666, defesa: 60, deslocamento: "18m", presencaPerturbadora: { dt: 45, dano: "10d8", nexImune: 99 }, atributos: { AGI: 6, FOR: 6, INT: 5, PRE: 6, VIG: 6 }, resistencias: { Fortitude: "+35", Reflexos: "+35", Vontade: "+35" }, rd: "Imune a dano até resolver Enigma de Medo", vulnerabilidades: "Morte", ataques: [{ nome: "Chifre / Garras (2x)", teste: "6d20+45", dano: "4d12+30 Sangue" }], habilidades: [{ nome: "Pacto e Invocação", descricao: "Invoca criaturas de Sangue e manipula desejos de sangue." }], enigmaDeMedo: "Quando o Enigma de Medo do Diabo for resolvido, perde imunidade a dano e resistências caem para +25.", source: "livro_basico" },

  // MORTE (5)
  { id: "esqueleto_de_lodo", nome: "Esqueleto de Lodo", elemento: "Morte", vd: 20, tamanho: "Médio", pv: 40, defesa: 16, deslocamento: "9m", presencaPerturbadora: { dt: 15, dano: "2d6", nexImune: 25 }, atributos: { AGI: 2, FOR: 2, INT: 0, PRE: 1, VIG: 2 }, resistencias: { Fortitude: "+5", Reflexos: "+5", Vontade: "+5" }, rd: "Corte/Perfuração 5, Morte 10", vulnerabilidades: "Energia", ataques: [{ nome: "Garras", teste: "2d20+10", dano: "2d6+4 corte" }], habilidades: [{ nome: "Imortalidade de Lodo", descricao: "Ao cair a 0 PV, reforma-se em 1d4 rodadas com metade dos PV a menos que sofra dano de Energia ou fogo." }], source: "livro_basico" },
  { id: "enraizado", nome: "Enraizado", elemento: "Morte", vd: 60, tamanho: "Médio", pv: 110, defesa: 21, deslocamento: "6m", presencaPerturbadora: { dt: 18, dano: "3d6", nexImune: 40 }, atributos: { AGI: 1, FOR: 3, INT: 0, PRE: 2, VIG: 3 }, resistencias: { Fortitude: "+10", Reflexos: "+5", Vontade: "+10" }, rd: "Físico 5, Morte 10", vulnerabilidades: "Energia", ataques: [{ nome: "Raízes (2x)", teste: "3d20+12", dano: "2d6+6 impacto + 1d6 Morte" }], habilidades: [{ nome: "Espiral Parasita", descricao: "Agarra alvos em alcance curto com raízes de lodo." }], source: "livro_basico" },
  { id: "aracnasita", nome: "Aracnasita", elemento: "Morte", vd: 80, tamanho: "Grande", pv: 140, defesa: 24, deslocamento: "12m (escalada)", presencaPerturbadora: { dt: 20, dano: "3d6", nexImune: 45 }, atributos: { AGI: 3, FOR: 3, INT: 1, PRE: 2, VIG: 3 }, resistencias: { Fortitude: "+10", Reflexos: "+15", Vontade: "+10" }, rd: "Morte 10", vulnerabilidades: "Energia", ataques: [{ nome: "Mordida", teste: "3d20+15", dano: "2d8+8 perfuração + veneno de lodo" }], habilidades: [{ nome: "Teia Temporal", descricao: "Prende alvos em teias negras (Reflexos DT 20 evita) e drena tempo de vida." }], source: "livro_basico" },
  { id: "carnical_preto", nome: "Carniçal Preto da Morte", elemento: "Morte", vd: 200, tamanho: "Médio", pv: 400, defesa: 35, deslocamento: "12m", presencaPerturbadora: { dt: 30, dano: "6d6", nexImune: 75 }, atributos: { AGI: 3, FOR: 4, INT: 3, PRE: 4, VIG: 4 }, resistencias: { Fortitude: "+20", Reflexos: "+15", Vontade: "+20" }, rd: "Físico 10, Morte 20", vulnerabilidades: "Energia", ataques: [{ nome: "Garras (2x)", teste: "4d20+25", dano: "3d8+15 Morte" }], habilidades: [{ nome: "Hipnose Espiral", descricao: "Reanima cadáveres próximos como Esqueletos de Lodo e hipnotiza alvos (Vontade DT 30)." }], source: "livro_basico" },
  { id: "deus_da_morte", nome: "O Deus da Morte (Relíquia de Morte)", elemento: "Morte", vd: 400, tamanho: "Enorme", pv: 2000, defesa: 60, deslocamento: "18m", presencaPerturbadora: { dt: 45, dano: "10d8", nexImune: 99 }, atributos: { AGI: 5, FOR: 6, INT: 5, PRE: 6, VIG: 6 }, resistencias: { Fortitude: "+35", Reflexos: "+30", Vontade: "+35" }, rd: "Imune a dano até resolver Enigma de Medo", vulnerabilidades: "Energia", ataques: [{ nome: "Toque Entrópico (2x)", teste: "6d20+45", dano: "4d12+30 Morte" }], habilidades: [{ nome: "Distorção Absoluta", descricao: "Age duas vezes por rodada e consome tempo vital em área." }], enigmaDeMedo: "Necessita abalar o fluxo temporal com Energia pura para perder a imunidade a dano.", source: "livro_basico" },

  // CONHECIMENTO (5)
  { id: "existido", nome: "Existido", elemento: "Conhecimento", vd: 20, tamanho: "Médio", pv: 36, defesa: 14, deslocamento: "9m", presencaPerturbadora: { dt: 15, dano: "2d6", nexImune: 25 }, atributos: { AGI: 1, FOR: 1, INT: 2, PRE: 2, VIG: 1 }, resistencias: { Fortitude: "+5", Reflexos: "+5", Vontade: "+10" }, rd: "Conhecimento 10", vulnerabilidades: "Sangue", ataques: [{ nome: "Pancada", teste: "1d20+5", dano: "1d4+1 impacto" }], habilidades: [{ nome: "Fulgor Mental", descricao: "Ação padrão: sussurros causam 2d6 dano mental em alcance curto (Vontade DT 15 reduz metade)." }], source: "livro_basico" },
  { id: "vulto", nome: "Vulto", elemento: "Conhecimento", vd: 40, tamanho: "Médio", pv: 60, defesa: 20, deslocamento: "12m", presencaPerturbadora: { dt: 16, dano: "2d8", nexImune: 30 }, atributos: { AGI: 3, FOR: 1, INT: 2, PRE: 2, VIG: 1 }, resistencias: { Fortitude: "+5", Reflexos: "+10", Vontade: "+10" }, rd: "Conhecimento 10", vulnerabilidades: "Sangue", ataques: [{ nome: "Toque Sombrio", teste: "3d20+12", dano: "2d6+4 Conhecimento" }], habilidades: [{ nome: "Sombra Oculta", descricao: "Esconde-se instantaneamente em áreas de penumbra (+15 Furtividade)." }], source: "livro_basico" },
  { id: "espreitador", nome: "Espreitador", elemento: "Conhecimento", vd: 140, tamanho: "Médio", pv: 240, defesa: 28, deslocamento: "12m", presencaPerturbadora: { dt: 25, dano: "4d6", nexImune: 60 }, atributos: { AGI: 4, FOR: 2, INT: 3, PRE: 4, VIG: 2 }, resistencias: { Fortitude: "+10", Reflexos: "+20", Vontade: "+20" }, rd: "Conhecimento 20", vulnerabilidades: "Sangue", ataques: [{ nome: "Garras Alongadas (2x)", teste: "4d20+20", dano: "3d6+10 Conhecimento" }], habilidades: [{ nome: "Pesadelo Vigilante", descricao: "Marca vítimas observadas à distância e ataca de surpresa drenando SAN." }], source: "livro_basico" },
  { id: "estrangeiro", nome: "Estrangeiro", elemento: "Conhecimento", vd: 340, tamanho: "Grande", pv: 800, defesa: 48, deslocamento: "15m (voo)", presencaPerturbadora: { dt: 40, dano: "8d8", nexImune: 90 }, atributos: { AGI: 4, FOR: 3, INT: 5, PRE: 5, VIG: 4 }, resistencias: { Fortitude: "+20", Reflexos: "+25", Vontade: "+30" }, rd: "Físico 20, Conhecimento 20", vulnerabilidades: "Sangue", ataques: [{ nome: "Raio de Transmissão", teste: "5d20+38", dano: "6d10+20 Conhecimento" }], habilidades: [{ nome: "Sinal Alienígena", descricao: "Apaga memórias e paralisa agentes em alcance médio (Vontade DT 40)." }], source: "sobrevivendo_ao_horror" },
  { id: "magistrada", nome: "A Magistrada (Máscara do Desespero)", elemento: "Conhecimento", vd: 400, tamanho: "Médio", pv: 1500, defesa: 60, deslocamento: "18m", presencaPerturbadora: { dt: 45, dano: "10d8", nexImune: 99 }, atributos: { AGI: 5, FOR: 3, INT: 6, PRE: 6, VIG: 5 }, resistencias: { Fortitude: "+30", Reflexos: "+35", Vontade: "+40" }, rd: "Imune a dano até resolver Enigma de Medo", vulnerabilidades: "Sangue", ataques: [{ nome: "Reescrever Realidade", teste: "6d20+45", dano: "6d12+25 Conhecimento" }], habilidades: [{ nome: "Onipresença", descricao: "Teleporta-se livremente entre sombras e conhece todas as intenções." }], enigmaDeMedo: "Abalar o Equilíbrio através do Medo ou confrontar com a Relíquia de Sangue remove imunidade a dano e Onipresença.", source: "livro_basico" },

  // ENERGIA (6)
  { id: "anarquico", nome: "Anárquico", elemento: "Energia", vd: 20, tamanho: "Médio", pv: 32, defesa: 16, deslocamento: "12m", presencaPerturbadora: { dt: 15, dano: "2d6", nexImune: 25 }, atributos: { AGI: 3, FOR: 1, INT: 1, PRE: 1, VIG: 1 }, resistencias: { Fortitude: "+5", Reflexos: "+10", Vontade: "+5" }, rd: "Energia 10", vulnerabilidades: "Conhecimento", ataques: [{ nome: "Toque Caótico", teste: "3d20+10", dano: "1d8+4 Energia" }], habilidades: [{ nome: "Explosão Aleatória", descricao: "Ao morrer explode em 3m causando 3d6 Energia (Reflexos DT 15 reduz metade)." }], source: "livro_basico" },
  { id: "simulacro_exe", nome: "Simulacro.EXE", elemento: "Energia", vd: 32, tamanho: "Minúsculo", pv: 70, defesa: 10, deslocamento: "0m", presencaPerturbadora: { dt: 15, dano: "2d6", nexImune: 30 }, atributos: { AGI: 0, FOR: 0, INT: 1, PRE: 1, VIG: 0 }, resistencias: { Fortitude: "+5", Reflexos: "+5", Vontade: "+5" }, rd: "Imune a dano (exceto Conhecimento)", vulnerabilidades: "Conhecimento", ataques: [{ nome: "Interferência Digital", teste: "1d20+5", dano: "2d6 mental" }], habilidades: [{ nome: "Exorcismo Digital", descricao: "Além de dano de Conhecimento, pode ser exorcizado por 2 agentes (teste estendido Ocultismo, 3 sucessos) sem eletrônicos ligados em 9m e sigilos em objeto analógico." }], source: "arquivos_secretos" },
  { id: "sukkalgir", nome: "Sukkalgir", elemento: "Energia", vd: 80, tamanho: "Médio", pv: 130, defesa: 24, deslocamento: "12m (voo)", presencaPerturbadora: { dt: 20, dano: "3d6", nexImune: 45 }, atributos: { AGI: 3, FOR: 1, INT: 2, PRE: 3, VIG: 2 }, resistencias: { Fortitude: "+5", Reflexos: "+15", Vontade: "+15" }, rd: "Energia 10", vulnerabilidades: "Conhecimento", ataques: [{ nome: "Garras Etéreas (2x)", teste: "3d20+15", dano: "2d6+6 Energia" }], habilidades: [{ nome: "Grito de Desespero", descricao: "Alcance médio sofre 3d12 dano mental (Vontade DT 20 reduz metade; cobertura dá +5)." }], source: "livro_basico" },
  { id: "telopsia", nome: "Telopsia", elemento: "Energia", vd: 220, tamanho: "Médio", pv: 440, defesa: 36, deslocamento: "15m", presencaPerturbadora: { dt: 30, dano: "6d6", nexImune: 75 }, atributos: { AGI: 4, FOR: 3, INT: 3, PRE: 4, VIG: 4 }, resistencias: { Fortitude: "+15", Reflexos: "+25", Vontade: "+20" }, rd: "Físico 10, Energia 20", vulnerabilidades: "Conhecimento", ataques: [{ nome: "Estática Cortante (2x)", teste: "4d20+28", dano: "4d8+15 Energia" }], habilidades: [{ nome: "Fita Amaldiçoada", descricao: "Persegue quem assistiu à gravação; manifesta-se através de telas." }], enigmaDeMedo: "Destruir ou reverter a transmissão original desabilita sua regeneração por telas.", source: "livro_basico" },
  { id: "anomalia", nome: "Anomalia", elemento: "Energia", vd: 380, tamanho: "Variável", pv: 1000, defesa: 52, deslocamento: "18m", presencaPerturbadora: { dt: 42, dano: "8d8", nexImune: 95 }, atributos: { AGI: 5, FOR: 5, INT: 5, PRE: 5, VIG: 5 }, resistencias: { Fortitude: "+30", Reflexos: "+35", Vontade: "+30" }, rd: "Imune até resolver Enigma de Medo", vulnerabilidades: "Conhecimento", ataques: [{ nome: "Colapso Caótico", teste: "5d20+40", dano: "6d12+25 Energia" }], habilidades: [{ nome: "Realidade Instável", descricao: "Altera leis físicas em alcance longo a cada rodada." }], enigmaDeMedo: "Mergulhar na anomalia para entendê-la no Outro Lado faz com que se transforme em ser/objeto aleatório por 2d4 rodadas, perdendo imunidade.", source: "livro_basico" },
  { id: "anfitriao", nome: "O Anfitrião (Relíquia de Energia)", elemento: "Energia", vd: 400, tamanho: "Médio", pv: 1600, defesa: 60, deslocamento: "18m", presencaPerturbadora: { dt: 45, dano: "10d8", nexImune: 99 }, atributos: { AGI: 6, FOR: 4, INT: 6, PRE: 6, VIG: 5 }, resistencias: { Fortitude: "+30", Reflexos: "+40", Vontade: "+35" }, rd: "Imune a dano até resolver Enigma de Medo", vulnerabilidades: "Conhecimento", ataques: [{ nome: "Jogos Mortais (2x)", teste: "6d20+45", dano: "5d12+30 Energia" }], habilidades: [{ nome: "Caos Supremo", descricao: "Cria múltiplas facetas (Anfíbio, Artista, etc.) e impõe jogos de azar letais." }], enigmaDeMedo: "Vencer o jogo imposto pelo Anfitrião ou impor ordem absoluta de Conhecimento remove sua imunidade.", source: "livro_basico" },

  // MEDO (2)
  { id: "degolificada", nome: "Degolificada", elemento: "Medo", vd: 320, tamanho: "Médio", pv: 720, defesa: 44, deslocamento: "15m", presencaPerturbadora: { dt: 38, dano: "8d6", nexImune: 90 }, atributos: { AGI: 5, FOR: 4, INT: 2, PRE: 5, VIG: 4 }, resistencias: { Fortitude: "+20", Reflexos: "+25", Vontade: "+25" }, rd: "Imune a dano até resolver Enigma de Medo", vulnerabilidades: "Varia conforme causa da morte", ataques: [{ nome: "Esmagar / Grito", teste: "5d20+35", dano: "4d12+20 Sangue/Morte" }], habilidades: [{ nome: "Manifestação do Trauma", descricao: "Cada Degolificada manifesta poderes do elemento ligado à sua morte brutal." }], enigmaDeMedo: "Descobrir a identidade e expor a verdade/causa da morte da vítima remove sua imunidade a dano.", source: "livro_basico" },
  { id: "amigo_imaginario", nome: "Amigo Imaginário", elemento: "Medo", vd: 340, tamanho: "Grande", pv: 820, defesa: 46, deslocamento: "12m", presencaPerturbadora: { dt: 40, dano: "8d6", nexImune: 90 }, atributos: { AGI: 4, FOR: 5, INT: 3, PRE: 5, VIG: 5 }, resistencias: { Fortitude: "+25", Reflexos: "+25", Vontade: "+30" }, rd: "Físico 20, Medo", vulnerabilidades: "Resolução de Enigma", ataques: [{ nome: "Tentáculos de Tinta (2x)", teste: "5d20+36", dano: "4d10+20 químico" }], habilidades: [{ nome: "Dissolver", descricao: "Ação completa em alvo agarrado: 4d10+20 dano químico (Fortitude DT 40 metade) e recupera PV iguais ao dano." }], enigmaDeMedo: "Confrontar o vínculo artístico/memorial da pintura que originou a criatura.", source: "sobrevivendo_ao_horror" },

  // REALIDADE (5)
  { id: "cultista_iniciado", nome: "Cultista Iniciado", elemento: "Realidade", vd: 15, tamanho: "Médio", pv: 28, defesa: 14, deslocamento: "9m", presencaPerturbadora: { dt: 0, dano: "0", nexImune: 0 }, atributos: { AGI: 1, FOR: 1, INT: 2, PRE: 2, VIG: 1 }, resistencias: { Fortitude: "+2", Reflexos: "+2", Vontade: "+5" }, rd: "Nenhuma", vulnerabilidades: "Nenhuma", ataques: [{ nome: "Punhal", teste: "1d20+5", dano: "1d4+1 perfuração" }], habilidades: [{ nome: "Rituais de 1º Círculo", descricao: "Pode conjurar 2 rituais de 1º círculo (DT 15)." }], source: "livro_basico" },
  { id: "bandido_capanga", nome: "Bandido / Capanga", elemento: "Realidade", vd: 20, tamanho: "Médio", pv: 40, defesa: 16, deslocamento: "9m", presencaPerturbadora: { dt: 0, dano: "0", nexImune: 0 }, atributos: { AGI: 2, FOR: 2, INT: 1, PRE: 1, VIG: 2 }, resistencias: { Fortitude: "+5", Reflexos: "+5", Vontade: "+0" }, rd: "Nenhuma", vulnerabilidades: "Nenhuma", ataques: [{ nome: "Pistola", teste: "2d20+8", dano: "1d12 balístico" }, { nome: "Faca", teste: "2d20+8", dano: "1d4+2 corte" }], habilidades: [{ nome: "Emboscada", descricao: "+1d6 de dano contra alvos desprevenidos." }], source: "livro_basico" },
  { id: "policial_seguranca", nome: "Policial / Segurança Armado", elemento: "Realidade", vd: 30, tamanho: "Médio", pv: 50, defesa: 18, deslocamento: "9m", presencaPerturbadora: { dt: 0, dano: "0", nexImune: 0 }, atributos: { AGI: 2, FOR: 2, INT: 1, PRE: 2, VIG: 2 }, resistencias: { Fortitude: "+5", Reflexos: "+5", Vontade: "+5" }, rd: "Nenhuma", vulnerabilidades: "Nenhuma", ataques: [{ nome: "Pistola", teste: "2d20+10", dano: "1d12+2 balístico" }, { nome: "Bastão", teste: "2d20+8", dano: "1d6+2 impacto" }], habilidades: [{ nome: "Treinamento Tático", descricao: "Recebe +2 em ataques quando atua em dupla." }], source: "livro_basico" },
  { id: "tarrafa", nome: "Tarrafa (Transtornado)", elemento: "Realidade", vd: 60, tamanho: "Médio", pv: 80, defesa: 21, deslocamento: "9m", presencaPerturbadora: { dt: 0, dano: "0", nexImune: 0 }, atributos: { AGI: 3, FOR: 2, INT: 0, PRE: 1, VIG: 2 }, resistencias: { Fortitude: "+5", Reflexos: "+10", Vontade: "+2" }, rd: "Nenhuma", vulnerabilidades: "Nenhuma", ataques: [{ nome: "Arpão", teste: "3d20+10", dano: "2d6+4 perfuração" }], habilidades: [{ nome: "Perfuração Permanente", descricao: "Acerto de arremesso deixa alvo lento até gastar ação padrão e passar em Atletismo/Luta DT 20." }], source: "arquivos_secretos" },
  { id: "serial_killer", nome: "Serial Killer (Predador Sofisticado)", elemento: "Realidade", vd: 80, tamanho: "Médio", pv: 120, defesa: 22, deslocamento: "9m", presencaPerturbadora: { dt: 18, dano: "2d6", nexImune: 40 }, atributos: { AGI: 3, FOR: 2, INT: 3, PRE: 3, VIG: 2 }, resistencias: { Fortitude: "+10", Reflexos: "+12", Vontade: "+10" }, rd: "Nenhuma", vulnerabilidades: "Nenhuma", ataques: [{ nome: "Lâmina Oculta (2x)", teste: "3d20+14", dano: "2d6+6 corte" }], habilidades: [{ nome: "Caçada Metódica", descricao: "Prepara armadilhas mortais e causa +2d6 de dano em alvos isolados ou desprevenidos." }], source: "sobrevivendo_ao_horror" },
];

export const BASE_THREATS: Threat[] = RAW_THREATS.map((t) => ({
  id: t.id,
  name: t.nome,
  vd: t.vd,
  element: t.elemento,
  size: t.tamanho,
  type: t.elemento === "Realidade" ? "Ameaça da Realidade" : "Criatura",
  threatKind:
    t.elemento === "Realidade" ? "Ameaça da Realidade" : "Criatura Paranormal",
  pv: t.pv,
  defense: t.defesa,
  displacement: t.deslocamento,
  disturbingPresence: {
    dt: t.presencaPerturbadora.dt,
    damage: t.presencaPerturbadora.dano,
    nexImmunity: t.presencaPerturbadora.nexImune,
  },
  enigmaOfFear: t.enigmaDeMedo,
  enigmaResolved: false,
  attributes: t.atributos,
  saves: {
    fortitude: parseSave(t.resistencias.Fortitude),
    reflexos: parseSave(t.resistencias.Reflexos),
    vontade: parseSave(t.resistencias.Vontade),
  },
  skills: [
    { name: "Iniciativa", dice: t.atributos.AGI, bonus: parseSave(t.resistencias.Reflexos) },
    { name: "Percepção", dice: t.atributos.PRE, bonus: parseSave(t.resistencias.Vontade) },
  ],
  resistances: t.rd,
  vulnerabilities: t.vulnerabilidades !== "Nenhuma" ? t.vulnerabilidades : undefined,
  attacks: t.ataques.map((a, idx) => {
    const test = parseTestSpec(a.teste);
    const dmg = parseDamageSpec(a.dano);
    return {
      id: `${t.id}_atk_${idx + 1}`,
      name: a.nome,
      diceCount: test.diceCount,
      testBonus: test.testBonus,
      damageFormula: dmg.formula,
      damageType: dmg.damageType,
      threatRange: 20,
      critMultiplier: 2,
      notes: dmg.notes,
    };
  }),
  abilities: t.habilidades.map((h, idx) => ({
    id: `${t.id}_ab_${idx + 1}`,
    name: h.nome,
    description: h.descricao,
  })),
  description: t.habilidades[0]?.descricao ?? "",
  source: t.source,
}));
