import React from "react";
import { Platform, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StoreProvider, useStore } from "../src/store";
import { useTheme } from "../src/theme";
import { ToastHost } from "../src/components/ui";
import { DebugStrip } from "../src/components/DebugStrip";

function Shell() {
  const t = useTheme();
  const { ready } = useStore();
  const [fontsLoaded] = useFonts({ Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });
  if (!ready || !fontsLoaded) return null;
  const body = (
    <>
      <StatusBar style={t.dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.surface2 },
          headerTintColor: t.accent,
          headerTitle: "",
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: t.surface2 },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <ToastHost />
      <DebugStrip />
    </>
  );
  // On wide screens (desktop browsers) keep the phone-shaped layout centred.
  if (Platform.OS !== "web") return body;
  return (
    <View style={{ flex: 1, backgroundColor: t.surface2 }}>
      <View style={{ flex: 1, width: "100%", maxWidth: 560, alignSelf: "center", overflow: "hidden", backgroundColor: t.surface2 }}>{body}</View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
