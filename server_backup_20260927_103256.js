const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const DATA_DIR = path.join(__dirname, "data");
const MOVIES_FILE = path.join(DATA_DIR, "movies.json");

fs.mkdirSync(DATA_DIR, { recursive: true });

if (!fs.existsSync(MOVIES_FILE)) {
  fs.writeFileSync(MOVIES_FILE, "[]");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>World Movie App</title>
<style>
body{margin:0;font-family:Arial;background:#111;color:#fff;text-align:center}
header{padding:25px;background:#000}
.box{max-width:600px;margin:30px auto;padding:20px}
a{display:inline-block;margin:10px;padding:12px 20px;background:#e50914;color:#fff;text-decoration:none;border-radius:6px}
</style>
</head>
<body>
<header><h1>🎬 World Movie App</h1></header>
<div class="box">
<h2>Welcome</h2>
<p>Your movie platform is running.</p>
<a href="/movies">View Movies</a>
<a href="/admin">Admin Panel</a>
</div>
</body>
</html>
`);
});

app.get("/movies", (req, res) => {
  let movies = [];

  try {
    movies = JSON.parse(fs.readFileSync(MOVIES_FILE, "utf8"));
  } catch (error) {
    movies = [];
  }

  res.json(movies);
});

app.get("/admin", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>World Movie App - Admin</title>
<style>
body{font-family:Arial;background:#111;color:#fff;padding:20px}
.panel{max-width:600px;margin:auto;background:#222;padding:25px;border-radius:10px}
input,textarea,button{width:100%;box-sizing:border-box;margin:8px 0;padding:12px;border-radius:5px}
button{background:#e50914;color:#fff;border:0}
a{color:#fff}
</style>
</head>
<body>
<div class="panel">
<h1>🎬 World Movie App</h1>
<h2>Admin Panel</h2>

<form method="POST" action="/admin/add">
<input name="title" placeholder="Movie Title" required>
<textarea name="description" placeholder="Description"></textarea>
<input name="posterUrl" placeholder="Poster URL">
<input name="trailerUrl" placeholder="Trailer URL">
<input name="watchUrl" placeholder="Watch URL">
<button type="submit">Add Movie</button>
</form>

<p><a href="/">← Home</a></p>
</div>
</body>
</html>
`);
});

app.post("/admin/add", (req, res) => {
  let movies = [];

  try {
    movies = JSON.parse(fs.readFileSync(MOVIES_FILE, "utf8"));
  } catch (error) {
    movies = [];
  }

  const movie = {
    id: Date.now().toString(),
    title: req.body.title || "",
    description: req.body.description || "",
    posterUrl: req.body.posterUrl || "",
    trailerUrl: req.body.trailerUrl || "",
    watchUrl: req.body.watchUrl || ""
  };

  movies.push(movie);

  fs.writeFileSync(
    MOVIES_FILE,
    JSON.stringify(movies, null, 2)
  );

  res.redirect("/admin");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("World Movie App running on http://127.0.0.1:" + PORT);
});
0

