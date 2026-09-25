const MAIN = "moneymap.json";
const BAK = "moneymap.json.bak";

export function readMain(): string | null {
  return localStorage.getItem(MAIN);
}

export function readBackup(): string | null {
  return localStorage.getItem(BAK);
}

export function writeMain(text: string): void {
  const prev = localStorage.getItem(MAIN);
  if (prev) localStorage.setItem(BAK, prev);
  localStorage.setItem(MAIN, text);
}
