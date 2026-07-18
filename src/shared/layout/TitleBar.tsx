import { useState, useEffect } from "react";
import { getApi } from "../ipc";

function useIsElectron(): boolean {
  const [isElectron, setIsElectron] = useState(false);
  useEffect(() => {
    setIsElectron(!!getApi().isElectron);
  }, []);
  return isElectron;
}

export function TitleBar() {
  const isElectron = useIsElectron();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isElectron) return;
    const api = getApi();
    api.window?.isMaximized().then(setIsMaximized);
  }, [isElectron]);

  if (!isElectron) return null;

  const win = getApi().window;

  return (
    <div
      className="titlebar drag-region flex h-9 w-full shrink-0 items-center justify-between border-b border-white/10 bg-[#0b0d12]/80 px-3 backdrop-blur-xl"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-brand-500/20">
          <svg className="h-3 w-3 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
          </svg>
        </div>
        <span className="text-xs font-medium text-white/60">Relay</span>
      </div>

      <div
        className="flex items-center gap-0.5"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <button
          onClick={() => win?.minimize()}
          className="flex h-7 w-9 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
          aria-label="Minimize"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2" y1="6" x2="10" y2="6" />
          </svg>
        </button>
        <button
          onClick={() => {
            win?.maximize();
            win?.isMaximized().then(setIsMaximized);
          }}
          className="flex h-7 w-9 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
          aria-label={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3.5" y="1.5" width="7" height="7" rx="1" />
              <path d="M1.5 4.5v-2a1 1 0 0 1 1-1h7" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1.5" y="1.5" width="9" height="9" rx="1" />
            </svg>
          )}
        </button>
        <button
          onClick={() => win?.close()}
          className="flex h-7 w-9 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-red-500/80 hover:text-white"
          aria-label="Close"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2.5" y1="2.5" x2="9.5" y2="9.5" />
            <line x1="9.5" y1="2.5" x2="2.5" y2="9.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
