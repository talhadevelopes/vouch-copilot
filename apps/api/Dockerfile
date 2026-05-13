FROM oven/bun:1.2

# Install OpenSSL 1.1 for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

COPY prisma ./prisma
RUN bunx prisma generate

COPY src ./src

EXPOSE 4000

CMD ["bun", "src/index.ts"]