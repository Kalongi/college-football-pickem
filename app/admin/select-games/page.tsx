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

// Move these helper functions to the top-level scope
async function fetchAllTeams(client: any) {
  let nextToken = undefined;
  let allTeams: any[] = [];
  do {
    // @ts-expect-error
    const result = await client.models.Team.list({ nextToken });
    allTeams = allTeams.concat(result.data);
    nextToken = result.nextToken;
  } while (nextToken);
  return allTeams;
}
async function fetchAllConferences(client: any) {
  let nextToken = undefined;
  let allConfs: any[] = [];
  do {
    // @ts-expect-error
    const result = await client.models.Conference.list({ nextToken });
    allConfs = allConfs.concat(result.data);
    nextToken = result.nextToken;
  } while (nextToken);
  return allConfs;
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
      // eslint-disable-next-line no-console
      console.log('rankingsData:', rankingsData);
      // rankingsData is an array with a single object containing 'polls'
      const top25Schools = new Set<string>();
      const polls = rankingsData[0]?.polls;
      const apPoll = polls?.find((p: any) => p.poll === "AP Top 25");
      if (apPoll && apPoll.ranks) {
        for (const rank of apPoll.ranks) {
          if (rank.school) top25Schools.add(rank.school.trim().toLowerCase());
        }
      }

      // 2. Fetch Games
      const gamesRes = await fetch(
        `https://api.collegefootballdata.com/games?year=${year}&seasonType=regular&week=${week}&classification=fbs`,
        { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CFBD_API_KEY}` } }
      );
      if (!gamesRes.ok) throw new Error("Failed to fetch games");
      const gamesData = await gamesRes.json();

      // 2b. Fetch Lines (spreads)
      const linesRes = await fetch(
        `https://api.collegefootballdata.com/lines?year=${year}&seasonType=regular&week=${week}`,
        { headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CFBD_API_KEY}` } }
      );
      if (!linesRes.ok) throw new Error("Failed to fetch lines");
      const linesData = await linesRes.json();
      // Build a map of gameId to first line object
      const linesMap = new Map();
      for (const line of linesData) {
        if (line.id && Array.isArray(line.lines) && line.lines.length > 0) {
          linesMap.set(line.id, line.lines[0]);
        }
      }
      // eslint-disable-next-line no-console
      // console.log('All games fetched from API:', gamesData);

      // 3. Fetch Teams and Conferences from DB
      const [dbTeams, dbConfs] = await Promise.all([
        fetchAllTeams(client),
        fetchAllConferences(client),
      ]);
      // Build a map for quick lookup (case-insensitive)
      const dbTeamMap = new Map<string, any>();
      const confMap = Object.fromEntries(dbConfs.map((c: any) => [c.id, c]));
      dbTeams.forEach((team: any) => {
        if (team.name) {
          dbTeamMap.set(team.name.trim().toLowerCase(), {
            ...team,
            conference: confMap[team.conferenceId],
          });
        }
      });

      // 4. Filter Games
      const filteredGames = gamesData.filter((game: any) => {
        const homeName = game.homeTeam?.trim().toLowerCase();
        const awayName = game.awayTeam?.trim().toLowerCase();
        const homeDb = dbTeamMap.get(homeName);
        const awayDb = dbTeamMap.get(awayName);
        if (homeName === 'tennessee' || awayName === 'tennessee') {
          // eslint-disable-next-line no-console
          console.log('top25Schools:', Array.from(top25Schools));
          // eslint-disable-next-line no-console
          console.log('homeDb.conference.name:', homeDb?.conference?.name, 'awayDb.conference.name:', awayDb?.conference?.name);
        }
        if (!homeDb || !awayDb) return false;
        const isTop25 = top25Schools.has(homeName) || top25Schools.has(awayName);
        const isSEC = homeDb.conference.name === "SEC" || awayDb.conference.name === "SEC";
        const isUAB = homeDb.name === "UAB" || awayDb.name === "UAB";
        return isTop25 || isSEC || isUAB;
      }).map((game: any) => {
        // Attach the first line's formattedSpread if available
        const line = linesMap.get(game.id);
        const awayDb = dbTeamMap.get(game.awayTeam?.trim().toLowerCase());
        const homeDb = dbTeamMap.get(game.homeTeam?.trim().toLowerCase());
        return {
          ...game,
          formattedSpread: line?.formattedSpread || null,
          awayImage: awayDb?.imageUrl || null,
          homeImage: homeDb?.imageUrl || null,
        };
      }).filter((game: any) => game.formattedSpread != null);
      // Log filtered games before updating state
      // eslint-disable-next-line no-console
      console.log('Filtered games:', filteredGames);
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
                {game.awayImage ? (
                  <img src={game.awayImage} alt={game.awayTeam} style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6, background: '#f3f8fd', border: '1px solid #e3e8ee' }} />
                ) : null}
                <span style={{ fontWeight: 600, fontSize: '1.08rem', color: '#444' }}>{game.awayTeam}</span>
              </div>
              <span style={{ color: '#bbb', fontSize: '1.2em', margin: '2px 0' }}>@</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {game.homeImage ? (
                  <img src={game.homeImage} alt={game.homeTeam} style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6, background: '#f3f8fd', border: '1px solid #e3e8ee' }} />
                ) : null}
                <span style={{ fontWeight: 700, fontSize: '1.12rem', color: '#222' }}>{game.homeTeam}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 4, marginTop: 12 }}>
              <div style={{ color: '#1976d2', fontWeight: 700, fontSize: '0.98rem', minWidth: 80, textAlign: 'center', lineHeight: 1.2 }}>
                {game.formattedSpread != null ? game.formattedSpread : 'No spread'}
              </div>
              <div style={{ color: '#555', fontSize: '1.02rem', textAlign: 'center' }}>
                {game.startDate ? new Date(game.startDate).toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
