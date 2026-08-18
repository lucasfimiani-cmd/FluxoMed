---
Status: accepted
---

# Instância por cliente, SQLite por instância

SaaS multi-instância rodando inteiro numa única VM (Docker). Decidimos que cada cliente — um Profissional individual — recebe uma instância isolada: container próprio + arquivo SQLite próprio, sem compartilhamento de banco ou processo. Isolamento total entre clientes (dado financeiro exige) e backup por cópia de arquivo. A alternativa (app único multi-tenant com `tenant_id`) foi rejeitada pelo risco de vazamento entre tenants e pelo acoplamento em upgrades.
