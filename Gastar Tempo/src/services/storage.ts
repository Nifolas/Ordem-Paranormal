import type { Agent, AppBackupData } from "@/types/ordem";

export const STORAGE_KEY = "cris_ordem_paranormal_v1";

/**
 * Decoupled persistence repository abstraction.
 * Currently backed by localStorage; swap the implementation here to integrate
 * Supabase, PostgreSQL, Prisma, or REST APIs without touching UI or store logic.
 */
export interface StorageAdapter {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
}

export const localStorageRepository: StorageAdapter = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // ignore quota errors gracefully
    }
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export function triggerJsonDownload(filename: string, data: unknown) {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAgentToJson(agent: Agent) {
  const safeName = agent.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
  triggerJsonDownload(`agente-${safeName || agent.id}.json`, {
    kind: "cris-agent",
    version: 1,
    exportedAt: new Date().toISOString(),
    agent,
  });
}

export function exportFullBackupToJson(backup: AppBackupData) {
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerJsonDownload(`cris-backup-completo-${dateStr}.json`, backup);
}

export function parseImportedAgent(rawJson: string): Agent {
  const parsed = JSON.parse(rawJson);
  const candidate = parsed?.kind === "cris-agent" ? parsed.agent : parsed;
  if (
    !candidate ||
    typeof candidate !== "object" ||
    typeof candidate.name !== "string" ||
    !candidate.attributes ||
    !candidate.skills
  ) {
    throw new Error("Arquivo JSON inválido para ficha de agente.");
  }
  return candidate as Agent;
}

export function parseImportedBackup(rawJson: string): AppBackupData {
  const parsed = JSON.parse(rawJson);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray(parsed.agents) ||
    !Array.isArray(parsed.campaigns)
  ) {
    throw new Error("Arquivo JSON de backup completo inválido.");
  }
  return parsed as AppBackupData;
}
