import type {} from "./types";

export interface RelayApi {
  isElectron: boolean;
  discovery?: NonNullable<Window["relay"]>["discovery"];
  network?: NonNullable<Window["relay"]>["network"];
  device?: NonNullable<Window["relay"]>["device"];
  pairing?: NonNullable<Window["relay"]>["pairing"];
  clipboard?: NonNullable<Window["relay"]>["clipboard"];
  transfer?: NonNullable<Window["relay"]>["transfer"];
  app?: NonNullable<Window["relay"]>["app"];
  window?: NonNullable<Window["relay"]>["window"];
}

const fallbackApi: RelayApi = { isElectron: false };

export function getApi(): RelayApi {
  if (typeof window !== "undefined" && window.relay) {
    return window.relay as RelayApi;
  }
  return fallbackApi;
}
