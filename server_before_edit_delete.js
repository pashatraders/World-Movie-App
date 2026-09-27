const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const ADMIN_EMAIL = "admin@worldmovieapp.local";
const ADMIN_PASSWORD = "ChangeThisPassword123!";

const DATA_DIR = path.join(__dirname, "data");
const MOVIES_FILE = path.join(DATA_DIR, "movies.json");

fs.mkdirSync(DATA_DIR, { recursive: true });

if (!fs.existsSync(MOVIES_FILE)) {
  fs.writeFileSync(MOVIES_FILE, "[]");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "world-movie-app-session-secret-change-later",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax"
    }
  })
);

function getMovies() {
  try {
    return JSON.parse(fs.readFileSync(MOVIES_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveMovies(movies) {
  fs.writeFileSync(MOVIES_FILE, JSON.stringify(movies, null, 2));
}

function requireAdmin(req, res, next) {
  if (req.session.isAdmin) {
    return next();
  }

  res.redirect("/admin/login");
}

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
.box{max-width:700px;margin:30px auto;padding:20px}
a{display:inline-block;margin:8px;padding:12px 20px;background:#e50914;color:#fff;text-decoration:none;border-radius:6px}
</style>
</head>
<body>
<header>
<h1>🎬 World Movie App</h1>
</header>
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
  res.json(getMovies());
});

app.get("/admin/login", (req, res) => {
  if (req.session.isAdmin) {
    return res.redirect("/admin");
  }

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Admin Login</title>
<style>
body{font-family:Arial;background:#111;color:#fff;padding:20px}
.box{max-width:400px;margin:50px auto;background:#222;padding:25px;border-radius:10px}
input,button{width:100%;box-sizing:border-box;margin:8px 0;padding:12px;border-radius:5px}
button{background:#e50914;color:#fff;border:0}
.error{color:#ff6b6b}
</style>
</head>
<body>
<div class="box">
<h1>🎬 Admin Login</h1>

<form method="POST" action="/admin/login">
<input type="email" name="email" placeholder="Admin Email" required>
<input type="password" name="password" placeholder="Password" required>
<button type="submit">Login</button>
</form>

</div>
</body>
</html>
`);
});

app.post("/admin/login", (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    req.session.adminEmail = email;
    return res.redirect("/admin");
  }

  res.status(401).send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Login Failed</title>
</head>
<body style="background:#111;color:#fff;text-align:center;font-family:Arial;padding:40px">
<h2>Invalid email or password</h2>
<a href="/admin/login" style="color:#fff">Try Again</a>
</body>
</html>
`);
});

app.post("/admin/logout", requireAdmin, (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

app.get("/admin", requireAdmin, (req, res) => {
  const movies = getMovies();

  const movieList = movies.length
    ? movies.map(movie => `
      <div style="background:#333;margin:10px 0;padding:15px;border-radius:8px;text-align:left">
        <h3>${escapeHtml(movie.title)}</h3>
        <p>${escapeHtml(movie.description || "")}</p>
        <small>ID: ${escapeHtml(movie.id)}</small>
      </div>
    `).join("")
    : "<p>No movies added yet.</p>";

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>World Movie App - Admin</title>
<style>
body{font-family:Arial;background:#111;color:#fff;padding:20px}
.panel{max-width:700px;margin:auto}
input,textarea,button{width:100%;box-sizing:border-box;margin:8px 0;padding:12px;border-radius:5px}
button{background:#e50914;color:#fff;border:0}
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

<hr>

<h2>Movies</h2>
${movieList}

<form method="POST" action="/admin/logout">
<button type="submit">Logout</button>
</form>

<p><a href="/" style="color:#fff">← Home</a></p>
</div>

</body>
</html>
`);
});

app.post("/admin/add", requireAdmin, (req, res) => {
  const movies = getMovies();

  movies.push({
    id: Date.now().toString(),
    title: req.body.title || "",
    description: req.body.description || "",
    posterUrl: req.body.posterUrl || "",
    trailerUrl: req.body.trailerUrl || "",
    watchUrl: req.body.watchUrl || ""
  });

  saveMovies(movies);
  res.redirect("/admin");
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    "World Movie App running on http://127.0.0.1:" + PORT
  );
});
0

