import React, { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BUILD } from "../buildInfo";

// Temporary: shows how the browser is sizing the app (web only).
export function DebugStrip() {
  const insets = useSafeAreaInsets();
  const [info, setInfo] = useState("");
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const measure = () => {
      const probe = (css: string) => {
        const d = document.createElement("div");
        d.style.cssText = `position:fixed;left:0;top:0;width:1px;visibility:hidden;height:${css}`;
        document.body.appendChild(d);
        const h = d.getBoundingClientRect().height;
        d.remove();
        return Math.round(h);
      };
      const root = document.getElementById("root")!.getBoundingClientRect();
      const standalone = (navigator as any).standalone || matchMedia("(display-mode: standalone)").matches;
      setInfo(
        `b${BUILD.slice(5)} ${standalone ? "app" : "web"} inner ${innerWidth}x${innerHeight} scr ${screen.width}x${screen.height} ` +
        `vh ${probe("100vh")} dvh ${probe("100dvh")} lvh ${probe("100lvh")} pct ${probe("100%")} root ${Math.round(root.top)}-${Math.round(root.bottom)} ` +
        `ins ${Math.round(insets.top)}/${Math.round(insets.bottom)}`,
      );
    };
    measure();
    addEventListener("resize", measure);
    return () => removeEventListener("resize", measure);
  }, [insets.top, insets.bottom]);
  if (Platform.OS !== "web" || !info) return null;
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 4, right: 4, top: Math.max(insets.top - 14, 2), zIndex: 9999 }}>
      <Text style={{ backgroundColor: "#FFE14D", color: "#000", fontSize: 8.5, padding: 2 }}>{info}</Text>
    </View>
  );
}
