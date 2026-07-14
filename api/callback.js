// GitHub OAuth — step 2: exchange the code for a token and hand it back
// to the Decap CMS window via the postMessage handshake Decap expects.
// Requires OAUTH_GITHUB_CLIENT_ID and OAUTH_GITHUB_CLIENT_SECRET (Vercel env vars).

export default async function handler(req, res) {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  const code = req.query?.code;

  let payload;
  if (!clientId || !clientSecret) {
    payload = { error: "Missing OAuth env vars on the server" };
  } else if (!code) {
    payload = { error: "Missing authorization code" };
  } else {
    try {
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
      });
      const data = await tokenRes.json();
      payload = data.error
        ? { error: data.error_description || data.error }
        : { token: data.access_token, provider: "github" };
    } catch (err) {
      payload = { error: String(err) };
    }
  }

  const status = payload.error ? "error" : "success";
  const content = JSON.stringify(payload);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!doctype html>
<html>
  <body>
    <p>Completing login…</p>
    <script>
      (function () {
        function receiveMessage() {
          window.opener.postMessage(
            'authorization:github:${status}:${content.replace(/'/g, "\\'")}',
            '*'
          );
          window.removeEventListener('message', receiveMessage, false);
        }
        window.addEventListener('message', receiveMessage, false);
        window.opener.postMessage('authorizing:github', '*');
      })();
    </script>
  </body>
</html>`);
}
