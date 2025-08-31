import { generateClient } from "aws-amplify/data";
// Removed: import { Schema } from "../amplify/data/resource";

const client = generateClient();
const CFBD_API_KEY = "9anqqpEw3ZvZGClSNpcAeO/THnMIDUVU3y/cd4n0FvmZru537vkEMFgffxCUw5eE"; // <-- Replace with your actual key

async function deleteAllTeams() {
  const { data: teams } = await client.models.Team.list();
  for (const team of teams) {
    await client.models.Team.delete({ id: team.id });
    console.log(`Deleted team: ${team.name}`);
  }
  console.log("All teams deleted.");
}

async function deleteAllConferences() {
  const { data: conferences } = await client.models.Conference.list();
  for (const conf of conferences) {
    await client.models.Conference.delete({ id: conf.id });
    console.log(`Deleted conference: ${conf.name}`);
  }
  console.log("All conferences deleted.");
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
    console.log(`Imported conference: ${conf.name}`);
  }
  console.log("All conferences imported.");
}

async function importTeams() {
  const res = await fetch("https://api.collegefootballdata.com/teams/fbs", {
    headers: { Authorization: `Bearer ${CFBD_API_KEY}` }
  });
  const teams = await res.json();
  // Get local conferences for mapping
  const { data: localConfs } = await client.models.Conference.list();
  for (const team of teams) {
    // Find conferenceId by matching conference name
    const conf = localConfs.find((c: any) => c.name === team.conference);
    if (!conf) {
      console.warn(`Conference not found for team: ${team.school} (${team.conference})`);
      continue;
    }
    await client.models.Team.create({
      name: team.school,
      imageUrl: team.logos && team.logos.length > 0 ? team.logos[0] : "",
      conferenceId: conf.id
    });
    console.log(`Imported team: ${team.school} (${team.logos && team.logos[0] ? team.logos[0] : "no image"})`);
  }
  console.log("All teams imported.");
}

async function main() {
  await deleteAllTeams();
  await deleteAllConferences();
  await importConferences();
  await importTeams();
}

main().catch(console.error);
