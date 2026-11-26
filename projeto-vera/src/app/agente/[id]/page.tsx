"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import {
  Backpack,
  Dices,
  FileText,
  Flame,
  SlidersHorizontal,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import {
  formatSkillDisplayName,
  getAgentSkillList,
  STANDARD_SKILL_KEYS,
} from "@/data/skills";
import {
  calculateLoadAndCategories,
  getAgentEffectiveAttributes,
  getAllySkillModifiers,
  getPassiveSkillModifiers,
  getTrailCarryBonus,
  rollOrdemTest,
} from "@/lib/ordem-rules";
import { cn, formatSigned } from "@/lib/utils";
import type { Agent, AgentSkill, AttributeKey, SkillKey } from "@/types/ordem";
import { SheetTacticalHeader } from "@/components/sheet/SheetTacticalHeader";
import { LeftColumn } from "@/components/sheet/LeftColumn";
import { SkillsColumn } from "@/components/sheet/SkillsColumn";
import {
  RightTabsColumn,
  type SheetWorkspaceTab,
} from "@/components/sheet/RightTabsColumn";
import { Button, Card } from "@/components/ui/primitives";

type MobileTabId = "resumo" | "pericias" | SheetWorkspaceTab;

export default function AgenteSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { agents, updateAgent, pushRoll, quickDiceMod } = useAppStore();

  const [mobileTab, setMobileTab] = useState<MobileTabId>("habilidades");
  const [workspaceTab, setWorkspaceTab] =
    useState<SheetWorkspaceTab>("habilidades");
  const [skillsCollapsed, setSkillsCollapsed] = useState(false);

  const agent = agents.find((a) => a.id === id);

  if (!agent) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Card className="p-8 space-y-4">
          <h1 className="font-display text-lg font-bold text-[#F4F4F5]">
            Dossiê não encontrado
          </h1>
          <p className="text-xs text-[#8E8E9E]">
            Esta ficha não existe no armazenamento local atual ou foi removida.
          </p>
          <div className="flex justify-center gap-2">
            <Link href="/agentes">
              <Button variant="primary">Voltar para Meus Agentes</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const skillList = getAgentSkillList(agent);

  const handleUpdate = (updater: (prev: Agent) => Agent) => {
    updateAgent(agent.id, updater);
  };

  const handleRollAttribute = (attrKey: AttributeKey) => {
    const effAttrs = getAgentEffectiveAttributes(agent);
    const val = effAttrs[attrKey];
    const res = rollOrdemTest({
      attributeValue: val,
      bonus: 0,
      bonusDice: quickDiceMod,
    });

    pushRoll({
      actorName: agent.name,
      actorId: agent.id,
      label: `Teste de ${attrKey}`,
      kind: "attribute",
      formula: res.formula,
      diceRolled: res.diceRolled,
      chosenDie: res.chosenDie,
      mode: res.mode,
      bonus: 0,
      total: res.total,
      isNat20: res.isNat20,
      isNat1: res.isNat1,
      details:
        res.mode === "highest"
          ? `${attrKey} ${val}${
              quickDiceMod !== 0 ? ` (${formatSigned(quickDiceMod)}d20)` : ""
            } • Maior dado`
          : `${attrKey} ${val}${
              quickDiceMod !== 0 ? ` (${formatSigned(quickDiceMod)}d20)` : ""
            } • Menor dado (≤0)`,
    });
  };

  const handleRollSkill = (skill: AgentSkill) => {
    const attrKey = skill.atributoBase;
    const effAttrs = getAgentEffectiveAttributes(agent);
    const attrVal = effAttrs[attrKey];

    const load = calculateLoadAndCategories({
      forAttr: effAttrs.FOR,
      patente: agent.patente,
      inventory: agent.inventory,
      extraCapacityBonus: getTrailCarryBonus(agent),
    });
    const loadPen = skill.penalidadeCarga && load.isOverloaded ? -5 : 0;
    const kitPen = skill.requerKit && skill.hasKit === false ? -5 : 0;
    const passiveMod = STANDARD_SKILL_KEYS.has(skill.id)
      ? getPassiveSkillModifiers(agent, skill.id as SkillKey)
      : { flatBonus: 0, diceModifier: 0 };
    const allyMod = STANDARD_SKILL_KEYS.has(skill.id)
      ? getAllySkillModifiers(agent, skill.id as SkillKey)
      : { flatBonus: 0, diceModifier: 0, grantsTrained: false };

    const effTraining =
      skill.treinamento === 0 && allyMod.grantsTrained ? 5 : skill.treinamento;

    const bonus =
      effTraining +
      skill.bonusOutros +
      passiveMod.flatBonus +
      allyMod.flatBonus +
      loadPen +
      kitPen;

    const res = rollOrdemTest({
      attributeValue: attrVal,
      bonus,
      bonusDice: quickDiceMod + passiveMod.diceModifier + allyMod.diceModifier,
    });

    const displayName = formatSkillDisplayName(skill);

    pushRoll({
      actorName: agent.name,
      actorId: agent.id,
      label: `${displayName} (${attrKey})`,
      kind: "skill",
      formula: res.formula,
      diceRolled: res.diceRolled,
      chosenDie: res.chosenDie,
      mode: res.mode,
      bonus: res.bonus,
      total: res.total,
      isNat20: res.isNat20,
      isNat1: res.isNat1,
      details: `${displayName} • Treino +${effTraining}${
        skill.bonusOutros ? `, Outros ${formatSigned(skill.bonusOutros)}` : ""
      }${
        passiveMod.flatBonus
          ? `, Passivo ${formatSigned(passiveMod.flatBonus)}`
          : ""
      }${
        allyMod.flatBonus ? `, Aliado ${formatSigned(allyMod.flatBonus)}` : ""
      }${
        allyMod.grantsTrained && skill.treinamento === 0
          ? ", Treinado por Aliado"
          : ""
      }${
        passiveMod.diceModifier + allyMod.diceModifier !== 0
          ? `, ${formatSigned(
              passiveMod.diceModifier + allyMod.diceModifier
            )}d20 Bônus`
          : ""
      }${loadPen ? ", Sobrecarga -5" : ""}${kitPen ? ", Sem Kit -5" : ""}`,
    });
  };

  const mobileTabs: {
    id: MobileTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }[] = [
    { id: "resumo", label: "Resumo & Dados", icon: Dices },
    {
      id: "pericias",
      label: "Perícias",
      icon: SlidersHorizontal,
      count: skillList.length,
    },
    {
      id: "combate",
      label: "Combate",
      icon: Swords,
      count: agent.attacks.length,
    },
    {
      id: "habilidades",
      label: "Habilidades",
      icon: Sparkles,
      count: agent.abilities.length,
    },
    {
      id: "rituais",
      label: "Rituais",
      icon: Flame,
      count: agent.rituals.length,
    },
    {
      id: "inventario",
      label: "Inventário",
      icon: Backpack,
      count: agent.inventory.length,
    },
    {
      id: "aliados",
      label: "Aliados & Pets",
      icon: Users,
      count: agent.allies?.length ?? 0,
    },
    { id: "descricao", label: "Descrição", icon: FileText },
  ];

  const isMobileWorkspace =
    mobileTab !== "resumo" && mobileTab !== "pericias";

  const handleMobileTabClick = (tabId: MobileTabId) => {
    setMobileTab(tabId);
    if (tabId !== "resumo" && tabId !== "pericias") {
      setWorkspaceTab(tabId);
    }
  };

  return (
    <div className="mx-auto max-w-[1680px] px-3 py-4 sm:px-6 space-y-4">
      {/* A. Cabeçalho Fixo no Topo (Identidade + Faixa de Status) */}
      <SheetTacticalHeader agent={agent} onUpdate={handleUpdate} />

      {/* C. Navegação Mobile / Telas < 1280px (7 Abas Diretas) */}
      <div className="sticky top-14 z-30 -mx-3 px-3 py-2 bg-[#09090B]/95 border-y border-[#22222A] xl:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const active = mobileTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleMobileTabClick(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap rounded-sm border px-3 py-2 text-xs font-medium transition-colors",
                  active
                    ? "border-[#F4F4F5] bg-[#16161C] text-[#F4F4F5]"
                    : "border-[#22222A] bg-[#101014] text-[#8E8E9E] hover:text-[#D4D4D8]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="font-mono text-[10px] text-[#6E6E7E] tabular-nums">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* B. Corpo da Ficha no Desktop (>= 1280px):
          1. Esquerda (300px): Atributos + Dados Soltos + Resistências & Condições
          2. Centro (minmax(480px, 1fr)): Abas (Combate, Habilidades, Rituais, Inventário, Descrição)
          3. Direita (370px): Perícias completo e fixo na direita */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4 items-start",
          skillsCollapsed
            ? "xl:grid-cols-[300px_minmax(0,1fr)]"
            : "xl:grid-cols-[300px_minmax(480px,1fr)_370px]"
        )}
      >
        {/* 1. Coluna Esquerda (300px) */}
        <section className={cn(mobileTab !== "resumo" && "hidden xl:block")}>
          <LeftColumn
            agent={agent}
            onUpdate={handleUpdate}
            onRollAttribute={handleRollAttribute}
          />
        </section>

        {/* 2. Coluna Central (minmax(480px, 1fr)) */}
        <section
          className={cn(
            !isMobileWorkspace && "hidden xl:block",
            "min-w-0"
          )}
        >
          <RightTabsColumn
            agent={agent}
            onUpdate={handleUpdate}
            activeTab={workspaceTab}
            onTabChange={(next) => {
              setWorkspaceTab(next);
              if (isMobileWorkspace) setMobileTab(next);
            }}
            hideHeaderOnMobile
            isExpanded={skillsCollapsed}
            onToggleExpand={() => setSkillsCollapsed((v) => !v)}
          />
        </section>

        {/* 3. Coluna Direita (370px): Perícias */}
        <section
          className={cn(
            mobileTab !== "pericias" && "hidden",
            !skillsCollapsed && "xl:block"
          )}
        >
          <SkillsColumn
            agent={agent}
            onUpdate={handleUpdate}
            onRollSkill={handleRollSkill}
            onCollapse={() => setSkillsCollapsed(true)}
          />
        </section>
      </div>
    </div>
  );
}
