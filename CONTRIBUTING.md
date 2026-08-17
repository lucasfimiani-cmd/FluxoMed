# Contribuindo com o FluxoMed

## Setup Local

```bash
git clone https://github.com/lucasfimiani-cmd/FluxoMed.git
cd FluxoMed
npm install
```

## Workflow de Desenvolvimento

1. Escolha uma issue do milestone atual
2. Crie uma branch a partir de `main`: `git checkout -b feat/nome-da-feature`
3. Faça alterações seguindo o padrão existente
4. Commit com mensagens claras (pt-BR ou en)
5. Abra um Pull Request para `main`

## Padrões

- **TypeScript estrito** — sempre tipado
- **Testes** — toda lógica de negócio deve ter teste unitário
- **PR pequeno** — uma issue por PR
- **Code review** — pelo menos 1 aprovação antes de merge

## Issues

- Issues estão organizadas por épico e milestone
- Cada issue tem critério de aceite explícito
- Mova a issue para "In Progress" quando começar a trabalhar