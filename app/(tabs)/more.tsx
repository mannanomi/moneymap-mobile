import React, { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BUILD } from "../../src/buildInfo";
import { router } from "expo-router";
import { useStore } from "../../src/store";
import { useTheme } from "../../src/theme";
import { TabPage } from "../../src/components/scaffold";
import { Divider, Icon, IconBadge, Panel, T } from "../../src/components/ui";
import { AddMonthForm, AppearanceForm } from "../../src/components/forms";

function MenuRow({ icon, label, sub, onPress, color, last }: { icon: string; label: string; sub?: string; onPress: () => void; color: string; last?: boolean }) {
  const t = useTheme();
  return (
    <>
      <Pressable onPress={onPress} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, opacity: pressed ? 0.6 : 1 })}>
        <IconBadge name={icon} color={color} size={40} />
        <View style={{ flex: 1 }}>
          <T size={15.5} weight="700">{label}</T>
          {sub ? <T size={12.5} muted>{sub}</T> : null}
        </View>
        <Icon name="chevron" size={20} color={t.textMuted} />
      </Pressable>
      {last ? null : <Divider />}
    </>
  );
}

function BuildInfo() {
  const insets = useSafeAreaInsets();
  let extra = "";
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const standalone = (window.navigator as any).standalone || window.matchMedia("(display-mode: standalone)").matches;
    extra = ` · window ${window.innerWidth}×${window.innerHeight} · screen ${window.screen.width}×${window.screen.height} · inset top ${Math.round(insets.top)} bottom ${Math.round(insets.bottom)} · ${standalone ? "app" : "browser"}`;
  }
  return <T size={11} muted align="center">{`MoneyMap build ${BUILD}${extra}`}</T>;
}

export default function More() {
  const { setMonthKey } = useStore();
  const [sheet, setSheet] = useState<"month" | "appearance" | null>(null);
  const t = useTheme();
  const c = t.tiles;
  return (
    <TabPage title="More" showMonth={false}>
      <Panel style={{ paddingVertical: 6 }}>
        <MenuRow color={c[0]} icon="categories" label="All categories" sub="Spending by category" onPress={() => router.push("/categories")} />
        <MenuRow color={c[1]} icon="card" label="Cards" sub="Credit cards and repayments" onPress={() => router.push("/cards")} />
        <MenuRow color={c[2]} icon="piggy" label="Savings plans" sub="Goals and contributions" onPress={() => router.push("/savings")} />
        <MenuRow color={c[3]} icon="bank" label="Bank accounts" onPress={() => router.push("/accounts")} />
        <MenuRow color={c[6]} icon="trend" label="Investments" onPress={() => router.push("/investments")} last />
      </Panel>

      <Panel style={{ paddingVertical: 6 }}>
        <MenuRow color={c[0]} icon="calendar" label="Year to date" onPress={() => router.push("/ytd")} />
        <MenuRow color={c[5]} icon="history" label="History" sub="Past years" onPress={() => router.push("/history")} />
        <MenuRow color={c[4]} icon="search" label="Search & filter" sub="Find any transaction" onPress={() => router.push("/search")} last />
      </Panel>

      <Panel style={{ paddingVertical: 6 }}>
        <MenuRow color={c[2]} icon="plus" label="Add month" onPress={() => setSheet("month")} />
        <MenuRow color={c[3]} icon="categories" label="Manage categories" onPress={() => router.push("/manage-categories")} />
        <MenuRow color={c[4]} icon="palette" label="Appearance" onPress={() => setSheet("appearance")} />
        <MenuRow color={c[1]} icon="folder" label="Backup & import" sub="Import your data.json, export a backup" onPress={() => router.push("/backup")} last />
      </Panel>

      <BuildInfo />

      {sheet === "month" ? <AddMonthForm onClose={() => setSheet(null)} onCreated={(k) => { setMonthKey(k); router.navigate("/"); }} /> : null}
      {sheet === "appearance" ? <AppearanceForm onClose={() => setSheet(null)} /> : null}
    </TabPage>
  );
}
