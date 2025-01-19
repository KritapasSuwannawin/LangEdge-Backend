# Stage 1: Build
FROM node:22.11.0-alpine AS builder

WORKDIR /app

# Copy only package.json and package-lock.json to install dependencies
COPY package*.json ./

RUN npm ci

# Copy the rest of the application code
COPY . .

RUN npm run build

# Stage 2: Production
FROM node:22.11.0-alpine

WORKDIR /app

# Copy node_modules from the build stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

EXPOSE 8000

CMD ["node", "dist/server.js"]