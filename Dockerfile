FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY bot.ts ./
COPY src ./src

USER bun

CMD ["bun", "run", "bot.ts"]
