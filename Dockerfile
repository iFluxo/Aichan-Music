FROM oven/bun:1-debian AS deps

WORKDIR /AichanMusic

COPY package.json bun.lock* ./
RUN bun install --production

FROM oven/bun:1-debian

WORKDIR /AichanMusic

ENV NODE_ENV=production

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /AichanMusic/node_modules ./node_modules
COPY package.json bun.lock* ./
COPY tsconfig.json seyfert.config.ts ./
COPY assets ./assets
COPY app ./app

CMD ["bun", "start"]
