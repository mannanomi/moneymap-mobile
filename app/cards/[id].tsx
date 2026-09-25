import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useStore } from "../../src/store";
import { useTheme } from "../../src/theme";
import { cardTotals, fmtDate, fmtMoney } from "../../src/lib/logic";
import type { Payment } from "../../src/types";
import { PushedPage } from "../../src/components/scaffold";
import { Btn, EmptyState, Panel, SectionTitle, StatRow, StatTile, T } from "../../src/components/ui";
import { CardVisual, confirmAction } from "../../src/components/feed";
import { CardForm, PaymentForm } from "../../src/components/forms";

export default function CardDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, update } = useStore();
  const t = useTheme();
  const [editing, setEditing] = useState(false);
  const [pay, setPay] = useState<{ existing: Payment | null } | null>(null);
  const card = data.cards.find((c) => c.id === id);
  if (!card) return <PushedPage><EmptyState msg="That card no longer exists." /></PushedPage>;
  const tot = cardTotals(card);
  const payments = [...(card.payments || [])].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const del = () => {
    const n = (card.payments || []).length;
    confirmAction(
      "Delete card",
      n ? `Delete "${card.name}" and its ${n} logged repayment${n === 1 ? "" : "s"}? This cannot be undone.` : `Delete "${card.name}"?`,
      "Delete",
      () => { update((d) => { d.cards = d.cards.filter((c) => c.id !== card.id); }); router.back(); },
    );
  };

  const parts: [string, string, number][] = [
    ["Off the balance", t.good, tot.principal], ["Interest", t.critical, tot.interest], ["Fees", t.tiles[3], tot.fees],
  ];

  return (
    <PushedPage>
      <CardVisual card={card} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Btn small label="Edit card" style={{ flex: 1 }} onPress={() => setEditing(true)} />
        <Btn small kind="danger" label="Delete card" style={{ flex: 1 }} onPress={del} />
      </View>
      <StatRow>
        <StatTile label="Left to pay" value={fmtMoney(tot.owing)} tone="critical" />
        <StatTile label="Repaid so far" value={fmtMoney(tot.paid)} tone="good" />
        <StatTile label="Interest paid" value={fmtMoney(tot.interest)} />
        <StatTile label="Fees paid" value={fmtMoney(tot.fees)} />
        <StatTile label="Available credit" value={tot.limit > 0 ? fmtMoney(tot.available) : "—"} />
        <StatTile label="Original amount owing" value={fmtMoney(card.owing || 0)} />
      </StatRow>

      {tot.paid > 0 ? (
        <Panel style={{ gap: 10 }}>
          <SectionTitle>Where your repayments went</SectionTitle>
          <View style={{ flexDirection: "row", height: 12, borderRadius: 6, overflow: "hidden", backgroundColor: t.surface3 }}>
            {parts.filter(([, , a]) => a > 0).map(([label, color, amt]) => (
              <View key={label} style={{ width: `${(amt / tot.paid) * 100}%`, backgroundColor: color }} />
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {parts.filter(([, , a]) => a > 0).map(([label, color, amt]) => (
              <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color }} />
                <T size={12} secondary>{`${label} ${fmtMoney(amt)}`}</T>
              </View>
            ))}
          </View>
        </Panel>
      ) : null}

      <Panel>
        <SectionTitle right={<Btn small kind="primary" label="+ Add repayment" onPress={() => setPay({ existing: null })} />}>
          {`Repayments (${payments.length})`}
        </SectionTitle>
        {!payments.length ? <EmptyState msg="No repayments logged yet." /> : payments.map((p, i) => {
          const off = (p.amount || 0) - (p.interest || 0) - (p.fee || 0);
          return (
            <Pressable
              key={p.id} onPress={() => setPay({ existing: p })}
              style={({ pressed }) => ({ paddingVertical: 10, gap: 3, borderTopWidth: i ? 1 : 0, borderTopColor: t.border, opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <T size={13} weight="600">{fmtDate(p.date)}</T>
                <T size={14} figure>{fmtMoney(p.amount || 0)}</T>
              </View>
              <T size={12} muted>
                {`Interest ${p.interest ? fmtMoney(p.interest) : "—"} · Fee ${p.fee ? fmtMoney(p.fee) : "—"} · Off balance `}
                <T size={12} weight="700" color={t.good}>{fmtMoney(off)}</T>
              </T>
              {p.note ? <T size={12} secondary>{p.note}</T> : null}
            </Pressable>
          );
        })}
        {payments.length ? <T size={11.5} muted style={{ marginTop: 6 }}>Tap a repayment to edit it.</T> : null}
      </Panel>

      {editing ? <CardForm existing={card} onClose={() => setEditing(false)} /> : null}
      {pay ? (
        <PaymentForm
          cardId={card.id} existing={pay.existing} onClose={() => setPay(null)}
        />
      ) : null}
    </PushedPage>
  );
}
