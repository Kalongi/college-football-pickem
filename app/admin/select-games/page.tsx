"use client";
import React, { useState } from "react";
import { useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

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
  const [games, setGames] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch games, rankings, and teams, then filter
  async function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    setFetching(true);
    setError(null);
    try {
      // 1. Fetch Top 25 Rankings
      const rankingsRes = await fetch(
        `https://api.collegefootballdata.com/rankings?year=${year}&seasonType=regular&week=${week}`,
        { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CFBD_API_KEY}` } }
      );
      if (!rankingsRes.ok) throw new Error("Failed to fetch rankings");
      const rankingsData = await rankingsRes.json();
      // rankingsData is an array of polls, each with ranks. We'll flatten all top 25 schools.
      const top25Schools = new Set<string>();
      for (const poll of rankingsData) {
        if (poll.poll === "AP Top 25" && poll.ranks) {
          for (const rank of poll.ranks) {
            if (rank.school) top25Schools.add(rank.school.toLowerCase());
          }
        }
      }

      // 2. Fetch Games
      const gamesRes = await fetch(
        `https://api.collegefootballdata.com/games?year=${year}&seasonType=regular&week=${week}&classification=fbs&team=Alabama`,
        { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CFBD_API_KEY}` } }
      );
      if (!gamesRes.ok) throw new Error("Failed to fetch games");
      const gamesData = await gamesRes.json();

      // 3. Fetch Teams from DB
      // @ts-expect-error
      const teamsResult = await client.models.Team.list();
      const dbTeams = teamsResult.data;
      // Build a map for quick lookup (case-insensitive)
      const dbTeamMap = new Map<string, any>();
      dbTeams.forEach((team: any) => {
        if (team.name) dbTeamMap.set(team.name.toLowerCase(), team);
      });
      // Log all team names in the DB in alphabetical order
      const allDbTeamNames = dbTeams.map((team: any) => team.name).filter(Boolean).sort((a: string, b: string) => a.localeCompare(b));
      // eslint-disable-next-line no-console
      console.log('All team names in DB (alphabetical):', allDbTeamNames);

      // 4. Filter Games
      // For testing: only keep games where Alabama is the away team
      const filteredGames = gamesData.filter((game: any) => {
        // Log every game returned by the API
        // eslint-disable-next-line no-console
        console.log('API Game:', game);
        const awayName = game.awayTeam?.toLowerCase();
        if (awayName !== 'alabama') return false;
        const alabamaDb = dbTeamMap.get('alabama');
        if (alabamaDb) {
          // eslint-disable-next-line no-console
          console.log('Alabama from DB:', alabamaDb);
        } else {
          // eslint-disable-next-line no-console
          console.log('Alabama not found in DB');
        }
        return true;
      });
      setGames(filteredGames);
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
                <span style={{ fontWeight: 600, fontSize: '1.08rem', color: '#444' }}>{game.awayTeam}</span>
          </div>
          <span style={{ color: '#bbb', fontSize: '1.2em', margin: '2px 0' }}>@</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '1.12rem', color: '#222' }}>{game.home_team}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 4, marginTop: 12 }}>
          <div style={{ color: '#1976d2', fontWeight: 700, fontSize: '0.98rem', minWidth: 80, textAlign: 'center', lineHeight: 1.2 }}>
                {game.home_points != null && game.away_points != null ? `${game.home_points} - ${game.away_points}` : 'No score yet'}
          </div>
          <div style={{ color: '#555', fontSize: '1.02rem', textAlign: 'center' }}>
                {game.start_date ? new Date(game.start_date).toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
