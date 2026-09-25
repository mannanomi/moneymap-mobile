import React, { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useStore } from "../src/store";
import { useTheme } from "../src/theme";
import { isCategoryInUse } from "../src/lib/logic";
import { PushedPage } from "../src/components/scaffold";
import { Btn, Icon, Panel, SectionTitle } from "../src/components/ui";

type Key = "expenseCategories" | "incomeCategories";

function CategoryRow({ name, listKey }: { name: string; listKey: Key }) {
  const { data, update, showToast } = useStore();
  const t = useTheme();
  const [val, setVal] = useState(name);
  const commit = () => {
    const next = val.trim();
    if (!next) { setVal(name); return; }
    if (next === name) return;
    if (data[listKey].includes(next)) { showToast("Category already exists.", true); setVal(name); return; }
    update((d) => {
      const idx = d[listKey].indexOf(name);
      if (idx < 0) return;
      d[listKey][idx] = next;
      const kind = listKey === "expenseCategories" ? "expenses" : "income";
      for (const mk of Object.keys(d.months)) for (const e of d.months[mk][kind]) if (e.category === name) e.category = next;
      if (listKey === "expenseCategories" && name in d.categoryBudgets) {
        d.categoryBudgets[next] = d.categoryBudgets[name];
        delete d.categoryBudgets[name];
      }
    });
  };
  const remove = () => {
    if (isCategoryInUse(data, listKey, name)) { showToast("Can't remove a category still used by transactions.", true); return; }
    update((d) => {
      d[listKey] = d[listKey].filter((c) => c !== name);
      if (listKey === "expenseCategories") delete d.categoryBudgets[name];
    });
  };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <TextInput
        value={val} onChangeText={setVal} onEndEditing={commit} onSubmitEditing={commit}
        style={{ flex: 1, backgroundColor: t.surface2, color: t.text, borderColor: t.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 }}
      />
      <Pressable onPress={remove} hitSlop={8} style={{ padding: 8 }}><Icon name="x" size={20} color={t.textMuted} /></Pressable>
    </View>
  );
}

function Section({ title, listKey }: { title: string; listKey: Key }) {
  const { data, update, showToast } = useStore();
  const t = useTheme();
  const [adding, setAdding] = useState("");
  const add = () => {
    const v = adding.trim();
    if (!v) return;
    if (data[listKey].includes(v)) { showToast("Category already exists.", true); return; }
    update((d) => { d[listKey].push(v); });
    setAdding("");
  };
  return (
    <Panel style={{ gap: 12 }}>
      <SectionTitle>{title}</SectionTitle>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          value={adding} onChangeText={setAdding} onSubmitEditing={add} placeholder="New category name" placeholderTextColor={t.textMuted}
          style={{ flex: 1, backgroundColor: t.surface2, color: t.text, borderColor: t.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 }}
        />
        <Btn small kind="primary" label="Add" onPress={add} />
      </View>
      {data[listKey].map((c) => <CategoryRow key={c} name={c} listKey={listKey} />)}
    </Panel>
  );
}

export default function ManageCategories() {
  return (
    <PushedPage>
      <Section title="Expense categories" listKey="expenseCategories" />
      <Section title="Income categories" listKey="incomeCategories" />
    </PushedPage>
  );
}
