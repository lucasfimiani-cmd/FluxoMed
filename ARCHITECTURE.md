# Arquitetura do FluxoMed

As decisões de arquitetura vivem em [`docs/adr/`](./docs/adr/) — veja lá o histórico completo de ADRs.

## Fluxo de Dados

```
Navegador → Caddy (cliente.fluxomed.com) → Next.js (apps/web) → Prisma ORM → SQLite (arquivo por instância)
```

## Topologia de Implantação

VM única (Docker):

```
├── Caddy              # TLS automático + roteamento por subdomínio
├── cliente-1          # container fluxomed-web + volume SQLite
├── cliente-2          # container fluxomed-web + volume SQLite
├── ...
└── cron               # sqlite3 .backup diário por instância (retenção 14 dias)
```
