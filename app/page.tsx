"use client";

import React from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  // Placeholder data
  const record = {
    wins: 18,
    losses: 15,
    ties: 1,
    lastWeek: 'Conference Championship Week',
    lastWkWins: 3,
    lastWkLosses: 3,
    lastWkTies: 0,
  };
  const standings = [
    { rank: 1, name: 'Buck', wins: 20, losses: 12, ties: 2 },
    { rank: 2, name: 'Longi', wins: 18, losses: 15, ties: 1 },
  ];

  return (
    <main style={{
      maxWidth: 800,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      alignItems: 'stretch',
    }}>
      <section style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(34,34,34,0.08)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '2px solid #2196f3', // blue accent
      }}>
        <h2 style={{ color: '#2196f3', fontWeight: 800, fontSize: '2rem', marginBottom: '1rem', letterSpacing: 1 }}>Record Summary</h2>
        <div style={{ display: 'flex', gap: '2rem', fontSize: '1.2rem', fontWeight: 600 }}>
          <div>Wins: <span style={{ color: '#43a047', background: '#e8f5e9', borderRadius: 4, padding: '0 0.5em' }}>{record.wins}</span></div>
          <div>Losses: <span style={{ color: '#e65100', background: '#fff3e0', borderRadius: 4, padding: '0 0.5em' }}>{record.losses}</span></div>
          <div>Ties: <span style={{ color: '#0288d1', background: '#e1f5fe', borderRadius: 4, padding: '0 0.5em' }}>{record.ties}</span></div>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '1rem', color: '#333' }}>
          Last Week ({record.lastWeek}): <span style={{ color: '#2196f3', fontWeight: 700 }}>{record.lastWkWins}-{record.lastWkLosses}-{record.lastWkTies}</span>
        </div>
      </section>
      <section style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(34,34,34,0.08)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '2px solid #ff9800', // orange accent
      }}>
        <h2 style={{ color: '#ff9800', fontWeight: 800, fontSize: '2rem', marginBottom: '1rem', letterSpacing: 1 }}>Standings</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1.1rem' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', color: '#222' }}>
              <th style={{ padding: '0.5rem 1rem', borderRadius: '8px 0 0 8px' }}>Rank</th>
              <th style={{ padding: '0.5rem 1rem' }}>Name</th>
              <th style={{ padding: '0.5rem 1rem' }}>Wins</th>
              <th style={{ padding: '0.5rem 1rem' }}>Losses</th>
              <th style={{ padding: '0.5rem 1rem', borderRadius: '0 8px 8px 0' }}>Ties</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s) => (
              <tr key={s.rank} style={{ textAlign: 'center', background: '#fafafa', borderBottom: '2px solid #eee' }}>
                <td style={{ padding: '0.5rem 1rem', fontWeight: 700, color: '#2196f3' }}>{s.rank}</td>
                <td style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: '0.5rem 1rem', color: '#43a047', fontWeight: 600, background: '#e8f5e9', borderRadius: 4 }}>{s.wins}</td>
                <td style={{ padding: '0.5rem 1rem', color: '#e65100', fontWeight: 600, background: '#fff3e0', borderRadius: 4 }}>{s.losses}</td>
                <td style={{ padding: '0.5rem 1rem', color: '#0288d1', fontWeight: 600, background: '#e1f5fe', borderRadius: 4 }}>{s.ties}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
