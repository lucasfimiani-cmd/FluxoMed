# Monorepo com npm workspaces

**Contexto:** Dois devs colaborando; tipos compartilhados entre backend e mobile.

**Decisão:** Monorepo com npm workspaces — `apps/web`, `packages/shared` (a API separada sai com o ADR-0010).

**Consequências:** + um `npm install`, CI unificado, tipos compartilhados. − acoplamento entre pacotes.
