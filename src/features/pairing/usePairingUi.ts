import { create } from "zustand";

interface PairingUiState {
  open: boolean;
  targetId: string | null;
  openPairing: (targetId?: string | null) => void;
  closePairing: () => void;
}

export const usePairingUi = create<PairingUiState>((set) => ({
  open: false,
  targetId: null,
  openPairing: (targetId = null) => set({ open: true, targetId }),
  closePairing: () => set({ open: false, targetId: null }),
}));
