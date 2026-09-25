import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { readBackup, readMain, writeMain } from "./storage";
import type { AppData } from "./types";
import { autoArchiveAndStartMonth, currentYearMonthKeys, emptyData, normalizeData } from "./lib/logic";

interface StoreValue {
  ready: boolean;
  data: AppData;
  monthKey: string;
  setMonthKey: (k: string) => void;
  /** Apply a mutation to a deep copy of the data, then persist. */
  update: (fn: (draft: AppData) => void) => void;
  /** Replace all data (used by import). */
  replaceAll: (next: AppData) => void;
  toast: { msg: string; error: boolean; id: number } | null;
  showToast: (msg: string, error?: boolean) => void;
  exportJSON: () => string;
}

const StoreContext = createContext<StoreValue | null>(null);

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function readStored(): AppData | null {
  try {
    const main = readMain();
    if (!main) return null;
    return normalizeData(JSON.parse(main));
  } catch {
    try {
      const bak = readBackup();
      return bak ? normalizeData(JSON.parse(bak)) : null;
    } catch {
      return null;
    }
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => emptyData());
  const [ready, setReady] = useState(false);
  const [monthKey, setMonthKey] = useState("");
  const [toast, setToast] = useState<StoreValue["toast"]>(null);
  const dataRef = useRef(data);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastId = useRef(0);

  const showToast = useCallback((msg: string, error = false) => {
    toastId.current += 1;
    setToast({ msg, error, id: toastId.current });
  }, []);

  const persistNow = useCallback(() => {
    try {
      writeMain(JSON.stringify(dataRef.current));
    } catch (e: any) {
      showToast("Save failed: " + (e?.message || "unknown error"), true);
    }
  }, [showToast]);

  const queueSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persistNow, 250);
  }, [persistNow]);

  const commit = useCallback((next: AppData) => {
    dataRef.current = next;
    setData(next);
    queueSave();
  }, [queueSave]);

  // Initial load: read from disk, archive finished years, ensure the current month exists.
  useEffect(() => {
    let stored = readStored();
    const loaded = stored ? stored : emptyData();
    const msg = autoArchiveAndStartMonth(loaded);
    dataRef.current = loaded;
    setData(loaded);
    const keys = currentYearMonthKeys(loaded);
    setMonthKey(keys[keys.length - 1] || Object.keys(loaded.months).sort().pop() || "");
    setReady(true);
    if (msg || !stored) queueSave();
    if (msg) showToast(msg);
  }, [queueSave, showToast]);

  const update = useCallback((fn: (draft: AppData) => void) => {
    const draft = clone(dataRef.current);
    fn(draft);
    commit(draft);
  }, [commit]);

  const replaceAll = useCallback((next: AppData) => {
    const fixed = normalizeData(next);
    autoArchiveAndStartMonth(fixed);
    commit(fixed);
    const keys = currentYearMonthKeys(fixed);
    setMonthKey(keys[keys.length - 1] || Object.keys(fixed.months).sort().pop() || "");
  }, [commit]);

  const exportJSON = useCallback(() => JSON.stringify(dataRef.current, null, 2), []);

  // Keep the selected month valid if it disappears (e.g. after import).
  useEffect(() => {
    if (ready && monthKey && !data.months[monthKey]) {
      const keys = currentYearMonthKeys(data);
      setMonthKey(keys[keys.length - 1] || Object.keys(data.months).sort().pop() || "");
    }
  }, [ready, monthKey, data]);

  const value = useMemo<StoreValue>(() => ({
    ready, data, monthKey, setMonthKey, update, replaceAll, toast, showToast, exportJSON,
  }), [ready, data, monthKey, update, replaceAll, toast, showToast, exportJSON]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
