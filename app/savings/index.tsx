import React, { useState } from "react";
import { router } from "expo-router";
import { useStore } from "../../src/store";
import { useTheme } from "../../src/theme";
import { SAVINGS_PLAN_TYPES, fmtMoney, planTotals, typeOf } from "../../src/lib/logic";
import { PushedPage } from "../../src/components/scaffold";
import { Btn, EmptyState, PageHeader, Panel, ProgressBar, StatRow, StatTile, T } from "../../src/components/ui";
import { Tile } from "../../src/components/feed";
import { PlanForm } from "../../src/components/forms";

export default function SavingsPlans() {
  const { data } = useStore();
  const t = useTheme();
  const [adding, setAdding] = useState(false);
  const list = data.savingsPlans;
  const totals = list.map(planTotals);
  return (
    <PushedPage>
      <PageHeader icon="piggy" title="Savings plans" sub={`${list.length} plan${list.length === 1 ? "" : "s"}`} right={<Btn small kind="primary" label="+ Add plan" onPress={() => setAdding(true)} />} />
      {!list.length ? (
        <Panel><EmptyState msg={'No savings plans yet — use "+ Add plan" to start one.'} /></Panel>
      ) : (
        <>
          <StatRow>
            <StatTile label="Total saved" value={fmtMoney(totals.reduce((s, x) => s + x.saved, 0))} tone="good" />
            <StatTile label="Total target" value={fmtMoney(totals.reduce((s, x) => s + x.target, 0))} />
          </StatRow>
          {list.map((plan, idx) => {
            const ty = typeOf(SAVINGS_PLAN_TYPES, plan.goalType);
            const tt = planTotals(plan);
            return (
              <Tile
                key={plan.id} icon={ty.icon} color={t.tiles[idx % 8]} name={plan.name || "Untitled plan"} sub={ty.label}
                onPress={() => router.push({ pathname: "/savings/[id]", params: { id: plan.id } })}
              >
                <ProgressBar pct={tt.pct} color={tt.pct >= 1 ? t.good : t.accent} />
                <T size={12.5} secondary>{`${fmtMoney(tt.saved)} of ${fmtMoney(tt.target)} · ${Math.round(tt.pct * 100)}%`}</T>
              </Tile>
            );
          })}
        </>
      )}
      {adding ? <PlanForm existing={null} onClose={() => setAdding(false)} /> : null}
    </PushedPage>
  );
}
