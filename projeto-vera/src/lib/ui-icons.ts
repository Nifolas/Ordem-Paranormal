import type { LucideIcon } from "lucide-react";
import {
  Backpack,
  Bomb,
  Brain,
  Briefcase,
  CircleDot,
  Compass,
  Cross,
  Crosshair,
  Droplet,
  Eye,
  Flame,
  Footprints,
  Ghost,
  Heart,
  Hourglass,
  Package,
  PawPrint,
  ScrollText,
  Shield,
  ShieldAlert,
  Skull,
  Sparkles,
  Sword,
  Swords,
  UserCheck,
  Wand2,
  Weight,
  Wind,
  Wrench,
  Zap,
} from "lucide-react";
import type {
  AgentClassId,
  ItemCategoryType,
  ParanormalElement,
} from "@/types/ordem";

/**
 * Mapa padronizado de ícones e cores semânticas para recursos vitais e de combate.
 */
export const RESOURCE_ICONS: Record<
  | "pv"
  | "san"
  | "pe"
  | "pd"
  | "defesa"
  | "esquiva"
  | "bloqueio"
  | "deslocamento"
  | "carga",
  {
    icon: LucideIcon;
    label: string;
    colorClass: string;
    bgClass: string;
    borderClass: string;
  }
> = {
  pv: {
    icon: Heart,
    label: "Pontos de Vida",
    colorClass: "text-rose-400",
    bgClass: "bg-rose-500/10",
    borderClass: "border-rose-500/30",
  },
  san: {
    icon: Brain,
    label: "Sanidade",
    colorClass: "text-sky-400",
    bgClass: "bg-sky-500/10",
    borderClass: "border-sky-500/30",
  },
  pe: {
    icon: Zap,
    label: "Pontos de Esforço",
    colorClass: "text-amber-400",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
  },
  pd: {
    icon: Sparkles,
    label: "Pontos de Determinação",
    colorClass: "text-violet-400",
    bgClass: "bg-violet-500/10",
    borderClass: "border-violet-500/30",
  },
  defesa: {
    icon: Shield,
    label: "Defesa",
    colorClass: "text-zinc-200",
    bgClass: "bg-white/5",
    borderClass: "border-white/15",
  },
  esquiva: {
    icon: Wind,
    label: "Esquiva",
    colorClass: "text-emerald-300",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/30",
  },
  bloqueio: {
    icon: ShieldAlert,
    label: "Bloqueio (RD)",
    colorClass: "text-amber-300",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
  },
  deslocamento: {
    icon: Footprints,
    label: "Deslocamento",
    colorClass: "text-zinc-300",
    bgClass: "bg-white/5",
    borderClass: "border-white/15",
  },
  carga: {
    icon: Weight,
    label: "Capacidade de Carga",
    colorClass: "text-zinc-300",
    bgClass: "bg-white/5",
    borderClass: "border-white/15",
  },
};

/**
 * Mapa visual dos Elementos de Ordem Paranormal (ícone + cores de badge/borda/ícone).
 */
export const ELEMENT_VISUALS: Record<
  ParanormalElement,
  {
    icon: LucideIcon;
    secondaryIcon: LucideIcon;
    label: string;
    tagline: string;
    iconColor: string;
    iconBoxCls: string;
    badgeCls: string;
    cardBorderCls: string;
  }
> = {
  Sangue: {
    icon: Droplet,
    secondaryIcon: Flame,
    label: "Sangue",
    tagline: "Emoção extrema, dor, obsessão e brutalidade física.",
    iconColor: "text-red-400",
    iconBoxCls: "border-red-500/35 bg-red-500/10 text-red-400",
    badgeCls: "border-red-500/40 bg-red-500/10 text-red-300",
    cardBorderCls: "border-l-[3px] border-l-red-500",
  },
  Morte: {
    icon: Hourglass,
    secondaryIcon: Skull,
    label: "Morte",
    tagline: "Espiral do tempo, entropia, Lodo negro e decaimento.",
    iconColor: "text-zinc-300",
    iconBoxCls: "border-zinc-400/35 bg-zinc-400/10 text-zinc-200",
    badgeCls: "border-zinc-400/40 bg-zinc-400/10 text-zinc-200",
    cardBorderCls: "border-l-[3px] border-l-zinc-400",
  },
  Conhecimento: {
    icon: Eye,
    secondaryIcon: ScrollText,
    label: "Conhecimento",
    tagline: "Razão fria, sigilos do Outro Lado, mente e segredos.",
    iconColor: "text-amber-400",
    iconBoxCls: "border-amber-500/35 bg-amber-500/10 text-amber-300",
    badgeCls: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    cardBorderCls: "border-l-[3px] border-l-amber-400",
  },
  Energia: {
    icon: Zap,
    secondaryIcon: Sparkles,
    label: "Energia",
    tagline: "Caos imprevisível, transformação, sorte, plasma e tecnologia.",
    iconColor: "text-purple-400",
    iconBoxCls: "border-purple-500/35 bg-purple-500/10 text-purple-300",
    badgeCls: "border-purple-500/40 bg-purple-500/10 text-purple-200",
    cardBorderCls: "border-l-[3px] border-l-purple-500",
  },
  Medo: {
    icon: Ghost,
    secondaryIcon: CircleDot,
    label: "Medo",
    tagline: "O impossível incompreensível que conecta a Realidade ao Outro Lado.",
    iconColor: "text-slate-100",
    iconBoxCls: "border-slate-300/40 bg-slate-200/10 text-slate-100",
    badgeCls: "border-slate-300/45 bg-slate-200/10 text-slate-100",
    cardBorderCls: "border-l-[3px] border-l-slate-200",
  },
  Variável: {
    icon: Sparkles,
    secondaryIcon: Wand2,
    label: "Variável",
    tagline: "Adapta-se ao elemento escolhido pelo conjurador ou item.",
    iconColor: "text-cyan-300",
    iconBoxCls: "border-cyan-500/35 bg-cyan-500/10 text-cyan-300",
    badgeCls: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
    cardBorderCls: "border-l-[3px] border-l-cyan-400",
  },
  Realidade: {
    icon: Shield,
    secondaryIcon: UserCheck,
    label: "Realidade",
    tagline: "Humanos, organizações, animais e perigos mundanos.",
    iconColor: "text-emerald-300",
    iconBoxCls: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
    badgeCls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    cardBorderCls: "border-l-[3px] border-l-emerald-500",
  },
};

/**
 * Mapa visual das 9 Categorias de Equipamentos + tipos de ataque e ação.
 */
export const ITEM_CATEGORY_VISUALS: Record<
  ItemCategoryType,
  {
    icon: LucideIcon;
    label: string;
    shortDesc: string;
    iconBoxCls: string;
  }
> = {
  arma: {
    icon: Swords,
    label: "Armas",
    shortDesc: "Armas corpo a corpo, de disparo e de fogo.",
    iconBoxCls: "border-rose-500/35 bg-rose-500/10 text-rose-300",
  },
  protecao: {
    icon: Shield,
    label: "Proteções",
    shortDesc: "Coletes, escudos e armaduras táticas.",
    iconBoxCls: "border-sky-500/35 bg-sky-500/10 text-sky-300",
  },
  municao: {
    icon: Crosshair,
    label: "Munições",
    shortDesc: "Pacotes de balas, cartuchos, flechas e combustível.",
    iconBoxCls: "border-amber-500/35 bg-amber-500/10 text-amber-300",
  },
  acessorio: {
    icon: Briefcase,
    label: "Acessórios & Kits",
    shortDesc: "Utensílios, vestimentas e kits de perícia.",
    iconBoxCls: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
  },
  explosivo: {
    icon: Bomb,
    label: "Explosivos",
    shortDesc: "Granadas táticas, minas e cargas de demolição.",
    iconBoxCls: "border-orange-500/35 bg-orange-500/10 text-orange-300",
  },
  operacional: {
    icon: Backpack,
    label: "Itens Operacionais",
    shortDesc: "Equipamentos de investigação, sobrevivência e campo.",
    iconBoxCls: "border-zinc-400/35 bg-zinc-400/10 text-zinc-200",
  },
  medicamento: {
    icon: Cross,
    label: "Medicamentos",
    shortDesc: "Cicatrizantes, fármacos e compostos de tratamento.",
    iconBoxCls: "border-teal-500/35 bg-teal-500/10 text-teal-300",
  },
  paranormal: {
    icon: Wand2,
    label: "Itens Paranormais",
    shortDesc: "Catalisadores, componentes ritualísticos e medidores.",
    iconBoxCls: "border-purple-500/35 bg-purple-500/10 text-purple-300",
  },
  amaldicoado: {
    icon: Flame,
    label: "Itens Amaldiçoados",
    shortDesc: "Artefatos especiais imbuídos com o Outro Lado.",
    iconBoxCls: "border-red-500/40 bg-red-500/10 text-red-300",
  },
};

/**
 * Retorna o ícone ideal para uma arma (Corpo a Corpo vs Fogo/Disparo) ou categoria de item.
 */
export function getItemVisualIcon(item: {
  type?: string;
  weaponSubtype?: string;
  skill?: string;
  element?: ParanormalElement;
}): LucideIcon {
  if (
    item.weaponSubtype === "Fogo" ||
    item.weaponSubtype === "Disparo" ||
    item.skill === "pontaria"
  ) {
    return Crosshair;
  }
  if (item.type === "arma" || item.type === "Arma") {
    return Sword;
  }
  if (item.type && item.type in ITEM_CATEGORY_VISUALS) {
    return ITEM_CATEGORY_VISUALS[item.type as ItemCategoryType].icon;
  }
  return Package;
}

/**
 * Mapa visual das Classes de Agente.
 */
export const CLASS_VISUALS: Record<
  AgentClassId,
  {
    icon: LucideIcon;
    roleTag: string;
    iconBoxCls: string;
  }
> = {
  combatente: {
    icon: Swords,
    roleTag: "Linha de Frente & Combate",
    iconBoxCls: "border-rose-500/35 bg-rose-500/10 text-rose-300",
  },
  especialista: {
    icon: Compass,
    roleTag: "Perícias, Investigação & Tática",
    iconBoxCls: "border-sky-500/35 bg-sky-500/10 text-sky-300",
  },
  ocultista: {
    icon: Wand2,
    roleTag: "Rituais & Conhecimento do Outro Lado",
    iconBoxCls: "border-purple-500/35 bg-purple-500/10 text-purple-300",
  },
  sobrevivente: {
    icon: Footprints,
    roleTag: "Pessoa Comum (NEX 0% · Estágios 1 a 5)",
    iconBoxCls: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
  },
  devoto: {
    icon: Flame,
    roleTag: "Fé Paranormal & Bênçãos (Comunidade)",
    iconBoxCls: "border-amber-500/35 bg-amber-500/10 text-amber-300",
  },
  predador: {
    icon: Crosshair,
    roleTag: "Caçador de Criaturas & Armadilhas (Comunidade)",
    iconBoxCls: "border-orange-500/35 bg-orange-500/10 text-orange-300",
  },
};

export const EXTRA_UI_ICONS = {
  modificacao: Wrench,
  aliado: UserCheck,
  pet: PawPrint,
};
