"use client";

import React, { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

Amplify.configure(outputs);
const client = generateClient<Schema>();

export default function TeamsPage() {
  const [teams, setTeams] = useState<Array<Schema["Team"]["type"] & { conference?: Schema["Conference"]["type"] }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeamsAndConferences() {
      try {
        const [teamsResult, conferencesResult] = await Promise.all([
          client.models.Team.list(),
          client.models.Conference.list(),
        ]);

        const teams = Array.isArray(teamsResult?.data) ? teamsResult.data : [];
        const conferences = Array.isArray(conferencesResult?.data) ? conferencesResult.data : [];
        // Join teams with their conference
        const confMap = Object.fromEntries(conferences.map((c) => [c.id, c]));
        setTeams(
          teams.map(team => ({
            ...team,
            conference: confMap[team.conferenceId],
          })) as any
        );
      } finally {
        setLoading(false);
      }
    }
    fetchTeamsAndConferences();
  }, []);

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem", paddingTop: '72px' }}>
      <h1 style={{ textAlign: "center", color: "#222", fontWeight: 800, fontSize: "2.5rem", marginBottom: "2rem" }}>NCAA FBS Teams</h1>
      {loading ? (
        <div style={{ textAlign: "center", color: "#888" }}>Loading teams...</div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "2rem",
        }}>
          {teams.map((team) => {
            const conf = team.conference || {};
            return (
              <div key={team.id} style={{
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(34,34,34,0.08)",
                padding: "1.5rem 1rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 180,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  {team.imageUrl ? (
                    <img src={team.imageUrl} alt={team.name} style={{ width: 60, height: 60, objectFit: "contain", background: '#f7f7f9', borderRadius: 8 }} />
                  ) : (
                    <div style={{ width: 60, height: 60, background: "#eee", borderRadius: 8 }} />
                  )}
                  {/* Conference image removed for now */}
                </div>
                <div style={{ fontWeight: 700, fontSize: "1.1rem", textAlign: "center", color: "#222" }}>{team.name}</div>
                {conf.name && (
                  <div style={{ fontSize: '0.95rem', color: '#666', marginTop: 4 }}>{conf.name}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
