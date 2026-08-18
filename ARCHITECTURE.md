# Arquitetura do FluxoMed

As decisões de arquitetura vivem em [`docs/adr/`](./docs/adr/) — veja lá o histórico completo de ADRs.

## Fluxo de Dados

```
Mobile (Expo) → API (NestJS) → Prisma ORM → PostgreSQL (Supabase)
                                    ↕
                              Supabase Auth (JWT)
```
