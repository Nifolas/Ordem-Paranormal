import type {
  ContentSource,
  CurseDefinition,
  InventoryItem,
  ItemCategory,
  ItemCategoryType,
  ModificationDefinition,
  ParanormalElement,
} from "@/types/ordem";

/**
 * LOTE 6 — Catálogo Completo Organizado nas 9 Categorias Padronizadas:
 * - 36 Armas (`arma`)
 * - 4 Proteções (`protecao`)
 * - 6 Munições (`municao`)
 * - 6 Acessórios (`acessorio`)
 * - 5 Explosivos (`explosivo`)
 * - 17 Itens Operacionais (`operacional`)
 * - 4 Medicamentos (`medicamento`)
 * - 9 Itens Paranormais (`paranormal`)
 * - 18 Itens Amaldiçoados (`amaldicoado`)
 * Total: 105 itens + 24 Modificações + 24 Maldições.
 */

export interface ItemCategoryMeta {
  key: ItemCategoryType;
  index: string;
  label: string;
  shortLabel: string;
  singular: string;
  description: string;
}

export const ITEM_CATEGORY_META: ItemCategoryMeta[] = [
  {
    key: "arma",
    index: "01",
    label: "Armas",
    shortLabel: "Armas",
    singular: "Arma",
    description: "Corpo a corpo, disparo e armas de fogo (Simples, Táticas e Pesadas).",
  },
  {
    key: "protecao",
    index: "02",
    label: "Proteções",
    shortLabel: "Proteções",
    singular: "Proteção",
    description: "Coletes, equipamentos táticos pesados e escudos.",
  },
  {
    key: "municao",
    index: "03",
    label: "Munições",
    shortLabel: "Munições",
    singular: "Munição",
    description: "Pacotes de balas, cartuchos, flechas, combustível e foguetes.",
  },
  {
    key: "acessorio",
    index: "04",
    label: "Acessórios",
    shortLabel: "Acessórios",
    singular: "Acessório",
    description: "Kits de perícia, utensílios, vestimentas e documentos.",
  },
  {
    key: "explosivo",
    index: "05",
    label: "Explosivos",
    shortLabel: "Explosivos",
    singular: "Explosivo",
    description: "Granadas táticas e minas antipessoal.",
  },
  {
    key: "operacional",
    index: "06",
    label: "Itens Operacionais",
    shortLabel: "Operacionais",
    singular: "Operacional",
    description: "Ferramentas de campo, iluminação, escalada, contenção e proteção.",
  },
  {
    key: "medicamento",
    index: "07",
    label: "Medicamentos",
    shortLabel: "Medicamentos",
    singular: "Medicamento",
    description: "Consumíveis médicos de emergência e estabilização em campo.",
  },
  {
    key: "paranormal",
    index: "08",
    label: "Itens Paranormais",
    shortLabel: "Paranormais",
    singular: "Item Paranormal",
    description: "Componentes ritualísticos, selos, catalisadores e sensores da Membrana.",
  },
  {
    key: "amaldicoado",
    index: "09",
    label: "Itens Amaldiçoados",
    shortLabel: "Amaldiçoados",
    singular: "Item Amaldiçoado",
    description: "Artefatos tocados diretamente pelos elementos do Outro Lado.",
  },
];

export const ITEM_CATEGORY_BY_KEY: Record<ItemCategoryType, ItemCategoryMeta> =
  ITEM_CATEGORY_META.reduce((acc, m) => {
    acc[m.key] = m;
    return acc;
  }, {} as Record<ItemCategoryType, ItemCategoryMeta>);

interface RawWeapon {
  id: string;
  nome: string;
  prof: "Simples" | "Tática" | "Pesada";
  subtipo: "Corpo a corpo" | "Disparo" | "Fogo";
  emp: string;
  dano: string;
  crit: string;
  danoTipo: string;
  cat: ItemCategory;
  esp: number;
  source: ContentSource;
}

function parseCrit(crit: string): { threatRange: number; critMultiplier: number } {
  const m = crit.match(/(\d+)\s*\/\s*x(\d+)/i);
  if (!m) return { threatRange: 20, critMultiplier: 2 };
  return {
    threatRange: parseInt(m[1], 10),
    critMultiplier: parseInt(m[2], 10),
  };
}

function inferRange(
  subtipo: RawWeapon["subtipo"],
  emp: string
): InventoryItem["weaponRange"] {
  if (subtipo === "Corpo a corpo") return "Corpo a Corpo";
  if (/Longo/i.test(emp)) return "Longo";
  if (/Médio/i.test(emp)) return "Médio";
  return "Curto";
}

function normalizePrimaryDamage(dano: string): string {
  // For versatile weapons like "1d6/1d8" or "1d6/1d6", keep primary dice rollable
  return dano.includes("/") ? dano.split("/")[0].trim() : dano;
}

const RAW_WEAPONS: RawWeapon[] = [
  { id: "coronha", nome: "Coronha / Desarmado", prof: "Simples", subtipo: "Corpo a corpo", emp: "Leve", dano: "1d3", crit: "20/x2", danoTipo: "Impacto", cat: 0, esp: 0, source: "livro_basico" },
  { id: "faca", nome: "Faca", prof: "Simples", subtipo: "Corpo a corpo", emp: "Leve (Ágil, Arremesso)", dano: "1d4", crit: "19/x2", danoTipo: "Corte", cat: 0, esp: 1, source: "livro_basico" },
  { id: "martelo", nome: "Martelo", prof: "Simples", subtipo: "Corpo a corpo", emp: "Leve", dano: "1d6", crit: "20/x2", danoTipo: "Impacto", cat: 0, esp: 1, source: "livro_basico" },
  { id: "punhal", nome: "Punhal", prof: "Simples", subtipo: "Corpo a corpo", emp: "Leve (Ágil)", dano: "1d4", crit: "20/x3", danoTipo: "Perfuração", cat: 0, esp: 1, source: "livro_basico" },
  { id: "bastao", nome: "Bastão", prof: "Simples", subtipo: "Corpo a corpo", emp: "Uma mão (1d6/1d8)", dano: "1d6/1d8", crit: "20/x2", danoTipo: "Impacto", cat: 0, esp: 1, source: "livro_basico" },
  { id: "machete", nome: "Machete", prof: "Simples", subtipo: "Corpo a corpo", emp: "Uma mão", dano: "1d6", crit: "19/x2", danoTipo: "Corte", cat: 0, esp: 1, source: "livro_basico" },
  { id: "lanca", nome: "Lança", prof: "Simples", subtipo: "Corpo a corpo", emp: "Uma mão (Arremesso)", dano: "1d6", crit: "20/x2", danoTipo: "Perfuração", cat: 0, esp: 1, source: "livro_basico" },
  { id: "cajado", nome: "Cajado", prof: "Simples", subtipo: "Corpo a corpo", emp: "Duas mãos (1d6/1d6)", dano: "1d6/1d6", crit: "20/x2", danoTipo: "Impacto", cat: 0, esp: 2, source: "livro_basico" },
  { id: "arco", nome: "Arco", prof: "Simples", subtipo: "Disparo", emp: "Duas mãos (Médio, Flechas)", dano: "1d6", crit: "20/x3", danoTipo: "Perfuração", cat: 0, esp: 2, source: "livro_basico" },
  { id: "balestra", nome: "Balestra", prof: "Simples", subtipo: "Disparo", emp: "Duas mãos (Médio, Flechas)", dano: "1d8", crit: "19/x2", danoTipo: "Perfuração", cat: 0, esp: 2, source: "livro_basico" },
  { id: "pistola", nome: "Pistola", prof: "Simples", subtipo: "Fogo", emp: "Leve (Curto, Balas curtas)", dano: "1d12", crit: "18/x2", danoTipo: "Balístico", cat: 1, esp: 1, source: "livro_basico" },
  { id: "revolver", nome: "Revólver", prof: "Simples", subtipo: "Fogo", emp: "Leve (Curto, Balas curtas)", dano: "2d6", crit: "19/x3", danoTipo: "Balístico", cat: 1, esp: 1, source: "livro_basico" },
  { id: "fuzil_caca", nome: "Fuzil de Caça", prof: "Simples", subtipo: "Fogo", emp: "Duas mãos (Médio, Balas longas)", dano: "2d8", crit: "19/x3", danoTipo: "Balístico", cat: 1, esp: 2, source: "livro_basico" },

  { id: "machadinha", nome: "Machadinha", prof: "Tática", subtipo: "Corpo a corpo", emp: "Leve (Arremesso)", dano: "1d6", crit: "20/x3", danoTipo: "Corte", cat: 0, esp: 1, source: "livro_basico" },
  { id: "nunchaku", nome: "Nunchaku", prof: "Tática", subtipo: "Corpo a corpo", emp: "Leve (Ágil)", dano: "1d8", crit: "20/x2", danoTipo: "Impacto", cat: 0, esp: 1, source: "livro_basico" },
  { id: "corrente", nome: "Corrente", prof: "Tática", subtipo: "Corpo a corpo", emp: "Uma mão (+2 desarmar/derrubar)", dano: "1d8", crit: "20/x2", danoTipo: "Impacto", cat: 0, esp: 1, source: "livro_basico" },
  { id: "espada", nome: "Espada", prof: "Tática", subtipo: "Corpo a corpo", emp: "Uma mão (1d8/1d10)", dano: "1d8", crit: "19/x2", danoTipo: "Corte", cat: 1, esp: 1, source: "livro_basico" },
  { id: "florete", nome: "Florete", prof: "Tática", subtipo: "Corpo a corpo", emp: "Uma mão (Ágil)", dano: "1d6", crit: "18/x2", danoTipo: "Perfuração", cat: 1, esp: 1, source: "livro_basico" },
  { id: "machado", nome: "Machado", prof: "Tática", subtipo: "Corpo a corpo", emp: "Uma mão", dano: "1d8", crit: "20/x3", danoTipo: "Corte", cat: 1, esp: 1, source: "livro_basico" },
  { id: "maca", nome: "Maça", prof: "Tática", subtipo: "Corpo a corpo", emp: "Uma mão", dano: "2d4", crit: "20/x2", danoTipo: "Impacto", cat: 1, esp: 1, source: "livro_basico" },
  { id: "acha", nome: "Acha", prof: "Tática", subtipo: "Corpo a corpo", emp: "Duas mãos", dano: "1d12", crit: "20/x3", danoTipo: "Corte", cat: 1, esp: 2, source: "livro_basico" },
  { id: "gadanho", nome: "Gadanho", prof: "Tática", subtipo: "Corpo a corpo", emp: "Duas mãos", dano: "2d4", crit: "20/x4", danoTipo: "Corte", cat: 1, esp: 2, source: "livro_basico" },
  { id: "katana", nome: "Katana", prof: "Tática", subtipo: "Corpo a corpo", emp: "Duas mãos (Ágil; 1 mão se Veterano Luta)", dano: "1d10", crit: "19/x2", danoTipo: "Corte", cat: 1, esp: 2, source: "livro_basico" },
  { id: "marreta", nome: "Marreta", prof: "Tática", subtipo: "Corpo a corpo", emp: "Duas mãos", dano: "3d4", crit: "20/x2", danoTipo: "Impacto", cat: 1, esp: 2, source: "livro_basico" },
  { id: "montante", nome: "Montante", prof: "Tática", subtipo: "Corpo a corpo", emp: "Duas mãos", dano: "2d6", crit: "19/x2", danoTipo: "Corte", cat: 1, esp: 2, source: "livro_basico" },
  { id: "motosserra", nome: "Motosserra", prof: "Tática", subtipo: "Corpo a corpo", emp: "Duas mãos (-1d20 ataque; cada 6 rola +1d6)", dano: "3d6", crit: "20/x2", danoTipo: "Corte", cat: 1, esp: 2, source: "livro_basico" },
  { id: "gancho_de_carne", nome: "Gancho de Carne", prof: "Tática", subtipo: "Corpo a corpo", emp: "Uma mão", dano: "1d6", crit: "20/x3", danoTipo: "Perfuração", cat: 0, esp: 1, source: "sobrevivendo_ao_horror" },
  { id: "arco_composto", nome: "Arco Composto", prof: "Tática", subtipo: "Disparo", emp: "Duas mãos (Médio; soma FOR no dano)", dano: "1d10", crit: "20/x3", danoTipo: "Perfuração", cat: 1, esp: 2, source: "livro_basico" },
  { id: "balestra_pesada", nome: "Balestra Pesada", prof: "Tática", subtipo: "Disparo", emp: "Duas mãos (Médio)", dano: "1d12", crit: "19/x2", danoTipo: "Perfuração", cat: 1, esp: 2, source: "livro_basico" },
  { id: "submetralhadora", nome: "Submetralhadora", prof: "Tática", subtipo: "Fogo", emp: "Uma mão (Curto, Automática, Balas curtas)", dano: "2d6", crit: "19/x3", danoTipo: "Balístico", cat: 1, esp: 1, source: "livro_basico" },
  { id: "espingarda", nome: "Espingarda", prof: "Tática", subtipo: "Fogo", emp: "Duas mãos (Curto, Cartuchos)", dano: "4d6", crit: "20/x3", danoTipo: "Balístico", cat: 1, esp: 2, source: "livro_basico" },
  { id: "fuzil_assalto", nome: "Fuzil de Assalto", prof: "Tática", subtipo: "Fogo", emp: "Duas mãos (Médio, Automática, Balas longas)", dano: "2d10", crit: "19/x3", danoTipo: "Balístico", cat: 2, esp: 2, source: "livro_basico" },
  { id: "fuzil_precisao", nome: "Fuzil de Precisão", prof: "Tática", subtipo: "Fogo", emp: "Duas mãos (Longo, +5 margem ao mirar)", dano: "2d10", crit: "19/x3", danoTipo: "Balístico", cat: 3, esp: 2, source: "livro_basico" },

  { id: "bazuca", nome: "Bazuca", prof: "Pesada", subtipo: "Fogo", emp: "Duas mãos (Médio, Foguetes, 3m raio)", dano: "10d8", crit: "20/x2", danoTipo: "Impacto", cat: 3, esp: 2, source: "livro_basico" },
  { id: "lanca_chamas", nome: "Lança-chamas", prof: "Pesada", subtipo: "Fogo", emp: "Duas mãos (Curto, linha 9m, Combustível)", dano: "6d6", crit: "20/x2", danoTipo: "Fogo", cat: 3, esp: 2, source: "livro_basico" },
  { id: "metralhadora", nome: "Metralhadora", prof: "Pesada", subtipo: "Fogo", emp: "Duas mãos (Médio, Automática, FOR 4 ou tripé)", dano: "2d12", crit: "19/x3", danoTipo: "Balístico", cat: 2, esp: 2, source: "livro_basico" },
];

export const BASE_WEAPONS: InventoryItem[] = RAW_WEAPONS.map((w) => {
  const { threatRange, critMultiplier } = parseCrit(w.crit);
  return {
    id: w.id,
    name: w.nome,
    type: "arma",
    category: w.cat,
    spaces: w.esp,
    quantity: 1,
    equipped: false,
    weaponCategory: w.prof,
    weaponSubtype: w.subtipo,
    weaponGrip: w.emp,
    weaponRange: inferRange(w.subtipo, w.emp),
    damageFormula: normalizePrimaryDamage(w.dano),
    damageType: w.danoTipo,
    threatRange,
    critMultiplier,
    skill: w.subtipo === "Corpo a corpo" ? "luta" : "pontaria",
    description: `${w.prof} · ${w.subtipo} · ${w.emp}. Dano ${w.dano} (${w.danoTipo}), Crítico ${w.crit}.`,
    source: w.source,
  };
});

export const BASE_PROTECTIONS: InventoryItem[] = [
  {
    id: "protecao_leve",
    name: "Proteção Leve",
    type: "protecao",
    category: 1,
    spaces: 2,
    quantity: 1,
    equipped: false,
    defenseBonus: 5,
    rdBonus: 0,
    description: "Jaqueta de couro pesada ou colete de kevlar (+5 Defesa).",
    source: "livro_basico",
  },
  {
    id: "protecao_pesada",
    name: "Proteção Pesada",
    type: "protecao",
    category: 2,
    spaces: 5,
    quantity: 1,
    equipped: false,
    defenseBonus: 10,
    rdBonus: 2,
    description:
      "Equipamento tático completo (+10 Defesa, RD 2 físico, penalidade de carga -5).",
    source: "livro_basico",
  },
  {
    id: "escudo",
    name: "Escudo",
    type: "protecao",
    isShield: true,
    category: 0,
    spaces: 2,
    quantity: 1,
    equipped: false,
    defenseBonus: 2,
    rdBonus: 0,
    description:
      "+2 Defesa (acumula com proteção; exige uma mão livre, penalidade de carga -2).",
    source: "livro_basico",
  },
  {
    id: "escudo_balistico_led",
    name: "Escudo Balístico LED",
    type: "protecao",
    isShield: true,
    category: 2,
    spaces: 2,
    quantity: 1,
    equipped: false,
    defenseBonus: 2,
    rdBonus: 0,
    description:
      "+2 Defesa; ação de movimento fornece cobertura leve (+5 Defesa) enquanto não se deslocar.",
    source: "arquivos_secretos",
  },
];

export const BASE_AMMO: InventoryItem[] = [
  { id: "balas_curtas", name: "Balas Curtas (Pacote)", type: "municao", category: 0, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Munição para pistolas, revólveres e submetralhadoras. Dura 2 cenas." },
  { id: "balas_longas", name: "Balas Longas (Pacote)", type: "municao", category: 1, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Munição para fuzis e metralhadoras. Dura 1 cena." },
  { id: "cartuchos", name: "Cartuchos (Pacote)", type: "municao", category: 1, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Munição para espingardas. Dura 1 cena." },
  { id: "flechas", name: "Flechas / Virotes (Aljava)", type: "municao", category: 0, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Munição para arcos e balestras. Reaproveitáveis; dura a missão inteira." },
  { id: "combustivel", name: "Combustível (Tanque)", type: "municao", category: 1, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Tanque de combustível para lança-chamas. Dura 1 cena." },
  { id: "foguete", name: "Foguete", type: "municao", category: 1, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Munição unitária para bazuca (1 disparo por foguete)." },
];

export const BASE_ACCESSORIES: InventoryItem[] = [
  { id: "kit_pericia", name: "Kit de Perícia", type: "acessorio", category: 0, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Evita penalidade de -5 em Crime, Enganação, Medicina ou Tecnologia." },
  { id: "utensilio", name: "Utensílio", type: "acessorio", category: 1, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "+2 em uma perícia escolhida (exceto Luta e Pontaria)." },
  { id: "vestimenta", name: "Vestimenta", type: "acessorio", category: 1, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "+2 em uma perícia escolhida (exceto Luta e Pontaria); conta como item vestido." },
  { id: "documentos_falsos", name: "Documentos Falsos", type: "acessorio", category: 1, spaces: 1, quantity: 1, equipped: false, source: "sobrevivendo_ao_horror", description: "+2 em Diplomacia, Enganação e Intimidação para se passar pela identidade falsa." },
  { id: "distintivo_pf", name: "Distintivo da Polícia Federal", type: "acessorio", category: 1, spaces: 0.5, quantity: 1, equipped: false, source: "arquivos_secretos", description: "Vestimenta: +2 em Diplomacia e Investigação." },
  { id: "manual_operacional", name: "Manual Operacional", type: "acessorio", category: 1, spaces: 1, quantity: 1, equipped: false, source: "sobrevivendo_ao_horror", description: "Ler no interlúdio permite usar 1 perícia específica como treinado até o próximo interlúdio." },
];

export const BASE_EXPLOSIVES: InventoryItem[] = [
  { id: "granada_atordoamento", name: "Granada de Atordoamento", type: "explosivo", category: 0, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Raio 6m: atordoado 1 rodada (Fortitude DT Agi reduz para ofuscado)." },
  { id: "granada_fragmentacao", name: "Granada de Fragmentação", type: "explosivo", category: 1, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Raio 6m: 8d6 perfuração (Reflexos DT Agi reduz metade)." },
  { id: "granada_fumaca", name: "Granada de Fumaça", type: "explosivo", category: 0, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Raio 6m: camuflagem por 2 rodadas." },
  { id: "granada_incendiaria", name: "Granada Incendiária", type: "explosivo", category: 1, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Raio 6m: 6d6 fogo e em chamas (Reflexos DT Agi reduz metade e evita)." },
  { id: "mina_antipessoal", name: "Mina Antipessoal", type: "explosivo", category: 1, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Cone 6m: 12d6 perfuração (Reflexos DT Int reduz metade)." },
];

export const BASE_OPERATIONAL_ITEMS: InventoryItem[] = [
  { id: "algemas", name: "Algemas", type: "operacional", category: 0, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Prende punhos (Acrobacia DT 30 ou Atletismo DT 25 para soltar)." },
  { id: "arpeu", name: "Arpéu", type: "operacional", category: 0, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Gancho para prender corda em superfícies altas (+5 em Atletismo para escalar)." },
  { id: "bandoleira", name: "Bandoleira", type: "operacional", category: 1, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Saca/guarda 1 item por rodada como ação livre." },
  { id: "binoculos", name: "Binóculos", type: "operacional", category: 0, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "+5 em Percepção para observar à distância." },
  { id: "bloqueador_sinal", name: "Bloqueador de Sinal", type: "operacional", category: 1, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Impede comunicação por celular/rádio em raio de 30m." },
  { id: "bracadeira_reforcada", name: "Braçadeira Reforçada", type: "operacional", category: 1, spaces: 1, quantity: 1, equipped: false, source: "sobrevivendo_ao_horror", description: "Aumenta em +2 a RD recebida ao usar a reação Bloqueio." },
  { id: "corda", name: "Corda (10m)", type: "operacional", category: 0, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "+5 em Atletismo para escalar ou descer." },
  { id: "equipamento_sobrevivencia", name: "Equipamento de Sobrevivência", type: "operacional", category: 0, spaces: 2, quantity: 1, equipped: false, source: "livro_basico", description: "+5 em Sobrevivência para acampar, orientar-se e resistir ao clima." },
  { id: "lanterna_tatica", name: "Lanterna Tática", type: "operacional", category: 1, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Ilumina cone 9m; ação movimento ofusca alvo em alcance curto (1 rodada)." },
  { id: "mascara_gas", name: "Máscara de Gás", type: "operacional", category: 0, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "+10 em Fortitude contra efeitos respiratórios." },
  { id: "mochila_militar", name: "Mochila Militar", type: "operacional", category: 1, spaces: 0, quantity: 1, equipped: false, carryBonus: 2, source: "livro_basico", description: "Aumenta sua capacidade de carga em +2 espaços." },
  { id: "oculos_visao_termica", name: "Óculos de Visão Térmica", type: "operacional", category: 1, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Ignora camuflagem por escuridão ou fumaça." },
  { id: "pe_de_cabra", name: "Pé de Cabra", type: "operacional", category: 0, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "+5 em Força para arrombar portas/caixas; funciona como bastão." },
  { id: "soqueira", name: "Soqueira", type: "operacional", category: 0, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "+1 em rolagens de dano desarmado (pode receber modificações de arma corpo a corpo)." },
  { id: "spray_pimenta", name: "Spray de Pimenta", type: "operacional", category: 1, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Alcance adjacente: alvo faz Fortitude DT Agi ou fica cego 1d4 rodadas (2 usos)." },
  { id: "taser", name: "Taser", type: "operacional", category: 1, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Alcance adjacente: 1d6 eletricidade e atordoado 1 rodada (Fortitude DT Agi evita; 2 usos)." },
  { id: "traje_hazmat", name: "Traje Hazmat", type: "operacional", category: 1, spaces: 2, quantity: 1, equipped: false, source: "livro_basico", description: "+5 em resistência contra efeitos ambientais e RD 10 químico." },
];

export const BASE_MEDICINES: InventoryItem[] = [
  { id: "cicatrizante", name: "Cicatrizante", type: "medicamento", category: 1, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Ação padrão cura 2d8+2 PV adjacente (consumível)." },
  { id: "anti_inflamatorio", name: "Anti-inflamatório", type: "medicamento", category: 0, spaces: 0.5, quantity: 1, equipped: false, source: "sobrevivendo_ao_horror", description: "Fornece PV temporários (escala com Doutor em Emergências para 2d8+2 PV temporários)." },
  { id: "broncodilatador", name: "Broncodilatador", type: "medicamento", category: 0, spaces: 0.5, quantity: 1, equipped: false, source: "sobrevivendo_ao_horror", description: "+5 para evitar asfixiado ou fatigado até o fim do dia." },
  { id: "coagulante", name: "Coagulante", type: "medicamento", category: 0, spaces: 0.5, quantity: 1, equipped: false, source: "sobrevivendo_ao_horror", description: "+5 para estabilizar sangrando ou em Medicina para encerrar morrendo." },
];

export const BASE_PARANORMAL_ITEMS: InventoryItem[] = [
  { id: "componentes_ritualisticos", name: "Componentes Ritualísticos (<Elemento>)", type: "paranormal", category: 0, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Necessários para conjurar rituais de 1 elemento (Sangue, Morte, Conhecimento ou Energia)." },
  { id: "amarras_elemento", name: "Amarras de <Elemento>", type: "paranormal", category: 2, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Cordas rúnicas que prendem criaturas do elemento oprimido." },
  { id: "camera_aura", name: "Câmera de Aura Paranormal", type: "paranormal", category: 2, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Fotografa auras paranormais (1 PE/foto)." },
  { id: "emissor_pulsos", name: "Emissor de Pulsos Paranormais", type: "paranormal", category: 2, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Completa e 1 PE atrai criaturas do elemento escolhido e afasta do opressor (Vontade DT Pre)." },
  { id: "escuta_ruidos", name: "Escuta de Ruídos Paranormais", type: "paranormal", category: 2, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "+5 em Ocultismo para ouvir manifestações/identificar Membrana." },
  { id: "medidor_membrana", name: "Medidor de Estabilidade da Membrana", type: "paranormal", category: 2, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Avalia com precisão o estado da Membrana no local." },
  { id: "scanner_manifestacao", name: "Scanner de Manifestação Paranormal", type: "paranormal", category: 2, spaces: 1, quantity: 1, equipped: false, source: "livro_basico", description: "Padrão + 1 PE/rodada detecta direção de manifestações do elemento em alcance longo." },
  { id: "selo_paranormal", name: "Selo Paranormal", type: "paranormal", category: 1, spaces: 0, quantity: 1, equipped: false, source: "livro_basico", description: "Armazena 1 ritual pronto para ativação sem componentes (categoria igual ao círculo do ritual)." },
  { id: "catalisador_ritualistico", name: "Catalisador Ritualístico (Ampliador/Perturbador/Potencializador/Prolongador)", type: "paranormal", category: 1, spaces: 0.5, quantity: 1, equipped: false, source: "sobrevivendo_ao_horror", description: "Consumível que aprimora alcance, DT (+2), dano (+1 dado) ou duração de 1 ritual." },
];

interface RawCursedItem {
  id: string;
  nome: string;
  elemento: ParanormalElement;
  cat: ItemCategory;
  esp: number;
  source: ContentSource;
  efeito: string;
}

const RAW_CURSED_ITEMS: RawCursedItem[] = [
  { id: "coroa_de_espinhos", nome: "Coroa de Espinhos", elemento: "Sangue", cat: 2, esp: 1, source: "livro_basico", efeito: "Reação: converte dano mental sofrido em dano de Sangue." },
  { id: "coracao_pulsante", nome: "Coração Pulsante", elemento: "Sangue", cat: 2, esp: 1, source: "livro_basico", efeito: "Reação: aperta coração para reduzir dano à metade; teste Fortitude DT 15 (+5/uso) ou estoura." },
  { id: "cranio_espiral", nome: "Crânio Espiral", elemento: "Morte", cat: 2, esp: 1, source: "livro_basico", efeito: "Ação livre: ganha 1 ação padrão adicional no turno (1x/cena; teste Ocultismo ou envelhece)." },
  { id: "pe_de_morto", nome: "Pé de Morto", elemento: "Morte", cat: 2, esp: 1, source: "livro_basico", efeito: "+5 Furtividade e permite atravessar sombras." },
  { id: "amuleto_sagrado", nome: "Amuleto Sagrado", elemento: "Conhecimento", cat: 2, esp: 1, source: "livro_basico", efeito: "+5 Religião e Vontade; 1x/cena evita condição mental." },
  { id: "municao_jurada", nome: "Munição Jurada", elemento: "Conhecimento", cat: 2, esp: 1, source: "livro_basico", efeito: "Ritual de 1h vincula a um alvo: +10 ataque, dobra margem de ameaça e +6d12 Conhecimento contra ele (-2 Defesa/ataque contra outros)." },
  { id: "pergaminho_pertinacia", nome: "Pergaminho da Pertinácia", elemento: "Conhecimento", cat: 2, esp: 1, source: "livro_basico", efeito: "Padrão recebe 5 PE temporários na cena; Ocultismo DT 15 (+5/uso no dia) ou se desfaz." },
  { id: "bateria_reversa", nome: "Bateria Reversa", elemento: "Energia", cat: 2, esp: 1, source: "livro_basico", efeito: "Padrão e 2 PE absorve carga de eletrônico em alcance curto (ou transfere carga). Teste Ocultismo DT 15 (+5/uso no dia)." },
  { id: "peitoral_segunda_chance", nome: "Peitoral da Segunda Chance", elemento: "Energia", cat: 2, esp: 1, source: "livro_basico", efeito: "Ao cair a 0 PV, gasta 5 PE automaticamente e levanta com 4d10 PV (1 em 1d10 causa morte instantânea)." },
  { id: "relogio_arnaldo", nome: "Relógio de Arnaldo", elemento: "Energia", cat: 4, esp: 1, source: "livro_basico", efeito: "1x/cena gasta 1 PE para rerrolar qualquer teste recém-realizado." },
  { id: "jaqueta_verissimo", nome: "Jaqueta de Veríssimo", elemento: "Medo", cat: 4, esp: 2, source: "livro_basico", efeito: "RD paranormal 15; reação e 2 PE toma no lugar o dano de aliado adjacente." },
  { id: "arreio_neural", nome: "Arreio Neural", elemento: "Energia", cat: 2, esp: 1, source: "sobrevivendo_ao_horror", efeito: "Recupera 1 PE sempre que sofrer >=5 dano de Energia ou eletricidade (máx. 2x VIG por dia)." },
  { id: "espelho_refletor", nome: "Espelho Refletor", elemento: "Energia", cat: 2, esp: 1, source: "sobrevivendo_ao_horror", efeito: "Movimento enxerga fora de ângulo em alcance médio (+1d20 Percepção); pode sacrificar para refletir dano de Energia." },
  { id: "catalisador_sofisticado", nome: "Catalisador Sofisticado e Horrorizado", elemento: "Variável", cat: 3, esp: 1, source: "arquivos_secretos", efeito: "Vestimenta não consumível: 1x/cena recebe 3d6 para somar 1d6 em dano, cura ou DT de um ritual." },
  { id: "faca_predadora", nome: "Faca Predadora", elemento: "Sangue", cat: 4, esp: 1, source: "arquivos_secretos", efeito: "Ao acertar ataque, gasta 2 PE para recuperar 2d10 PV (excesso vira PV temporários)." },
  { id: "arpao_do_pescador", nome: "Arpão do Pescador", elemento: "Sangue", cat: 3, esp: 1, source: "arquivos_secretos", efeito: "Arma arremessável de Sangue que deixa alvo lento até remover com Atletismo/Luta." },
  { id: "marreta_transtornada", nome: "Marreta Transtornada", elemento: "Sangue", cat: 4, esp: 2, source: "arquivos_secretos", efeito: "Marreta amaldiçoada de Sangue; acertos podem fraturar ossos (Fortitude DT For ou fica fraco/debilitado)." },
  { id: "faixas_da_videncia", nome: "Faixas da Vidência", elemento: "Morte", cat: 3, esp: 1, source: "arquivos_secretos", efeito: "Vestimenta que concede RD mental 10 e +2 em Diplomacia." },
];

export const BASE_CURSED_ITEMS: InventoryItem[] = RAW_CURSED_ITEMS.map((c) => ({
  id: c.id,
  name: c.nome,
  type: "amaldicoado",
  category: c.cat,
  spaces: c.esp,
  quantity: 1,
  equipped: false,
  element: c.elemento,
  description: c.efeito,
  source: c.source,
}));

/** Combined non-weapon / non-protection / non-cursed items for backward compatibility */
export const BASE_GENERAL_ITEMS: InventoryItem[] = [
  ...BASE_AMMO,
  ...BASE_ACCESSORIES,
  ...BASE_EXPLOSIVES,
  ...BASE_OPERATIONAL_ITEMS,
  ...BASE_MEDICINES,
  ...BASE_PARANORMAL_ITEMS,
];

/** Complete catalog of all 105 items across the 9 standardized categories */
export const BASE_ITEMS: InventoryItem[] = [
  ...BASE_WEAPONS,
  ...BASE_PROTECTIONS,
  ...BASE_AMMO,
  ...BASE_ACCESSORIES,
  ...BASE_EXPLOSIVES,
  ...BASE_OPERATIONAL_ITEMS,
  ...BASE_MEDICINES,
  ...BASE_PARANORMAL_ITEMS,
  ...BASE_CURSED_ITEMS,
];

export const BASE_MODIFICATIONS: ModificationDefinition[] = [
  { id: "alongada", name: "Alongada", appliesTo: "Arma de Fogo", categoryIncrease: 1, description: "+2 em testes de ataque.", source: "livro_basico" },
  { id: "calibre_grosso", name: "Calibre Grosso", appliesTo: "Arma de Fogo", categoryIncrease: 1, description: "Aumenta dano da arma em +1 dado do mesmo tipo (exige munição calibre grosso).", source: "livro_basico" },
  { id: "certeira", name: "Certeira", appliesTo: "Arma Corpo a Corpo / Disparo", categoryIncrease: 1, description: "+2 em testes de ataque.", source: "livro_basico" },
  { id: "compensador", name: "Compensador", appliesTo: "Arma Automática", categoryIncrease: 1, description: "Anula penalidade de -1d20 ao disparar rajadas com arma automática.", source: "livro_basico" },
  { id: "cruel", name: "Cruel", appliesTo: "Arma", categoryIncrease: 1, description: "+2 em rolagens de dano.", source: "livro_basico" },
  { id: "discreta", name: "Discreta", appliesTo: "Arma", categoryIncrease: 1, description: "-1 espaço de carga (mín. 1) e +5 em Crime para ocultar.", source: "livro_basico" },
  { id: "dum_dum", name: "Dum Dum", appliesTo: "Munição", categoryIncrease: 1, description: "+1 no multiplicador de crítico.", source: "livro_basico" },
  { id: "explosiva", name: "Explosiva", appliesTo: "Munição", categoryIncrease: 1, description: "+2d6 de dano (não multiplica no crítico).", source: "livro_basico" },
  { id: "ferrolho_automatico", name: "Ferrolho Automático", appliesTo: "Arma de Fogo", categoryIncrease: 1, description: "Torna a arma automática (permite rajada).", source: "livro_basico" },
  { id: "mira_laser", name: "Mira Laser", appliesTo: "Arma de Fogo", categoryIncrease: 1, description: "+2 na margem de ameaça.", source: "livro_basico" },
  { id: "mira_telescopica", name: "Mira Telescópica", appliesTo: "Arma de Fogo", categoryIncrease: 1, description: "Aumenta alcance em 1 passo e permite Ataque Furtivo em qualquer alcance.", source: "livro_basico" },
  { id: "perigosa", name: "Perigosa", appliesTo: "Arma Corpo a Corpo / Disparo", categoryIncrease: 1, description: "+2 na margem de ameaça.", source: "livro_basico" },
  { id: "silenciador", name: "Silenciador", appliesTo: "Arma de Fogo", categoryIncrease: 1, description: "Reduz penalidade de Furtividade ao atirar para -1d20.", source: "livro_basico" },
  { id: "tatica", name: "Tática", appliesTo: "Arma", categoryIncrease: 1, description: "Pode sacar como ação livre.", source: "livro_basico" },
  { id: "visao_calor", name: "Visão de Calor", appliesTo: "Arma de Fogo", categoryIncrease: 1, description: "Ao mirar, ignora camuflagem.", source: "livro_basico" },
  { id: "antibombas", name: "Antibombas", appliesTo: "Proteção Pesada", categoryIncrease: 1, description: "+5 em resistência contra efeitos de área (apenas Proteção Pesada).", source: "livro_basico" },
  { id: "blindada", name: "Blindada", appliesTo: "Proteção Pesada", categoryIncrease: 1, description: "RD sobe para 5 e +1 espaço (apenas Proteção Pesada).", source: "livro_basico" },
  { id: "discreta_prot", name: "Discreta (Proteção)", appliesTo: "Proteção Leve", categoryIncrease: 1, description: "-1 espaço e pode ser usada sob roupas comuns (+5 Crime para ocultar; apenas Proteção Leve).", source: "livro_basico" },
  { id: "reforcada", name: "Reforçada", appliesTo: "Proteção", categoryIncrease: 1, description: "+2 Defesa e +1 espaço.", source: "livro_basico" },
  { id: "aprimorado", name: "Aprimorado", appliesTo: "Acessório", categoryIncrease: 1, description: "Bônus de perícia do acessório sobe de +2 para +5.", source: "livro_basico" },
  { id: "discreto_acess", name: "Discreto (Acessório)", appliesTo: "Acessório", categoryIncrease: 1, description: "-1 espaço e +5 em Crime para ocultar.", source: "livro_basico" },
  { id: "funcao_adicional", name: "Função Adicional", appliesTo: "Acessório", categoryIncrease: 1, description: "+2 em uma segunda perícia (exceto Luta/Pontaria).", source: "livro_basico" },
  { id: "instrumental", name: "Instrumental", appliesTo: "Acessório", categoryIncrease: 1, description: "Funciona como kit de uma perícia específica.", source: "livro_basico" },
  { id: "lente_de_revelacao", name: "Lente de Revelação", appliesTo: "Item Paranormal", categoryIncrease: 1, description: "Para Câmera de Aura Paranormal: vê seres invisíveis/incorpóreos; padrão e 1 PE fotografa criatura para remover camuflagem/invisibilidade/incorpóreo na cena (Von DT Pre evita).", source: "arquivos_secretos" },
];

export const BASE_CURSES: CurseDefinition[] = [
  // SANGUE (7)
  { id: "lancinante", name: "Lancinante", element: "Sangue", appliesTo: "Arma", description: "+1d8 Sangue (multiplica no crítico!).", source: "livro_basico" },
  { id: "sanguinaria", name: "Sanguinária", element: "Sangue", appliesTo: "Arma", description: "Deixa alvo sangrando (cumulativo); crítico deixa fraco e dá 2d10 PV temporários.", source: "livro_basico" },
  { id: "sadica", name: "Sádica", element: "Sangue", appliesTo: "Proteção", description: "+1 ataque e dano para cada 10 de dano sofrido desde o fim do último turno.", source: "livro_basico" },
  { id: "regenerativa", name: "Regenerativa", element: "Sangue", appliesTo: "Proteção", description: "Movimento e 1 PE recupera 1d12 PV (1x/cena).", source: "livro_basico" },
  { id: "disposicao", name: "Disposição", element: "Sangue", appliesTo: "Acessório", description: "+1 VIG.", source: "livro_basico" },
  { id: "pujanca", name: "Pujança", element: "Sangue", appliesTo: "Acessório", description: "+1 FOR.", source: "livro_basico" },
  { id: "vitalidade", name: "Vitalidade", element: "Sangue", appliesTo: "Acessório", description: "+15 PV máximos (ativa após 1 dia de uso).", source: "livro_basico" },

  // MORTE (5)
  { id: "consumidora", name: "Consumidora", element: "Morte", appliesTo: "Arma", description: "Ao acertar, 2 PE deixa alvo imóvel por 1 rodada.", source: "livro_basico" },
  { id: "erosiva", name: "Erosiva", element: "Morte", appliesTo: "Arma", description: "+1d8 Morte; 2 PE causa +2d4 Morte no início dos próximos 2 turnos do alvo.", source: "livro_basico" },
  { id: "repulsiva", name: "Repulsiva", element: "Morte", appliesTo: "Proteção", description: "Névoa dá +2 Defesa (e +5 contra disparos à distância).", source: "livro_basico" },
  { id: "letargica", name: "Letárgica", element: "Morte", appliesTo: "Proteção", description: "+2 Defesa; reação e 2 PE impõe -1d20 no ataque inimigo.", source: "livro_basico" },
  { id: "escudo_mental", name: "Escudo Mental", element: "Morte", appliesTo: "Acessório", description: "RD mental 10.", source: "livro_basico" },

  // CONHECIMENTO (6)
  { id: "antielemento", name: "Antielemento", element: "Conhecimento", appliesTo: "Arma", description: "+4d8 dano de Conhecimento contra criaturas de 1 elemento escolhido.", source: "livro_basico" },
  { id: "ritualistica", name: "Ritualística", element: "Conhecimento", appliesTo: "Arma", description: "Armazena 1 ritual para descarregar junto com um ataque bem-sucedido.", source: "livro_basico" },
  { id: "senciente", name: "Senciente", element: "Conhecimento", appliesTo: "Arma", description: "2 PE faz arma flutuar e atacar sozinha (1 PE/turno para sustentar).", source: "livro_basico" },
  { id: "abjuracao", name: "Abjuração", element: "Conhecimento", appliesTo: "Proteção", description: "RD paranormal 5 (e +2 em testes contra efeitos paranormais).", source: "livro_basico" },
  { id: "carisma", name: "Carisma", element: "Conhecimento", appliesTo: "Acessório", description: "+1 PRE (não dá PE extras).", source: "livro_basico" },
  { id: "sagacidade", name: "Sagacidade", element: "Conhecimento", appliesTo: "Acessório", description: "+1 INT (não dá perícias extras).", source: "livro_basico" },

  // ENERGIA (6)
  { id: "empuxo", name: "Empuxo", element: "Energia", appliesTo: "Arma", description: "Arma ganha propriedade arremesso (+1 dado de dano) e volta à mão.", source: "livro_basico" },
  { id: "energetica", name: "Energética", element: "Energia", appliesTo: "Arma", description: "2 PE converte todo dano em Energia, ignora RD e dá +2 ataque.", source: "livro_basico" },
  { id: "vibrante", name: "Vibrante", element: "Energia", appliesTo: "Arma", description: "Recebe Ataque Extra (ou reduz custo em -1 PE se já possuir).", source: "livro_basico" },
  { id: "cinetica", name: "Cinética", element: "Energia", appliesTo: "Proteção", description: "+2 Defesa, RD 2 geral e 2 PE para +5 Defesa/RD contra 1 ataque.", source: "livro_basico" },
  { id: "destreza", name: "Destreza", element: "Energia", appliesTo: "Acessório", description: "+1 AGI.", source: "livro_basico" },
  { id: "defesa_energia", name: "Defesa", element: "Energia", appliesTo: "Acessório", description: "+5 na Defesa (acumula com proteção e escudo).", source: "livro_basico" },
];
