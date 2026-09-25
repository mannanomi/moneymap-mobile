import React, { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { useStore } from "../store";
import { useTheme } from "../theme";
import {
  categoryIcon, categoryTileIndex, fmtMoney, isCarryForwardEntry, monthTotals, monthlyLimitFor, spentByCategory,
  totalCategoryBudget,
} from "../lib/logic";
import { BudgetDonut, ColumnChart, SavingsChart } from "./charts";
import { Btn, EmptyState, IconBadge, Icon, Panel, ProgressBar, SectionTitle, T } from "./ui";
import { CategoryBudgetsForm, MonthlyLimitForm } from "./forms";

// ---------- dashboard budget donut panel ----------

export function BudgetPanel({ monthKey }: { monthKey: string }) {
  const { data } = useStore();
  const t = useTheme();
  const [editing, setEditing] = useState<"limit" | "categories" | null>(null);
  const { expense } = monthTotals(data, monthKey);
  const { limit, derived } = monthlyLimitFor(data, monthKey);
  const remaining = limit - expense;
  return (
    <Panel style={{ gap: 14 }}>
      <SectionTitle right={<Btn small kind="ghost" label={derived ? "Edit budgets" : limit > 0 ? "Edit limit" : "Set limit"} onPress={() => setEditing(derived ? "categories" : "limit")} />}>
        Budget
      </SectionTitle>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
        <BudgetDonut spent={expense} limit={limit} size={132} />
        <View style={{ flex: 1, gap: 12 }}>
          <View>
            <T size={12} weight="600" muted>Spent</T>
            <T size={19} figure color={t.expense}>{fmtMoney(expense)}</T>
          </View>
          <View>
            <T size={12} weight="600" muted>{remaining < 0 ? "Over budget" : "Remaining"}</T>
            <T size={19} figure color={limit > 0 ? (remaining < 0 ? t.critical : t.good) : t.textMuted}>{limit > 0 ? fmtMoney(Math.abs(remaining)) : "—"}</T>
          </View>
          <T size={12} weight="600" muted>{limit > 0 ? `Monthly limit ${fmtMoney(limit)}` : "No limit set"}</T>
        </View>
      </View>
      {editing === "limit" ? <MonthlyLimitForm monthKey={monthKey} onClose={() => setEditing(null)} /> : null}
      {editing === "categories" ? <CategoryBudgetsForm monthKey={monthKey} onClose={() => setEditing(null)} /> : null}
    </Panel>
  );
}

// ---------- mini calendar ----------

export function MiniCalendar({ monthKey }: { monthKey: string }) {
  const { data } = useStore();
  const t = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const [year, month] = monthKey.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrev = new Date(year, month - 1, 0).getDate();
  const firstWeekday = (first.getDay() + 6) % 7;
  const m = data.months[monthKey];
  const activity: Record<number, { income: number; expense: number }> = {};
  for (const e of m.expenses) {
    if (!e.date) continue;
    const d = parseInt(e.date.split("-")[2], 10);
    activity[d] = activity[d] || { income: 0, expense: 0 };
    activity[d].expense += e.amount;
  }
  for (const e of m.income) {
    if (isCarryForwardEntry(e) || !e.date) continue;
    const d = parseInt(e.date.split("-")[2], 10);
    activity[d] = activity[d] || { income: 0, expense: 0 };
    activity[d].income += e.amount;
  }
  const today = new Date();
  const isCurrent = today.getFullYear() === year && today.getMonth() + 1 === month;

  const cells: { day: number; muted: boolean }[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: daysInPrev - firstWeekday + 1 + i, muted: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, muted: false });
  let nd = 1;
  while (cells.length % 7 !== 0) cells.push({ day: nd++, muted: true });

  const rows: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  const sel = selected ? activity[selected] || { income: 0, expense: 0 } : null;

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row" }}>
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <View key={d} style={{ flex: 1, alignItems: "center" }}><T size={11} muted weight="600">{d}</T></View>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row" }}>
          {row.map((c, ci) => {
            const act = !c.muted ? activity[c.day] : undefined;
            const isToday = isCurrent && !c.muted && c.day === today.getDate();
            const isSel = !c.muted && selected === c.day;
            return (
              <View key={ci} style={{ flex: 1, alignItems: "center", paddingVertical: 3 }}>
                <Pressable
                  onPress={() => { if (!c.muted) setSelected(isSel ? null : c.day); }}
                  style={{
                    width: 34, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", gap: 3,
                    backgroundColor: isSel ? t.surface3 : "transparent", borderWidth: isToday ? 1.5 : 0, borderColor: t.accent,
                  }}
                >
                  <T size={12.5} weight={isToday ? "800" : "500"} muted={c.muted} style={c.muted ? { opacity: 0.4 } : undefined}>{c.day}</T>
                  <View style={{ flexDirection: "row", gap: 3, height: 5 }}>
                    {act && act.income ? <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: t.income }} /> : null}
                    {act && act.expense ? <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: t.expense }} /> : null}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
      <T size={12} secondary align="center" style={{ marginTop: 4 }}>
        {selected && sel
          ? `${m.label.split(" ")[0]} ${selected} — Income: ${fmtMoney(sel.income)}, Expenses: ${fmtMoney(sel.expense)}`
          : "Tap a day to see its totals"}
      </T>
    </View>
  );
}

// ---------- income-vs-expense + net savings comparison ----------

export function ComparePanel({ title, items, chartHeight = 150 }: {
  title: string; items: { label: string; income: number; expense: number; net: number }[]; chartHeight?: number;
}) {
  const t = useTheme();
  if (items.length < 2) return null;
  return (
    <Panel style={{ gap: 16 }}>
      <SectionTitle>{title}</SectionTitle>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <T size={12.5} weight="700" secondary>Income vs. expenses</T>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: t.income }} /><T size={11.5} secondary>Income</T>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: t.expense }} /><T size={11.5} secondary>Expenses</T>
            </View>
          </View>
        </View>
        <ColumnChart items={items} height={chartHeight} />
      </View>
      <View style={{ gap: 8 }}>
        <T size={12.5} weight="700" secondary>Net savings</T>
        <SavingsChart items={items} height={chartHeight * 0.85} />
      </View>
    </Panel>
  );
}

// ---------- spending-by-category / income-by-source panel with drill-down ----------

import { categoryBreakdown } from "../lib/logic";
import type { Entry } from "../types";
import { CategoryBreakdown } from "./charts";
import { TransactionListSheet } from "./feed";

export function BreakdownPanel({ title, entries, kind, scopeLabel, emptyMsg }: {
  title: string; entries: Entry[]; kind: "income" | "expenses"; scopeLabel: string; emptyMsg: string;
}) {
  const [drill, setDrill] = useState<string | null>(null);
  const breakdown = useMemo(() => categoryBreakdown(entries), [entries]);
  const total = entries.reduce((s, e) => s + e.amount, 0);
  return (
    <Panel>
      <SectionTitle right={<T size={13} secondary>{`${fmtMoney(total)} total`}</T>}>{title}</SectionTitle>
      {breakdown.length === 0 ? <EmptyState msg={emptyMsg} /> : (
        <CategoryBreakdown breakdown={breakdown} total={total} kind={kind} onPress={setDrill} />
      )}
      {drill ? (
        <TransactionListSheet
          visible title={drill} scopeLabel={scopeLabel} onClose={() => setDrill(null)}
          entries={entries.filter((e) => e.category === drill)}
        />
      ) : null}
    </Panel>
  );
}
