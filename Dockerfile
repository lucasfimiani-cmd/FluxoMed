# =============================================================================
# Dockerfile — FluxoMed (monorepo Next.js)
# Multi-stage build: Node 22, npm workspaces, saída standalone.
# =============================================================================

# ─── Stage 1: Instalação de dependências ─────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Copia apenas os manifests para aproveitar cache de camadas
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Instala TODAS as dependências (dev inclusas) para o build
RUN npm ci

# ─── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Copia node_modules do stage anterior (tudo hoisted na raiz)
COPY --from=deps /app/node_modules ./node_modules

# Copia o restante do código-fonte
COPY . .

# Gera o Prisma Client e faz o build
RUN npx prisma generate --schema=apps/web/prisma/schema.prisma \
  && npm run build

# ─── Stage 3: Runtime ────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Cria usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copia o build standalone do Next.js
COPY --from=build --chown=nextjs:nodejs \
  /app/apps/web/.next/standalone ./

# Copia os assets estáticos
COPY --from=build --chown=nextjs:nodejs \
  /app/apps/web/.next/static ./apps/web/.next/static

# ─── Prisma: engine + CLI + migrations ───────────────────────────────────────
# O standalone traça o engine nativo (.prisma/client), mas a CLI (prisma)
# e suas dependências transitivas não são incluídas. Copiamos node_modules
# do build para garantir que prisma migrate deploy funcione em produção.
COPY --from=build --chown=nextjs:nodejs \
  /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs \
  /app/apps/web/prisma ./apps/web/prisma

# Diretório para o banco SQLite (montado como volume)
RUN mkdir -p /data && chown nextjs:nodejs /data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]