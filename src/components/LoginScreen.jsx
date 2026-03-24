import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError("Sign-in failed. Please try again.");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0A0A0F", color: "#E8E6E1",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: 32,
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: "-200px", right: "-100px", width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(198,255,0,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "-200px", left: "-100px", width: "400px", height: "400px",
        background: "radial-gradient(circle, rgba(78,205,196,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{
          width: 80, height: 80, borderRadius: 24, margin: "0 auto 28px",
          background: "linear-gradient(135deg, #C6FF00, #4ECDC4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, fontWeight: 700, color: "#0A0A0F",
        }}>
          AI
        </div>

        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#C6FF00",
          letterSpacing: "4px", textTransform: "uppercase", marginBottom: 12,
        }}>
          TRAIN AI
        </div>

        <h1 style={{
          fontSize: 32, fontWeight: 700, letterSpacing: "-0.5px",
          margin: "0 0 12px", lineHeight: 1.2,
        }}>
          Your AI training<br />assistant<span style={{ color: "#C6FF00" }}>.</span>
        </h1>

        <p style={{
          fontSize: 15, color: "#888", lineHeight: 1.6, margin: "0 0 40px",
        }}>
          Log workouts from QR scans, videos, or manual entry.
          AI-powered planning adapts to your progress.
        </p>

        {/* Google Sign-in Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 12, width: "100%", padding: "16px 24px",
            background: "#fff", color: "#333", border: "none",
            borderRadius: 100, fontSize: 16, fontWeight: 600,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "opacity 0.2s, transform 0.1s",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
          onMouseDown={(e) => !loading && (e.currentTarget.style.transform = "scale(0.98)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {/* Google logo SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        {error && (
          <div style={{
            marginTop: 16, padding: 14,
            background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)",
            borderRadius: 12, fontSize: 13, color: "#FF6B6B",
          }}>
            {error}
          </div>
        )}

        <p style={{
          marginTop: 32, fontSize: 12, color: "#444", lineHeight: 1.5,
        }}>
          Your data is stored securely per-account.
          <br />No one else can see your workouts.
        </p>
      </div>
    </div>
  );
}
