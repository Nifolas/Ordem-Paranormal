import type { ContentSource } from "@/types/ordem";

export interface SourceMeta {
  id: ContentSource;
  label: string;
  shortLabel: string;
  /** Prefixo obrigatório de IDs não oficiais (anti-colisão). */
  idPrefix?: string;
  official: boolean;
  author?: string;
}

export const SOURCE_META: SourceMeta[] = [
  { id: "livro_basico", label: "Livro Básico (v1.2)", shortLabel: "LB", official: true },
  {
    id: "sobrevivendo_ao_horror",
    label: "Sobrevivendo ao Horror",
    shortLabel: "SaH",
    official: true,
  },
  { id: "arquivos_secretos", label: "Arquivos Secretos", shortLabel: "AS", official: true },
  {
    id: "misterios_do_outro_lado",
    label: "Mistérios do Outro Lado",
    shortLabel: "MOL",
    idPrefix: "mol_",
    official: false,
    author: "Pedro Luiz Santos",
  },
  {
    id: "grimorio_do_cataclisma",
    label: "Grimório do Cataclisma v0.3",
    shortLabel: "GDC",
    idPrefix: "gdc_",
    official: false,
    author: "Gabrirul & Júpiter",
  },
  {
    id: "guia_confidencial_vol1",
    label: "Guia Confidencial Vol. I",
    shortLabel: "GC1",
    idPrefix: "gc1_",
    official: false,
    author: "Arquivos Confidenciais",
  },
  {
    id: "mascaras_teatrais",
    label: "Máscaras Teatrais",
    shortLabel: "MT",
    idPrefix: "mt_",
    official: false,
    author: "Arquivos Confidenciais",
  },
  {
    id: "rituais_superiores",
    label: "Rituais Superiores",
    shortLabel: "RS",
    idPrefix: "rs_",
    official: false,
    author: "Arquivos Confidenciais",
  },
  {
    id: "comunidade_avulsos",
    label: "Extras da Comunidade",
    shortLabel: "EXT",
    idPrefix: "ext_",
    official: false,
    author: "Dr. Frankenstein, Imbuir Sistema, Desacreditado",
  },
  { id: "homebrew", label: "Homebrew do Usuário", shortLabel: "HB", official: false },
];

export const OFFICIAL_SOURCES = SOURCE_META.filter((s) => s.official);
export const COMMUNITY_SOURCES = SOURCE_META.filter(
  (s) => !s.official && s.id !== "homebrew"
);

export const DEFAULT_ENABLED_SOURCES: ContentSource[] = [
  "livro_basico",
  "sobrevivendo_ao_horror",
  "arquivos_secretos",
  "homebrew",
];

export function getSourceMeta(id: ContentSource | undefined): SourceMeta {
  return (
    SOURCE_META.find((s) => s.id === id) ?? SOURCE_META[0]
  );
}

export function isCommunitySource(id: ContentSource | undefined): boolean {
  return COMMUNITY_SOURCES.some((s) => s.id === id);
}

/**
 * Itens oficiais e homebrew nunca são ocultados por este filtro (comportamento legado);
 * apenas conteúdo de suplementos da comunidade respeita os toggles individuais.
 */
export function filterByEnabledSources<T extends { source?: ContentSource }>(
  items: T[],
  enabled: ContentSource[] | undefined
): T[] {
  const set = new Set(enabled ?? DEFAULT_ENABLED_SOURCES);
  return items.filter(
    (it) => !isCommunitySource(it.source) || set.has(it.source as ContentSource)
  );
}
