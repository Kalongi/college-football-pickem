import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Team: a.model({
    name: a.string().required(),
    imageUrl: a.string(),
    gameScores: a.hasMany('GameScore', 'teamId'),
    userPicks: a.hasMany('UserPick', 'teamId'),
    homeGames: a.hasMany('Game', 'homeTeamId'),
    awayGames: a.hasMany('Game', 'awayTeamId'),
    spreadGames: a.hasMany('Game', 'spreadTeamId'),
    winningGames: a.hasMany('Game', 'winningTeamId'),
    winningUserPicks: a.hasMany('UserPick', 'winningTeamId'),
  }).authorization((allow) => [allow.publicApiKey()]),
  Week: a.model({
    description: a.string().required(),
    picksOpenUtc: a.datetime().required(),
    picksCloseUtc: a.datetime().required(),
    season: a.string().required(),
    games: a.hasMany('Game', 'weekId'),
    userPicks: a.hasMany('UserPick', 'weekId'),
  }).authorization((allow) => [allow.publicApiKey()]),
  Game: a.model({
    weekId: a.id().required(),
    homeTeamId: a.id().required(),
    awayTeamId: a.id().required(),
    spreadTeamId: a.id().required(),
    spread: a.float().required(),
    winningTeamId: a.id().required(),
    gameScores: a.hasMany('GameScore', 'gameId'),
    userPicks: a.hasMany('UserPick', 'gameId'),
    homeTeam: a.belongsTo('Team', 'homeTeamId'),
    awayTeam: a.belongsTo('Team', 'awayTeamId'),
    spreadTeam: a.belongsTo('Team', 'spreadTeamId'),
    winningTeam: a.belongsTo('Team', 'winningTeamId'),
    week: a.belongsTo('Week', 'weekId'),
  }).authorization((allow) => [allow.publicApiKey()]),
  GameScore: a.model({
    gameId: a.id().required(),
    teamId: a.id().required(),
    score: a.integer().required(),
    team: a.belongsTo('Team', 'teamId'),
    game: a.belongsTo('Game', 'gameId'),
  }).authorization((allow) => [allow.publicApiKey()]),
  User: a.model({
    username: a.string().required(),
    email: a.string().required(),
    userPicks: a.hasMany('UserPick', 'userId'),
  }).authorization((allow) => [allow.publicApiKey()]),
  UserPick: a.model({
    userId: a.id().required(),
    gameId: a.id().required(),
    weekId: a.id().required(),
    winningTeamId: a.id().required(),
    teamId: a.id().required(),
    team: a.belongsTo('Team', 'teamId'),
    user: a.belongsTo('User', 'userId'),
    game: a.belongsTo('Game', 'gameId'),
    week: a.belongsTo('Week', 'weekId'),
    winningTeam: a.belongsTo('Team', 'winningTeamId'),
  }).authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
