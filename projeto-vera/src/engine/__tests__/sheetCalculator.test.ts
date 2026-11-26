import { describe, expect, it } from "vitest";
import {
  areElementsOpposing,
  calculateCombatStats,
  calculateItemFinalCategory,
  calculateLoadAndCategories,
  calculatePeLimit,
  calculateStackedBonus,
  calculateVitals,
  canAddCurseToItem,
  evaluateParanormalCost,
  getMaxAllowedTrainingDegree,
  rollDiceFormula,
  rollOrdemTest,
  validateInitialAttributes,
} from "../sheetCalculator";
import type { Agent, InventoryItem } from "@/types/ordem";

function makeDieRng(values: number[], sides = 20) {
  let i = 0;
  return () => {
    const val = values[i % values.length];
    i++;
    return (val - 0.5) / sides;
  };
}

describe("sheetCalculator — Ordem Paranormal v1.2 + Sobrevivendo ao Horror", () => {
  describe("Fórmulas de PV, PE, SAN e PD por Classe, NEX e Estágio", () => {
    it("calcula Combatente NEX 5% e NEX 50% (incluindo PD)", () => {
      const n5 = calculateVitals({
        classId: "combatente",
        nex: 5,
        vig: 2,
        pre: 1,
      });
      expect(n5).toEqual({
        maxPv: 22,
        maxPe: 3,
        maxSan: 12,
        maxPd: 7,
        peLimit: 1,
        level: 1,
      });

      // k = 9: PV = 23 + 9*7 = 86, PE = 4 + 9*4 = 40, SAN = 12 + 27 = 39, PD = 8 + 9*5 = 53
      const n50 = calculateVitals({
        classId: "combatente",
        nex: 50,
        vig: 3,
        pre: 2,
      });
      expect(n50).toEqual({
        maxPv: 86,
        maxPe: 40,
        maxSan: 39,
        maxPd: 53,
        peLimit: 10,
        level: 10,
      });
    });

    it("calcula Especialista NEX 25% e Ocultista NEX 99% (com PD)", () => {
      const esp = calculateVitals({
        classId: "especialista",
        nex: 25,
        vig: 1,
        pre: 3,
      });
      // k = 4: PV=17+16=33, PE=6+24=30, SAN=16+16=32, PD=(8+3)+4*(4+3)=11+28=39
      expect(esp.maxPv).toBe(33);
      expect(esp.maxPe).toBe(30);
      expect(esp.maxSan).toBe(32);
      expect(esp.maxPd).toBe(39);

      const ocu = calculateVitals({
        classId: "ocultista",
        nex: 99,
        vig: 1,
        pre: 4,
      });
      // k = 19: PV=13+57=70, PE=8+152=160, SAN=20+95=115, PD=(10+4)+19*(5+4)=14+171=185
      expect(ocu.maxPv).toBe(70);
      expect(ocu.maxPe).toBe(160);
      expect(ocu.maxSan).toBe(115);
      expect(ocu.maxPd).toBe(185);
      expect(ocu.peLimit).toBe(20);
    });

    it("calcula Sobrevivente Estágios 1 a 5 (SaH) com Limite de PE sempre 1", () => {
      // Estágio 1: PV=8+VIG, PE=2+PRE, SAN=8, PD=4+PRE
      const s1 = calculateVitals({
        classId: "sobrevivente",
        nex: 0,
        stage: 1,
        vig: 2,
        pre: 1,
      });
      expect(s1).toEqual({
        maxPv: 10,
        maxPe: 3,
        maxSan: 8,
        maxPd: 5,
        peLimit: 1,
        level: 1,
      });

      // Estágio 5 (k=4): PV=10+4*2=18, PE=3+4*1=7, SAN=8+4*2=16, PD=5+4*2=13, Limite PE=1
      const s5 = calculateVitals({
        classId: "sobrevivente",
        nex: 0,
        stage: 5,
        vig: 2,
        pre: 1,
      });
      expect(s5).toEqual({
        maxPv: 18,
        maxPe: 7,
        maxSan: 16,
        maxPd: 13,
        peLimit: 1,
        level: 5,
      });
    });

    it("subtrai SAN automaticamente ao usar Transcender e com Cultista Arrependido", () => {
      // Ocultista NEX 30% (k=5): SAN base = 20 + 5*5 = 45
      // Com 2 Transcender (-10 SAN) e Cultista Arrependido (-10 SAN metade inicial) = 25 SAN
      const res = calculateVitals({
        classId: "ocultista",
        nex: 30,
        vig: 1,
        pre: 3,
        transcenderCount: 2,
        halfInitialSan: true,
      });
      expect(res.maxSan).toBe(25);
    });

    it("suporta regras opcionais Evolução por Patentes e NEX & Experiência", () => {
      expect(
        calculatePeLimit("combatente", 15, 1, {
          patente: "Oficial de Operações",
          optionalRules: ["evolucao_por_patentes"],
        })
      ).toBe(10);

      const sep = calculateVitals({
        classId: "especialista",
        nex: 50,
        level: 4, // Nível 4 independente do NEX 50%
        vig: 1,
        pre: 2,
        optionalRules: ["nex_e_experiencia"],
      });
      // k = 3: PV=17+3*4=29, SAN=16+3*4=28
      expect(sep.level).toBe(4);
      expect(sep.maxPv).toBe(29);
      expect(sep.maxSan).toBe(28);
      expect(sep.peLimit).toBe(4);
    });
  });

  describe("Defesa, Acúmulo de Bônus, Sobrecarga e Reações Defensivas", () => {
    it("aplica regra oficial de acúmulo entre as 4 fontes (Habilidade, Item, Ritual, Aliado)", () => {
      const total = calculateStackedBonus([
        { source: "Habilidade", value: 2 },
        { source: "Habilidade", value: 3 }, // Habilidades diferentes acumulam = +5
        { source: "Item", value: 5 },
        { source: "Item", value: 2 }, // Mesmo Item não acumula = maior (+5)
        { source: "Ritual", value: 5 }, // Fonte diferente acumula = +5
        { source: "Ritual", value: 10 }, // Maior ritual = +10
        { source: "Aliado", value: 2 }, // Fonte diferente acumula = +2
      ]);
      // 5 (Hab) + 5 (Item) + 10 (Ritual) + 2 (Aliado) = 22
      expect(total).toBe(22);
    });

    it("calcula Defesa com Proteção + Escudo + Acessório Paranormal + Penalidade de Sobrecarga (-5)", () => {
      const mockAgent = {
        classId: "combatente",
        nex: 20,
        patente: "Operador",
        attributes: { AGI: 2, FOR: 1, INT: 1, PRE: 2, VIG: 2 },
        defense: {
          protectionBonus: 0,
          otherBonus: 1,
          displacement: 9,
          resistances: {},
        },
        ritualDTBonus: 0,
        inventory: [
          {
            id: "p1",
            name: "Proteção Leve",
            type: "Proteção",
            category: 1,
            spaces: 2,
            quantity: 1,
            equipped: true,
            defenseBonus: 5,
            description: "",
          },
          {
            id: "e1",
            name: "Escudo",
            type: "Escudo",
            category: 0,
            spaces: 2,
            quantity: 1,
            equipped: true,
            defenseBonus: 2,
            description: "",
          },
          {
            id: "a1",
            name: "Amuleto Paranormal",
            type: "Acessório Paranormal",
            category: 2,
            spaces: 2, // Total 6 > 5*1 => Sobrecarregado (-5 Defesa!)
            quantity: 1,
            equipped: true,
            defenseBonus: 2,
            description: "",
          },
        ],
        skills: {
          reflexos: { attribute: "AGI", training: 5, bonus: 0 },
          fortitude: { attribute: "VIG", training: 0, bonus: 0 },
          luta: { attribute: "FOR", training: 5, bonus: 0 },
        },
      } as unknown as Agent;

      const combat = calculateCombatStats(mockAgent);
      // 10 + 2(AGI) + 5(Prot) + 2(Escudo) + 2(Acess) + 1(Outros) - 5(Sobrecarga) = 17
      expect(combat.defense).toBe(17);
      expect(combat.overloadDefensePenalty).toBe(-5);
      expect(combat.canDodge).toBe(true);
      expect(combat.dodge).toBe(22);
      expect(combat.canBlock).toBe(false); // Fortitude destreinada
      expect(combat.canCounterAttack).toBe(true);
    });
  });

  describe("Categoria Final de Itens, Modificações, Maldições e Opressão Elemental", () => {
    it("calcula categoria final com modificações (+1) e maldições (+2 primeira, +1 extras)", () => {
      const weapon: InventoryItem = {
        id: "w1",
        name: "Katana Amaldiçoada",
        type: "Arma",
        category: 1,
        spaces: 2,
        quantity: 1,
        equipped: true,
        description: "",
        modifications: [
          { id: "m1", name: "Certeira", description: "+2 ataque" },
        ],
        curses: [
          { id: "c1", name: "Sanguinária", element: "Sangue", description: "" },
          { id: "c2", name: "Lancinante", element: "Sangue", description: "" },
        ],
      };
      // Base 1 + 1 mod + (2 + 1) maldições = 5 -> clamped a Cat IV (4)
      expect(calculateItemFinalCategory(weapon)).toBe(4);

      const reduced = { ...weapon, categoryReduction: 2 };
      // 1 + 1 + 3 - 2 = 3 (Cat III)
      expect(calculateItemFinalCategory(reduced)).toBe(3);
    });

    it("bloqueia maldições de elementos opressores no mesmo item (Sangue↔Morte, Conhecimento↔Energia)", () => {
      expect(areElementsOpposing("Sangue", "Morte")).toBe(true);
      expect(areElementsOpposing("Morte", "Sangue")).toBe(true);
      expect(areElementsOpposing("Conhecimento", "Energia")).toBe(true);
      expect(areElementsOpposing("Energia", "Conhecimento")).toBe(true);
      expect(areElementsOpposing("Sangue", "Conhecimento")).toBe(false);
      expect(areElementsOpposing("Sangue", "Energia")).toBe(false);
      expect(areElementsOpposing("Medo", "Sangue")).toBe(false);

      const check = canAddCurseToItem(
        [{ id: "c1", name: "Sanguinária", element: "Sangue", description: "" }],
        "Morte"
      );
      expect(check.allowed).toBe(false);
      expect(check.conflictingElement).toBe("Sangue");
    });

    it("calcula sobrecarga com penalidade -5 em perícias de carga e conta categoria final", () => {
      const items: InventoryItem[] = [
        {
          id: "i1",
          name: "Fuzil Modificado",
          type: "Arma",
          category: 2,
          spaces: 6,
          quantity: 1,
          equipped: true,
          description: "",
          modifications: [{ id: "m1", name: "Mira Laser", description: "" }], // Final Cat III!
        },
      ];
      const res = calculateLoadAndCategories({
        forAttr: 1,
        patente: "Operador",
        inventory: items,
      });
      expect(res.maxSpaces).toBe(5);
      expect(res.isOverloaded).toBe(true);
      expect(res.overloadSkillPenalty).toBe(-5);
      expect(res.overloadDefensePenalty).toBe(-5);
      expect(res.categoryCounts[3]).toBe(1);
      expect(res.categoryExceeded[3]).toBe(true);
    });
  });

  describe("Rolagens d20, Dano Crítico, Custo do Paranormal e Graus de Treino", () => {
    it("aplica regra oficial de pools positivos, zero e negativos", () => {
      const pos = rollOrdemTest({
        attributeValue: 3,
        bonus: 5,
        rng: makeDieRng([4, 18, 9], 20),
      });
      expect(pos.chosenDie).toBe(18);
      expect(pos.total).toBe(23);

      const zero = rollOrdemTest({
        attributeValue: 0,
        bonus: 5,
        rng: makeDieRng([19, 4], 20),
      });
      expect(zero.diceCount).toBe(2);
      expect(zero.chosenDie).toBe(4);
      expect(zero.total).toBe(9);

      const neg = rollOrdemTest({
        attributeValue: 1,
        bonusDice: -2,
        bonus: 0,
        rng: makeDieRng([15, 11, 2], 20),
      });
      expect(neg.diceCount).toBe(3);
      expect(neg.chosenDie).toBe(2);
    });

    it("multiplica apenas dados base em dano crítico e avalia Custo do Paranormal", () => {
      const crit = rollDiceFormula({
        formula: "2d6+4",
        isCritical: true,
        critMultiplier: 3,
        rng: makeDieRng([3, 3, 3, 3, 3, 3], 6),
      });
      expect(crit.effectiveFormula).toBe("6d6+4");
      expect(crit.total).toBe(22);

      // Custo do Paranormal: 3 PE -> DT 23
      expect(evaluateParanormalCost({ rollTotal: 23, peSpent: 3 }).passed).toBe(true);
      expect(evaluateParanormalCost({ rollTotal: 20, peSpent: 3 })).toMatchObject({
        passed: false,
        sanLost: 3,
        permanentSanLost: 0,
      });
      expect(evaluateParanormalCost({ rollTotal: 18, peSpent: 3 })).toMatchObject({
        passed: false,
        sanLost: 3,
        permanentSanLost: 1,
      });
    });

    it("valida graus máximos de treinamento por NEX e atributos iniciais", () => {
      expect(getMaxAllowedTrainingDegree("combatente", 30)).toBe(5);
      expect(getMaxAllowedTrainingDegree("combatente", 35)).toBe(10);
      expect(getMaxAllowedTrainingDegree("combatente", 70)).toBe(15);

      expect(
        validateInitialAttributes(
          { AGI: 3, FOR: 0, INT: 2, PRE: 2, VIG: 1 },
          "sobrevivente"
        ).valid
      ).toBe(true);
    });
  });
});
