import { NextRequest, NextResponse } from 'next/server';
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import type { SelectGamesListGame } from '@/types/game';
import { filterAndEnrichGames } from '@/lib/gameService';
import { client as cfbdClient, getGames, getLines, getRankings } from 'cfbd';

Amplify.configure(outputs);
const client = generateClient<Schema>();

cfbdClient.setConfig({
  headers: {
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CFBD_API_KEY}`,
  }
});

async function fetchAllTeams(client: any) {
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
async function fetchAllConferences(client: any) {
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
async function fetchAllGamesForWeek(client: any, year: string, week: string) {
  let nextToken = undefined;
  let allGames: any[] = [];
  do {
    // @ts-expect-error Amplify Data client type is too complex for TS
    const result = await client.models.Game.list({ nextToken });
    allGames = allGames.concat(result.data);
    nextToken = result.nextToken;
  } while (nextToken);
  // Optionally filter by week/year if needed
  return allGames;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const week = searchParams.get('week');
    const seasonType = searchParams.get('seasonType') || 'regular';
    if (!year || !week) {
      return NextResponse.json({ error: 'Missing year or week parameter' }, { status: 400 });
    }
    // Fetch games from external API using cfbd
    const gamesResp = await getGames({
      query: {
        year: Number(year),
        seasonType: seasonType as any, // fix type error
        week: Number(week),
        classification: 'fbs',
      }
    });
    const apiGames = gamesResp.data ?? [];

    // Fetch lines (spreads) using cfbd
    const linesResp = await getLines({
      query: {
        year: Number(year),
        seasonType: seasonType as any, // fix type error
        week: Number(week),
      }
    });
    const linesData = linesResp.data ?? [];

    // Fetch rankings (Top 25) using cfbd
    const rankingsResp = await getRankings({
      query: {
        year: Number(year),
        seasonType: seasonType as any, // fix type error
        week: Number(week),
      }
    });
    const rankingsData = rankingsResp.data ?? [];

    // Fetch all teams, conferences, and DB games for the week
    const [dbTeams, dbConfs, dbGames] = await Promise.all([
      fetchAllTeams(client),
      fetchAllConferences(client),
      fetchAllGamesForWeek(client, year, week),
    ]);

    // Use helper for filtering and enrichment
    const games: SelectGamesListGame[] = filterAndEnrichGames({
      apiGames,
      dbTeams,
      dbConfs,
      linesData,
      rankingsData,
      dbGames,
    });

    return NextResponse.json({ games });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
  }
}
