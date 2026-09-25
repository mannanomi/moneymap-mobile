import React, { useState } from "react";
import { useStore } from "../src/store";
import { useTheme } from "../src/theme";
import { INVESTMENT_TYPES, fmtMoney, investmentTotals, typeOf } from "../src/lib/logic";
import type { Investment } from "../src/types";
import { PushedPage } from "../src/components/scaffold";
import { Btn, EmptyState, PageHeader, Panel, StatRow, StatTile, T } from "../src/components/ui";
import { Tile } from "../src/components/feed";
import { InvestmentForm } from "../src/components/forms";

export default function Investments() {
  const { data } = useStore();
  const t = useTheme();
  const [form, setForm] = useState<{ existing: Investment | null } | null>(null);
  const list = data.investments;
  const totals = list.map(investmentTotals);
  const marketValue = totals.reduce((s, x) => s + x.marketValue, 0);
  const costBasis = totals.reduce((s, x) => s + x.costBasis, 0);
  const gain = marketValue - costBasis;
  const gainPct = costBasis > 0 ? gain / costBasis : 0;
  return (
    <PushedPage>
      <PageHeader icon="trend" title="Investments" sub={`${list.length} holding${list.length === 1 ? "" : "s"} tracked`} right={<Btn small kind="primary" label="+ Add" onPress={() => setForm({ existing: null })} />} />
      {!list.length ? (
        <Panel><EmptyState msg={'No investments yet — use "+ Add" to add your first one.'} /></Panel>
      ) : (
        <>
          <StatRow>
            <StatTile label="Total market value" value={fmtMoney(marketValue)} />
            <StatTile label="Total cost basis" value={fmtMoney(costBasis)} />
            <StatTile label="Total gain / loss" value={`${fmtMoney(gain)} (${gain >= 0 ? "+" : ""}${(gainPct * 100).toFixed(1)}%)`} tone={gain >= 0 ? "good" : "critical"} />
          </StatRow>
          {list.map((inv, idx) => {
            const tt = totals[idx];
            const ty = typeOf(INVESTMENT_TYPES, inv.type);
            return (
              <Tile
                key={inv.id} icon={ty.icon} color={t.tiles[idx % 8]} name={inv.name || "Untitled holding"}
                sub={`${inv.units || 0} units · ${ty.label}`} onPress={() => setForm({ existing: inv })}
              >
                <T size={20} figure>{fmtMoney(tt.marketValue)}</T>
                <T size={13} weight="700" color={tt.gain >= 0 ? t.good : t.critical}>
                  {`${tt.gain >= 0 ? "+" : ""}${fmtMoney(tt.gain)} (${tt.gain >= 0 ? "+" : ""}${(tt.gainPct * 100).toFixed(1)}%)`}
                </T>
              </Tile>
            );
          })}
        </>
      )}
      {form ? <InvestmentForm existing={form.existing} onClose={() => setForm(null)} /> : null}
    </PushedPage>
  );
}
