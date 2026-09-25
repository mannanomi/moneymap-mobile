import React from "react";
import { ScrollView, StyleProp, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { MonthBar } from "./feed";
import { T } from "./ui";
import { TAB_BAR_SPACE } from "./GlassTabBar";

/** Page used by the bottom-tab screens (no native header): large title, month stepper, scrolling content. */
export function TabPage({ children, title, subtitle, showMonth = true, right, contentStyle }: {
  children: React.ReactNode; title?: string; subtitle?: string; showMonth?: boolean; right?: React.ReactNode; contentStyle?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.surface2, paddingTop: insets.top }}>
      {title ? (
        <View style={{ flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 18, paddingTop: 10, paddingBottom: 2 }}>
          <View style={{ flex: 1 }}>
            <T size={30} weight="800" style={{ letterSpacing: -0.5 }}>{title}</T>
            {subtitle ? <T size={13.5} secondary>{subtitle}</T> : null}
          </View>
          {right}
        </View>
      ) : null}
      {showMonth ? <MonthBar /> : null}
      <ScrollView
        contentContainerStyle={[{ padding: 16, paddingTop: 10, paddingBottom: TAB_BAR_SPACE + insets.bottom + 24, gap: 16 }, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

/** Page used by pushed screens (native back button in the header; the page supplies its own title block). */
export function PushedPage({ children, showMonth = false, contentStyle }: {
  children: React.ReactNode; showMonth?: boolean; contentStyle?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.surface2 }}>
      {showMonth ? <MonthBar /> : null}
      <ScrollView
        contentContainerStyle={[{ padding: 16, paddingTop: 8, paddingBottom: 48, gap: 16 }, contentStyle]}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}
