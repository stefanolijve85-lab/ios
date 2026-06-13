# ---- Build stage ----------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# Install deps (cached unless package files change)
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Build the Next.js app
COPY . .
RUN npm run build

# ---- Runtime stage --------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy only what we need to run the custom server.
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json* ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/server ./server
COPY --from=build /app/next.config.js ./next.config.js

EXPOSE 3000
CMD ["node", "server.js"]
