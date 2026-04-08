# kinopub-auth-code-tg-bot

A **Telegram bot** that polls Gmail for Kinopub verification messages, reads the **6-digit code** from a `<strong>` tag in the HTML body, and sends that code to Telegram. Processed message ids are stored in `wow_db.sqlite`.

## Install

```bash
bun install
```

## Gmail → Telegram bot

### 1. Google Cloud

1. Create a project, enable **Gmail API**.
2. **OAuth consent screen** (External is fine for personal use; add your Google account as a test user if the app stays in Testing).
3. **Credentials** → Create **OAuth client ID** (Desktop or Web application).
4. Add authorized redirect URI: `http://127.0.0.1:3939/oauth2callback` (or match `OAUTH_PORT` if you change it).

### 2. Refresh token

```bash
cp .env.example .env
# Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env, then:
bun run gmail-auth
```

Open the printed URL, sign in, approve access. Copy `GMAIL_REFRESH_TOKEN` into `.env`.

### 3. Telegram

1. Create a bot with [@BotFather](https://t.me/BotFather), set `TELEGRAM_BOT_TOKEN` in `.env`.
2. Start a chat with the bot and send `/start`. It replies with **your chat id** — set `TELEGRAM_CHAT_ID` in `.env`.

### 4. Run

```bash
bun run bot
```

### Run with Docker (VPS)

No systemd unit needed: Compose sets `restart: unless-stopped` and keeps SQLite in a named volume.

```bash
cp .env.example .env
# fill .env (Gmail refresh token is easiest to obtain locally: bun run gmail-auth)
docker compose up -d --build
docker compose logs -f
```

`SQLITE_PATH` defaults to `wow_db.sqlite` beside `bot.ts`; Compose overrides it to `/data/wow_db.sqlite` inside the container.

For development with auto-restart on file changes:

```bash
bun run dev
```

Environment variables are documented in [`.env.example`](.env.example). Defaults match mail from `support@kino.pub` with subject `Проверочный код для кинопаба`.

---

This project uses [Bun](https://bun.com).
