import React from "react";
import { Tabs } from "expo-router";
import { GlassTabBar } from "../../src/components/GlassTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "transparent" } }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabIconName: "home" } as any} />
      <Tabs.Screen name="transactions" options={{ title: "Activity", tabIconName: "receipt" } as any} />
      <Tabs.Screen name="budgets" options={{ title: "Budgets", tabIconName: "target" } as any} />
      <Tabs.Screen name="report" options={{ title: "Report", tabIconName: "bars" } as any} />
      <Tabs.Screen name="more" options={{ title: "More", tabIconName: "more" } as any} />
    </Tabs>
  );
}
