import { useState, useRef, useEffect } from "react";

const muscleColors = {
  Chest: "#FF6B6B", Back: "#4ECDC4", Legs: "#FFE66D",
  Shoulders: "#A8E6CF", Arms: "#DDA0DD", Core: "#FF9A76", Other: "#888",
};

export default function ExercisePicker({ value, muscle, onSelect, knownExercises, placeholder }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Filter exercises by query text
  const filtered = knownExercises.filter((ex) =>
    ex.name.toLowerCase().includes(query.toLowerCase())
  );

  // Group by muscle
  const grouped = filtered.reduce((acc, ex) => {
    if (!acc[ex.muscle]) acc[ex.muscle] = [];
    acc[ex.muscle].push(ex);
    return acc;
  }, {});

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSelect = (ex) => {
    onSelect(ex);
    setQuery("");
    setIsOpen(false);
  };

  const handleAddNew = () => {
    if (query.trim()) {
      onSelect({ name: query.trim(), muscle: muscle || "Other", isNew: true });
      setQuery("");
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      {/* Selected value display */}
      {value ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 14px", background: "#0A0A0F",
          border: "1px solid #2A2A35", borderRadius: 10,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
            background: muscleColors[muscle] || "#888",
          }} />
          <div style={{ flex: 1, fontSize: 15, color: "#E8E6E1" }}>{value}</div>
          <button
            type="button"
            onClick={() => { onSelect(null); setIsOpen(true); }}
            style={{
              background: "none", border: "1px solid #333", color: "#888",
              padding: "4px 10px", borderRadius: 100, fontSize: 11, cursor: "pointer",
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <input
          type="text"
          placeholder={placeholder || "Search or type exercise name..."}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          style={{
            width: "100%", boxSizing: "border-box",
            background: "#0A0A0F", border: "1px solid #2A2A35", borderRadius: 10,
            padding: "12px 14px", color: "#E8E6E1", fontSize: 15,
            fontFamily: "'DM Sans', sans-serif", outline: "none",
          }}
        />
      )}

      {/* Dropdown */}
      {isOpen && !value && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          marginTop: 4, maxHeight: 280, overflowY: "auto",
          background: "#1A1A22", border: "1px solid #2A2A35",
          borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
        }}>
          {/* Add new option */}
          {query.trim() && !knownExercises.find((e) => e.name.toLowerCase() === query.trim().toLowerCase()) && (
            <button
              type="button"
              onClick={handleAddNew}
              style={{
                width: "100%", textAlign: "left", padding: "12px 14px",
                background: "rgba(198,255,0,0.06)", border: "none",
                borderBottom: "1px solid #2A2A35", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
                color: "#C6FF00", fontSize: 14,
              }}
            >
              <span style={{ fontSize: 16 }}>+</span>
              Add "{query.trim()}" as new exercise
            </button>
          )}

          {/* Grouped results */}
          {Object.entries(grouped).map(([groupMuscle, exercises]) => (
            <div key={groupMuscle}>
              <div style={{
                padding: "8px 14px 4px", fontSize: 10,
                fontFamily: "'Space Mono', monospace", letterSpacing: "1.5px",
                color: muscleColors[groupMuscle] || "#888",
              }}>
                {groupMuscle.toUpperCase()}
              </div>
              {exercises.map((ex) => (
                <button
                  type="button"
                  key={ex.name}
                  onClick={() => handleSelect(ex)}
                  style={{
                    width: "100%", textAlign: "left", padding: "10px 14px",
                    background: "transparent", border: "none",
                    borderBottom: "1px solid #1E1E26", cursor: "pointer",
                    color: "#E8E6E1", fontSize: 14,
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: muscleColors[ex.muscle] || "#888",
                  }} />
                  {ex.name}
                </button>
              ))}
            </div>
          ))}

          {/* Empty state */}
          {filtered.length === 0 && !query.trim() && (
            <div style={{ padding: 20, textAlign: "center", color: "#555", fontSize: 13 }}>
              No exercises yet. Type a name to add one.
            </div>
          )}

          {/* Show add new when no results */}
          {filtered.length === 0 && query.trim() && (
            <button
              type="button"
              onClick={handleAddNew}
              style={{
                width: "100%", textAlign: "left", padding: "14px",
                background: "rgba(198,255,0,0.06)", border: "none",
                cursor: "pointer", color: "#C6FF00", fontSize: 14,
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>+</span>
              Add "{query.trim()}" as new exercise
            </button>
          )}
        </div>
      )}
    </div>
  );
}
