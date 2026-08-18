## Agent skills

### Issue tracker

Issues and PRDs live as GitHub issues in this repo (`github.com/lucasfimiani-cmd/FluxoMed`); external PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage roles map to their default label strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Orçamento de contexto por sessão

Limite rígido por sessão de agente (orquestrador e especialistas): **min(200k tokens, 20% do contexto do modelo)**.

- Antes de iniciar uma nova lane ou ticket, estime o uso acumulado da sessão (volume de histórico + saídas de ferramentas). Acima de **80% do limite**, não inicie trabalho novo.
- Ao atingir o gatilho: rode a skill `/handoff` para comprimir o estado (tickets concluídos/em andamento, decisões, próximo passo) em um documento do repo e inicie uma **nova sessão de orquestrador** que retoma a partir do handoff + Background Job Board.
- Especialistas seguem o mesmo limite por sessão. Prefira sessão nova com escopo limitado a reutilizar sessão inchada; reutilize apenas quando o ganho de contexto for claro e dentro do limite.
