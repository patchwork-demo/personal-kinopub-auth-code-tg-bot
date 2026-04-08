import express from "express";
import path from "path";
import zlib from "zlib";
import { Database } from "bun:sqlite";
import { debug } from "console";
import compression from "compression";

const db = new Database("wow_db.sqlite", { create: true });

const app = express();
const port = 3333;

app.set("view engine", "pug");
app.set("views", path.join(import.meta.dir, "src", "templates"));
app.use(express.static(path.join(import.meta.dir, "public")));
app.use(
  compression({
    // Brotli (preferred when client supports it); quality 1–11, default 4
    brotli: {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 5,
      },
    },
    // gzip fallback
    level: 6,
    threshold: 1024,
  })
);

app.get("/", (req, res) => {
  res.render("home", { name: "😎" });
});

const server = app.listen(port, () => {
  console.log(`Wowzers is happening on port: ${port}`);
});

process.on("SIGTERM", () => {
  debug("SIGTERM received, shutting down...");
  db.close();
  server.close(() => {
    debug("Server closed");
    process.exit(0);
  });
});