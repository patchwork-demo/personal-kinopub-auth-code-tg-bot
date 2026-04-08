import { Database } from "bun:sqlite";
import path from "node:path";
import { Bot } from "grammy";
import {
  getGmailQuery,
  getPollIntervalMs,
  getTelegramChatId,
  getTelegramToken,
} from "./src/bot/config.ts";
import { createGmailClient } from "./src/bot/gmailClient.ts";
import {
  extractSixDigitCodeFromHtml,
  extractSixDigitCodeFromPlain,
} from "./src/bot/extractCode.ts";
import { collectBodiesFromPayload } from "./src/bot/gmailBody.ts";

const DB_PATH = process.env.SQLITE_PATH?.trim()
  ? process.env.SQLITE_PATH
  : path.join(import.meta.dir, "wow_db.sqlite");

function openDb(): Database {
  const db = new Database(DB_PATH, { create: true });
  db.run(`
    CREATE TABLE IF NOT EXISTS processed_gmail_messages (
      id TEXT PRIMARY KEY NOT NULL,
      processed_at INTEGER NOT NULL
    )
  `);
  return db;
}

async function processInboxOnce(
  db: Database,
  gmail: ReturnType<typeof createGmailClient>,
  bot: Bot,
  chatId: string,
  q: string
): Promise<void> {
  const list = await gmail.users.messages.list({
    userId: "me",
    q,
    maxResults: 25,
  });
  const ids = list.data.messages ?? [];
  const check = db.query(
    "SELECT 1 AS ok FROM processed_gmail_messages WHERE id = ?"
  );

  for (const ref of ids) {
    const id = ref.id;
    if (!id) continue;
    if (check.get(id)) continue;

    const full = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "full",
    });
    const bodies = collectBodiesFromPayload(full.data.payload ?? undefined);
    let code: string | null = bodies.html
      ? extractSixDigitCodeFromHtml(bodies.html)
      : null;
    if (!code && bodies.plain) {
      code = extractSixDigitCodeFromPlain(bodies.plain);
    }

    if (!code) {
      console.warn(
        `[gmail] No 6-digit code in <strong> (or plain fallback) for message ${id}`
      );
      continue;
    }

    await bot.api.sendMessage(chatId, code);
    db.run(
      "INSERT INTO processed_gmail_messages (id, processed_at) VALUES (?, ?)",
      [id, Date.now()]
    );
  }
}

async function main(): Promise<void> {
  const token = getTelegramToken();
  const chatId = getTelegramChatId();
  const db = openDb();
  const gmail = createGmailClient();
  const intervalMs = getPollIntervalMs();
  const q = getGmailQuery();

  const bot = new Bot(token);
  bot.command("start", async (ctx) => {
    await ctx.reply(`Your chat id: ${ctx.chat.id}`);
  });
  bot.catch((err) => console.error("[telegram]", err));

  void bot.start().catch((err) => {
    console.error("[telegram] bot.start failed", err);
    process.exit(1);
  });

  try {
    await bot.api.sendMessage(chatId, "Bot started.");
  } catch (e) {
    console.warn("[bot] startup notify failed", e);
  }

  console.log(`[bot] Gmail query: ${q}`);
  console.log(`[bot] Poll every ${intervalMs} ms`);

  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      await processInboxOnce(db, gmail, bot, chatId, q);
    } catch (e) {
      console.error("[poll]", e);
    } finally {
      busy = false;
    }
  };

  await tick();
  setInterval(() => void tick(), intervalMs);

  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log("SIGTERM/SIGINT, stopping…");
    try {
      await bot.api.sendMessage(chatId, "Bot shutting down.");
    } catch (e) {
      console.warn("[bot] shutdown notify failed", e);
    }
    await bot.stop();
    db.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
