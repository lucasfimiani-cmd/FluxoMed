---
Status: accepted
---

# Autenticação local: email + senha

Sem dependências externas — o Supabase Auth saiu junto com o Supabase (ADR-0003). Credenciais e sessões vivem no SQLite da própria instância, com sessão em cookie assinado. Recuperação de senha no MVP é manual (o admin da VM reseta); envio de email automatizado vira configuração SMTP externa opcional depois. OAuth não entra no MVP.
