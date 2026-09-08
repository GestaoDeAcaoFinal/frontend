# Task 4 — Listagens e consultas com linguagem de mercado

## Resultado

As listagens de corretoras, ações e operações foram redesenhadas com a linguagem visual financeira compartilhada. A implementação mantém os fluxos funcionais existentes de consulta, filtros, carregamento, erro, vazio, retry e atualização de cotação.

O contêiner de cada página é `div.page-shell`, preservando o `<main>` único do shell da aplicação.

## Escopo implementado

- Corretoras: toolbar, CTA “Nova corretora”, consulta por ID/CNPJ, estados explícitos e tabela responsiva com ID tabular, razão social em destaque, CNPJ monoespaçado e localidade.
- Ações: toolbar, CTA “Nova ação”, consulta por ID/ticker, ticker badge, cotação formatada, data secundária, fallbacks “Indisponível”/“Não atualizada” e atualização individual com loading e erro por ação.
- Operações: filtros Todas/Compras/Vendas, histórico por ação e consulta por ID em painéis distintos; tabela financeira com badges COMPRA/VENDA, valores tabulares e lucro/prejuízo positivo ou negativo sem perder o fallback “Não informado”.
- Estilos globais: painéis com borda/elevação, cabeçalho de tabela escuro, hover discreto, badges, numerais tabulares, rolagem horizontal e adaptação do toolbar/tabelas até 760 px.
- Acessibilidade: headings associados por `aria-labelledby`, captions de tabela, estados com roles adequados, controles rotulados, foco visível e respeito a movimento reduzido.

## TDD

### RED

Foram adicionados primeiro os três contratos estruturais nas specs, ajustando o seletor do brief para `div.page-shell` por causa do landmark único do shell.

Comando:

```text
npm.cmd test -- --watch=false --browsers=ChromeHeadless --include=src/app/pages/corretora-list/corretora-list.component.spec.ts --include=src/app/pages/acao-list/acao-list.component.spec.ts --include=src/app/pages/operacao-list/operacao-list.component.spec.ts
```

Resultado esperado observado: **18 executados, 15 success, 3 failed**. Falhou um novo contrato por listagem, pela ausência das classes `.page-shell`, `.filter-panel`, `.btn-finance-primary`, `.finance-table` e `.trade-badge`.

O primeiro lançamento dentro do sandbox compilou os bundles, mas o processo do Chrome caiu antes de executar testes por indisponibilidade de GPU/perfil. A execução fora do sandbox iniciou o ChromeHeadless e produziu o RED válido acima.

### GREEN e validações isoladas

- `acao-list.component.spec.ts`: **4/4 success**.
- `operacao-list.component.spec.ts`: **9/9 success**.
- Três specs de listagem: **18/18 success**.

Os testes funcionais preexistentes continuaram cobrindo filtros, endpoints, retries, estados, validações, atualização individual e valores nulos.

## Verificação final

Suíte completa executada uma vez antes dos commits:

```text
npm.cmd test -- --watch=false --browsers=ChromeHeadless
```

Resultado: **77/77 success**, exit code 0.

`git diff --check` não encontrou erros de whitespace; o Git informou apenas a normalização configurada de LF para CRLF no Windows.

## Rodada de revisão 1

Os findings do review foram cobertos primeiro por testes de regressão. O RED focado executou **24 specs: 17 success e 7 failed**, reproduzindo:

- resultado antigo exibido junto com erro novo nas consultas diretas das três listas;
- resposta antiga de filtro sobrescrevendo a seleção mais recente em operações;
- ausência de retry no carregamento de ações do filtro histórico;
- fallbacks ausentes para razão social/localidade nullable;
- grupo de filtros sem papel semântico acessível.

A implementação tornou loading/erro/dado mutuamente exclusivos nos três resultados diretos, adicionou generation guard à listagem de operações, tornou `carregarAcoes()` um handler recuperável, adicionou retry no painel, fallbacks textuais e `role="group"` com nome acessível.

Validações após a correção:

- três specs focadas: **24/24 success**;
- suíte completa: **83/83 success**, exit code 0.

## Commits

- `7d6799c` — `chore: integrate frontend listing prerequisites` — somente os três `list.component.ts` funcionais preexistentes.
- `37c6d27` — `feat: style portfolio listings` — templates, specs, estilos e este relatório (commit da Task 4).
- `fix: address portfolio listings review feedback` — regressões e correções da rodada de review 1.

Nenhum push foi realizado. Ferramentas, logs, `openspec/`, `graphify-out/` e demais arquivos fora do escopo não foram staged.
