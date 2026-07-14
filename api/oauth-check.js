// Safe diagnostic — shows which OAuth env vars Vercel has loaded (masked).
// Visit: https://prettydamnsweet.vercel.app/api/oauth-check
// Delete this file after login works.

function mask(value) {
  if (!value) return null;
  const v = value.trim();
  if (v.length <= 8) return { present: true, preview: `${v.slice(0, 2)}…`, length: v.length };
  return {
    present: true,
    preview: `${v.slice(0, 4)}…${v.slice(-4)}`,
    length: v.length,
  };
}

export default function handler(req, res) {
  const id =
    process.env.OAUTH_GITHUB_CLIENT_ID || process.env.OAUTH_CLIENT_ID || "";
  const secret =
    process.env.OAUTH_GITHUB_CLIENT_SECRET ||
    process.env.OAUTH_CLIENT_SECRET ||
    "";

  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    OAUTH_GITHUB_CLIENT_ID: mask(process.env.OAUTH_GITHUB_CLIENT_ID),
    OAUTH_CLIENT_ID: mask(process.env.OAUTH_CLIENT_ID),
    OAUTH_GITHUB_CLIENT_SECRET: mask(process.env.OAUTH_GITHUB_CLIENT_SECRET),
    OAUTH_CLIENT_SECRET: mask(process.env.OAUTH_CLIENT_SECRET),
    resolved_client_id: mask(id),
    resolved_client_secret: mask(secret),
    expected_callback:
      "https://prettydamnsweet.vercel.app/api/callback",
    notes: [
      "Use a GitHub OAuth App (Settings → Developer settings → OAuth Apps), not a GitHub App.",
      "Client secret must be the OAuth App client secret (starts often with nothing special; regenerate if unsure).",
      "Authorization callback URL on the OAuth App must be exactly the expected_callback above.",
      "After changing env vars in Vercel, trigger a Redeploy so functions pick them up.",
      "Delete /api/oauth-check.js once login works.",
    ],
  });
}
