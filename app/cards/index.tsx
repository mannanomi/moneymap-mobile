import React, { useState } from "react";
import { router } from "expo-router";
import { useStore } from "../../src/store";
import { PushedPage } from "../../src/components/scaffold";
import { Btn, EmptyState, PageHeader, Panel } from "../../src/components/ui";
import { CardVisual } from "../../src/components/feed";
import { CardForm } from "../../src/components/forms";
import { cardTotals, fmtMoney } from "../../src/lib/logic";
import { StatRow, StatTile } from "../../src/components/ui";

export default function Cards() {
  const { data } = useStore();
  const [adding, setAdding] = useState(false);
  const list = data.cards;
  const totals = list.map(cardTotals);
  return (
    <PushedPage>
      <PageHeader icon="card" title="Cards" sub={`${list.length} card${list.length === 1 ? "" : "s"} tracked`} right={<Btn small kind="primary" label="+ Add card" onPress={() => setAdding(true)} />} />
      {!list.length ? (
        <Panel><EmptyState msg={'No cards yet — use "+ Add card" to track your first one.'} /></Panel>
      ) : (
        <>
          <StatRow>
            <StatTile label="Total left to pay" value={fmtMoney(totals.reduce((s, t) => s + t.owing, 0))} tone="critical" />
            <StatTile label="Total repaid" value={fmtMoney(totals.reduce((s, t) => s + t.paid, 0))} tone="good" />
          </StatRow>
          {list.map((c) => <CardVisual key={c.id} card={c} onPress={() => router.push({ pathname: "/cards/[id]", params: { id: c.id } })} />)}
        </>
      )}
      {adding ? <CardForm existing={null} onClose={() => setAdding(false)} /> : null}
    </PushedPage>
  );
}
