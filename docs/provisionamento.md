# Provisionamento de Instância FluxoMed

Este documento descreve o passo a passo para provisionar uma nova instância
de cliente no ambiente de produção (VM única com Docker e Caddy).

## Pré-requisitos

- VM com Docker e Docker Compose instalados
- Caddy instalado e rodando como reverse proxy
- DNS wildcard `*.fluxomed.com` apontando para o IP da VM
- Imagem Docker construída: `docker build -t fluxomed:latest .`

## Passo a passo

### 1. Escolha o identificador do cliente

Use um slug curto e sem espaços. Exemplos:

- `clinica-abc`
- `dra-maria`
- `hospital-xyz`

### 2. Gere um segredo para a instância

```bash
openssl rand -base64 32
# Exemplo de saída: u3hF8kL9pQ2rX7vZ5yA4wN6mB1cD0eFg=
```

### 3. Crie o arquivo Compose da instância

```bash
cp docker-compose.cliente.yml docker-compose.clinica-abc.yml
```

Edite as variáveis no arquivo ou exporte-as no ambiente:

```bash
export CLIENTE=clinica-abc
export PORTA=3001
export AUTH_SECRET="u3hF8kL9pQ2rX7vZ5yA4wN6mB1cD0eFg="
```

### 4. Suba o container

```bash
docker compose -f docker-compose.clinica-abc.yml up -d
```

Isso cria:
- Um container chamado `fluxomed-clinica-abc`
- Um volume Docker `fluxomed-clinica-abc-data` com o SQLite em `/data/clinica-abc.db`
- O app escutando na porta `3001` (mapeada para `3000` interna)

### 5. Verifique se o container está rodando

```bash
docker ps --filter name=fluxomed-clinica-abc
docker logs fluxomed-clinica-abc
```

### 6. Configure o banco de dados

A primeira execução do app cria as tabelas automaticamente via Prisma.
Se precisar rodar migrations manualmente:

```bash
docker exec fluxomed-clinica-abc npx prisma migrate deploy --schema=apps/web/prisma/schema.prisma
```

### 7. Adicione a entrada no Caddyfile

Edite o `Caddyfile` da VM e adicione:

```
clinica-abc.fluxomed.com {
    reverse_proxy localhost:3001
}
```

### 8. Recarregue o Caddy

```bash
caddy reload
```

O TLS (Let's Encrypt) é obtido automaticamente na primeira requisição.

### 9. Crie o usuário inicial

Acesse `https://clinica-abc.fluxomed.com/register` e crie o primeiro usuário
(apenas um usuário por instância — ADR-0014).

## Resumo de arquivos por instância

| Recurso | Localização |
|---|---|
| Container | `fluxomed-<cliente>` |
| Volume | `fluxomed-<cliente>-data` |
| Banco | `/data/<cliente>.db` (dentro do volume) |
| Porta | `3XXX` (mapeada no compose) |
| Caddy | Entrada em `/etc/caddy/Caddyfile` |
| Backup | `scripts/backup.sh` (ver docs/backup-reset.md) |

## Atualização de imagem

```bash
# Na raiz do repositório
git pull
docker build -t fluxomed:latest .

# Para cada instância
docker compose -f docker-compose.<cliente>.yml up -d --pull missing
```