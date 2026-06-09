# RocketRush — single-origin container (Next.js app + Socket.io on one port).
FROM node:20-slim
WORKDIR /app

# install deps (uses package-lock for reproducible builds)
COPY package.json package-lock.json ./
RUN npm ci

# build
COPY . .
RUN npm run build

ENV NODE_ENV=production
# The host (Render/Railway) injects PORT; the server reads process.env.PORT.
EXPOSE 3000
CMD ["node", "server.mjs", "--prod"]
