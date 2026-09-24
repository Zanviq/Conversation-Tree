# Web (frontend) image: builds the Vite app and serves it with nginx.
# The API server has its own image in server/Dockerfile.

# --- build ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html index.tsx App.tsx types.ts vite.config.ts tsconfig.json metadata.json ./
COPY components ./components
COPY services ./services
COPY utils ./utils
RUN npm run build

# --- runtime ---
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
