import React from "react";
import { useStore } from "../src/store";
import { currentYearMonthKeys, fmtMoney, isCarryForwardEntry, monthTotals } from "../src/lib/logic";
import { PushedPage } from "../src/components/scaffold";
import { PageHeader, StatRow, StatTile } from "../src/components/ui";
import { BreakdownPanel, ComparePanel } from "../src/components/panels";

export default function YTD() {
  const { data } = useStore();
  const keys = currentYearMonthKeys(data);
  const year = keys.length ? keys[0].split("-")[0] : "";
  const items = keys.map((k) => ({ label: data.months[k].label.split(" ")[0].slice(0, 3), ...monthTotals(data, k) }));
  const totalIncome = items.reduce((s, m) => s + m.income, 0);
  const totalExpense = items.reduce((s, m) => s + m.expense, 0);
  const net = totalIncome - totalExpense;
  const rate = totalIncome > 0 ? (net / totalIncome) * 100 : 0;
  const allExpenses = keys.flatMap((k) => data.months[k].expenses);
  const allIncome = keys.flatMap((k) => data.months[k].income).filter((e) => !isCarryForwardEntry(e));
  return (
    <PushedPage>
      <PageHeader icon="trend" title="Year to date" sub={`${year} · ${keys.length} month${keys.length === 1 ? "" : "s"} tracked`} />
      <StatRow>
        <StatTile label="Income" value={fmtMoney(totalIncome)} />
        <StatTile label="Expenses" value={fmtMoney(totalExpense)} />
        <StatTile label="Net savings" value={fmtMoney(net)} tone={net >= 0 ? "good" : "critical"} />
        <StatTile label="Savings rate" value={`${rate.toFixed(1)}%`} tone={rate >= 0 ? "good" : "critical"} />
      </StatRow>
      <ComparePanel title="Monthly comparison" items={items} chartHeight={150} />
      <BreakdownPanel title="Spending by category" entries={allExpenses} kind="expenses" scopeLabel={`in ${year} (year to date)`} emptyMsg="No expenses recorded yet." />
      <BreakdownPanel title="Income by source" entries={allIncome} kind="income" scopeLabel={`in ${year} (year to date)`} emptyMsg="No income recorded yet." />
    </PushedPage>
  );
}
