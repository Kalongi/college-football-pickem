// scripts/import-fbs-teams.js
// No need to import fetch in Node.js 18+
const { Amplify } = require('aws-amplify');
const { generateClient } = require('aws-amplify/data');
const outputs = require('../amplify_outputs.json');

Amplify.configure(outputs);
const client = generateClient();

// Conference logo mapping (add more as needed)
const conferenceLogos = {
  "Atlantic Coast Conference": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Atlantic_Coast_Conference_logo.svg",
    smallImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Atlantic_Coast_Conference_logo.svg/120px-Atlantic_Coast_Conference_logo.svg.png"
  },
  "Big Ten Conference": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/89/Big_Ten_Conference_logo.svg",
    smallImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Big_Ten_Conference_logo.svg/120px-Big_Ten_Conference_logo.svg.png"
  },
  "Big 12 Conference": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5d/Big_12_Conference_logo.svg",
    smallImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Big_12_Conference_logo.svg/120px-Big_12_Conference_logo.svg.png"
  },
  "Pac-12 Conference": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Pac-12_logo.svg",
    smallImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Pac-12_logo.svg/120px-Pac-12_logo.svg.png"
  },
  "Southeastern Conference": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Southeastern_Conference_logo.svg",
    smallImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Southeastern_Conference_logo.svg/120px-Southeastern_Conference_logo.svg.png"
  },
  "American Athletic Conference": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2e/American_Athletic_Conference_logo.svg",
    smallImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/American_Athletic_Conference_logo.svg/120px-American_Athletic_Conference_logo.svg.png"
  },
  "Conference USA": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Conference_USA_logo.svg",
    smallImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Conference_USA_logo.svg/120px-Conference_USA_logo.svg.png"
  },
  "Mid-American Conference": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Mid-American_Conference_logo.svg",
    smallImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Mid-American_Conference_logo.svg/120px-Mid-American_Conference_logo.svg.png"
  },
  "Mountain West Conference": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Mountain_West_Conference_logo.svg",
    smallImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Mountain_West_Conference_logo.svg/120px-Mountain_West_Conference_logo.svg.png"
  },
  "Sun Belt Conference": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Sun_Belt_Conference_logo.svg",
    smallImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Sun_Belt_Conference_logo.svg/120px-Sun_Belt_Conference_logo.svg.png"
  },
  "Independent": {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Independent_logo.svg",
    smallImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Independent_logo.svg/120px-Independent_logo.svg.png"
  }
};

// Map API conference names to internal mapping keys
const apiToInternalConference = {
  "Mountain West": "Mountain West Conference",
  "Mid-American": "Mid-American Conference",
  "SEC": "Southeastern Conference",
  "Sun Belt": "Sun Belt Conference",
  "Big 12": "Big 12 Conference",
  "American Athletic": "American Athletic Conference",
  "ACC": "Atlantic Coast Conference",
  "Conference USA": "Conference USA",
  "Big Ten": "Big Ten Conference",
  "FBS Independents": "Independent",
  "Pac-12": "Pac-12 Conference"
};

async function main() {
  // Fetch FBS teams with API key
  const res = await fetch('https://api.collegefootballdata.com/teams/fbs', {
    headers: {
      Authorization: 'Bearer 9anqqpEw3ZvZGClSNpcAeO/THnMIDUVU3y/cd4n0FvmZru537vkEMFgffxCUw5eE'
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch teams: ${res.status}`);
  }
  const teams = await res.json();

  // Log all unique conference names for debugging
  const uniqueConfs = [...new Set(teams.map(team => team.conference))];
  console.log('Unique conferences from API:', uniqueConfs);

  // Get all unique conferences from the teams data
  const conferenceNames = uniqueConfs;

  // Fetch existing conferences from backend
  const { data: existingConfs } = await client.models.Conference.list();
  const existingConfNames = new Set(existingConfs.map(c => c.name));
  const conferenceNameToId = {};

  // Insert new conferences
  for (const name of conferenceNames) {
    const internalName = apiToInternalConference[name] || name;
    if (!existingConfNames.has(internalName)) {
      const logo = conferenceLogos[internalName] || { imageUrl: '', smallImageUrl: '' };
      try {
        const conf = await client.models.Conference.create({
          name: internalName,
          imageUrl: logo.imageUrl,
          smallImageUrl: logo.smallImageUrl
        });
        conferenceNameToId[name] = conf.id;
        console.log(`Inserted conference: ${internalName}`);
      } catch (err) {
        console.error(`Failed to insert conference ${internalName}:`, err.message);
      }
    } else {
      // Get the id from existingConfs
      const conf = existingConfs.find(c => c.name === internalName);
      conferenceNameToId[name] = conf.id;
    }
  }

  // Fetch existing teams from backend
  const { data: existingTeams } = await client.models.Team.list();
  const existingTeamNames = new Set(existingTeams.map(t => t.name));

  // Insert new teams
  for (const team of teams) {
    if (existingTeamNames.has(team.school)) {
      continue; // Skip teams already in the database
    }
    const name = team.school;
    const imageUrl = Array.isArray(team.logos) && team.logos.length > 0 ? team.logos[0] : '';
    const conferenceId = conferenceNameToId[team.conference];
    if (!conferenceId) {
      console.warn(`No conferenceId found for team ${name} (conference: ${team.conference})`);
      continue;
    }
    try {
      await client.models.Team.create({ name, imageUrl, conferenceId });
      console.log(`Inserted team: ${name}`);
    } catch (err) {
      console.error(`Failed to insert team ${name}:`, err.message);
    }
  }
  console.log('Done importing conferences and teams.');
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
