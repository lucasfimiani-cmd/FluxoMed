# Backup e Reset de Senha — FluxoMed

## Backup Diário

O script `scripts/backup.sh` realiza backup consistente de cada banco SQLite
de instância usando `sqlite3 .backup` (cópia atômica com lock de escrita).

### Agendamento (cron)

Adicione a seguinte linha no crontab da VM (roda todo dia às 03:00):

```cron
0 3 * * * /caminho/para/fluxomed/scripts/backup.sh --todas >> /var/log/fluxomed-backup.log 2>&1
```

Para instâncias específicas:

```cron
0 3 * * * /caminho/para/fluxomed/scripts/backup.sh clinica-abc dra-maria >> /var/log/fluxomed-backup.log 2>&1
```

### Configuração

| Variável     | Padrão                    | Descrição                              |
|-------------|---------------------------|----------------------------------------|
| `DB_DIR`    | `/data`                   | Diretório com os bancos SQLite         |
| `BACKUP_DIR`| `/var/backups/fluxomed`   | Diretório de destino dos backups       |
| `RETENTION` | `14`                      | Número de backups a manter por instância |

### Formato dos arquivos

```
/var/backups/fluxomed/
├── clinica-abc-20260818-030000.db
├── clinica-abc-20260817-030000.db
├── dra-maria-20260818-030000.db
└── dra-maria-20260817-030000.db
```

### Verificação manual

```bash
# Backup de uma instância específica
./scripts/backup.sh clinica-abc

# Backup de todas as instâncias
./scripts/backup.sh --todas

# Verificar integridade de um backup
sqlite3 /var/backups/fluxomed/clinica-abc-20260818-030000.db "PRAGMA integrity_check;"
```

### Restauração

```bash
# 1. Pare o container da instância
docker stop fluxomed-clinica-abc

# 2. Copie o backup para o lugar do banco atual
docker cp /var/backups/fluxomed/clinica-abc-20260818-030000.db \
  fluxomed-clinica-abc:/data/clinica-abc.db

# 3. Inicie o container novamente
docker start fluxomed-clinica-abc
```

---

## Reset de Senha

O script `scripts/reset-senha.ts` redefine a senha de um usuário usando o
mesmo formato de hash scrypt da aplicação (`scrypt$salt$hash`).

### Uso

```bash
# Pelo caminho do banco
npx tsx scripts/reset-senha.ts maria@exemplo.com "Nova@Senha123" /data/clinica-abc.db

# Pela variável de ambiente
DATABASE_PATH=/data/clinica-abc.db npx tsx scripts/reset-senha.ts maria@exemplo.com "Nova@Senha123"

# Ou DATABASE_URL
DATABASE_URL="file:/data/clinica-abc.db" npx tsx scripts/reset-senha.ts maria@exemplo.com "Nova@Senha123"
```

### Pré-requisitos

- Node.js 22+
- Prisma Client gerado (`npx prisma generate --schema=apps/web/prisma/schema.prisma`)
- O script deve ser executado da raiz do monorepo (para resolver `@prisma/client`)

### Exemplo completo

```bash
# Acesse a VM, entre no diretório do repositório
cd /opt/fluxomed

# Redefina a senha
npx tsx scripts/reset-senha.ts contato@clinicaabc.com.br "minhaNovaSenha@123" /data/clinica-abc.db

# Saída esperada:
# Senha redefinida com sucesso para contato@clinicaabc.com.br.
```

### Com Docker

```bash
# Copie o script para o container e execute
docker cp scripts/reset-senha.ts fluxomed-clinica-abc:/tmp/reset-senha.ts
docker exec fluxomed-clinica-abc npx tsx /tmp/reset-senha.ts \
  maria@exemplo.com "Nova@Senha123" /data/clinica-abc.db
```