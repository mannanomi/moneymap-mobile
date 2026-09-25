import React from "react";
import { useStore } from "../src/store";
import { isCarryForwardEntry } from "../src/lib/logic";
import { PushedPage } from "../src/components/scaffold";
import { EmptyState, PageHeader } from "../src/components/ui";
import { BreakdownPanel } from "../src/components/panels";

export default function AllCategories() {
  const { data, monthKey } = useStore();
  const month = data.months[monthKey];
  if (!month) return <PushedPage><EmptyState msg="That month no longer exists." /></PushedPage>;
  return (
    <PushedPage showMonth>
      <PageHeader icon="tag" title="All categories" sub={month.label} />
      <BreakdownPanel title="Spending by category" entries={month.expenses} kind="expenses" scopeLabel={`in ${month.label}`} emptyMsg="No expenses recorded yet." />
      <BreakdownPanel
        title="Income by source" entries={month.income.filter((e) => !isCarryForwardEntry(e))} kind="income"
        scopeLabel={`in ${month.label}`} emptyMsg="No income recorded yet."
      />
    </PushedPage>
  );
}
