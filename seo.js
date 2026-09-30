const fs = require("fs");
const path = require("path");

const SITE_URL = (process.env.SITE_URL || "https://world-movie-app-1.onrender.com").replace(/\/+$/, "");

function loadMovies() {
  try {
    const file = path.join(__dirname, "data", "movies.json");
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.movies)) return raw.movies;
    if (Array.isArray(raw.data)) return raw.data;
    return [];
  } catch {
    return [];
  }
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonSafe(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function absoluteUrl(value) {
  if (!value) return "";
  try {
    return new URL(String(value), SITE_URL + "/").href;
  } catch {
    return "";
  }
}

module.exports = function installSEO(app) {
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain").send(
`User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /login
Disallow: /signup
Disallow: /profile
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`
    );
  });

  app.get("/sitemap.xml", (req, res) => {
    const movies = loadMovies();
    const urls = [
      `${SITE_URL}/`,
      `${SITE_URL}/movies`,
      `${SITE_URL}/membership`
    ];

    for (const movie of movies) {
      if (movie && movie.id) {
        urls.push(`${SITE_URL}/movie/${encodeURIComponent(String(movie.id))}`);
      }
    }

    const unique = [...new Set(urls)];
    const today = new Date().toISOString().slice(0, 10);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${unique.map(url => `  <url>
    <loc>${esc(url)}</loc>
    <lastmod>${today}</lastmod>
  </url>`).join("\n")}
</urlset>`;

    res.type("application/xml").send(xml);
  });

  const originalSend = app.response.send;

  app.response.send = function patchedSend(body) {
    try {
      const req = this.req;

      if (
        typeof body === "string" &&
        body.includes("</head>") &&
        !body.includes('name="world-movie-app-seo"')
      ) {
        const privatePage =
          req.path.startsWith("/admin") ||
          req.path === "/login" ||
          req.path === "/signup" ||
          req.path === "/profile";

        let title = "World Movie App | Movies, Trailers & Movie Information";
        let description =
          "World Movie App is an entertainment movie catalog for discovering movies, trailers, metadata and authorized viewing sources.";
        let canonical = SITE_URL + (req.path === "/" ? "/" : req.path);

        let movie = null;

        if (req.path.startsWith("/movie/")) {
          const id = decodeURIComponent(req.path.substring("/movie/".length));
          movie = loadMovies().find(m => String(m.id) === String(id));

          if (movie) {
            title = `${movie.title || "Movie"} | World Movie App`;

            description =
              movie.description ||
              `${movie.title || "Movie"} on World Movie App — movie information, year, language, genre, trailer and authorized viewing information.`;

            canonical = `${SITE_URL}/movie/${encodeURIComponent(String(movie.id))}`;
          }
        }

        const poster = movie ? absoluteUrl(movie.posterUrl) : "";

        const schema = movie ? {
          "@context": "https://schema.org",
          "@type": "Movie",
          "name": movie.title || "Movie",
          "url": canonical,
          "description": description,
          ...(poster ? { "image": poster } : {}),
          ...(movie.year ? { "dateCreated": String(movie.year) } : {}),
          ...(movie.genre ? { "genre": movie.genre } : {}),
          ...(movie.language ? { "inLanguage": movie.language } : {})
        } : {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "World Movie App",
          "url": SITE_URL,
          "description": description
        };

        const seo = `
<meta name="world-movie-app-seo" content="enabled">
<meta name="description" content="${esc(description).slice(0, 900)}">
<meta name="robots" content="${privatePage ? "noindex,nofollow" : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="${movie ? "video.movie" : "website"}">
<meta property="og:site_name" content="World Movie App">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description).slice(0, 900)}">
<meta property="og:url" content="${esc(canonical)}">
${poster ? `<meta property="og:image" content="${esc(poster)}">` : ""}
<script type="application/ld+json">${jsonSafe(schema)}</script>
`;

        body = body.replace("</head>", seo + "\n</head>");
      }

      if (
        typeof body === "string" &&
        (req.path.startsWith("/admin") ||
         req.path === "/login" ||
         req.path === "/signup" ||
         req.path === "/profile")
      ) {
        this.set("X-Robots-Tag", "noindex, nofollow");
      }
    } catch (error) {
      console.error("SEO middleware warning:", error.message);
    }

    return originalSend.call(this, body);
  };
};
