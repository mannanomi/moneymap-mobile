import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, View } from "react-native";
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";
import { useStore } from "../store";
import { tint, useTheme } from "../theme";
import {
  BreakdownRow, Series, categoryIcon, categoryTileIndex, fmtMoney, fmtMoneyCompact, niceMax,
} from "../lib/logic";
import { EmptyState, IconBadge, T, tap } from "./ui";

function useWidth() {
  const [w, setW] = useState(0);
  return { w, onLayout: (e: any) => setW(e.nativeEvent.layout.width) };
}

// ---------- budget donut ----------

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function BudgetDonut({ spent, limit, size = 150 }: { spent: number; limit: number; size?: number }) {
  const t = useTheme();
  const stroke = 15;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const hasLimit = limit > 0;
  const fraction = hasLimit ? Math.min(spent / limit, 1) : 0;
  const over = hasLimit && spent > limit;
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: fraction, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [fraction, anim]);
  const offset = Platform.OS === "web" ? c * (1 - fraction) : anim.interpolate({ inputRange: [0, 1], outputRange: [c, 0] });
  const ProgressCircle: any = Platform.OS === "web" ? Circle : AnimatedCircle;
  const color = over ? t.critical : fraction >= 0.8 ? t.warn : t.expense;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.surface3} strokeWidth={stroke} fill="none" />
        {hasLimit ? (
          <ProgressCircle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
            strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c}`} strokeDashoffset={offset as any}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }}>
        <T size={hasLimit ? 26 : 20} figure color={over ? t.critical : t.text}>{hasLimit ? `${Math.round((spent / limit) * 100)}%` : fmtMoney(spent)}</T>
        <T size={12} weight="600" muted>{hasLimit ? "of budget" : "Spent"}</T>
      </View>
    </View>
  );
}

// ---------- category donut + tile grid ----------

const TOP_N = 7;

export function CategoryDonut({ breakdown, total, kind, size = 130 }: { breakdown: BreakdownRow[]; total: number; kind: "income" | "expenses"; size?: number }) {
  const t = useTheme();
  const { data } = useStore();
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let segments: { amount: number; color: string }[];
  const col = (cat: string) => t.tiles[categoryTileIndex(data, cat, kind)];
  if (breakdown.length <= TOP_N) segments = breakdown.map((b) => ({ amount: b.amount, color: col(b.category) }));
  else {
    segments = breakdown.slice(0, TOP_N).map((b) => ({ amount: b.amount, color: col(b.category) }));
    segments.push({ amount: breakdown.slice(TOP_N).reduce((s, b) => s + b.amount, 0), color: t.textMuted });
  }
  let cumulative = 0;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.surface3} strokeWidth={stroke} fill="none" />
        {segments.filter((s) => s.amount > 0).map((seg, i) => {
          const frac = total > 0 ? seg.amount / total : 0;
          const dash = frac * c;
          const rot = (cumulative / (total || 1)) * 360 - 90;
          cumulative += seg.amount;
          return (
            <Circle
              key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${c - dash}`} transform={`rotate(${rot} ${size / 2} ${size / 2})`}
            />
          );
        })}
      </Svg>
      <View style={{ position: "absolute" }}>
        <T size={16} figure>{fmtMoneyCompact(total)}</T>
      </View>
    </View>
  );
}

export function CategoryTileGrid({ breakdown, total, kind, onPress, top }: {
  breakdown: BreakdownRow[]; total: number; kind: "income" | "expenses"; onPress?: (category: string) => void; top?: number;
}) {
  const t = useTheme();
  const { data } = useStore();
  const rows = top ? breakdown.slice(0, top) : breakdown;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {rows.map(({ category, amount }, idx) => {
        const isOther = !top && idx >= TOP_N;
        const color = isOther ? t.textMuted : t.tiles[categoryTileIndex(data, category, kind)];
        return (
          <Pressable
            key={category}
            onPress={onPress ? () => { tap(); onPress(category); } : undefined}
            style={({ pressed }) => ({
              width: "48%", flexGrow: 1, backgroundColor: t.surface1, borderColor: t.border, borderWidth: 1, borderRadius: 18,
              padding: 14, gap: 10, opacity: pressed ? 0.85 : 1, ...t.cardShadow,
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <IconBadge name={categoryIcon(category)} color={color} size={38} />
              {!top ? <T size={12} weight="700" color={color}>{`${(total > 0 ? (amount / total) * 100 : 0).toFixed(1)}%`}</T> : null}
            </View>
            <View style={{ gap: 2 }}>
              <T size={12.5} weight="600" muted numberOfLines={1}>{category}</T>
              <T size={16} figure>{fmtMoney(amount)}</T>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function CategoryBreakdown({ breakdown, total, kind, onPress }: {
  breakdown: BreakdownRow[]; total: number; kind: "income" | "expenses"; onPress?: (category: string) => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      <View style={{ alignItems: "center" }}>
        <CategoryDonut breakdown={breakdown} total={total} kind={kind} />
      </View>
      <CategoryTileGrid breakdown={breakdown} total={total} kind={kind} onPress={onPress} />
    </View>
  );
}

// ---------- mini trend bars (dashboard) ----------

export function MiniTrend({ items, currentKey }: { items: { key: string; label: string; expense: number }[]; currentKey: string }) {
  const t = useTheme();
  const max = Math.max(...items.map((i) => i.expense), 1);
  const H = 84;
  return (
    <View style={{ flexDirection: "row", gap: 10, height: H + 22, alignItems: "flex-end" }}>
      {items.map((it) => {
        const cur = it.key === currentKey;
        return (
          <View key={it.key} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
            <View style={{ width: "100%", height: Math.max((it.expense / max) * H, 4), borderRadius: 8, backgroundColor: cur ? t.accent : tint(t.accent, 0.18) }} />
            <T size={11} weight={cur ? "800" : "600"} color={cur ? t.text : t.textMuted}>{it.label}</T>
          </View>
        );
      })}
    </View>
  );
}

// ---------- income vs expense columns ----------

export function ColumnChart({ items, height = 150 }: { items: { label: string; income: number; expense: number }[]; height?: number }) {
  const t = useTheme();
  const { w, onLayout } = useWidth();
  const axisW = 38;
  const labelH = 18;
  const max = niceMax(Math.max(...items.map((m) => Math.max(m.income, m.expense)), 1) * 1.15);
  const plotW = Math.max(w - axisW, 0);
  const groupW = items.length ? plotW / items.length : 0;
  const barW = Math.max(Math.min(groupW * 0.32, 22), 3);
  const steps = 4;
  return (
    <View onLayout={onLayout} style={{ width: "100%" }}>
      {w > 0 ? (
        <Svg width={w} height={height + labelH + 8}>
          <G transform="translate(0,8)">
          {Array.from({ length: steps + 1 }).map((_, i) => {
            const y = height - (i / steps) * height;
            return (
              <G key={i}>
                <Line x1={axisW} x2={w} y1={y} y2={y} stroke={t.gridline} strokeWidth={1} />
                <SvgText x={axisW - 6} y={y + 3} fontSize={9.5} fill={t.textMuted} textAnchor="end">{fmtMoneyCompact((max / steps) * i)}</SvgText>
              </G>
            );
          })}
          {items.map((m, i) => {
            const cx = axisW + groupW * i + groupW / 2;
            const ih = Math.max((m.income / max) * height, m.income > 0 ? 2 : 0);
            const eh = Math.max((m.expense / max) * height, m.expense > 0 ? 2 : 0);
            return (
              <G key={i}>
                <Rect x={cx - barW - 1} y={height - ih} width={barW} height={ih} rx={3} fill={t.income} />
                <Rect x={cx + 1} y={height - eh} width={barW} height={eh} rx={3} fill={t.expense} />
                <SvgText x={cx} y={height + 13} fontSize={10.5} fill={t.textMuted} textAnchor="middle">{m.label}</SvgText>
              </G>
            );
          })}
          </G>
        </Svg>
      ) : null}
    </View>
  );
}

// ---------- net savings bars ----------

export function SavingsChart({ items, height = 130 }: { items: { label: string; net: number }[]; height?: number }) {
  const t = useTheme();
  const { w, onLayout } = useWidth();
  const maxAbs = Math.max(...items.map((m) => Math.abs(m.net)), 1);
  const groupW = items.length && w ? w / items.length : 0;
  const barW = Math.max(Math.min(groupW * 0.5, 30), 4);
  const mid = height / 2;
  return (
    <View onLayout={onLayout} style={{ width: "100%" }}>
      {w > 0 ? (
        <Svg width={w} height={height + 34}>
          <Line x1={0} x2={w} y1={mid} y2={mid} stroke={t.gridline} strokeWidth={1} />
          {items.map((m, i) => {
            const cx = groupW * i + groupW / 2;
            const h = Math.max((Math.abs(m.net) / maxAbs) * (height / 2 - 4), 1);
            const good = m.net >= 0;
            return (
              <G key={i}>
                <Rect x={cx - barW / 2} y={good ? mid - h : mid} width={barW} height={h} rx={3} fill={good ? t.good : t.critical} />
                <SvgText x={cx} y={height + 12} fontSize={groupW < 38 ? 8.5 : 10.5} fontWeight="700" fill={good ? t.good : t.critical} textAnchor="middle">{fmtMoneyCompact(m.net)}</SvgText>
                <SvgText x={cx} y={height + 26} fontSize={groupW < 38 ? 9 : 10.5} fill={t.textMuted} textAnchor="middle">{m.label}</SvgText>
              </G>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}

// ---------- trend line chart (income vs expense) ----------

function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const lo = Math.min(p1[1], p2[1]);
    const hi = Math.max(p1[1], p2[1]);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = Math.min(hi, Math.max(lo, p1[1] + (p2[1] - p0[1]) / 6));
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = Math.min(hi, Math.max(lo, p2[1] - (p3[1] - p1[1]) / 6));
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export function TrendLineChart({ series, height = 190, daily }: { series: Series; height?: number; daily?: boolean }) {
  const t = useTheme();
  const { w, onLayout } = useWidth();
  const [sel, setSel] = useState<number | null>(null);
  const axisW = 40;
  const padTop = 8;
  const labelH = 20;
  const n = series.labels.length;
  const max = niceMax(Math.max(...series.income, ...series.expense, 1) * 1.1);
  const plotW = Math.max(w - axisW - 6, 1);
  const plotH = height - padTop;
  const xAt = (i: number) => axisW + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => padTop + plotH - (v / max) * plotH;
  const pts = (arr: number[]): [number, number][] => arr.map((v, i) => [xAt(i), yAt(v)]);
  const inc = pts(series.income);
  const exp = pts(series.expense);
  const area = (p: [number, number][]) =>
    p.length < 2 ? "" : `${smoothPath(p)} L ${p[p.length - 1][0]},${padTop + plotH} L ${p[0][0]},${padTop + plotH} Z`;

  const pick = (x: number) => {
    if (n === 0) return;
    const idx = Math.round(((x - axisW) / plotW) * (n - 1));
    setSel(Math.max(0, Math.min(n - 1, idx)));
  };
  const labelEvery = daily ? 5 : 1;

  return (
    <View onLayout={onLayout} style={{ width: "100%" }}>
      {w > 0 ? (
        <View
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => pick(e.nativeEvent.locationX)}
          onResponderMove={(e) => pick(e.nativeEvent.locationX)}
        >
          <Svg width={w} height={height + labelH}>
            <Defs>
              <LinearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={t.income} stopOpacity={0.28} />
                <Stop offset="1" stopColor={t.income} stopOpacity={0} />
              </LinearGradient>
              <LinearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={t.expense} stopOpacity={0.28} />
                <Stop offset="1" stopColor={t.expense} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {[0, 1, 2, 3, 4].map((i) => {
              const y = padTop + plotH - (i / 4) * plotH;
              return (
                <G key={i}>
                  <Line x1={axisW} x2={w - 6} y1={y} y2={y} stroke={t.gridline} strokeWidth={1} />
                  <SvgText x={axisW - 6} y={y + 3} fontSize={9.5} fill={t.textMuted} textAnchor="end">{fmtMoneyCompact((max / 4) * i)}</SvgText>
                </G>
              );
            })}
            {n > 1 ? <Path d={area(inc)} fill="url(#gInc)" /> : null}
            {n > 1 ? <Path d={area(exp)} fill="url(#gExp)" /> : null}
            {n > 1 ? <Path d={smoothPath(inc)} stroke={t.income} strokeWidth={2.2} fill="none" strokeLinecap="round" /> : null}
            {n > 1 ? <Path d={smoothPath(exp)} stroke={t.expense} strokeWidth={2.2} fill="none" strokeLinecap="round" /> : null}
            {!daily || n <= 1 ? inc.map((p, i) => <Circle key={"i" + i} cx={p[0]} cy={p[1]} r={3} fill={t.income} />) : null}
            {!daily || n <= 1 ? exp.map((p, i) => <Circle key={"e" + i} cx={p[0]} cy={p[1]} r={3} fill={t.expense} />) : null}
            {series.labels.map((l, i) => (i % labelEvery === 0 || i === n - 1) ? (
              <SvgText key={i} x={xAt(i)} y={height + 14} fontSize={10} fill={t.textMuted} textAnchor="middle">{l}</SvgText>
            ) : null)}
            {sel !== null && n > 0 ? (
              <G>
                <Line x1={xAt(sel)} x2={xAt(sel)} y1={padTop} y2={padTop + plotH} stroke={t.textMuted} strokeWidth={1} strokeDasharray="3 3" />
                <Circle cx={xAt(sel)} cy={yAt(series.income[sel])} r={4.5} fill={t.income} stroke={t.surface1} strokeWidth={2} />
                <Circle cx={xAt(sel)} cy={yAt(series.expense[sel])} r={4.5} fill={t.expense} stroke={t.surface1} strokeWidth={2} />
              </G>
            ) : null}
          </Svg>
        </View>
      ) : null}
      {sel !== null && n > 0 ? (
        <View style={{ flexDirection: "row", gap: 14, justifyContent: "center", marginTop: 6 }}>
          <T size={12} secondary>{daily ? `Day ${series.labels[sel]}` : series.labels[sel]}</T>
          <T size={12} weight="700" color={t.income}>{`Income ${fmtMoney(series.income[sel])}`}</T>
          <T size={12} weight="700" color={t.expense}>{`Expenses ${fmtMoney(series.expense[sel])}`}</T>
        </View>
      ) : (
        <T size={11} muted align="center" style={{ marginTop: 6 }}>Touch the chart to see values</T>
      )}
    </View>
  );
}

// ---------- horizontal bars (search: by month) ----------

export function BarList({ rows, total }: { rows: BreakdownRow[]; total: number }) {
  const t = useTheme();
  if (!rows.length) return <EmptyState msg="Nothing to show." />;
  const max = Math.max(...rows.map((r) => r.amount), 1);
  return (
    <View style={{ gap: 10 }}>
      {rows.map((r) => (
        <View key={r.category} style={{ gap: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <T size={12.5} secondary numberOfLines={1} style={{ flex: 1 }}>{r.category}</T>
            <T size={12.5} weight="700">{`${fmtMoney(r.amount)}${total ? ` · ${((r.amount / total) * 100).toFixed(1)}%` : ""}`}</T>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: t.surface3, overflow: "hidden" }}>
            <View style={{ width: `${Math.max((r.amount / max) * 100, 1.5)}%`, height: "100%", backgroundColor: t.accent, borderRadius: 4 }} />
          </View>
        </View>
      ))}
    </View>
  );
}
