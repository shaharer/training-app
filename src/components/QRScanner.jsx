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
  const [error, setError] = useState(null);

  useEffect(() => {
    let html5QrCode = null;

    async function start() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            const parsed = parseQRData(decodedText);
            if (parsed) {
              html5QrCode.stop().catch(() => {});
              onScan(parsed, decodedText);
            }
          },
          () => {}
        );
      } catch (err) {
        console.error("Camera error:", err);
        setError("Camera access denied or unavailable. Try manual entry instead.");
      }
    }

    start();
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, [onScan]);

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

      <div id="qr-reader" style={{
        width: "100%", borderRadius: 16, overflow: "hidden", marginBottom: 16,
        background: "#0A0A0F", minHeight: 280,
      }} />

      {error && (
        <div style={{
          padding: 14, background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)",
          borderRadius: 12, fontSize: 13, color: "#FF6B6B",
        }}>{error}</div>
      )}

      <div style={{ fontSize: 12, color: "#555", textAlign: "center", lineHeight: 1.6 }}>
        Point camera at a machine QR code.
      </div>
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
        Display on another screen and scan, or print them to stick on gym machines.
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
