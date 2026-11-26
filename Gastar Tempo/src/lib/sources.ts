import type { ContentSource } from "@/types/ordem";
import {
  COMMUNITY_SOURCES,
  DEFAULT_ENABLED_SOURCES,
  OFFICIAL_SOURCES,
  SOURCE_META,
  filterByEnabledSources,
  getSourceMeta,
  isCommunitySource,
  type SourceMeta,
} from "@/data/sources";

export {
  COMMUNITY_SOURCES,
  DEFAULT_ENABLED_SOURCES,
  OFFICIAL_SOURCES,
  SOURCE_META,
  filterByEnabledSources,
  getSourceMeta,
  isCommunitySource,
  type SourceMeta,
};

/**
 * Rótulos curtos/padrão para exibição em filtros, badges e catálogos.
 * Contém 100% das chaves do tipo ContentSource.
 */
export const SOURCE_LABELS: Record<ContentSource, string> = {
  livro_basico: "Livro Básico",
  sobrevivendo_ao_horror: "SaH",
  arquivos_secretos: "Arq. Secretos",
  misterios_do_outro_lado: "Mistérios do Outro Lado",
  grimorio_do_cataclisma: "Cataclisma",
  guia_confidencial_vol1: "Guia Conf. I",
  mascaras_teatrais: "Máscaras Teatrais",
  rituais_superiores: "Rituais Superiores",
  comunidade_avulsos: "Comunidade",
  homebrew: "Homebrew",
};

/**
 * Rótulos em caixa alta para cabeçalhos editoriais e tags técnicas (ex: AbilitiesTab).
 * Contém 100% das chaves do tipo ContentSource.
 */
export const SOURCE_UPPER_LABELS: Record<ContentSource, string> = {
  livro_basico: "LIVRO BÁSICO",
  sobrevivendo_ao_horror: "SOBREVIVENDO AO HORROR",
  arquivos_secretos: "ARQUIVOS SECRETOS",
  misterios_do_outro_lado: "MISTÉRIOS DO OUTRO LADO",
  grimorio_do_cataclisma: "GRIMÓRIO DO CATACLISMA",
  guia_confidencial_vol1: "GUIA CONFIDENCIAL VOL. I",
  mascaras_teatrais: "MÁSCARAS TEATRAIS",
  rituais_superiores: "RITUAIS SUPERIORES",
  comunidade_avulsos: "EXTRAS DA COMUNIDADE",
  homebrew: "HOMEBREW",
};

/**
 * Siglas compactas em JetBrains Mono (2–3 letras) para badges discretos.
 */
export const SOURCE_SHORT_CODES: Record<ContentSource, string> = {
  livro_basico: "LB",
  sobrevivendo_ao_horror: "SaH",
  arquivos_secretos: "AS",
  misterios_do_outro_lado: "MOL",
  grimorio_do_cataclisma: "GDC",
  guia_confidencial_vol1: "GC1",
  mascaras_teatrais: "MT",
  rituais_superiores: "RS",
  comunidade_avulsos: "EXT",
  homebrew: "HB",
};

/**
 * Classes Tailwind padronizadas para badges de cada fonte.
 */
export const SOURCE_BADGE_STYLES: Record<ContentSource, string> = {
  livro_basico: "border-[#22222A] bg-[#141419] text-[#A1A1AA]",
  sobrevivendo_ao_horror: "border-[#22222A] bg-[#141419] text-[#A1A1AA]",
  arquivos_secretos: "border-[#22222A] bg-[#141419] text-[#A1A1AA]",
  misterios_do_outro_lado: "border-purple-500/35 bg-purple-500/10 text-purple-300",
  grimorio_do_cataclisma: "border-amber-500/35 bg-amber-500/10 text-amber-300",
  guia_confidencial_vol1: "border-sky-500/35 bg-sky-500/10 text-sky-300",
  mascaras_teatrais: "border-red-500/35 bg-red-500/10 text-red-300",
  rituais_superiores: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
  comunidade_avulsos: "border-[#32323E] bg-[#16161C] text-[#D4D4D8]",
  homebrew: "border-[#32323E] bg-[#16161C] text-[#D4D4D8]",
};
