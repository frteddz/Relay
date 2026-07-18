let capacitorClipboard: { write: (opts: { string: string }) => Promise<void>; read: () => Promise<{ value?: string }> } | null = null;
let capacitorChecked = false;

async function getCapacitorClipboard() {
  if (capacitorChecked) return capacitorClipboard;
  capacitorChecked = true;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor && Capacitor.isNativePlatform()) {
      const mod = await import("@capacitor/clipboard");
      capacitorClipboard = mod.Clipboard;
    }
  } catch {
    // Not in Capacitor
  }
  return capacitorClipboard;
}

export async function writeToClipboard(text: string): Promise<void> {
  const capClipboard = await getCapacitorClipboard();
  if (capClipboard) {
    await capClipboard.write({ string: text });
    return;
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  }
}

export async function readFromClipboard(): Promise<string> {
  const capClipboard = await getCapacitorClipboard();
  if (capClipboard) {
    const result = await capClipboard.read();
    return result.value ?? "";
  }
  if (navigator.clipboard?.readText) {
    return await navigator.clipboard.readText();
  }
  return "";
}
