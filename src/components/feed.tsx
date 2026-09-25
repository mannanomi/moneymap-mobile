import React, { useMemo, useState } from "react";
import { Alert, Platform, Pressable, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "../store";
import { tint, useTheme } from "../theme";
import {
  CreditCard, Entry, Kind,
} from "../types";
import {
  cardThemeColors, cardTotals, categoryIcon, categoryTileIndex, currentYearMonthKeys, fmtDate, fmtMoney,
  maskedNumber, monthTotals, relativeDayHeader,
} from "../lib/logic";
import { EmptyState, Icon, IconBadge, Panel, Sheet, T, tap } from "./ui";

export function confirmAction(title: string, message: string, confirmLabel: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: confirmLabel, style: "destructive", onPress: onConfirm },
  ]);
}

// ---------- month stepper ----------

export function MonthBar() {
  const { data, monthKey, setMonthKey } = useStore();
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const keys = useMemo(() => {
    const k = currentYearMonthKeys(data);
    if (monthKey && !k.includes(monthKey) && data.months[monthKey]) return [...k, monthKey].sort();
    return k;
  }, [data, monthKey]);
  if (!keys.length) return null;
  const idx = keys.indexOf(monthKey);
  const go = (d: number) => { const n = keys[idx + d]; if (n) { tap(); setMonthKey(n); } };
  const arrow = (dir: -1 | 1, disabled: boolean) => (
    <Pressable
      onPress={() => go(dir)} disabled={disabled} hitSlop={8}
      style={({ pressed }) => ({
        width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center",
        backgroundColor: t.surface1, borderWidth: 1, borderColor: t.border, opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
      })}
    >
      <Icon name={dir < 0 ? "chevronLeft" : "chevron"} size={22} color={t.textSecondary} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 8 }}>
      {arrow(-1, idx <= 0)}
      <Pressable
        onPress={() => { tap(); setOpen(true); }}
        style={({ pressed }) => ({
          flex: 1, height: 40, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
          backgroundColor: t.surface1, borderWidth: 1, borderColor: t.border, opacity: pressed ? 0.8 : 1,
        })}
      >
        <Icon name="calendar" size={17} color={t.accent} />
        <T size={14.5} weight="800">{data.months[monthKey]?.label || "Pick a month"}</T>
        <Icon name="chevronDown" size={18} color={t.textMuted} />
      </Pressable>
      {arrow(1, idx < 0 || idx >= keys.length - 1)}
      <Sheet visible={open} title="Choose a month" onClose={() => setOpen(false)}>
        <View style={{ gap: 4 }}>
          {[...keys].reverse().map((k) => {
            const active = k === monthKey;
            const net = monthTotals(data, k).net;
            return (
              <Pressable
                key={k}
                onPress={() => { tap(); setMonthKey(k); setOpen(false); }}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14,
                  backgroundColor: active ? tint(t.accent, 0.12) : pressed ? t.surface3 : "transparent",
                })}
              >
                <T size={15.5} weight={active ? "800" : "600"} style={{ flex: 1 }}>{data.months[k].label}</T>
                <T size={13} weight="700" color={net >= 0 ? t.good : t.critical}>{(net >= 0 ? "+" : "") + fmtMoney(net)}</T>
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}

// ---------- ledger feed (day-grouped rows) ----------

export function LedgerFeed({
  entries, kindFor, onRowPress,
}: {
  entries: Entry[];
  kindFor: (e: Entry) => Kind;
  onRowPress: (e: Entry, kind: Kind) => void;
}) {
  const t = useTheme();
  const { data } = useStore();
  const groups = useMemo(() => {
    const out: { date: string | null; rows: Entry[] }[] = [];
    for (const e of entries) {
      const last = out[out.length - 1];
      if (last && last.date === e.date) last.rows.push(e);
      else out.push({ date: e.date, rows: [e] });
    }
    return out;
  }, [entries]);

  return (
    <View style={{ gap: 14 }}>
      {groups.map((g, gi) => {
        const total = g.rows.reduce((s, e) => s + e.amount, 0);
        return (
          <View key={(g.date || "none") + gi}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <T size={12} weight="800" muted style={{ textTransform: "uppercase", letterSpacing: 0.6 }}>{relativeDayHeader(g.date)}</T>
              <T size={12} weight="600" muted>{`${g.rows.length} · ${fmtMoney(total)}`}</T>
            </View>
            <View style={{ gap: 2 }}>
              {g.rows.map((e) => {
                const kind = kindFor(e);
                const color = t.tiles[categoryTileIndex(data, e.category, kind)];
                return (
                  <Pressable
                    key={e.id}
                    onPress={() => onRowPress(e, kind)}
                    style={({ pressed }) => ({
                      flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 9, opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <IconBadge name={categoryIcon(e.category)} color={color} size={42} />
                    <View style={{ flex: 1 }}>
                      <T size={14.5} weight="700" numberOfLines={1}>{e.description || e.category}</T>
                      <T size={12.5} muted numberOfLines={1}>{e.category}</T>
                    </View>
                    <T size={15} figure color={kind === "income" ? t.income : t.text}>
                      {(kind === "income" ? "+" : "-") + fmtMoney(e.amount)}
                    </T>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function Pager({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
      <T size={12} muted>{`${start}–${end} of ${total}`}</T>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable disabled={page === 0} onPress={() => { tap(); onChange(page - 1); }} style={{ opacity: page === 0 ? 0.3 : 1, padding: 6 }}>
          <Icon name="chevronLeft" size={24} />
        </Pressable>
        <T size={12.5} weight="700" secondary>{`${page + 1} / ${pages}`}</T>
        <Pressable disabled={page >= pages - 1} onPress={() => { tap(); onChange(page + 1); }} style={{ opacity: page >= pages - 1 ? 0.3 : 1, padding: 6 }}>
          <Icon name="chevron" size={24} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------- read-only transaction list sheet (category drill-down) ----------

export function TransactionListSheet({
  visible, title, entries, scopeLabel, onClose,
}: { visible: boolean; title: string; entries: Entry[]; scopeLabel: string; onClose: () => void }) {
  const sorted = useMemo(() => [...entries].reverse().sort((a, b) => (b.date || "").localeCompare(a.date || "")), [entries]);
  const total = sorted.reduce((s, e) => s + e.amount, 0);
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <T size={12.5} secondary>{`${sorted.length} transaction${sorted.length === 1 ? "" : "s"} ${scopeLabel} · ${fmtMoney(total)} total`}</T>
      {sorted.length === 0 ? <EmptyState msg="No transactions here yet." /> : (
        <View style={{ gap: 12 }}>
          {sorted.map((e) => (
            <View key={e.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 84 }}><T size={12} muted>{fmtDate(e.date)}</T></View>
              <T size={13.5} numberOfLines={2} style={{ flex: 1 }}>{e.description}</T>
              <T size={13.5} figure>{fmtMoney(e.amount)}</T>
            </View>
          ))}
        </View>
      )}
    </Sheet>
  );
}

// ---------- credit card visual ----------

export function CardVisual({ card, onPress }: { card: CreditCard; onPress?: () => void }) {
  const totals = cardTotals(card);
  const colors = cardThemeColors(card);
  const body = (
    <View style={{ borderRadius: 24, overflow: "hidden", shadowColor: colors[0], shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 6 }}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20, gap: 12, minHeight: 200 }}>
        <View style={{ position: "absolute", right: -50, top: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: "#ffffff12" }} />
        <View style={{ position: "absolute", right: 30, bottom: -70, width: 150, height: 150, borderRadius: 75, backgroundColor: "#ffffff0d" }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <T size={14} weight="800" color="#ffffffdd">{card.issuer || "Credit card"}</T>
          <T size={13} weight="800" color="#ffffffcc">{card.network || ""}</T>
        </View>
        <View style={{ width: 38, height: 28, borderRadius: 7, backgroundColor: "#E9C86E", opacity: 0.92 }} />
        <T size={18} weight="700" color="#fff" style={{ letterSpacing: 2.5 }}>{maskedNumber(card)}</T>
        <T size={13} weight="600" color="#ffffffcc" numberOfLines={1}>{card.name || "Untitled card"}</T>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
          <View>
            <T size={11} weight="600" color="#ffffff99">Left to pay</T>
            <T size={18} figure color="#fff">{fmtMoney(totals.owing)}</T>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <T size={11} weight="600" color="#ffffff99">Available</T>
            <T size={18} figure color="#fff">{totals.limit > 0 ? fmtMoney(totals.available) : "—"}</T>
          </View>
        </View>
        <View style={{ gap: 5 }}>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: "#ffffff30", overflow: "hidden" }}>
            <View style={{ width: `${Math.min(totals.utilisation, 1) * 100}%`, height: "100%", backgroundColor: "#ffffffee", borderRadius: 3 }} />
          </View>
          <T size={11} weight="600" color="#ffffffaa">
            {totals.limit > 0 ? `${Math.round(totals.utilisation * 100)}% of ${fmtMoney(totals.limit)} limit used` : "No limit set"}
          </T>
        </View>
      </LinearGradient>
    </View>
  );
  if (onPress) return <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.985 : 1 }] })}>{body}</Pressable>;
  return body;
}

export function Tile({ icon, color, name, sub, onPress, children }: {
  icon: string; color: string; name: string; sub: string; onPress?: () => void; children?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Panel onPress={onPress} style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <IconBadge name={icon} color={color} size={46} />
        <View style={{ flex: 1 }}>
          <T size={16} weight="800" numberOfLines={1}>{name}</T>
          <T size={12.5} muted numberOfLines={1}>{sub}</T>
        </View>
        {onPress ? <Icon name="chevron" size={20} color={t.textMuted} /> : null}
      </View>
      {children}
    </Panel>
  );
}
