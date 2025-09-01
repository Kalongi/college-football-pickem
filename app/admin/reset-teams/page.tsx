"use client";
import React, { useState } from "react";

const steps = [
  { key: "deleteTeams", label: "Delete all teams" },
  { key: "deleteConferences", label: "Delete all conferences" },
  { key: "importConferences", label: "Import conferences" },
  { key: "importTeams", label: "Import teams" },
];

export default function ResetTeamsPage() {
  const [progress, setProgress] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setProgress([]);
    setResult(null);
    setError(null);
    setLoading(true);
    for (const step of steps) {
      setProgress((prev) => [...prev, `Starting: ${step.label}`]);
      try {
        const res = await fetch("/api/refresh-fbs-teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: step.key }),
        });
        const data = await res.json();
        if (!data.success) {
          setError(`Error on step '${step.label}': ${data.error || "Unknown error"}`);
          setProgress((prev) => [...prev, `❌ Failed: ${step.label}`]);
          setLoading(false);
          return;
        }
        setProgress((prev) => [...prev, `✅ Done: ${step.label}`]);
        if (step.key === "importTeams") setResult(data);
      } catch (err: any) {
        setError(`Error on step '${step.label}': ${err.message || String(err)}`);
        setProgress((prev) => [...prev, `❌ Failed: ${step.label}`]);
        setLoading(false);
        return;
      }
    }
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "3rem 1rem", textAlign: "center", paddingTop: '72px' }}>
      <button
        onClick={handleReset}
        disabled={loading}
        style={{
          padding: "1em 2.5em",
          fontSize: "1.15rem",
          borderRadius: 10,
          background: loading ? "#aaa" : "#1976d2",
          color: "#fff",
          border: "none",
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          marginBottom: 32,
        }}
      >
        {loading ? "Resetting..." : "Reset Teams & Conferences"}
      </button>
      <div style={{ marginTop: 24, textAlign: 'left', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
        {progress.map((msg, i) => (
          <div key={i} style={{ color: msg.startsWith('✅') ? 'green' : msg.startsWith('❌') ? 'crimson' : '#1976d2', fontWeight: 500, marginBottom: 2 }}>{msg}</div>
        ))}
      </div>
      {error && (
        <div style={{ marginTop: 16, color: 'crimson', fontWeight: 600, fontSize: '1.1rem' }}>{error}</div>
      )}
      {result && result.success && (
        <div style={{ marginTop: 16, color: "#1976d2", fontWeight: 500 }}>
          Imported: {result.imported} teams<br />
          Skipped: {result.skipped} teams
        </div>
      )}
    </main>
  );
}
