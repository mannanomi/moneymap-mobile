import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { useStore } from "../src/store";
import {
  SearchFilters, categoriesInUse, categoryBreakdown, defaultSearchFilters, fmtMoney, runSearch, sortedMonthKeys,
} from "../src/lib/logic";
import type { Entry, Kind } from "../src/types";
import { PushedPage } from "../src/components/scaffold";
import { Btn, EmptyState, PageHeader, Panel, SectionTitle, SelectField, StatRow, StatTile, T, TextField } from "../src/components/ui";
import { LedgerFeed, Pager } from "../src/components/feed";
import { BarList, CategoryBreakdown } from "../src/components/charts";
import { TransactionForm } from "../src/components/forms";

const PAGE_SIZE = 10;

export default function Search() {
  const { data } = useStore();
  const [filters, setFilters] = useState<SearchFilters>(() => defaultSearchFilters(data));
  const [page, setPage] = useState(0);
  const [form, setForm] = useState<{ kind: Kind; monthKey: string; existing: Entry } | null>(null);
  const allKeys = sortedMonthKeys(data);

  const patch = (p: Partial<SearchFilters>) => { setFilters((f) => ({ ...f, ...p })); setPage(0); };
  const { matches, total, perMonth } = useMemo(() => runSearch(data, filters), [data, filters]);

  const catSource = filters.kind === "both"
    ? [...new Set([...categoriesInUse(data, "expenses"), ...categoriesInUse(data, "income")])].sort()
    : categoriesInUse(data, filters.kind);
  const monthOpts = allKeys.map((k) => ({ value: k, label: data.months[k].label }));
  const monthsSpanned = perMonth.size;
  const avg = monthsSpanned ? total / monthsSpanned : 0;
  const lbl = (k: string) => (data.months[k] ? data.months[k].label : "");
  const rangeLabel = filters.from === filters.to ? lbl(filters.from) : `${lbl(filters.from)} – ${lbl(filters.to)}`;
  const keysInRange = allKeys.filter((k) => k >= filters.from && k <= filters.to);
  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const pg = Math.min(page, totalPages - 1);
  const kindTone = filters.kind === "expenses" ? "critical" : filters.kind === "income" ? "good" : null;

  return (
    <PushedPage>
      <PageHeader icon="search" title="Search & filter" sub="Find any transaction across every month" />
      <Panel style={{ gap: 14 }}>
        <SelectField
          label="Type" value={filters.kind} onChange={(v) => patch({ kind: v, category: "all" })}
          options={[{ value: "expenses", label: "Expenses" }, { value: "income", label: "Income" }, { value: "both", label: "Both" }]}
        />
        <SelectField
          label="Category" value={filters.category} onChange={(v) => patch({ category: v })}
          options={[{ value: "all", label: "All categories" }, ...catSource.map((c) => ({ value: c, label: c }))]}
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <SelectField label="From" value={filters.from} options={monthOpts}
              onChange={(v) => patch({ from: v, to: filters.to && v > filters.to ? v : filters.to })} />
          </View>
          <View style={{ flex: 1 }}>
            <SelectField label="To" value={filters.to} options={monthOpts}
              onChange={(v) => patch({ to: v, from: filters.from && v < filters.from ? v : filters.from })} />
          </View>
        </View>
        <TextField label="Description contains" value={filters.text} onChangeText={(s) => patch({ text: s })} placeholder="e.g. Uber, Bupa…" autoCapitalize="none" />
        <Btn small kind="ghost" label="Reset" onPress={() => { setFilters(defaultSearchFilters(data)); setPage(0); }} />
      </Panel>

      <StatRow>
        <StatTile label={filters.category === "all" ? "Total" : `Total · ${filters.category}`} value={fmtMoney(total)} tone={kindTone as any} />
        <StatTile label="Transactions" value={String(matches.length)} />
        <StatTile label="Average per month" value={fmtMoney(avg)} />
      </StatRow>
      {rangeLabel ? <T size={12} muted>{`${rangeLabel} · ${monthsSpanned} month${monthsSpanned === 1 ? "" : "s"} with activity`}</T> : null}

      {!matches.length ? (
        <Panel><EmptyState msg="No transactions match these filters." /></Panel>
      ) : (
        <>
          {keysInRange.length > 1 ? (
            <Panel>
              <SectionTitle>By month</SectionTitle>
              <BarList
                total={total}
                rows={keysInRange.map((k) => ({ category: data.months[k].label, amount: perMonth.get(k) || 0 })).filter((b) => b.amount > 0)}
              />
            </Panel>
          ) : null}
          {filters.category === "all" ? (
            <Panel>
              <SectionTitle>By category</SectionTitle>
              <CategoryBreakdown
                breakdown={categoryBreakdown(matches)} total={total} kind={filters.kind === "income" ? "income" : "expenses"}
                onPress={(c) => patch({ category: c })}
              />
            </Panel>
          ) : null}
          <Panel>
            <SectionTitle>{`Matching transactions (${matches.length})`}</SectionTitle>
            <LedgerFeed
              entries={matches.slice(pg * PAGE_SIZE, (pg + 1) * PAGE_SIZE)}
              kindFor={(e) => (e as any).kind as Kind}
              onRowPress={(e, kind) => setForm({ kind, monthKey: (e as any).monthKey, existing: e })}
            />
            <Pager page={pg} total={matches.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </Panel>
        </>
      )}
      {form ? <TransactionForm kind={form.kind} monthKey={form.monthKey} existing={form.existing} onClose={() => setForm(null)} /> : null}
    </PushedPage>
  );
}
