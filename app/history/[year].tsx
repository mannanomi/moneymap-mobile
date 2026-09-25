import React from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../../src/store";
import { useTheme } from "../../src/theme";
import { fmtMoney, isCarryForwardEntry, monthTotals, monthsInYear } from "../../src/lib/logic";
import { PushedPage } from "../../src/components/scaffold";
import { PageHeader, Panel, SectionTitle, StatRow, StatTile, T } from "../../src/components/ui";
import { BreakdownPanel } from "../../src/components/panels";

export default function HistoryYear() {
  const { year } = useLocalSearchParams<{ year: string }>();
  const { data, setMonthKey } = useStore();
  const t = useTheme();
  const keys = monthsInYear(data, String(year));
  const list = keys.map((k) => ({ key: k, label: data.months[k].label, ...monthTotals(data, k) }));
  const totalIncome = list.reduce((s, m) => s + m.income, 0);
  const totalExpense = list.reduce((s, m) => s + m.expense, 0);
  const net = totalIncome - totalExpense;
  const allExpenses = keys.flatMap((k) => data.months[k].expenses);
  const allIncome = keys.flatMap((k) => data.months[k].income).filter((e) => !isCarryForwardEntry(e));
  return (
    <PushedPage>
      <PageHeader icon="calendar" title={String(year)} sub={`${keys.length} month${keys.length === 1 ? "" : "s"} tracked`} />
      <StatRow>
        <StatTile label="Income" value={fmtMoney(totalIncome)} />
        <StatTile label="Expenses" value={fmtMoney(totalExpense)} />
        <StatTile label="Net savings" value={fmtMoney(net)} tone={net >= 0 ? "good" : "critical"} />
      </StatRow>
      <Panel>
        <SectionTitle>Pick a month</SectionTitle>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {list.map((m) => (
            <Panel
              key={m.key}
              onPress={() => { setMonthKey(m.key); router.navigate("/"); }}
              style={{ width: "48%", flexGrow: 1, gap: 5, backgroundColor: t.surface2 }}
            >
              <T size={14} weight="700">{m.label.replace(" " + year, "")}</T>
              <T size={13} figure color={m.net >= 0 ? t.good : t.critical}>{(m.net >= 0 ? "+" : "") + fmtMoney(m.net)}</T>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
                <T size={11.5} secondary>Income</T><T size={11.5} weight="700" color={t.income}>{fmtMoney(m.income)}</T>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <T size={11.5} secondary>Expenses</T><T size={11.5} weight="700">{fmtMoney(m.expense)}</T>
              </View>
            </Panel>
          ))}
        </View>
      </Panel>
      <BreakdownPanel title="Spending by category" entries={allExpenses} kind="expenses" scopeLabel={`in ${year}`} emptyMsg="No expenses recorded." />
      <BreakdownPanel title="Income by source" entries={allIncome} kind="income" scopeLabel={`in ${year}`} emptyMsg="No income recorded." />
    </PushedPage>
  );
}
