const express = require("express");
const bcrypt = require("bcryptjs");

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
button,a.btn{display:block;width:100%;box-sizing:border-box;padding:13px;text-align:center;border:0;border-radius:7px;background:#e50914;color:white;text-decoration:none;font-weight:bold}
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
<div class="price">Coming Soon</div>
<p>• Premium membership</p>
<p>• Premium content access</p>
<p>• Additional premium features</p>
<button disabled>Payment Coming Soon</button>
</div>

</div>

<p class="note">Secure payment options will be connected after the payment provider is configured.</p>
<p style="text-align:center"><a href="/" style="color:#aaa">← Back to Home</a></p>
</div>
</body>
</html>
`);
});0
router.get("/profile", (req, res) => {
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

module.exports = router;0
module.exports = router;
0

