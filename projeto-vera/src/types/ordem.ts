export type OfficialContentSource =
  | "livro_basico"
  | "sobrevivendo_ao_horror"
  | "arquivos_secretos";

export type CommunityContentSource =
  | "misterios_do_outro_lado"
  | "grimorio_do_cataclisma"
  | "guia_confidencial_vol1"
  | "mascaras_teatrais"
  | "rituais_superiores"
  | "comunidade_avulsos";

export type ContentSource =
  | OfficialContentSource
  | CommunityContentSource
  | "homebrew";

export type OrganizationId =
  | "ordo_realitas"
  | "hell_hunters"
  | "famiglia_leone"
  | "obscurite"
  | "ordo_calamitas";

export type AttributeKey = "AGI" | "FOR" | "INT" | "PRE" | "VIG";

export type ParanormalElement =
  | "Sangue"
  | "Morte"
  | "Conhecimento"
  | "Energia"
  | "Medo"
  | "Variável"
  | "Realidade";

export type AgentClassId =
  | "combatente"
  | "especialista"
  | "ocultista"
  | "sobrevivente"
  | "devoto"
  | "predador";

export type TrainingDegree = 0 | 5 | 10 | 15;

export type Patente =
  | "Recruta"
  | "Operador"
  | "Agente Especial"
  | "Oficial de Operações"
  | "Agente de Elite";

export type CreditLimit = "Baixo" | "Médio" | "Alto" | "Ilimitado";

export type ItemCategory = 0 | 1 | 2 | 3 | 4;

export type BonusSource = "Habilidade" | "Item" | "Ritual" | "Aliado";

export type MembraneState =
  | "Intacta"
  | "Estável"
  | "Danificada"
  | "Arruinada"
  | "Rompida";

export type SceneMode =
  | "combate"
  | "investigacao"
  | "furtividade"
  | "perseguicao"
  | "interludio";

export type OptionalRuleId =
  // Livro Básico
  | "nex_zero_mundano"
  | "nex_0_mundano"
  | "idade_variada"
  | "contagem_municao"
  | "lesoes"
  | "inspiracao_resoluta"
  | "loucura_nao_letal"
  // Sobrevivendo ao Horror
  | "nex_e_experiencia"
  | "jogando_sem_sanidade"
  | "evolucao_por_patentes"
  | "ferimentos_debilitantes"
  | "conjuracao_complexa"
  | "rituais_desconhecidos"
  | "limites_compreensao"
  | "jogando_sem_mapa"
  | "combate_narrativo"
  // Arquivos Secretos
  | "reter_ritual"
  | "transcender_itens"
  | "evolucao_modular";

export interface OptionalRuleDefinition {
  id: OptionalRuleId;
  name: string;
  source: ContentSource;
  summary: string;
  mechanicalEffect: string;
}

export type SkillKey =
  | "acrobacia"
  | "adestramento"
  | "artes"
  | "atletismo"
  | "atualidades"
  | "ciencias"
  | "crime"
  | "diplomacia"
  | "enganacao"
  | "fortitude"
  | "furtividade"
  | "iniciativa"
  | "intimidacao"
  | "intuicao"
  | "investigacao"
  | "luta"
  | "medicina"
  | "ocultismo"
  | "percepcao"
  | "pilotagem"
  | "pontaria"
  | "profissao"
  | "reflexos"
  | "religiao"
  | "sobrevivencia"
  | "tatica"
  | "tecnologia"
  | "vontade";

export interface SkillDefinition {
  key: SkillKey;
  name: string;
  defaultAttribute: AttributeKey;
  trainedOnly: boolean;
  loadPenalty: boolean;
  usesKit: boolean;
  description?: string;
  source: ContentSource;
}

export interface AgentSkillState {
  attribute: AttributeKey;
  training: TrainingDegree;
  bonus: number;
  hasKit?: boolean;
}

export interface AgentSkill {
  id: string;
  nome: string;
  especializacao?: string; // usado para a linha de Profissão (ex: "Armeiro")
  descricao: string;       // texto descritivo / usos / anotações da perícia
  atributoBase: AttributeKey;
  treinamento: TrainingDegree;
  bonusOutros: number;
  somenteTreinada: boolean;
  penalidadeCarga: boolean;
  requerKit: boolean;
  hasKit?: boolean;
  isCustom?: boolean;
}

export interface StatPool {
  current: number;
  temp?: number;
  maxOverride: number | null;
  autoCalc: boolean;
}

export interface PatentDefinition {
  id: Patente;
  minPrestige: number;
  credit: CreditLimit;
  categoryLimits: Record<1 | 2 | 3 | 4, number>;
  pdLimitByPatent: number;
  source: ContentSource;
}

export interface OriginPassiveEffects {
  metadeSanInicial?: boolean;
  poderParanormalExtra?: number;
  pvPor5Nex?: number;
  pvPor10Nex?: number;
  pvFixo?: number;
  sanPor5Nex?: number;
  peInicial?: number;
  peNexImpar?: number;
  limitePeBonus?: number;
  danoCorpoACorpo?: number;
  danoArmasDeFogo?: number;
  limiteCreditoBonus?: number;
  defesa?: number;
  rdMentalPorInt?: number;
  rdGeral?: number;
  periciaBonus?: Partial<Record<SkillKey, number>>;
  penalidadeDados?: Partial<Record<SkillKey, number>>;
}

export interface OriginDefinition {
  id: string;
  name: string;
  source: ContentSource;
  description: string;
  trainedSkills: SkillKey[];
  trainedSkillNotes?: string[];
  powerName: string;
  powerDescription: string;
  powerPeCost?: number;
  halfInitialSan?: boolean;
  efeitosPassivos?: OriginPassiveEffects;
  passiveBonuses?: {
    defense?: number;
    meleeDamage?: number;
    firearmDamage?: number;
    pvPerNexStep?: number;
    mentalRdEqualsInt?: boolean;
  };
  isHomebrew?: boolean;
}

export interface TrailAbility {
  nex: number; // or stage 2 / 4 for Sobrevivente
  name: string;
  description: string;
  peCost?: number;
}

export interface TrailDefinition {
  id: string;
  classId: AgentClassId;
  name: string;
  source: ContentSource;
  description: string;
  abilitiesByNex: TrailAbility[];
}

export type TrilhaDefinition = TrailDefinition;

export interface ClassDefinition {
  id: AgentClassId;
  name: string;
  source: ContentSource;
  description: string;
  initialPv: number;
  pvPerLevel: number;
  initialPe: number;
  pePerLevel: number;
  initialSan: number;
  sanPerLevel: number;
  initialPd: number;
  pdPerLevel: number;
  trainingDegreeCountBase: number;
  baseProficiencies: string;
  defaultSkillCount: string;
  baseAbility: {
    name: string;
    peCost: number;
    description: string;
  };
  trilhas: TrailDefinition[];
}

export type PowerCategory = "classe" | "geral" | "paranormal";

export interface PowerDefinition {
  id: string;
  name: string;
  category: PowerCategory;
  classId?: AgentClassId;
  element?: ParanormalElement;
  prerequisites?: string;
  peCost: number;
  description: string;
  affinityDescription?: string;
  source: ContentSource;
}

export type AbilitySource =
  | "Origem"
  | "Classe"
  | "Trilha"
  | "Geral"
  | "Paranormal"
  | "Homebrew";

export interface AgentAbility {
  id: string;
  name: string;
  source: AbilitySource;
  peCost: number;
  element?: ParanormalElement;
  description: string;
  affinityDescription?: string;
  hasAffinity?: boolean;
  isTranscender?: boolean;
  bookSource?: ContentSource;
}

export type RitualVersion = "Normal" | "Discente" | "Verdadeira" | "Superior";

export interface SuperiorRitualInfo {
  conjuracao: string;
  consequencias: string;
  efeitoSuperior?: string;
  peCost?: number;
}

export interface AgentRitual {
  id: string;
  name: string;
  element: ParanormalElement;
  circle: 1 | 2 | 3 | 4;
  execution: string;
  range: string;
  target: string;
  duration: string;
  resistance: string;
  peCost: number;
  description: string;
  discente?: string;
  discenteCost?: number;
  discentePrereq?: string;
  verdadeira?: string;
  verdadeiraCost?: number;
  verdadeiraPrereq?: string;
  isSuperior?: boolean;
  superiorInfo?: SuperiorRitualInfo;
  isCorrentesDaRealidade?: boolean;
  source?: ContentSource;
}

export type ItemCategoryType =
  | "arma"
  | "protecao"
  | "municao"
  | "acessorio"
  | "explosivo"
  | "operacional"
  | "medicamento"
  | "paranormal"
  | "amaldicoado";

export type InventoryItemType =
  | ItemCategoryType
  | "Arma"
  | "Proteção"
  | "Escudo"
  | "Equipamento"
  | "Item Paranormal"
  | "Acessório Paranormal"
  | "Munição";

export interface ModificationDefinition {
  id: string;
  name: string;
  appliesTo: string;
  categoryIncrease: number;
  description: string;
  source: ContentSource;
}

export interface CurseDefinition {
  id: string;
  name: string;
  element: ParanormalElement;
  appliesTo: string;
  description: string;
  source: ContentSource;
}

export interface AppliedModification {
  id: string;
  name: string;
  description: string;
}

export interface AppliedCurse {
  id: string;
  name: string;
  element: ParanormalElement;
  description: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: InventoryItemType;
  category: ItemCategory;
  categoryReduction?: number;
  spaces: number;
  quantity: number;
  equipped: boolean;
  description: string;
  defenseBonus?: number;
  rdBonus?: number;
  isShield?: boolean;
  carryBonus?: number;
  damageFormula?: string;
  damageType?: string;
  threatRange?: number;
  critMultiplier?: number;
  skill?: SkillKey;
  weaponCategory?: "Simples" | "Tática" | "Pesada";
  weaponSubtype?: "Corpo a corpo" | "Disparo" | "Fogo";
  weaponGrip?: string;
  weaponRange?: "Corpo a Corpo" | "Curto" | "Médio" | "Longo";
  modifications?: AppliedModification[];
  curses?: AppliedCurse[];
  element?: ParanormalElement;
  source?: ContentSource;
  /** Remaining shots in current ammunition pack when Contagem de Munição is used */
  ammoShotsRemaining?: number;
  /** Optional broken flag for Interlude Manutenção */
  broken?: boolean;
}

export interface AgentAttack {
  id: string;
  name: string;
  skill: SkillKey;
  attributeOverride?: AttributeKey;
  attackBonus: number;
  damageFormula: string;
  extraDamageFormula?: string;
  extraDamageMultipliesOnCrit?: boolean;
  damageType: string;
  threatRange: number;
  critMultiplier: number;
  range?: string;
  notes?: string;
  // Optional Ammunition Tracking (Contagem de Munição)
  ammoEnabled?: boolean;
  ammoCurrent?: number;
  ammoMax?: number;
  reserveAmmo?: number;
  linkedAmmoItemId?: string;
  supportsBurst?: boolean;
  burstMode?: boolean;
}

export type RestCondition = "precaria" | "normal" | "confortavel" | "luxuosa";

export type InterludeDish = "favorito" | "nutritivo" | "energetico" | "rapido";

export interface InterludeBonusDie {
  id: string;
  source: "exercitar" | "ler";
  dieFormula: "1d6" | "2d6" | "1d8";
  appliesTo: AttributeKey[];
  label: string;
  createdAt: string;
}

export type AllyType = "aliado" | "pet";

export type AllyTemplateId =
  | "acolito"
  | "faz_tudo"
  | "guerrilheiro"
  | "socorrista"
  | "cao_adestrado"
  | "companheiro_animal"
  | "custom";

export interface AgentAlly {
  id: string;
  templateId: AllyTemplateId;
  name: string;
  kind: AllyType;
  avatar?: string;
  helping: boolean;
  bonusSummary: string;
  skillFlatBonuses?: Partial<Record<SkillKey, number>>;
  skillDiceBonuses?: Partial<Record<SkillKey, number>>;
  trainedSkills?: SkillKey[];
  attackDiceBonus?: number;
  dispensesRitualComponents?: boolean;
  abilityName: string;
  abilityPeCost: number;
  abilityDescription: string;
  abilityRollFormula?: string;
  dangerRuleEnabled?: boolean;
  wounds?: 0 | 1 | 2;
  combatStatsEnabled?: boolean;
  petPv?: number;
  petMaxPv?: number;
  petDefense?: number;
  petAttack?: string;
  notes?: string;
}

export interface AgentDescription {
  appearance: string;
  personality: string;
  background: string;
  objective: string;
  favorites: string;
  notes: string;
}

export interface Agent {
  id: string;
  name: string;
  player: string;
  avatar: string;
  originId: string;
  classId: AgentClassId;
  trilhaId: string | null;
  affinityElement?: ParanormalElement;
  nex: number; // 0..99
  level?: number; // 1..20 (used when nex_e_experiencia optional rule is ON)
  stage?: number; // 1..5 for Sobrevivente
  patente: Patente;
  prestigePoints?: number;
  transcenderCount?: number;
  permanentSanLoss?: number;
  enabledSources?: ContentSource[];
  organization?: OrganizationId;
  optionalRules?: OptionalRuleId[];
  attributes: Record<AttributeKey, number>;
  status: {
    pv: StatPool;
    san: StatPool;
    pe: StatPool;
    pd?: StatPool;
    machucado: boolean;
    morrendo: boolean;
    morrendoTurns?: number;
    perturbado?: boolean;
    enlouquecendo: boolean;
    enlouquecendoTurns?: number;
    vulneravel?: boolean;
    /** Condição de Sentidos (Guia Confidencial Vol. I): -1d20 localização/trajetos e -3 Defesa */
    desorientado?: boolean;
  };
  defense: {
    protectionBonus: number;
    shieldBonus?: number;
    paranormalAccessoryBonus?: number;
    abilityBonus?: number;
    otherBonus: number;
    displacement: number;
    resistances: Record<string, number>;
  };
  ritualDTBonus: number;
  skills: Record<SkillKey, AgentSkillState>;
  skillList?: AgentSkill[];
  attacks: AgentAttack[];
  abilities: AgentAbility[];
  rituals: AgentRitual[];
  inventory: InventoryItem[];
  allies?: AgentAlly[];
  interludeBonusDice?: InterludeBonusDie[];
  /** Temporary PE max penalty from Sucesso a Qualquer Custo (restored at mission end) */
  missionPeMaxPenalty?: number;
  description: AgentDescription;
  createdAt: string;
  updatedAt: string;
}

export type ThreatKind =
  | "Criatura Paranormal"
  | "Ameaça da Realidade"
  | "Perigo";

export interface ThreatAttack {
  id: string;
  name: string;
  testBonus: number;
  diceCount: number;
  damageFormula: string;
  damageType: string;
  threatRange: number;
  critMultiplier: number;
  notes?: string;
}

export interface ThreatAbility {
  id: string;
  name: string;
  description: string;
}

export interface Threat {
  id: string;
  name: string;
  vd: number;
  element: ParanormalElement;
  secondaryElements?: ParanormalElement[];
  size: string;
  type: string;
  threatKind?: ThreatKind;
  pv: number;
  defense: number;
  displacement: string;
  disturbingPresence: {
    dt: number;
    damage: string;
    nexImmunity?: number;
  };
  enigmaOfFear?: string;
  enigmaResolved?: boolean;
  attributes: Record<AttributeKey, number>;
  saves: {
    fortitude: number;
    reflexos: number;
    vontade: number;
  };
  skills: { name: string; dice: number; bonus: number }[];
  resistances: string;
  vulnerabilities?: string;
  attacks: ThreatAttack[];
  abilities: ThreatAbility[];
  description: string;
  source?: ContentSource;
  isHomebrew?: boolean;
}

export interface InitiativeEntry {
  id: string;
  type: "agent" | "threat" | "custom";
  refId?: string;
  name: string;
  initiative: number;
  currentPv: number;
  maxPv: number;
  defense?: number;
  element?: ParanormalElement;
  notes?: string;
}

export interface ChaseParticipantState {
  id: string;
  refId?: string;
  type: "agent" | "threat" | "custom";
  name: string;
  successes: number;
  failures: number;
  maxFailures: number;
  extraEffortCount: number;
}

export interface SceneTrackerState {
  mode: SceneMode;
  investigationUrgencyRound: number;
  investigationMaxRounds: number;
  investigationTimeoutEvent?: string;
  investigationFailures?: number;
  investigationRolledEvents?: number[];
  investigationObstinateCounts?: Record<string, number>;
  investigationSuccessAnyCostAgents?: string[];
  stealthVisibility: number; // legacy group meter
  stealthGroupMode?: boolean;
  stealthAgentVisibility?: Record<string, number>;
  chaseRole?: "presas" | "cacadores";
  chaseBaseDt?: number;
  chaseTargetSuccesses: number;
  chaseTargetFailures?: number;
  chaseSuccesses: number;
  chaseFailures: number;
  chaseParticipants?: ChaseParticipantState[];
  interludeActionsDone: string[];
}

export type HandoutTemplateId =
  | "relatorio"
  | "necropsia"
  | "diario"
  | "jornal"
  | "terminal";

export type HandoutStamp =
  | "NONE"
  | "CONFIDENCIAL"
  | "ULTRASSECRETO"
  | "ARQUIVO MORTO"
  | "ANOMALIA ATIVA";

export type HandoutImageFilter = "none" | "bw" | "sepia" | "evidence";

export interface HandoutDocument {
  id: string;
  template: HandoutTemplateId;
  title: string;
  subtitle: string;
  date: string;
  author: string;
  stamp: HandoutStamp;
  body: string;
  imageDataUrl?: string;
  imageFilter?: HandoutImageFilter;
  bloodStain?: boolean;
  revealRedactions?: boolean;
  victimName?: string;
  estimatedTime?: string;
  causeOfDeath?: string;
  paranormalFindings?: string;
  emailFrom?: string;
  emailTo?: string;
  emailHash?: string;
  campaignId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  agentIds: string[];
  enabledSources?: ContentSource[];
  organization?: OrganizationId;
  optionalRules?: OptionalRuleId[];
  membraneState?: MembraneState;
  scene?: SceneTrackerState;
  initiative: InitiativeEntry[];
  activeTurnIndex: number;
  round: number;
  gmNotes: string;
  clues: { id: string; title: string; content: string; revealed: boolean }[];
  createdAt: string;
  updatedAt: string;
}

export type RollKind =
  | "attribute"
  | "skill"
  | "attack"
  | "damage"
  | "ritual"
  | "free"
  | "threat"
  | "ability";

export interface RollRecord {
  id: string;
  timestamp: string;
  actorName: string;
  actorId?: string;
  campaignId?: string;
  label: string;
  kind: RollKind;
  element?: ParanormalElement;
  formula: string;
  diceRolled: number[];
  chosenDie?: number;
  mode?: "highest" | "lowest" | "sum";
  bonus: number;
  total: number;
  isNat20?: boolean;
  isNat1?: boolean;
  isCriticalThreat?: boolean;
  isCriticalDamage?: boolean;
  details?: string;
}

export interface HomebrewState {
  weapons: InventoryItem[];
  items: InventoryItem[];
  rituals: AgentRitual[];
  abilities: AgentAbility[];
  origins: OriginDefinition[];
  trails?: TrailDefinition[];
  powers?: PowerDefinition[];
  modifications?: ModificationDefinition[];
  curses?: CurseDefinition[];
}

export interface AppBackupData {
  version: number;
  exportedAt: string;
  agents: Agent[];
  campaigns: Campaign[];
  threats: Threat[];
  homebrew: HomebrewState;
  handouts?: HandoutDocument[];
  rollHistory: RollRecord[];
}
