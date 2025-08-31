"use client";

import React, { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { client as cfbdClient, getGames, getLines } from 'cfbd';
import type { SeasonType, DivisionClassification } from 'cfbd/dist/types.gen';

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

// Normalization function for team names
function normalizeTeamName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spreads, setSpreads] = useState<any[]>([]);
  // Filter state
  const [year, setYear] = useState<number>(2025);
  const [week, setWeek] = useState<number>(1);
  const [seasonType, setSeasonType] = useState<string>('regular');
  const [classification, setClassification] = useState<string>('fbs');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Fetch games and lines based on filters
  async function fetchData(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Fetch betting lines
      const linesResult = await getLines({
        query: {
          year,
          week,
          classification,
        },
      });
      const spreadsData = linesResult.data ?? [];
      setSpreads(spreadsData);
      // Fetch games
      const gamesResult = await getGames({
        query: {
          year,
          week,
          seasonType: seasonType as SeasonType,
          classification: classification as DivisionClassification,
        },
      });
      const gamesData: any[] = gamesResult.data ?? [];
      // Fetch local teams
      const localTeamsResult = await (client.models.Team.list() as any);
      const localTeams: any[] = (localTeamsResult.data as any[]);
      // Map team names to local team objects
      const teamMap: Record<string, any> = Object.fromEntries(localTeams.map((t: any) => [t.name, t]));
      // Build the spreadMap using String(spread.id) as the key
      const spreadMap: Record<string, { spreadTeam: string; spreadNumber: string }> = {};
      for (const spread of spreadsData) {
        let bestLine: any = null;
        if (spread.lines && spread.lines.length > 0) {
          bestLine = spread.lines.find((l: any) => l.provider === 'DraftKings')
            || spread.lines.find((l: any) => l.provider === 'ESPN BET')
            || spread.lines[0];
        }
        if (bestLine && bestLine.formattedSpread) {
          const parts = bestLine.formattedSpread.trim().split(/\s+/);
          const spreadNumber = parts.pop();
          const spreadTeam = parts.join(' ');
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
      setGames(gamesWithLines);
      setTeams(localTeams);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setGames([]);
    } finally {
      setLoading(false);
    }
  }

  // Always define displayGames from games and teams
  const displayGames = games.map((g: any) => {
    const homeTeam = g.homeTeam;
    const awayTeam = g.awayTeam;
    const homeLogo = teams.find((t) => t.name === homeTeam)?.imageUrl || '';
    const awayLogo = teams.find((t) => t.name === awayTeam)?.imageUrl || '';
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
    // Find the matching line for this game
    const line = spreads.find((l: any) => String(l.id) === String(g.id));
    let formattedSpread = '';
    if (line && line.lines && line.lines.length > 0) {
      let bestLine = line.lines.find((l: any) => l.provider === 'DraftKings')
        || line.lines.find((l: any) => l.provider === 'ESPN BET')
        || line.lines[0];
      formattedSpread = bestLine.formattedSpread || '';
    }
    return {
      ...g,
      homeLogo,
      awayLogo,
      displayDate,
      displayTime,
      formattedSpread,
    };
  });

  async function saveSingleGameToWeek(game: any, add: boolean) {
    setSaving(true);
    setFeedback(null);
    try {
      // Find or create the week
      const weekDesc = `Week ${week} ${year} ${seasonType}`;
      let { data: existingWeeks } = (await (client.models.Week.list({
        filter: { description: { eq: weekDesc } },
      }) as any));
      if (!weekObj && add) {
      let weekObj = existingWeeks[0];
        // Create week if adding and it doesn't exist
        const picksCloseUtc = game.startDate ? new Date(new Date(game.startDate).getTime() - 30 * 60000) : new Date();
        const newWeekResp = await (client.models.Week.create({
          description: weekDesc,
          picksOpenUtc: new Date().toISOString(),
          picksCloseUtc: picksCloseUtc.toISOString(),
          season: String(year),
        }) as any);
        weekObj = newWeekResp.data || newWeekResp;
      }
      if (!weekObj) {
        setFeedback('No week found to remove game from.');
        setSaving(false);
        return;
      }
      // Find team IDs (normalized)
      const homeTeam = teams.find(t => normalizeTeamName(t.name) === normalizeTeamName(game.homeTeam));
      const awayTeam = teams.find(t => normalizeTeamName(t.name) === normalizeTeamName(game.awayTeam));
      if (!homeTeam || !awayTeam) {
        setFeedback('Missing team(s): ' + [game.homeTeam, game.awayTeam].join(', '));
        setSaving(false);
        return;
      }
      // Find spread info
      const line = spreads.find((l: any) => String(l.id) === String(game.id));
      let bestLine = line && line.lines && line.lines.length > 0 ?
        (line.lines.find((l: any) => l.provider === 'DraftKings') ||
         line.lines.find((l: any) => l.provider === 'ESPN BET') ||
         line.lines[0]) : null;
      let spread = bestLine && bestLine.formattedSpread ? Number(bestLine.formattedSpread.split(' ').pop()) : 0;
      let spreadTeamName = bestLine && bestLine.formattedSpread ? bestLine.formattedSpread.replace(/\s*-?\d+(\.\d+)?$/, '').trim() : game.homeTeam;
      const spreadTeam = teams.find(t => normalizeTeamName(t.name) === normalizeTeamName(spreadTeamName)) || homeTeam;
      if (add) {
        // Add game to week
        await (client.models.Game.create({
          weekId: weekObj.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          spreadTeamId: spreadTeam.id,
          spread,
          winningTeamId: homeTeam.id,
        }) as any);
        setFeedback('Game added to week.');
      } else {
        // Remove game from week
        const { data: weekGames } = (await (client.models.Game.list({
          filter: { weekId: { eq: weekObj.id } },
        }) as any));
        const match = weekGames.find((g: any) =>
          normalizeTeamName(g.homeTeam) === normalizeTeamName(game.homeTeam) &&
          normalizeTeamName(g.awayTeam) === normalizeTeamName(game.awayTeam)
        );
        if (match) {
          await (client.models.Game.delete({ id: match.id }) as any);
          setFeedback('Game removed from week.');
        } else {
          setFeedback('Game not found in week.');
        }
      }
    } catch (err: any) {
      setFeedback(err.message || 'Error saving game.');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  }

  function toggleSelect(gameId: string) {
    setSelected(prev => {
      const next = new Set(prev);
      const add = !next.has(gameId);
      if (add) next.add(gameId); else next.delete(gameId);
      // Find the game object
      const game = displayGames.find(g => g.id === gameId);
      if (game) saveSingleGameToWeek(game, add);
      return next;
    });
  }

  // Helper to determine feedback color
  function getFeedbackColor(msg: string | null) {
    if (!msg) return undefined;
    const lower = msg.toLowerCase();
    if (lower.includes('success') || lower.includes('added') || lower.includes('removed')) return 'green';
    return 'crimson';
  }

  // Calculate header height based on feedback
  const headerHeight = feedback ? 260 : 220;

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1rem", paddingTop: `${headerHeight}px` }}>
      <h1 style={{ textAlign: "center", color: "#222", fontWeight: 800, fontSize: "2rem", marginBottom: "2rem" }}>Select Games for Week</h1>
      {/* Filter Form - always visible */}
      <form onSubmit={fetchData} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        background: 'rgba(255,255,255,0.97)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flexWrap: 'wrap',
        padding: '24px 0 20px 0',
        boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
        borderBottom: '1.5px solid #e3e8ee',
        marginBottom: 0,
        borderRadius: '0 0 18px 18px',
        transition: 'box-shadow 0.2s',
      }}>
        {/* Feedback at the top for visibility */}
        {feedback && <div style={{ marginBottom: 12, color: getFeedbackColor(feedback), fontWeight: 600, textAlign: 'center', width: '100%' }}>{feedback}</div>}
        {/* Filter controls and Fetch Games button in one row */}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', width: '100%', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 110 }}>
            <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4 }}>Year</label>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} min={2015} max={2100} style={{
              width: 90,
              padding: '7px 10px',
              border: '1.5px solid #c3cfe2',
              borderRadius: 7,
              fontSize: '1rem',
              outline: 'none',
              background: '#f8fafc',
              transition: 'border 0.2s',
            }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 90 }}>
            <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4 }}>Week</label>
            <input type="number" value={week} onChange={e => setWeek(Number(e.target.value))} min={1} max={20} style={{
              width: 70,
              padding: '7px 10px',
              border: '1.5px solid #c3cfe2',
              borderRadius: 7,
              fontSize: '1rem',
              outline: 'none',
              background: '#f8fafc',
              transition: 'border 0.2s',
            }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 140 }}>
            <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4 }}>Season Type</label>
            <select value={seasonType} onChange={e => setSeasonType(e.target.value)} style={{
              width: 120,
              padding: '7px 10px',
              border: '1.5px solid #c3cfe2',
              borderRadius: 7,
              fontSize: '1rem',
              background: '#f8fafc',
              outline: 'none',
              transition: 'border 0.2s',
            }}>
              <option value="regular">Regular</option>
              <option value="postseason">Postseason</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 140 }}>
            <label style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4 }}>Classification</label>
            <select value={classification} onChange={e => setClassification(e.target.value)} style={{
              width: 120,
              padding: '7px 10px',
              border: '1.5px solid #c3cfe2',
              borderRadius: 7,
              fontSize: '1rem',
              background: '#f8fafc',
              outline: 'none',
              transition: 'border 0.2s',
            }}>
              <option value="fbs">FBS</option>
              <option value="fcs">FCS</option>
              <option value="ii">Division II</option>
              <option value="iii">Division III</option>
            </select>
          </div>
          <button
            type="submit"
            style={{ padding: '10px 28px', fontSize: '1.08rem', borderRadius: 8, background: '#f3f8fd', color: '#1976d2', border: '1.5px solid #1976d2', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', height: 44, minWidth: 140, boxShadow: '0 2px 8px rgba(25,118,210,0.04)', alignSelf: 'flex-end' }}
            disabled={saving}
          >
            Fetch Games
          </button>
        </div>
      </form>
      {/* Games/results area always rendered */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 18, marginTop: 12 }}>
        {displayGames.map((g) => (
          <div key={g.id} style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(25,118,210,0.06)',
            border: selected.has(g.id) ? '2px solid #1976d2' : '1.5px solid #e3e8ee',
            padding: '18px 18px 12px 18px',
            marginBottom: 0,
            transition: 'border 0.2s',
            position: 'relative',
            minWidth: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                {/* Away team */}
                {g.awayLogo && <img src={g.awayLogo} alt={g.awayTeam} style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6, background: '#f3f8fd', border: '1px solid #e3e8ee' }} />}
                <span style={{ fontWeight: 600, fontSize: '1.08rem', color: '#444', minWidth: 80, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.awayTeam}</span>
                <span style={{ color: '#bbb', fontSize: '1.2em', margin: '0 4px' }}>@</span>
                {/* Home team */}
                {g.homeLogo && <img src={g.homeLogo} alt={g.homeTeam} style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6, background: '#f3f8fd', border: '1px solid #e3e8ee' }} />}
                <span style={{ fontWeight: 700, fontSize: '1.12rem', color: '#222', minWidth: 80, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.homeTeam}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ color: '#1976d2', fontWeight: 700, fontSize: '1.08rem', minWidth: 70, textAlign: 'center' }}>{g.formattedSpread || 'No spread'}</div>
                <div style={{ color: '#555', fontSize: '1.02rem', minWidth: 120, textAlign: 'center', whiteSpace: 'nowrap' }}>{g.displayDate} {g.displayTime}</div>
                <button
                  onClick={() => toggleSelect(g.id)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 7,
                    border: selected.has(g.id) ? '1.5px solid #b71c1c' : '1.5px solid #1976d2',
                    background: selected.has(g.id) ? '#fff0f0' : '#f3f8fd',
                    color: selected.has(g.id) ? '#b71c1c' : '#1976d2',
                    fontWeight: 700,
                    fontSize: '1.01rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                    minWidth: 120,
                  }}
                  disabled={saving}
                >
                  {selected.has(g.id) ? 'Remove from Week' : 'Add to Week'}
                </button>
              </div>
            </div>
          </div>
        ))}
        {/* Loading overlay */}
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            fontSize: '1.5rem',
            color: '#1976d2',
            fontWeight: 700
          }}>
            Loading games...
          </div>
        )}
      </div>
    </main>
  );
}
