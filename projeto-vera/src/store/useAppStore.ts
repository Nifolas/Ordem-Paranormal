"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Agent,
  AgentAbility,
  AgentRitual,
  AppBackupData,
  Campaign,
  HandoutDocument,
  HomebrewState,
  InitiativeEntry,
  InventoryItem,
  OriginDefinition,
  PowerDefinition,
  RollRecord,
  Threat,
  TrailDefinition,
} from "@/types/ordem";
import { BASE_THREATS } from "@/data/threats";
import { createSeedAgents } from "@/data/seed-agents";
import { migrateAgentSkillList } from "@/data/skills";
import { localStorageRepository, STORAGE_KEY } from "@/services/storage";
import { generateId } from "@/lib/utils";
import { getAgentEffectiveVitals } from "@/lib/ordem-rules";

interface AppStoreState {
  agents: Agent[];
  campaigns: Campaign[];
  threats: Threat[];
  homebrew: HomebrewState;
  handouts: HandoutDocument[];
  rollHistory: RollRecord[];
  activeToasts: RollRecord[];
  quickRollerOpen: boolean;
  quickDiceMod: number; // global +1d20 / -1d20 quick modifier

  // UI Controls
  setQuickRollerOpen: (open: boolean) => void;
  setQuickDiceMod: (mod: number) => void;
  dismissToast: (id: string) => void;

  // Rolls
  pushRoll: (roll: Omit<RollRecord, "id" | "timestamp">) => RollRecord;
  clearRollHistory: () => void;

  // Agents
  loadSampleAgents: () => Agent[];
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updater: (prev: Agent) => Agent) => void;
  duplicateAgent: (id: string) => Agent | null;
  deleteAgent: (id: string) => void;
  importAgent: (agent: Agent) => Agent;

  // Campaigns
  addCampaign: (
    campaign: Omit<Campaign, "id" | "createdAt" | "updatedAt">
  ) => Campaign;
  updateCampaign: (id: string, updater: (prev: Campaign) => Campaign) => void;
  deleteCampaign: (id: string) => void;
  sendThreatToCampaignInitiative: (
    campaignId: string,
    threat: Threat,
    initiativeValue: number
  ) => void;

  // Threats
  addThreat: (threat: Threat) => void;
  updateThreat: (id: string, updater: (prev: Threat) => Threat) => void;
  deleteThreat: (id: string) => void;
  toggleThreatEnigmaResolved: (id: string) => void;

  // Homebrew
  addHomebrewWeapon: (item: InventoryItem) => void;
  deleteHomebrewWeapon: (id: string) => void;
  addHomebrewItem: (item: InventoryItem) => void;
  deleteHomebrewItem: (id: string) => void;
  addHomebrewRitual: (ritual: AgentRitual) => void;
  deleteHomebrewRitual: (id: string) => void;
  addHomebrewAbility: (ability: AgentAbility) => void;
  deleteHomebrewAbility: (id: string) => void;
  addHomebrewOrigin: (origin: OriginDefinition) => void;
  deleteHomebrewOrigin: (id: string) => void;
  addHomebrewTrail: (trail: TrailDefinition) => void;
  deleteHomebrewTrail: (id: string) => void;
  addHomebrewPower: (power: PowerDefinition) => void;
  deleteHomebrewPower: (id: string) => void;
  importHomebrewPackage: (pkg: Partial<HomebrewState> & { threats?: Threat[] }) => void;

  // Handouts / Confidential Documents
  addHandout: (
    doc: Omit<HandoutDocument, "id" | "createdAt" | "updatedAt">
  ) => HandoutDocument;
  updateHandout: (
    id: string,
    updater: (prev: HandoutDocument) => HandoutDocument
  ) => void;
  deleteHandout: (id: string) => void;

  // Full Backup
  getBackupSnapshot: () => AppBackupData;
  restoreBackup: (backup: AppBackupData) => void;
}

const DEFAULT_HOMEBREW: HomebrewState = {
  weapons: [],
  items: [],
  rituals: [],
  abilities: [],
  origins: [],
  trails: [],
  powers: [],
  modifications: [],
  curses: [],
};

export const useAppStore = create<AppStoreState>()(
  persist(
    (set, get) => ({
      agents: [],
      campaigns: [],
      threats: BASE_THREATS,
      homebrew: DEFAULT_HOMEBREW,
      handouts: [],
      rollHistory: [],
      activeToasts: [],
      quickRollerOpen: false,
      quickDiceMod: 0,

      setQuickRollerOpen: (open) => set({ quickRollerOpen: open }),
      setQuickDiceMod: (mod) =>
        set({ quickDiceMod: Math.max(-5, Math.min(5, mod)) }),

      dismissToast: (id) =>
        set((state) => ({
          activeToasts: state.activeToasts.filter((t) => t.id !== id),
        })),

      pushRoll: (rollInput) => {
        const record: RollRecord = {
          ...rollInput,
          id: generateId("roll"),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          rollHistory: [record, ...state.rollHistory].slice(0, 120),
          activeToasts: [record, ...state.activeToasts].slice(0, 3),
        }));
        if (typeof window !== "undefined") {
          window.setTimeout(() => {
            get().dismissToast(record.id);
          }, 6500);
        }
        return record;
      },

      clearRollHistory: () => set({ rollHistory: [] }),

      loadSampleAgents: () => {
        const seeds = createSeedAgents();
        const existingIds = new Set(get().agents.map((a) => a.id));
        const toAdd = seeds.filter((s) => !existingIds.has(s.id));
        if (toAdd.length > 0) {
          set((state) => ({
            agents: [...toAdd, ...state.agents],
          }));
        }
        if (get().campaigns.length === 0) {
          const allAgents = get().agents;
          const now = new Date().toISOString();
          const demoCampaign: Campaign = {
            id: "seed-camp-biblioteca",
            name: "Caso 04: Sussurros na Biblioteca",
            description:
              "Desaparecimentos inexplicáveis na antiga Biblioteca Municipal apontam para uma membrana enfraquecida.",
            agentIds: allAgents.slice(0, 2).map((a) => a.id),
            enabledSources: ["livro_basico", "sobrevivendo_ao_horror", "homebrew"],
            optionalRules: [],
            membraneState: "Danificada",
            initiative: allAgents.slice(0, 2).map((a, idx) => {
              const vitals = getAgentEffectiveVitals(a);
              return {
                id: generateId("init"),
                type: "agent",
                refId: a.id,
                name: a.name,
                initiative: 18 - idx * 3,
                currentPv: a.status.pv.current,
                maxPv: vitals.maxPv,
              };
            }),
            activeTurnIndex: 0,
            round: 1,
            gmNotes:
              "• O bibliotecário Sr. Augusto esconde o diário no subsolo.\n• A membrana enfraquece próximo à Ala de Obras Raras.\n• Se os agentes tocarem o sino de cobre, 2 Esqueletos de Lodo emergem.",
            clues: [
              {
                id: "clue-1",
                title: "Página Rasgada em Latim",
                content: "Menciona a espiral que consome o tempo dos vivos.",
                revealed: true,
              },
              {
                id: "clue-2",
                title: "Registro da Câmera 03",
                content:
                  "Estática roxa exatamente às 03:13 antes do alarme disparar.",
                revealed: false,
              },
            ],
            createdAt: now,
            updatedAt: now,
          };
          set((state) => ({ campaigns: [demoCampaign, ...state.campaigns] }));
        }
        return get().agents;
      },

      addAgent: (agent) =>
        set((state) => ({
          agents: [migrateAgentSkillList(agent), ...state.agents],
        })),

      updateAgent: (id, updater) =>
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id
              ? { ...updater(agent), updatedAt: new Date().toISOString() }
              : agent
          ),
        })),

      duplicateAgent: (id) => {
        const original = get().agents.find((a) => a.id === id);
        if (!original) return null;
        const now = new Date().toISOString();
        const copy: Agent = {
          ...JSON.parse(JSON.stringify(original)),
          id: generateId("agent"),
          name: `${original.name} (Cópia)`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ agents: [copy, ...state.agents] }));
        return copy;
      },

      deleteAgent: (id) =>
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
          campaigns: state.campaigns.map((c) => ({
            ...c,
            agentIds: c.agentIds.filter((aid) => aid !== id),
          })),
        })),

      importAgent: (rawAgent) => {
        const now = new Date().toISOString();
        const exists = get().agents.some((a) => a.id === rawAgent.id);
        const imported: Agent = migrateAgentSkillList({
          ...rawAgent,
          id: exists ? generateId("agent") : rawAgent.id || generateId("agent"),
          updatedAt: now,
          createdAt: rawAgent.createdAt || now,
        });
        set((state) => ({ agents: [imported, ...state.agents] }));
        return imported;
      },

      addCampaign: (campaignInput) => {
        const now = new Date().toISOString();
        const created: Campaign = {
          enabledSources: ["livro_basico", "sobrevivendo_ao_horror", "homebrew"],
          optionalRules: [],
          membraneState: "Estável",
          ...campaignInput,
          id: generateId("camp"),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ campaigns: [created, ...state.campaigns] }));
        return created;
      },

      updateCampaign: (id, updater) =>
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id
              ? { ...updater(c), updatedAt: new Date().toISOString() }
              : c
          ),
        })),

      deleteCampaign: (id) =>
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
        })),

      sendThreatToCampaignInitiative: (campaignId, threat, initiativeValue) => {
        const entry: InitiativeEntry = {
          id: generateId("init"),
          type: "threat",
          refId: threat.id,
          name: threat.name,
          initiative: initiativeValue,
          currentPv: threat.pv,
          maxPv: threat.pv,
          defense: threat.defense,
          element: threat.element,
        };
        set((state) => ({
          campaigns: state.campaigns.map((c) => {
            if (c.id !== campaignId) return c;
            const nextList = [...c.initiative, entry].sort(
              (a, b) => b.initiative - a.initiative
            );
            return {
              ...c,
              initiative: nextList,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      addThreat: (threat) =>
        set((state) => ({ threats: [threat, ...state.threats] })),

      updateThreat: (id, updater) =>
        set((state) => ({
          threats: state.threats.map((t) => (t.id === id ? updater(t) : t)),
        })),

      deleteThreat: (id) =>
        set((state) => ({
          threats: state.threats.filter((t) => t.id !== id),
        })),

      toggleThreatEnigmaResolved: (id) =>
        set((state) => ({
          threats: state.threats.map((t) =>
            t.id === id ? { ...t, enigmaResolved: !t.enigmaResolved } : t
          ),
        })),

      addHomebrewWeapon: (item) =>
        set((state) => ({
          homebrew: {
            ...state.homebrew,
            weapons: [item, ...state.homebrew.weapons],
          },
        })),
      deleteHomebrewWeapon: (id) =>
        set((state) => ({
          homebrew: {
            ...state.homebrew,
            weapons: state.homebrew.weapons.filter((w) => w.id !== id),
          },
        })),

      addHomebrewItem: (item) =>
        set((state) => ({
          homebrew: {
            ...state.homebrew,
            items: [item, ...state.homebrew.items],
          },
        })),
      deleteHomebrewItem: (id) =>
        set((state) => ({
          homebrew: {
            ...state.homebrew,
            items: state.homebrew.items.filter((i) => i.id !== id),
          },
        })),

      addHomebrewRitual: (ritual) =>
        set((state) => ({
          homebrew: {
            ...state.homebrew,
            rituals: [ritual, ...state.homebrew.rituals],
          },
        })),
      deleteHomebrewRitual: (id) =>
        set((state) => ({
          homebrew: {
            ...state.homebrew,
            rituals: state.homebrew.rituals.filter((r) => r.id !== id),
          },
        })),

      addHomebrewAbility: (ability) =>
        set((state) => ({
          homebrew: {
            ...state.homebrew,
            abilities: [ability, ...state.homebrew.abilities],
          },
        })),
      deleteHomebrewAbility: (id) =>
        set((state) => ({
          homebrew: {
            ...state.homebrew,
            abilities: state.homebrew.abilities.filter((a) => a.id !== id),
          },
        })),

      addHomebrewOrigin: (origin) =>
        set((state) => ({
          homebrew: {
            ...state.homebrew,
            origins: [origin, ...state.homebrew.origins],
          },
        })),
      deleteHomebrewOrigin: (id) =>
        set((state) => ({
          homebrew: {
            ...state.homebrew,
            origins: state.homebrew.origins.filter((o) => o.id !== id),
          },
        })),

      addHomebrewTrail: (trail) =>
        set((state) => ({
          homebrew: {
            ...state.homebrew,
            trails: [trail, ...(state.homebrew.trails ?? [])],
          },
        })),
      deleteHomebrewTrail: (id) =>
        set((state) => ({
          homebrew: {
            ...state.homebrew,
            trails: (state.homebrew.trails ?? []).filter((t) => t.id !== id),
          },
        })),

      addHomebrewPower: (power) =>
        set((state) => ({
          homebrew: {
            ...state.homebrew,
            powers: [power, ...(state.homebrew.powers ?? [])],
          },
        })),
      deleteHomebrewPower: (id) =>
        set((state) => ({
          homebrew: {
            ...state.homebrew,
            powers: (state.homebrew.powers ?? []).filter((p) => p.id !== id),
          },
        })),

      importHomebrewPackage: (pkg) =>
        set((state) => {
          const mergeById = <T extends { id: string }>(
            existing: T[] = [],
            incoming: T[] = []
          ) => {
            const seen = new Set(existing.map((e) => e.id));
            return [...incoming.filter((i) => !seen.has(i.id)), ...existing];
          };
          return {
            homebrew: {
              ...state.homebrew,
              weapons: mergeById(state.homebrew.weapons, pkg.weapons),
              items: mergeById(state.homebrew.items, pkg.items),
              rituals: mergeById(state.homebrew.rituals, pkg.rituals),
              abilities: mergeById(state.homebrew.abilities, pkg.abilities),
              origins: mergeById(state.homebrew.origins, pkg.origins),
              trails: mergeById(state.homebrew.trails, pkg.trails),
              powers: mergeById(state.homebrew.powers, pkg.powers),
              modifications: mergeById(
                state.homebrew.modifications,
                pkg.modifications
              ),
              curses: mergeById(state.homebrew.curses, pkg.curses),
            },
            threats: pkg.threats
              ? mergeById(state.threats, pkg.threats)
              : state.threats,
          };
        }),

      addHandout: (docInput) => {
        const now = new Date().toISOString();
        const created: HandoutDocument = {
          ...docInput,
          id: generateId("doc"),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ handouts: [created, ...state.handouts] }));
        return created;
      },

      updateHandout: (id, updater) =>
        set((state) => ({
          handouts: state.handouts.map((h) =>
            h.id === id
              ? { ...updater(h), updatedAt: new Date().toISOString() }
              : h
          ),
        })),

      deleteHandout: (id) =>
        set((state) => ({
          handouts: state.handouts.filter((h) => h.id !== id),
        })),

      getBackupSnapshot: () => {
        const s = get();
        return {
          version: 3,
          exportedAt: new Date().toISOString(),
          agents: s.agents,
          campaigns: s.campaigns,
          threats: s.threats,
          homebrew: s.homebrew,
          handouts: s.handouts,
          rollHistory: s.rollHistory,
        };
      },

      restoreBackup: (backup) =>
        set({
          agents: (backup.agents ?? []).map(migrateAgentSkillList),
          campaigns: backup.campaigns ?? [],
          threats:
            backup.threats && backup.threats.length > 0
              ? backup.threats
              : BASE_THREATS,
          homebrew: {
            ...DEFAULT_HOMEBREW,
            ...(backup.homebrew ?? {}),
          },
          handouts: backup.handouts ?? [],
          rollHistory: backup.rollHistory ?? [],
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorageRepository),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<AppStoreState>) ?? {};
        const persistedThreats = persisted.threats ?? [];
        const existingIds = new Set(persistedThreats.map((t) => t.id));
        const mergedThreats = [
          ...persistedThreats,
          ...BASE_THREATS.filter((bt) => !existingIds.has(bt.id)),
        ];
        return {
          ...currentState,
          ...persisted,
          agents: (persisted.agents ?? []).map(migrateAgentSkillList),
          threats: mergedThreats.length > 0 ? mergedThreats : BASE_THREATS,
          homebrew: {
            ...DEFAULT_HOMEBREW,
            ...(persisted.homebrew ?? {}),
          },
          handouts: persisted.handouts ?? [],
        };
      },
      partialize: (state) => ({
        agents: state.agents,
        campaigns: state.campaigns,
        threats: state.threats,
        homebrew: state.homebrew,
        handouts: state.handouts,
        rollHistory: state.rollHistory,
      }),
    }
  )
);
