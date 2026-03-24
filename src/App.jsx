import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginScreen from "./components/LoginScreen";
import TrainingApp from "./components/TrainingApp";

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0A0A0F",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: 18,
          background: "linear-gradient(135deg, #C6FF00, #4ECDC4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 700, color: "#0A0A0F",
          animation: "pulse 1.5s ease infinite",
        }}>
          AI
        </div>
        <style>{`
          @keyframes pulse { 0%,100% { opacity: 0.5; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1); } }
        `}</style>
      </div>
    );
  }

  return user ? <TrainingApp /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
