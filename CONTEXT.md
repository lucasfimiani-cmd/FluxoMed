# FluxoMed

Plataforma de gestão financeira para profissionais da saúde: registra atividades, projeta recebimentos e acompanha o fluxo de caixa realizado.

## Language

**Profissional**:
O usuário do FluxoMed — um profissional da saúde que administra suas próprias finanças.
_Avoid_: usuário, médico, cliente

**Perfil Fiscal**:
Pessoa física (PF) ou jurídica (PJ) ligada a um Profissional. Carrega o regime tributário e a alíquota que definem como a renda vinculada a ele é tributada.
_Avoid_: perfil, conta

**Fonte de Renda**:
Vínculo de trabalho ou local que gera renda para o Profissional, com regras de remuneração e prazo de pagamento próprios. Pertence a um Perfil Fiscal.
_Avoid_: local de trabalho, vínculo

**Atividade**:
Unidade de trabalho do Profissional (plantão, consulta ou procedimento) vinculada a uma Fonte de Renda. Seu valor é calculado pelas regras de remuneração da fonte. Ciclo: Agendada → Realizada → Recebida (derivada de um Recebimento) ou Cancelada.
_Avoid_: plantão, serviço, lançamento

**Recebimento**:
Entrada de dinheiro vinda de uma Fonte de Renda, com valor e data. Cobre um conjunto de Atividades; a diferença entre o valor depositado e a soma das atividades cobertas é registrada como ajuste/desconto.
_Avoid_: pagamento, depósito, baixa

**Atividade Recorrente**:
Atividade gerada automaticamente a cada mês por uma Fonte de Renda de remuneração fixa mensal (ex.: salário). Uniformiza o modelo: salário atrasado aparece em contas a receber como qualquer atividade.
_Avoid_: salário automático, lançamento mensal

**Meta Financeira**:
Valor-alvo mensal único do Profissional, acompanhado em duas dimensões: produção do mês (soma das atividades realizadas) e caixa recebido no mês.
_Avoid_: objetivo, orçamento

**Regime Tributário**:
Enquadramento fiscal de um Perfil Fiscal (ex.: Simples Nacional, Lucro Presumido, PF autônoma).
_Avoid_: enquadramento

**Alíquota Efetiva**:
Percentual informado pelo Profissional (ou seu contador) usado na projeção simples de imposto sobre os recebimentos. O app não calcula tributos por faixas ou anexos.
_Avoid_: alíquota nominal, imposto calculado

**Contas a Receber**:
Conjunto de Atividades realizadas ainda não cobertas por um Recebimento.
_Avoid_: pendências, a receber

**Fluxo de Caixa**:
Série mensal de valores recebidos (realizado) e de recebimentos esperados (projetado — derivado das atividades agendadas e realizadas, deslocadas pelo prazo de pagamento da fonte).
_Avoid_: demonstrativo, extrato
