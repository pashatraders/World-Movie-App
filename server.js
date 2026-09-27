const userRoutes = require("./user_routes");0
const bcrypt = require("bcryptjs");
0
const { getUsers, saveUsers } = require("./users");0
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
  if (req.session.isAdmin) return next();
  res.redirect("/admin/login");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   HOME PAGE
========================= */

userRoutes.getUsers = getUsers;
userRoutes.saveUsers = saveUsers;
app.use(userRoutes);
0
app.get("/", (req, res) => {
  const movies = getMovies();

  const movieCards = movies.length
    ? movies.map(movie => `
      <div class="movie-card">
        <div class="poster">
          ${
            movie.posterUrl
              ? `<img src="${escapeHtml(movie.posterUrl)}" alt="${escapeHtml(movie.title)}">`
              : `<div class="no-poster">🎬</div>`
          }
        </div>

        <div class="movie-info">
          <h3>${escapeHtml(movie.title)}</h3>
          <p>${escapeHtml(movie.description)}</p>

          <div class="buttons">
            ${
              movie.trailerUrl
                ? `<a class="trailer" href="${escapeHtml(movie.trailerUrl)}" target="_blank">Trailer</a>`
                : ""
            }

            ${
              movie.watchUrl
                ? `<a class="watch" href="${escapeHtml(movie.watchUrl)}" target="_blank">▶ Watch</a>`
                : ""
            }
          </div>
        </div>
      </div>
    `).join("")
    : `
      <div class="empty">
        <div>🎬</div>
        <h2>Your movie collection is waiting</h2>
        <p>Movies added from the Admin Panel will appear here.</p>
      </div>
    `;

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>World Movie App</title>

<style>

*{
  box-sizing:border-box;
}

body{
  margin:0;
  font-family:Arial,Helvetica,sans-serif;
  background:#080b12;
  color:white;
}

.navbar{
  height:70px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 6%;
  background:rgba(5,7,12,.96);
  position:sticky;
  top:0;
  z-index:100;
  border-bottom:1px solid #202532;
}

.logo{
  font-size:24px;
  font-weight:bold;
  letter-spacing:.5px;
}

.logo span{
  color:#e50914;
}

.nav-links a{
  color:#ddd;
  text-decoration:none;
  margin-left:20px;
  font-size:14px;
}

.nav-links a:hover{
  color:white;
}

.hero{
  min-height:470px;
  padding:80px 7%;
  display:flex;
  align-items:center;
  background:
    radial-gradient(circle at 75% 35%,rgba(25,80,180,.35),transparent 35%),
    radial-gradient(circle at 20% 20%,rgba(220,20,60,.25),transparent 35%),
    linear-gradient(120deg,#080b12,#10182a);
}

.hero-content{
  max-width:650px;
}

.badge{
  display:inline-block;
  padding:8px 14px;
  border-radius:30px;
  background:#ffffff12;
  border:1px solid #ffffff22;
  color:#ddd;
  font-size:13px;
}

.hero h1{
  font-size:52px;
  margin:20px 0 12px;
  line-height:1.05;
}

.hero h1 span{
  color:#e50914;
}

.hero p{
  color:#b9bfca;
  font-size:17px;
  line-height:1.6;
}

.hero-buttons{
  margin-top:25px;
}

.hero-buttons a{
  display:inline-block;
  padding:13px 22px;
  border-radius:7px;
  text-decoration:none;
  margin-right:10px;
  font-weight:bold;
}

.primary{
  background:#e50914;
  color:white;
}

.secondary{
  background:#ffffff14;
  color:white;
  border:1px solid #ffffff25;
}

.section{
  padding:45px 6%;
}

.section-title{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:25px;
}

.section-title h2{
  margin:0;
  font-size:27px;
}

.section-title span{
  color:#8e96a5;
  font-size:13px;
}

.movie-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
  gap:22px;
}

.movie-card{
  background:#111722;
  border:1px solid #202838;
  border-radius:12px;
  overflow:hidden;
  transition:.25s;
}

.movie-card:hover{
  transform:translateY(-5px);
  border-color:#39445a;
}

.poster{
  height:310px;
  background:#171d29;
}

.poster img{
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
}

.no-poster{
  height:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:55px;
  color:#626b7c;
}

.movie-info{
  padding:16px;
}

.movie-info h3{
  margin:0 0 8px;
  font-size:19px;
}

.movie-info p{
  color:#9ca5b5;
  font-size:13px;
  line-height:1.5;
  min-height:40px;
}

.buttons{
  display:flex;
  gap:8px;
  margin-top:14px;
}

.buttons a{
  flex:1;
  text-align:center;
  padding:10px 5px;
  border-radius:6px;
  text-decoration:none;
  font-size:13px;
  font-weight:bold;
}

.watch{
  background:#e50914;
  color:white;
}

.trailer{
  background:#252d3c;
  color:white;
}

.membership{
  margin:30px 6% 60px;
  padding:45px 30px;
  text-align:center;
  border-radius:18px;
  background:
    radial-gradient(circle at 50% 0%,rgba(40,90,200,.28),transparent 55%),
    #101722;
  border:1px solid #263248;
}

.membership h2{
  font-size:32px;
  margin:0 0 10px;
}

.membership p{
  color:#aeb6c4;
}

.plans{
  display:flex;
  justify-content:center;
  gap:18px;
  flex-wrap:wrap;
  margin-top:28px;
}

.plan{
  width:250px;
  padding:25px;
  background:#171e2b;
  border:1px solid #303b50;
  border-radius:12px;
}

.plan h3{
  margin-top:0;
}

.price{
  font-size:27px;
  font-weight:bold;
  margin:15px 0;
}

.plan button{
  width:100%;
  padding:12px;
  border:0;
  border-radius:6px;
  background:#e50914;
  color:white;
  font-weight:bold;
}

.plan button:disabled{
  opacity:.7;
}

.empty{
  text-align:center;
  padding:80px 20px;
  color:#929bab;
  grid-column:1/-1;
}

.empty div{
  font-size:55px;
}

footer{
  text-align:center;
  padding:30px;
  color:#6f7888;
  border-top:1px solid #202532;
  font-size:13px;
}

@media(max-width:650px){

  .navbar{
    padding:0 20px;
  }

  .nav-links a{
    margin-left:10px;
  }

  .hero{
    padding:60px 25px;
    min-height:420px;
  }

  .hero h1{
    font-size:38px;
  }

  .section{
    padding:35px 20px;
  }

  .movie-grid{
    grid-template-columns:repeat(2,1fr);
    gap:12px;
  }

  .poster{
    height:230px;
  }

  .movie-info{
    padding:11px;
  }

  .movie-info h3{
    font-size:16px;
  }

  .movie-info p{
    font-size:12px;
  }

  .membership{
    margin-left:20px;
    margin-right:20px;
    padding:35px 15px;
  }

}

</style>
</head>

<body>

<nav class="navbar">

  <div class="logo">
    🎬 <span>World</span> Movie App
  </div>

  <div class="nav-links">
    <a href="/">Home</a>
    <a href="#movies">Movies</a>
    <a href="#membership">Membership</a>
    <a href="/admin">Admin</a>
  </div>

</nav>

<section class="hero">

  <div class="hero-content">

    <div class="badge">🌍 Entertainment for everyone</div>

    <h1>
      Watch something<br>
      <span>amazing.</span>
    </h1>

    <p>
      Discover movies, trailers and entertainment
      in one beautiful place.
    </p>

    <div class="hero-buttons">
      <a class="primary" href="#movies">▶ Explore Movies</a>
      <a class="secondary" href="#membership">⭐ Membership</a>
    </div>

  </div>

</section>

<section class="section" id="movies">

  <div class="section-title">
    <h2>🎬 Latest Movies</h2>
    <span>${movies.length} movie${movies.length === 1 ? "" : "s"}</span>
  </div>

  <div class="movie-grid">
    ${movieCards}
  </div>

</section>

<section class="membership" id="membership">

  <h2>⭐ Choose Your Membership</h2>

  <p>
    Membership plans can be connected to a secure payment provider later.
  </p>

  <div class="plans">

    <div class="plan">
      <h3>Free</h3>
      <div class="price">Rs. 0</div>
      <p>Explore the platform</p>
      <button disabled>Current Plan</button>
    </div>

    <div class="plan">
      <h3>Premium</h3>
      <div class="price">Coming Soon</div>
      <p>Premium features and content access</p>
      <button disabled>Coming Soon</button>
    </div>

  </div>

</section>

<footer>
  © ${new Date().getFullYear()} World Movie App
</footer>

</body>
</html>
`);
});

/* =========================
   MOVIES API
========================= */

app.get("/movies", (req, res) => {
  res.json(getMovies());
});

/* =========================
   ADMIN LOGIN
========================= */

app.get("/admin/login", (req, res) => {

  if (req.session.isAdmin) {
    return res.redirect("/admin");
  }

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin Login</title>

<style>
body{
  margin:0;
  font-family:Arial;
  background:#080b12;
  color:white;
  padding:20px;
}

.box{
  max-width:400px;
  margin:70px auto;
  background:#111722;
  padding:30px;
  border-radius:14px;
  border:1px solid #273247;
}

input,button{
  width:100%;
  box-sizing:border-box;
  margin:8px 0;
  padding:13px;
  border-radius:6px;
}

input{
  background:#080b12;
  border:1px solid #303a4d;
  color:white;
}

button{
  background:#e50914;
  color:white;
  border:0;
  font-weight:bold;
}
</style>

</head>

<body>

<div class="box">

<h1>🎬 Admin Login</h1>

<form method="POST" action="/admin/login">

<input type="email"
name="email"
placeholder="Admin Email"
required>

<input type="password"
name="password"
placeholder="Password"
required>

<button type="submit">Login</button>

</form>

</div>

</body>
</html>
`);
});

app.post("/admin/login", (req, res) => {

  const { email, password } = req.body;

  if (
    email === ADMIN_EMAIL &&
    password === ADMIN_PASSWORD
  ) {

    req.session.isAdmin = true;
    req.session.adminEmail = email;

    return res.redirect("/admin");
  }

  res.status(401).send(`
  <body style="background:#080b12;color:white;text-align:center;font-family:Arial;padding:50px">
  <h2>Invalid email or password</h2>
  <a href="/admin/login" style="color:white">Try Again</a>
  </body>
  `);
});

/* =========================
   ADMIN PANEL
========================= */

app.get("/admin", requireAdmin, (req, res) => {

  const movies = getMovies();

  const movieList = movies.length
    ? movies.map(movie => `
      <div style="
        background:#171e2b;
        margin:12px 0;
        padding:16px;
        border-radius:10px;
        border:1px solid #2a3548;
      ">

        <h3>${escapeHtml(movie.title)}</h3>

        <p style="color:#aab2c0">
          ${escapeHtml(movie.description)}
        </p>

        <small>
          ID: ${escapeHtml(movie.id)}
        </small>

        <div style="margin-top:15px">

          <a href="/admin/edit/${encodeURIComponent(movie.id)}"
             style="
             display:inline-block;
             background:#2878ff;
             color:white;
             padding:10px 15px;
             border-radius:5px;
             text-decoration:none;
             ">
             ✏️ Edit
          </a>

          <form method="POST"
                action="/admin/delete/${encodeURIComponent(movie.id)}"
                style="display:inline"
                onsubmit="return confirm('Delete this movie?')">

            <button type="submit"
              style="
              width:auto;
              background:#d00000;
              color:white;
              padding:10px 15px;
              border:0;
              border-radius:5px;
              margin-left:5px;
              ">
              🗑️ Delete
            </button>

          </form>

        </div>

      </div>
    `).join("")
    : "<p>No movies added yet.</p>";

  res.send(`
<!DOCTYPE html>
<html>

<head>

<meta name="viewport"
content="width=device-width,initial-scale=1">

<title>World Movie App Admin</title>

<style>

body{
  margin:0;
  font-family:Arial;
  background:#080b12;
  color:white;
  padding:20px;
}

.panel{
  max-width:750px;
  margin:auto;
}

input,textarea,button{
  width:100%;
  box-sizing:border-box;
  margin:8px 0;
  padding:12px;
  border-radius:6px;
}

input,textarea{
  background:#111722;
  border:1px solid #303b50;
  color:white;
}

button{
  background:#e50914;
  color:white;
  border:0;
  font-weight:bold;
}

hr{
  border:0;
  border-top:1px solid #293244;
  margin:30px 0;
}

</style>

</head>

<body>

<div class="panel">

<h1>🎬 World Movie App</h1>

<h2>Admin Panel</h2>

<form method="POST" action="/admin/add">

<input
name="title"
placeholder="Movie Title"
required>

<textarea
name="description"
placeholder="Description"></textarea>

<input
name="posterUrl"
placeholder="Poster URL">

<input
name="trailerUrl"
placeholder="Trailer URL">

<input
name="watchUrl"
placeholder="Watch URL">

<button type="submit">
➕ Add Movie
</button>

</form>

<hr>

<h2>Movies</h2>

${movieList}

<form method="POST" action="/admin/logout">

<button type="submit">
Logout
</button>

</form>

<p>
<a href="/" style="color:white">
← Home
</a>
</p>

</div>

</body>

</html>
`);
});

/* =========================
   ADD MOVIE
========================= */

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

/* =========================
   EDIT MOVIE
========================= */

app.get("/admin/edit/:id", requireAdmin, (req, res) => {

  const movies = getMovies();

  const movie = movies.find(
    m => m.id === req.params.id
  );

  if (!movie) {
    return res.status(404).send("Movie not found");
  }

  res.send(`
<!DOCTYPE html>
<html>

<head>

<meta name="viewport"
content="width=device-width,initial-scale=1">

<title>Edit Movie</title>

<style>

body{
  font-family:Arial;
  background:#080b12;
  color:white;
  padding:20px;
}

.panel{
  max-width:700px;
  margin:auto;
}

input,textarea,button{
  width:100%;
  box-sizing:border-box;
  margin:8px 0;
  padding:12px;
  border-radius:6px;
}

input,textarea{
  background:#111722;
  color:white;
  border:1px solid #303b50;
}

button{
  background:#e50914;
  color:white;
  border:0;
  font-weight:bold;
}

a{
  color:white;
}

</style>

</head>

<body>

<div class="panel">

<h1>✏️ Edit Movie</h1>

<form method="POST"
action="/admin/edit/${encodeURIComponent(movie.id)}">

<input
name="title"
value="${escapeHtml(movie.title)}"
placeholder="Movie Title"
required>

<textarea
name="description"
placeholder="Description">${escapeHtml(movie.description)}</textarea>

<input
name="posterUrl"
value="${escapeHtml(movie.posterUrl)}"
placeholder="Poster URL">

<input
name="trailerUrl"
value="${escapeHtml(movie.trailerUrl)}"
placeholder="Trailer URL">

<input
name="watchUrl"
value="${escapeHtml(movie.watchUrl)}"
placeholder="Watch URL">

<button type="submit">
💾 Save Changes
</button>

</form>

<p>
<a href="/admin">
← Back to Admin Panel
</a>
</p>

</div>

</body>

</html>
`);
});

app.post("/admin/edit/:id", requireAdmin, (req, res) => {

  const movies = getMovies();

  const index = movies.findIndex(
    m => m.id === req.params.id
  );

  if (index === -1) {
    return res.status(404).send("Movie not found");
  }

  movies[index] = {
    ...movies[index],
    title: req.body.title || "",
    description: req.body.description || "",
    posterUrl: req.body.posterUrl || "",
    trailerUrl: req.body.trailerUrl || "",
    watchUrl: req.body.watchUrl || ""
  };

  saveMovies(movies);

  res.redirect("/admin");
});

/* =========================
   DELETE MOVIE
========================= */

app.post("/admin/delete/:id", requireAdmin, (req, res) => {

  const movies = getMovies();

  const newMovies = movies.filter(
    movie => movie.id !== req.params.id
  );

  if (newMovies.length === movies.length) {
    return res.status(404).send("Movie not found");
  }

  saveMovies(newMovies);

  res.redirect("/admin");
});

/* =========================
   LOGOUT
========================= */

app.post("/admin/logout", requireAdmin, (req, res) => {

  req.session.destroy(() => {
    res.redirect("/admin/login");
  });

});

/* =========================
   SERVER
========================= */

app.listen(PORT, "0.0.0.0", () => {

  console.log(
    "World Movie App running on http://127.0.0.1:" + PORT
  );

});0

