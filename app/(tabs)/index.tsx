import React, { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useStore } from "../../src/store";
import { tint, useTheme } from "../../src/theme";
import {
  categoryBreakdown, categoryIcon, categoryTileIndex, fmtDate, fmtMoney, monthTotals, recentMonthKeys, totalNetWorth,
} from "../../src/lib/logic";
import type { Entry, Kind } from "../../src/types";
import { TabPage } from "../../src/components/scaffold";
import { Btn, Divider, EmptyState, Icon, IconBadge, Panel, SectionTitle, T } from "../../src/components/ui";
import { CategoryTileGrid, MiniTrend } from "../../src/components/charts";
import { BudgetPanel, MiniCalendar } from "../../src/components/panels";
import { TransactionForm } from "../../src/components/forms";
import { TransactionListSheet } from "../../src/components/feed";

function HeroChip({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff1f", borderRadius: 16, padding: 12, gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#ffffff26", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={13} color="#fff" />
        </View>
        <T size={12} weight="700" color="#ffffffcc">{label}</T>
      </View>
      <T size={17} figure color="#fff" numberOfLines={1}>{fmtMoney(value)}</T>
    </View>
  );
}

export default function Dashboard() {
  const { data, monthKey } = useStore();
  const t = useTheme();
  const [form, setForm] = useState<{ kind: Kind; existing: Entry | null } | null>(null);
  const [drill, setDrill] = useState<string | null>(null);
  const month = data.months[monthKey];

  const trend = useMemo(() => {
    if (!month) return [];
    return recentMonthKeys(data, monthKey, 6).map((k) => ({
      key: k, label: data.months[k].label.split(" ")[0].slice(0, 3), expense: monthTotals(data, k).expense,
    }));
  }, [data, monthKey, month]);

  if (!month) {
    return (
      <TabPage title="MoneyMap" showMonth={false}>
        <Panel>
          <EmptyState icon="wallet" msg={'No months yet. Add a month from More, or import your data from More → Backup & import.'} />
        </Panel>
      </TabPage>
    );
  }

  const { income, expense, net } = monthTotals(data, monthKey);
  const txCount = month.expenses.length + month.income.length;
  const breakdown = categoryBreakdown(month.expenses);
  const recent = [...month.expenses].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5);
  const hasNetWorth = data.bankAccounts.length || data.investments.length || data.savingsPlans.length;

  return (
    <TabPage title="Overview" subtitle={`${txCount} transaction${txCount === 1 ? "" : "s"} in ${month.label}`}>
      {/* hero */}
      <View style={{ borderRadius: 26, overflow: "hidden", shadowColor: t.accent, shadowOpacity: t.dark ? 0.25 : 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 }}>
        <LinearGradient colors={[t.accent, t.accentDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20, gap: 16 }}>
          <View style={{ position: "absolute", right: -60, top: -70, width: 220, height: 220, borderRadius: 110, backgroundColor: "#ffffff14" }} />
          <View style={{ position: "absolute", left: -40, bottom: -90, width: 200, height: 200, borderRadius: 100, backgroundColor: "#ffffff0c" }} />
          <View>
            <T size={13} weight="700" color="#ffffffcc">Net savings</T>
            <T size={38} figure color="#fff" style={{ letterSpacing: -1, marginTop: 2 }}>{fmtMoney(net)}</T>
            {hasNetWorth ? <T size={12.5} weight="600" color="#ffffffb3" style={{ marginTop: 2 }}>{`Net worth ${fmtMoney(totalNetWorth(data))}`}</T> : null}
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <HeroChip icon="arrowDown" label="Income" value={income} />
            <HeroChip icon="arrowUp" label="Expenses" value={expense} />
          </View>
        </LinearGradient>
      </View>

      {/* quick actions */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Btn kind="expense" icon="plus" label="Add expense" style={{ flex: 1 }} onPress={() => setForm({ kind: "expenses", existing: null })} />
        <Btn kind="income" icon="plus" label="Add income" style={{ flex: 1 }} onPress={() => setForm({ kind: "income", existing: null })} />
      </View>

      <BudgetPanel monthKey={monthKey} />

      {/* spending trend */}
      <Panel style={{ gap: 12 }}>
        <SectionTitle right={<T size={12} weight="600" muted>Expenses · last 6 months</T>}>Trend</SectionTitle>
        <MiniTrend items={trend} currentKey={monthKey} />
      </Panel>

      {breakdown.length ? (
        <View>
          <SectionTitle right={breakdown.length > 8 ? <Btn small kind="ghost" label="View all" onPress={() => router.push("/categories")} /> : undefined}>
            Top spending
          </SectionTitle>
          <CategoryTileGrid breakdown={breakdown} total={expense} kind="expenses" top={8} onPress={(c) => setDrill(c)} />
        </View>
      ) : null}

      <Panel style={{ gap: 4 }}>
        <SectionTitle right={<Btn small kind="ghost" label="See all" onPress={() => router.navigate("/transactions")} />}>Recent activity</SectionTitle>
        {recent.length === 0 ? <EmptyState icon="receipt" msg="No expenses yet this month." /> : recent.map((e, i) => (
          <View key={e.id}>
            {i > 0 ? <Divider /> : null}
            <Pressable
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, opacity: pressed ? 0.6 : 1 })}
              onPress={() => setForm({ kind: "expenses", existing: e })}
            >
              <IconBadge name={categoryIcon(e.category)} color={t.tiles[categoryTileIndex(data, e.category, "expenses")]} size={42} />
              <View style={{ flex: 1 }}>
                <T size={14.5} weight="700" numberOfLines={1}>{e.description}</T>
                <T size={12.5} muted numberOfLines={1}>{fmtDate(e.date)} · {e.category}</T>
              </View>
              <T size={15} figure>{fmtMoney(e.amount)}</T>
            </Pressable>
          </View>
        ))}
      </Panel>

      <Panel>
        <SectionTitle>Calendar</SectionTitle>
        <MiniCalendar monthKey={monthKey} />
      </Panel>

      {form ? <TransactionForm kind={form.kind} monthKey={monthKey} existing={form.existing} onClose={() => setForm(null)} /> : null}
      {drill ? (
        <TransactionListSheet
          visible title={drill} onClose={() => setDrill(null)} scopeLabel={`in ${month.label}`}
          entries={month.expenses.filter((e) => e.category === drill)}
        />
      ) : null}
    </TabPage>
  );
}
