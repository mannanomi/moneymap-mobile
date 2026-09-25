import React, { useState } from "react";
import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { useStore } from "../src/store";
import { normalizeData } from "../src/lib/logic";
import { PushedPage } from "../src/components/scaffold";
import { Btn, Panel, SectionTitle, T } from "../src/components/ui";
import { confirmAction } from "../src/components/feed";

export default function Backup() {
  const { data, replaceAll, showToast, exportJSON } = useStore();
  const [busy, setBusy] = useState(false);
  const months = Object.keys(data.months).length;
  const tx = Object.values(data.months).reduce((s, m) => s + m.expenses.length + m.income.length, 0);

  const doImport = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ["application/json", "text/plain", "*/*"], copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.length) return;
      setBusy(true);
      const asset: any = res.assets[0];
      const text = Platform.OS === "web" && asset.file ? await asset.file.text() : new File(asset.uri).textSync();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || typeof parsed.months !== "object") {
        showToast("That file doesn't look like a MoneyMap data.json.", true);
        return;
      }
      const next = normalizeData(parsed);
      const n = Object.keys(next.months).length;
      confirmAction(
        "Replace all data?",
        `This file has ${n} month${n === 1 ? "" : "s"}. It will replace everything currently in the app (${months} months). Export a backup first if unsure.`,
        "Replace",
        () => { replaceAll(next); showToast(`Imported ${n} months`); },
      );
    } catch (e: any) {
      showToast("Import failed: " + (e?.message || "unknown error"), true);
    } finally {
      setBusy(false);
    }
  };

  const doExport = async () => {
    try {
      setBusy(true);
      const stamp = new Date().toISOString().slice(0, 10);
      if (Platform.OS === "web") {
        const blob = new Blob([exportJSON()], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `moneymap-backup-${stamp}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }
      const file = new File(Paths.cache, `moneymap-backup-${stamp}.json`);
      file.write(exportJSON());
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "Export MoneyMap backup", UTI: "public.json" });
      } else {
        showToast("Sharing isn't available on this device.", true);
      }
    } catch (e: any) {
      showToast("Export failed: " + (e?.message || "unknown error"), true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PushedPage>
      <Panel style={{ gap: 6 }}>
        <SectionTitle>Your data</SectionTitle>
        <T size={13} secondary>{`${months} months · ${tx.toLocaleString()} transactions · ${data.cards.length} cards · ${data.savingsPlans.length} savings plans`}</T>
        <T size={12} muted>Everything is stored only on this device (in this browser, on the website). Nothing is uploaded anywhere.</T>
      </Panel>

      <Panel style={{ gap: 10 }}>
        <SectionTitle>Import from the web app</SectionTitle>
        <T size={13} secondary>
          Copy your MoneyMap data.json to this device (AirDrop, iCloud Drive, Google Drive, email…), then choose it here. This replaces the data in the app.
        </T>
        <Btn kind="primary" icon="upload" label="Import data.json" disabled={busy} onPress={doImport} />
      </Panel>

      <Panel style={{ gap: 10 }}>
        <SectionTitle>Export a backup</SectionTitle>
        <T size={13} secondary>Save a copy of everything as a JSON file. The same file can be imported back here or into the web app.</T>
        <Btn icon="download" label="Export backup" disabled={busy} onPress={doExport} />
      </Panel>
    </PushedPage>
  );
}
