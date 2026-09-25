import React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useStore } from "../../src/store";
import { useTheme } from "../../src/theme";
import { fmtMoney, historyYearsSorted, monthTotals, monthsInYear } from "../../src/lib/logic";
import { PushedPage } from "../../src/components/scaffold";
import { EmptyState, Panel, T } from "../../src/components/ui";

export default function History() {
  const { data } = useStore();
  const t = useTheme();
  const years = historyYearsSorted(data);
  return (
    <PushedPage>
      {!years.length ? <EmptyState msg="No historical years imported yet." /> : years.map((year) => {
        let income = 0, expense = 0;
        for (const k of monthsInYear(data, year)) { const m = monthTotals(data, k); income += m.income; expense += m.expense; }
        const net = income - expense;
        return (
          <Panel key={year} onPress={() => router.push({ pathname: "/history/[year]", params: { year } })} style={{ gap: 8 }}>
            <T size={20} figure>{year}</T>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}><T size={13} secondary>Income</T><T size={13} weight="700">{fmtMoney(income)}</T></View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}><T size={13} secondary>Expenses</T><T size={13} weight="700">{fmtMoney(expense)}</T></View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <T size={13} secondary>Net</T><T size={13} weight="800" color={net >= 0 ? t.good : t.critical}>{fmtMoney(net)}</T>
            </View>
          </Panel>
        );
      })}
    </PushedPage>
  );
}
