# Stage 1: Build
FROM node:22.16.0-alpine AS builder

ARG OPENAI_API_KEY

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm test
RUN OPENAI_API_KEY=$OPENAI_API_KEY pnpm test:llm
RUN pnpm build

RUN pnpm prune --prod

# Stage 2: Production
FROM node:22.16.0-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

EXPOSE 8000

CMD ["node", "dist/src/main.js"]
