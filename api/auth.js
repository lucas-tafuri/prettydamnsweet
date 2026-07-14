// GitHub OAuth — step 1: send the Decap CMS popup to GitHub's consent screen.
import crypto from "node:crypto";

function clientId() {
  return (
    process.env.OAUTH_GITHUB_CLIENT_ID ||
    process.env.OAUTH_CLIENT_ID ||
    ""
  ).trim();
}

export default function handler(req, res) {
  const id = clientId();
  if (!id) {
    res
      .status(500)
      .send(
        "Missing OAUTH_GITHUB_CLIENT_ID (or OAUTH_CLIENT_ID) env var on Vercel"
      );
    return;
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", id);
  url.searchParams.set("redirect_uri", `https://${host}/api/callback`);
  url.searchParams.set("scope", "repo,user");
  url.searchParams.set("state", crypto.randomBytes(16).toString("hex"));

  res.redirect(302, url.toString());
}
