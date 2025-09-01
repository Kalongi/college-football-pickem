import { NextRequest, NextResponse } from 'next/server';
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

Amplify.configure(outputs);
const client = generateClient<Schema>();

const CFBD_API_KEY = "9anqqpEw3ZvZGClSNpcAeO/THnMIDUVU3y/cd4n0FvmZru537vkEMFgffxCUw5eE"; // <-- Replace with your actual key

async function deleteAllTeams() {
  // @ts-expect-error
  const teamResult = await client.models.Team.list();
  const { data: teams } = teamResult;
  for (const team of teams) {
    await client.models.Team.delete({ id: team.id });
  }
}

async function deleteAllConferences() {
  // @ts-expect-error
  const conferenceResult = await client.models.Conference.list();
  const { data: conferences } = conferenceResult;
  for (const conf of conferences) {
    await client.models.Conference.delete({ id: conf.id });
  }
}

async function importConferences() {
  const res = await fetch("https://api.collegefootballdata.com/conferences", {
    headers: { Authorization: `Bearer ${CFBD_API_KEY}` }
  });
  const conferences = await res.json();
  for (const conf of conferences) {
    await client.models.Conference.create({
      name: conf.name,
      imageUrl: "",
      smallImageUrl: ""
    });
  }
}

async function importTeams() {
  const res = await fetch("https://api.collegefootballdata.com/teams/fbs", {
    headers: { Authorization: `Bearer ${CFBD_API_KEY}` }
  });
  const teams = await res.json();
  const { data: localConfs } = await client.models.Conference.list();
  let imported = 0;
  let skipped = 0;
  for (const team of teams) {
    const conf = localConfs.find((c: any) => c.name === team.conference);
    if (!conf) {
      skipped++;
      continue;
    }
    await client.models.Team.create({
      name: team.school,
      imageUrl: team.logos && team.logos.length > 0 ? team.logos[0] : "",
      conferenceId: conf.id
    });
    imported++;
  }
  return { imported, skipped };
}

export async function POST(req: NextRequest) {
  try {
    const { step } = await req.json();
    if (!step) {
      return NextResponse.json({ success: false, error: 'No step provided.' }, { status: 400 });
    }
    if (step === 'deleteTeams') {
      await deleteAllTeams();
      return NextResponse.json({ success: true, step: 'deleteTeams' });
    }
    if (step === 'deleteConferences') {
      await deleteAllConferences();
      return NextResponse.json({ success: true, step: 'deleteConferences' });
    }
    if (step === 'importConferences') {
      await importConferences();
      return NextResponse.json({ success: true, step: 'importConferences' });
    }
    if (step === 'importTeams') {
      const { imported, skipped } = await importTeams();
      return NextResponse.json({ success: true, step: 'importTeams', imported, skipped });
    }
    return NextResponse.json({ success: false, error: 'Unknown step.' }, { status: 400 });
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
