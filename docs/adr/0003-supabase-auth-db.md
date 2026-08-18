---
Status: superseded by ADR-0009 and ADR-0011
---

# Supabase para banco e autenticação

**Contexto:** Precisa de PostgreSQL + autenticação com boa DX.

**Decisão:** Supabase para ambos — Auth integrado (email + Google) e PostgreSQL gerenciado.

**Consequências:** + zero setup de infra, free tier generoso. − lock-in parcial no ecossistema Supabase.
