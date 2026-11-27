import {
  ENTREGA1_CLASS_POWERS,
  ENTREGA1_GENERAL_POWERS,
  ENTREGA1_PARANORMAL_POWERS,
  ENTREGA1_RITUALS,
  ENTREGA1_TRAILS,
} from "./entrega1Loader";

/**
 * BLOCO A — Cards extras da Comunidade (source: comunidade_avulsos)
 * Carregado automaticamente a partir de entrega_1_extras_mascaras_superiores_guia1.json.
 * IDs sempre com prefixo `ext_` (regra anti-colisão).
 */
export const EXTRAS_TRAILS = ENTREGA1_TRAILS.filter(
  (t) => t.source === "comunidade_avulsos"
);

export const EXTRAS_CLASS_POWERS = ENTREGA1_CLASS_POWERS.filter(
  (p) => p.source === "comunidade_avulsos"
);

export const EXTRAS_PARANORMAL_POWERS = ENTREGA1_PARANORMAL_POWERS.filter(
  (p) => p.source === "comunidade_avulsos"
);

export const EXTRAS_GENERAL_POWERS = ENTREGA1_GENERAL_POWERS.filter(
  (p) => p.source === "comunidade_avulsos"
);

export const EXTRAS_RITUALS = ENTREGA1_RITUALS.filter(
  (r) => r.source === "comunidade_avulsos"
);
