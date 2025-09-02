"use client";

import React, { useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

Amplify.configure(outputs);
const client = generateClient<Schema>();

export default function TeamsPage() {
  const [conferences, setConferences] = useState<any[]>([]);
  const [teamsByConf, setTeamsByConf] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllTeams() {
      let nextToken = undefined;
      let allTeams: any[] = [];
      do {
        // @ts-expect-error Amplify Data client type is too complex for TS
        const result = await client.models.Team.list({ nextToken });
        allTeams = allTeams.concat(result.data);
        nextToken = result.nextToken;
      } while (nextToken);
      return allTeams;
    }
    async function fetchAllConferences() {
      let nextToken = undefined;
      let allConfs: any[] = [];
      do {
        // @ts-expect-error Amplify Data client type is too complex for TS
        const result = await client.models.Conference.list({ nextToken });
        allConfs = allConfs.concat(result.data);
        nextToken = result.nextToken;
      } while (nextToken);
      return allConfs;
    }
    async function fetchData() {
      setLoading(true);
      try {
        const [allTeams, allConfs] = await Promise.all([
          fetchAllTeams(),
          fetchAllConferences(),
        ]);
        // Sort conferences alpha order
        const sortedConfs = allConfs.sort((a, b) => a.name.localeCompare(b.name));
        setConferences(sortedConfs);
        // Group teams by conferenceId
        const teamsByConf: Record<string, any[]> = {};
        for (const team of allTeams) {
          if (!teamsByConf[team.conferenceId]) teamsByConf[team.conferenceId] = [];
          teamsByConf[team.conferenceId].push(team);
        }
        // Sort teams in each conference alpha order
        for (const confId in teamsByConf) {
          teamsByConf[confId].sort((a, b) => a.name.localeCompare(b.name));
        }
        setTeamsByConf(teamsByConf);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <main style={{ paddingTop: '80px' }}>
      {conferences.filter(conf => (teamsByConf[conf.id] || []).length > 0).map(conf => (
        <section key={conf.id} style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: '1.3rem', color: '#1976d2', marginBottom: 16, fontWeight: 800, letterSpacing: 0.5 }}>{conf.name}</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.5rem',
            width: '100%',
          }}>
            {(teamsByConf[conf.id] || []).map(team => (
              <div key={team.id} style={{
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(34,34,34,0.08)',
                padding: '1.5rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 180,
                transition: 'box-shadow 0.2s',
                border: '1.5px solid #e3e8ee',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  {team.imageUrl ? (
                    <img src={team.imageUrl} alt={team.name} style={{ width: 60, height: 60, objectFit: 'contain', background: '#f7f7f9', borderRadius: 8 }} />
                  ) : (
                    <div style={{ width: 60, height: 60, background: '#eee', borderRadius: 8 }} />
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', textAlign: 'center', color: '#222' }}>{team.name}</div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
