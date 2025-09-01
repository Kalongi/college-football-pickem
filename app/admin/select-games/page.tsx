"use client";
import React, { useState } from "react";

export default function SelectGamesPage() {
  // Filter state
  const [year, setYear] = useState<number>(2024);
  const [week, setWeek] = useState<number>(1);
  const [fetching, setFetching] = useState(false);
  // Example game state (placeholder)
  const [inDb, setInDb] = useState(false);

  // Placeholder game data
  const game = {
    awayTeam: { name: "Alabama", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/333.png" },
    homeTeam: { name: "Georgia", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/61.png" },
    spread: "Georgia -7.5",
    start: "2024-09-07T19:30:00Z",
  };

  function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    setFetching(true);
    setTimeout(() => setFetching(false), 1000); // Simulate fetch
  }

  function handleAddRemove() {
    setInDb(v => !v);
  }

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "1rem 0.5rem", paddingTop: '72px' }}>
      {/* Filter section */}
      <div style={{
        background: '#fff',
        boxShadow: '0 2px 8px rgba(25,118,210,0.04)',
        borderRadius: 10,
        marginBottom: 24,
      }}>
        <form onSubmit={handleFetch} style={{
          display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'center', padding: '14px 0', flexWrap: 'wrap', justifyContent: 'flex-start',
        }}>
          <label style={{ fontWeight: 600, color: '#1976d2' }}>
            Year
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} min={2015} max={2100} style={{
              marginLeft: 8, width: 90, padding: '8px', border: '1.5px solid #c3cfe2', borderRadius: 7, fontSize: '1.1rem', outline: 'none', background: '#f8fafc', transition: 'border 0.2s',
            }} />
          </label>
          <label style={{ fontWeight: 600, color: '#1976d2' }}>
            Week
            <input type="number" value={week} onChange={e => setWeek(Number(e.target.value))} min={1} max={20} style={{
              marginLeft: 8, width: 60, padding: '8px', border: '1.5px solid #c3cfe2', borderRadius: 7, fontSize: '1.1rem', outline: 'none', background: '#f8fafc', transition: 'border 0.2s',
            }} />
          </label>
          <button
            type="submit"
            style={{ padding: '10px 24px', fontSize: '1.1rem', borderRadius: 8, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 700, cursor: fetching ? 'not-allowed' : 'pointer', marginLeft: 12 }}
            disabled={fetching}
          >
            {fetching ? 'Fetching...' : 'Fetch Games'}
          </button>
        </form>
      </div>
      {/* Example game card */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(25,118,210,0.06)', border: inDb ? '2px solid #1976d2' : '1.5px solid #e3e8ee', padding: '20px 16px', marginBottom: 0, minWidth: 0, width: '100%', maxWidth: 500, margin: '0 auto',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 0, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={game.awayTeam.logo} alt={game.awayTeam.name} style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6, background: '#f3f8fd', border: '1px solid #e3e8ee' }} />
            <span style={{ fontWeight: 600, fontSize: '1.08rem', color: '#444' }}>{game.awayTeam.name}</span>
          </div>
          <span style={{ color: '#bbb', fontSize: '1.2em', margin: '2px 0' }}>@</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={game.homeTeam.logo} alt={game.homeTeam.name} style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6, background: '#f3f8fd', border: '1px solid #e3e8ee' }} />
            <span style={{ fontWeight: 700, fontSize: '1.12rem', color: '#222' }}>{game.homeTeam.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 4, marginTop: 12 }}>
          <div style={{ color: '#1976d2', fontWeight: 700, fontSize: '0.98rem', minWidth: 80, textAlign: 'center', lineHeight: 1.2 }}>
            {game.spread}
          </div>
          <div style={{ color: '#555', fontSize: '1.02rem', textAlign: 'center' }}>
            {new Date(game.start).toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}
          </div>
        </div>
        <button
          onClick={handleAddRemove}
          style={{
            marginTop: 18,
            padding: '12px 32px',
            borderRadius: 7,
            border: inDb ? '1.5px solid #b71c1c' : '1.5px solid #1976d2',
            background: inDb ? '#fff0f0' : '#f3f8fd',
            color: inDb ? '#b71c1c' : '#1976d2',
            fontWeight: 700,
            fontSize: '1.08rem',
            cursor: 'pointer',
            transition: 'all 0.18s',
            width: '100%',
            maxWidth: 220,
          }}
        >
          {inDb ? 'Remove' : 'Add'}
        </button>
      </div>
    </main>
  );
}
