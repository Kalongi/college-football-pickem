"use client";

import React, { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { client as cfbdClient, getGames, getLines } from 'cfbd';

Amplify.configure(outputs);
const client = generateClient<Schema>();

// Set up cfbd client with API key
cfbdClient.setConfig({
  headers: {
    'Authorization': 'Bearer 9anqqpEw3ZvZGClSNpcAeO/THnMIDUVU3y/cd4n0FvmZru537vkEMFgffxCUw5eE',
  }
});

// List of top 50 teams (2024 preseason, example)
const TOP_50_TEAMS = [
  "Georgia", "Michigan", "Ohio State", "Texas", "Alabama", "Oregon", "Penn State", "Washington", "Florida State", "Notre Dame",
  "LSU", "Oklahoma", "Ole Miss", "Utah", "Tennessee", "Clemson", "Missouri", "Oklahoma State", "Arizona", "Louisville",
  "Kansas State", "Iowa", "USC", "North Carolina", "Texas A&M", "NC State", "SMU", "Wisconsin", "Liberty", "Kansas",
  "Miami (FL)", "Maryland", "UCLA", "West Virginia", "Duke", "Iowa State", "Nebraska", "Auburn", "South Carolina", "Texas Tech",
  "Minnesota", "BYU", "Arkansas", "Mississippi State", "Boise State", "Purdue", "TCU", "Wake Forest", "Houston", "Baylor"
];

// List of SEC teams
const SEC_TEAMS = [
  "Alabama", "Arkansas", "Auburn", "Florida", "Georgia", "Kentucky", "LSU", "Mississippi State",
  "Missouri", "Ole Miss", "South Carolina", "Tennessee", "Texas A&M", "Vanderbilt"
];

function getUpcomingWindow() {
  // Get this Thursday through next Monday
  const now = new Date();
  const day = now.getDay();
  const daysUntilThursday = (4 - day + 7) % 7;
  const thursday = new Date(now);
  thursday.setDate(now.getDate() + daysUntilThursday);
  thursday.setHours(0, 0, 0, 0);
  const monday = new Date(thursday);
  monday.setDate(thursday.getDate() + 4); // Thursday + 4 = Monday
  monday.setHours(23, 59, 59, 999);
  return { thursday, monday };
}

export default function SelectGamesPage() {
  const [games, setGames] = useState<any[]>([]);
  const [teams, setTeams] = useState<Schema["Team"]["type"][]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Only define thursday/monday/mondayEnd once here
        const { thursday, monday } = getUpcomingWindow();
        const mondayEnd = new Date(monday);
        mondayEnd.setHours(23, 59, 59, 999);
        // Always fetch lines for the week
        const year = 2025;
        const week = 1;
        let spreadsData: any[] = [];
        const linesResult = await getLines({
          query: {
            year,
            week,
            classification: 'fbs',
          },
        });
        spreadsData = linesResult.data ?? [];
        console.log('spreadsData', spreadsData);
        // Fetch games for week 1 of 2025 season using cfbd
        const gamesResult = await getGames({
          query: {
            year,
            week,
            classification: 'fbs',
          },
        });
        const gamesData: any[] = gamesResult.data ?? [];
        console.log('gamesData', gamesData);
        // Fetch local teams
        const { data: localTeams } = await client.models.Team.list();
        // Map team names to local team objects
        const teamMap: Record<string, any> = Object.fromEntries(localTeams.map((t: any) => [t.name, t]));
        // Build the spreadMap using String(spread.id) as the key
        const spreadMap: Record<string, { spreadTeam: string; spreadNumber: string }> = {};
        for (const spread of spreadsData) {
          let bestLine: any = null;
          if (spread.lines && spread.lines.length > 0) {
            bestLine = spread.lines.find((l: any) => l.provider === 'DraftKings')
              || spread.lines.find((l: any) => l.provider === 'ESPN BET')
              || spread.lines[0]; // fallback to first line if neither DK nor ESPN BET
          }
          if (bestLine && bestLine.formattedSpread) {
            const parts = bestLine.formattedSpread.trim().split(/\s+/);
            const spreadNumber = parts.pop();
            const spreadTeam = parts.join(' ');
            if (!spreadNumber || isNaN(Number(spreadNumber))) {
              console.log('No valid spread number for:', bestLine.formattedSpread, spread);
            }
            spreadMap[String(spread.id)] = {
              spreadTeam,
              spreadNumber,
            };
          }
        }
        // Filter games to only those involving top 50 teams, SEC teams, or UAB
        const filteredGames = gamesData.filter((g: any) =>
          (SEC_TEAMS.includes(g.homeTeam) ||
          SEC_TEAMS.includes(g.awayTeam) ||
          g.homeTeam === "UAB" ||
          g.awayTeam === "UAB" ||
          TOP_50_TEAMS.includes(g.homeTeam) ||
          TOP_50_TEAMS.includes(g.awayTeam))
        );
        // Only display games that have a matching line in spreadMap
        const gamesWithLines = filteredGames.filter((g: any) => spreadMap[String(g.id)]);
        // Map and filter games for display
        let displayGames: any[] = [];
        if (!loading && !error) {
          displayGames = gamesWithLines.map((g: any) => {
            const homeTeam = g.homeTeam;
            const awayTeam = g.awayTeam;
            const homeLogo = teamMap[homeTeam]?.imageUrl || '';
            const awayLogo = teamMap[awayTeam]?.imageUrl || '';
            const dateStr = g.startDate;
            let displayDate = '';
            let displayTime = '';
            if (dateStr) {
              const parsed = new Date(dateStr);
              if (!isNaN(parsed.getTime())) {
                displayDate = parsed.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                displayTime = parsed.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
              }
            }
            const spreadInfo = spreadMap[String(g.id)] || {};
            return {
              id: g.id,
              homeTeam,
              awayTeam,
              homeLogo,
              awayLogo,
              spreadTeam: spreadInfo.spreadTeam || '',
              spreadNumber: spreadInfo.spreadNumber || '',
              displayDate,
              displayTime,
            };
          });
        }
        setGames(displayGames);
        setTeams([]); // not needed for this display
      } catch (err: any) {
        console.error('Error in fetchData:', err);
        setError(err.message || 'Unknown error');
        setGames([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function toggleSelect(gameId: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(gameId)) next.delete(gameId); else next.add(gameId);
      return next;
    });
  }

  // Always define displayGames before the return
  const displayGames = games.map((g: any) => {
    const homeTeam = g.homeTeam;
    const awayTeam = g.awayTeam;
    const homeLogo = teams.find((t) => t.name === homeTeam)?.imageUrl || '';
    const awayLogo = teams.find((t) => t.name === awayTeam)?.imageUrl || '';
    return { ...g, homeLogo, awayLogo };
  });

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ textAlign: "center", color: "#222", fontWeight: 800, fontSize: "2rem", marginBottom: "2rem" }}>Select Games for Week</h1>
      {loading ? (
        <div style={{ textAlign: "center", color: "#888" }}>Loading games...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {gamesWithLines.map((g: any) => (
            <div key={g.id} style={{
              display: 'flex', alignItems: 'center', gap: 24, background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 12
            }}>
              <input
                type="checkbox"
                checked={selected.has(g.id)}
                onChange={() => toggleSelect(g.id)}
                style={{ marginRight: 12 }}
              />
              <div style={{ minWidth: 220, display: 'flex', alignItems: 'center', gap: 8 }}>
                {g.awayLogo && <img src={g.awayLogo} alt={g.awayTeam} style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }} />}
                <span>{g.awayTeam}</span>
                <span style={{ color: '#888' }}>@</span>
                {g.homeLogo && <img src={g.homeLogo} alt={g.homeTeam} style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }} />}
                <span>{g.homeTeam}</span>
              </div>
              <div style={{ minWidth: 120, color: '#1976d2', fontWeight: 700 }}>
                {g.spreadTeam && g.spreadNumber ? `${g.spreadTeam} ${g.spreadNumber}` : 'No spread'}
              </div>
              <div style={{ minWidth: 180, color: '#555' }}>{g.displayDate} {g.displayTime}</div>
            </div>
          ))}
        </div>
      )}
      {/* Add a button for future submission */}
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <button style={{ padding: '0.75em 2em', fontSize: '1.1rem', borderRadius: 8, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }} disabled={selected.size === 0}>
          Add Selected Games to Week
        </button>
      </div>
    </main>
  );
}
