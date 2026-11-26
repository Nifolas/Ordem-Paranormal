import { describe, expect, it } from "vitest";
import {
  areElementsOpposing,
  calculateCombatStats,
  calculateInterludeRecovery,
  calculateItemFinalCategory,
  calculateLoadAndCategories,
  calculatePeLimit,
  calculateRitualPeCost,
  calculateVitals,
  canAddCurseToItem,
  checkPowerPrerequisites,
  consumeAttackAmmo,
  evaluateParanormalCost,
  evaluateVitalConditions,
  getAgentEffectiveAttributes,
  getAgentEffectiveVitals,
  getAllyAttackDiceBonus,
  getAllySkillModifiers,
  getBurstExtraDiceFormula,
  getDefaultMagazineCapacity,
  getNexMilestones,
  getOrganizationWeaponDamageBonus,
  getPassiveSkillModifiers,
  getTranscenderSanPenaltyPerCount,
  getTrailCarryBonus,
  reloadAttackAmmo,
  RITUAL_CIRCLE_BASE_PE,
  rollDiceFormula,
  rollExtraEffortDamage,
  rollObstinateSearch,
  rollOrdemTest,
  rollWeaponDamage,
  validateInitialAttributes,
} from "../ordem-rules";
import { BASE_ORIGINS } from "@/data/origins";
import { ALL_CLASSES, getClassById } from "@/data/classes";
import {
  COMMUNITY_POWERS,
  COMMUNITY_RITUALS,
  COMMUNITY_TRAILS,
} from "@/data/supplements";
import {
  getSuperiorExtraRounds,
  hasSuperiorForm,
} from "@/data/supplements/rituaisSuperiores";
import { SOURCE_META, filterByEnabledSources } from "@/data/sources";
import { BASE_TRAILS } from "@/data/trails";
import { BASE_CLASS_POWERS } from "@/data/classPowers";
import { BASE_GENERAL_POWERS } from "@/data/generalPowers";
import { BASE_PARANORMAL_POWERS } from "@/data/paranormalPowers";
import { BASE_RITUALS } from "@/data/rituals";
import {
  BASE_ACCESSORIES,
  BASE_AMMO,
  BASE_CURSED_ITEMS,
  BASE_CURSES,
  BASE_EXPLOSIVES,
  BASE_ITEMS,
  BASE_MEDICINES,
  BASE_MODIFICATIONS,
  BASE_OPERATIONAL_ITEMS,
  BASE_PARANORMAL_ITEMS,
  BASE_PROTECTIONS,
  BASE_WEAPONS,
} from "@/data/equipment";
import { BASE_THREATS } from "@/data/threats";
import { OPTIONAL_RULES_LIST } from "@/data/optionalRules";
import {
  applyAgentSkillList,
  createDefaultSkills,
  formatSkillDisplayName,
  getAgentSkillList,
  migrateAgentSkillList,
} from "@/data/skills";
import type { Agent, InventoryItem } from "@/types/ordem";

function makeDieRng(values: number[], sides = 20) {
  let i = 0;
  return () => {
    const val = values[i % values.length];
    i++;
    return (val - 0.5) / sides;
  };
}

describe("Motor de Regras Oficiais — Ordem Paranormal RPG v1.2 + SaH", () => {
  describe("1. Progressão, PV, PE, SAN, PD e Transcender", () => {
    it("calcula Combatente NEX 5% e NEX 50%", () => {
      const nex5 = calculateVitals({
        classId: "combatente",
        nex: 5,
        vig: 2,
        pre: 1,
      });
      expect(nex5).toEqual({
        maxPv: 22,
        maxSan: 12,
        maxPe: 3,
        maxPd: 7,
        peLimit: 1,
        level: 1,
      });

      const nex50 = calculateVitals({
        classId: "combatente",
        nex: 50,
        vig: 3,
        pre: 2,
      });
      // k = 9: PV = 23 + 9*7 = 86, PE = 4 + 9*4 = 40, SAN = 12 + 27 = 39, PD = 8 + 9*5 = 53
      expect(nex50).toEqual({
        maxPv: 86,
        maxSan: 39,
        maxPe: 40,
        maxPd: 53,
        peLimit: 10,
        level: 10,
      });
    });

    it("calcula Especialista NEX 25% e Ocultista NEX 99%", () => {
      const esp = calculateVitals({
        classId: "especialista",
        nex: 25,
        vig: 1,
        pre: 3,
      });
      expect(esp.maxPv).toBe(33);
      expect(esp.maxPe).toBe(30);
      expect(esp.maxSan).toBe(32);
      expect(esp.maxPd).toBe(39);
      expect(esp.peLimit).toBe(5);

      const ocu = calculateVitals({
        classId: "ocultista",
        nex: 99,
        vig: 1,
        pre: 4,
      });
      expect(ocu.maxPv).toBe(70);
      expect(ocu.maxPe).toBe(160);
      expect(ocu.maxSan).toBe(115);
      expect(ocu.maxPd).toBe(185);
      expect(ocu.peLimit).toBe(20);
    });

    it("calcula Sobrevivente Estágios 1 a 5 (NEX 0%) com Limite de PE fixo em 1", () => {
      const s1 = calculateVitals({
        classId: "sobrevivente",
        nex: 0,
        stage: 1,
        vig: 1,
        pre: 1,
      });
      expect(s1).toEqual({
        maxPv: 9,
        maxSan: 8,
        maxPe: 3,
        maxPd: 5,
        peLimit: 1,
        level: 1,
      });

      const s5 = calculateVitals({
        classId: "sobrevivente",
        nex: 0,
        stage: 5,
        vig: 2,
        pre: 1,
      });
      // Estágio 5 (k=4): PV = (8+2)+4*2 = 18, PE = (2+1)+4*1 = 7, SAN = 8+4*2 = 16, PD = (4+1)+4*2 = 13
      expect(s5).toEqual({
        maxPv: 18,
        maxSan: 16,
        maxPe: 7,
        maxPd: 13,
        peLimit: 1,
        level: 5,
      });
    });

    it("subtrai ganho de SAN ao escolher Transcender conforme a classe (3/4/5)", () => {
      const comb = calculateVitals({
        classId: "combatente",
        nex: 30, // k=5 -> SAN base 12+15 = 27
        vig: 2,
        pre: 1,
        transcenderCount: 2, // -6 SAN
      });
      expect(comb.maxSan).toBe(21);

      const esp = calculateVitals({
        classId: "especialista",
        nex: 30, // k=5 -> SAN base 16+20 = 36
        vig: 1,
        pre: 2,
        transcenderCount: 1, // -4 SAN
      });
      expect(esp.maxSan).toBe(32);

      const ocu = calculateVitals({
        classId: "ocultista",
        nex: 30, // k=5 -> SAN base 20+25 = 45
        vig: 1,
        pre: 3,
        transcenderCount: 2, // -10 SAN
      });
      expect(ocu.maxSan).toBe(35);
    });

    it("calcula limite de PE corretamente nas bordas", () => {
      expect(calculatePeLimit("combatente", 5)).toBe(1);
      expect(calculatePeLimit("combatente", 10)).toBe(2);
      expect(calculatePeLimit("combatente", 95)).toBe(19);
      expect(calculatePeLimit("combatente", 99)).toBe(20);
      expect(calculatePeLimit("sobrevivente", 0, 5)).toBe(1);
    });
  });

  describe("2. Rolagem d20 Oficial (totalDados = atributo + modificadores)", () => {
    it("Atributo 3 (totalDados > 0): rola 3d20 e pega o MAIOR", () => {
      const res = rollOrdemTest({
        attributeValue: 3,
        bonus: 5,
        rng: makeDieRng([4, 17, 9], 20),
      });
      expect(res.mode).toBe("highest");
      expect(res.diceCount).toBe(3);
      expect(res.chosenDie).toBe(17);
      expect(res.total).toBe(22);
    });

    it("Atributo 1 com -1d20 -> totalDados = 0 -> rola 2d20 e pega o MENOR", () => {
      const res = rollOrdemTest({
        attributeValue: 1,
        bonusDice: -1,
        bonus: 5,
        rng: makeDieRng([18, 4], 20),
      });
      expect(res.mode).toBe("lowest");
      expect(res.diceCount).toBe(2);
      expect(res.chosenDie).toBe(4);
      expect(res.total).toBe(9);
    });

    it("Atributo 0 com +1d20 -> totalDados = 1 -> rola 1d20 normal (maior)", () => {
      const res = rollOrdemTest({
        attributeValue: 0,
        bonusDice: 1,
        bonus: 5,
        rng: makeDieRng([14], 20),
      });
      expect(res.mode).toBe("highest");
      expect(res.diceCount).toBe(1);
      expect(res.chosenDie).toBe(14);
      expect(res.total).toBe(19);
    });

    it("Atributo 1 com -2d20 -> totalDados = -1 -> rola 3d20 e pega o MENOR", () => {
      const res = rollOrdemTest({
        attributeValue: 1,
        bonusDice: -2,
        bonus: 10,
        rng: makeDieRng([19, 12, 1], 20),
      });
      expect(res.mode).toBe("lowest");
      expect(res.diceCount).toBe(3);
      expect(res.chosenDie).toBe(1);
      expect(res.total).toBe(11);
      expect(res.isNat1).toBe(true);
    });

    it("detecta 20 natural e margem de ameaça", () => {
      const nat20 = rollOrdemTest({
        attributeValue: 2,
        bonus: 5,
        threatRange: 19,
        rng: makeDieRng([8, 20], 20),
      });
      expect(nat20.isNat20).toBe(true);
      expect(nat20.isCriticalThreat).toBe(true);

      const threat19 = rollOrdemTest({
        attributeValue: 2,
        bonus: 5,
        threatRange: 19,
        rng: makeDieRng([19, 4], 20),
      });
      expect(threat19.isNat20).toBe(false);
      expect(threat19.isCriticalThreat).toBe(true);
    });
  });

  describe("3. Dano Crítico (multiplica APENAS dados base da arma)", () => {
    it("multiplica dados base (1d8+4 com x3 -> 3d8+4) sem multiplicar bônus fixo nem dados extras", () => {
      const crit = rollWeaponDamage({
        baseFormula: "1d8+4",
        extraTerms: [{ formula: "2d6", label: "Ataque Furtivo" }],
        isCritical: true,
        critMultiplier: 3,
        rng: makeDieRng([5, 6, 7, 3, 4], 8),
      });
      expect(crit.effectiveFormula).toBe("3d8+4+2d6");
      expect(crit.baseRolls).toHaveLength(3);
      expect(crit.extraRolls).toHaveLength(2);
      expect(crit.bonus).toBe(4);
      expect(crit.isCriticalDamage).toBe(true);
    });

    it("multiplica dados extras APENAS quando multiplicaNoCritico: true", () => {
      const crit = rollWeaponDamage({
        baseFormula: "1d10+3",
        extraTerms: [
          {
            formula: "1d8",
            label: "Lancinante",
            multiplicaNoCritico: true,
          },
        ],
        isCritical: true,
        critMultiplier: 2,
        rng: makeDieRng([4, 5, 3, 6], 10),
      });
      expect(crit.effectiveFormula).toBe("2d10+3+2d8");
      expect(crit.baseRolls).toHaveLength(2);
      expect(crit.extraRolls).toHaveLength(2);
    });

    it("rola fórmulas livres como 3d6+2 e 1d100", () => {
      const res = rollDiceFormula({
        formula: "3d6+2",
        rng: makeDieRng([2, 5, 6], 6),
      });
      expect(res.total).toBe(15);

      const d100 = rollDiceFormula({
        formula: "1d100",
        rng: makeDieRng([77], 100),
      });
      expect(d100.total).toBe(77);
    });
  });

  describe("4. Carga, Sobrecarga, Defesa, Vulnerável, Categorias e Maldições", () => {
    it("calcula carga (FOR 0 = 2, FOR N = 5*N), sobrecarga (-5 Def/Carga, -3m) e teto 2x", () => {
      const items: InventoryItem[] = [
        {
          id: "1",
          name: "Fuzil",
          type: "Arma",
          category: 2,
          spaces: 2,
          quantity: 1,
          equipped: true,
          description: "",
        },
        {
          id: "2",
          name: "Proteção Pesada",
          type: "Proteção",
          category: 2,
          spaces: 5,
          quantity: 1,
          equipped: true,
          description: "",
        },
      ];
      const load = calculateLoadAndCategories({
        forAttr: 1,
        patente: "Operador",
        inventory: items,
      });
      expect(load.maxSpaces).toBe(5);
      expect(load.absoluteMaxSpaces).toBe(10);
      expect(load.usedSpaces).toBe(7);
      expect(load.isOverloaded).toBe(true);
      expect(load.exceedsAbsoluteMax).toBe(false);
      expect(load.overloadDefensePenalty).toBe(-5);
      expect(load.overloadSkillPenalty).toBe(-5);
      expect(load.overloadDisplacementPenalty).toBe(-3);

      const for0 = calculateLoadAndCategories({
        forAttr: 0,
        patente: "Recruta",
        inventory: [],
      });
      expect(for0.maxSpaces).toBe(2);
    });

    it("calcula categoria final com modificações e maldições e bloqueia Sangue↔Morte e Conhecimento↔Energia", () => {
      const katana: InventoryItem = {
        id: "k1",
        name: "Katana",
        type: "Arma",
        category: 1,
        spaces: 2,
        quantity: 1,
        equipped: true,
        description: "",
        modifications: [{ id: "m1", name: "Certeira", description: "" }],
        curses: [
          { id: "c1", name: "Sanguinária", element: "Sangue", description: "" },
        ],
      };
      // Base 1 + 1 mod + 2 primeira maldição = 4 (Cat IV)
      expect(calculateItemFinalCategory(katana)).toBe(4);

      // Pares opressores exatos
      expect(areElementsOpposing("Sangue", "Morte")).toBe(true);
      expect(areElementsOpposing("Morte", "Sangue")).toBe(true);
      expect(areElementsOpposing("Conhecimento", "Energia")).toBe(true);
      expect(areElementsOpposing("Energia", "Conhecimento")).toBe(true);

      // Não opressores
      expect(areElementsOpposing("Sangue", "Energia")).toBe(false);
      expect(areElementsOpposing("Sangue", "Conhecimento")).toBe(false);
      expect(areElementsOpposing("Morte", "Energia")).toBe(false);
      expect(areElementsOpposing("Medo", "Sangue")).toBe(false);

      expect(
        canAddCurseToItem(katana.curses, "Morte").allowed
      ).toBe(false);
      expect(
        canAddCurseToItem(katana.curses, "Energia").allowed
      ).toBe(true);
    });

    it("aplica Vulnerável (-2 Defesa), reações com exigência de treino e Machucado/Perturbado", () => {
      const mockAgent = {
        classId: "ocultista",
        nex: 20,
        patente: "Operador",
        attributes: { AGI: 2, FOR: 1, INT: 3, PRE: 3, VIG: 1 },
        status: {
          pv: { current: 10, maxOverride: null, autoCalc: true },
          san: { current: 15, maxOverride: null, autoCalc: true },
          pe: { current: 20, maxOverride: null, autoCalc: true },
          machucado: false,
          morrendo: false,
          enlouquecendo: false,
          vulneravel: true,
        },
        defense: {
          protectionBonus: 0,
          otherBonus: 1,
          displacement: 9,
          resistances: {},
        },
        ritualDTBonus: 0,
        inventory: [
          {
            id: "arm1",
            name: "Proteção Leve",
            type: "Proteção",
            category: 1,
            spaces: 2,
            quantity: 1,
            equipped: true,
            defenseBonus: 5,
            description: "",
          },
        ],
        skills: {
          reflexos: { attribute: "AGI", training: 5, bonus: 2 },
          fortitude: { attribute: "VIG", training: 0, bonus: 0 },
          luta: { attribute: "FOR", training: 5, bonus: 0 },
        },
      } as unknown as Agent;

      const combat = calculateCombatStats(mockAgent);
      // 10 + 2(AGI) + 5(Prot) + 1(Outros) - 2(Vulnerável) = 16
      expect(combat.defense).toBe(16);
      expect(combat.canDodge).toBe(true);
      expect(combat.dodge).toBe(23);
      expect(combat.canBlock).toBe(false);
      expect(combat.canCounterAttack).toBe(true);
      expect(combat.ritualDT).toBe(17);

      const conds = evaluateVitalConditions({
        currentPv: 10,
        maxPv: 20,
        currentSan: 15,
        maxSan: 30,
      });
      expect(conds.machucado).toBe(true);
      expect(conds.perturbado).toBe(true);
    });
  });

  describe("5. Rituais (Custo por Círculo) e Custo do Paranormal", () => {
    it("usa custos base oficiais (1º=1, 2º=3, 3º=6, 4º=10)", () => {
      expect(RITUAL_CIRCLE_BASE_PE).toEqual({ 1: 1, 2: 3, 3: 6, 4: 10 });
      expect(calculateRitualPeCost({ circle: 1, version: "Normal" })).toBe(1);
      expect(calculateRitualPeCost({ circle: 2, version: "Normal" })).toBe(3);
      expect(calculateRitualPeCost({ circle: 3, version: "Normal" })).toBe(6);
      expect(calculateRitualPeCost({ circle: 4, version: "Normal" })).toBe(10);
    });

    it("avalia Custo do Paranormal (DT 20+PE, falha perde PE em SAN, falha 5+ perde 1 SAN perm., isenção Medo)", () => {
      // 3 PE -> DT 23
      expect(
        evaluateParanormalCost({ rollTotal: 23, peSpent: 3 })
      ).toMatchObject({ passed: true, sanLost: 0, permanentSanLost: 0 });

      expect(
        evaluateParanormalCost({ rollTotal: 20, peSpent: 3 })
      ).toMatchObject({ passed: false, sanLost: 3, permanentSanLost: 0 });

      expect(
        evaluateParanormalCost({ rollTotal: 18, peSpent: 3 })
      ).toMatchObject({ passed: false, sanLost: 3, permanentSanLost: 1 });

      // Ritual de Medo isento
      expect(
        evaluateParanormalCost({
          rollTotal: 1,
          peSpent: 6,
          isFearRitual: true,
        })
      ).toMatchObject({ passed: true, sanLost: 0, permanentSanLost: 0 });
    });

    it("valida distribuição inicial de atributos (Agente +4 / Sobrevivente +3)", () => {
      expect(
        validateInitialAttributes(
          { AGI: 2, FOR: 2, INT: 2, PRE: 2, VIG: 1 },
          "combatente"
        ).valid
      ).toBe(true);
      expect(
        validateInitialAttributes(
          { AGI: 3, FOR: 0, INT: 2, PRE: 2, VIG: 1 },
          "sobrevivente"
        ).valid
      ).toBe(true);
      expect(
        validateInitialAttributes(
          { AGI: 3, FOR: 0, INT: 3, PRE: 3, VIG: 0 },
          "especialista"
        ).valid
      ).toBe(false);
    });
  });

  describe("6. Integração dos 7 Lotes — Passivos de Origens/Trilhas, Pré-requisitos e Catálogos", () => {
    it("confirma integralidade dos 7 lotes atualizados (50 origens, 28 trilhas, 101 poderes, 84 rituais, 105 itens em 9 categorias)", () => {
      expect(BASE_ORIGINS).toHaveLength(50);
      expect(BASE_TRAILS).toHaveLength(28);
      expect(BASE_CLASS_POWERS).toHaveLength(56);
      expect(BASE_GENERAL_POWERS).toHaveLength(20);
      expect(BASE_PARANORMAL_POWERS).toHaveLength(25);
      expect(BASE_RITUALS).toHaveLength(84);
      // 9 categorias padronizadas de Lote 6 = 105 itens
      expect(BASE_WEAPONS).toHaveLength(36);
      expect(BASE_PROTECTIONS).toHaveLength(4);
      expect(BASE_AMMO).toHaveLength(6);
      expect(BASE_ACCESSORIES).toHaveLength(6);
      expect(BASE_EXPLOSIVES).toHaveLength(5);
      expect(BASE_OPERATIONAL_ITEMS).toHaveLength(17);
      expect(BASE_MEDICINES).toHaveLength(4);
      expect(BASE_PARANORMAL_ITEMS).toHaveLength(9);
      expect(BASE_CURSED_ITEMS).toHaveLength(18);
      expect(BASE_ITEMS).toHaveLength(105);
      expect(BASE_MODIFICATIONS).toHaveLength(24);
      expect(BASE_CURSES).toHaveLength(24);
      expect(BASE_THREATS).toHaveLength(29);
      expect(OPTIONAL_RULES_LIST).toHaveLength(18);
    });

    it("aplica efeitosPassivos de Origens (Desgarrado, Universitário, Mergulhador, Policial, Vítima, Experimento)", () => {
      const baseAgent = {
        id: "t1",
        classId: "combatente",
        trilhaId: null,
        nex: 25, // level 5
        patente: "Operador",
        attributes: { AGI: 2, FOR: 2, INT: 2, PRE: 2, VIG: 2 },
        status: {
          pv: { current: 40, maxOverride: null, autoCalc: true },
          san: { current: 20, maxOverride: null, autoCalc: true },
          pe: { current: 20, maxOverride: null, autoCalc: true },
          machucado: false,
          morrendo: false,
          enlouquecendo: false,
        },
        defense: { protectionBonus: 0, otherBonus: 0, displacement: 9, resistances: {} },
        ritualDTBonus: 0,
        skills: {
          reflexos: { attribute: "AGI", training: 5, bonus: 0 },
          fortitude: { attribute: "VIG", training: 5, bonus: 0 },
          luta: { attribute: "FOR", training: 5, bonus: 0 },
          iniciativa: { attribute: "AGI", training: 5, bonus: 0 },
        },
        abilities: [],
        inventory: [],
      } as unknown as Agent;

      // Desgarrado: +1 PV por 5% NEX (+5 PV em NEX 25%)
      const desg = getAgentEffectiveVitals({ ...baseAgent, originId: "desgarrado" });
      const normal = getAgentEffectiveVitals({ ...baseAgent, originId: "academico" });
      expect(desg.maxPv - normal.maxPv).toBe(5);

      // Mergulhador: +5 PV fixo
      const merg = getAgentEffectiveVitals({ ...baseAgent, originId: "mergulhador" });
      expect(merg.maxPv - normal.maxPv).toBe(5);

      // Vítima: +1 SAN por 5% NEX (+5 SAN em NEX 25%)
      const vit = getAgentEffectiveVitals({ ...baseAgent, originId: "vitima" });
      expect(vit.maxSan - normal.maxSan).toBe(5);

      // Universitário: +1 PE inicial + 1 PE por NEX ímpar (15% e 25% = +2 => total +3 PE) e +1 Limite PE sem afetar DT
      const univAgent = { ...baseAgent, originId: "universitario" };
      const univVitals = getAgentEffectiveVitals(univAgent);
      const univCombat = calculateCombatStats(univAgent);
      expect(univVitals.maxPe - normal.maxPe).toBe(3);
      expect(univVitals.peLimit).toBe(6); // 5 + 1
      expect(univCombat.ritualDT).toBe(10 + 5 + 2); // DT usa limite base 5, não 6!

      // Policial: +2 Defesa
      const polCombat = calculateCombatStats({ ...baseAgent, originId: "policial" });
      expect(polCombat.defense).toBe(14); // 10 + 2 AGI + 2 Patrulha

      // Experimento: -1d20 em Diplomacia
      expect(
        getPassiveSkillModifiers({ ...baseAgent, originId: "experimento" }, "diplomacia")
      ).toEqual({ flatBonus: 0, diceModifier: -1 });

      // Treinado pela Hell Hunters (NEX 25%): +2 PV fixo + floor(25/10)=2 => +4 PV
      const hh = getAgentEffectiveVitals({ ...baseAgent, originId: "treinado_hell_hunters" });
      expect(hh.maxPv - normal.maxPv).toBe(4);
    });

    it("aplica passivos automáticos de Trilhas (Casca Grossa, Operações Especiais, Técnico, Muambeiro, Bibliotecário 99%, Durão)", () => {
      const base = {
        id: "t2",
        originId: "academico",
        patente: "Operador",
        attributes: { AGI: 2, FOR: 2, INT: 3, PRE: 2, VIG: 3 },
        status: {
          pv: { current: 50, maxOverride: null, autoCalc: true },
          san: { current: 30, maxOverride: null, autoCalc: true },
          pe: { current: 20, maxOverride: null, autoCalc: true },
          machucado: false,
          morrendo: false,
          enlouquecendo: false,
        },
        defense: { protectionBonus: 0, otherBonus: 0, displacement: 9, resistances: {} },
        ritualDTBonus: 0,
        skills: {
          fortitude: { attribute: "VIG", training: 10, bonus: 0 },
          reflexos: { attribute: "AGI", training: 5, bonus: 0 },
          luta: { attribute: "FOR", training: 5, bonus: 0 },
        },
        abilities: [],
        inventory: [],
      } as unknown as Agent;

      // Tropa de Choque (NEX 20% = lvl 4): +4 PV e +VIG (3) no Bloqueio RD (10+3=13)
      const choque = { ...base, classId: "combatente" as const, trilhaId: "tropa_de_choque", nex: 20 };
      const semTrilha = { ...base, classId: "combatente" as const, trilhaId: null, nex: 20 };
      expect(getAgentEffectiveVitals(choque).maxPv - getAgentEffectiveVitals(semTrilha).maxPv).toBe(4);
      expect(calculateCombatStats(choque).blockRd).toBe(13);

      // Operações Especiais (NEX 10%+): +5 Iniciativa
      const ops = { ...base, classId: "combatente" as const, trilhaId: "operacoes_especiais", nex: 10 };
      expect(getPassiveSkillModifiers(ops, "iniciativa").flatBonus).toBe(5);

      // Técnico (+INT = +3 carga) & Muambeiro (+5 carga)
      expect(getTrailCarryBonus({ ...base, classId: "especialista", trilhaId: "tecnico", nex: 10 })).toBe(3);
      expect(getTrailCarryBonus({ ...base, classId: "especialista", trilhaId: "muambeiro", nex: 10 })).toBe(5);

      // Bibliotecário 99%: +1 INT efetivo (3->4) e +4 PE total
      const bib99 = { ...base, classId: "especialista" as const, trilhaId: "bibliotecario", nex: 99 };
      const esp99 = { ...base, classId: "especialista" as const, trilhaId: null, nex: 99 };
      expect(getAgentEffectiveAttributes(bib99).INT).toBe(4);
      expect(getAgentEffectiveVitals(bib99).maxPe - getAgentEffectiveVitals(esp99).maxPe).toBe(4);

      // Sobrevivente Durão Estágio 3: +4 + 2 = +6 PV
      const durao3 = { ...base, classId: "sobrevivente" as const, trilhaId: "durao", nex: 0, stage: 3 };
      const surv3 = { ...base, classId: "sobrevivente" as const, trilhaId: null, nex: 0, stage: 3 };
      expect(getAgentEffectiveVitals(durao3).maxPv - getAgentEffectiveVitals(surv3).maxPv).toBe(6);
    });

    it("valida pré-requisitos de poderes (atributos, NEX, perícias e poderes elementais)", () => {
      const agent = {
        classId: "combatente",
        trilhaId: null,
        nex: 30,
        attributes: { AGI: 3, FOR: 2, INT: 1, PRE: 2, VIG: 2 },
        skills: {
          luta: { attribute: "FOR", training: 5, bonus: 0 },
          pontaria: { attribute: "AGI", training: 0, bonus: 0 },
          crime: { attribute: "AGI", training: 0, bonus: 0 },
        },
        abilities: [
          { id: "p1", name: "Sangue de Ferro", source: "Paranormal", element: "Sangue", peCost: 0, description: "" },
        ],
      } as unknown as Agent;

      expect(checkPowerPrerequisites(agent, "FOR 2, Luta").met).toBe(true);
      expect(checkPowerPrerequisites(agent, "AGI 3, Luta ou Pontaria").met).toBe(true);
      expect(checkPowerPrerequisites(agent, "NEX 30%").met).toBe(true);
      expect(checkPowerPrerequisites(agent, "Sangue 1").met).toBe(true);
      expect(checkPowerPrerequisites(agent, "Sangue 2").met).toBe(false);
      expect(checkPowerPrerequisites(agent, "INT 2").met).toBe(false);
      expect(checkPowerPrerequisites(agent, "NEX 60%").met).toBe(false);
    });

    it("migra e sincroniza perícias dinâmicas (Profissão com especialização, criar, editar e excluir)", () => {
      const legacyAgent = {
        id: "legacy-1",
        skills: createDefaultSkills(["luta", "profissao"]),
      } as unknown as Agent;

      const migrated = migrateAgentSkillList(legacyAgent);
      const list = getAgentSkillList(migrated);
      expect(list).toHaveLength(28);
      const prof = list.find((s) => s.id === "profissao");
      expect(prof?.treinamento).toBe(5);

      const withSpecAndCustom = applyAgentSkillList(migrated, [
        ...list.map((s) =>
          s.id === "profissao"
            ? { ...s, especializacao: "Psicólogo", treinamento: 10 as const }
            : s
        ),
        {
          id: "custom_cripto",
          nome: "Criptografia",
          especializacao: "Sigilos",
          descricao: "Decifra códigos antigos.",
          atributoBase: "INT",
          treinamento: 5,
          bonusOutros: 2,
          somenteTreinada: true,
          penalidadeCarga: false,
          requerKit: false,
          isCustom: true,
        },
      ]);

      expect(withSpecAndCustom.skillList).toHaveLength(29);
      expect(withSpecAndCustom.skills.profissao.training).toBe(10);
      expect(
        formatSkillDisplayName(
          withSpecAndCustom.skillList!.find((s) => s.id === "profissao")!
        )
      ).toBe("Profissão (Psicólogo)");
    });
  });

  describe("7. Interlúdio, Munição, Aliados e Cenas Especiais", () => {
    it("calcula recuperação de Interlúdio (Condições, Dormir, Relaxar + Aliados, Pratos, Modo PD e Ler)", () => {
      // Precária (0.5x floor) com base 7 -> floor(3.5) = 3
      const prec = calculateInterludeRecovery({
        restCondition: "precaria",
        baseRecovery: 7,
        didSleep: true,
        didRelax: true,
        alliesRelaxingTogether: 2,
        dishes: [],
      });
      expect(prec.pvRecovered).toBe(3);
      expect(prec.peRecovered).toBe(3);
      expect(prec.sanRecovered).toBe(5); // 3 + 2 aliados

      // Normal (1x) + Chef (Prato Nutritivo + Prato Energético) -> PV 2x, PE 2x
      const chef = calculateInterludeRecovery({
        restCondition: "normal",
        baseRecovery: 7,
        didSleep: true,
        didRelax: false,
        dishes: ["nutritivo", "energetico"],
        originId: "chef",
      });
      expect(chef.pvRecovered).toBe(14);
      expect(chef.peRecovered).toBe(14);
      expect(chef.sanRecovered).toBe(0);

      // Confortável (2x) + Prato Favorito + Prato Rápido
      const conf = calculateInterludeRecovery({
        restCondition: "confortavel",
        baseRecovery: 5,
        didSleep: true,
        didRelax: true,
        alliesRelaxingTogether: 1,
        dishes: ["favorito", "rapido"],
        originId: "nerd_entusiasta",
      });
      expect(conf.pvRecovered).toBe(10);
      expect(conf.peRecovered).toBe(10);
      expect(conf.sanRecovered).toBe(13); // 10 + 1 aliado + 2 Favorito
      expect(conf.reviewCaseBonus).toBe(5);
      expect(conf.readDieFormula).toBe("2d6");

      // Modo PD (Jogando sem Sanidade): Dormir recupera APENAS PV; Relaxar recupera PD; Favorito dá +2 PD temp
      const pdMode = calculateInterludeRecovery({
        restCondition: "luxuosa",
        baseRecovery: 4,
        usingPd: true,
        didSleep: true,
        didRelax: true,
        alliesRelaxingTogether: 2,
        dishes: ["favorito"],
        trilhaId: "bibliotecario",
        nex: 40,
      });
      expect(pdMode.pvRecovered).toBe(12);
      expect(pdMode.peRecovered).toBe(0);
      expect(pdMode.pdRecovered).toBe(14); // 12 + 2 aliados
      expect(pdMode.pdTempBonus).toBe(2);
      expect(pdMode.readDieFormula).toBe("1d8");
    });

    it("controla consumo e recarga de munição (normal, rajada 10 balas +2d, vazio e reserva)", () => {
      expect(getDefaultMagazineCapacity("Pistola")).toMatchObject({
        capacity: 12,
        isRanged: true,
        supportsBurst: false,
      });
      expect(getDefaultMagazineCapacity("Fuzil de Assalto")).toMatchObject({
        capacity: 30,
        isRanged: true,
        supportsBurst: true,
      });
      expect(getDefaultMagazineCapacity("Espingarda de Cano Duplo").capacity).toBe(2);
      expect(getDefaultMagazineCapacity("Fuzil de Precisão").capacity).toBe(1);

      // Disparo normal
      expect(consumeAttackAmmo({ current: 12 })).toEqual({
        ok: true,
        consumed: 1,
        nextCurrent: 11,
      });
      // Pente vazio
      expect(consumeAttackAmmo({ current: 0 })).toMatchObject({
        ok: false,
        reason: "empty",
      });
      // Rajada (10 balas)
      expect(consumeAttackAmmo({ current: 30, burstMode: true })).toEqual({
        ok: true,
        consumed: 10,
        nextCurrent: 20,
      });
      expect(consumeAttackAmmo({ current: 6, burstMode: true })).toMatchObject({
        ok: false,
        reason: "insufficient_burst",
      });
      expect(getBurstExtraDiceFormula("2d10+2", 2)).toBe("2d10");

      // Recarga com reserva vinculada
      expect(reloadAttackAmmo({ current: 4, max: 12, reserve: 20 })).toEqual({
        nextCurrent: 12,
        loaded: 8,
        nextReserve: 12,
      });
      // Recarga parcial quando reserva acaba
      expect(reloadAttackAmmo({ current: 2, max: 12, reserve: 5 })).toEqual({
        nextCurrent: 7,
        loaded: 5,
        nextReserve: 0,
      });
      // Recarga direta sem reserva vinculada
      expect(reloadAttackAmmo({ current: 0, max: 6, reserve: null })).toEqual({
        nextCurrent: 6,
        loaded: 6,
        nextReserve: null,
      });
    });

    it("rola Busca Obstinada progressiva (1d4 -> 2d4 -> 3d4) e Esforço Extra", () => {
      const maxRng = () => 0.9999; // rola 4 em cada d4
      const b1 = rollObstinateSearch(1, maxRng);
      expect(b1.formula).toBe("1d4");
      expect(b1.diceRolled).toEqual([4]);
      expect(b1.sanLoss).toBe(4);

      const b2 = rollObstinateSearch(2, maxRng);
      expect(b2.formula).toBe("2d4");
      expect(b2.diceRolled).toEqual([4, 4]);
      expect(b2.sanLoss).toBe(8);

      const b3 = rollObstinateSearch(3, maxRng);
      expect(b3.formula).toBe("3d4");
      expect(b3.sanLoss).toBe(12);

      const e2 = rollExtraEffortDamage(2, () => 0.0); // rola 1 em cada d4
      expect(e2.formula).toBe("2d4");
      expect(e2.pvLoss).toBe(2);
    });

    it("aplica bônus de Aliados ativos sem acumular bônus iguais e ignora aliados mortos", () => {
      const mockAgent = {
        allies: [
          {
            id: "a1",
            templateId: "cao_adestrado",
            name: "Rex",
            kind: "pet",
            helping: true,
            bonusSummary: "+2 Investigação/Percepção",
            skillFlatBonuses: { investigacao: 2, percepcao: 2 },
            abilityName: "Ladrar",
            abilityPeCost: 1,
            abilityDescription: "",
          },
          {
            id: "a2",
            templateId: "companheiro_animal",
            name: "Corvo",
            kind: "pet",
            helping: true,
            bonusSummary: "+2 Percepção",
            skillFlatBonuses: { percepcao: 2 },
            abilityName: "Apoio",
            abilityPeCost: 1,
            abilityDescription: "",
          },
          {
            id: "a3",
            templateId: "guerrilheiro",
            name: "Marcos",
            kind: "aliado",
            helping: true,
            bonusSummary: "+1d20 ataque",
            attackDiceBonus: 1,
            abilityName: "Ataque Conjunto",
            abilityPeCost: 1,
            abilityDescription: "",
            dangerRuleEnabled: true,
            wounds: 2, // morto -> não deve aplicar bônus
          },
          {
            id: "a4",
            templateId: "socorrista",
            name: "Dra. Clara",
            kind: "aliado",
            helping: true,
            bonusSummary: "Treinado em Medicina",
            trainedSkills: ["medicina"],
            abilityName: "Bolsa",
            abilityPeCost: 1,
            abilityDescription: "",
          },
        ],
      } as unknown as Agent;

      // Dois pets dando +2 em Percepção -> não acumula (fica +2, não +4)
      expect(getAllySkillModifiers(mockAgent, "percepcao").flatBonus).toBe(2);
      // Socorrista concede treinado em Medicina
      expect(getAllySkillModifiers(mockAgent, "medicina").grantsTrained).toBe(true);
      // Guerrilheiro morto (2/2 ferimentos) não concede +1d20 ataque
      expect(getAllyAttackDiceBonus(mockAgent)).toBe(0);
    });
  });

  describe("8. Suplementos da Comunidade, Classes Devoto/Predador e Organizações", () => {
    it("calcula PV/PE/SAN de Devoto e Predador (Grimório do Cataclisma)", () => {
      // Devoto NEX 5%: PV 14+VIG, PE 3+PRE, SAN 18
      const dev5 = calculateVitals({ classId: "devoto", nex: 5, vig: 2, pre: 3 });
      expect(dev5).toMatchObject({ maxPv: 16, maxPe: 6, maxSan: 18 });
      // Devoto NEX 25% (k=4): PV (14+2)+4*(2+2)=32 | PE (3+3)+4*(3+3)=30 | SAN 18+4*4=34
      const dev25 = calculateVitals({ classId: "devoto", nex: 25, vig: 2, pre: 3 });
      expect(dev25).toMatchObject({ maxPv: 32, maxPe: 30, maxSan: 34 });

      // Predador NEX 25% (k=4): PV (18+2)+4*(4+2)=44 | PE (2+2)+4*(3+2)=24 | SAN 14+4*3=26
      const pred25 = calculateVitals({ classId: "predador", nex: 25, vig: 2, pre: 2 });
      expect(pred25).toMatchObject({ maxPv: 44, maxPe: 24, maxSan: 26 });

      // Devoto conjura círculos como Ocultista (5/25/55/85)
      expect(getNexMilestones("devoto", 5).maxRitualCircle).toBe(1);
      expect(getNexMilestones("devoto", 55).maxRitualCircle).toBe(3);
      expect(getNexMilestones("devoto", 85).maxRitualCircle).toBe(4);
      expect(getNexMilestones("predador", 85).maxRitualCircle).toBe(0);

      expect(ALL_CLASSES.map((c) => c.id)).toEqual(
        expect.arrayContaining(["devoto", "predador"])
      );
      expect(getClassById("devoto").source).toBe("grimorio_do_cataclisma");
      expect(getClassById("predador").baseProficiencies).toMatch(/táticas/);
    });

    it("aplica modificadores das Organizações da Realidade", () => {
      const weapon = {
        id: "w",
        name: "Pistola",
        type: "Arma",
        category: 2,
        spaces: 1,
        quantity: 1,
        equipped: true,
        description: "",
      } as InventoryItem;
      const paranormal = {
        id: "p",
        name: "Amuleto",
        type: "paranormal",
        category: 2,
        spaces: 1,
        quantity: 1,
        equipped: true,
        description: "",
      } as InventoryItem;

      expect(calculateItemFinalCategory(weapon)).toBe(2);
      expect(calculateItemFinalCategory(weapon, "hell_hunters")).toBe(1);
      expect(calculateItemFinalCategory(paranormal, "famiglia_leone")).toBe(3);
      expect(calculateItemFinalCategory(paranormal, "obscurite")).toBe(1);
      expect(calculateItemFinalCategory(paranormal, "ordo_realitas")).toBe(2);

      expect(getOrganizationWeaponDamageBonus("hell_hunters", "Recruta")).toBe(3);
      expect(
        getOrganizationWeaponDamageBonus("hell_hunters", "Oficial de Operações")
      ).toBe(5);
      expect(getOrganizationWeaponDamageBonus("obscurite", "Recruta")).toBe(0);

      // Ordo Calamitas: Transcender perde apenas 2 SAN do nível (Ocultista: 5/nível)
      const base = { classId: "ocultista" as const, nex: 25, vig: 1, pre: 1 };
      const normal = calculateVitals({ ...base, transcenderCount: 1 });
      const calamitas = calculateVitals({
        ...base,
        transcenderCount: 1,
        transcenderSanPenaltyPerCount: getTranscenderSanPenaltyPerCount("ordo_calamitas"),
      });
      expect(calamitas.maxSan - normal.maxSan).toBe(3);
      expect(getTranscenderSanPenaltyPerCount("ordo_realitas")).toBeUndefined();
    });

    it("aplica condição Desorientado (-3 Defesa) e pré-requisito 'Veterano em Furtividade'", () => {
      const mk = (desorientado: boolean, furtividade: number) =>
        ({
          classId: "combatente",
          nex: 10,
          patente: "Recruta",
          attributes: { AGI: 2, FOR: 1, INT: 1, PRE: 1, VIG: 1 },
          status: {
            pv: { current: 10, maxOverride: null, autoCalc: true },
            san: { current: 10, maxOverride: null, autoCalc: true },
            pe: { current: 10, maxOverride: null, autoCalc: true },
            machucado: false,
            morrendo: false,
            enlouquecendo: false,
            desorientado,
          },
          defense: { protectionBonus: 0, otherBonus: 0, displacement: 9, resistances: {} },
          ritualDTBonus: 0,
          inventory: [],
          abilities: [],
          skills: {
            furtividade: { attribute: "AGI", training: furtividade, bonus: 0 },
          },
        }) as unknown as Agent;

      const normal = calculateCombatStats(mk(false, 10)).defense;
      const disoriented = calculateCombatStats(mk(true, 10)).defense;
      expect(normal - disoriented).toBe(3);

      expect(checkPowerPrerequisites(mk(false, 10), "Veterano em Furtividade").met).toBe(true);
      expect(checkPowerPrerequisites(mk(false, 5), "Veterano em Furtividade").met).toBe(false);
      expect(checkPowerPrerequisites(mk(false, 15), "Expert em Furtividade").met).toBe(true);
    });

    it("calcula rodadas extras da aba Superior e detecta os 4 rituais com forma Superior", () => {
      expect(getSuperiorExtraRounds(0)).toBe(0);
      expect(getSuperiorExtraRounds(5)).toBe(1);
      expect(getSuperiorExtraRounds(10)).toBe(2);
      expect(getSuperiorExtraRounds(15)).toBe(3);

      for (const name of [
        "Invólucro de Carne",
        "Desacelerar Impacto",
        "Vidência",
        "Transfigurar Terra",
      ]) {
        expect(hasSuperiorForm({ name })).toBe(true);
      }
      expect(hasSuperiorForm({ name: "Cicatrização" })).toBe(false);
      expect(
        calculateRitualPeCost({ circle: 3, version: "Superior", superiorCost: 9 })
      ).toBe(9);
    });

    it("importa o Bloco A completo com IDs prefixados, sem colisão com o conteúdo oficial", () => {
      expect(COMMUNITY_TRAILS).toHaveLength(1);
      expect(COMMUNITY_TRAILS[0].id).toBe("ext_dr_frankenstein");
      expect(COMMUNITY_TRAILS[0].abilitiesByNex.map((a) => a.nex)).toEqual([
        10, 40, 65, 99,
      ]);
      expect(COMMUNITY_RITUALS.map((r) => r.id)).toEqual(["ext_recriando_o_terror"]);
      expect(COMMUNITY_POWERS.map((p) => p.id).sort()).toEqual([
        "ext_aspecto_imperceptivel",
        "ext_desacreditado",
        "ext_imbuir_sistema",
      ]);

      const community = [
        ...COMMUNITY_TRAILS,
        ...COMMUNITY_POWERS,
        ...COMMUNITY_RITUALS,
      ];
      for (const item of community) {
        const meta = SOURCE_META.find((s) => s.id === item.source);
        expect(meta?.idPrefix).toBeDefined();
        expect(item.id.startsWith(meta!.idPrefix!)).toBe(true);
      }

      const officialIdSet = new Set([
        ...BASE_ORIGINS.map((o) => o.id),
        ...BASE_TRAILS.map((t) => t.id),
        ...BASE_CLASS_POWERS.map((p) => p.id),
        ...BASE_GENERAL_POWERS.map((p) => p.id),
        ...BASE_PARANORMAL_POWERS.map((p) => p.id),
        ...BASE_RITUALS.map((r) => r.id),
        ...BASE_ITEMS.map((i) => i.id),
      ]);
      for (const item of community) {
        expect(officialIdSet.has(item.id)).toBe(false);
      }
    });

    it("filtra conteúdo da comunidade pelos toggles individuais sem ocultar oficiais", () => {
      const items = [
        { id: "a", source: "livro_basico" as const },
        { id: "b", source: "comunidade_avulsos" as const },
        { id: "c", source: "grimorio_do_cataclisma" as const },
      ];
      expect(filterByEnabledSources(items, undefined).map((i) => i.id)).toEqual(["a"]);
      expect(
        filterByEnabledSources(items, ["livro_basico", "comunidade_avulsos"]).map(
          (i) => i.id
        )
      ).toEqual(["a", "b"]);
    });
  });
});
