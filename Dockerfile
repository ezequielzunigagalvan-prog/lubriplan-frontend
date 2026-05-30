# ─────────────────────────────────────────
# Stage 1: build de la app React
# ─────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# La URL del API la inyectamos en build-time como ARG
# En docker-compose se pasa como build arg
ARG VITE_API_URL=http://localhost/api
ARG VITE_ASSETS_BASE_URL=http://localhost

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ASSETS_BASE_URL=$VITE_ASSETS_BASE_URL

RUN npm run build

# ─────────────────────────────────────────
# Stage 2: nginx sirve el bundle estático
# ─────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Config nginx personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Bundle generado por Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
