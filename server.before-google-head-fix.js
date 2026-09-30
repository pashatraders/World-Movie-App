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
  const featured = movies.filter(m => m.featured === true || m.featured === "1");

  const latest = [...movies].reverse();

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

  res.send(`<script src="/miko/miko-loader.js" defer></script><div class="wmx-home">

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
    <h1>YOUR NEXT<br><strong>STORY</strong><br>STARTS HERE.</h1>
    <p>Discover movies and entertainment from around the world through authorized and public-domain sources.</p>
    <div class="wmx-actions">
      <a href="/movies" class="wmx-primary">▶ Explore Movies</a>
      <a href="#categories" class="wmx-secondary">Browse Categories</a>
    </div>
  </div>
  <div class="wmx-hero-side">
    <div class="wmx-glass">
      <span>NOW DISCOVERING</span>
      <b>Movies • Series • Classics</b>
      <small>English · Pakistani · Indian · Punjabi · Korean · Turkish & more</small>
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
.wmx-brand span{color:#e50914}
.wmx-top nav{display:flex;gap:28px}
.wmx-top nav a{color:#bbb;text-decoration:none;font-size:14px}
.wmx-top nav a:hover{color:#fff}
.wmx-hero{min-height:650px;position:relative;overflow:hidden;display:flex;align-items:center;padding:0 7%;background:linear-gradient(90deg,#050609 0%,#080b12 48%,#101522 100%)}
.wmx-hero-bg{position:absolute;inset:0;background:radial-gradient(circle at 75% 45%,rgba(229,9,20,.3),transparent 27%),radial-gradient(circle at 90% 80%,rgba(55,95,190,.3),transparent 30%);pointer-events:none}
.wmx-hero-content{position:relative;z-index:2;max-width:720px}
.wmx-kicker{color:#e50914;font-size:13px;font-weight:bold;letter-spacing:5px;margin-bottom:20px}
.wmx-hero h1{font-size:clamp(52px,7vw,92px);line-height:.9;letter-spacing:-5px;margin:0;font-weight:900}
.wmx-hero h1 strong{color:#e50914}
.wmx-hero p{color:#aeb4bf;font-size:17px;line-height:1.7;max-width:600px;margin:28px 0}
.wmx-actions{display:flex;gap:12px;flex-wrap:wrap}
.wmx-primary,.wmx-secondary{padding:15px 24px;border-radius:5px;text-decoration:none;font-weight:bold}
.wmx-primary{background:#e50914;color:#fff}
.wmx-secondary{background:#fff;color:#111}
.wmx-hero-side{position:absolute;right:7%;bottom:55px;width:310px;z-index:2}
.wmx-glass{padding:25px;border:1px solid #303746;border-radius:14px;background:rgba(10,14,23,.72);backdrop-filter:blur(15px);box-shadow:0 25px 70px #000}
.wmx-glass span,.wmx-membership small,.wmx-title small{font-size:11px;color:#e50914;letter-spacing:3px;font-weight:bold}
.wmx-glass b{display:block;font-size:20px;margin:10px 0}
.wmx-glass small{color:#9ca4b2;line-height:1.6}
.wmx-search-wrap{padding:34px 7%;background:#080a0f}
.wmx-search{max-width:850px;margin:auto;background:#11151d;border:1px solid #252b36;border-radius:6px;display:flex;align-items:center;padding:0 20px}
.wmx-search span{font-size:28px;color:#777}
.wmx-search input{width:100%;padding:19px;border:0;outline:0;background:transparent;color:#fff;font-size:16px}
.wmx-section{padding:48px 7% 15px}
.wmx-title{display:flex;align-items:end;justify-content:space-between;margin-bottom:22px}
.wmx-title h2{font-size:30px;margin:7px 0 0}
.wmx-title a{color:#e50914;text-decoration:none}
.wmx-categories,.wmx-genres{display:flex;gap:10px;flex-wrap:wrap}
.wmx-cat,.wmx-genres a{background:#11151d;border:1px solid #252b36;color:#c5cad3;padding:11px 17px;border-radius:4px;text-decoration:none;cursor:pointer}
.wmx-cat:hover,.wmx-genres a:hover{background:#e50914;color:#fff;border-color:#e50914}
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
  background:#e50914;
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
  font-size:42px !important;
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
  padding:8px 10px !important;
  font-size:20px !important;
}
body.wmx-mobile-mode .wmx-hero{
  min-height:520px;
  padding:55px 22px;
}
body.wmx-mobile-mode .wmx-hero h1{
  font-size:48px;
  letter-spacing:-3px;
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
  font-size:24px;
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
  font-size:28px !important;
  line-height:1.15 !important;
  margin:3px 0 0 !important;
  white-space:nowrap !important;
  overflow:hidden !important;
  text-overflow:ellipsis !important;
}

body.wmx-mobile-mode .movie-info .meta-line,
body.wmx-mobile-mode .movie-info .genre,
body.wmx-mobile-mode .movie-info .language{
  font-size:20px !important;
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
  font-size:28px;
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
  font-size:52px;
  letter-spacing:-3px;
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
  background:#e50914;
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
            background:#e50914;
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

    .brand span{color:#e50914}

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
        radial-gradient(circle at 75% 35%,rgba(229,9,20,.18),transparent 35%),
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
      color:#e50914;
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
      background:#e50914;
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
  </style>
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

app.listen(PORT, "0.0.0.0", () => {

  console.log(
    "World Movie App running on http://127.0.0.1:" + PORT
  );

});0


<!-- MOVIE CARD LINK SAFE -->
