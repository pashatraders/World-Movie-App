const express = require("express");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const router = express.Router();

function getUsers() {
  return router.getUsers();
}

function saveUsers(users) {
  return router.saveUsers(users);
}

router.get("/signup", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>World Movie App - Sign Up</title>
<style>
body{margin:0;font-family:Arial;background:#080b12;color:white;padding:20px}
.box{max-width:420px;margin:50px auto;background:#111722;padding:28px;border-radius:14px;border:1px solid #29354a}
input,button{width:100%;box-sizing:border-box;padding:13px;margin:8px 0;border-radius:6px}
input{background:#080b12;color:white;border:1px solid #303b50}
button{background:#e50914;color:white;border:0;font-weight:bold}
a{color:#aaa}
</style>
</head>
<body>
<div class="box">
<h1>🎬 Create Account</h1>
<p>Join World Movie App</p>
<form method="POST" action="/signup">
<input type="text" name="name" placeholder="Your Name" required>
<input type="email" name="email" placeholder="Email" required>
<input type="password" name="password" placeholder="Password" minlength="8" required>
<button type="submit">Create Account</button>
</form>
<p>Already have an account? <a href="/login">Login</a></p>
</div>
</body>
</html>
`);
});

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!name || !cleanEmail || !password || password.length < 8) {
    return res.status(400).send("Please enter valid information.");
  }

  const users = getUsers();

  if (users.some(user => user.email === cleanEmail)) {
    return res.status(409).send("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  users.push({
    id: Date.now().toString(),
    name: String(name).trim(),
    email: cleanEmail,
    passwordHash,
    membership: "free",
    membershipExpiresAt: null,
    createdAt: new Date().toISOString()
  });

  saveUsers(users);

  res.redirect("/login");
});

router.get("/login", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>World Movie App - Login</title>
<style>
body{margin:0;font-family:Arial;background:#080b12;color:white;padding:20px}
.box{max-width:420px;margin:50px auto;background:#111722;padding:28px;border-radius:14px;border:1px solid #29354a}
input,button{width:100%;box-sizing:border-box;padding:13px;margin:8px 0;border-radius:6px}
input{background:#080b12;color:white;border:1px solid #303b50}
button{background:#e50914;color:white;border:0;font-weight:bold}
a{color:#aaa}
</style>
</head>
<body>
<div class="box">
<h1>🎬 Welcome Back</h1>
<form method="POST" action="/login">
<input type="email" name="email" placeholder="Email" required>
<input type="password" name="password" placeholder="Password" required>
<button type="submit">Login</button>
</form>
<p>New here? <a href="/signup">Create Account</a></p>
</div>
</body>
</html>
`);
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const cleanEmail = String(email || "").trim().toLowerCase();
  const users = getUsers();
  const user = users.find(item => item.email === cleanEmail);

  if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
    return res.status(401).send("Invalid email or password.");
  }

  req.session.userId = user.id;
  res.redirect("/");
});

router.get("/membership", (req, res) => {
  const loggedIn = !!req.session.userId;

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>World Movie App - Membership</title>
<style>
body{margin:0;font-family:Arial;background:#080b12;color:white;padding:20px}
.container{max-width:900px;margin:40px auto}
h1{text-align:center}
.plans{display:flex;gap:20px;justify-content:center;flex-wrap:wrap}
.plan{background:#111722;border:1px solid #29354a;border-radius:14px;padding:25px;width:300px;box-sizing:border-box}
.price{font-size:30px;font-weight:bold;margin:15px 0}
button,a.btn{display:block;width:100%;box-sizing:border-box;padding:13px;text-align:center;border:0;border-radius:7px;background:#e50914;color:white;text-decoration:none;font-weight:bold;cursor:pointer}
.free{background:#151d2b}
.note{text-align:center;color:#aaa;margin-top:25px}
</style>
</head>
<body>
<div class="container">
<h1>⭐ Choose Your Membership</h1>

<div class="plans">

<div class="plan">
<h2>Free</h2>
<div class="price">Rs. 0</div>
<p>• Create your account</p>
<p>• Browse available content</p>
<p>• Free access features</p>
<a class="btn free" href="${loggedIn ? "/profile" : "/signup"}">
${loggedIn ? "My Profile" : "Create Account"}
</a>
</div>

<div class="plan">
<h2>Premium</h2>

<div class="price">Rs. 1,000 / Month</div>
<p>• Premium membership</p>
<p>• Premium content access</p>
<p>• Additional premium features</p>
<button disabled style="opacity:.65;cursor:not-allowed">Payment Coming Soon</button>

<div class="price">Rs. 10,000 / Year</div>
<button disabled style="opacity:.65;cursor:not-allowed">Payment Coming Soon</button>
</div>

</div>

<p class="note">Payment will be processed through a configured payment provider. No payment is taken on this page.</p>
<p style="text-align:center"><a href="/" style="color:#aaa">← Back to Home</a></p>
</div>
</body>
</html>
  `);
});

router.get("/membership/checkout", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const plan = req.query.plan;

  if (plan !== "monthly" && plan !== "yearly") {
    return res.status(400).send("Invalid membership plan.");
  }

  const price = plan === "monthly" ? "Rs. 1,000" : "Rs. 10,000";
  const duration = plan === "monthly" ? "1 Month" : "1 Year";

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>World Movie App - Checkout</title>
<style>
body{margin:0;font-family:Arial;background:#080b12;color:white;padding:20px}
.box{max-width:500px;margin:50px auto;background:#111722;padding:28px;border-radius:14px;border:1px solid #29354a}
.card{background:#080b12;padding:18px;border-radius:10px;margin:15px 0}
.price{font-size:30px;font-weight:bold;margin:10px 0}
button{width:100%;padding:14px;border:0;border-radius:7px;background:#e50914;color:white;font-weight:bold;font-size:16px}
.note{color:#aaa;font-size:14px;line-height:1.5}
a{color:#aaa;text-decoration:none}
</style>
</head>
<body>
<div class="box">
<h1>💳 Premium Checkout</h1>

<div class="card">
<strong>Plan</strong>
<p>${duration}</p>
<strong>Price</strong>
<div class="price">${price}</div>
</div>

<p class="note">
Payment provider is not connected yet. This page only confirms the selected plan.
No payment has been taken.
</p>

<button disabled>Payment Provider Coming Soon</button>

<p style="margin-top:25px">
<a href="/membership">← Back to Membership</a>
</p>
</div>
</body>
</html>
  `);
});router.get("/profile", (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const users = getUsers();
  const user = users.find(item => item.id === req.session.userId);

  if (!user) {
    return res.redirect("/login");
  }

  const activeMembership =
    user.membership === "premium" &&
    user.membershipExpiresAt &&
    new Date(user.membershipExpiresAt) > new Date();

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>World Movie App - Profile</title>
<style>
body{margin:0;font-family:Arial;background:#080b12;color:white;padding:20px}
.box{max-width:500px;margin:50px auto;background:#111722;padding:28px;border-radius:14px;border:1px solid #29354a}
.card{background:#080b12;padding:15px;border-radius:10px;margin:12px 0}
.badge{font-weight:bold}
a{color:#fff;text-decoration:none}
</style>
</head>
<body>
<div class="box">
<h1>👤 My Profile</h1>

<div class="card">
<strong>Name</strong>
<p>${user.name}</p>
</div>

<div class="card">
<strong>Email</strong>
<p>${user.email}</p>
</div>

<div class="card">
<strong>Membership</strong>
<p class="badge">${activeMembership ? "PREMIUM" : "FREE"}</p>
</div>

<div class="card">
<strong>Membership Expiry</strong>
<p>${activeMembership ? new Date(user.membershipExpiresAt).toLocaleDateString() : "Not active"}</p>
</div>

<p><a href="/">← Back to Home</a></p>
</div>
</body>
</html>
`);
});


// MIKO TRUSTGATE: admin-only legal review queue
const mikoRootQueue = path.join(__dirname, "miko-review-queue.json");
const mikoDataDir = path.join(__dirname, "data");
const mikoMoviesFile = path.join(mikoDataDir, "movies.json");
const mikoHistoryFile = path.join(__dirname, "miko-review-history.json");

function mikoEscape(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;",
    '"':"&quot;", "'":"&#39;"
  }[c]));
}
function mikoRead(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return fallback; }
}
function mikoQueue() {
  const fallback = path.join(mikoDataDir, "miko-review-queue.json");
  const file = fs.existsSync(mikoRootQueue) ? mikoRootQueue : fallback;
  const q = mikoRead(file, []);
  return Array.isArray(q) ? q : [];
}
function mikoValidUrl(value) {
  try {
    const u = new URL(String(value || ""));
    return u.protocol === "https:" || u.protocol === "http:";
  } catch { return false; }
}
function mikoNormalize(value) {
  return String(value || "").toLowerCase()
    .replace(/\s*\(\d{4}\)\s*$/, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}
function mikoWrite(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}
async function mikoGitHubCommit(files, message) {
  const token = process.env.GITHUB_CONTENTS_TOKEN;
  if (!token) return false;

  const repo = process.env.GITHUB_REPO || "pashatraders/World-Movie-App";
  const branch = process.env.GITHUB_BRANCH || "main";
  const api = "https://api.github.com/repos/" + repo;
  const headers = {
    "Authorization": "Bearer " + token,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json"
  };
  async function request(url, options = {}) {
    const r = await fetch(url, { ...options, headers });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error("GitHub API " + r.status + ": " + (data.message || "request failed"));
    return data;
  }

  const ref = await request(api + "/git/ref/heads/" + branch);
  const parentSha = ref.object.sha;
  const parent = await request(api + "/git/commits/" + parentSha);
  const tree = [];

  for (const [filePath, content] of Object.entries(files)) {
    const blob = await request(api + "/git/blobs", {
      method: "POST",
      body: JSON.stringify({ content, encoding: "utf-8" })
    });
    tree.push({ path: filePath, mode: "100644", type: "blob", sha: blob.sha });
  }

  const newTree = await request(api + "/git/trees", {
    method: "POST",
    body: JSON.stringify({ base_tree: parent.tree.sha, tree })
  });
  const commit = await request(api + "/git/commits", {
    method: "POST",
    body: JSON.stringify({
      message, tree: newTree.sha, parents: [parentSha]
    })
  });
  await request(api + "/git/refs/heads/" + branch, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false })
  });
  return true;
}

router.get("/admin/miko-review", (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin/login");

  const queue = mikoQueue();
  const cards = queue.map((m, i) => {
    const source = mikoValidUrl(m.sourceUrl)
      ? `<a target="_blank" rel="noopener noreferrer" href="${mikoEscape(m.sourceUrl)}">Discovery record ↗</a>`
      : "Discovery source unavailable";

    return `
    <article class="card">
      <h2>${mikoEscape(m.title)}</h2>
      <p>Release date: ${mikoEscape(m.releaseDate || m.year || "Unknown")}</p>
      <p>Metadata source: ${mikoEscape(m.sourceName || "Unknown")} · ${source}</p>
      <p class="warning">Poster rights: NOT VERIFIED · Video rights: NOT VERIFIED</p>
      <form method="POST" action="/admin/miko-review/${i}">
        <label>Description</label>
        <textarea name="description" placeholder="Movie description"></textarea>
        <label>Genre</label><input name="genre" placeholder="Genre">
        <label>Language</label><input name="language" placeholder="Language">
        <label>Official source name</label><input name="sourceName" placeholder="Official source / provider">
        <label>Official source URL (not the Wikidata record)</label><input name="sourceUrl" type="url" placeholder="https://..." >
        <label>Rights / licence</label><input name="license" placeholder="Exact licence or public-domain basis">
        <label>Rights evidence URL</label><input name="licenseUrl" type="url" placeholder="https://...">
        <label>Official legal viewing URL</label><input name="watchUrl" type="url" placeholder="https://...">
        <label>Trailer URL (optional)</label><input name="trailerUrl" type="url" placeholder="https://...">
        <label>Poster URL (optional)</label><input name="posterUrl" type="url" placeholder="https://...">
        <label>Poster source URL (required if poster supplied)</label><input name="posterSource" type="url" placeholder="https://...">
        <label>Poster licence (required if poster supplied)</label><input name="posterLicense" placeholder="Poster licence">
        <label class="check"><input type="checkbox" name="rightsConfirmed" value="yes"> I checked the evidence and confirm the film and supplied artwork may legally be published.</label>
        <button name="decision" value="publish">Verify & Publish</button>
        <button class="reject" name="decision" value="reject" formnovalidate>Reject suggestion</button>
      </form>
    </article>`;
  }).join("");

  const cloud = process.env.GITHUB_CONTENTS_TOKEN
    ? "GitHub sync configured"
    : "Local-only mode: set GITHUB_CONTENTS_TOKEN on Render before reviewing on the live website.";

  res.send(`<!doctype html><html lang="en"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Miko TrustGate — World Movie App</title>
  <style>
  *{box-sizing:border-box}body{margin:0;background:#080b12;color:#f4f6fa;font:15px Arial;padding:20px}
  main{max-width:850px;margin:auto}a{color:#8db8ff}h1{font-size:28px}
  .note,.card{background:#111722;border:1px solid #29354a;border-radius:12px;padding:18px;margin:16px 0}
  .warning{color:#ffca76}.status{color:#9eb0c8}
  label{display:block;margin-top:12px;color:#c5ccda;font-size:13px}
  input,textarea,button{width:100%;padding:12px;margin-top:6px;border-radius:7px}
  input,textarea{background:#080b12;border:1px solid #39465e;color:white}
  textarea{min-height:80px}button{border:0;background:#2878ff;color:white;font-weight:bold;margin-top:14px}
  .reject{background:#4a2630}.check{display:flex;gap:10px;align-items:flex-start;line-height:1.5}
  .check input{width:auto;margin-top:2px}
  </style></head><body><main>
  <h1>🛡️ Miko TrustGate</h1>
  <p class="status">${mikoEscape(cloud)}</p>
  <div class="note">Pending review: ${queue.length}. No suggestion is published automatically. Publishing requires a legal viewing URL, rights evidence, and your confirmation.</div>
  ${cards || '<div class="note">No pending suggestions. Miko will add more when discovery runs.</div>'}
  <p><a href="/admin">← Back to Admin Panel</a></p>
  </main></body></html>`);
});

router.post("/admin/miko-review/:index", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin/login");

  if (process.env.RENDER && !process.env.GITHUB_CONTENTS_TOKEN) {
    return res.status(503).send("Live review is disabled until GITHUB_CONTENTS_TOKEN is configured in Render.");
  }

  const index = Number(req.params.index);
  const queue = mikoQueue();
  if (!Number.isInteger(index) || index < 0 || index >= queue.length) {
    return res.status(404).send("Review item not found.");
  }

  const item = queue[index];
  const movies = mikoRead(mikoMoviesFile, []);
  const history = mikoRead(mikoHistoryFile, []);
  if (!Array.isArray(movies) || !Array.isArray(history)) {
    return res.status(500).send("Movie data or review history is invalid.");
  }

  const now = new Date().toISOString();
  const decision = req.body.decision;

  if (decision === "reject") {
    queue.splice(index, 1);
    history.push({ ...item, reviewAction: "REJECTED", reviewedAt: now });
  } else if (decision === "publish") {
    const b = req.body;
    const requiredUrls = [b.sourceUrl, b.licenseUrl, b.watchUrl];
    if (b.rightsConfirmed !== "yes" || !b.sourceName || !b.license ||
        !requiredUrls.every(mikoValidUrl) ||
        (b.posterUrl && (!mikoValidUrl(b.posterUrl) ||
          !mikoValidUrl(b.posterSource) || !b.posterLicense))) {
      return res.status(400).send("Publish blocked: provide valid official source, rights evidence, legal viewing URL, poster rights if applicable, and tick the confirmation box.");
    }

    const titleKey = mikoNormalize(item.title);
    if (movies.some(m => mikoNormalize(m.title) === titleKey)) {
      return res.status(409).send("This title already exists in the movie catalogue.");
    }

    const movie = {
      id: "miko-" + Date.now(),
      title: item.title,
      description: String(b.description || "").trim(),
      type: "Movie",
      category: "Other",
      genre: String(b.genre || "").trim(),
      language: String(b.language || "").trim(),
      year: item.year || "",
      status: "Released",
      featured: false,
      trending: false,
      posterUrl: String(b.posterUrl || "").trim(),
      trailerUrl: String(b.trailerUrl || "").trim(),
      watchUrl: String(b.watchUrl).trim(),
      sourceName: String(b.sourceName).trim(),
      sourceUrl: String(b.sourceUrl).trim(),
      license: String(b.license).trim(),
      licenseUrl: String(b.licenseUrl).trim(),
      posterSource: String(b.posterSource || "").trim(),
      posterLicense: String(b.posterLicense || "").trim(),
      videoRightsStatus: "ADMIN_CONFIRMED",
      posterRightsStatus: b.posterUrl ? "ADMIN_CONFIRMED" : "NOT_PROVIDED",
      publicationStatus: "PUBLISHED_AFTER_HUMAN_REVIEW",
      releaseDate: item.releaseDate || "",
      reviewedAt: now
    };

    movies.push(movie);
    queue.splice(index, 1);
    history.push({ ...item, reviewAction: "PUBLISHED", movieId: movie.id, reviewedAt: now });

  } else {
    return res.status(400).send("Invalid review decision.");
  }


  try {
    const files = {
      "miko-review-queue.json": JSON.stringify(queue, null, 2) + "\n",
      "miko-review-history.json": JSON.stringify(history, null, 2) + "\n"
    };
    if (decision === "publish") {
      files["data/movies.json"] = JSON.stringify(movies, null, 2) + "\n";
    }
    const synced = await mikoGitHubCommit(files, "Miko TrustGate: " + decision + " review item");
    if (process.env.GITHUB_CONTENTS_TOKEN && synced === false) {
      throw new Error("GitHub sync did not confirm success.");
    }
    if (decision === "publish") {
      mikoWrite(mikoMoviesFile, movies);
    }
    fs.mkdirSync(mikoDataDir, { recursive: true });
    mikoWrite(mikoRootQueue, queue);
    mikoWrite(path.join(mikoDataDir, "miko-review-queue.json"), queue);
    mikoWrite(mikoHistoryFile, history);
    res.redirect("/admin/miko-review");
  } catch (error) {
    res.status(502).send("Review could not be fully completed; check GitHub and local files before retrying: " + mikoEscape(error.message));
  }
});


module.exports = router;0
module.exports = router;
0

