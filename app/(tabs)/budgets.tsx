import React, { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useStore } from "../../src/store";
import { shade, tint, useTheme } from "../../src/theme";
import {
  categoryIcon, categoryTileIndex, fmtMoney, monthTotals, monthlyLimitFor, round2, spentByCategory,
} from "../../src/lib/logic";
import { TabPage } from "../../src/components/scaffold";
import {
  Btn, EmptyState, FormActions, Icon, IconBadge, Panel, ProgressBar, SectionTitle, Segmented, Sheet, T, TextField, parseNum,
} from "../../src/components/ui";
import { CategoryBudgetsForm, MonthlyLimitForm } from "../../src/components/forms";

type Filter = "all" | "watch" | "over";
type State = "ok" | "watch" | "over";

function SingleBudgetForm({ category, onClose }: { category: string; onClose: () => void }) {
  const { data, update } = useStore();
  const current = data.categoryBudgets[category];
  const [val, setVal] = useState(current > 0 ? String(current) : "");
  const save = () => {
    const v = parseNum(val);
    update((d) => {
      if (!Number.isNaN(v) && v > 0) d.categoryBudgets[category] = round2(v);
      else delete d.categoryBudgets[category];
    });
    onClose();
  };
  return (
    <Sheet visible title={category} onClose={onClose}>
      <TextField label="Monthly budget (AUD)" value={val} onChangeText={setVal} keyboardType="decimal-pad" placeholder="0.00" hint="Applies to every month. Clear the field to remove this budget." />
      <FormActions>
        <Btn label="Cancel" onPress={onClose} />
        <Btn kind="primary" label="Save" onPress={save} />
      </FormActions>
    </Sheet>
  );
}

const whole = (n: number) => fmtMoney(n).replace(/\.\d\d$/, "");

function daysLeftIn(monthKey: string): number | null {
  const now = new Date();
  const [y, m] = monthKey.split("-").map(Number);
  if (now.getFullYear() !== y || now.getMonth() + 1 !== m) return null;
  const days = new Date(y, m, 0).getDate();
  return days - now.getDate() + 1;
}

export default function Budgets() {
  const { data, monthKey } = useStore();
  const t = useTheme();
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<"all" | "limit" | null>(null);
  const [single, setSingle] = useState<string | null>(null);
  const month = data.months[monthKey];

  const spent = useMemo(() => (month ? spentByCategory(data, monthKey) : new Map<string, number>()), [data, monthKey, month]);
  if (!month) return <TabPage title="Budgets" showMonth={false}><EmptyState icon="target" msg="That month no longer exists." /></TabPage>;

  const budgets = data.categoryBudgets || {};
  const rows = Object.keys(budgets)
    .filter((c) => budgets[c] > 0)
    .map((c) => {
      const budget = budgets[c];
      const used = spent.get(c) || 0;
      const pct = used / budget;
      const state: State = used > budget ? "over" : pct >= 0.8 ? "watch" : "ok";
      return { category: c, budget, used, remaining: budget - used, pct, state };
    })
    .sort((a, b) => b.pct - a.pct);

  const { expense } = monthTotals(data, monthKey);
  const { limit, derived } = monthlyLimitFor(data, monthKey);
  const remaining = limit - expense;
  const usedPct = limit > 0 ? expense / limit : 0;
  const heroState: State = limit > 0 && expense > limit ? "over" : usedPct >= 0.8 ? "watch" : "ok";
  const daysLeft = daysLeftIn(monthKey);
  const perDay = daysLeft && remaining > 0 ? remaining / daysLeft : null;

  const unbudgeted = [...spent.entries()]
    .filter(([c]) => !(budgets[c] > 0))
    .sort((a, b) => b[1] - a[1]);
  const unbudgetedTotal = unbudgeted.reduce((s, [, a]) => s + a, 0);

  const counts = { all: rows.length, watch: rows.filter((r) => r.state === "watch").length, over: rows.filter((r) => r.state === "over").length };
  const shown = rows.filter((r) => filter === "all" || r.state === filter);

  const stateColor = (s: State) => (s === "over" ? t.critical : s === "watch" ? t.warn : t.good);
  const heroColors: [string, string] =
    heroState === "over" ? [t.critical, shade(t.critical, 0.6)]
    : heroState === "watch" ? [shade(t.warn, 1.0), shade(t.warn, 0.55)]
    : [t.accent, t.accentDeep];

  return (
    <TabPage title="Budgets" subtitle={month.label}>
      {limit > 0 ? (
        <View style={{ borderRadius: 26, overflow: "hidden", shadowColor: heroColors[0], shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 }}>
          <LinearGradient colors={heroColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20, gap: 16 }}>
            <View style={{ position: "absolute", right: -60, top: -70, width: 220, height: 220, borderRadius: 110, backgroundColor: "#ffffff14" }} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <T size={13} weight="700" color="#ffffffcc">{remaining < 0 ? "Over budget by" : "Left to spend"}</T>
              <View style={{ backgroundColor: "#ffffff26", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <T size={12} weight="800" color="#fff">{`${Math.round(usedPct * 100)}% used`}</T>
              </View>
            </View>
            <T size={40} figure color="#fff" style={{ letterSpacing: -1, marginTop: -8 }}>{fmtMoney(Math.abs(remaining))}</T>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: "#ffffff30", overflow: "hidden" }}>
              <View style={{ width: `${Math.min(usedPct, 1) * 100}%`, height: "100%", backgroundColor: "#fff", borderRadius: 5 }} />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: "#ffffff1f", borderRadius: 14, padding: 11 }}>
                <T size={11.5} weight="600" color="#ffffffb3">Spent</T>
                <T size={15} figure color="#fff" numberOfLines={1}>{whole(expense)}</T>
              </View>
              <View style={{ flex: 1, backgroundColor: "#ffffff1f", borderRadius: 14, padding: 11 }}>
                <T size={11.5} weight="600" color="#ffffffb3">Budget</T>
                <T size={15} figure color="#fff" numberOfLines={1}>{whole(limit)}</T>
              </View>
              {perDay !== null ? (
                <View style={{ flex: 1, backgroundColor: "#ffffff1f", borderRadius: 14, padding: 11 }}>
                  <T size={11.5} weight="600" color="#ffffffb3">Per day</T>
                  <T size={15} figure color="#fff" numberOfLines={1}>{fmtMoney(perDay)}</T>
                </View>
              ) : null}
            </View>
            {daysLeft !== null ? (
              <T size={12.5} weight="600" color="#ffffffcc">{`${daysLeft} day${daysLeft === 1 ? "" : "s"} left in ${month.label.split(" ")[0]}`}</T>
            ) : null}
          </LinearGradient>
        </View>
      ) : (
        <Panel>
          <EmptyState icon="target" msg="No budgets yet. Set a monthly limit for each category to see how much you have left to spend." />
        </Panel>
      )}

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Btn kind="primary" icon="pencil" label={derived || limit === 0 ? "Edit budgets" : "Edit limit"} style={{ flex: 1 }} onPress={() => setEditing(derived || limit === 0 ? "all" : "limit")} />
        {derived || limit === 0 ? null : <Btn label="By category" style={{ flex: 1 }} onPress={() => setEditing("all")} />}
      </View>

      {rows.length ? (
        <>
          <Segmented
            value={filter} onChange={setFilter}
            options={[
              { value: "all", label: `All · ${counts.all}` },
              { value: "watch", label: `Watch · ${counts.watch}` },
              { value: "over", label: `Over · ${counts.over}` },
            ]}
          />
          {shown.length === 0 ? (
            <Panel><EmptyState icon="check" msg={filter === "over" ? "Nothing is over budget. Nice." : "Nothing close to its limit."} /></Panel>
          ) : shown.map((r) => {
            const color = stateColor(r.state);
            return (
              <Panel key={r.category} onPress={() => setSingle(r.category)} style={{ gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <IconBadge name={categoryIcon(r.category)} color={t.tiles[categoryTileIndex(data, r.category, "expenses")]} size={44} />
                  <View style={{ flex: 1 }}>
                    <T size={15.5} weight="800" numberOfLines={1}>{r.category}</T>
                    <T size={12.5} muted numberOfLines={1}>{`${fmtMoney(r.used)} of ${fmtMoney(r.budget)}`}</T>
                  </View>
                  <View style={{ backgroundColor: tint(color, 0.15), borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <T size={13} weight="800" color={color}>{`${Math.round(r.pct * 100)}%`}</T>
                  </View>
                </View>
                <ProgressBar pct={r.pct} color={color} height={9} />
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <Icon name={r.state === "over" ? "alert" : r.state === "watch" ? "alert" : "check"} size={15} color={color} />
                    <T size={12.5} weight="700" color={color}>
                      {r.state === "over" ? `${fmtMoney(-r.remaining)} over` : `${fmtMoney(r.remaining)} left`}
                    </T>
                  </View>
                  <T size={12} weight="600" muted>Tap to edit</T>
                </View>
              </Panel>
            );
          })}
        </>
      ) : null}

      {unbudgeted.length ? (
        <Panel style={{ gap: 4 }}>
          <SectionTitle right={<T size={13} weight="800" secondary>{fmtMoney(unbudgetedTotal)}</T>}>No budget set</SectionTitle>
          <T size={12.5} muted style={{ marginBottom: 6 }}>Spending in these categories counts towards your total but has no limit.</T>
          {unbudgeted.slice(0, 8).map(([c, amt]) => (
            <Pressable
              key={c} onPress={() => setSingle(c)}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, opacity: pressed ? 0.6 : 1 })}
            >
              <IconBadge name={categoryIcon(c)} color={t.tiles[categoryTileIndex(data, c, "expenses")]} size={38} />
              <T size={14.5} weight="700" numberOfLines={1} style={{ flex: 1 }}>{c}</T>
              <T size={14.5} figure>{fmtMoney(amt)}</T>
              <View style={{ backgroundColor: tint(t.accent, 0.14), borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
                <T size={12} weight="800" color={t.accent}>Set</T>
              </View>
            </Pressable>
          ))}
        </Panel>
      ) : null}

      {editing === "all" ? <CategoryBudgetsForm monthKey={monthKey} onClose={() => setEditing(null)} /> : null}
      {editing === "limit" ? <MonthlyLimitForm monthKey={monthKey} onClose={() => setEditing(null)} /> : null}
      {single ? <SingleBudgetForm category={single} onClose={() => setSingle(null)} /> : null}
    </TabPage>
  );
}
