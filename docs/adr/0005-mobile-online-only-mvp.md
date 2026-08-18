---
Status: superseded by ADR-0008
---

# Mobile online-only no MVP

O app será usado em hospitais, onde a conexão é instável — o cenário clássico que pede offline-first. Mas offline-first (fila local + sincronização + resolução de conflitos) é caro demais para o orçamento de dois devs no MVP. Decidimos que o MVP exige conexão: operações falham com mensagem clara em vez de enfileirar. Offline com fila local entra na Fase 2.

**Consequências:** retrofit de offline depois é custoso — é uma escolha consciente de trade-off. Sem sinal, o registro de atividade não funciona no MVP.
