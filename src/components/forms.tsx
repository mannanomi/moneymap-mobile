import React, { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { useStore } from "../store";
import { useTheme, ACCENTS, THEMES } from "../theme";
import {
  BANK_ACCOUNT_TYPES, CARD_THEMES, INVESTMENT_TYPES, MONTH_NAMES, SAVINGS_PLAN_TYPES, categoryIcon,
  categoryTileIndex, defaultDateForMonth, fmtMoney, nextSuggestedMonth, round2, spentByCategory, todayISO, uid,
} from "../lib/logic";
import type { BankAccount, CreditCard, Entry, Investment, Kind, Payment, SavingsPlan, Contribution } from "../types";
import {
  Btn, DateField, FormActions, Field, Icon, SelectField, Sheet, T, TextField, parseNum,
} from "./ui";
import { confirmAction } from "./feed";

const numStr = (n: number | undefined | null) => (n ? String(n) : "");

// ---------- transaction ----------

export function TransactionForm({
  kind, monthKey, existing, onClose,
}: { kind: Kind; monthKey: string; existing: Entry | null; onClose: () => void }) {
  const { data, update, showToast } = useStore();
  const t = useTheme();
  const categories = kind === "expenses" ? data.expenseCategories : data.incomeCategories;
  const [date, setDate] = useState(existing ? existing.date || "" : defaultDateForMonth(monthKey));
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [desc, setDesc] = useState(existing ? existing.description : "");
  const [category, setCategory] = useState(existing ? existing.category : categories[0] || "");
  const label = kind === "expenses" ? "expense" : "income";

  const save = () => {
    const amt = parseNum(amount);
    if (!desc.trim() || Number.isNaN(amt) || amt < 0) { showToast("Please enter a valid description and amount.", true); return; }
    update((d) => {
      const arr = d.months[monthKey][kind];
      if (existing) {
        const e = arr.find((x) => x.id === existing.id);
        if (e) Object.assign(e, { date: date || null, amount: amt, description: desc.trim(), category });
      } else {
        arr.push({ id: uid(kind[0]), date: date || null, amount: amt, description: desc.trim(), category });
      }
    });
    onClose();
  };
  const del = () => {
    confirmAction("Delete transaction", `Delete "${existing?.description}"?`, "Delete", () => {
      update((d) => { d.months[monthKey][kind] = d.months[monthKey][kind].filter((x) => x.id !== existing!.id); });
      onClose();
    });
  };

  return (
    <Sheet visible title={existing ? `Edit ${label}` : `Add ${label}`} onClose={onClose}>
      <DateField label="Date" value={date} onChange={setDate} />
      <TextField label="Amount (AUD)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
      <TextField label="Description" value={desc} onChangeText={setDesc} />
      <SelectField
        label="Category" value={category} onChange={setCategory}
        options={categories.map((c) => ({ value: c, label: c, icon: categoryIcon(c), color: t.tiles[categoryTileIndex(data, c, kind)] }))}
      />
      <FormActions>
        {existing ? <Btn kind="danger" label="Delete" onPress={del} /> : null}
        <Btn label="Cancel" onPress={onClose} />
        <Btn kind="primary" label={existing ? "Save" : "Add"} onPress={save} />
      </FormActions>
    </Sheet>
  );
}

// ---------- monthly limit ----------

export function MonthlyLimitForm({ monthKey, onClose }: { monthKey: string; onClose: () => void }) {
  const { data, update } = useStore();
  const [val, setVal] = useState(numStr(data.months[monthKey]?.monthlyLimit));
  return (
    <Sheet visible title="Set monthly limit" onClose={onClose}>
      <TextField label="Monthly limit (AUD)" value={val} onChangeText={setVal} keyboardType="decimal-pad" />
      <FormActions>
        <Btn label="Cancel" onPress={onClose} />
        <Btn kind="primary" label="Save" onPress={() => {
          const v = parseNum(val);
          update((d) => { d.months[monthKey].monthlyLimit = Number.isNaN(v) || v <= 0 ? 0 : v; });
          onClose();
        }} />
      </FormActions>
    </Sheet>
  );
}

// ---------- category budgets ----------

export function CategoryBudgetsForm({ monthKey, onClose }: { monthKey: string; onClose: () => void }) {
  const { data, update } = useStore();
  const spent = useMemo(() => spentByCategory(data, monthKey), [data, monthKey]);
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const c of data.expenseCategories) o[c] = data.categoryBudgets[c] > 0 ? String(data.categoryBudgets[c]) : "";
    return o;
  });
  const t = useTheme();
  return (
    <Sheet visible title="Category budgets" onClose={onClose}>
      <T size={12.5} secondary>A monthly limit per category, applied to every month. Leave blank or 0 for no budget.</T>
      {data.expenseCategories.map((c) => (
        <View key={c} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Icon name={categoryIcon(c)} size={18} color={t.textSecondary} />
          <View style={{ flex: 1 }}>
            <T size={14} numberOfLines={1}>{c}</T>
            {spent.get(c) ? <T size={11} muted>{`${fmtMoney(spent.get(c)!)} this month`}</T> : null}
          </View>
          <View style={{ width: 110 }}>
            <TextField label="" value={vals[c]} onChangeText={(s) => setVals((v) => ({ ...v, [c]: s }))} keyboardType="decimal-pad" placeholder="—" />
          </View>
        </View>
      ))}
      <FormActions>
        <Btn label="Cancel" onPress={onClose} />
        <Btn kind="primary" label="Save budgets" onPress={() => {
          const next: Record<string, number> = {};
          for (const c of Object.keys(vals)) {
            const v = parseNum(vals[c]);
            if (!Number.isNaN(v) && v > 0) next[c] = round2(v);
          }
          update((d) => { d.categoryBudgets = next; });
          onClose();
        }} />
      </FormActions>
    </Sheet>
  );
}

// ---------- credit card ----------

export function CardForm({ existing, onClose }: { existing: CreditCard | null; onClose: () => void }) {
  const { update, showToast } = useStore();
  const [name, setName] = useState(existing?.name || "");
  const [issuer, setIssuer] = useState(existing?.issuer || "");
  const [network, setNetwork] = useState(existing?.network || "");
  const [last4, setLast4] = useState(existing?.last4 || "");
  const [limit, setLimit] = useState(numStr(existing?.limit));
  const [owing, setOwing] = useState(numStr(existing?.owing));
  const [theme, setTheme] = useState(existing?.theme || "midnight");
  const num = (s: string) => { const v = parseNum(s); return Number.isNaN(v) || v < 0 ? 0 : round2(v); };

  const save = () => {
    if (!name.trim()) { showToast("Give the card a name.", true); return; }
    const payload = {
      name: name.trim(), issuer: issuer.trim(), network: network.trim(),
      last4: last4.replace(/\D/g, "").slice(-4), limit: num(limit), owing: num(owing), theme,
    };
    update((d) => {
      if (existing) { const c = d.cards.find((x) => x.id === existing.id); if (c) Object.assign(c, payload); }
      else d.cards.push({ id: uid("card"), payments: [], ...payload });
    });
    onClose();
  };

  return (
    <Sheet visible title={existing ? "Edit card" : "Add a card"} onClose={onClose}>
      <TextField label="Card name" value={name} onChangeText={setName} placeholder="e.g. CommBank Low Rate" />
      <TextField label="Bank / issuer" value={issuer} onChangeText={setIssuer} placeholder="e.g. CommBank" />
      <TextField label="Network (optional)" value={network} onChangeText={setNetwork} placeholder="VISA" />
      <TextField label="Last 4 digits" value={last4} onChangeText={setLast4} keyboardType="number-pad" maxLength={4} placeholder="1234" />
      <TextField label="Credit limit" value={limit} onChangeText={setLimit} keyboardType="decimal-pad" />
      <TextField label="Amount owing" value={owing} onChangeText={setOwing} keyboardType="decimal-pad" hint="What you owe right now. Repayments you log are subtracted from this." />
      <Field label="Card colour">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {CARD_THEMES.map((th) => (
            <Pressable
              key={th.id}
              onPress={() => setTheme(th.id)}
              style={{
                width: 40, height: 40, borderRadius: 12, backgroundColor: th.colors[0], borderWidth: 3,
                borderColor: theme === th.id ? "#fff" : "transparent", outlineColor: "#888",
                shadowColor: "#000", shadowOpacity: theme === th.id ? 0.4 : 0, shadowRadius: 4,
                alignItems: "center", justifyContent: "center",
              }}
            >
              {theme === th.id ? <Icon name="check" size={18} color="#fff" /> : null}
            </Pressable>
          ))}
        </View>
      </Field>
      <FormActions>
        <Btn label="Cancel" onPress={onClose} />
        <Btn kind="primary" label={existing ? "Save changes" : "Add card"} onPress={save} />
      </FormActions>
    </Sheet>
  );
}

export function PaymentForm({ cardId, existing, onClose }: { cardId: string; existing: Payment | null; onClose: () => void }) {
  const { update, showToast } = useStore();
  const t = useTheme();
  const [date, setDate] = useState(existing?.date || todayISO());
  const [amount, setAmount] = useState(numStr(existing?.amount));
  const [interest, setInterest] = useState(numStr(existing?.interest));
  const [fee, setFee] = useState(numStr(existing?.fee));
  const [note, setNote] = useState(existing?.note || "");
  const num = (s: string) => { const v = parseNum(s); return Number.isNaN(v) || v < 0 ? 0 : round2(v); };
  const a = num(amount), i = num(interest), f = num(fee);
  const off = a - i - f;

  const save = () => {
    if (a <= 0) { showToast("Enter the amount paid.", true); return; }
    if (i + f > a) { showToast("Interest and fee can't exceed the amount paid.", true); return; }
    const payload = { date: date || todayISO(), amount: a, interest: i, fee: f, note: note.trim() };
    update((d) => {
      const card = d.cards.find((c) => c.id === cardId);
      if (!card) return;
      if (existing) { const p = card.payments.find((x) => x.id === existing.id); if (p) Object.assign(p, payload); }
      else card.payments.push({ id: uid("pay"), ...payload });
    });
    onClose();
  };

  return (
    <Sheet visible title={existing ? "Edit repayment" : "Add a repayment"} onClose={onClose}>
      <DateField label="Date" value={date} onChange={setDate} />
      <TextField label="Amount paid" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <TextField label="Interest charged" value={interest} onChangeText={setInterest} keyboardType="decimal-pad" />
      <TextField label="Monthly fee" value={fee} onChangeText={setFee} keyboardType="decimal-pad" />
      <TextField label="Note (optional)" value={note} onChangeText={setNote} />
      <T size={12.5} color={off < 0 ? t.critical : t.textSecondary}>
        {off < 0
          ? `Interest and fee (${fmtMoney(i + f)}) exceed the amount paid (${fmtMoney(a)}).`
          : `${fmtMoney(off)} of this comes off the balance.`}
      </T>
      <FormActions>
        <Btn label="Cancel" onPress={onClose} />
        <Btn kind="primary" label={existing ? "Save changes" : "Add repayment"} onPress={save} />
      </FormActions>
    </Sheet>
  );
}

// ---------- savings plan ----------

export function PlanForm({ existing, onClose }: { existing: SavingsPlan | null; onClose: () => void }) {
  const { update, showToast } = useStore();
  const [name, setName] = useState(existing?.name || "");
  const [goalType, setGoalType] = useState(existing?.goalType || "other");
  const [target, setTarget] = useState(numStr(existing?.target));
  const [targetDate, setTargetDate] = useState(existing?.targetDate || "");
  const t = useTheme();
  const save = () => {
    if (!name.trim()) { showToast("Give the plan a name.", true); return; }
    const tv = parseNum(target);
    const payload = { name: name.trim(), goalType, target: Number.isNaN(tv) || tv < 0 ? 0 : round2(tv), targetDate: targetDate || null };
    update((d) => {
      if (existing) { const p = d.savingsPlans.find((x) => x.id === existing.id); if (p) Object.assign(p, payload); }
      else d.savingsPlans.push({ id: uid("plan"), contributions: [], ...payload });
    });
    onClose();
  };
  return (
    <Sheet visible title={existing ? "Edit savings plan" : "Add a savings plan"} onClose={onClose}>
      <TextField label="Plan name" value={name} onChangeText={setName} placeholder="e.g. Bali Trip 2027" />
      <SelectField
        label="Goal type" value={goalType} onChange={setGoalType}
        options={SAVINGS_PLAN_TYPES.map((x, i) => ({ value: x.id, label: x.label, icon: x.icon, color: t.tiles[i % 8] }))}
      />
      <TextField label="Target amount" value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
      <DateField label="Target date (optional)" value={targetDate} onChange={setTargetDate} optional />
      <FormActions>
        <Btn label="Cancel" onPress={onClose} />
        <Btn kind="primary" label={existing ? "Save changes" : "Add plan"} onPress={save} />
      </FormActions>
    </Sheet>
  );
}

export function ContributionForm({ planId, existing, onClose }: { planId: string; existing: Contribution | null; onClose: () => void }) {
  const { update, showToast } = useStore();
  const [date, setDate] = useState(existing?.date || todayISO());
  const [amount, setAmount] = useState(numStr(existing?.amount));
  const [note, setNote] = useState(existing?.note || "");
  const save = () => {
    const a = parseNum(amount);
    if (Number.isNaN(a) || a <= 0) { showToast("Enter a valid amount.", true); return; }
    const payload = { date: date || todayISO(), amount: round2(a), note: note.trim() };
    update((d) => {
      const plan = d.savingsPlans.find((p) => p.id === planId);
      if (!plan) return;
      if (existing) { const c = plan.contributions.find((x) => x.id === existing.id); if (c) Object.assign(c, payload); }
      else plan.contributions.push({ id: uid("contrib"), ...payload });
    });
    onClose();
  };
  const del = () => {
    update((d) => {
      const plan = d.savingsPlans.find((p) => p.id === planId);
      if (plan) plan.contributions = plan.contributions.filter((x) => x.id !== existing!.id);
    });
    onClose();
  };
  return (
    <Sheet visible title={existing ? "Edit contribution" : "Add a contribution"} onClose={onClose}>
      <DateField label="Date" value={date} onChange={setDate} />
      <TextField label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <TextField label="Note (optional)" value={note} onChangeText={setNote} />
      <FormActions>
        {existing ? <Btn kind="danger" label="Delete" onPress={del} /> : null}
        <Btn label="Cancel" onPress={onClose} />
        <Btn kind="primary" label={existing ? "Save changes" : "Add contribution"} onPress={save} />
      </FormActions>
    </Sheet>
  );
}

// ---------- bank account ----------

export function BankAccountForm({ existing, onClose }: { existing: BankAccount | null; onClose: () => void }) {
  const { update, showToast } = useStore();
  const t = useTheme();
  const [name, setName] = useState(existing?.name || "");
  const [bank, setBank] = useState(existing?.bank || "");
  const [type, setType] = useState(existing?.type || "checking");
  const [balance, setBalance] = useState(existing ? String(existing.balance ?? 0) : "");
  const save = () => {
    if (!name.trim()) { showToast("Give the account a name.", true); return; }
    const b = parseNum(balance);
    const payload = { name: name.trim(), bank: bank.trim(), type, balance: Number.isNaN(b) ? 0 : round2(b) };
    update((d) => {
      if (existing) { const a = d.bankAccounts.find((x) => x.id === existing.id); if (a) Object.assign(a, payload); }
      else d.bankAccounts.push({ id: uid("acct"), ...payload });
    });
    onClose();
  };
  const del = () => confirmAction("Delete account", `Delete "${existing?.name}"?`, "Delete", () => {
    update((d) => { d.bankAccounts = d.bankAccounts.filter((x) => x.id !== existing!.id); });
    onClose();
  });
  return (
    <Sheet visible title={existing ? "Edit bank account" : "Add a bank account"} onClose={onClose}>
      <TextField label="Account name" value={name} onChangeText={setName} placeholder="e.g. Everyday Account" />
      <TextField label="Bank (optional)" value={bank} onChangeText={setBank} placeholder="e.g. Commonwealth Bank" />
      <SelectField
        label="Account type" value={type} onChange={setType}
        options={BANK_ACCOUNT_TYPES.map((x, i) => ({ value: x.id, label: x.label, icon: x.icon, color: t.tiles[i % 8] }))}
      />
      <TextField label="Current balance" value={balance} onChangeText={setBalance} keyboardType="numbers-and-punctuation" />
      <FormActions>
        {existing ? <Btn kind="danger" label="Delete" onPress={del} /> : null}
        <Btn label="Cancel" onPress={onClose} />
        <Btn kind="primary" label={existing ? "Save changes" : "Add account"} onPress={save} />
      </FormActions>
    </Sheet>
  );
}

// ---------- investment ----------

export function InvestmentForm({ existing, onClose }: { existing: Investment | null; onClose: () => void }) {
  const { update, showToast } = useStore();
  const t = useTheme();
  const [name, setName] = useState(existing?.name || "");
  const [type, setType] = useState(existing?.type || "etf");
  const [units, setUnits] = useState(numStr(existing?.units));
  const [cost, setCost] = useState(numStr(existing?.avgCost));
  const [price, setPrice] = useState(numStr(existing?.currentPrice));
  const num = (s: string) => { const v = parseNum(s); return Number.isNaN(v) || v < 0 ? 0 : v; };
  const save = () => {
    if (!name.trim()) { showToast("Give the holding a name.", true); return; }
    const payload = { name: name.trim(), type, units: num(units), avgCost: num(cost), currentPrice: num(price) };
    update((d) => {
      if (existing) { const i = d.investments.find((x) => x.id === existing.id); if (i) Object.assign(i, payload); }
      else d.investments.push({ id: uid("inv"), ...payload });
    });
    onClose();
  };
  const del = () => confirmAction("Delete investment", `Delete "${existing?.name}"?`, "Delete", () => {
    update((d) => { d.investments = d.investments.filter((x) => x.id !== existing!.id); });
    onClose();
  });
  return (
    <Sheet visible title={existing ? "Edit investment" : "Add an investment"} onClose={onClose}>
      <TextField label="Holding name" value={name} onChangeText={setName} placeholder="e.g. Vanguard VDHG" />
      <SelectField
        label="Type" value={type} onChange={setType}
        options={INVESTMENT_TYPES.map((x, i) => ({ value: x.id, label: x.label, icon: x.icon, color: t.tiles[i % 8] }))}
      />
      <TextField label="Units held" value={units} onChangeText={setUnits} keyboardType="decimal-pad" />
      <TextField label="Average cost / unit" value={cost} onChangeText={setCost} keyboardType="decimal-pad" />
      <TextField label="Current price / unit" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      <FormActions>
        {existing ? <Btn kind="danger" label="Delete" onPress={del} /> : null}
        <Btn label="Cancel" onPress={onClose} />
        <Btn kind="primary" label={existing ? "Save changes" : "Add investment"} onPress={save} />
      </FormActions>
    </Sheet>
  );
}

// ---------- add month ----------

export function AddMonthForm({ onClose, onCreated }: { onClose: () => void; onCreated: (key: string) => void }) {
  const { data, update, showToast } = useStore();
  const suggestion = nextSuggestedMonth(data);
  const [monthNum, setMonthNum] = useState(String(suggestion.monthIdx).padStart(2, "0"));
  const [year, setYear] = useState(String(suggestion.year));
  const [balance, setBalance] = useState("0");
  const add = () => {
    const y = parseInt(year, 10);
    if (!y || Number.isNaN(y)) { showToast("Enter a valid year.", true); return; }
    const key = `${y}-${monthNum}`;
    if (data.months[key]) { showToast("That month already exists.", true); return; }
    const b = parseNum(balance);
    update((d) => {
      d.months[key] = { label: `${MONTH_NAMES[parseInt(monthNum, 10) - 1]} ${y}`, startingBalance: Number.isNaN(b) ? 0 : b, expenses: [], income: [] };
    });
    onCreated(key);
    onClose();
  };
  return (
    <Sheet visible title="Add a new month" onClose={onClose}>
      <SelectField
        label="Month" value={monthNum} onChange={setMonthNum}
        options={MONTH_NAMES.map((n, i) => ({ value: String(i + 1).padStart(2, "0"), label: n }))}
      />
      <TextField label="Year" value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} />
      <TextField label="Starting balance (optional)" value={balance} onChangeText={setBalance} keyboardType="numbers-and-punctuation" />
      <FormActions>
        <Btn label="Cancel" onPress={onClose} />
        <Btn kind="primary" label="Add month" onPress={add} />
      </FormActions>
    </Sheet>
  );
}

// ---------- appearance ----------

export function AppearanceForm({ onClose }: { onClose: () => void }) {
  const { data, update } = useStore();
  const t = useTheme();
  return (
    <Sheet visible title="Appearance" onClose={onClose}>
      <Field label="Theme">
        <View style={{ flexDirection: "row", gap: 8 }}>
          {THEMES.map((th) => (
            <Btn
              key={th.id} small label={th.label} kind={data.settings.theme === th.id ? "primary" : "default"}
              style={{ flex: 1 }} onPress={() => update((d) => { d.settings.theme = th.id; })}
            />
          ))}
        </View>
      </Field>
      <Field label="Accent colour">
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          {ACCENTS.map((a) => {
            const sel = (data.settings.accent || "blue") === a.id;
            return (
              <Pressable
                key={a.id}
                onPress={() => update((d) => { d.settings.accent = a.id; })}
                style={{
                  width: 40, height: 40, borderRadius: 20, backgroundColor: t.dark ? a.dark : a.light, borderWidth: 3,
                  borderColor: sel ? t.text : "transparent", alignItems: "center", justifyContent: "center",
                }}
              >
                {sel ? <Icon name="check" size={18} color="#fff" /> : null}
              </Pressable>
            );
          })}
        </View>
      </Field>
      <T size={12} muted>Saved with your data. Income and expense chart colours stay fixed so the data stays readable.</T>
      <FormActions>
        <Btn kind="primary" label="Done" onPress={onClose} />
      </FormActions>
    </Sheet>
  );
}
