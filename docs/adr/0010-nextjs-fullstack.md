---
Status: accepted
---

# Next.js fullstack no lugar de NestJS

O backend NestJS (ADR-0004) foi substituído por um único serviço Next.js — páginas e rotas de API no mesmo processo — com Prisma sobre SQLite. Motivo: uma imagem, um container e um processo por instância, o que simplifica operar N instâncias num servidor. O monorepo permanece (npm workspaces), agora com `apps/web` e `packages/shared`.
