---
Status: accepted
---

# Caddy + subdomínio por cliente

Cada instância é exposta em `cliente.fluxomed.com`, roteada por um único Caddy na VM (DNS wildcard, TLS automático via Let's Encrypt por subdomínio). Provisionamento é manual no MVP: um compose por cliente + uma entrada no Caddyfile + reload. Um script/CLI de provisionamento pode automatizar isso depois sem mudar a arquitetura.
