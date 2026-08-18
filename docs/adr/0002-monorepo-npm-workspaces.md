# Monorepo com npm workspaces

**Contexto:** Dois devs colaborando; tipos compartilhados entre backend e mobile.

**Decisão:** Monorepo com npm workspaces — `apps/api`, `apps/mobile`, `packages/shared`.

**Consequências:** + um `npm install`, CI unificado, tipos compartilhados. − acoplamento entre pacotes.
