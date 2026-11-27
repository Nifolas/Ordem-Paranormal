import type { ContentSource, ParanormalElement, Threat } from "@/types/ordem";
import bestiario1Sangue from "./bestiary/bestiario_1_sangue.json";
import bestiario2Morte from "./bestiary/bestiario_2_morte.json";

/**
 * Catálogo oficial de Ameaças do Livro Básico / Sobrevivendo ao Horror / Arquivos Secretos,
 * atualizado com 100% dos dados completos de `bestiario_1_sangue.json` e `bestiario_2_morte.json`.
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

interface BestiaryJsonEntry {
  id: string;
  nome: string;
  vd: number;
  elemento: string;
  elementosSecundarios?: string[];
  tipo?: string;
  tamanho: string;
  source?: string;
  presencaPerturbadora?: {
    dt: number;
    dano: string;
    imuneNex?: number;
  };
  sentidos?: {
    percepcao?: string;
    iniciativa?: string;
    especiais?: string[];
  };
  defesa: number;
  resistenciasTestes?: {
    fortitude?: string;
    reflexos?: string;
    vontade?: string;
  };
  pv: number;
  imunidades?: string;
  resistenciasDano?: string;
  vulnerabilidades?: string;
  atributos: { AGI: number; FOR: number; INT: number; PRE: number; VIG: number };
  pericias?: string[];
  deslocamento: string;
  ataques: {
    nome: string;
    acao?: string;
    alcance?: string;
    teste: string;
    critico?: string;
    dano: string;
  }[];
  habilidades: {
    nome: string;
    tipoAcao?: string;
    descricao: string;
  }[];
  enigmaDeMedo?: string;
}

function parseTestSpec(teste: string): { diceCount: number; testBonus: number } {
  const m = teste.match(/(\d+)d20\s*([+-]\s*\d+)?/i);
  if (!m) return { diceCount: 2, testBonus: 5 };
  return {
    diceCount: parseInt(m[1], 10),
    testBonus: m[2] ? parseInt(m[2].replace(/\s+/g, ""), 10) : 0,
  };
}

function parseCritSpec(critico?: string): { threatRange: number; critMultiplier: number } {
  if (!critico) return { threatRange: 20, critMultiplier: 2 };
  const m = critico.match(/(\d+)?\s*(?:\/\s*x(\d+)|x(\d+))?/i);
  const range = m?.[1] ? parseInt(m[1], 10) : 20;
  const mult = m?.[2] ? parseInt(m[2], 10) : m?.[3] ? parseInt(m[3], 10) : 2;
  return {
    threatRange: Number.isFinite(range) && range >= 1 && range <= 20 ? range : 20,
    critMultiplier: Number.isFinite(mult) && mult >= 2 ? mult : 2,
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

function parseSave(val?: string): number {
  if (!val) return 0;
  // Support both "+15" and "3d20+10" formats (extracts the flat bonus after d20 or standalone signed number)
  if (val.toLowerCase().includes("d20")) {
    return parseTestSpec(val).testBonus;
  }
  const n = parseInt(val.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function parseSkillString(raw: string, fallbackDice = 2): { name: string; dice: number; bonus: number } {
  const m = raw.match(/^(.+?)\s+(\d+)d20\s*([+-]\s*\d+)?$/i);
  if (m) {
    return {
      name: m[1].trim(),
      dice: parseInt(m[2], 10),
      bonus: m[3] ? parseInt(m[3].replace(/\s+/g, ""), 10) : 0,
    };
  }
  return { name: raw.trim(), dice: fallbackDice, bonus: 0 };
}

function normalizeThreatKey(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/^lb_/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const LEGACY_ID_ALIASES: Record<string, string> = {
  zumbi_bestial: "zumbi_de_sangue_bestial",
  carnical_preto: "carnical_preto_da_morte",
  deus_da_morte: "o_deus_da_morte",
};

function convertBestiaryJsonEntry(b: BestiaryJsonEntry, canonicalId?: string): Threat {
  const id = canonicalId || b.id;
  const element = (b.elemento as ParanormalElement) || "Sangue";
  const secondaryElements = (b.elementosSecundarios ?? []) as ParanormalElement[];
  const initSpec = parseTestSpec(b.sentidos?.iniciativa ?? `${b.atributos.AGI}d20`);
  const percSpec = parseTestSpec(b.sentidos?.percepcao ?? `${b.atributos.PRE}d20`);

  const skills: { name: string; dice: number; bonus: number }[] = [
    { name: "Iniciativa", dice: initSpec.diceCount, bonus: initSpec.testBonus },
    { name: "Percepção", dice: percSpec.diceCount, bonus: percSpec.testBonus },
  ];

  for (const p of b.pericias ?? []) {
    const parsed = parseSkillString(p, b.atributos.AGI);
    if (!skills.some((s) => s.name.toLowerCase() === parsed.name.toLowerCase())) {
      skills.push(parsed);
    }
  }

  return {
    id,
    name: b.nome,
    vd: b.vd,
    element,
    secondaryElements: secondaryElements.length > 0 ? secondaryElements : undefined,
    size: b.tamanho,
    type: b.tipo || (element === "Realidade" ? "Ameaça da Realidade" : "Criatura"),
    threatKind:
      element === "Realidade" ? "Ameaça da Realidade" : "Criatura Paranormal",
    pv: b.pv,
    defense: b.defesa,
    displacement: b.deslocamento,
    senses: b.sentidos
      ? {
          percepcao: b.sentidos.percepcao,
          iniciativa: b.sentidos.iniciativa,
          especiais: b.sentidos.especiais,
        }
      : undefined,
    saveFormulas: b.resistenciasTestes
      ? {
          fortitude: b.resistenciasTestes.fortitude,
          reflexos: b.resistenciasTestes.reflexos,
          vontade: b.resistenciasTestes.vontade,
        }
      : undefined,
    immunities: b.imunidades,
    disturbingPresence: {
      dt: b.presencaPerturbadora?.dt ?? 0,
      damage: b.presencaPerturbadora?.dano ?? "0",
      nexImmunity: b.presencaPerturbadora?.imuneNex,
    },
    enigmaOfFear: b.enigmaDeMedo,
    enigmaResolved: false,
    attributes: b.atributos,
    saves: {
      fortitude: parseSave(b.resistenciasTestes?.fortitude),
      reflexos: parseSave(b.resistenciasTestes?.reflexos),
      vontade: parseSave(b.resistenciasTestes?.vontade),
    },
    skills,
    resistances: b.resistenciasDano ?? "",
    vulnerabilities:
      b.vulnerabilidades && b.vulnerabilidades !== "Nenhuma"
        ? b.vulnerabilidades
        : undefined,
    attacks: b.ataques.map((a, idx) => {
      const test = parseTestSpec(a.teste);
      const dmg = parseDamageSpec(a.dano);
      const crit = parseCritSpec(a.critico);
      return {
        id: `${id}_atk_${idx + 1}`,
        name: a.nome,
        actionType: a.acao ?? "Padrão",
        range: a.alcance,
        diceCount: test.diceCount,
        testBonus: test.testBonus,
        damageFormula: dmg.formula,
        damageType: dmg.damageType,
        threatRange: crit.threatRange,
        critMultiplier: crit.critMultiplier,
        notes: [a.alcance, dmg.notes].filter(Boolean).join(" • ") || undefined,
      };
    }),
    abilities: b.habilidades.map((h, idx) => ({
      id: `${id}_ab_${idx + 1}`,
      name: h.nome,
      actionType: h.tipoAcao ?? "Passiva",
      description: h.descricao,
    })),
    description:
      b.habilidades[0]?.descricao ??
      `${b.tipo ?? "Criatura"} de ${element} (${b.tamanho}, VD ${b.vd}).`,
    source: (b.source as ContentSource) ?? "livro_basico",
  };
}

const RAW_THREATS: RawThreat[] = [
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

const NON_SANGUE_MORTE_THREATS: Threat[] = RAW_THREATS.map((t) => ({
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
      actionType: "Padrão",
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
    actionType: "Passiva",
    description: h.descricao,
  })),
  description: t.habilidades[0]?.descricao ?? "",
  source: t.source,
}));

const BESTIARY_SANGUE_THREATS: Threat[] = (
  bestiario1Sangue.ameacas as BestiaryJsonEntry[]
).map((entry) => convertBestiaryJsonEntry(entry));

const BESTIARY_MORTE_THREATS: Threat[] = (
  bestiario2Morte.ameacas as BestiaryJsonEntry[]
).map((entry) => convertBestiaryJsonEntry(entry));

export const BASE_THREATS: Threat[] = [
  ...BESTIARY_SANGUE_THREATS,
  ...BESTIARY_MORTE_THREATS,
  ...NON_SANGUE_MORTE_THREATS,
];

/**
 * Faz o merge e deduplicação de ameaças persistidas no localStorage com o catálogo
 * atualizado de BASE_THREATS (substituindo fichas antigas incompletas por nome/id).
 */
export function mergePersistedThreatsWithBase(persistedThreats: Threat[]): Threat[] {
  const baseByKey = new Map<string, Threat>();
  const baseById = new Map<string, Threat>();

  for (const bt of BASE_THREATS) {
    baseById.set(bt.id, bt);
    baseByKey.set(normalizeThreatKey(bt.id), bt);
    baseByKey.set(normalizeThreatKey(bt.name), bt);
  }

  for (const [legacyId, targetKey] of Object.entries(LEGACY_ID_ALIASES)) {
    const target = baseByKey.get(targetKey);
    if (target) {
      baseById.set(legacyId, target);
      baseByKey.set(legacyId, target);
    }
  }

  const seenCanonicalIds = new Set<string>();
  const merged: Threat[] = [];

  for (const pt of persistedThreats) {
    if (pt.isHomebrew) {
      merged.push(pt);
      continue;
    }
    const normId = normalizeThreatKey(pt.id);
    const normName = normalizeThreatKey(pt.name);
    const matchedBase =
      baseById.get(pt.id) ??
      baseByKey.get(normId) ??
      baseByKey.get(normName);

    if (matchedBase) {
      if (!seenCanonicalIds.has(matchedBase.id)) {
        seenCanonicalIds.add(matchedBase.id);
        merged.push({
          ...matchedBase,
          enigmaResolved: Boolean(pt.enigmaResolved ?? matchedBase.enigmaResolved),
        });
      }
    } else {
      merged.push(pt);
    }
  }

  for (const bt of BASE_THREATS) {
    if (!seenCanonicalIds.has(bt.id)) {
      seenCanonicalIds.add(bt.id);
      merged.push(bt);
    }
  }

  return merged;
}
