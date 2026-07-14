// GitHub OAuth — step 1: send the Decap CMS popup to GitHub's consent screen.
// Requires OAUTH_GITHUB_CLIENT_ID (Vercel env var).
import crypto from "node:crypto";

export default function handler(req, res) {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send("Missing OAUTH_GITHUB_CLIENT_ID env var");
    return;
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `https://${host}/api/callback`);
  url.searchParams.set("scope", "repo,user");
  url.searchParams.set("state", crypto.randomBytes(16).toString("hex"));

  res.redirect(302, url.toString());
}
