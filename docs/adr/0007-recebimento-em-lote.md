# Recebimento em lote com reconciliação desde o MVP

Pagamentos reais chegam como depósitos mensais cobrindo várias atividades, muitas vezes com descontos que não batem com a soma dos valores. A alternativa mais simples (marcar cada atividade como recebida individualmente) não representa isso. Decidimos que `Recebimento` é entidade de primeira classe desde o MVP: valor + data + fonte de renda, cobrindo um conjunto de Atividades; a diferença entre o depósito e a soma das atividades cobertas é registrada como ajuste/desconto. O status `RECEBIDA` de uma atividade é **derivado** da cobertura por um Recebimento — nunca marcado manualmente.

**Consequências:** modelo fiel à realidade desde o dia 1, mas com UX e API mais complexas que a marcação por atividade.
