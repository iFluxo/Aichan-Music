FROM oven/bun:1-alpine AS deps

WORKDIR /home/bot

COPY package.json bun.lock* ./
RUN bun install --production

FROM oven/bun:1-alpine

WORKDIR /home/bot

ENV NODE_ENV=production

COPY --from=deps /home/bot/node_modules ./node_modules
COPY package.json bun.lock* ./
COPY tsconfig.json seyfert.config.ts ./
COPY assets ./assets
COPY app ./app

CMD ["bun", "start"]
