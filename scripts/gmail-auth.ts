/**
 * One-time OAuth: prints a Gmail refresh token for .env (GMAIL_REFRESH_TOKEN).
 *
 * Prereqs: Google Cloud project with Gmail API enabled, OAuth client (Desktop or Web)
 * with authorized redirect URI matching REDIRECT below (default http://127.0.0.1:3939/oauth2callback).
 *
 * Usage:
 *   GMAIL_CLIENT_ID=... GMAIL_CLIENT_SECRET=... bun run scripts/gmail-auth.ts
 * Optional: OAUTH_PORT=3939
 */
import { google } from "googleapis";

const PORT = Number(process.env.OAUTH_PORT || "3939");
if (!Number.isFinite(PORT) || PORT <= 0) {
  throw new Error("OAUTH_PORT must be a positive number");
}

const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`;
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"] as const;

const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error("Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in the environment.");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: [...SCOPES],
});

console.log("\nOpen this URL in a browser (logged into the Gmail account to monitor):\n");
console.log(authUrl);
console.log(
  `\nEnsure this redirect URI is allowed in Google Cloud Console:\n  ${REDIRECT_URI}\n`
);

const server = Bun.serve({
  port: PORT,
  hostname: "127.0.0.1",
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname !== "/oauth2callback") {
      return new Response("Not found", { status: 404 });
    }
    const code = url.searchParams.get("code");
    const err = url.searchParams.get("error");
    if (err) {
      console.error("OAuth error:", err, url.searchParams.get("error_description"));
      server.stop();
      queueMicrotask(() => process.exit(1));
      return new Response(String(err), { status: 400 });
    }
    if (!code) {
      return new Response("Missing code", { status: 400 });
    }
    try {
      const { tokens } = await oauth2Client.getToken(code);
      const rt = tokens.refresh_token;
      console.log("\n--- Add to .env ---\n");
      if (rt) {
        console.log(`GMAIL_REFRESH_TOKEN=${rt}`);
      } else {
        console.log(
          "(No refresh_token returned. Revoke app access in Google Account settings and run again, or ensure prompt=consent.)"
        );
      }
      console.log("-------------------\n");
    } catch (e) {
      console.error("Token exchange failed:", e);
      server.stop();
      queueMicrotask(() => process.exit(1));
      return new Response("Token exchange failed", { status: 500 });
    }
    server.stop();
    setTimeout(() => process.exit(0), 50);
    return new Response("Success. You can close this tab.", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
});

console.log(`Listening on ${REDIRECT_URI}`);
