# FluxoMed 🏥💰

**Plataforma de Gestão Financeira Integrada para Profissionais da Saúde**

FluxoMed transforma o caos de múltiplas fontes de renda (plantões, consultas, procedimentos, vínculos fixos), diferentes regimes de contratação (CLT vs PJ) e prazos de pagamento variados em um painel de controle centralizado. Previsibilidade, cálculo de impostos e controle total sobre seus recebimentos.

## Stack

| Camada | Tecnologia |
|---|---|
| Mobile | React Native (Expo) |
| Backend | NestJS + Prisma ORM |
| Banco | PostgreSQL (Supabase) |
| Autenticação | Supabase Auth |
| Estrutura | Monorepo (npm workspaces) |

## Estrutura do Projeto

```
fluxomed/
├── apps/
│   ├── api/          # Backend NestJS
│   └── mobile/       # App React Native (Expo)
├── packages/
│   └── shared/       # Tipos e contratos compartilhados
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
# Clone
git clone https://github.com/lucasfimiani-cmd/FluxoMed.git
cd FluxoMed

# Instalar dependências
npm install

# Setup do banco (copie .env.example)
cp apps/api/.env.example apps/api/.env
npx prisma migrate dev

# Rodar backend
npm run dev -w apps/api

# Rodar mobile
npm run dev -w apps/mobile
```

## Licença

MIT