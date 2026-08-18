---
Status: accepted
---

# Backup diário por cópia consistente

A VM única é um ponto único de falha aceito por design; a mitigação é backup. Um cron diário roda `sqlite3 .backup` por instância para um diretório de backups com retenção de 14 dias. Litestream/S3 entra quando perder até 24 horas for inaceitável.
