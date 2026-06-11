# Glass Bridge — single-image production build.
# Builds the client and server, then runs one Node process that serves the
# REST API, Socket.IO and the static client on one port (single-origin).

# ---- build client ----
FROM node:20-alpine AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- build server ----
FROM node:20-alpine AS server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app/server
ENV NODE_ENV=production
ENV CLIENT_DIR=public
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=server /app/server/dist ./dist
COPY server/migrations ./migrations
# Serve the built client from server/dist/public (single-origin).
COPY --from=client /app/client/dist ./dist/public
EXPOSE 4000
CMD ["node", "dist/index.js"]
