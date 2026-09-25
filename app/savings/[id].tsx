import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../../src/store";
import { useTheme } from "../../src/theme";
import { SAVINGS_PLAN_TYPES, fmtDate, fmtMoney, planTotals, typeOf } from "../../src/lib/logic";
import type { Contribution } from "../../src/types";
import { PushedPage } from "../../src/components/scaffold";
import { Btn, EmptyState, PageHeader, Panel, ProgressBar, SectionTitle, StatRow, StatTile, T } from "../../src/components/ui";
import { confirmAction } from "../../src/components/feed";
import { ContributionForm, PlanForm } from "../../src/components/forms";

export default function PlanDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, update } = useStore();
  const t = useTheme();
  const [editing, setEditing] = useState(false);
  const [contrib, setContrib] = useState<{ existing: Contribution | null } | null>(null);
  const plan = data.savingsPlans.find((p) => p.id === id);
  if (!plan) return <PushedPage><EmptyState msg="That savings plan no longer exists." /></PushedPage>;
  const tt = planTotals(plan);
  const ty = typeOf(SAVINGS_PLAN_TYPES, plan.goalType);
  const done = tt.pct >= 1;
  const list = [...(plan.contributions || [])].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const del = () => {
    const n = (plan.contributions || []).length;
    confirmAction(
      "Delete plan",
      n ? `Delete "${plan.name}" and its ${n} logged contribution${n === 1 ? "" : "s"}? This cannot be undone.` : `Delete "${plan.name}"?`,
      "Delete",
      () => { update((d) => { d.savingsPlans = d.savingsPlans.filter((p) => p.id !== plan.id); }); router.back(); },
    );
  };

  return (
    <PushedPage>
      <PageHeader icon={ty.icon} title={plan.name || "Untitled plan"} sub={`${ty.label}${plan.targetDate ? " · Target date " + fmtDate(plan.targetDate) : ""}`} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Btn small label="Edit plan" style={{ flex: 1 }} onPress={() => setEditing(true)} />
        <Btn small kind="danger" label="Delete plan" style={{ flex: 1 }} onPress={del} />
      </View>
      <StatRow>
        <StatTile label="Saved so far" value={fmtMoney(tt.saved)} tone="good" />
        <StatTile label="Target" value={fmtMoney(tt.target)} />
        <StatTile label="Remaining" value={done ? "Goal reached" : fmtMoney(tt.remaining)} tone={done ? "good" : "critical"} />
        <StatTile label="Progress" value={`${Math.round(tt.pct * 100)}%`} />
      </StatRow>
      <ProgressBar pct={tt.pct} color={done ? t.good : t.accent} height={12} />
      <Panel>
        <SectionTitle right={<Btn small kind="primary" label="+ Add contribution" onPress={() => setContrib({ existing: null })} />}>
          {`Contributions (${list.length})`}
        </SectionTitle>
        {!list.length ? <EmptyState msg="No contributions logged yet." /> : list.map((c, i) => (
          <Pressable
            key={c.id} onPress={() => setContrib({ existing: c })}
            style={({ pressed }) => ({ paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: i ? 1 : 0, borderTopColor: t.border, opacity: pressed ? 0.7 : 1 })}
          >
            <View style={{ flex: 1 }}>
              <T size={13} weight="600">{fmtDate(c.date)}</T>
              {c.note ? <T size={12} muted>{c.note}</T> : null}
            </View>
            <T size={14} figure color={t.good}>{fmtMoney(c.amount || 0)}</T>
          </Pressable>
        ))}
      </Panel>
      {editing ? <PlanForm existing={plan} onClose={() => setEditing(false)} /> : null}
      {contrib ? <ContributionForm planId={plan.id} existing={contrib.existing} onClose={() => setContrib(null)} /> : null}
    </PushedPage>
  );
}
