FROM oven/bun:1-debian AS deps

WORKDIR /AichanMusic

COPY package.json bun.lock* ./
RUN bun install --production

FROM oven/bun:1-debian

WORKDIR /AichanMusic

ARG TARGETARCH

ENV NODE_ENV=production

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl ffmpeg \
    && case "$TARGETARCH" in \
        arm64) YtDlpAsset="yt-dlp_linux_aarch64" ;; \
        *) YtDlpAsset="yt-dlp_linux" ;; \
    esac \
    && curl -fsSL "https://github.com/yt-dlp/yt-dlp/releases/latest/download/${YtDlpAsset}" -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && apt-get purge -y --auto-remove curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /AichanMusic/node_modules ./node_modules
COPY package.json bun.lock* ./
COPY tsconfig.json seyfert.config.ts ./
COPY assets ./assets
COPY app ./app

CMD ["bun", "start"]
