import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tint, useTheme } from "../theme";
import { T, tap } from "./ui";

// iOS-style glyphs: [outline, filled] per tab
const TAB_ICONS: Record<string, [string, string]> = {
  index: ["home-outline", "home"],
  transactions: ["receipt-outline", "receipt"],
  budgets: ["wallet-outline", "wallet"],
  report: ["stats-chart-outline", "stats-chart"],
  more: ["ellipsis-horizontal-circle-outline", "ellipsis-horizontal-circle"],
};

// Height of the floating bar plus its bottom margin — pages add this as bottom padding.
export const TAB_BAR_SPACE = 104;

export function GlassTabBar({ state, descriptors, navigation }: any) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 10) + 4;

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom, paddingHorizontal: 18 }}>
      <View
        style={{
          borderRadius: 36, overflow: "hidden", borderWidth: 1,
          borderColor: t.dark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.9)",
          shadowColor: "#000", shadowOpacity: t.dark ? 0.5 : 0.16, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12,
        }}
      >
        <BlurView
          intensity={Platform.OS === "android" ? 90 : 70}
          tint={t.dark ? "dark" : "light"}
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        {/* glass sheen + tint so the bar stays legible over any content */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: t.dark ? "rgba(20,28,42,0.45)" : "rgba(255,255,255,0.5)" }]} />
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, backgroundColor: t.dark ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.95)" }} />

        <View style={{ flexDirection: "row", padding: 6, gap: 2 }}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;
            const label = options.title ?? route.name;
            const color = focused ? t.accent : t.dark ? "rgba(255,255,255,0.62)" : "rgba(15,23,42,0.55)";
            const pair = TAB_ICONS[route.name] || ["ellipse-outline", "ellipse"];
            const onPress = () => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) { tap(); navigation.navigate(route.name, route.params); }
            };
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={label}
                style={({ pressed }) => ({
                  flex: 1, height: 58, borderRadius: 30, alignItems: "center", justifyContent: "center", gap: 3,
                  backgroundColor: focused ? tint(t.accent, t.dark ? 0.22 : 0.14) : "transparent",
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                })}
              >
                <Ionicons name={(focused ? pair[1] : pair[0]) as any} size={25} color={color} />
                <T size={10.5} weight={focused ? "800" : "700"} color={color} numberOfLines={1}>{label}</T>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
