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

function mask(value) {
  if (!value) return "(missing)";
  if (value.length <= 8) return `${value.slice(0, 2)}…`;
  return `${value.slice(0, 4)}…${value.slice(-4)} (len ${value.length})`;
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
      small { opacity: 0.55; display: block; margin-top: 1rem; max-width: 36rem; }
    </style>
  </head>
  <body>
    <div>
      <p id="msg">${label}</p>
      ${
        status === "error" && content.hint
          ? `<small>${content.hint}</small>`
          : ""
      }
    </div>
    <script>
      (function () {
        var status = ${JSON.stringify(status)};
        var content = ${safePayload};
        var message =
          "authorization:github:" + status + ":" + JSON.stringify({
            error: content.error,
            token: content.token,
            provider: content.provider
          });

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

  const host = String(req.headers["x-forwarded-host"] || req.headers.host)
    .split(",")[0]
    .trim();
  const proto = String(req.headers["x-forwarded-proto"] || "https")
    .split(",")[0]
    .trim();
  const redirectUri = `${proto}://${host}/api/callback`;

  let status = "error";
  let content = { error: "Unknown error" };

  if (!id || !secret) {
    content = {
      error:
        "Missing OAuth env vars on Vercel (need OAUTH_GITHUB_CLIENT_ID and OAUTH_GITHUB_CLIENT_SECRET)",
      hint: `client_id=${mask(id)} client_secret=${mask(secret)}`,
    };
  } else if (!code) {
    content = { error: "Missing authorization code from GitHub" };
  } else {
    try {
      // GitHub requires the same redirect_uri used in /authorize.
      // Prefer form-urlencoded — most reliable against GitHub's token endpoint.
      const body = new URLSearchParams({
        client_id: id,
        client_secret: secret,
        code,
        redirect_uri: redirectUri,
      });

      const tokenRes = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body,
        }
      );
      const data = await tokenRes.json();

      if (data.error || !data.access_token) {
        content = {
          error:
            data.error_description || data.error || "Token exchange failed",
          hint: `Using client_id ${mask(id)}, redirect_uri ${redirectUri}. Confirm this Client ID matches your GitHub OAuth App, the secret is a Client secret (not a PAT), and the callback URL is exactly ${redirectUri}`,
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
  res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
  res.status(200).send(renderPage(status, content));
}
