const DEFAULT_GMAIL_FROM = "support@kino.pub";
const DEFAULT_GMAIL_SUBJECT = "Проверочный код для кинопаба";
const DEFAULT_POLL_INTERVAL_MS = 30_000;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export function getGmailQuery(): string {
  const from = process.env.GMAIL_FROM?.trim() || DEFAULT_GMAIL_FROM;
  const subject = process.env.GMAIL_SUBJECT?.trim() || DEFAULT_GMAIL_SUBJECT;
  return `from:${from} subject:"${subject.replace(/"/g, '\\"')}"`;
}

export function getPollIntervalMs(): number {
  const raw = process.env.POLL_INTERVAL_MS;
  if (!raw) return DEFAULT_POLL_INTERVAL_MS;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 5_000) {
    throw new Error("POLL_INTERVAL_MS must be a number >= 5000");
  }
  return n;
}

export function getTelegramToken(): string {
  return requireEnv("TELEGRAM_BOT_TOKEN");
}

export function getTelegramChatId(): string {
  return requireEnv("TELEGRAM_CHAT_ID");
}

export function getGmailOAuthCredentials(): {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
} {
  return {
    clientId: requireEnv("GMAIL_CLIENT_ID"),
    clientSecret: requireEnv("GMAIL_CLIENT_SECRET"),
    refreshToken: requireEnv("GMAIL_REFRESH_TOKEN"),
  };
}
