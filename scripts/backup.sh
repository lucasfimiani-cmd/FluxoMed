#!/usr/bin/env bash
# =============================================================================
# backup.sh — Backup diário de bancos SQLite das instâncias FluxoMed
#
# Uso:
#   ./scripts/backup.sh <instancia> [<instancia> ...]
#   ./scripts/backup.sh --todas
#
# Exemplos:
#   ./scripts/backup.sh clinica-abc dra-maria
#   ./scripts/backup.sh --todas
#
# Comportamento:
#   - Para cada instância, executa sqlite3 .backup para um arquivo com data
#   - Mantém apenas os 14 backups mais recentes por instância (prune)
#   - Idempotente: pode rodar múltiplas vezes no mesmo dia (sobrescreve)
#
# Variáveis de ambiente:
#   DB_DIR       Diretório onde estão os bancos SQLite (padrão: /data)
#   BACKUP_DIR   Diretório de destino dos backups (padrão: /var/backups/fluxomed)
#   RETENTION    Número de backups a manter (padrão: 14)
# =============================================================================

set -euo pipefail

# ─── Configuração ────────────────────────────────────────────────────────────
DB_DIR="${DB_DIR:-/data}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/fluxomed}"
RETENTION="${RETENTION:-14}"
DATE_SUFFIX=$(date +%Y%m%d-%H%M%S)

# ─── Funções ─────────────────────────────────────────────────────────────────

usage() {
  sed -n '3,16p' "$0" | sed 's/^# //; s/^#$//'
  exit 1
}

log() {
  echo "[backup] $(date '+%Y-%m-%d %H:%M:%S') $*"
}

# ─── Validação ───────────────────────────────────────────────────────────────

if [ $# -eq 0 ]; then
  usage
fi

if [ "$1" = "--todas" ]; then
  # Descobre instâncias pelos arquivos .db no diretório de dados
  if [ ! -d "$DB_DIR" ]; then
    log "ERRO: DB_DIR=$DB_DIR não encontrado"
    exit 1
  fi
  mapfile -t INSTANCIAS < <(find "$DB_DIR" -maxdepth 1 -name '*.db' -exec basename {} .db \; | sort)
  if [ ${#INSTANCIAS[@]} -eq 0 ]; then
    log "Nenhum banco encontrado em $DB_DIR"
    exit 0
  fi
else
  INSTANCIAS=("$@")
fi

# ─── Cria diretório de backup ────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ─── Backup por instância ────────────────────────────────────────────────────
for instancia in "${INSTANCIAS[@]}"; do
  db_path="$DB_DIR/${instancia}.db"

  if [ ! -f "$db_path" ]; then
    log "AVISO: Banco não encontrado para instância '$instancia' em $db_path — pulando"
    continue
  fi

  backup_file="${BACKUP_DIR}/${instancia}-${DATE_SUFFIX}.db"
  log "Backup de $instancia → $backup_file"

  # .backup é atômico/consistente — faz cópia dentro do SQLite com lock
  sqlite3 "$db_path" ".backup '$backup_file'"

  # Verifica integridade do backup
  if ! sqlite3 "$backup_file" "PRAGMA integrity_check;" 2>/dev/null | grep -q "^ok$"; then
    log "ERRO: Falha na verificação de integridade do backup de $instancia"
    rm -f "$backup_file"
    continue
  fi

  log "Backup de $instancia concluído com sucesso ($(du -h "$backup_file" | cut -f1))"
done

# ─── Prune: mantém apenas os RETENTION backups mais recentes ─────────────────
log "Prune: mantendo apenas os $RETENTION backups mais recentes por instância"

for instancia in "${INSTANCIAS[@]}"; do
  # Lista backups da instância ordenados por nome (que tem data), mais recente primeiro
  mapfile -t backups < <(find "$BACKUP_DIR" -maxdepth 1 -name "${instancia}-*.db" -type f | sort -r)

  if [ ${#backups[@]} -le "$RETENTION" ]; then
    continue
  fi

  # Remove os excedentes (a partir do índice RETENTION)
  for ((i = RETENTION; i < ${#backups[@]}; i++)); do
    log "Prune: removendo backup antigo ${backups[$i]}"
    rm -f "${backups[$i]}"
  done
done

log "Backup concluído para ${#INSTANCIAS[@]} instância(s)"