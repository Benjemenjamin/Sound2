const hostname = "127.0.0.1";
const port = 3000;
let savedData: any;
let dataBank: Array<string> = []
let player: any;


Deno.serve({ hostname, port }, async (request: Request): Promise<Response> => {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*"// CORS
  });

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  if (request.method === "GET") {
    const url = new URL(request.url);
    
    const leaderboard = url.searchParams.get("leaderboard");
    let players;

    switch (leaderboard) {
        case "PointSum":
            players = sortByPointSum.all();
            break;

        case "averageScore":
            players = sortByAverageScore.all();
            break;

        case "TimesPlayed":
            players = sortByTimesPlayd.all();
            break;

        default:
            players = sortByHighScore.all();
            break;
    }

    return new Response(JSON.stringify(players), {
        status: 200,
        headers
    });
}

  if (request.method === "POST") {
    // Receive data from the client
    const bodyText = await request.text();
    try {
      let data = JSON.parse(bodyText);
      dataBank.push(data)
      savedData = data
      console.log(data);
      insertPlayer.run(data.name, 0, 0, 0, 0);
      player = getPlayer.get(data.name);

      player.TimesPlayed++;
      console.log(player.TimesPlayed);

      player.PointSum += data.Score
      player.averageScore = player.PointSum / player.TimesPlayed

      if (data.Score > player.highScore) {
        updatePlayerH.run(data.Score, player.averageScore, player.TimesPlayed, player.PointSum, data.name);
      }
      else {
        updatePlayer.run(player.averageScore, player.TimesPlayed, player.PointSum, data.name)
      }


    }
    catch (err) {
      console.error("Invalid JSON:", err);
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers });
    }
    return new Response(JSON.stringify({ status: "ok" }), { status: 200, headers });
  }

  // For all other methods
  return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers });
});

console.log(`Server running at http://${hostname}:${port}/`);


// Import from the jsr:@db/sqlite package
import { Database } from "jsr:@db/sqlite";

// Specify SQLite file
const dbFilePath = "PlayerScores.db";

// Connect to database
const db = new Database(dbFilePath);

// try {
//   // Example: output all students
//   const students = db.prepare("SELECT * FROM student").all();
//   console.log(students);
// } finally {
//   db.close();
// }
db.prepare(`CREATE TABLE IF NOT EXISTS player (
  name TEXT PRIMARY KEY,
  highScore INTEGER,
  averageScore INTEGER,
  TimesPlayed INTEGER,
  PointSum INTEGER
)`).run();


const insertPlayer = db.prepare(
  "INSERT OR IGNORE INTO player (name, highScore, averageScore, TimesPlayed, PointSum) VALUES (?, ?, ?, ?, ?)"
);
const deletePlayer = db.prepare(
  "DELETE FROM player WHERE name = ?"
)
const updatePlayerH = db.prepare(
  "UPDATE player SET highScore = ?, averageScore = ?, TimesPlayed = ?, PointSum = ? WHERE name = ?"
)
const updatePlayer = db.prepare(
  "UPDATE player SET averageScore = ?, TimesPlayed = ?, PointSum = ? WHERE name = ?"
)
const getPlayer = db.prepare(
  "SELECT * FROM player WHERE name = ?"
)
const sortByHighScore = db.prepare(
  "SELECT * FROM player ORDER BY highScore DESC;"
);
const sortByAverageScore = db.prepare(
  "SELECT * FROM player ORDER BY averageScore DESC;"
);
const sortByTimesPlayd = db.prepare(
  "SELECT * FROM player ORDER BY TimesPlayed DESC;"
);
const sortByPointSum = db.prepare(
  "SELECT * FROM player ORDER BY PointSum DESC;"
);




