import { useCallback, useEffect, useRef } from "react";

export function useInterval(callback: () => void, delay: number | null): void {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

import { writeToClipboard } from "../utils/clipboard";

export function useClipboardWrite(): (text: string) => void {
  return useCallback((text: string) => {
    void writeToClipboard(text).catch(() => undefined);
  }, []);
}
