---
Status: accepted
---

# Usuário único por instância no MVP

O registro aceita exatamente um usuário por instância: `register` bloqueia quando já existe qualquer usuário no banco. É consequência direta do modelo de instância-por-cliente (ADR-0009) — cada instância serve um único Profissional, então múltiplas contas por instância não têm função no MVP.

Multi-usuário (sócios, secretária com permissão própria) fica fora do MVP; quando necessário, entra com papéis/permissões próprios.
