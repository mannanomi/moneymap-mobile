import React, { useEffect, useRef, useState } from "react";
import {
  Animated, KeyboardAvoidingView, KeyboardTypeOptions, Modal, Platform, Pressable, ScrollView, StyleProp, Text,
  TextInput, TextStyle, View, ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RADIUS, tint, useTheme } from "../theme";
import { useStore } from "../store";
import { fmtDate, parseISO, toISODate } from "../lib/logic";

export function tap() {
  if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
}

// ---------- icons ----------

const ICONS: Record<string, string> = {
  home: "home-outline", cart: "cart-outline", bag: "shopping-outline", cup: "coffee-outline",
  car: "car-outline", zap: "flash-outline", star: "star-outline", medical: "medical-bag",
  users: "account-group-outline", plane: "airplane", card: "credit-card-outline", phone: "cellphone",
  user: "account-outline", heart: "heart-outline", cap: "school-outline", trend: "trending-up",
  receipt: "receipt-text-outline", gift: "gift-outline", briefcase: "briefcase-outline", tag: "tag-outline",
  cash: "cash", piggy: "piggy-bank-outline", bank: "bank-outline", undo: "undo-variant", alert: "alert-outline",
  lock: "lock-outline", bars: "chart-bar", coin: "bitcoin", wallet: "wallet-outline", target: "bullseye-arrow",
  search: "magnify", calendar: "calendar-month-outline", gem: "diamond-stone", more: "dots-horizontal",
  chevron: "chevron-right", back: "chevron-left", plus: "plus", x: "close", pencil: "pencil-outline",
  trash: "trash-can-outline", trendDown: "trending-down", settings: "cog-outline", palette: "palette-outline",
  folder: "folder-outline", download: "download-outline", upload: "upload-outline", check: "check",
  list: "format-list-bulleted", pie: "chart-donut", categories: "shape-outline", history: "history",
  arrowUp: "arrow-top-right", arrowDown: "arrow-bottom-left", chevronDown: "chevron-down", chevronLeft: "chevron-left",
  swap: "swap-vertical",
  // filled variants for active tab states
  homeF: "home", receiptF: "receipt-text", targetF: "bullseye-arrow", barsF: "chart-bar", moreF: "dots-horizontal-circle",
};

export function Icon({ name, size = 20, color, style }: { name: string; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return (
    <MaterialCommunityIcons name={(ICONS[name] || ICONS.tag) as any} size={size} color={color || t.text} style={style} />
  );
}

// ---------- text ----------

export const FONT = {
  regular: "Manrope_500Medium",
  semi: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  heavy: "Manrope_800ExtraBold",
};

function familyFor(weight: TextStyle["fontWeight"] | undefined, figure?: boolean): string {
  if (figure) return FONT.heavy;
  switch (String(weight)) {
    case "800": case "900": return FONT.heavy;
    case "700": case "bold": return FONT.bold;
    case "600": return FONT.semi;
    default: return FONT.regular;
  }
}

export function T({
  children, style, size = 14, weight = "400", color, numberOfLines, muted, secondary, figure, align,
}: {
  children: React.ReactNode; style?: StyleProp<TextStyle>; size?: number; weight?: TextStyle["fontWeight"];
  color?: string; numberOfLines?: number; muted?: boolean; secondary?: boolean; figure?: boolean; align?: TextStyle["textAlign"];
}) {
  const t = useTheme();
  const c = color || (muted ? t.textMuted : secondary ? t.textSecondary : t.text);
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ color: c, fontSize: size, fontFamily: familyFor(weight, figure), textAlign: align }, figure && { fontVariant: ["tabular-nums"] }, style]}
    >
      {children}
    </Text>
  );
}

// ---------- layout ----------

export function Panel({ children, style, onPress, flat }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; flat?: boolean }) {
  const t = useTheme();
  const s: ViewStyle = {
    backgroundColor: t.surface1, borderColor: t.border, borderWidth: 1, borderRadius: RADIUS.card, padding: 16,
    ...(flat ? {} : t.cardShadow),
  };
  if (onPress) {
    return (
      <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => [s, style, pressed && { opacity: 0.9, transform: [{ scale: 0.988 }] }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[s, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
      <T size={16} weight="800" style={{ flexShrink: 1 }}>{children}</T>
      {right}
    </View>
  );
}

export function PageHeader({ icon, title, sub, right }: { icon: string; title: string; sub?: string; right?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 2 }}>
      <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: tint(t.accent, 0.14), alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={24} color={t.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <T size={24} weight="800" numberOfLines={1}>{title}</T>
        {sub ? <T size={13} secondary numberOfLines={1}>{sub}</T> : null}
      </View>
      {right}
    </View>
  );
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: 1, backgroundColor: t.border }} />;
}

export function Btn({ label, onPress, kind = "default", small, icon, disabled, style }: {
  label: string; onPress: () => void; kind?: "default" | "primary" | "danger" | "ghost" | "expense" | "income";
  small?: boolean; icon?: string; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  let bg = t.surface3, fg = t.text;
  if (kind === "primary") { bg = t.accent; fg = "#fff"; }
  if (kind === "danger") { bg = tint(t.critical, 0.12); fg = t.critical; }
  if (kind === "ghost") { bg = "transparent"; fg = t.accent; }
  if (kind === "expense") { bg = tint(t.expense, 0.14); fg = t.expense; }
  if (kind === "income") { bg = tint(t.income, 0.14); fg = t.income; }
  return (
    <Pressable
      disabled={disabled}
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [{
        backgroundColor: bg, borderRadius: small ? 12 : RADIUS.control,
        paddingHorizontal: kind === "ghost" ? (small ? 2 : 8) : small ? 14 : 14, height: small ? 36 : 48, flexDirection: "row",
        alignItems: "center", justifyContent: "center", gap: 7,
        opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.97 : 1 }],
      }, style]}
    >
      {icon ? <Icon name={icon} size={small ? 16 : 19} color={fg} /> : null}
      <T size={small ? 13 : 14.5} weight="700" color={fg} numberOfLines={1}>{label}</T>
    </Pressable>
  );
}

export function Segmented<V extends string>({ options, value, onChange }: { options: { value: V; label: string }[]; value: V; onChange: (v: V) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", backgroundColor: t.surface3, borderRadius: RADIUS.control, padding: 4, gap: 4 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => { tap(); onChange(o.value); }}
            style={[
              { flex: 1, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
              active && { backgroundColor: t.dark ? t.surface2 : t.surface1, ...t.cardShadow },
            ]}
          >
            <T size={13.5} weight={active ? "800" : "600"} color={active ? t.text : t.textSecondary}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function StatTile({ label, value, tone, icon }: { label: string; value: string; tone?: "good" | "critical" | null; icon?: string }) {
  const t = useTheme();
  const color = tone === "good" ? t.good : tone === "critical" ? t.critical : t.text;
  return (
    <View style={{ flexGrow: 1, flexBasis: "45%", backgroundColor: t.surface1, borderColor: t.border, borderWidth: 1, borderRadius: 18, padding: 14, gap: 4, ...t.cardShadow }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {icon ? <Icon name={icon} size={14} color={t.textMuted} /> : null}
        <T size={12} weight="600" muted>{label}</T>
      </View>
      <T size={19} figure color={color} numberOfLines={1}>{value}</T>
    </View>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>{children}</View>;
}

export function EmptyState({ msg, icon = "tag" }: { msg: string; icon?: string }) {
  const t = useTheme();
  return (
    <View style={{ paddingVertical: 26, alignItems: "center", gap: 10 }}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: t.surface3, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={24} color={t.textMuted} />
      </View>
      <T size={13.5} muted align="center" style={{ maxWidth: 260, lineHeight: 19 }}>{msg}</T>
    </View>
  );
}

/** Soft tinted badge: pale background in the colour, coloured glyph. */
export function IconBadge({ name, color, size = 40, solid }: { name: string; color: string; size?: number; solid?: boolean }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.34, backgroundColor: solid ? color : tint(color, 0.16), alignItems: "center", justifyContent: "center" }}>
      <Icon name={name} size={size * 0.5} color={solid ? "#fff" : color} />
    </View>
  );
}

export function Row({ children, style, gap = 10 }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>{children}</View>;
}

export function ProgressBar({ pct, color, height = 8 }: { pct: number; color: string; height?: number }) {
  const t = useTheme();
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: t.surface3, overflow: "hidden" }}>
      <View style={{ width: `${Math.max(0, Math.min(pct, 1)) * 100}%`, height: "100%", backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}

// ---------- toast ----------

export function ToastHost() {
  const { toast } = useStore();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState<typeof toast>(null);

  useEffect(() => {
    if (!toast) return;
    setShown(toast);
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [toast, opacity]);

  if (!shown) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute", left: 20, right: 20, bottom: insets.bottom + 92, opacity,
        backgroundColor: shown.error ? t.critical : t.dark ? "#F3F6FB" : "#0F172A", borderRadius: 16,
        paddingVertical: 13, paddingHorizontal: 18, alignItems: "center",
        shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6,
      }}
    >
      <Text style={{ color: shown.error ? "#fff" : t.dark ? "#0F172A" : "#fff", fontFamily: FONT.semi, fontSize: 14 }}>{shown.msg}</Text>
    </Animated.View>
  );
}

// ---------- form sheet ----------

export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(5,8,14,0.6)" }} onPress={onClose} />
        <View
          style={{
            backgroundColor: t.surface1, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "90%",
            paddingBottom: insets.bottom + 10, borderWidth: 1, borderBottomWidth: 0, borderColor: t.border,
          }}
        >
          <View style={{ alignItems: "center", paddingTop: 10 }}>
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: t.surface3 }} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 }}>
            <T size={20} weight="800" style={{ flex: 1 }}>{title}</T>
            <Pressable onPress={onClose} hitSlop={12} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.surface3, alignItems: "center", justifyContent: "center" }}>
              <Icon name="x" size={18} color={t.textSecondary} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 10, gap: 16 }}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function FormActions({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>{children}</View>;
}

// ---------- fields ----------

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 7 }}>
      {label ? <T size={12.5} weight="700" secondary>{label}</T> : null}
      {children}
      {hint ? <T size={12} muted>{hint}</T> : null}
    </View>
  );
}

export function TextField({
  label, value, onChangeText, placeholder, keyboardType, hint, autoCapitalize, maxLength, multiline,
}: {
  label: string; value: string; onChangeText: (s: string) => void; placeholder?: string; hint?: string;
  keyboardType?: KeyboardTypeOptions; autoCapitalize?: "none" | "sentences" | "words"; maxLength?: number; multiline?: boolean;
}) {
  const t = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <Field label={label} hint={hint}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={placeholder}
        placeholderTextColor={t.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
        maxLength={maxLength}
        multiline={multiline}
        style={{
          backgroundColor: t.surface2, color: t.text, borderColor: focus ? t.accent : t.border, borderWidth: 1.5,
          borderRadius: RADIUS.control, paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 14 : 11,
          fontSize: 16, fontFamily: FONT.semi,
        }}
      />
    </Field>
  );
}

export function SelectField<V extends string>({
  label, value, options, onChange, placeholder,
}: {
  label: string; value: V | ""; options: { value: V; label: string; icon?: string; color?: string }[]; onChange: (v: V) => void; placeholder?: string;
}) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <Field label={label}>
      <Pressable
        onPress={() => { tap(); setOpen(true); }}
        style={{
          backgroundColor: t.surface2, borderColor: t.border, borderWidth: 1.5, borderRadius: RADIUS.control,
          paddingHorizontal: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 10,
        }}
      >
        {current?.icon ? <IconBadge name={current.icon} color={current.color || t.accent} size={26} /> : null}
        <T size={16} weight="600" color={current ? t.text : t.textMuted} numberOfLines={1} style={{ flex: 1 }}>{current ? current.label : placeholder || "Select"}</T>
        <Icon name="chevronDown" size={20} color={t.textMuted} />
      </Pressable>
      <Sheet visible={open} title={label} onClose={() => setOpen(false)}>
        <View style={{ gap: 4 }}>
          {options.map((o) => (
            <Pressable
              key={o.value}
              onPress={() => { tap(); onChange(o.value); setOpen(false); }}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14,
                backgroundColor: o.value === value ? tint(t.accent, 0.12) : pressed ? t.surface3 : "transparent",
              })}
            >
              {o.icon ? <IconBadge name={o.icon} color={o.color || t.accent} size={34} /> : null}
              <T size={15.5} weight={o.value === value ? "800" : "600"} style={{ flex: 1 }}>{o.label}</T>
              {o.value === value ? <Icon name="check" size={20} color={t.accent} /> : null}
            </Pressable>
          ))}
        </View>
      </Sheet>
    </Field>
  );
}

export function DateField({ label, value, onChange, optional }: { label: string; value: string; onChange: (iso: string) => void; optional?: boolean }) {
  const t = useTheme();
  const date = parseISO(value) || new Date();
  const open = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: date, mode: "date",
        onChange: (_e, d) => { if (d) onChange(toISODate(d)); },
      });
    }
  };
  return (
    <Field label={label}>
      {Platform.OS === "ios" ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ alignSelf: "flex-start" }}>
            <DateTimePicker value={date} mode="date" display="compact" onChange={(_e, d) => { if (d) onChange(toISODate(d)); }} themeVariant={t.dark ? "dark" : "light"} />
          </View>
          {optional && value ? <Btn small kind="ghost" label="Clear" onPress={() => onChange("")} /> : null}
        </View>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            onPress={open}
            style={{ backgroundColor: t.surface2, borderColor: t.border, borderWidth: 1.5, borderRadius: RADIUS.control, paddingHorizontal: 14, paddingVertical: 14, flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <Icon name="calendar" size={20} color={t.textMuted} />
            <T size={16} weight="600" color={value ? t.text : t.textMuted}>{value ? fmtDate(value) : "Not set"}</T>
          </Pressable>
          {optional && value ? <Btn small kind="ghost" label="Clear" onPress={() => onChange("")} /> : null}
        </View>
      )}
    </Field>
  );
}

export function parseNum(s: string): number {
  const v = parseFloat(String(s).replace(/,/g, ""));
  return Number.isFinite(v) ? v : NaN;
}

// ---------- chips ----------

export function ChipRow<V extends string>({ options, value, onChange }: { options: { value: V; label: string }[]; value: V; onChange: (v: V) => void }) {
  const t = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }} style={{ flexGrow: 0 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => { tap(); onChange(o.value); }}
            style={{ paddingHorizontal: 14, height: 36, justifyContent: "center", borderRadius: RADIUS.pill, backgroundColor: active ? t.accent : t.surface3 }}
          >
            <T size={13} weight="700" color={active ? "#fff" : t.textSecondary}>{o.label}</T>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
