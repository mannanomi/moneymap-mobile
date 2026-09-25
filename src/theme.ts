import { useColorScheme, ViewStyle } from "react-native";
import type { AccentId, ThemeMode } from "./types";
import { useStore } from "./store";

export interface Palette {
  dark: boolean;
  accent: string;
  accentDeep: string;
  /** page background */
  surface2: string;
  /** cards */
  surface1: string;
  /** inset areas, pills, tracks */
  surface3: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  gridline: string;
  border: string;
  income: string;
  expense: string;
  good: string;
  critical: string;
  warn: string;
  tiles: string[];
  cardShadow: ViewStyle;
}

const TILES = ["#3B82F6", "#F97316", "#10B981", "#F59E0B", "#EC4899", "#14B8A6", "#8B5CF6", "#EF4444"];

const LIGHT: Omit<Palette, "accent" | "accentDeep"> = {
  dark: false,
  surface2: "#F2F4F8", surface1: "#FFFFFF", surface3: "#E9EDF4",
  text: "#0F172A", textSecondary: "#475569", textMuted: "#8794A8",
  gridline: "#E3E8F0", border: "rgba(15,23,42,0.07)",
  income: "#2563EB", expense: "#EA580C",
  good: "#0E9F5B", critical: "#DC3545", warn: "#D97706",
  tiles: TILES,
  cardShadow: { shadowColor: "#0F172A", shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
};
const DARK: Omit<Palette, "accent" | "accentDeep"> = {
  dark: true,
  surface2: "#0A0E16", surface1: "#121824", surface3: "#1B2433",
  text: "#F3F6FB", textSecondary: "#A8B3C6", textMuted: "#6E7A91",
  gridline: "#212B3C", border: "rgba(255,255,255,0.07)",
  income: "#5B9CF5", expense: "#F58A4B",
  good: "#3DD68C", critical: "#F2666F", warn: "#F5B342",
  tiles: TILES,
  cardShadow: {},
};

export const ACCENTS: { id: AccentId; label: string; light: string; dark: string }[] = [
  { id: "blue", label: "Blue", light: "#2563EB", dark: "#4F8DF7" },
  { id: "teal", label: "Teal", light: "#0F766E", dark: "#2BB5A6" },
  { id: "purple", label: "Purple", light: "#6D4AD0", dark: "#9070F0" },
  { id: "green", label: "Green", light: "#15803D", dark: "#34B562" },
  { id: "orange", label: "Orange", light: "#C2410C", dark: "#F0782F" },
  { id: "pink", label: "Pink", light: "#BE185D", dark: "#E9589A" },
];

export const THEMES: { id: ThemeMode; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

/** hex (#rrggbb) + alpha 0..1 -> #rrggbbaa */
export function tint(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, "0");
  return hex.length === 7 ? hex + a : hex;
}

/** darken (factor<1) or lighten (>1) a #rrggbb colour */
export function shade(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * factor)));
  const r = ch((n >> 16) & 255), g = ch((n >> 8) & 255), b = ch(n & 255);
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export const RADIUS = { card: 20, control: 14, pill: 999 };

export function useTheme(): Palette {
  const { data } = useStore();
  const scheme = useColorScheme();
  const mode: ThemeMode = (["system", "light", "dark"] as const).includes(data.settings.theme as ThemeMode)
    ? (data.settings.theme as ThemeMode)
    : "system";
  const dark = mode === "dark" || (mode === "system" && scheme === "dark");
  const accentDef = ACCENTS.find((a) => a.id === data.settings.accent) || ACCENTS[0];
  const base = dark ? DARK : LIGHT;
  const accent = dark ? accentDef.dark : accentDef.light;
  return { ...base, accent, accentDeep: shade(accent, 0.62) };
}
