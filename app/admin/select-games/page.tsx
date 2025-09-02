"use client";
import React, { useState } from "react";
import type { SelectGamesListGame } from '@/types/game';

function getDefaultSeasonYear() {
  const now = new Date();
  const month = now.getMonth() + 1; // getMonth() is 0-based
  const year = now.getFullYear();
  // College football season starts in August (8)
  return month >= 8 ? year : year - 1;
}

export default function SelectGamesPage() {
  // Filter state
  const [year, setYear] = useState<number>(getDefaultSeasonYear());
  const [week, setWeek] = useState<number>(1);
  const [fetching, setFetching] = useState(false);
  const [games, setGames] = useState<SelectGamesListGame[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch games from the new API
  async function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    setFetching(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/games/list?year=${year}&week=${week}&seasonType=regular`);
      if (!res.ok) throw new Error("Failed to fetch games");
      const data: { games: SelectGamesListGame[] } = await res.json();
      setGames(data.games);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setGames([]);
    } finally {
      setFetching(false);
    }
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
      {/* Error message */}
      {error && <div style={{ color: '#b71c1c', marginBottom: 16, fontWeight: 600 }}>{error}</div>}
      {/* Games list */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
        {games.length === 0 && !fetching && !error && (
          <div style={{ color: '#888', fontSize: '1.1rem', marginTop: 32 }}>No games found for the selected week.</div>
        )}
        {games.map((game, idx) => (
          <div key={idx} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(25,118,210,0.06)', border: '1.5px solid #e3e8ee', padding: '20px 16px', marginBottom: 0, minWidth: 0, width: '100%', maxWidth: 500, margin: '0 auto',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 0, width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {game.awayTeam.imageUrl ? (
                  <img src={game.awayTeam.imageUrl} alt={game.awayTeam.name} style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6, background: '#f3f8fd', border: '1px solid #e3e8ee' }} />
                ) : null}
                <span style={{ fontWeight: 600, fontSize: '1.08rem', color: '#444' }}>{game.awayTeam.name}</span>
              </div>
              <span style={{ color: '#bbb', fontSize: '1.2em', margin: '2px 0' }}>@</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {game.homeTeam.imageUrl ? (
                  <img src={game.homeTeam.imageUrl} alt={game.homeTeam.name} style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6, background: '#f3f8fd', border: '1px solid #e3e8ee' }} />
                ) : null}
                <span style={{ fontWeight: 700, fontSize: '1.12rem', color: '#222' }}>{game.homeTeam.name}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 4, marginTop: 12 }}>
              <div style={{ color: '#1976d2', fontWeight: 700, fontSize: '0.98rem', minWidth: 80, textAlign: 'center', lineHeight: 1.2 }}>
                {game.spread ? game.spread.formatted : 'No spread'}
              </div>
              <div style={{ color: '#555', fontSize: '1.02rem', textAlign: 'center' }}>
                {game.startDate ? new Date(game.startDate).toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) : ''}
              </div>
            </div>
            <div style={{ marginTop: 16, width: '100%' }}>
              {game.inDb ? (
                <button
                  style={{ width: '100%', display: 'block', background: '#b71c1c', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 0', fontWeight: 700, cursor: 'pointer', fontSize: '1.08rem', marginTop: 8 }}
                  onClick={() => {/* TODO: Remove game logic */}}
                >
                  Remove Game
                </button>
              ) : (
                <button
                  style={{ width: '100%', display: 'block', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 0', fontWeight: 700, cursor: 'pointer', fontSize: '1.08rem', marginTop: 8 }}
                  onClick={() => {/* TODO: Add game logic */}}
                >
                  Add Game
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
