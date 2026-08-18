# FluxoMed 🏥💰

**Plataforma de Gestão Financeira Integrada para Profissionais da Saúde**

FluxoMed transforma o caos de múltiplas fontes de renda (plantões, consultas, procedimentos, vínculos fixos), diferentes regimes de contratação (CLT vs PJ) e prazos de pagamento variados em um painel de controle centralizado. Previsibilidade, cálculo de impostos e controle total sobre seus recebimentos.

## Stack

| Camada | Tecnologia |
|---|---|
| Web | Next.js (fullstack) |
| Banco | SQLite (Prisma ORM) |
| Autenticação | Local (email + senha) |
| Implantação | Docker + Caddy (VM única, instância por cliente) |
| Estrutura | Monorepo (npm workspaces) |

## Estrutura do Projeto

```
fluxomed/
├── apps/
│   └── web/          # Aplicação Next.js (fullstack)
├── packages/
│   └── shared/       # Tipos e contratos compartilhados
├── deploy/           # Caddy + compose por instância + backup
├── package.json      # Workspace root
└── ...
```

## Funcionalidades

### MVP (Fase 1)
- **Onboarding Fiscal** — Cadastro de perfil (PF, PJ ou ambos), regime tributário e alíquota
- **Gestão de Fontes de Renda** — Locais de trabalho com regras de remuneração e pagamento
- **Registro de Atividades** — Plantões, consultas, procedimentos com controle de status
- **Dashboard Financeiro** — Fluxo de caixa mensal (realizado vs projetado), contas a receber
- **Metas Financeiras** — Definição de meta mensal e acompanhamento de progresso

### Fase 2
- Simulador de ganhos com sugestão de atividades
- Integração com calendários externos
- Custos logísticos por fonte de renda

### Fase 3
- Open Finance para baixa automática de recebimentos
- Antecipação de recebíveis
- Hub de serviços parceiros (contabilidade, seguros)

## Como Rodar

```bash
# Build da imagem
docker build -t fluxomed-web:v1 .

# Provisionar uma instância (um compose por cliente + entrada no Caddyfile)
# Ex.: cliente1.fluxomed.com → container fluxomed-web com volume SQLite próprio

# Backup diário por instância
sqlite3 /data/cliente1/fluxomed.db ".backup '/backups/cliente1-$(date +%F).db'"
```

Veja a topologia completa em [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Licença

MIT