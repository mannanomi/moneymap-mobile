import React, { useState } from "react";
import { useStore } from "../src/store";
import { useTheme } from "../src/theme";
import { BANK_ACCOUNT_TYPES, fmtMoney, typeOf } from "../src/lib/logic";
import type { BankAccount } from "../src/types";
import { PushedPage } from "../src/components/scaffold";
import { Btn, EmptyState, PageHeader, Panel, StatRow, StatTile, T } from "../src/components/ui";
import { Tile } from "../src/components/feed";
import { BankAccountForm } from "../src/components/forms";

export default function Accounts() {
  const { data } = useStore();
  const t = useTheme();
  const [form, setForm] = useState<{ existing: BankAccount | null } | null>(null);
  const list = data.bankAccounts;
  const total = list.reduce((s, a) => s + (a.balance || 0), 0);
  return (
    <PushedPage>
      <PageHeader icon="bank" title="Bank accounts" sub={`${list.length} account${list.length === 1 ? "" : "s"} tracked`} right={<Btn small kind="primary" label="+ Add account" onPress={() => setForm({ existing: null })} />} />
      {!list.length ? (
        <Panel><EmptyState msg={'No bank accounts yet — use "+ Add account" to add your first one.'} /></Panel>
      ) : (
        <>
          <StatRow><StatTile label="Total balance" value={fmtMoney(total)} tone="good" /></StatRow>
          {list.map((acc, idx) => {
            const ty = typeOf(BANK_ACCOUNT_TYPES, acc.type);
            return (
              <Tile
                key={acc.id} icon={ty.icon} color={t.tiles[idx % 8]} name={acc.name || "Untitled account"}
                sub={acc.bank ? `${acc.bank} · ${ty.label}` : ty.label} onPress={() => setForm({ existing: acc })}
              >
                <T size={20} figure>{fmtMoney(acc.balance || 0)}</T>
              </Tile>
            );
          })}
        </>
      )}
      {form ? <BankAccountForm existing={form.existing} onClose={() => setForm(null)} /> : null}
    </PushedPage>
  );
}
