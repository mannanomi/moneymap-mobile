import React, { useState } from "react";
import { View } from "react-native";
import { useStore } from "../../src/store";
import {
  REPORT_RANGE_CAPTIONS, TREND_RANGES, TrendRange, fmtMoney, getTrendSeries, monthTotals, recentMonthKeys, reportRangeStats,
} from "../../src/lib/logic";
import { TabPage } from "../../src/components/scaffold";
import { EmptyState, Panel, Segmented, SectionTitle, StatRow, StatTile, T } from "../../src/components/ui";
import { TrendLineChart } from "../../src/components/charts";
import { ComparePanel } from "../../src/components/panels";
import { useTheme } from "../../src/theme";

export default function Report() {
  const { data, monthKey } = useStore();
  const t = useTheme();
  const [range, setRange] = useState<TrendRange>("1M");
  const month = data.months[monthKey];
  if (!month) return <TabPage title="Report" showMonth={false}><EmptyState msg="That month no longer exists." /></TabPage>;

  const { totalIncome, totalExpense, net, rate } = reportRangeStats(data, monthKey, range);
  const series = getTrendSeries(data, monthKey, range);
  const keys = recentMonthKeys(data, monthKey, 6);
  const items = keys.map((k) => ({ label: data.months[k].label.split(" ")[0].slice(0, 3), ...monthTotals(data, k) }));

  return (
    <TabPage title="Report" subtitle={month.label}>
      <Segmented value={range} onChange={setRange} options={TREND_RANGES.map(([id, label]) => ({ value: id, label: id }))} />
      <T size={13} weight="600" muted>{`Totals for ${REPORT_RANGE_CAPTIONS[range]}`}</T>
      <StatRow>
        <StatTile label="Income" icon="arrowDown" value={fmtMoney(totalIncome)} />
        <StatTile label="Expenses" icon="arrowUp" value={fmtMoney(totalExpense)} />
        <StatTile label="Net savings" icon="bank" value={fmtMoney(net)} tone={net >= 0 ? "good" : "critical"} />
        <StatTile label="Savings rate" icon="pie" value={`${rate.toFixed(1)}%`} tone={rate >= 0 ? "good" : "critical"} />
      </StatRow>

      <Panel style={{ gap: 12 }}>
        <SectionTitle>Cash flow</SectionTitle>
        <View style={{ flexDirection: "row", gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: t.income }} /><T size={11.5} secondary>Income</T>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: t.expense }} /><T size={11.5} secondary>Expenses</T>
          </View>
        </View>
        <TrendLineChart series={series} daily={range === "1M"} />
      </Panel>

      <ComparePanel title="6-month comparison" items={items} chartHeight={140} />
    </TabPage>
  );
}
