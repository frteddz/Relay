import { useStore } from "../../shared/store";
import { getCore } from "../../shared/services/connectCore";
import { usePairingUi } from "./usePairingUi";

export function usePairing() {
  const pairings = useStore((s) => s.pairings);
  const trusted = useStore((s) => s.trusted);
  const openPairing = usePairingUi((s) => s.openPairing);
  const closePairing = usePairingUi((s) => s.closePairing);

  const syncTrusted = () =>
    useStore.getState().setTrusted(getCore().pairing.trusted());

  const request = async (deviceId: string) => {
    await getCore().pairing.request(deviceId);
    openPairing(deviceId);
  };

  const confirm = async (requestId: string, code: string) => {
    const accepted = await getCore().pairing.confirm(requestId, code);
    syncTrusted();
    if (accepted) closePairing();
    return accepted;
  };

  const reject = async (requestId: string) => {
    await getCore().pairing.resolve(requestId, false);
    syncTrusted();
    closePairing();
  };

  const forget = (id: string) => {
    getCore().pairing.untrust(id);
    syncTrusted();
  };

  return {
    pairings,
    trusted,
    request,
    confirm,
    reject,
    forget,
    openPairing,
    closePairing,
  };
}
