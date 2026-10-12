FROM oven/bun:latest

RUN mkdir -p /home/bot
WORKDIR /home/bot

COPY package.json .

RUN bun install

COPY . .

CMD ["bun", "start"]