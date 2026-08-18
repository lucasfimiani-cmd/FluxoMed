# Alíquota efetiva informada pelo usuário; o app não calcula tributos

O pitch do produto fala em "cálculo de impostos", mas cálculo fiscal real (faixas de IRRF, anexos e fator R do Simples Nacional, presunções do Lucro Presumido) é complexo e muda com a legislação. Decidimos que o app **armazena** o regime tributário e a alíquota efetiva informados pelo Profissional e faz apenas projeção simples (recebimentos × alíquota = líquido estimado). Nenhum cálculo tributário no MVP.

**Consequências:** os valores são estimativas informadas pelo usuário/contador — o app não substitui contabilidade. Um leitor futuro pode querer "corrigir" o app adicionando cálculo de imposto; ver este ADR antes.
