import { File, Paths } from "expo-file-system";

const FILE_NAME = "moneymap.json";
const BAK_NAME = "moneymap.json.bak";

export function readMain(): string | null {
  const f = new File(Paths.document, FILE_NAME);
  return f.exists ? f.textSync() : null;
}

export function readBackup(): string | null {
  const f = new File(Paths.document, BAK_NAME);
  return f.exists ? f.textSync() : null;
}

/** Writes the main file, first copying the previous contents to the .bak file. */
export function writeMain(text: string): void {
  const f = new File(Paths.document, FILE_NAME);
  if (f.exists) {
    const prev = f.textSync();
    if (prev) new File(Paths.document, BAK_NAME).write(prev);
  }
  f.write(text);
}
