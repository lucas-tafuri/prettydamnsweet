// GitHub OAuth — step 2: exchange code for token, then hand it back to Decap.
// Uses postMessage (classic Decap handshake) PLUS localStorage (fallback when
// GitHub's Cross-Origin-Opener-Policy nulls window.opener — common in Chrome).

function clientId() {
  return (
    process.env.OAUTH_GITHUB_CLIENT_ID ||
    process.env.OAUTH_CLIENT_ID ||
    ""
  ).trim();
}

function clientSecret() {
  return (
    process.env.OAUTH_GITHUB_CLIENT_SECRET ||
    process.env.OAUTH_CLIENT_SECRET ||
    ""
  ).trim();
}

function renderPage(status, content) {
  const payload = JSON.stringify(content);
  const safePayload = payload.replace(/</g, "\\u003c");
  const label =
    status === "success"
      ? "Login successful — you can close this window."
      : `Login failed: ${content.error || "unknown error"}`;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>CMS Login</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #07070c;
        color: #f7f7f5;
        font: 14px/1.4 ui-monospace, monospace;
        padding: 2rem;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <p id="msg">${label}</p>
    <script>
      (function () {
        var status = ${JSON.stringify(status)};
        var content = ${safePayload};
        var message =
          "authorization:github:" + status + ":" + JSON.stringify(content);

        // Fallback for when window.opener is null (GitHub COOP).
        // Same-origin as /admin, so the parent page can poll this key.
        try {
          localStorage.setItem(
            "pds-cms-oauth",
            JSON.stringify(
              status === "success"
                ? { token: content.token, provider: "github" }
                : { error: content.error || "Login failed" }
            )
          );
        } catch (e) {}

        function reply(origin) {
          if (!window.opener) return false;
          try {
            window.opener.postMessage(message, origin || "*");
            return true;
          } catch (e) {
            return false;
          }
        }

        function receiveMessage(e) {
          reply(e.origin);
          window.removeEventListener("message", receiveMessage, false);
          setTimeout(function () {
            try { window.close(); } catch (e) {}
          }, 400);
        }

        window.addEventListener("message", receiveMessage, false);

        if (window.opener) {
          window.opener.postMessage("authorizing:github", "*");
          // Also send the final message after a short delay in case the
          // handshake reply is missed (some browsers drop the first message).
          setTimeout(function () { reply("*"); }, 600);
          setTimeout(function () {
            try { window.close(); } catch (e) {}
          }, 1500);
        } else {
          document.getElementById("msg").textContent =
            status === "success"
              ? "Login successful. Return to the admin tab — it should unlock automatically."
              : label;
        }
      })();
    </script>
  </body>
</html>`;
}

export default async function handler(req, res) {
  const id = clientId();
  const secret = clientSecret();
  const code = typeof req.query?.code === "string" ? req.query.code : "";

  let status = "error";
  let content = { error: "Unknown error" };

  if (!id || !secret) {
    content = {
      error:
        "Missing OAuth env vars on Vercel (need OAUTH_GITHUB_CLIENT_ID and OAUTH_GITHUB_CLIENT_SECRET)",
    };
  } else if (!code) {
    content = { error: "Missing authorization code from GitHub" };
  } else {
    try {
      const tokenRes = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: id,
            client_secret: secret,
            code,
          }),
        }
      );
      const data = await tokenRes.json();
      if (data.error || !data.access_token) {
        content = {
          error: data.error_description || data.error || "Token exchange failed",
        };
      } else {
        status = "success";
        content = { token: data.access_token, provider: "github" };
      }
    } catch (err) {
      content = { error: String(err) };
    }
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  // Keep opener relationship intact on our side
  res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
  res.status(200).send(renderPage(status, content));
}
