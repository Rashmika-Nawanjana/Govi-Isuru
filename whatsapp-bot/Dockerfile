# Baileys speaks the WhatsApp multi-device protocol over a WebSocket, so this
# image needs no headless browser - only Node and ffmpeg for voice notes.
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --prefer-offline --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app

# WhatsApp voice notes are OGG/Opus; Google STT wants LINEAR16 and TTS
# returns MP3. Every hop needs ffmpeg - without it voice fails silently.
RUN apk add --no-cache ffmpeg wget

COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Auth state is mounted from a named volume so a redeploy does not force
# a re-pair. Owned by the non-root user that actually writes to it.
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 \
  && mkdir -p /app/auth_state \
  && chown -R nodejs:nodejs /app/auth_state
USER nodejs

EXPOSE 7000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:7000/health || exit 1

CMD ["node", "index.js"]
