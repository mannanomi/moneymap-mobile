import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { useStore } from "../../src/store";
import { fmtMoney, monthTotals, sortEntriesNewestFirst } from "../../src/lib/logic";
import type { Entry, Kind } from "../../src/types";
import { TabPage } from "../../src/components/scaffold";
import { Btn, EmptyState, Panel, Segmented, SectionTitle, StatRow, StatTile, T } from "../../src/components/ui";
import { LedgerFeed, Pager } from "../../src/components/feed";
import { TransactionForm } from "../../src/components/forms";

const PAGE_SIZE = 10;

export default function Transactions() {
  const { data, monthKey } = useStore();
  const [kind, setKind] = useState<Kind>("expenses");
  const [pages, setPages] = useState<Record<Kind, number>>({ expenses: 0, income: 0 });
  const [form, setForm] = useState<{ kind: Kind; existing: Entry | null } | null>(null);
  const month = data.months[monthKey];

  const entries = useMemo(() => (month ? sortEntriesNewestFirst(month[kind]) : []), [month, kind]);
  if (!month) return <TabPage title="Transactions" showMonth={false}><EmptyState msg="That month no longer exists." /></TabPage>;

  const { income, expense, net, carriedForward } = monthTotals(data, monthKey);
  const txCount = month.expenses.length + month.income.length;
  const total = month[kind].reduce((s, e) => s + e.amount, 0);
  const page = Math.min(pages[kind], Math.max(0, Math.ceil(entries.length / PAGE_SIZE) - 1));

  return (
    <TabPage title="Transactions" subtitle={`${txCount} in ${month.label}`}>
      <StatRow>
        <StatTile label="Income" icon="arrowDown" value={fmtMoney(income)} />
        <StatTile label="Expenses" icon="arrowUp" value={fmtMoney(expense)} />
        <StatTile label="Net savings" icon="bank" value={fmtMoney(net)} tone={net >= 0 ? "good" : "critical"} />
      </StatRow>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Btn kind="expense" icon="plus" label="Add expense" style={{ flex: 1 }} onPress={() => setForm({ kind: "expenses", existing: null })} />
        <Btn kind="income" icon="plus" label="Add income" style={{ flex: 1 }} onPress={() => setForm({ kind: "income", existing: null })} />
      </View>

      <Segmented
        value={kind} onChange={setKind}
        options={[{ value: "expenses", label: "Expenses" }, { value: "income", label: "Income" }]}
      />

      <Panel>
        <SectionTitle right={<T size={14} weight="800" secondary>{fmtMoney(total)}</T>}>{kind === "expenses" ? "Expenses" : "Income"}</SectionTitle>
        {kind === "income" && carriedForward > 0 ? (
          <T size={12} muted style={{ marginBottom: 10 }}>{`Includes ${fmtMoney(carriedForward)} carried forward, not counted as earned income.`}</T>
        ) : null}
        {entries.length === 0 ? <EmptyState icon="receipt" msg={`No ${kind === "expenses" ? "expenses" : "income"} recorded yet.`} /> : (
          <>
            <LedgerFeed
              entries={entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)}
              kindFor={() => kind}
              onRowPress={(e) => setForm({ kind, existing: e })}
            />
            <Pager page={page} total={entries.length} pageSize={PAGE_SIZE} onChange={(p) => setPages((s) => ({ ...s, [kind]: p }))} />
          </>
        )}
      </Panel>

      {form ? <TransactionForm kind={form.kind} monthKey={monthKey} existing={form.existing} onClose={() => setForm(null)} /> : null}
    </TabPage>
  );
}
