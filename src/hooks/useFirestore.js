import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

// ─── Workouts (subcollection: users/{uid}/workouts) ─────────────
export function useWorkouts() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setWorkouts([]); setLoading(false); return; }

    const q = query(
      collection(db, "users", user.uid, "workouts"),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setWorkouts(data);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const addWorkout = useCallback(async (entry) => {
    if (!user) return;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const workout = {
      ...entry,
      date: new Date().toISOString().split("T")[0],
      timestamp: Date.now(),
    };
    await setDoc(doc(db, "users", user.uid, "workouts", id), workout);
    return id;
  }, [user]);

  const removeWorkout = useCallback(async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "workouts", id));
  }, [user]);

  return { workouts, loading, addWorkout, removeWorkout };
}

// ─── Weekly Plan (single doc: users/{uid}/settings/plan) ────────
export function usePlan() {
  const { user } = useAuth();
  const DEFAULT_PLAN = {
    Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [],
  };
  const [plan, setPlan] = useState(DEFAULT_PLAN);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setPlan(DEFAULT_PLAN); setLoading(false); return; }

    const unsub = onSnapshot(
      doc(db, "users", user.uid, "settings", "plan"),
      (snap) => {
        if (snap.exists()) {
          setPlan({ ...DEFAULT_PLAN, ...snap.data() });
        } else {
          setPlan(DEFAULT_PLAN);
        }
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  const updatePlan = useCallback(async (newPlan) => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid, "settings", "plan"), newPlan);
  }, [user]);

  return { plan, loading, updatePlan };
}

// ─── Saved Videos (subcollection: users/{uid}/videos) ───────────
export function useVideos() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setVideos([]); setLoading(false); return; }

    const q = query(
      collection(db, "users", user.uid, "videos"),
      orderBy("savedAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setVideos(data);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const addVideo = useCallback(async (video) => {
    if (!user) return;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await setDoc(doc(db, "users", user.uid, "videos", id), {
      ...video,
      savedAt: Date.now(),
    });
    return id;
  }, [user]);

  const removeVideo = useCallback(async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "videos", id));
  }, [user]);

  return { videos, loading, addVideo, removeVideo };
}

// ─── User Profile (stores custom exercises, preferences) ────────
export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ customExercises: [] });

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(
      doc(db, "users", user.uid, "settings", "profile"),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data());
        }
      }
    );
    return unsub;
  }, [user]);

  const updateProfile = useCallback(async (data) => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid, "settings", "profile"), data, { merge: true });
  }, [user]);

  return { profile, updateProfile };
}
