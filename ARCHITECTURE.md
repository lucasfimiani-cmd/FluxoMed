# Arquitetura do FluxoMed

## ADRs (Architecture Decision Records)

### ADR-001: Mobile Nativo (Expo/React Native)

**Contexto:** App precisa de registro rápido de atividades no dia-a-dia e dashboard financeiro.

**Decisão:** React Native com Expo. Compartilha TypeScript com o backend via monorepo.

**Consequências:** + Curva de aprendizado única, tipos compartilhados. - Performance nativa inferior a Swift/Kotlin puro.

### ADR-002: Monorepo com npm Workspaces

**Contexto:** Dois devs colaborando, tipos compartilhados entre backend e mobile.

**Decisão:** Monorepo simples com npm workspaces (`apps/api`, `apps/mobile`, `packages/shared`).

**Consequências:** + Um `npm install`, CI unificado, types compartilhados. - Acoplamento entre pacotes.

### ADR-003: Supabase (Auth + DB)

**Contexto:** Precisa de PostgreSQL + autenticação com boa DX.

**Decisão:** Supabase para ambos. Auth integrado (email + Google), PostgreSQL gerenciado.

**Consequências:** + Zero setup de infra, free tier generoso. - Lock-in parcial no ecossistema Supabase.

### ADR-004: NestJS + Prisma

**Contexto:** Backend TypeScript com ORM maduro.

**Decisão:** NestJS pela estrutura opinada e modular. Prisma pela type safety e migrations.

**Consequências:** + Código consistente, migrations seguras. - Curva do NestJS para iniciantes.

## Fluxo de Dados

```
Mobile (Expo) → API (NestJS) → Prisma ORM → PostgreSQL (Supabase)
                                    ↕
                              Supabase Auth (JWT)
```