const userRoutes = require("./user_routes");
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");

const app = express();





require("./seo")(app);
const PORT = 3000;

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

app.use(express.static(path.join(__dirname, "public")));

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

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function requireAdmin(req, res, next) {
  if (req.session.isAdmin) return next();
  res.redirect("/admin/login");
}

/* =========================
   USER ROUTES
========================= */

userRoutes.getUsers = require("./users").getUsers;
userRoutes.saveUsers = require("./users").saveUsers;
app.use(userRoutes);

/* =========================
   HOME PAGE
========================= */

app.get("/", (req, res) => {

  const movies = getMovies();

  const safe = value => escapeHtml(String(value ?? ""));

  const released = movies.filter(m => (m.status || "Released") !== "Coming Soon");
  const comingSoon = movies.filter(m => (m.status || "") === "Coming Soon");
  const trending = movies.filter(m => m.trending === true || m.trending === "1");

  const featured = movies.filter(m =>
    (m.featured === true || m.featured === "1") &&
    !(m.trending === true || m.trending === "1")
  );

  const usedHomeIds = new Set([
    ...trending.map(m => String(m.id)),
    ...featured.map(m => String(m.id))
  ]);

  const latest = [...movies]
    .reverse()
    .filter(m => !usedHomeIds.has(String(m.id)))
    .slice(0, 6);

  const categories = [
    "All",
    "English",
    "Pakistani",
    "Indian",
    "Punjabi",
    "Korean",
    "Turkish",
    "Chinese",
    "Japanese",
    "Public Domain"
  ];

  const genres = [
    "Action",
    "Adventure",
    "Comedy",
    "Crime",
    "Drama",
    "Horror",
    "Romance",
    "Sci-Fi",
    "Thriller",
    "Fantasy",
    "Animation",
    "Documentary"
  ];

  function card(movie) {

    const id = encodeURIComponent(movie.id || movie.title || "");
    const type = movie.type || "Movie";
    const category = movie.category || "Public Domain";
    const year = movie.year || "";
    const rating = movie.rating || "";
    const language = movie.language || "";
    const genre = movie.genre || "";

    return `
      <article
        class="movie-card"
        data-title="${safe(movie.title).toLowerCase()}"
        data-category="${safe(category).toLowerCase()}"
        data-genre="${safe(genre).toLowerCase()}"
        data-language="${safe(language).toLowerCase()}"
        data-type="${safe(type).toLowerCase()}"
        onclick="if(event.target.closest('a,button'))return;window.location.href='/movie/${id}'"
      >

        <div class="poster">

          ${
            movie.posterUrl
              ? `<img src="${safe(movie.posterUrl)}" alt="${safe(movie.title)}" loading="lazy">`
              : `<div class="no-poster">🎬</div>`
          }

          <div class="poster-top">

            <span class="type-badge">
              ${safe(type)}
            </span>

            ${
              rating
                ? `<span class="rating-badge">⭐ ${safe(rating)}</span>`
                : ""
            }

          </div>

          <div class="poster-overlay">

            ${
              movie.watchUrl
                ? `<a href="${safe(movie.watchUrl)}" target="_blank" rel="noopener">▶ Watch</a>`
                : `<a href="/movie/${id}">View Details</a>`
            }

          </div>

        </div>

        <div class="movie-info">

          <div class="meta-line">

            <span class="category">
              ${safe(category)}
            </span>

            ${
              year
                ? `<span>${safe(year)}</span>`
                : ""
            }

          </div>

          <h3>${safe(movie.title)}</h3>

          ${
            genre
              ? `<div class="genre">${safe(genre)}</div>`
              : ""
          }

          ${
            language
              ? `<div class="language">🌍 ${safe(language)}</div>`
              : ""
          }

          <div class="buttons">

            <a class="details" href="/movie/${id}">
              Details
            </a>

            ${
              movie.trailerUrl
                ? `<a class="trailer" href="${safe(movie.trailerUrl)}" target="_blank" rel="noopener">Trailer</a>`
                : ""
            }

          </div>

        </div>

      </article>
    `;
  }

  function row(title, subtitle, list, id, icon) {

    if (!list.length) return "";

    return `
      <section class="content-section" id="${id}">

        <div class="section-heading">

          <div>
            <div class="eyebrow">${icon} World Movie App</div>
            <h2>${title}</h2>
            <p>${subtitle}</p>
          </div>

          <span class="section-count">
            ${list.length} ${list.length === 1 ? "title" : "titles"}
          </span>

        </div>

        <div class="movie-row">
          ${list.slice(0, 12).map(card).join("")}
        </div>

      </section>
    `;
  }

  const movieCount = movies.length;

  res.send(`<!DOCTYPE html><html lang="en"><head><style id="wmx-desktop-poster-fix">@media (min-width:801px){.wmx-section{padding:32px 7% 12px}.movie-row{display:grid;grid-template-columns:repeat(6,160px);gap:22px;align-items:start}.movie-card{width:160px;min-width:160px}.movie-card .poster{width:160px;height:240px;overflow:hidden;border-radius:10px}.movie-card .poster img{width:100%;height:100%;object-fit:cover;display:block}.movie-info{width:160px}.movie-info h3{font-size:15px;line-height:1.3;margin:8px 0 4px}.movie-info p{font-size:12px;line-height:1.35;margin:0}}</style><meta charset="UTF-8"><meta name="google-site-verification" content="lfHcPxAGLAjVJcETATlrs-r7lX9gl0KPD92tA292a4c"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>World Movie App | Movies, Trailers & Movie Information</title>
<style id="WMX_CINEMATIC_POLISH_V1">
:root {
  --wmx-bg:#090711;
  --wmx-surface:#131020;
  --wmx-surface-2:#1b1630;
  --wmx-purple:#9655f5;
  --wmx-purple-light:#bc93ff;
  --wmx-text:#f8f5ff;
}
.wmx-hero {
  position:relative;
  isolation:isolate;
  overflow:hidden;
  background:radial-gradient(ellipse at 78% 35%,rgba(150,85,245,.19),transparent 42%),linear-gradient(135deg,#090711 0%,#100b1d 58%,#17102a 100%);
}
.wmx-hero-content { position:relative; z-index:2; }
.wmx-hero-content h1 {
  color:var(--wmx-text);
  letter-spacing:-.045em;
  text-wrap:balance;
}
.wmx-hero-content h1 strong {
  color:var(--wmx-purple-light);
  text-shadow:0 0 36px rgba(150,85,245,.24);
}
.wmx-cinema-art {
  border-color:rgba(188,147,255,.3);
  filter:drop-shadow(0 18px 38px rgba(0,0,0,.28));
}
.wmx-art-poster {
  background:linear-gradient(145deg,#211438,#100d1b 72%);
  border:1px solid rgba(188,147,255,.28);
  box-shadow:0 22px 70px rgba(0,0,0,.35),inset 0 0 32px rgba(150,85,245,.08);
}
.wmx-art-poster b { color:#f8f5ff; }
.wmx-primary {
  background:linear-gradient(135deg,#9655f5,#7137cf);
  box-shadow:0 8px 24px rgba(150,85,245,.22);
}
.wmx-primary:hover { filter:brightness(1.12); }
.wmx-secondary { border-color:rgba(188,147,255,.4); }
@media(max-width:800px) {
  .wmx-hero { padding-top:28px; }
  .wmx-hero-content h1 { line-height:1.02; }
  .wmx-hero-side { max-width:100%; }
}
@media(prefers-reduced-motion:reduce) {
  .wmx-hero *, .wmx-hero *::before, .wmx-hero *::after {
    animation-duration:.01ms!important;
    transition-duration:.01ms!important;
  }
}
</style>

/* WORLD_MOVIE_APP_PURPLE_UNIFY_V1 */
<style id="WMX_PURPLE_UNIFY_V1">
.wmx-home{
  --wmx-red:#9655f5;
  --wmx-purple:#9655f5;
  --wmx-purple-light:#bc93ff;
}
.wmx-home .wmx-brand span,
.wmx-home .wmx-kicker,
.wmx-home .wmx-hero h1 strong,
.wmx-home .wmx-glass span,
.wmx-home .wmx-membership small,
.wmx-home .wmx-title small,
.wmx-home .wmx-title a{
  color:var(--wmx-purple-light)!important;
}
.wmx-home .wmx-hero-bg{
  background:
    radial-gradient(circle at 75% 42%,rgba(150,85,245,.30),transparent 30%),
    radial-gradient(circle at 90% 80%,rgba(85,65,155,.24),transparent 32%)!important;
}
.wmx-home .wmx-primary,
.wmx-home .wmx-cat:hover,
.wmx-home .wmx-genres a:hover{
  background:var(--wmx-purple)!important;
  border-color:var(--wmx-purple)!important;
  color:#fff!important;
}
.wmx-home .wmx-hero{
  background:linear-gradient(110deg,#090711 0%,#100b1d 58%,#19102b 100%)!important;
}
</style>


<style id="WMX_PURPLE_RESPONSIVE_V2">
.wmx-home {
  --wmx-purple:#9655f5;
  --wmx-purple-light:#bc93ff;
  --wmx-bg:#090711;
  --wmx-surface:#131020;
  --wmx-surface-2:#1b1630;
}
.wmx-home .wmx-brand span,
.wmx-home .wmx-kicker,
.wmx-home .wmx-hero h1 strong,
.wmx-home .wmx-glass span,
.wmx-home .wmx-membership small,
.wmx-home .wmx-title small,
.wmx-home .wmx-title a {
  color:var(--wmx-purple-light)!important;
}
.wmx-home .wmx-primary,
.wmx-home .wmx-cat:hover,
.wmx-home .wmx-genres a:hover,
.wmx-home .wmx-view-btn.active,
.wmx-home .wmx-switch button.active {
  background:var(--wmx-purple)!important;
  border-color:var(--wmx-purple)!important;
  color:#fff!important;
}
.wmx-home .wmx-hero {
  background:linear-gradient(115deg,#090711 0%,#100b1d 58%,#19102b 100%)!important;
}
.wmx-home .wmx-hero-bg {
  background:
    radial-gradient(circle at 75% 42%,rgba(150,85,245,.30),transparent 30%),
    radial-gradient(circle at 90% 80%,rgba(85,65,155,.24),transparent 32%)!important;
}
.wmx-home .wmx-cat:hover,
.wmx-home .wmx-genres a:hover {
  box-shadow:0 5px 22px rgba(150,85,245,.22);
}
.wmx-home .wmx-cards {
  grid-template-columns:repeat(auto-fill,minmax(135px,1fr))!important;
  gap:20px 16px!important;
}
.wmx-home .wmx-cards > * {
  min-width:0;
}
@media (min-width:801px) {
  .wmx-home .wmx-hero {
    min-height:610px!important;
    padding-left:6%!important;
    padding-right:6%!important;
  }
}
@media (max-width:800px) {
  .wmx-home .wmx-hero {
    min-height:auto!important;
    padding:42px 18px 30px!important;
    display:flex!important;
    flex-direction:column!important;
    align-items:stretch!important;
    gap:22px!important;
  }
  .wmx-home .wmx-hero-content {
    width:100%!important;
    max-width:100%!important;
  }
  .wmx-home .wmx-hero-content h1 {
    font-size:clamp(34px,9vw,56px)!important;
    line-height:1.04!important;
    letter-spacing:-1.5px!important;
    overflow-wrap:anywhere;
  }
  .wmx-home .wmx-hero p {
    font-size:15px!important;
    line-height:1.6!important;
  }
  .wmx-home .wmx-hero-side {
    position:relative!important;
    inset:auto!important;
    width:100%!important;
    max-width:100%!important;
    display:flex!important;
    margin:0!important;
  }
  .wmx-home .wmx-cards {
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    gap:18px 12px!important;
  }
}
@media (max-width:360px) {
  .wmx-home .wmx-cards {
    gap:14px 8px!important;
  }
}
</style>

<style id="WMX_PURPLE_FINAL_V3">
.wmx-home .wmx-brand span,
.wmx-home .wmx-kicker,
.wmx-home .wmx-hero h1 strong,
.wmx-home .wmx-glass span,
.wmx-home .wmx-membership small,
.wmx-home .wmx-title small,
.wmx-home .wmx-title a {
  color: var(--wmx-purple-light, #bc93ff) !important;
}
.wmx-home .wmx-primary,
.wmx-home .wmx-cat:hover,
.wmx-home .wmx-genres a:hover,
.wmx-home .wmx-view-switch button.active,
.wmx-home .wmx-switch button.active {
  background-color: var(--wmx-purple, #9655f5) !important;
  border-color: var(--wmx-purple, #9655f5) !important;
}
.wmx-home .wmx-primary {
  box-shadow: 0 8px 28px rgba(150,85,245,.28) !important;
}
.wmx-home .wmx-primary:hover {
  background-color: var(--wmx-purple-light, #bc93ff) !important;
}
</style>

</head><body><script src="/miko/miko-loader.js" defer></script><div class="wmx-home">

<header class="wmx-top">
  <a class="wmx-brand" href="/">WORLD <span>MOVIE</span> APP</a>
  <div style="display:flex;align-items:center">
  <nav>
    <a href="/">Home</a>
    <a href="/movies">Movies</a>
    <a href="#categories">Categories</a>
    <a href="#membership">Membership</a>
    <a href="/admin">Admin</a>
  </nav>
  <div class="wmx-view-switch">
    <button id="wmxDesktopBtn" onclick="wmxSetView('desktop')">🖥 Desktop</button>
    <button id="wmxMobileBtn" onclick="wmxSetView('mobile')">📱 Mobile</button>
  </div>
</div>
</header>

<section class="wmx-hero">
  <div class="wmx-hero-bg"></div>
  <div class="wmx-hero-content">
    <div class="wmx-kicker">WORLD MOVIE APP</div>
    <h1>WATCH SOMETHING<br><strong>AMAZING</strong></h1>
    <p>Discover movies and entertainment from around the world through authorized and public-domain sources.</p>
    <div class="wmx-actions">
      <a href="/movies" class="wmx-primary">▶ Explore Movies</a>
      <a href="#categories" class="wmx-secondary">Browse Categories</a>
    </div>
  </div>
  <div class="wmx-hero-side">
    <div class="wmx-cinema-art" aria-label="World Movie App featured artwork">
      <div class="wmx-art-orbit wmx-art-orbit-one"></div>
      <div class="wmx-art-orbit wmx-art-orbit-two"></div>
      <div class="wmx-art-poster">
        <span class="wmx-art-eyebrow">WORLD MOVIE APP</span>
        <div class="wmx-art-symbol">✦</div>
        <b>YOUR NEXT<br>GREAT MOVIE<br>AWAITS</b>
        <small>YOUR NEXT FAVORITE AWAITS</small>
      </div>
      <div class="wmx-art-chip">✦ DISCOVER YOUR NEXT FILM</div>
      <div class="wmx-art-index">WMA <span>•</span> 001</div>
    </div>
    <div class="wmx-glass">
      <span>YOUR WORLD OF ENTERTAINMENT</span>
      <b>Movies. Series. Classics.</b>
      <small>Explore English, Pakistani, Indian, Punjabi, Korean and Turkish entertainment through authorized sources.</small>
    </div>
  </div>
</section>




<section class="wmx-search-wrap">
  <div class="wmx-search">
    <span>⌕</span>
    <input id="wmxSearch" type="search" placeholder="Search movies, genres, languages...">
  </div>
</section>

<section id="categories" class="wmx-section">
  <div class="wmx-title">
    <div>
      <small>EXPLORE</small>
      <h2>Browse by Category</h2>
    </div>
    <a href="/movies">View all →</a>
  </div>

  <div class="wmx-categories">
    ${categories.map(c => `<button class="wmx-cat" data-cat="${safe(c).toLowerCase()}">${safe(c)}</button>`).join("")}
  </div>
</section>

<section class="wmx-miko-inline" aria-label="Meet Miko">
  <div class="wmx-miko-inline-avatar" aria-hidden="true">🐤</div>
  <div class="wmx-miko-inline-copy">
    <h2>Meet Miko</h2>
    <p>Your friendly movie companion helps you discover something worth watching.</p>
  </div>
  <a href="/movies" class="wmx-miko-inline-link">Discover movies →</a>
</section>

${row("Trending Now","Popular titles worth discovering",trending,"trending","🔥")}
${row("Featured Collection","Hand-picked titles from the World Movie App library",featured,"featured","✦")}
${row("Latest Additions","Recently added to the collection",latest,"latest","◉")}
${row("Coming Soon","Titles marked for future release",comingSoon,"coming-soon","◷")}

<section class="wmx-section">
  <div class="wmx-title">
    <div>
      <small>GENRES</small>
      <h2>Find Your Mood</h2>
    </div>
  </div>
  <div class="wmx-genres">
    ${genres.map(g => `<a href="/movies?genre=${encodeURIComponent(g)}">${safe(g)}</a>`).join("")}
  </div>
</section>

<section id="membership" class="wmx-membership">
  <div>
    <small>WORLD MOVIE APP PREMIUM</small>
    <h2>More entertainment.<br>One simple membership.</h2>
    <p>Premium access is being prepared. Payment integration will become available after gateway approval.</p>
  </div>
  <div class="wmx-plans">
    <div><b>MONTHLY</b><strong>PKR 1,000</strong><span>per month</span></div>
    <div><b>YEARLY</b><strong>PKR 10,000</strong><span>per year</span></div>
  </div>
</section>

<footer class="wmx-footer">
  <b>WORLD MOVIE APP</b>
  <span>Authorized entertainment discovery platform</span>
</footer>

</div>

<style>
.wmx-home{background:#050609;color:#fff;min-height:100vh;font-family:Arial,sans-serif}
.wmx-top{height:74px;padding:0 6%;display:flex;align-items:center;justify-content:space-between;background:#050609;border-bottom:1px solid #171a21;position:sticky;top:0;z-index:20}
.wmx-brand{font-size:22px;font-weight:900;letter-spacing:-1px;color:#fff;text-decoration:none}
.wmx-brand span{color:#9655f5}
.wmx-top nav{display:flex;gap:28px}
.wmx-top nav a{color:#bbb;text-decoration:none;font-size:14px}
.wmx-top nav a:hover{color:#fff}
.wmx-hero{min-height:650px;position:relative;overflow:hidden;display:flex;align-items:center;padding:0 7%;background:linear-gradient(90deg,#050609 0%,#080b12 48%,#101522 100%)}
.wmx-hero-bg{position:absolute;inset:0;background:radial-gradient(circle at 75% 45%,rgba(150,85,245,.3),transparent 27%),radial-gradient(circle at 90% 80%,rgba(55,95,190,.3),transparent 30%);pointer-events:none}
.wmx-hero-content{position:relative;z-index:2;max-width:720px}
.wmx-kicker{color:#9655f5;font-size:13px;font-weight:bold;letter-spacing:5px;margin-bottom:20px}
.wmx-hero h1{font-size:clamp(52px,7vw,92px);line-height:.9;letter-spacing:-5px;margin:0;font-weight:900}
.wmx-hero h1 strong{color:#9655f5}
.wmx-hero p{color:#aeb4bf;font-size:17px;line-height:1.7;max-width:600px;margin:28px 0}
.wmx-actions{display:flex;gap:12px;flex-wrap:wrap}
.wmx-primary,.wmx-secondary{padding:15px 24px;border-radius:5px;text-decoration:none;font-weight:bold}
.wmx-primary{background:#9655f5;color:#fff}
.wmx-secondary{background:#fff;color:#111}
.wmx-hero-side{position:absolute;right:7%;bottom:55px;width:310px;z-index:2}
.wmx-glass{padding:25px;border:1px solid #303746;border-radius:14px;background:rgba(10,14,23,.72);backdrop-filter:blur(15px);box-shadow:0 25px 70px #000}
.wmx-glass span,.wmx-membership small,.wmx-title small{font-size:11px;color:#9655f5;letter-spacing:3px;font-weight:bold}
.wmx-glass b{display:block;font-size:20px;margin:10px 0}
.wmx-glass small{color:#9ca4b2;line-height:1.6}
.wmx-search-wrap{padding:34px 7%;background:#080a0f}
.wmx-search{max-width:850px;margin:auto;background:#11151d;border:1px solid #252b36;border-radius:6px;display:flex;align-items:center;padding:0 20px}
.wmx-search span{font-size:28px;color:#777}
.wmx-search input{width:100%;padding:19px;border:0;outline:0;background:transparent;color:#fff;font-size:16px}
.wmx-section{padding:48px 7% 15px}
.movie-row{display:grid;grid-template-columns:repeat(6,160px);gap:22px;align-items:start}
.movie-card{width:160px;min-width:160px}
.movie-card .poster{width:160px;height:240px;overflow:hidden;border-radius:10px;position:relative}
.movie-card .poster img{width:100%;height:100%;object-fit:cover;display:block}
.movie-info{width:160px}
.movie-info h3{font-size:15px;line-height:1.3;margin:8px 0 4px}
.movie-info p{font-size:12px;line-height:1.35;margin:0}
.wmx-title{display:flex;align-items:end;justify-content:space-between;margin-bottom:22px}
.wmx-title h2{font-size:30px;margin:7px 0 0}
.wmx-title a{color:#9655f5;text-decoration:none}
.wmx-categories,.wmx-genres{display:flex;gap:10px;flex-wrap:wrap}
.wmx-cat,.wmx-genres a{background:#11151d;border:1px solid #252b36;color:#c5cad3;padding:11px 17px;border-radius:4px;text-decoration:none;cursor:pointer}
.wmx-cat:hover,.wmx-genres a:hover{background:#9655f5;color:#fff;border-color:#9655f5}
.wmx-membership{margin:70px 7%;padding:55px;display:flex;justify-content:space-between;gap:35px;align-items:center;border:1px solid #292f3b;border-radius:18px;background:linear-gradient(120deg,#11151e,#090b10)}
.wmx-membership h2{font-size:38px;margin:12px 0}
.wmx-membership p{color:#9ea5b1;max-width:600px;line-height:1.6}
.wmx-plans{display:flex;gap:12px}
.wmx-plans div{min-width:150px;padding:22px;background:#080a0e;border:1px solid #252b36;border-radius:10px}
.wmx-plans b,.wmx-plans span{display:block;font-size:11px;color:#9299a5}
.wmx-plans strong{display:block;font-size:22px;margin:10px 0}
.wmx-footer{padding:45px 7%;border-top:1px solid #171a21;display:flex;justify-content:space-between;color:#777}
@media(max-width:800px){
 .wmx-top nav{display:none}.wmx-hero{min-height:600px;padding:70px 6%}
 .wmx-hero-side{display:none}.wmx-hero h1{font-size:56px}
 .wmx-membership{margin:45px 6%;padding:30px;display:block}
 .wmx-plans{margin-top:25px;flex-wrap:wrap}.wmx-footer{display:block}
}

.wmx-miko-panel{width:86%;max-width:1320px;margin:28px auto 16px;padding:24px 28px;display:flex;align-items:center;gap:20px;border:1px solid rgba(177,128,255,.24);border-radius:20px;background:linear-gradient(105deg,rgba(42,25,67,.88),rgba(17,13,29,.96));box-shadow:0 18px 55px rgba(0,0,0,.18)}
.wmx-miko-avatar{width:66px;height:66px;flex:0 0 66px;display:grid;place-items:center;border-radius:20px;background:rgba(150,85,245,.16);border:1px solid rgba(188,147,255,.3);font-size:35px}
.wmx-miko-copy{min-width:0;flex:1}.wmx-miko-kicker{font-size:10px;font-weight:800;letter-spacing:2.5px;color:#bc93ff}.wmx-miko-copy h2{margin:6px 0;font-size:24px;color:#f8f5ff}.wmx-miko-copy p{margin:0;color:#b5aec7;font-size:14px;line-height:1.65}.wmx-miko-link{display:inline-flex;align-items:center;gap:10px;white-space:nowrap;padding:12px 17px;border-radius:11px;background:#9655f5;color:#fff;text-decoration:none;font-size:13px;font-weight:700}.wmx-miko-link:hover{background:#a875ff}
@media(max-width:650px){.wmx-miko-panel{width:calc(100% - 32px);padding:18px;gap:13px;flex-wrap:wrap}.wmx-miko-avatar{width:52px;height:52px;flex-basis:52px;border-radius:16px;font-size:28px}.wmx-miko-copy{flex:1 1 calc(100% - 70px)}.wmx-miko-copy h2{font-size:21px}.wmx-miko-copy p{font-size:13px}.wmx-miko-link{margin-left:65px}}

/* MINIMAL INLINE HOMEPAGE LAYOUT */
.wmx-miko-inline{width:86%;max-width:1320px;margin:8px auto 28px;padding:16px 10px;display:flex;align-items:center;gap:15px;border-top:1px solid rgba(177,128,255,.22);border-bottom:1px solid rgba(177,128,255,.22);background:transparent}
.wmx-miko-inline-avatar{width:43px;height:43px;flex:0 0 43px;display:grid;place-items:center;border-radius:50%;background:rgba(150,85,245,.16);border:1px solid rgba(188,147,255,.35);font-size:25px}
.wmx-miko-inline-copy{flex:1;min-width:0}
.wmx-miko-inline-copy h2{font-size:17px;margin:0 0 4px;color:var(--wmx-text,#f8f5ff)}
.wmx-miko-inline-copy p{font-size:12px;line-height:1.6;margin:0;color:var(--wmx-muted,#b5aec7)}
.wmx-miko-inline-link{font-size:12px;font-weight:700;color:var(--wmx-purple-light,#bc93ff);text-decoration:none;white-space:nowrap}
.wmx-miko-inline-link:hover{text-decoration:underline}
.wmx-home .wmx-section{scroll-margin-top:95px}
.wmx-home .wmx-categories{display:flex;flex-wrap:wrap;gap:9px}
.wmx-home .wmx-cat{border-radius:999px}
.wmx-home .movie-card{transition:transform .2s ease,box-shadow .2s ease}
.wmx-home .movie-card:hover{transform:translateY(-4px);box-shadow:0 12px 28px rgba(0,0,0,.28)}
.wmx-home .movie-card .poster img{transition:transform .25s ease}
.wmx-home .movie-card:hover .poster img{transform:scale(1.035)}
@media(max-width:650px){
.wmx-miko-inline{width:calc(100% - 32px);padding:15px 0;gap:11px;flex-wrap:wrap}
.wmx-miko-inline-avatar{width:38px;height:38px;flex-basis:38px;font-size:22px}
.wmx-miko-inline-copy{flex:1 1 calc(100% - 55px)}
.wmx-miko-inline-copy h2{font-size:16px}
.wmx-miko-inline-copy p{font-size:12px}
.wmx-miko-inline-link{margin-left:49px}
}
</style>
<style>
.wmx-view-switch{
  display:flex;
  gap:4px;
  margin-left:18px;
  padding:4px;
  background:#11151d;
  border:1px solid #252b36;
  border-radius:8px;
}
.wmx-view-switch button{
  border:0;
  background:transparent;
  color:#9299a5;
  padding:7px 10px;
  border-radius:5px;
  cursor:pointer;
  font-size:12px;
}
.wmx-view-switch button.active{
  background:#9655f5;
  color:#fff;
}
body.wmx-mobile-mode{
  overflow-x:hidden;
}
body.wmx-mobile-mode .wmx-home{
  width:100vw;
  max-width:none;
  margin:0;
  min-height:100vh;
  box-shadow:0 0 50px rgba(0,0,0,.8);
}
body.wmx-mobile-mode .wmx-top{
  height:62px;
  padding:0 14px;
}
body.wmx-mobile-mode .wmx-brand{
  font-size:22px !important;
  line-height:1 !important;
  letter-spacing:-2px !important;
}
body.wmx-mobile-mode .wmx-top nav{
  display:none;
}
body.wmx-mobile-mode .wmx-view-switch{
  margin-left:auto;
}
body.wmx-mobile-mode .wmx-view-switch button{
  padding:7px 9px !important;
  font-size:12px !important;
}
body.wmx-mobile-mode .wmx-hero{
  min-height:520px;
  padding:55px 22px;
}
body.wmx-mobile-mode .wmx-hero h1{
  font-size:38px !important;
  letter-spacing:-2px !important;
}
body.wmx-mobile-mode .wmx-hero p{
  font-size:15px;
}
body.wmx-mobile-mode .wmx-hero-side{
  display:none;
}
body.wmx-mobile-mode .wmx-search-wrap{
  padding:22px 16px;
}
body.wmx-mobile-mode .wmx-section{
  padding:32px 16px 10px;
}
body.wmx-mobile-mode .wmx-title h2{
  font-size:22px !important;
}
body.wmx-mobile-mode .movie-row{
  display:grid !important;
  grid-template-columns:repeat(6,minmax(0,1fr)) !important;
  gap:8px !important;
  width:100% !important;
  overflow:visible !important;
}

body.wmx-mobile-mode .movie-card{
  flex:unset !important;
  width:100% !important;
  min-width:0 !important;
  max-width:none !important;
}

body.wmx-mobile-mode .movie-card .poster{
  width:100% !important;
  height:auto !important;
  aspect-ratio:2/3 !important;
  min-height:0 !important;
  max-height:none !important;
  overflow:hidden !important;
}

body.wmx-mobile-mode .movie-card .poster img{
  width:100% !important;
  height:100% !important;
  object-fit:cover !important;
  display:block !important;
}

body.wmx-mobile-mode .movie-info{
  padding:3px 0 !important;
}

body.wmx-mobile-mode .movie-info h3{
  font-size:12px !important;
  line-height:1.15 !important;
  margin:3px 0 0 !important;
  white-space:nowrap !important;
  overflow:hidden !important;
  text-overflow:ellipsis !important;
}

body.wmx-mobile-mode .movie-info .meta-line,
body.wmx-mobile-mode .movie-info .genre,
body.wmx-mobile-mode .movie-info .language{
  font-size:11px !important;
  line-height:1.15 !important;
  white-space:nowrap !important;
  overflow:hidden !important;
  text-overflow:ellipsis !important;
}

body.wmx-mobile-mode .movie-info .buttons{
  display:none !important;
}
body.wmx-mobile-mode .wmx-membership{
  margin:35px 16px;
  padding:25px 20px;
}
body.wmx-mobile-mode .wmx-membership h2{
  font-size:24px !important;
}
body.wmx-mobile-mode .wmx-plans{
  display:grid;
  grid-template-columns:1fr;
}
body.wmx-mobile-mode .wmx-footer{
  padding:35px 20px;
  display:block;
}

  padding:0 18px;
}
body.wmx-mobile-mode .wmx-top nav{
  display:none;
}
body.wmx-mobile-mode .wmx-hero{
  min-height:560px;
  padding:70px 22px;
}
body.wmx-mobile-mode .wmx-hero h1{
  font-size:38px !important;
  letter-spacing:-2px !important;
}
body.wmx-mobile-mode .wmx-hero-side{
  display:none;
}
body.wmx-mobile-mode .wmx-section{
  padding-left:22px;
  padding-right:22px;
}
body.wmx-mobile-mode .wmx-membership{
  margin:45px 22px;
  padding:30px;
  display:block;
}
body.wmx-mobile-mode .wmx-plans{
  margin-top:25px;
  flex-wrap:wrap;
}
@media(max-width:800px){
  .wmx-view-switch{margin-left:8px}
}

/* WORLD_MOVIE_APP_MODERN_PURPLE_THEME_V2 */
:root {
  --wmx-bg: #090711;
  --wmx-surface: #131020;
  --wmx-surface-2: #1b1630;
  --wmx-purple: #9655f5;
  --wmx-purple-light: #bc93ff;
  --wmx-text: #f8f5ff;
  --wmx-muted: #b5aec7;
  --wmx-line: rgba(177, 128, 255, .2);
}
html {
  scroll-behavior: smooth;
  scroll-padding-top: 90px;
}
body {
  background: var(--wmx-bg);
  color: var(--wmx-text);
}
.wmx-home {
  min-height: 100vh;
  overflow: clip;
  background:
    radial-gradient(ellipse at 85% 0%, rgba(115, 55, 190, .11), transparent 35%),
    var(--wmx-bg);
  color: var(--wmx-text);
  font-family: Inter, "Segoe UI", Arial, sans-serif;
}
.wmx-top {
  min-height: 76px;
  height: auto;
  padding: 14px clamp(18px, 5vw, 76px);
  gap: 18px;
  background: rgba(9, 7, 17, .94);
  border-bottom: 1px solid var(--wmx-line);
  backdrop-filter: blur(18px);
}
.wmx-brand {
  flex-shrink: 0;
  font-size: clamp(18px, 2vw, 24px);
  letter-spacing: -.7px;
  color: var(--wmx-text);
}
.wmx-brand span {
  color: var(--wmx-purple-light);
}
.wmx-top nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: clamp(10px, 2vw, 26px);
}
.wmx-top nav a {
  color: #d0c9df;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}
.wmx-top nav a:hover {
  color: var(--wmx-purple-light);
}
.wmx-view-switch {
  background: var(--wmx-surface);
  border-color: var(--wmx-line);
}
.wmx-view-switch button.active {
  background: var(--wmx-purple);
  color: white;
}
.wmx-hero {
  position: relative;
  min-height: clamp(440px, 57vw, 650px);
  padding: clamp(54px, 8vw, 100px) clamp(22px, 7vw, 100px);
  align-items: center;
  background:
    radial-gradient(ellipse at 78% 35%, rgba(134, 70, 230, .34), transparent 32%),
    radial-gradient(ellipse at 95% 90%, rgba(70, 34, 117, .3), transparent 35%),
    linear-gradient(115deg, #0b0913 10%, #151025 58%, #24143b 100%);
}
.wmx-hero-bg {
  background:
    linear-gradient(90deg, #090711 0%, rgba(9, 7, 17, .88) 35%, rgba(9, 7, 17, .16) 100%),
    radial-gradient(ellipse at 78% 50%, rgba(169, 112, 255, .2), transparent 38%);
}
.wmx-hero-content {
  max-width: 720px;
}
.wmx-kicker {
  color: var(--wmx-purple-light);
  font-size: 12px;
  letter-spacing: 4px;
  margin-bottom: 22px;
}
.wmx-hero h1 {
  max-width: 780px;
  font-size: clamp(42px, 7.2vw, 88px);
  line-height: .98;
  letter-spacing: clamp(-4px, -.35vw, -1px);
  overflow-wrap: anywhere;
}
.wmx-hero h1 strong {
  color: var(--wmx-purple-light);
  text-shadow: 0 0 38px rgba(150, 85, 245, .24);
}
.wmx-hero p {
  max-width: 560px;
  color: #c4bdd2;
  font-size: clamp(14px, 1.4vw, 17px);
  line-height: 1.75;
}
.wmx-actions {
  gap: 12px;
}
.wmx-primary, .wmx-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 13px 21px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 14px;
  transition: .2s ease;
}
.wmx-primary {
  color: white;
  background: linear-gradient(135deg, #a56aff, #7637d4);
  box-shadow: 0 8px 28px rgba(123, 61, 217, .22);
}
.wmx-primary:hover {
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(123, 61, 217, .35);
}
.wmx-secondary {
  color: #f1eaff;
  background: rgba(255,255,255,.055);
  border-color: rgba(208, 184, 255, .28);
}
.wmx-secondary:hover {
  color: white;
  background: rgba(150, 85, 245, .16);
}
.wmx-hero-side {
  right: clamp(20px, 6vw, 82px);
  bottom: 42px;
  width: min(310px, 28%);
}
.wmx-glass {
  background: rgba(15, 11, 28, .78);
  border: 1px solid rgba(194, 160, 255, .25);
  border-radius: 15px;
  box-shadow: 0 20px 65px rgba(0,0,0,.28);
}
.wmx-glass span, .wmx-membership small, .wmx-title small {
  color: var(--wmx-purple-light);
}
.wmx-search-wrap {
  padding: 28px clamp(18px, 7vw, 100px);
  background: linear-gradient(180deg, #100c1b, #0b0912);
}
.wmx-search {
  max-width: 850px;
  border: 1px solid var(--wmx-line);
  border-radius: 12px;
  background: #151020;
  transition: border-color .2s, box-shadow .2s;
}
.wmx-search:focus-within {
  border-color: var(--wmx-purple);
  box-shadow: 0 0 0 3px rgba(150, 85, 245, .12);
}
.wmx-search span {
  color: var(--wmx-purple-light);
}
.wmx-search input {
  min-width: 0;
  color: white;
}
.wmx-search input::placeholder {
  color: #8e859f;
}
.wmx-section {
  padding: 38px clamp(18px, 5vw, 76px) 12px;
  margin: 0 auto;
  max-width: 1800px;
}
.wmx-title {
  gap: 16px;
  margin-bottom: 20px;
}
.wmx-title h2 {
  color: #f8f5ff;
  font-size: clamp(22px, 2.4vw, 30px);
  letter-spacing: -.5px;
}
.wmx-title a {
  flex-shrink: 0;
  color: var(--wmx-purple-light);
}
.wmx-title a:hover {
  color: white;
}
.wmx-categories, .wmx-genres {
  gap: 10px;
}
.wmx-cat, .wmx-genres a {
  padding: 10px 15px;
  border: 1px solid var(--wmx-line);
  border-radius: 999px;
  background: #151020;
  color: #d6cfe4;
  transition: .2s ease;
}
.wmx-cat:hover, .wmx-genres a:hover {
  background: rgba(150, 85, 245, .19);
  border-color: var(--wmx-purple);
  color: white;
}
.content-section {
  padding: 34px clamp(18px, 5vw, 76px) 12px;
  margin: 0 auto;
  max-width: 1800px;
}
.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.section-heading h2 {
  margin: 5px 0 8px;
  color: var(--wmx-text);
  font-size: clamp(22px, 2.4vw, 30px);
  letter-spacing: -.5px;
}
.section-heading p {
  margin: 0;
  color: var(--wmx-muted);
  font-size: 13px;
  line-height: 1.5;
}
.section-heading .eyebrow {
  color: var(--wmx-purple-light);
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
}
.section-count {
  flex-shrink: 0;
  color: #b4a4d0;
  font-size: 12px;
}
.movie-row {
  display: flex;
  align-items: stretch;
  gap: 17px;
  width: 100%;
  padding: 2px 2px 18px;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
  scrollbar-color: #654096 #171122;
}
.movie-row::-webkit-scrollbar {
  height: 6px;
}
.movie-row::-webkit-scrollbar-track {
  background: #171122;
  border-radius: 10px;
}
.movie-row::-webkit-scrollbar-thumb {
  background: #654096;
  border-radius: 10px;
}
.movie-card {
  flex: 0 0 clamp(145px, 15vw, 205px);
  width: clamp(145px, 15vw, 205px);
  min-width: 0;
  overflow: hidden;
  scroll-snap-align: start;
  border: 1px solid rgba(178, 134, 255, .15);
  border-radius: 12px;
  background: linear-gradient(180deg, #171225, #100d19);
  transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease;
  cursor: pointer;
}
.movie-card:hover {
  transform: translateY(-5px);
  border-color: rgba(184, 142, 255, .65);
  box-shadow: 0 14px 34px rgba(0,0,0,.32);
}
.movie-card .poster {
  position: relative;
  width: 100%;
  height: auto;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  background: #211830;
}
.movie-card .poster img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .35s ease;
}
.movie-card:hover .poster img {
  transform: scale(1.045);
}
.movie-card .poster-top {
  display: flex;
  justify-content: space-between;
  gap: 5px;
  padding: 8px;
  font-size: 10px;
}
.type-badge, .rating-badge {
  padding: 5px 7px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 6px;
  background: rgba(12,8,20,.82);
  color: #f5efff;
  backdrop-filter: blur(8px);
}
.movie-card .poster-overlay {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 12px;
  background: linear-gradient(transparent, rgba(10,6,18,.92));
}
.movie-card .poster-overlay a {
  padding: 8px 11px;
  border: 1px solid rgba(202,174,255,.5);
  border-radius: 7px;
  background: rgba(118,55,212,.88);
  color: white;
  text-decoration: none;
  font-size: 12px;
  font-weight: 700;
}
.movie-info {
  min-width: 0;
  padding: 11px;
}
.movie-info .meta-line {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  color: #a99fba;
  font-size: 10px;
  line-height: 1.4;
}
.movie-info .category {
  overflow: hidden;
  text-overflow: ellipsis;
}
.movie-info h3 {
  margin: 7px 0 5px;
  color: #f8f5ff;
  font-size: 13px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.movie-info .genre, .movie-info .language {
  color: #aaa0bb;
  font-size: 11px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.movie-info .buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 10px;
}
.movie-info .buttons a {
  flex: 1;
  min-width: 0;
  padding: 8px 6px;
  border: 1px solid var(--wmx-line);
  border-radius: 7px;
  text-align: center;
  text-decoration: none;
  color: #e9dfff;
  font-size: 11px;
}
.movie-info .buttons a.details {
  background: rgba(150,85,245,.16);
  border-color: rgba(150,85,245,.38);
}
.movie-info .buttons a:hover {
  background: var(--wmx-purple);
  color: white;
}
.no-poster {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg,#211830,#100d19);
  font-size: 34px;
}
.wmx-genres a {
  display: inline-flex;
}
.wmx-membership {
  margin: 64px clamp(18px, 5vw, 76px);
  padding: clamp(24px, 4vw, 54px);
  gap: 30px;
  border: 1px solid var(--wmx-line);
  border-radius: 20px;
  background:
    radial-gradient(ellipse at 100% 0%, rgba(150,85,245,.2), transparent 42%),
    linear-gradient(120deg, #171126, #0e0b16);
  box-shadow: 0 20px 70px rgba(0,0,0,.18);
}
.wmx-membership h2 {
  color: var(--wmx-text);
  font-size: clamp(25px, 3.2vw, 39px);
  line-height: 1.15;
  letter-spacing: -.8px;
}
.wmx-membership p {
  color: var(--wmx-muted);
  line-height: 1.75;
}
.wmx-plans {
  gap: 12px;
}
.wmx-plans div {
  min-width: 150px;
  padding: 20px;
  border: 1px solid var(--wmx-line);
  border-radius: 12px;
  background: rgba(10,7,17,.68);
}
.wmx-plans b {
  color: var(--wmx-purple-light);
  letter-spacing: 1px;
}
.wmx-plans strong {
  color: white;
  font-size: clamp(19px, 2vw, 24px);
}
.wmx-plans span {
  color: var(--wmx-muted);
}
.wmx-footer {
  gap: 12px;
  padding: 32px clamp(18px, 5vw, 76px);
  border-top: 1px solid var(--wmx-line);
  color: #a59bb7;
}
.wmx-footer b {
  color: #eee6ff;
}
.wmx-mobile-mode .wmx-brand {
  font-size: 21px !important;
  letter-spacing: -.5px !important;
}
.wmx-mobile-mode .wmx-view-switch button {
  font-size: 12px !important;
}
.wmx-mobile-mode .wmx-hero h1 {
  font-size: clamp(38px, 10vw, 52px) !important;
  line-height: 1 !important;
  letter-spacing: -2px !important;
}
.wmx-mobile-mode .movie-row {
  display: flex !important;
  overflow-x: auto !important;
  gap: 11px !important;
  padding-bottom: 14px !important;
}
.wmx-mobile-mode .movie-card {
  flex: 0 0 132px !important;
  width: 132px !important;
  max-width: 132px !important;
}
.wmx-mobile-mode .movie-card .poster {
  width: 100% !important;
  height: auto !important;
  aspect-ratio: 2 / 3 !important;
}
.wmx-mobile-mode .movie-info {
  padding: 7px !important;
}
.wmx-mobile-mode .movie-info h3 {
  font-size: 12px !important;
  line-height: 1.3 !important;
}
.wmx-mobile-mode .movie-info .meta-line {
  font-size: 9px !important;
}
.wmx-mobile-mode .movie-info .genre,
.wmx-mobile-mode .movie-info .language {
  font-size: 10px !important;
}
.wmx-mobile-mode .movie-info .buttons {
  display: flex !important;
  flex-direction: column;
  gap: 5px;
}
@media (min-width: 1100px) {
  .wmx-hero {
    min-height: 620px;
  }
}
@media (max-width: 800px) {
  .wmx-top {
    position: sticky;
    padding: 13px 16px;
    flex-wrap: wrap;
    gap: 10px;
  }
  .wmx-top > div {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
  }
  .wmx-top nav {
    display: flex !important;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 12px 18px;
  }
  .wmx-top nav a {
    font-size: 12px;
  }
  .wmx-view-switch {
    margin-left: 0;
  }
  .wmx-hero {
    min-height: 490px;
    padding: 58px 24px;
  }
  .wmx-hero-side {
    display: none;
  }
  .wmx-hero h1 {
    font-size: clamp(42px, 8vw, 64px);
    letter-spacing: -2px;
  }
  .wmx-section, .content-section {
    padding: 30px 20px 8px;
  }
  .wmx-membership {
    margin: 42px 20px;
    padding: 26px;
    display: block;
  }
  .wmx-plans {
    margin-top: 22px;
    flex-wrap: wrap;
  }
}
@media (max-width: 480px) {
  .wmx-top {
    align-items: flex-start;
  }
  .wmx-brand {
    font-size: 20px;
  }
  .wmx-top nav {
    gap: 10px 14px;
  }
  .wmx-hero {
    min-height: 450px;
    padding: 48px 19px;
  }
  .wmx-hero h1 {
    font-size: clamp(37px, 10vw, 48px);
    letter-spacing: -1.5px;
  }
  .wmx-hero p {
    font-size: 14px;
  }
  .wmx-primary, .wmx-secondary {
    padding: 12px 14px;
    font-size: 12px;
  }
  .wmx-search-wrap {
    padding: 22px 16px;
  }
  .wmx-section, .content-section {
    padding: 27px 15px 6px;
  }
  .section-heading {
    align-items: flex-start;
  }
  .section-heading p {
    max-width: 260px;
  }
  .section-count {
    font-size: 10px;
  }
  .wmx-title h2, .section-heading h2 {
    font-size: 22px;
  }
  .wmx-membership {
    margin: 34px 15px;
    padding: 22px 18px;
  }
  .wmx-plans {
    display: grid;
    grid-template-columns: 1fr;
  }
  .wmx-footer {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 28px 18px;
  }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: .01ms !important;
    animation-duration: .01ms !important;
  }
}





/* WORLD_MOVIE_APP_HOME_THEME_FINAL_V1 */
.wmx-home .wmx-brand span,
.wmx-home .wmx-kicker,
.wmx-home .wmx-hero h1 strong,
.wmx-home .wmx-glass span,
.wmx-home .wmx-membership small,
.wmx-home .wmx-title small,
.wmx-home .wmx-title a {
  color: #bc93ff !important;
}
.wmx-home .wmx-primary,
.wmx-home .wmx-view-switch button.active {
  background: #9655f5 !important;
  color: #fff !important;
}
.wmx-home .wmx-cat:hover,
.wmx-home .wmx-genres a:hover {
  background: #9655f5 !important;
  border-color: #9655f5 !important;
}
.wmx-home .wmx-hero-bg {
  background:
    radial-gradient(ellipse at 78% 30%, rgba(150,85,245,.22), transparent 35%),
    radial-gradient(ellipse at 90% 90%, rgba(80,43,150,.2), transparent 35%) !important;
}

/* WORLD MOVIE APP FULL LAYOUT REDESIGN */
.wmx-home {
  --wmx-bg:#090711;
  --wmx-surface:#151124;
  --wmx-purple:#9655f5;
  --wmx-purple-light:#bc93ff;
  background:var(--wmx-bg)!important;
  color:#f8f5ff;
  font-family:Arial,sans-serif;
}
.wmx-top {
  position:sticky;top:0;z-index:100;
  height:76px;padding:0 6%;
  background:rgba(9,7,17,.92)!important;
  backdrop-filter:blur(18px);
  border-bottom:1px solid #29203d;
}
.wmx-brand span,.wmx-kicker,.wmx-hero h1 strong,
.wmx-glass span,.wmx-membership small,.wmx-title small {
  color:var(--wmx-purple-light)!important;
}
.wmx-top nav a {transition:color .2s}
.wmx-top nav a:hover,.wmx-title a {color:var(--wmx-purple-light)!important}
.wmx-hero {
  display:grid!important;
  grid-template-columns:minmax(0,1.2fr) minmax(250px,.8fr);
  align-items:center;gap:35px;
  min-height:570px;padding:65px 7%;
  background:
    radial-gradient(ellipse at 78% 40%,rgba(126,65,220,.24),transparent 42%),
    linear-gradient(120deg,#090711,#151027 70%,#0b0914)!important;
}
.wmx-hero-bg {
  background:
    radial-gradient(ellipse at 78% 30%,rgba(150,85,245,.22),transparent 35%),
    radial-gradient(ellipse at 90% 90%,rgba(80,43,150,.2),transparent 35%)!important;
}
.wmx-hero-content {max-width:680px}
.wmx-kicker {letter-spacing:4px}
.wmx-hero h1 {
  font-size:clamp(44px,6vw,82px);
  line-height:.98;letter-spacing:-3px;
}
.wmx-hero p {color:#c0b9d0;max-width:520px}
.wmx-hero-side {
  position:relative!important;right:auto!important;bottom:auto!important;
  width:auto!important;align-self:center;
}
.wmx-glass {
  min-height:230px;padding:32px;
  display:flex;flex-direction:column;justify-content:flex-end;
  border:1px solid #44305f!important;border-radius:22px!important;
  background:
    radial-gradient(ellipse at 80% 20%,rgba(150,85,245,.32),transparent 50%),
    linear-gradient(145deg,#211733,#100d1b 75%)!important;
  box-shadow:0 24px 70px rgba(0,0,0,.4)!important;
}
.wmx-glass b {font-size:25px}
.wmx-search-wrap {
  padding:28px 7%!important;background:#0c0915!important;
}
.wmx-search {
  max-width:900px;border-radius:15px!important;
  background:#171226!important;border:1px solid #38274f!important;
}
.wmx-search input {padding:20px}
.wmx-categories,.wmx-genres {gap:12px}
.wmx-cat,.wmx-genres a {
  border-radius:999px!important;
  background:#171226!important;border:1px solid #342447!important;
  transition:all .2s;
}
.wmx-cat:hover,.wmx-genres a:hover {
  background:var(--wmx-purple)!important;
  border-color:var(--wmx-purple)!important;
}
.wmx-section {padding:36px 7% 18px!important}
.wmx-title {margin-bottom:24px}
.wmx-title h2 {letter-spacing:-.6px}
.movie-row {
  display:flex!important;gap:18px!important;
  overflow-x:auto!important;overflow-y:hidden;
  padding:4px 2px 22px;scrollbar-width:thin;
  scrollbar-color:#68429c #171124;
}
.movie-card {
  flex:0 0 160px;width:160px!important;min-width:160px!important;
  border-radius:12px;transition:transform .22s;
}
.movie-card:hover {transform:translateY(-5px)}
.movie-card .poster {
  width:100%!important;height:240px!important;
  border-radius:12px!important;background:#191326;
  border:1px solid #2b203c;
}
.movie-card .poster img {object-fit:cover}
.movie-card .poster-overlay {
  background:linear-gradient(transparent,rgba(10,6,18,.95));
}
.movie-card .poster-overlay a {
  background:var(--wmx-purple)!important;color:white!important;
  border-radius:8px;
}
.movie-info {width:100%!important}
.movie-info h3 {color:#f8f5ff}
.movie-info .category,.movie-info .genre {color:#bca0ef}
.wmx-membership {
  border:1px solid #3a2854!important;border-radius:22px!important;
  background:radial-gradient(ellipse at 100% 0%,#2b1945,#100d19 65%)!important;
}
.wmx-plans div {
  border-color:#3b2a52!important;border-radius:14px!important;
  background:#120e1e!important;
}
.wmx-plans strong {color:#d6bdff}
.wmx-footer {border-color:#2b203c!important}
@media(max-width:800px) {
  .wmx-top {padding:0 5%;height:66px}
  .wmx-hero {
    display:block!importan
/* WORLD MOVIE APP CINEMATIC STRUCTURE REDESIGN V1 */
.wmx-home {
  overflow: hidden;
  background:
    radial-gradient(ellipse at 78% 13%, rgba(112,63,190,.18), transparent 34%),
    #08070d !important;
}
.wmx-home .wmx-hero {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(0,1.08fr) minmax(280px,.92fr);
  align-items: center;
  gap: clamp(22px,4vw,64px);
  min-height: 490px;
  padding: clamp(32px,6vw,78px) clamp(18px,5vw,70px);
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 26px;
  background:
    radial-gradient(ellipse at 76% 46%, rgba(117,65,196,.24), transparent 38%),
    linear-gradient(120deg,#100d19 0%,#0a0911 65%,#151020 100%);
  overflow: hidden;
}
.wmx-home .wmx-hero-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: .42;
  background: radial-gradient(ellipse at 20% 15%,rgba(142,91,235,.18),transparent 50%);
}
.wmx-home .wmx-hero-content { position:relative; z-index:2; max-width:650px; }
.wmx-home .wmx-hero-content h1 {
  font-size:clamp(2.6rem,6vw,5.4rem);
  line-height:.98;
  letter-spacing:-.055em;
  margin:18px 0;
  text-wrap:balance;
}
.wmx-home .wmx-hero-content h1 strong {
  color:#b18aff;
  text-shadow:0 0 36px rgba(150,85,245,.24);
}
.wmx-home .wmx-hero-content p {
  max-width:510px;
  color:#c2bdcf;
  font-size:clamp(.95rem,1.4vw,1.1rem);
  line-height:1.8;
}
.wmx-home .wmx-actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:25px; }
.wmx-home .wmx-primary,
.wmx-home .wmx-secondary {
  display:inline-flex;
  align-items:center;
  justify-content:center;
  min-height:46px;
  padding:12px 20px;
  border-radius:12px;
  text-decoration:none;
  font-weight:750;
  transition:transform .2s ease,background .2s ease;
}
.wmx-home .wmx-primary {
  color:#fff !important;
  background:linear-gradient(135deg,#9d63f5,#7140ce) !important;
  box-shadow:0 9px 28px rgba(122,67,214,.25);
}
.wmx-home .wmx-secondary {
  color:#f4efff !important;
  border:1px solid rgba(255,255,255,.17);
  background:rgba(255,255,255,.045);
}
.wmx-home .wmx-primary:hover,
.wmx-home .wmx-secondary:hover { transform:translateY(-2px); }
.wmx-home .wmx-hero-side {
  position:relative;
  z-index:1;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:18px;
  min-width:0;
}
.wmx-home .wmx-cinema-art {
  position:relative;
  display:grid;
  place-items:center;
  width:min(100%,390px);
  min-height:350px;
  aspect-ratio:1 / 1.03;
  overflow:hidden;
  border:1px solid rgba(210,184,255,.23);
  border-radius:26px;
  background:
    radial-gradient(ellipse at 50% 43%,rgba(143,91,226,.37),transparent 43%),
    linear-gradient(145deg,#211438,#100d1d 55%,#08070e);
  box-shadow:0 30px 90px rgba(0,0,0,.38),inset 0 0 50px rgba(171,122,255,.06);
}
.wmx-home .wmx-art-orbit {
  position:absolute;
  width:82%;
  aspect-ratio:1;
  border:1px solid rgba(190,153,255,.2);
  border-radius:50%;
  transform:rotate(-24deg) scaleY(.66);
}
.wmx-home .wmx-art-orbit-one { width:95%; }
.wmx-home .wmx-art-orbit-two { width:70%; border-color:rgba(255,255,255,.13); transform:rotate(35deg) scaleY(.72); }
.wmx-home .wmx-art-poster {
  position:relative;
  z-index:2;
  display:flex;
  flex-direction:column;
  justify-content:center;
  width:64%;
  min-height:270px;
  padding:24px 20px;
  border:1px solid rgba(255,255,255,.23);
  border-radius:7px;
  color:#fff;
  background:
    linear-gradient(160deg,rgba(155,105,235,.18),transparent 42%),
    linear-gradient(145deg,#241738,#100d18 72%);
  box-shadow:0 20px 45px rgba(0,0,0,.55),inset 0 0 35px rgba(177,138,255,.08);
  transform:rotate(-3deg);
}
.wmx-home .wmx-art-eyebrow { color:#d2baff; font-size:9px; font-weight:800; letter-spacing:.22em; }
.wmx-home .wmx-art-symbol {
  margin:14px 0 10px;
  color:#c4a0ff;
  font-size:48px;
  line-height:1;
  text-shadow:0 0 28px rgba(174,126,255,.65);
}
.wmx-home .wmx-art-poster b {
  font-size:clamp(1.1rem,2.5vw,1.75rem);
  line-height:1.04;
  letter-spacing:-.045em;
}
.wmx-home .wmx-art-poster small {
  margin-top:17px;
  color:#c8bfd8;
  font-size:8px;
  letter-spacing:.12em;
}
.wmx-home .wmx-art-chip {
  position:absolute;
  z-index:3;
  right:5%;
  bottom:13%;
  padding:10px 12px;
  border:1px solid rgba(255,255,255,.17);
  border-radius:10px;
  color:#f4eaff;
  background:rgba(23,17,35,.88);
  font-size:9px;
  font-weight:800;
  letter-spacing:.06em;
  box-shadow:0 8px 24px rgba(0,0,0,.3);
}
.wmx-home .wmx-art-index {
  position:absolute;
  top:20px;
  right:20px;
  color:#c8b8e4;
  font-size:10px;
  letter-spacing:.14em;
}
.wmx-home .wmx-art-index span { color:#a77af2; }
.wmx-home .wmx-glass {
  width:min(100%,390px);
  padding:16px 18px;
  border:1px solid rgba(255,255,255,.11);
  border-radius:15px;
  background:rgba(22,18,32,.75);
  backdrop-filter:blur(12px);
}
.wmx-home .wmx-glass span {
  display:block;
  margin-bottom:7px;
  color:#b99aff;
  font-size:10px;
  font-weight:800;
  letter-spacing:.13em;
}
.wmx-home .wmx-glass b { display:block; color:#fff; font-size:16px; }
.wmx-home .wmx-glass small { display:block; margin-top:7px; color:#bdb5cc; line-height:1.6; }
.wmx-home .wmx-search {
  border:1px solid rgba(255,255,255,.1);
  border-radius:16px;
  background:#12101a;
}
.wmx-home .wmx-home-section,
.wmx-home section[id="categories"] { margin-top:32px; }
.wmx-home .wmx-home-section h2,
.wmx-home section[id="categories"] h2 {
  letter-spacing:-.025em;
}
.wmx-home .wmx-movie-row,
.wmx-home .wmx-row,
.wmx-home .wmx-cards {
  scrollbar-width:thin;
  scrollbar-color:#574174 transparent;
}
@media (max-width:760px) {
  .wmx-home .wmx-hero {
    grid-template-columns:minmax(0,1fr);
    gap:28px;
    min-height:0;
    padding:30px 18px 24px;
    border-radius:20px;
  }
  .wmx-home .wmx-hero-content h1 { font-size:clamp(2.65rem,12vw,4rem); }
  .wmx-home .wmx-hero-side { width:100%; }
  .wmx-home .wmx-cinema-art { width:min(100%,340px); min-height:300px; }
  .wmx-home .wmx-art-poster { min-height:245px; }
  .wmx-home .wmx-glass { width:100%; }
}
@media (prefers-reduced-motion:reduce) {
  .wmx-home .wmx-primary,
  .wmx-home .wmx-secondary { transition:none; }
}
/* END WORLD MOVIE APP CINEMATIC STRUCTURE REDESIGN V1 */

t;min-height:0;padding:72px 6% 55px;
  }
  .wmx-hero-content {max-width:100%}
  .wmx-hero h1 {font-size:clamp(43px,12vw,60px);letter-spacing:-2px}
  .wmx-hero p {font-size:15px}
  .wmx-hero-side {display:flex!important;position:relative!important;right:auto!important;bottom:auto!important;width:100%!important}
  .wmx-search-wrap {padding:22px 6%!important}
  .wmx-section {padding:30px 6% 12px!important}
  .movie-row {gap:13px!important}
  .movie-card {flex-basis:132px;width:132px!important;min-width:132px!important}
  .movie-card .poster {height:198px!important}
  .wmx-title h2 {font-size:24px}
  .wmx-membership {margin:38px 6%;padding:25px!important}
  .wmx-plans {gap:10px}
  .wmx-plans div {min-width:120px;flex:1}
}



/* WORLD MOVIE APP FINAL LAYOUT OVERRIDE V2 */
.wmx-home .wmx-hero {
  display:grid!important;
  grid-template-columns:minmax(0,1.08fr) minmax(260px,.92fr)!important;
  align-items:center!important;
  gap:clamp(22px,4vw,56px)!important;
  min-height:0!important;
  padding:clamp(30px,5vw,68px)!important;
  border-radius:24px!important;
}
.wmx-home .wmx-hero-content {position:relative!important;max-width:720px!important;min-width:0!important}
.wmx-home .wmx-hero-side {
  display:flex!important;
  position:relative!important;
  inset:auto!important;
  width:100%!important;
  min-width:0!important;
  flex-direction:column!important;
  align-items:center!important;
  gap:18px!important;
}
.wmx-home .wmx-cinema-art {
  display:grid!important;
  position:relative!important;
  width:min(100%,390px)!important;
  min-height:350px!important;
  aspect-ratio:1/1.03!important;
  overflow:hidden!important;
  border-radius:24px!important;
}
.wmx-home .wmx-art-poster {display:flex!important}
.wmx-home .wmx-glass {display:block!important;width:min(100%,390px)!important}
.wmx-home .wmx-search-wrap {padding-left:clamp(16px,7%,80px)!important;padding-right:clamp(16px,7%,80px)!important}
.wmx-home .wmx-categories {gap:10px!important}
.wmx-home .wmx-cat {border-radius:999px!important}
.wmx-home .movie-row {gap:18px!important}
@media(max-width:760px) {
  .wmx-home .wmx-hero {
    grid-template-columns:minmax(0,1fr)!important;
    gap:28px!important;
    padding:28px 18px!important;
    min-height:0!important;
  }
  .wmx-home .wmx-hero-content h1 {
    font-size:clamp(42px,11vw,64px)!important;
    line-height:.98!important;
    letter-spacing:-2px!important;
  }
  .wmx-home .wmx-hero-side {display:flex!important;width:100%!important}
  .wmx-home .wmx-cinema-art {width:min(100%,340px)!important;min-height:300px!important}
  .wmx-home .wmx-art-poster {min-height:245px!important}
  .wmx-home .wmx-glass {width:100%!important}
  .wmx-home .wmx-section {padding:30px 18px 12px!important}
  .wmx-home .movie-row {
    display:flex!important;
    overflow-x:auto!important;
    padding-bottom:14px!important;
    scroll-snap-type:x proximity;
  }
  .wmx-home .movie-card {flex:0 0 140px!important;width:140px!important;min-width:140px!important;scroll-snap-align:start}
  .wmx-home .movie-card .poster {width:140px!important;height:210px!important}
  .wmx-home .movie-info {width:140px!important}
  .wmx-home .wmx-membership {margin:32px 18px!important;padding:24px!important}
}
@media(min-width:761px) {
  .wmx-home .wmx-hero-side {display:flex!important}
}

</style>


<script>
(function(){
 const input=document.getElementById('wmxSearch');
 if(input){
   input.addEventListener('input',function(){
     const q=this.value.toLowerCase().trim();
     document.querySelectorAll('.movie-card').forEach(function(card){
       const text=(card.innerText+' '+(card.dataset.title||'')+' '+(card.dataset.category||'')+' '+(card.dataset.genre||'')+' '+(card.dataset.language||'')).toLowerCase();
       card.style.display=(!q || text.includes(q))?'':'none';
     });
   });
 }
 document.querySelectorAll('.wmx-cat').forEach(function(btn){
   btn.addEventListener('click',function(){
     const cat=this.dataset.cat;
     document.querySelectorAll('.movie-card').forEach(function(card){
       const value=(card.dataset.category||'').toLowerCase();
       card.style.display=(cat==='all'||value===cat)?'':'none';
     });
   });
 });
})();
</script>
<script>
function wmxSetView(mode){
  document.body.classList.toggle('wmx-mobile-mode',mode==='mobile');
  localStorage.setItem('wmx-view',mode);
  document.getElementById('wmxDesktopBtn').classList.toggle('active',mode==='desktop');
  document.getElementById('wmxMobileBtn').classList.toggle('active',mode==='mobile');
}
(function(){
  const mode=localStorage.getItem('wmx-view') || 'desktop';
  wmxSetView(mode);
})();
</script>

`);
});

/* =========================
   MOVIES API
========================= */


app.get("/api/miko/movies", (req, res) => {
  const movies = getMovies();

  const q = String(req.query.q || "").trim().toLowerCase();
  const genre = String(req.query.genre || "").trim().toLowerCase();
  const language = String(req.query.language || "").trim().toLowerCase();
  const limit = Math.min(Math.max(parseInt(req.query.limit || "8", 10), 1), 20);

  let results = movies.filter(movie => {
    const searchable = [
      movie.title,
      movie.description,
      movie.genre,
      movie.language,
      movie.category,
      movie.director,
      movie.cast,
      movie.year
    ].filter(Boolean).join(" ").toLowerCase();

    if (q && !searchable.includes(q)) return false;

    if (
      genre &&
      !String(movie.genre || "").toLowerCase().includes(genre)
    ) return false;

    if (
      language &&
      !String(movie.language || "").toLowerCase().includes(language)
    ) return false;

    return true;
  });

  results = results.slice(0, limit).map(movie => ({
    id: movie.id,
    title: movie.title,
    description: movie.description,
    posterUrl: movie.posterUrl,
    trailerUrl: movie.trailerUrl,
    watchUrl: movie.watchUrl,
    type: movie.type,
    category: movie.category,
    genre: movie.genre,
    language: movie.language,
    year: movie.year,
    rating: movie.rating,
    director: movie.director,
    cast: movie.cast,
    status: movie.status,
    featured: movie.featured,
    trending: movie.trending
  }));

  res.json({
    success: true,
    count: results.length,
    movies: results
  });
});

app.get("/movies", (req, res) => {
  res.json(getMovies());
});

/* =========================
   ADMIN LOGIN
========================= */

const ADMIN_EMAIL = "admin@worldmovieapp.local";
const ADMIN_PASSWORD = "ChangeThisPassword123!";

app.get("/admin/login", (req, res) => {

  if(req.session.isAdmin){
    return res.redirect("/admin");
  }

  res.send(`<script src="/miko/miko-loader.js" defer></script>
<!DOCTYPE html>
<html>
<head>
<meta name="google-site-verification" content="lfHcPxAGLAjVJcETATlrs-r7lX9gl0KPD92tA292a4c" />

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
  background:#9655f5;
  color:white;
  border:0;
  font-weight:bold;
}

</style>

<style>
html,body{margin:0!important;padding:0!important;width:100%!important;max-width:100%!important;overflow-x:hidden!important}
*,*::before,*::after{box-sizing:border-box}
body.wmx-mobile-mode .wmx-home{width:100%!important;max-width:none!important;min-width:0!important;margin:0!important}
body.wmx-mobile-mode .wmx-home .wmx-hero{width:100%!important;padding:44px 18px 38px!important}
body.wmx-mobile-mode .wmx-home .wmx-hero h1{font-size:clamp(30px,10vw,44px)!important;line-height:1.08!important;max-width:100%!important}
body.wmx-mobile-mode .wmx-home .wmx-hero p{font-size:15px!important;line-height:1.55!important}
body.wmx-mobile-mode .wmx-home .wmx-section{width:100%!important;padding-left:16px!important;padding-right:16px!important}
body.wmx-mobile-mode .wmx-home .wmx-search{width:100%!important;padding-left:16px!important;padding-right:16px!important}
body.wmx-mobile-mode .wmx-home .wmx-search input{width:100%!important;min-width:0!important;font-size:16px!important}
body.wmx-mobile-mode .wmx-home .wmx-movie-row{width:100%!important;max-width:100%!important;overflow-x:auto!important}
body.wmx-mobile-mode .wmx-home .wmx-movie-card{flex:0 0 150px!important;width:150px!important}
body.wmx-mobile-mode .wmx-home .wmx-movie-card .wmx-poster{width:150px!important;height:220px!important}
body.wmx-mobile-mode .wmx-home .wmx-plans{grid-template-columns:1fr!important;width:100%!important}
</style>
<style id="wmx-mobile-compact-v2">
@media (max-width:600px){
html,body{width:100%!important;margin:0!important;padding:0!important;overflow-x:hidden!important}
body.wmx-mobile-mode{font-size:16px!important}

body.wmx-mobile-mode .wmx-home{
 width:100%!important;max-width:100%!important;margin:0!important;
}

body.wmx-mobile-mode .wmx-hero{
 min-height:430px!important;
 padding:38px 18px 30px!important;
}

body.wmx-mobile-mode .wmx-hero h1{
 font-size:38px!important;
 line-height:1.08!important;
 letter-spacing:-.5px!important;
}

body.wmx-mobile-mode .wmx-hero p{
 font-size:15px!important;
 line-height:1.5!important;
}

body.wmx-mobile-mode .wmx-section{
 padding:28px 14px!important;
}

body.wmx-mobile-mode .wmx-section h2{
 font-size:22px!important;
 line-height:1.2!important;
}

body.wmx-mobile-mode .wmx-section p{
 font-size:14px!important;
}

body.wmx-mobile-mode .wmx-movie-row{
 display:grid!important;
 grid-template-columns:repeat(2,minmax(0,1fr))!important;
 gap:14px!important;
 width:100%!important;
 overflow:visible!important;
}

body.wmx-mobile-mode .wmx-movie-card{
 width:100%!important;
 min-width:0!important;
 max-width:none!important;
 flex:none!important;
}

body.wmx-mobile-mode .wmx-movie-card .wmx-poster{
 width:100%!important;
 height:auto!important;
 aspect-ratio:2/3!important;
 object-fit:cover!important;
}

body.wmx-mobile-mode .wmx-movie-card h3,
body.wmx-mobile-mode .wmx-movie-card .wmx-title{
 font-size:14px!important;
 line-height:1.3!important;
 margin-top:7px!important;
}

body.wmx-mobile-mode .wmx-movie-card p,
body.wmx-mobile-mode .wmx-movie-card .wmx-meta{
 font-size:12px!important;
 line-height:1.35!important;
}

body.wmx-mobile-mode .wmx-search{
 padding:16px 14px!important;
}

body.wmx-mobile-mode .wmx-search input{
 width:100%!important;
 min-width:0!important;
 height:46px!important;
 font-size:16px!important;
}

body.wmx-mobile-mode .wmx-plans{
 grid-template-columns:1fr!important;
 gap:14px!important;
}

body.wmx-mobile-mode .wmx-footer{
 padding:28px 16px!important;
}
}
</style>

<style id="wmx-moviebox-final-mobile">
@media (max-width:600px){
body.wmx-mobile-mode{font-size:16px!important}

body.wmx-mobile-mode .wmx-section{
 padding:24px 12px!important;
}

body.wmx-mobile-mode .wmx-movie-row{
 display:grid!important;
 grid-template-columns:repeat(3,minmax(0,1fr))!important;
 gap:10px!important;
 width:100%!important;
}

body.wmx-mobile-mode .wmx-movie-card{
 width:100%!important;
 min-width:0!important;
}

body.wmx-mobile-mode .wmx-movie-card .wmx-poster{
 width:100%!important;
 height:auto!important;
 aspect-ratio:2/3!important;
 max-height:190px!important;
 object-fit:cover!important;
}

body.wmx-mobile-mode .wmx-movie-card h3,
body.wmx-mobile-mode .wmx-movie-card .wmx-title{
 font-size:14px!important;
 line-height:1.3!important;
 margin:7px 0 2px!important;
}

body.wmx-mobile-mode .wmx-movie-card p,
body.wmx-mobile-mode .wmx-movie-card .wmx-meta{
 font-size:12px!important;
 line-height:1.3!important;
}

body.wmx-mobile-mode .wmx-section h2{
 font-size:22px!important;
}

body.wmx-mobile-mode .wmx-section p{
 font-size:14px!important;
}
}
</style>

<style id="wmx-real-moviebox-mobile">
@media (max-width:600px){
  body.wmx-mobile-mode .movie-row{
    display:grid!important;
    grid-template-columns:repeat(3,1fr)!important;
    gap:10px!important;
    width:100%!important;
    overflow:visible!important;
  }

  body.wmx-mobile-mode .movie-card{
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    margin:0!important;
  }

  body.wmx-mobile-mode .movie-card .poster{
    width:100%!important;
    height:165px!important;
    min-height:0!important;
    max-height:165px!important;
    aspect-ratio:2/3!important;
    object-fit:cover!important;
    border-radius:7px!important;
  }

  body.wmx-mobile-mode .movie-info{
    padding:6px 2px!important;
  }

  body.wmx-mobile-mode .movie-info h3{
    font-size:14px!important;
    line-height:1.25!important;
    margin:0 0 3px!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }

  body.wmx-mobile-mode .movie-info p{
    font-size:12px!important;
    line-height:1.25!important;
    margin:0!important;
  }

  body.wmx-mobile-mode .poster-top{
    font-size:10px!important;
  }
}
</style>

<style id="wmx-moviebox-mobile-final">
@media (max-width:600px){

  body.wmx-mobile-mode .wmx-section{
    padding:28px 12px 8px !important;
  }

  body.wmx-mobile-mode .wmx-title{
    margin-bottom:14px !important;
  }

  body.wmx-mobile-mode .wmx-title h2{
    font-size:22px !important;
  }

  body.wmx-mobile-mode .movie-row{
    display:grid !important;
    grid-template-columns:repeat(3,minmax(0,1fr)) !important;
    gap:14px 8px !important;
    width:100% !important;
    overflow:visible !important;
  }

  body.wmx-mobile-mode .movie-card{
    display:block !important;
    width:100% !important;
    min-width:0 !important;
    max-width:none !important;
    margin:0 !important;
  }

  body.wmx-mobile-mode .movie-card .poster{
    width:100% !important;
    height:auto !important;
    aspect-ratio:2 / 3 !important;
    min-height:0 !important;
    max-height:none !important;
    overflow:hidden !important;
    border-radius:7px !important;
  }

  body.wmx-mobile-mode .movie-card .poster img{
    display:block !important;
    width:100% !important;
    height:100% !important;
    object-fit:cover !important;
  }

  body.wmx-mobile-mode .movie-info{
    padding:6px 1px 0 !important;
  }

  body.wmx-mobile-mode .movie-info .meta-line{
    font-size:9px !important;
    line-height:1.2 !important;
    white-space:nowrap !important;
    overflow:hidden !important;
  }

  body.wmx-mobile-mode .movie-info h3{
    font-size:12px !important;
    line-height:1.25 !important;
    margin:4px 0 2px !important;
    white-space:nowrap !important;
    overflow:hidden !important;
    text-overflow:ellipsis !important;
  }

  body.wmx-mobile-mode .movie-info .genre,
  body.wmx-mobile-mode .movie-info .language{
    font-size:10px !important;
    line-height:1.2 !important;
    white-space:nowrap !important;
    overflow:hidden !important;
    text-overflow:ellipsis !important;
  }

  body.wmx-mobile-mode .movie-info .buttons{
    display:none !important;
  }

  body.wmx-mobile-mode .movie-card .poster-top{
    padding:5px !important;
    font-size:9px !important;
  }

  body.wmx-mobile-mode .movie-card .poster-overlay{
    display:none !important;
  }
}
</style>
</head>

<body>

<div class="box">

<h1>🎬 Admin Login</h1>

<form method="POST" action="/admin/login">

<input
type="email"
name="email"
placeholder="Admin Email"
required
>

<input
type="password"
name="password"
placeholder="Password"
required
>

<button type="submit">
Login
</button>

</form>

</div>

</body>
</html>
  `);
});

app.post("/admin/login", (req, res) => {

  const { email, password } = req.body;

  if(email === ADMIN_EMAIL && password === ADMIN_PASSWORD){

    req.session.isAdmin = true;
    req.session.adminEmail = email;

    return res.redirect("/admin");
  }

  res.status(401).send(`
  <body style="background:#080b12;color:white;text-align:center;font-family:Arial;padding:50px">

  <h2>Invalid email or password</h2>

  <a href="/admin/login" style="color:white">
    Try Again
  </a>

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
          Category: ${escapeHtml(movie.category || "Public Domain")}
        </small>

        <div style="margin-top:15px">

          <a
            href="/admin/edit/${encodeURIComponent(movie.id || movie.title)}"
            style="
              display:inline-block;
              background:#2878ff;
              color:white;
              padding:10px 15px;
              border-radius:5px;
              text-decoration:none;
            "
          >
            ✏️ Edit
          </a>

          ${
            movie.id
              ? `
              <form
                method="POST"
                action="/admin/delete/${encodeURIComponent(movie.id)}"
                style="display:inline"
                onsubmit="return confirm('Delete this movie?')"
              >

                <button
                  type="submit"
                  style="
                    width:auto;
                    background:#d00000;
                    color:white;
                    padding:10px 15px;
                    border:0;
                    border-radius:5px;
                    margin-left:5px;
                  "
                >
                  🗑️ Delete
                </button>

              </form>
              `
              : ""
          }

        </div>

      </div>

    `).join("")

    : "<p>No movies added yet.</p>";

  res.send(`<script src="/miko/miko-loader.js" defer></script>

<!DOCTYPE html>
<html>

<head>

<meta name="viewport" content="width=device-width,initial-scale=1">

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

input,textarea,button,select{
  width:100%;
  box-sizing:border-box;
  margin:8px 0;
  padding:12px;
  border-radius:6px;
}

input,textarea,select{
  background:#111722;
  border:1px solid #303b50;
  color:white;
}

button{
  background:#9655f5;
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
required
>

<textarea
name="description"
placeholder="Description"
></textarea>

<select name="category">
<option value="Public Domain">Public Domain</option>
<option value="English">English</option>
<option value="Pakistani">Pakistani</option>
<option value="Indian">Indian</option>
<option value="Punjabi">Punjabi</option>
<option value="Korean">Korean</option>
<option value="Turkish">Turkish</option>
<option value="Chinese">Chinese</option>
<option value="Japanese">Japanese</option>
<option value="Other">Other</option>
</select>

<select name="type">
<option value="Movie">Movie</option>
<option value="TV Series">TV Series</option>
</select>

<input name="genre" placeholder="Genre (Action, Drama, Comedy...)">

<input name="language" placeholder="Language">

<input name="year" type="number" min="1888" max="2100" placeholder="Release Year">

<input name="rating" type="number" min="0" max="10" step="0.1" placeholder="Rating / 10">

<input name="director" placeholder="Director">

<input name="cast" placeholder="Cast (comma separated)">

<select name="status">
<option value="Released">Released</option>
<option value="Coming Soon">Coming Soon</option>
</select>

<label style="display:block;margin:10px 0">
<input type="checkbox" name="featured" value="1"> Featured
</label>

<label style="display:block;margin:10px 0">
<input type="checkbox" name="trending" value="1"> Trending
</label>

<input
name="posterUrl"
placeholder="Poster URL"
/>

<input
name="trailerUrl"
placeholder="Trailer URL"
/>

<input
name="watchUrl"
placeholder="Watch URL"
/>

<input
name="sourceName"
placeholder="Legal Source Name (e.g. Wikimedia Commons)"
>

<input
name="sourceUrl"
placeholder="Legal Source URL"
/>

<input
name="license"
placeholder="Film License / Rights (e.g. Public Domain)"
>

<input
name="licenseUrl"
placeholder="License / Rights Information URL"
/>

<input
name="posterSource"
placeholder="Poster Source URL"
/>

<input
name="posterLicense"
placeholder="Poster License / Rights"
/>

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

    category: req.body.category || "Public Domain",

    type: req.body.type || "Movie",
    genre: req.body.genre || "",
    language: req.body.language || "",
    year: req.body.year || "",
    rating: req.body.rating || "",
    director: req.body.director || "",
    cast: req.body.cast || "",
    status: req.body.status || "Released",
    featured: req.body.featured === "1",
    trending: req.body.trending === "1",

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

  if(!movie){

    return res.status(404).send("Movie not found");

  }

  res.send(`<script src="/miko/miko-loader.js" defer></script>

<!DOCTYPE html>
<html>

<head>

<meta name="viewport" content="width=device-width,initial-scale=1">

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

input,textarea,button,select{
  width:100%;
  box-sizing:border-box;
  margin:8px 0;
  padding:12px;
  border-radius:6px;
}

input,textarea,select{
  background:#111722;
  color:white;
  border:1px solid #303b50;
}

button{
  background:#9655f5;
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

<form
method="POST"
action="/admin/edit/${encodeURIComponent(movie.id)}"
>

<input
name="title"
value="${escapeHtml(movie.title)}"
placeholder="Movie Title"
required
>

<textarea
name="description"
placeholder="Description"
>${escapeHtml(movie.description)}</textarea>

<select name="category">

<option value="Public Domain" ${movie.category === "Public Domain" ? "selected" : ""}>
Public Domain
</option>

<option value="English" ${movie.category === "English" ? "selected" : ""}>
English
</option>

<option value="Pakistani" ${movie.category === "Pakistani" ? "selected" : ""}>
Pakistani
</option>

<option value="Indian" ${movie.category === "Indian" ? "selected" : ""}>
Indian
</option>

<option value="Punjabi" ${movie.category === "Punjabi" ? "selected" : ""}>
Punjabi
</option>

</select>

<select name="type">
<option value="Movie" ${movie.type === "Movie" || !movie.type ? "selected" : ""}>Movie</option>
<option value="TV Series" ${movie.type === "TV Series" ? "selected" : ""}>TV Series</option>
</select>

<input name="genre" value="${escapeHtml(movie.genre || "")}" placeholder="Genre">

<input name="language" value="${escapeHtml(movie.language || "")}" placeholder="Language">

<input name="year" type="number" value="${escapeHtml(movie.year || "")}" placeholder="Release Year">

<input name="rating" type="number" min="0" max="10" step="0.1" value="${escapeHtml(movie.rating || "")}" placeholder="Rating / 10">

<input name="director" value="${escapeHtml(movie.director || "")}" placeholder="Director">

<input name="cast" value="${escapeHtml(movie.cast || "")}" placeholder="Cast (comma separated)">

<select name="status">
<option value="Released" ${movie.status !== "Coming Soon" ? "selected" : ""}>Released</option>
<option value="Coming Soon" ${movie.status === "Coming Soon" ? "selected" : ""}>Coming Soon</option>
</select>

<label style="display:block;margin:10px 0">
<input type="checkbox" name="featured" value="1" ${movie.featured ? "checked" : ""}> Featured
</label>

<label style="display:block;margin:10px 0">
<input type="checkbox" name="trending" value="1" ${movie.trending ? "checked" : ""}> Trending
</label>

<input
name="posterUrl"
value="${escapeHtml(movie.posterUrl || "")}"
placeholder="Poster URL"
>

<input
name="trailerUrl"
value="${escapeHtml(movie.trailerUrl)}"
placeholder="Trailer URL"
>

<input
name="watchUrl"
value="${escapeHtml(movie.watchUrl || "")}"
placeholder="Watch URL"
>

<input
name="sourceName"
value="${escapeHtml(movie.sourceName || "")}"
placeholder="Legal Source Name (e.g. Wikimedia Commons)"
>

<input
name="sourceUrl"
value="${escapeHtml(movie.sourceUrl || "")}"
placeholder="Legal Source URL"
>

<input
name="license"
value="${escapeHtml(movie.license || "")}"
placeholder="Film License / Rights (e.g. Public Domain)"
>

<input
name="licenseUrl"
value="${escapeHtml(movie.licenseUrl || "")}"
placeholder="License / Rights Information URL"
>

<input
name="posterSource"
value="${escapeHtml(movie.posterSource || "")}"
placeholder="Poster Source URL"
>

<input
name="posterLicense"
value="${escapeHtml(movie.posterLicense || "")}"
placeholder="Poster License / Rights"
>

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

  if(index === -1){

    return res.status(404).send("Movie not found");

  }

  movies[index] = {

    ...movies[index],

    title: req.body.title || "",

    description: req.body.description || "",

    category: req.body.category || "Public Domain",

    type: req.body.type || "Movie",
    genre: req.body.genre || "",
    language: req.body.language || "",
    year: req.body.year || "",
    rating: req.body.rating || "",
    director: req.body.director || "",
    cast: req.body.cast || "",
    status: req.body.status || "Released",
    featured: req.body.featured === "1",
    trending: req.body.trending === "1",

    posterUrl: req.body.posterUrl || "",

    trailerUrl: req.body.trailerUrl || "",

    watchUrl: req.body.watchUrl || "",

    sourceName: req.body.sourceName || "",
    sourceUrl: req.body.sourceUrl || "",
    license: req.body.license || "",
    licenseUrl: req.body.licenseUrl || "",
    posterSource: req.body.posterSource || "",
    posterLicense: req.body.posterLicense || ""

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

  if(newMovies.length === movies.length){

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


/* MOVIE DETAIL PAGE SAFE */
app.get("/movie/:id", (req, res) => {
  const movies = getMovies();
  const movie = movies.find(m => String(m.id) === String(req.params.id));

  if (!movie) {
    return res.status(404).send(`
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Movie Not Found - World Movie App</title>
        <style>
          body{
            margin:0;
            background:#080808;
            color:#fff;
            font-family:Arial,sans-serif;
            display:flex;
            align-items:center;
            justify-content:center;
            min-height:100vh;
            text-align:center;
          }
          .box{
            max-width:600px;
            padding:40px 24px;
          }
          a{
            display:inline-block;
            margin-top:20px;
            padding:12px 22px;
            background:#9655f5;
            color:#fff;
            text-decoration:none;
            border-radius:8px;
          }
        </style>
      </head>
      <body>
        <div class="box">
          <h1>Movie Not Found</h1>
          <p>The movie or series you requested could not be found.</p>
          <a href="/">← Back to Home</a>
        </div>
      </body>
      </html>
    `);
  }

  const safe = (value) => escapeHtml(String(value ?? ""));
  const title = safe(movie.title || "Untitled");
  const description = safe(movie.description || "No description available.");
  const category = safe(movie.category || "Other");
  const type = safe(movie.type || "Movie");
  const genre = safe(movie.genre || "Not specified");
  const language = safe(movie.language || "Not specified");
  const year = safe(movie.year || "—");
  const rating = safe(movie.rating || "Not rated");
  const director = safe(movie.director || "Not specified");
  const cast = safe(movie.cast || "Not specified");
  const status = safe(movie.status || "Released");
  const sourceName = safe(movie.sourceName || "");
  const sourceUrl = safe(movie.sourceUrl || "");
  const license = safe(movie.license || "");
  const licenseUrl = safe(movie.licenseUrl || "");
  const posterSource = safe(movie.posterSource || "");
  const posterLicense = safe(movie.posterLicense || "");

  const poster = movie.posterUrl
    ? `<img src="${safe(movie.posterUrl)}" alt="${title} poster">`
    : `<div class="no-poster">🎬</div>`;

  const trailer = movie.trailerUrl
    ? `<a class="btn secondary" href="${safe(movie.trailerUrl)}" target="_blank" rel="noopener noreferrer">▶ Watch Trailer</a>`
    : "";

  const watch = movie.watchUrl
    ? `<a class="btn primary" href="${safe(movie.watchUrl)}" target="_blank" rel="noopener noreferrer">▶ Watch / Official Source</a>`
    : `<div class="notice">Official watch link is not available yet.</div>`;

  const statusClass = String(movie.status || "Released").toLowerCase() === "coming soon"
    ? "coming"
    : "released";

  res.send(`<script src="/miko/miko-loader.js" defer></script>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - World Movie App</title>
  <meta name="description" content="${description}">
  <style>
    *{box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{
      margin:0;
      background:#070707;
      color:#fff;
      font-family:Arial,Helvetica,sans-serif;
    }

    nav{
      position:sticky;
      top:0;
      z-index:20;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:20px;
      padding:16px 6%;
      background:rgba(5,5,5,.94);
      border-bottom:1px solid rgba(255,255,255,.08);
      backdrop-filter:blur(12px);
    }

    .brand{
      color:#fff;
      text-decoration:none;
      font-weight:900;
      font-size:22px;
      letter-spacing:.5px;
    }

    .brand span{color:#9655f5}

    .navlinks{
      display:flex;
      gap:20px;
      flex-wrap:wrap;
    }

    .navlinks a{
      color:#ddd;
      text-decoration:none;
      font-size:14px;
    }

    .navlinks a:hover{color:#fff}

    .hero{
      min-height:560px;
      padding:70px 6%;
      display:grid;
      grid-template-columns:minmax(260px,380px) 1fr;
      gap:55px;
      align-items:center;
      background:
        radial-gradient(circle at 75% 35%,rgba(150,85,245,.18),transparent 35%),
        linear-gradient(180deg,#111 0%,#070707 100%);
    }

    .poster{
      width:100%;
      max-width:380px;
      aspect-ratio:2/3;
      overflow:hidden;
      border-radius:18px;
      background:#151515;
      box-shadow:0 25px 70px rgba(0,0,0,.65);
      border:1px solid rgba(255,255,255,.1);
    }

    .poster img{
      width:100%;
      height:100%;
      object-fit:cover;
      display:block;
    }

    .no-poster{
      width:100%;
      height:100%;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:70px;
      color:#777;
    }

    .eyebrow{
      color:#9655f5;
      font-size:13px;
      font-weight:800;
      text-transform:uppercase;
      letter-spacing:1.5px;
      margin-bottom:12px;
    }

    h1{
      font-size:clamp(38px,6vw,72px);
      line-height:1.02;
      margin:0 0 18px;
    }

    .description{
      color:#cfcfcf;
      line-height:1.8;
      max-width:800px;
      font-size:16px;
    }

    .badges{
      display:flex;
      flex-wrap:wrap;
      gap:9px;
      margin:22px 0;
    }

    .badge{
      padding:7px 11px;
      border-radius:999px;
      background:#181818;
      border:1px solid #2b2b2b;
      color:#ddd;
      font-size:13px;
    }

    .badge.rating{
      color:#ffd84d;
      border-color:#5b4b13;
    }

    .badge.released{
      color:#7dffae;
      border-color:#175d37;
    }

    .badge.coming{
      color:#ffbd6b;
      border-color:#684016;
    }

    .actions{
      display:flex;
      flex-wrap:wrap;
      gap:12px;
      margin-top:25px;
    }

    .btn{
      display:inline-block;
      padding:13px 20px;
      border-radius:9px;
      text-decoration:none;
      font-weight:800;
      transition:.2s;
    }

    .btn:hover{transform:translateY(-2px)}

    .btn.primary{
      background:#9655f5;
      color:#fff;
    }

    .btn.secondary{
      background:#222;
      color:#fff;
      border:1px solid #3b3b3b;
    }

    .notice{
      display:inline-block;
      padding:13px 17px;
      border-radius:9px;
      background:#171717;
      color:#aaa;
      border:1px solid #292929;
    }

    .details{
      padding:60px 6%;
      max-width:1200px;
      margin:auto;
    }

    .details h2{
      font-size:30px;
      margin:0 0 25px;
    }

    .info-grid{
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:14px;
    }

    .info{
      background:#111;
      border:1px solid #222;
      border-radius:12px;
      padding:18px;
    }

    .label{
      display:block;
      color:#888;
      font-size:12px;
      text-transform:uppercase;
      letter-spacing:1px;
      margin-bottom:7px;
    }

    .value{
      color:#eee;
      font-size:16px;
    }

    footer{
      padding:35px 6%;
      text-align:center;
      color:#777;
      border-top:1px solid #1d1d1d;
    }

    @media(max-width:800px){
      .hero{
        grid-template-columns:1fr;
        padding-top:40px;
      }

      .poster{
        margin:auto;
        max-width:300px;
      }

      .info-grid{
        grid-template-columns:1fr;
      }

      .navlinks{
        gap:12px;
      }
    }

/* Final responsive overrides */
@media (max-width:800px) {
  body.wmx-mobile-mode .wmx-brand {
    font-size:22px !important;
    letter-spacing:-1px !important;
  }
  body.wmx-mobile-mode .wmx-hero h1 {
    font-size:clamp(30px,10vw,44px) !important;
    line-height:1.08 !important;
    letter-spacing:-1px !important;
    max-width:100% !important;
  }
  body.wmx-mobile-mode .movie-info h3 {
    font-size:12px !important;
    line-height:1.2 !important;
  }
  body.wmx-mobile-mode .movie-info .meta-line,
  body.wmx-mobile-mode .movie-info .genre,
  body.wmx-mobile-mode .movie-info .language {
    font-size:11px !important;
    line-height:1.2 !important;
  }
}



</head>

<body>
  <nav>
    <a class="brand" href="/">WORLD <span>MOVIE</span> APP</a>
    <div class="navlinks">
      <a href="/">Home</a>
      <a href="/movies">Movies</a>
      <a href="/membership">Membership</a>
      <a href="/admin">Admin</a>
    </div>
  </nav>

  <main>
    <section class="hero">
      <div class="poster">
        ${poster}
      </div>

      <div>
        <div class="eyebrow">${type} • ${category}</div>
        <h1>${title}</h1>

        <div class="badges">
          <span class="badge rating">⭐ ${rating}</span>
          <span class="badge">${year}</span>
          <span class="badge">${language}</span>
          <span class="badge">${genre}</span>
          <span class="badge ${statusClass}">${status}</span>
        </div>

        <p class="description">${description}</p>

        <div class="actions">
          ${watch}
          ${trailer}
        </div>
      </div>
    </section>

    <section class="details">
      <h2>Movie Information</h2>

      <div class="info-grid">
        <div class="info">
          <span class="label">Type</span>
          <span class="value">${type}</span>
        </div>

        <div class="info">
          <span class="label">Category</span>
          <span class="value">${category}</span>
        </div>

        <div class="info">
          <span class="label">Genre</span>
          <span class="value">${genre}</span>
        </div>

        <div class="info">
          <span class="label">Language</span>
          <span class="value">${language}</span>
        </div>

        <div class="info">
          <span class="label">Release Year</span>
          <span class="value">${year}</span>
        </div>

        <div class="info">
          <span class="label">Rating</span>
          <span class="value">⭐ ${rating}</span>
        </div>

        <div class="info">
          <span class="label">Director</span>
          <span class="value">${director}</span>
        </div>

        <div class="info">
          <span class="label">Cast</span>
          <span class="value">${cast}</span>
        </div>
      </div>
    </section>
  </main>

  <footer>
    © ${new Date().getFullYear()} World Movie App — Authorized & Public-Domain Entertainment
  </footer>
</body>
</html>
  `);
});


// WMA_INFO_PAGES_V1
function wmaRenderInfoPage(title, content) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | World Movie App</title>
<meta name="description" content="${title} - World Movie App information.">
<style>
body{margin:0;background:#090711;color:#f8f5ff;font:16px/1.7 Arial,sans-serif}
main{max-width:850px;margin:40px auto;padding:24px}
h1,h2{color:#bc93ff}a{color:#bc93ff}
article{background:#131020;border:1px solid #302544;border-radius:16px;padding:24px}
nav{margin-bottom:24px}nav a{margin-right:14px}
</style>
</head>
<body><main>
<nav><a href="/">Home</a><a href="/movies">Movies</a><a href="/about">About</a><a href="/contact">Contact</a></nav>
<article><h1>${title}</h1>${content}</article>
<footer><p>© World Movie App</p><a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms</a></footer>
</main></body></html>`;
}

app.get("/about", (req, res) => {
  res.send(wmaRenderInfoPage("About Us", `
    <p>World Movie App helps visitors discover movie information, trailers, and viewing-source links.</p>
    <p>We aim to identify authorized and public-domain material where applicable. Availability and rights can vary by title and location. We do not claim ownership of third-party material unless explicitly stated.</p>
    <p>If you believe content or a link raises a rights concern, please contact us.</p>
  `));
});

app.get("/contact", (req, res) => {
  res.send(wmaRenderInfoPage("Contact Us", `
    <p>For questions, corrections, or copyright concerns, email:</p>
    <p><a href="mailto:Worldmovieapp1@gmail.com">Worldmovieapp1@gmail.com</a></p>
    <p>Please include the relevant movie title or page URL when reporting a problem.</p>
  `));
});

app.get("/privacy", (req, res) => {
  res.send(wmaRenderInfoPage("Privacy Policy", `
    <p>This page explains general privacy practices for World Movie App.</p>
    <h2>Information and technical data</h2>
    <p>If you create an account or use account features, information you submit may be processed to provide those features. The hosting service may also process technical logs such as request details for security and operation.</p>
    <h2>Cookies and sessions</h2>
    <p>The website may use cookies or similar session technologies for essential functionality, such as keeping a user signed in.</p>
    <h2>Third-party links</h2>
    <p>Movie links and other external services are operated by third parties. Their privacy practices are governed by their own policies.</p>
    <h2>Choices and questions</h2>
    <p>For privacy-related questions or requests, contact <a href="mailto:Worldmovieapp1@gmail.com">Worldmovieapp1@gmail.com</a>.</p>
    <p>This policy should be updated if the website adds advertising, analytics, or other services that change how information is processed.</p>
  `));
});

app.get("/terms", (req, res) => {
  res.send(wmaRenderInfoPage("Terms of Use", `
    <p>By using World Movie App, you agree to use the website lawfully and not to disrupt its operation.</p>
    <h2>Information and external links</h2>
    <p>Movie details and links are provided for discovery and informational purposes. External websites are controlled by their respective operators; check their terms and rights before using their content.</p>
    <h2>Rights concerns</h2>
    <p>We do not intend to present third-party material as our own. Please report suspected errors or rights concerns to <a href="mailto:Worldmovieapp1@gmail.com">Worldmovieapp1@gmail.com</a>.</p>
    <h2>Changes</h2>
    <p>Website features and these terms may change as the service develops. These terms are not legal advice and should be reviewed for the laws that apply to the service.</p>
  `));
});

app.listen(PORT, "0.0.0.0", () => {

  console.log(
    "World Movie App running on http://127.0.0.1:" + PORT
  );

});0


<!-- MOVIE CARD LINK SAFE -->

