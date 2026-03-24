import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useWorkouts, usePlan, useVideos, useUserProfile } from "../hooks/useFirestore";
import QRScanner, { QRGenerator } from "./QRScanner";

const MUSCLE_GROUPS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Other"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const muscleColors = {
  Chest: "#FF6B6B", Back: "#4ECDC4", Legs: "#FFE66D",
  Shoulders: "#A8E6CF", Arms: "#DDA0DD", Core: "#FF9A76", Other: "#888",
};

const AI_TIPS = [
  "Log consistently for 2 weeks and I'll start suggesting progressive overload targets.",
  "Tip: Scan gym machine QR codes for faster, error-free exercise logging.",
  "Save exercises from videos to build a reference library of proper form cues.",
  "Balance your push/pull ratio — check your muscle distribution on the dashboard.",
  "Rest days are training days. Recovery is where growth happens.",
];

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 2000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "#1A1A22", borderRadius: 20, padding: 28, maxWidth: 320, width: "100%",
        border: "1px solid #2A2A35",
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, lineHeight: 1.5, color: "#E8E6E1" }}>
          {message}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: 14, background: "#2A2A35", border: "none", borderRadius: 12,
            color: "#888", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: 14, background: "#FF6B6B", border: "none", borderRadius: 12,
            color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function TrainingApp() {
  const { user, logout } = useAuth();
  const { workouts, addWorkout, removeWorkout } = useWorkouts();
  const { plan, updatePlan } = usePlan();
  const { videos, addVideo, removeVideo } = useVideos();
  const { profile, updateProfile } = useUserProfile();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [aiTipIndex, setAiTipIndex] = useState(0);
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Log tab state
  const [inputMode, setInputMode] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedMachine, setScannedMachine] = useState(null);
  const [qrForm, setQrForm] = useState({ weight: "", reps: "", sets: "" });
  const [manualForm, setManualForm] = useState({ exercise: "", muscle: "Chest", weight: "", reps: "", sets: "" });
  const [videoForm, setVideoForm] = useState({ url: "", creator: "", title: "", exercise: "", muscle: "Chest" });

  // Plan tab
  const [editingDay, setEditingDay] = useState(null);
  const [planExForm, setPlanExForm] = useState({ exercise: "", muscle: "Chest" });

  useEffect(() => {
    const interval = setInterval(() => setAiTipIndex((i) => (i + 1) % AI_TIPS.length), 6000);
    return () => clearInterval(interval);
  }, []);

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // ─── Handlers ─────────────────────────────────────────────────
  const handleManualSubmit = async () => {
    if (!manualForm.exercise || !manualForm.weight || !manualForm.reps || !manualForm.sets) return;
    await addWorkout({
      exercise: manualForm.exercise, muscle: manualForm.muscle,
      weight: Number(manualForm.weight), reps: Number(manualForm.reps),
      sets: Number(manualForm.sets), source: "manual",
    });
    showNotif(`✓ Logged: ${manualForm.exercise}`);
    setManualForm({ exercise: "", muscle: "Chest", weight: "", reps: "", sets: "" });
  };

  const handleQRResult = useCallback((parsed) => {
    setScannedMachine(parsed);
    setScannerActive(false);
    setQrForm({ weight: "", reps: "", sets: "" });
  }, []);

  const handleQRLog = async () => {
    if (!scannedMachine || !qrForm.weight || !qrForm.reps || !qrForm.sets) return;
    await addWorkout({
      exercise: scannedMachine.name, muscle: scannedMachine.muscle,
      weight: Number(qrForm.weight), reps: Number(qrForm.reps),
      sets: Number(qrForm.sets), source: "qr", machineId: scannedMachine.machineId,
    });
    showNotif(`✓ Logged: ${scannedMachine.name}`);
    setScannedMachine(null);
    setQrForm({ weight: "", reps: "", sets: "" });
  };

  const handleVideoSave = async () => {
    if (!videoForm.exercise || !videoForm.creator || !videoForm.title) return;
    await addVideo(videoForm);
    await addWorkout({
      exercise: videoForm.exercise, muscle: videoForm.muscle,
      weight: 0, reps: 0, sets: 0, source: "video",
      videoRef: videoForm.url || videoForm.title,
    });
    showNotif(`✓ Saved: ${videoForm.exercise}`);
    setVideoForm({ url: "", creator: "", title: "", exercise: "", muscle: "Chest" });
  };

  const handleDeleteWorkout = (id) => {
    setConfirmDialog({
      message: "Delete this workout entry?",
      onConfirm: async () => { await removeWorkout(id); setConfirmDialog(null); showNotif("Deleted"); },
    });
  };

  const addToPlan = async (day) => {
    if (!planExForm.exercise) return;
    const newPlan = {
      ...plan,
      [day]: [...(plan[day] || []), { exercise: planExForm.exercise, muscle: planExForm.muscle }],
    };
    await updatePlan(newPlan);
    setPlanExForm({ exercise: "", muscle: "Chest" });
    setEditingDay(null);
  };

  const removeFromPlan = async (day, index) => {
    const newPlan = { ...plan, [day]: plan[day].filter((_, i) => i !== index) };
    await updatePlan(newPlan);
  };

  // ─── Computed ─────────────────────────────────────────────────
  const totalVolume = workouts.reduce((s, w) => s + (w.weight || 0) * (w.reps || 0) * (w.sets || 0), 0);
  const muscleBreakdown = workouts.reduce((acc, w) => {
    acc[w.muscle] = (acc[w.muscle] || 0) + (w.sets || 0); return acc;
  }, {});
  const maxMuscle = Object.entries(muscleBreakdown).sort((a, b) => b[1] - a[1]);
  const totalSets = workouts.reduce((s, w) => s + (w.sets || 0), 0);
  const uniqueDays = [...new Set(workouts.map((w) => w.date))].length;
  const todayDayName = WEEKDAYS[((new Date().getDay() + 6) % 7)];

  const knownExercises = [...new Set(workouts.map((w) => w.exercise))].sort();
  const sourceIcon = (s) => (s === "qr" ? "📱" : s === "video" ? "🎬" : "✏️");
  const sourceLabel = (s) => (s === "qr" ? "QR Scan" : s === "video" ? "Video" : "Manual");

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    background: "#0A0A0F", border: "1px solid #2A2A35", borderRadius: 10,
    padding: "12px 14px", color: "#E8E6E1", fontSize: 15,
    fontFamily: "'DM Sans', sans-serif", outline: "none",
  };
  const numInputStyle = { ...inputStyle, fontSize: 18, fontFamily: "'Space Mono', monospace", textAlign: "center" };
  const labelStyle = { fontSize: 10, color: "#555", fontFamily: "'Space Mono', monospace", letterSpacing: "1px", marginBottom: 6, display: "block" };
  const primaryBtn = (disabled) => ({
    width: "100%", background: "#C6FF00", color: "#0A0A0F", border: "none",
    padding: "14px", borderRadius: 100, fontSize: 14, fontWeight: 700,
    cursor: disabled ? "default" : "pointer", fontFamily: "'Space Mono', monospace",
    opacity: disabled ? 0.4 : 1, transition: "opacity 0.2s",
  });

  const MuscleSelect = ({ value, onChange }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {MUSCLE_GROUPS.map((m) => (
        <button key={m} onClick={() => onChange(m)} style={{
          background: value === m ? (muscleColors[m] || "#888") + "33" : "#0A0A0F",
          border: `1px solid ${value === m ? muscleColors[m] || "#888" : "#2A2A35"}`,
          color: value === m ? muscleColors[m] || "#888" : "#666",
          padding: "8px 14px", borderRadius: 100, fontSize: 12,
          fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease",
        }}>{m}</button>
      ))}
    </div>
  );

  const NumFields = ({ form, setForm, fields }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
      {fields.map((f) => (
        <div key={f.key}>
          <span style={labelStyle}>{f.label.toUpperCase()}</span>
          <input type="number" inputMode="numeric" placeholder={f.ph} value={form[f.key]}
            onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
            style={numInputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#C6FF00")}
            onBlur={(e) => (e.target.style.borderColor = "#2A2A35")}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: "#0A0A0F", color: "#E8E6E1",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* Ambient */}
      <div style={{ position: "fixed", top: -200, right: -200, width: 600, height: 600,
        background: "radial-gradient(circle, rgba(198,255,0,0.06) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -300, left: -100, width: 500, height: 500,
        background: "radial-gradient(circle, rgba(78,205,196,0.05) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0 }} />

      {notification && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 1000,
          background: "#C6FF00", color: "#0A0A0F", padding: "12px 24px", borderRadius: 100,
          fontWeight: 700, fontSize: 14, fontFamily: "'Space Mono', monospace",
          boxShadow: "0 8px 32px rgba(198,255,0,0.3)", animation: "slideDown 0.3s ease",
        }}>{notification}</div>
      )}

      {confirmDialog && (
        <ConfirmDialog message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(null)} />
      )}

      <style>{`
        @keyframes slideDown { from { opacity:0; transform: translateX(-50%) translateY(-20px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        input:focus { border-color: #C6FF00 !important; }
        #qr-reader video { border-radius: 12px !important; }
        #qr-reader { border: none !important; }
        #qr-reader__dashboard { display: none !important; }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "24px 24px 0", position: "relative", zIndex: 1,
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      }}>
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#C6FF00",
            letterSpacing: "3px", textTransform: "uppercase", marginBottom: 4 }}>
            AI TRAINING ASSISTANT
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" }}>
            Hey, {user?.displayName?.split(" ")[0] || "athlete"}<span style={{ color: "#C6FF00" }}>.</span>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowUserMenu(!showUserMenu)} style={{
            width: 42, height: 42, borderRadius: "50%", border: "2px solid #C6FF00",
            background: "transparent", cursor: "pointer", padding: 0, overflow: "hidden",
          }}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
            ) : (
              <div style={{
                width: "100%", height: "100%", background: "linear-gradient(135deg, #C6FF00, #4ECDC4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 700, color: "#0A0A0F",
              }}>{(user?.displayName || "?")[0]}</div>
            )}
          </button>
          {showUserMenu && (
            <div style={{
              position: "absolute", top: 50, right: 0, background: "#1A1A22",
              border: "1px solid #2A2A35", borderRadius: 14, padding: 8, minWidth: 200,
              zIndex: 100, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}>
              <div style={{ padding: "10px 14px", fontSize: 13, color: "#888", borderBottom: "1px solid #2A2A35" }}>
                {user?.email}
              </div>
              <button onClick={() => { logout(); setShowUserMenu(false); }} style={{
                width: "100%", textAlign: "left", background: "none", border: "none",
                padding: "10px 14px", color: "#FF6B6B", fontSize: 14, cursor: "pointer",
              }}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Tip */}
      <div style={{
        margin: "16px 24px", padding: "14px 18px",
        background: "rgba(198,255,0,0.06)", border: "1px solid rgba(198,255,0,0.15)",
        borderRadius: 16, position: "relative", zIndex: 1,
      }}>
        <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: "#C6FF00", letterSpacing: "2px", marginBottom: 6 }}>
          AI COACH
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: "#B8B5AD", fontStyle: "italic" }}>
          {AI_TIPS[aiTipIndex]}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 2, margin: "0 24px", padding: 3,
        background: "#141419", borderRadius: 14, position: "relative", zIndex: 1,
      }}>
        {["dashboard", "log", "plan", "library"].map((tab) => (
          <button key={tab} onClick={() => { setActiveTab(tab); setShowUserMenu(false); }} style={{
            flex: 1, padding: "10px 0", border: "none", borderRadius: 12, cursor: "pointer",
            fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700,
            letterSpacing: "0.5px",
            background: activeTab === tab ? "#C6FF00" : "transparent",
            color: activeTab === tab ? "#0A0A0F" : "#666",
            transition: "all 0.2s ease", textTransform: "capitalize",
          }}>{tab}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "20px 24px 120px", position: "relative", zIndex: 1 }}
        onClick={() => showUserMenu && setShowUserMenu(false)}>

        {/* ═══════ DASHBOARD ═══════ */}
        {activeTab === "dashboard" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Volume", value: totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}k` : "0", unit: "lbs" },
                { label: "Sessions", value: uniqueDays, unit: "days" },
                { label: "Sets", value: totalSets, unit: "total" },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "#141419", borderRadius: 16, padding: "16px 14px", border: "1px solid #1E1E26",
                }}>
                  <div style={{ fontSize: 10, color: "#666", fontFamily: "'Space Mono', monospace", letterSpacing: "1px", marginBottom: 8 }}>
                    {s.label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700 }}>
                    {s.value}<span style={{ fontSize: 12, color: "#555", marginLeft: 3 }}>{s.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {maxMuscle.length > 0 && (
              <div style={{ background: "#141419", borderRadius: 16, padding: 20, border: "1px solid #1E1E26", marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: "#666", fontFamily: "'Space Mono', monospace", letterSpacing: "2px", marginBottom: 16 }}>
                  MUSCLE DISTRIBUTION
                </div>
                {maxMuscle.map(([muscle, sets]) => (
                  <div key={muscle} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 72, fontSize: 12, color: "#888", fontFamily: "'Space Mono', monospace" }}>{muscle}</div>
                    <div style={{ flex: 1, height: 24, background: "#1E1E26", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${Math.min((sets / Math.max(totalSets, 1)) * 100, 100)}%`,
                        background: muscleColors[muscle] || "#888", borderRadius: 6, opacity: 0.8,
                      }} />
                    </div>
                    <div style={{ width: 36, fontSize: 13, fontWeight: 700, textAlign: "right", fontFamily: "'Space Mono', monospace" }}>{sets}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: "#141419", borderRadius: 16, padding: 20, border: "1px solid #1E1E26", marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: "#666", fontFamily: "'Space Mono', monospace", letterSpacing: "2px", marginBottom: 16 }}>THIS WEEK</div>
              <div style={{ display: "flex", gap: 8 }}>
                {WEEKDAYS.map((day) => {
                  const n = plan[day]?.length || 0;
                  const isToday = day === todayDayName;
                  return (
                    <div key={day} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{
                        height: 48, borderRadius: 10,
                        background: n > 0 ? `rgba(198,255,0,${0.15 + n * 0.12})` : "#1E1E26",
                        border: isToday ? "2px solid #C6FF00" : "1px solid transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 700, color: n > 0 ? "#C6FF00" : "#333",
                      }}>{n > 0 ? n : "—"}</div>
                      <div style={{ marginTop: 6, fontSize: 10, fontFamily: "'Space Mono', monospace",
                        color: isToday ? "#C6FF00" : "#555", fontWeight: isToday ? 700 : 400 }}>{day}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ fontSize: 10, color: "#666", fontFamily: "'Space Mono', monospace", letterSpacing: "2px", marginBottom: 12 }}>RECENT ACTIVITY</div>
            {workouts.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#444", fontSize: 14 }}>
                No workouts yet. Go to Log tab to start!
              </div>
            )}
            {workouts.slice(0, 10).map((w, i) => (
              <div key={w.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
                borderBottom: i < 9 ? "1px solid #1A1A22" : "none",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${muscleColors[w.muscle] || "#888"}22`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>{sourceIcon(w.source)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.exercise}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>{w.muscle} · {w.date} · {sourceLabel(w.source)}</div>
                </div>
                <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
                      {w.weight > 0 ? `${w.weight} lbs` : "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "#666" }}>{w.sets > 0 ? `${w.sets}×${w.reps}` : "ref"}</div>
                  </div>
                  <button onClick={() => handleDeleteWorkout(w.id)} style={{
                    background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 16, padding: "4px",
                  }}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ LOG ═══════ */}
        {activeTab === "log" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Log a workout</div>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 24 }}>Choose input method</div>

            {/* QR button */}
            <button onClick={() => { setInputMode(inputMode === "qr" ? null : "qr"); setScannerActive(false); setScannedMachine(null); }} style={{
              width: "100%", textAlign: "left",
              background: inputMode === "qr" ? "rgba(198,255,0,0.08)" : "#141419",
              border: `1px solid ${inputMode === "qr" ? "rgba(198,255,0,0.3)" : "#1E1E26"}`,
              borderRadius: 16, padding: "18px 20px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 16, marginBottom: 10,
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: "linear-gradient(135deg, #C6FF00, #88CC00)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📱</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#E8E6E1" }}>QR Code Scan</div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>Scan machine QR → auto-fill exercise</div>
              </div>
            </button>

            {/* Video button */}
            <button onClick={() => setInputMode(inputMode === "video" ? null : "video")} style={{
              width: "100%", textAlign: "left",
              background: inputMode === "video" ? "rgba(78,205,196,0.08)" : "#141419",
              border: `1px solid ${inputMode === "video" ? "rgba(78,205,196,0.3)" : "#1E1E26"}`,
              borderRadius: 16, padding: "18px 20px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 16, marginBottom: 20,
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: "linear-gradient(135deg, #4ECDC4, #2EAD9F)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎬</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#E8E6E1" }}>Video Reference</div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>Save exercise from a creator's video</div>
              </div>
            </button>

            {/* QR Panel */}
            {inputMode === "qr" && (
              <div style={{
                background: "#141419", borderRadius: 20, padding: 24,
                border: "1px solid #1E1E26", marginBottom: 24, animation: "fadeIn 0.3s ease",
              }}>
                {!scannerActive && !scannedMachine && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      width: 180, height: 180, margin: "0 auto 20px",
                      border: "3px dashed #333", borderRadius: 20,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexDirection: "column", gap: 8,
                    }}>
                      <div style={{ fontSize: 40 }}>📷</div>
                      <div style={{ fontSize: 12, color: "#555" }}>Camera viewfinder</div>
                    </div>
                    <button onClick={() => setScannerActive(true)} style={{
                      background: "#C6FF00", color: "#0A0A0F", border: "none",
                      padding: "14px 40px", borderRadius: 100, fontSize: 14,
                      fontWeight: 700, cursor: "pointer", fontFamily: "'Space Mono', monospace",
                    }}>Open Camera & Scan</button>
                    <QRGenerator />
                  </div>
                )}

                {scannerActive && !scannedMachine && (
                  <QRScanner onScan={handleQRResult} onClose={() => setScannerActive(false)} />
                )}

                {scannedMachine && (
                  <div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 14, marginBottom: 20,
                      padding: 16, background: "rgba(198,255,0,0.06)", borderRadius: 14,
                    }}>
                      <div style={{ fontSize: 32 }}>✅</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: "#C6FF00", fontFamily: "'Space Mono', monospace", letterSpacing: "1.5px" }}>MACHINE DETECTED</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{scannedMachine.name}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{scannedMachine.muscle}</div>
                      </div>
                      <button onClick={() => { setScannedMachine(null); setScannerActive(false); }} style={{
                        background: "none", border: "1px solid #333", color: "#888",
                        padding: "6px 12px", borderRadius: 100, fontSize: 11, cursor: "pointer",
                      }}>Rescan</button>
                    </div>
                    <NumFields form={qrForm} setForm={setQrForm} fields={[
                      { key: "weight", label: "Weight (lbs)", ph: "135" },
                      { key: "reps", label: "Reps", ph: "10" },
                      { key: "sets", label: "Sets", ph: "3" },
                    ]} />
                    <button onClick={handleQRLog}
                      style={primaryBtn(!qrForm.weight || !qrForm.reps || !qrForm.sets)}>
                      Log This Set →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Video Panel */}
            {inputMode === "video" && (
              <div style={{
                background: "#141419", borderRadius: 20, padding: 24,
                border: "1px solid #1E1E26", marginBottom: 24, animation: "fadeIn 0.3s ease",
              }}>
                <div style={{ fontSize: 10, color: "#4ECDC4", fontFamily: "'Space Mono', monospace", letterSpacing: "2px", marginBottom: 20 }}>
                  SAVE FROM VIDEO
                </div>
                <div style={{ marginBottom: 14 }}>
                  <span style={labelStyle}>VIDEO URL (optional)</span>
                  <input type="url" placeholder="https://youtube.com/..." value={videoForm.url}
                    onChange={(e) => setVideoForm((p) => ({ ...p, url: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div>
                    <span style={labelStyle}>CREATOR</span>
                    <input type="text" placeholder="@FitWithMike" value={videoForm.creator}
                      onChange={(e) => setVideoForm((p) => ({ ...p, creator: e.target.value }))}
                      style={inputStyle} />
                  </div>
                  <div>
                    <span style={labelStyle}>VIDEO TITLE</span>
                    <input type="text" placeholder="Perfect Squat Form" value={videoForm.title}
                      onChange={(e) => setVideoForm((p) => ({ ...p, title: e.target.value }))}
                      style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <span style={labelStyle}>EXERCISE NAME</span>
                  <input type="text" placeholder="e.g. Bulgarian Split Squat" value={videoForm.exercise}
                    onChange={(e) => setVideoForm((p) => ({ ...p, exercise: e.target.value }))}
                    style={inputStyle} list="ex-list" />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <span style={labelStyle}>MUSCLE GROUP</span>
                  <MuscleSelect value={videoForm.muscle} onChange={(m) => setVideoForm((p) => ({ ...p, muscle: m }))} />
                </div>
                <button onClick={handleVideoSave}
                  style={primaryBtn(!videoForm.exercise || !videoForm.creator || !videoForm.title)}>
                  Save Video Reference →
                </button>
              </div>
            )}

            {/* Manual Entry */}
            <div style={{ background: "#141419", borderRadius: 20, padding: 24, border: "1px solid #1E1E26" }}>
              <div style={{ fontSize: 10, color: "#888", fontFamily: "'Space Mono', monospace", letterSpacing: "2px", marginBottom: 20 }}>
                MANUAL ENTRY
              </div>
              <datalist id="ex-list">
                {knownExercises.map((ex) => <option key={ex} value={ex} />)}
              </datalist>
              <div style={{ marginBottom: 14 }}>
                <span style={labelStyle}>EXERCISE NAME</span>
                <input type="text" placeholder="e.g. Bench Press" value={manualForm.exercise}
                  onChange={(e) => setManualForm((p) => ({ ...p, exercise: e.target.value }))}
                  style={inputStyle} list="ex-list" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <span style={labelStyle}>MUSCLE GROUP</span>
                <MuscleSelect value={manualForm.muscle} onChange={(m) => setManualForm((p) => ({ ...p, muscle: m }))} />
              </div>
              <NumFields form={manualForm} setForm={setManualForm} fields={[
                { key: "weight", label: "Weight (lbs)", ph: "135" },
                { key: "reps", label: "Reps", ph: "10" },
                { key: "sets", label: "Sets", ph: "3" },
              ]} />
              <button onClick={handleManualSubmit}
                style={primaryBtn(!manualForm.exercise || !manualForm.weight || !manualForm.reps || !manualForm.sets)}>
                Log Workout →
              </button>
            </div>
          </div>
        )}

        {/* ═══════ PLAN ═══════ */}
        {activeTab === "plan" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Weekly Plan</div>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 24 }}>Tap a day to add exercises</div>

            {WEEKDAYS.map((day) => {
              const exercises = plan[day] || [];
              const isRest = exercises.length === 0;
              const isEditing = editingDay === day;
              return (
                <div key={day} style={{
                  background: "#141419", borderRadius: 16, padding: "16px 20px",
                  border: `1px solid ${day === todayDayName ? "rgba(198,255,0,0.3)" : "#1E1E26"}`,
                  marginBottom: 10,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isRest && !isEditing ? 0 : 12 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 700, fontFamily: "'Space Mono', monospace",
                      color: day === todayDayName ? "#C6FF00" : isRest ? "#444" : "#E8E6E1",
                    }}>{day} {day === todayDayName ? "(today)" : ""}</div>
                    <button onClick={() => setEditingDay(isEditing ? null : day)} style={{
                      background: "none", border: "1px solid #333", color: isEditing ? "#C6FF00" : "#666",
                      padding: "4px 12px", borderRadius: 100, fontSize: 11, cursor: "pointer",
                      fontFamily: "'Space Mono', monospace",
                    }}>{isEditing ? "Done" : "+ Add"}</button>
                  </div>

                  {exercises.map((ex, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 12px", background: "#0A0A0F", borderRadius: 10, marginBottom: 6,
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: muscleColors[ex.muscle] || "#888" }} />
                      <div style={{ flex: 1, fontSize: 13, color: "#B8B5AD" }}>{ex.exercise}</div>
                      <button onClick={() => removeFromPlan(day, i)} style={{
                        background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 14, padding: "2px 4px",
                      }}>×</button>
                    </div>
                  ))}

                  {isEditing && (
                    <div style={{ marginTop: 10, padding: 14, background: "#0A0A0F", borderRadius: 12 }}>
                      <div style={{ marginBottom: 10 }}>
                        <input type="text" placeholder="Exercise name" value={planExForm.exercise}
                          onChange={(e) => setPlanExForm((p) => ({ ...p, exercise: e.target.value }))}
                          style={{ ...inputStyle, fontSize: 13 }} list="ex-list" />
                      </div>
                      <MuscleSelect value={planExForm.muscle}
                        onChange={(m) => setPlanExForm((p) => ({ ...p, muscle: m }))} />
                      <button onClick={() => addToPlan(day)} style={{
                        ...primaryBtn(!planExForm.exercise), marginTop: 10, padding: 10, fontSize: 12,
                      }}>Add to {day}</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════ LIBRARY ═══════ */}
        {activeTab === "library" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Exercise Library</div>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 24 }}>All exercises from every source</div>

            {Object.keys(muscleColors).map((muscle) => {
              const exercises = [...new Set(workouts.filter((w) => w.muscle === muscle).map((w) => w.exercise))];
              if (exercises.length === 0) return null;
              return (
                <div key={muscle} style={{ marginBottom: 24 }}>
                  <div style={{
                    fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: "2px",
                    color: muscleColors[muscle], marginBottom: 10,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: muscleColors[muscle] }} />
                    {muscle.toUpperCase()}
                  </div>
                  {exercises.map((ex) => {
                    const logs = workouts.filter((w) => w.exercise === ex);
                    const maxWeight = Math.max(...logs.map((l) => l.weight || 0));
                    const lastLog = logs[0];
                    return (
                      <div key={ex} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "14px 16px", background: "#141419", borderRadius: 14,
                        border: "1px solid #1E1E26", marginBottom: 8,
                      }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                          background: (muscleColors[muscle] || "#888") + "15",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                        }}>{sourceIcon(lastLog?.source)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex}</div>
                          <div style={{ fontSize: 11, color: "#666" }}>{logs.length} session{logs.length > 1 ? "s" : ""}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "#C6FF00" }}>
                            {maxWeight > 0 ? `${maxWeight} lbs` : "—"}
                          </div>
                          <div style={{ fontSize: 10, color: "#555" }}>best</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {videos.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: "2px",
                  color: "#4ECDC4", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  SAVED VIDEOS
                </div>
                {videos.map((v) => (
                  <div key={v.id} style={{
                    padding: "14px 16px", background: "#141419", borderRadius: 14,
                    border: "1px solid #1E1E26", marginBottom: 8,
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: "rgba(78,205,196,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                    }}>{v.url ? "🔗" : "🎬"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</div>
                      <div style={{ fontSize: 11, color: "#666" }}>{v.creator} · {v.exercise}</div>
                    </div>
                    {v.url && (
                      <a href={v.url} target="_blank" rel="noreferrer" style={{
                        background: "rgba(78,205,196,0.15)", border: "1px solid #4ECDC4",
                        color: "#4ECDC4", padding: "6px 12px", borderRadius: 100,
                        fontSize: 11, fontWeight: 700, textDecoration: "none", flexShrink: 0,
                      }}>Watch</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
