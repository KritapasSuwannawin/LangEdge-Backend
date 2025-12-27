# Stage 1: Build
FROM node:22.16.0-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm test
RUN npm run build

RUN npm prune --production

# Stage 2: Production
FROM node:22.16.0-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

EXPOSE 8000

CMD ["node", "dist/src/main.js"]
