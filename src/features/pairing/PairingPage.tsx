import { useState, useEffect, useCallback, useRef } from "react";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";
import { Card, SectionTitle } from "../../shared/components/Card";
import { Button } from "../../shared/components/Button";
import { useStore } from "../../shared/store";
import { getCore } from "../../shared/services/connectCore";
import { uid } from "../../shared/utils/format";

type TabType = "generate" | "enter" | "scan";

interface CameraDevice {
  id: string;
  label: string;
}

function generateShortCode(): string {
  const v = new Uint32Array(1);
  crypto.getRandomValues(v);
  return String(1000 + (v[0] % 9000));
}

export function PairingPage() {
  const [tab, setTab] = useState<TabType>("generate");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [expiry, setExpiry] = useState(0);

  const [entryCode, setEntryCode] = useState("");
  const [entryError, setEntryError] = useState("");
  const [entrySuccess, setEntrySuccess] = useState(false);

  const [scanStatus, setScanStatus] = useState<"" | "scanning" | "pairing" | "paired" | "error">("");
  const [scanError, setScanError] = useState("");
  const [scannedDevice, setScannedDevice] = useState<{ deviceId: string; deviceName: string } | null>(null);

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [cameraStatus, setCameraStatus] = useState<"idle" | "detecting" | "ready" | "none">("idle");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const settings = useStore((s) => s.settings);

  const generate = useCallback(() => {
    const core = getCore();
    const deviceId = core.deviceId ?? uid("dev");
    const serverUrl = (settings as any).signalingUrl ?? "ws://localhost:4001";
    const code = generateShortCode();

    const payload = JSON.stringify({ deviceId, deviceName: settings.deviceName, serverUrl, shortCode: code });
    QRCode.toDataURL(payload, { width: 256, margin: 2 }).then(setQrDataUrl);
    setShortCode(code);
    setCountdown(60);
    setExpiry(Date.now() + 60000);

    if (core.setActiveShortCode) core.setActiveShortCode(code);
  }, [settings]);

  useEffect(() => {
    generate();
    return () => {
      const core = getCore();
      if (core.setActiveShortCode) core.setActiveShortCode(null);
    };
  }, [generate]);

  useEffect(() => {
    if (expiry === 0) return;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        setExpiry(0);
        const core = getCore();
        if (core.setActiveShortCode) core.setActiveShortCode(null);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [expiry]);

  const detectCameras = useCallback(async () => {
    setCameraStatus("detecting");
    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setCameraStatus("none");
        setCameras([]);
        return;
      }
      const mapped = devices.map((d) => ({ id: d.id, label: d.label || `Camera ${d.id.slice(0, 8)}` }));
      setCameras(mapped);
      const rear = mapped.find((c) => /back|rear|environment|world/i.test(c.label));
      const selected = rear ?? mapped[0];
      setSelectedCameraId(selected.id);
      setCameraStatus("ready");
    } catch {
      setCameraStatus("none");
      setCameras([]);
    }
  }, []);

  useEffect(() => {
    if (tab === "scan" && cameraStatus === "idle") {
      detectCameras();
    }
  }, [tab, cameraStatus, detectCameras]);

  const handleRefresh = () => {
    setExpiry(0);
    setTimeout(generate, 50);
  };

  const handleVerifyCode = async () => {
    setEntryError("");
    setEntrySuccess(false);
    if (entryCode.length !== 4) {
      setEntryError("Code must be 4 digits");
      return;
    }
    const core = getCore();
    if (core.sendSignal) {
      core.sendSignal({
        type: "pair-verify",
        code: entryCode,
        fromId: core.deviceId,
        fromName: settings.deviceName,
      });
      setEntrySuccess(true);
      setEntryCode("");
    } else {
      setEntryError("Signaling not available. Make sure a server is configured.");
    }
  };

  const startScanner = async () => {
    if (scannerRef.current) return;
    if (cameraStatus === "none") {
      setScanStatus("error");
      setScanError("No cameras detected. Connect a webcam and try again.");
      return;
    }
    if (!selectedCameraId) {
      setScanStatus("error");
      setScanError("No camera selected.");
      return;
    }
    setScanStatus("scanning");
    setScanError("");
    setScannedDevice(null);

    try {
      const el = scannerContainerRef.current;
      if (!el) return;

      const scanner = new Html5Qrcode("qr-scanner-region");
      scannerRef.current = scanner;

      await scanner.start(
        selectedCameraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScanResult(decodedText);
        },
        () => {},
      );
    } catch (err: any) {
      setScanStatus("error");
      const msg = err?.message ?? "Could not start camera.";
      if (/permission|NotAllowed|denied/i.test(msg)) {
        setScanError("Camera permission denied. Allow camera access in your browser/system settings and try again.");
      } else if (/NotFound|not found|requested device/i.test(msg)) {
        setScanError("Selected camera not found. Try selecting a different camera.");
      } else {
        setScanError(msg);
      }
      stopScanner();
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      }
    } catch {}
    scannerRef.current = null;
  };

  const handleScanResult = async (decodedText: string) => {
    try {
      const parsed = JSON.parse(decodedText);
      if (!parsed.deviceId || !parsed.shortCode) {
        setScanError("Invalid QR code. Expected a Relay pairing code.");
        setScanStatus("error");
        return;
      }

      await stopScanner();
      setScannedDevice({ deviceId: parsed.deviceId, deviceName: parsed.deviceName ?? "Unknown device" });
      setScanStatus("pairing");

      const core = getCore();
      if (core.sendSignal) {
        core.sendSignal(
          {
            type: "pair-verify",
            code: parsed.shortCode,
            fromId: core.deviceId,
            fromName: settings.deviceName,
          },
          parsed.deviceId,
        );
        setScanStatus("paired");
      } else {
        setScanStatus("error");
        setScanError("Signaling not available.");
      }
    } catch {
      setScanError("Could not parse QR code.");
      setScanStatus("error");
    }
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const handleTabChange = (newTab: TabType) => {
    if (tab === "scan" && newTab !== "scan") {
      stopScanner();
      setScanStatus("");
      setScanError("");
      setScannedDevice(null);
    }
    setTab(newTab);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Pair Device</h1>
        <p className="mt-1 text-sm text-white/50">
          Generate a QR code or pairing code for another device to scan.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant={tab === "generate" ? "primary" : "ghost"} size="sm" onClick={() => handleTabChange("generate")}>
          Show Code
        </Button>
        <Button variant={tab === "scan" ? "primary" : "ghost"} size="sm" onClick={() => handleTabChange("scan")}>
          Scan QR
        </Button>
        <Button variant={tab === "enter" ? "primary" : "ghost"} size="sm" onClick={() => handleTabChange("enter")}>
          Enter Code
        </Button>
      </div>

      {tab === "generate" ? (
        <Card>
          <SectionTitle
            title="QR Code"
            subtitle={countdown > 0 ? `Expires in ${countdown}s` : "Expired"}
            action={<Button size="sm" variant="ghost" onClick={handleRefresh}>Refresh</Button>}
          />
          <div className="flex flex-col items-center gap-4 py-4">
            {qrDataUrl ? (
              <div className="rounded-2xl bg-white p-4">
                <img src={qrDataUrl} alt="Pairing QR Code" className="h-48 w-48 sm:h-64 sm:w-64" />
              </div>
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-white/5 text-white/30">
                Generating...
              </div>
            )}
            {countdown > 0 && (
              <div className="h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-brand-400 transition-all duration-1000" style={{ width: `${(countdown / 60) * 100}%` }} />
              </div>
            )}
          </div>

          <SectionTitle title="4-Digit Code" subtitle={countdown > 0 ? `Expires in ${countdown}s` : "Expired"} />
          <div className="flex flex-col items-center gap-3 py-4">
            <p className="text-4xl font-bold tracking-[0.5em] text-white">{shortCode}</p>
            <p className="text-xs text-white/40">Enter this code on the other device</p>
          </div>
        </Card>
      ) : tab === "scan" ? (
        <Card>
          <SectionTitle title="Scan QR Code" subtitle="Point your camera at a Relay pairing QR code" />
          <div className="flex flex-col items-center gap-4 py-4">
            {cameraStatus === "detecting" && (
              <div className="flex flex-col items-center gap-2 text-sm text-white/50">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-brand-400" />
                <p>Detecting cameras...</p>
              </div>
            )}
            {cameraStatus === "none" && scanStatus === "" && (
              <div className="flex flex-col items-center gap-3 rounded-xl bg-white/5 p-6 text-center">
                <p className="text-sm text-white/70">No camera detected on this device.</p>
                <p className="text-xs text-white/40">Connect a webcam or use the "Enter Code" tab to pair manually.</p>
                <Button size="sm" variant="ghost" onClick={detectCameras}>Retry</Button>
              </div>
            )}
            {cameraStatus === "ready" && cameras.length > 1 && scanStatus === "" && (
              <div className="flex w-full max-w-sm flex-col gap-1.5">
                <label className="text-xs font-medium text-white/50">Camera</label>
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div id="qr-scanner-region" ref={scannerContainerRef} className="w-full max-w-sm overflow-hidden rounded-2xl" />

            {scanStatus === "" && cameraStatus === "ready" && (
              <Button onClick={startScanner}>Start Scanning</Button>
            )}
            {scanStatus === "scanning" && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-white/60">Scanning...</p>
                <Button variant="ghost" size="sm" onClick={async () => { await stopScanner(); setScanStatus(""); }}>Cancel</Button>
              </div>
            )}
            {scanStatus === "pairing" && scannedDevice && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-white/80">Pairing with <span className="font-semibold text-white">{scannedDevice.deviceName}</span>...</p>
              </div>
            )}
            {scanStatus === "paired" && scannedDevice && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-emerald-300">Pairing request sent to {scannedDevice.deviceName}! Waiting for acceptance...</p>
              </div>
            )}
            {scanStatus === "error" && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-center text-sm text-rose-300">{scanError}</p>
                <Button size="sm" onClick={() => { setScanStatus(""); setScanError(""); detectCameras(); }}>Try Again</Button>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <SectionTitle title="Enter pairing code" subtitle="Enter the 4-digit code shown on the other device" />
          <div className="flex flex-col gap-4 py-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={entryCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                setEntryCode(val);
                setEntryError("");
                setEntrySuccess(false);
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && entryCode.length === 4) handleVerifyCode(); }}
              placeholder="0000"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-center text-3xl font-bold tracking-[0.3em] text-white outline-none transition placeholder:text-white/20 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
            />
            {entryError && <p className="text-center text-sm text-rose-300">{entryError}</p>}
            {entrySuccess && <p className="text-center text-sm text-emerald-300">Code sent! Waiting for response...</p>}
            <Button onClick={handleVerifyCode} disabled={entryCode.length !== 4}>
              Verify & Pair
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
