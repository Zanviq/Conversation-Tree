# --- build: compile TypeScript ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- deps: production dependencies only ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- runtime ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY drizzle ./drizzle
COPY package.json ./
USER node
EXPOSE 4000
# Applies pending migrations and seeds the demo account before listening
CMD ["node", "dist/index.js"]
