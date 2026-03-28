import { useEffect, useRef, useState } from "react";

export function parseQRData(rawText) {
  try {
    const json = JSON.parse(rawText);
    if (json.name && json.muscle) return { name: json.name, muscle: json.muscle, machineId: json.machineId || null };
  } catch {}
  if (rawText.includes("|")) {
    const [name, muscle] = rawText.split("|");
    if (name && muscle) return { name: name.trim(), muscle: muscle.trim(), machineId: null };
  }
  if (rawText.length > 0 && rawText.length < 100) {
    return { name: rawText.trim(), muscle: "Other", machineId: null };
  }
  return null;
}

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const mountedRef = useRef(true);
  const [error, setError] = useState(null);
  const [manualInput, setManualInput] = useState("");
  const [showManual, setShowManual] = useState(false);
  const containerIdRef = useRef("qr-reader-" + Date.now());

  useEffect(() => {
    mountedRef.current = true;
    let started = false;

    async function start() {
      await new Promise((r) => setTimeout(r, 300));
      if (!mountedRef.current) return;

      const container = document.getElementById(containerIdRef.current);
      if (!container) {
        setError("Scanner container not found. Use manual input below.");
        setShowManual(true);
        return;
      }

      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mountedRef.current) return;

        const html5QrCode = new Html5Qrcode(containerIdRef.current);
        scannerRef.current = html5QrCode;

        let cameras = [];
        try {
          cameras = await Html5Qrcode.getCameras();
        } catch (camErr) {
          console.warn("getCameras failed, trying facingMode fallback");
        }

        if (cameras && cameras.length > 0) {
          let cameraId = cameras[0].id;
          const backCam = cameras.find((c) =>
            c.label.toLowerCase().includes("back") ||
            c.label.toLowerCase().includes("rear") ||
            c.label.toLowerCase().includes("environment")
          );
          if (backCam) cameraId = backCam.id;

          await html5QrCode.start(
            cameraId,
            { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
            (decodedText) => {
              if (!mountedRef.current) return;
              const parsed = parseQRData(decodedText);
              if (parsed) {
                html5QrCode.stop().catch(() => {});
                started = false;
                onScan(parsed, decodedText);
              }
            },
            () => {}
          );
        } else {
          await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
            (decodedText) => {
              if (!mountedRef.current) return;
              const parsed = parseQRData(decodedText);
              if (parsed) {
                html5QrCode.stop().catch(() => {});
                started = false;
                onScan(parsed, decodedText);
              }
            },
            () => {}
          );
        }
        started = true;
      } catch (err) {
        console.error("QR Scanner error:", err);
        if (!mountedRef.current) return;
        const msg = err.toString();
        if (msg.includes("NotAllowed") || msg.includes("Permission")) {
          setError("Camera permission denied. Allow camera access in Settings > Safari, or use manual input.");
        } else if (msg.includes("NotFound") || msg.includes("No cameras")) {
          setError("No camera found. Use manual input below.");
        } else if (msg.includes("NotReadable") || msg.includes("Could not start")) {
          setError("Camera is in use by another app, or not available. Use manual input below.");
        } else {
          setError("Camera could not start. This sometimes happens on iOS. Use manual input below.");
        }
        setShowManual(true);
      }
    }

    start();

    return () => {
      mountedRef.current = false;
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch (e) {}
      }
      scannerRef.current = null;
    };
  }, [onScan]);

  const handleManualSubmit = () => {
    if (!manualInput.trim()) return;
    const parsed = parseQRData(manualInput.trim());
    if (parsed) {
      onScan(parsed, manualInput.trim());
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "#C6FF00", fontFamily: "'Space Mono', monospace", letterSpacing: "2px" }}>
          SCANNING FOR QR CODE
        </div>
        <button onClick={onClose} style={{
          background: "none", border: "1px solid #333", color: "#888",
          padding: "6px 14px", borderRadius: 100, fontSize: 11, cursor: "pointer",
        }}>Cancel</button>
      </div>

      <div
        id={containerIdRef.current}
        style={{
          width: "100%", borderRadius: 16, overflow: "hidden", marginBottom: 16,
          background: "#0A0A0F", minHeight: 280,
        }}
      />

      {error && (
        <div style={{
          padding: 14, background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)",
          borderRadius: 12, fontSize: 13, color: "#FF6B6B", marginBottom: 12, lineHeight: 1.5,
        }}>{error}</div>
      )}

      {showManual && (
        <div style={{
          padding: 16, background: "#0A0A0F", borderRadius: 12,
          border: "1px solid #2A2A35", marginTop: 8,
        }}>
          <div style={{ fontSize: 10, color: "#888", fontFamily: "'Space Mono', monospace", letterSpacing: "1px", marginBottom: 8 }}>
            PASTE QR CODE DATA MANUALLY
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder='{"name":"Chest Press","muscle":"Chest"}'
              style={{
                flex: 1, background: "#141419", border: "1px solid #2A2A35", borderRadius: 8,
                padding: "10px 12px", color: "#E8E6E1", fontSize: 13, outline: "none",
                fontFamily: "'Space Mono', monospace",
              }}
            />
            <button onClick={handleManualSubmit} style={{
              background: "#C6FF00", color: "#0A0A0F", border: "none",
              padding: "10px 16px", borderRadius: 8, fontSize: 13,
              fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            }}>Go</button>
          </div>
        </div>
      )}

      {!showManual && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6, marginBottom: 8 }}>
            Point camera at a machine QR code.
          </div>
          <button onClick={() => setShowManual(true)} style={{
            background: "none", border: "none", color: "#666",
            fontSize: 12, cursor: "pointer", textDecoration: "underline",
          }}>Camera not working? Enter manually</button>
        </div>
      )}
    </div>
  );
}

export function QRGenerator() {
  const [show, setShow] = useState(false);
  const [qrImages, setQrImages] = useState([]);

  const testExercises = [
    { name: "Chest Press", muscle: "Chest", machineId: "CP-01" },
    { name: "Lat Pulldown", muscle: "Back", machineId: "LP-01" },
    { name: "Leg Press", muscle: "Legs", machineId: "LG-01" },
    { name: "Shoulder Press", muscle: "Shoulders", machineId: "SP-01" },
    { name: "Cable Row", muscle: "Back", machineId: "CR-01" },
    { name: "Bicep Curl Machine", muscle: "Arms", machineId: "BC-01" },
    { name: "Leg Extension", muscle: "Legs", machineId: "LE-01" },
    { name: "Pec Fly", muscle: "Chest", machineId: "PF-01" },
  ];

  const muscleColors = {
    Chest: "#FF6B6B", Back: "#4ECDC4", Legs: "#FFE66D",
    Shoulders: "#A8E6CF", Arms: "#DDA0DD", Core: "#FF9A76", Other: "#888",
  };

  useEffect(() => {
    if (!show || qrImages.length > 0) return;
    (async () => {
      try {
        const QRCode = await import("qrcode");
        const imgs = await Promise.all(
          testExercises.map(async (ex) => ({
            ...ex,
            url: await QRCode.toDataURL(JSON.stringify(ex), {
              width: 200, margin: 2,
              color: { dark: "#C6FF00", light: "#0A0A0F" },
            }),
          }))
        );
        setQrImages(imgs);
      } catch (err) { console.error(err); }
    })();
  }, [show]);

  if (!show) {
    return (
      <button onClick={() => setShow(true)} style={{
        width: "100%", background: "rgba(198,255,0,0.05)", border: "1px dashed rgba(198,255,0,0.2)",
        borderRadius: 14, padding: 16, cursor: "pointer", color: "#888", fontSize: 13,
        fontFamily: "'Space Mono', monospace", marginTop: 16,
      }}>
        Generate Test QR Codes
      </button>
    );
  }

  return (
    <div style={{ marginTop: 16, padding: 20, background: "#141419", borderRadius: 16, border: "1px solid #1E1E26" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: "#C6FF00", fontFamily: "'Space Mono', monospace", letterSpacing: "2px" }}>
          TEST QR CODES
        </div>
        <button onClick={() => setShow(false)} style={{
          background: "none", border: "1px solid #333", color: "#888",
          padding: "4px 10px", borderRadius: 100, fontSize: 10, cursor: "pointer",
        }}>Hide</button>
      </div>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 14, lineHeight: 1.5 }}>
        Display on another screen and scan, or print for your gym machines.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {qrImages.map((ex) => (
          <div key={ex.machineId} style={{
            background: "#0A0A0F", borderRadius: 10, padding: 10, textAlign: "center",
            border: "1px solid #1E1E26",
          }}>
            <img src={ex.url} alt={ex.name} style={{ width: "100%", borderRadius: 8 }} />
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: "#E8E6E1" }}>{ex.name}</div>
            <div style={{ fontSize: 10, color: muscleColors[ex.muscle] }}>{ex.muscle}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
