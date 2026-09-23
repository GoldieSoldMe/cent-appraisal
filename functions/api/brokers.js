const TEAM_URL = "https://fortcollins.clscars.com/contact/meet-the-team/";

const FALLBACK_BROKERS = [
  "Jake Alexander",
  "Jim Ambrose",
  "Toby Bauer",
  "Alejandra Castro",
  "Mike Dillon",
  "Jeff Engelbrecht",
  "Matt Goldie",
  "Wes Hewitt",
  "Kerry Kennicutt",
  "Brian Lampe",
  "Roman Martinez",
  "Sam Mouton",
  "Nicole Smith",
  "Steve Smith",
  "Ray Vigil",
  "Sirena Wall",
  "Josh Woolley"
];

function decodeHtml(text) {
  return String(text || "")
    .replace(/&amp;/gi, "&")
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&nbsp;/gi, " ")
    .replace(/&ndash;|&#8211;/gi, "–")
    .replace(/&mdash;|&#8212;/gi, "—");
}

function stripTags(text) {
  return decodeHtml(String(text || "").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function extractBrokers(html) {
  const brokers = [];
  const seen = new Set();
  const anchorRegex = /<a\b[^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorRegex.exec(html))) {
    const label = stripTags(match[1]);
    if (!/\bAuto Broker\b/i.test(label)) continue;

    const name = label
      .replace(/\s+Auto Broker\b.*$/i, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!name || name.length > 80) continue;

    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      brokers.push(name);
    }
  }

  return brokers;
}

export async function onRequestGet() {
  let brokers = [];
  let live = false;

  try {
    const response = await fetch(TEAM_URL, {
      headers: {
        "Accept": "text/html",
        "User-Agent": "PainlessAppraisal/1.0"
      },
      cf: {
        cacheTtl: 1800,
        cacheEverything: true
      }
    });

    if (response.ok) {
      const html = await response.text();
      brokers = extractBrokers(html);
      live = brokers.length > 0;
    }
  } catch (error) {
    console.log("BROKER ROSTER FETCH ERROR:", error?.message || error);
  }

  if (!brokers.length) {
    brokers = FALLBACK_BROKERS;
  }

  return new Response(
    JSON.stringify({
      success: true,
      brokers,
      live,
      source: TEAM_URL
    }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=900"
      }
    }
  );
}
