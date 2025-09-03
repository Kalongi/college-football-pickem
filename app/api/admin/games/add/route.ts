import { NextRequest, NextResponse } from 'next/server';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export async function POST(req: NextRequest) {
  try {
    const {
      year,
      week,
      seasonType,
      homeTeamId,
      awayTeamId,
      spreadTeamId,
      spread,
      kickoffUtc
    } = await req.json();

    // Validate required fields
    if (
      !year || !week || !seasonType ||
      !homeTeamId || !awayTeamId || !spreadTeamId ||
      typeof spread !== 'number' || !kickoffUtc
    ) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Find or create the Week
    const season = `${year}-${seasonType}`;
    const weekDesc = `Week ${week}`;
    let weekId: string | undefined;
    let weekObj: any = null;
    // @ts-expect-error Amplify Gen 2 Data client response type is too complex for TypeScript
    const weekResult = await client.models.Week.list({
      filter: { season: { eq: season }, description: { eq: weekDesc } }
    });
    const weekData = weekResult.data ?? [];
    if (weekData.length > 0) {
      weekObj = weekData[0];
      weekId = weekObj.id;
    } else {
      // First game for this week: use this game's kickoffUtc
      const kickoffDate = new Date(kickoffUtc);
      const picksOpenUtc = new Date(kickoffDate.getTime() - 72 * 60 * 60 * 1000).toISOString();
      const picksCloseUtc = new Date(kickoffDate.getTime() - 2 * 60 * 60 * 1000).toISOString();
      const newWeek = await client.models.Week.create({
        description: weekDesc,
        picksOpenUtc,
        picksCloseUtc,
        season
      });
      weekObj = newWeek.data;
      weekId = newWeek.data?.id;
    }

    if (!weekId) {
      return NextResponse.json({ success: false, error: 'Failed to determine weekId' }, { status: 500 });
    }

    // Set winningTeamId to spreadTeamId (for now)
    const winningTeamId = spreadTeamId;

    // @ts-expect-error Amplify Gen 2 Data client response type is too complex for TypeScript
    const gameResult = await client.models.Game.create({
      weekId,
      homeTeamId,
      awayTeamId,
      spreadTeamId,
      spread,
      winningTeamId,
      kickoffUtc
    });

    const gamesResult = await client.models.Game.list({ filter: { weekId: { eq: weekId } } });
    const gamesData = gamesResult.data ?? [];
    const allKickoffs = gamesData.map((g: any) => new Date(g.kickoffUtc));
    if (allKickoffs.length > 0) {
      const earliestKickoff = new Date(Math.min(...allKickoffs.map((d: Date) => d.getTime())));
      const picksOpenUtc = new Date(earliestKickoff.getTime() - 72 * 60 * 60 * 1000).toISOString();
      const picksCloseUtc = new Date(earliestKickoff.getTime() - 2 * 60 * 60 * 1000).toISOString();
      // Only update if values have changed
      if (
        !weekObj.picksOpenUtc ||
        weekObj.picksOpenUtc !== picksOpenUtc ||
        weekObj.picksCloseUtc !== picksCloseUtc
      ) {
        await client.models.Week.update({
          id: weekId,
          picksOpenUtc,
          picksCloseUtc
        });
      }
    }

    return NextResponse.json({
      success: true,
      game: gameResult.data
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
