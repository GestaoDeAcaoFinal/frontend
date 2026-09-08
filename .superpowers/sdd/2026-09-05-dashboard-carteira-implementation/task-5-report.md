# Task 5 — Responsividade, conteúdo e verificação final

## Resultado

O acabamento final do frontend amplia o comportamento móvel compartilhado das páginas e aplica a preferência de movimento reduzido a todos os elementos. Rotas, integrações, nomes de propriedades, endpoints, enums e a estrutura de landmarks permaneceram inalterados.

`src/app/app.component.css` foi revisado integralmente. O breakpoint existente em 760 px já reorganiza marca, ação principal e navegação do cabeçalho; por isso não exigiu alteração. Os roots dos formulários e listagens continuam sendo `div.page-shell`, preservando o `<main>` único do shell, e a configuração de locale continua em `pt-BR`.

## Escopo implementado

- Em telas de até 760 px, `page-shell` passa a usar margem lateral total de 1 rem e `padding-top` de 1,25 rem.
- `list-toolbar` e `form-actions` são empilhados e esticados no breakpoint móvel.
- CTAs das toolbars e todos os controles de ação dos formulários ocupam a largura disponível no mobile.
- Com `prefers-reduced-motion: reduce`, rolagem suave é desativada e durações de transição/animação são reduzidas globalmente a `0,01 ms` com prioridade; o deslocamento no hover do botão primário continua neutralizado.
- `app.component.spec.ts` valida os efeitos calculados no navegador, sem depender apenas de busca textual no CSS.

Arquivos alterados pela Task 5:

- `src/styles.css`
- `src/app/app.component.spec.ts`
- `.superpowers/sdd/2026-09-05-dashboard-carteira-implementation/task-5-report.md`

## Revisão de conteúdo UTF-8

O comando literal do brief foi executado:

```powershell
Get-ChildItem src -Recurse -File | Select-String -Pattern 'Ã.|Â.|â€|�'
```

No Windows PowerShell 5.1, `Select-String` é case-insensitive por padrão. Assim, a alternativa `Ã.` também marcou ocorrências legítimas de `ã` em palavras como “ação”, “navegação” e “operação”. Uma segunda varredura sensível aos code points, lendo todos os arquivos explicitamente como UTF-8, isolou apenas `ÃO` no texto válido “GESTÃO DE INVESTIMENTOS”.

Conclusão: nenhuma sequência de mojibake ou caractere de substituição foi confirmada. Nenhum texto, template ou enum foi alterado.

## TDD

### Linha de base

Antes das alterações:

```text
npm.cmd test -- --watch=false --browsers=ChromeHeadless
```

Resultado: **83/83 success**, exit code 0, sem timeout ou desconexão do navegador.

### RED

Foram adicionados contratos de comportamento calculado para o breakpoint móvel e movimento reduzido. O primeiro lançamento dentro do sandbox falhou por `EPERM` ao tentar atualizar `.angular/cache`; ele não contou como RED. A repetição fora do sandbox compilou normalmente e produziu o RED válido:

- teste focado: **7 executados, 5 success e 2 failed**;
- `page-shell` manteve `padding-top: 36px` em vez de `20px`;
- `form-actions` manteve direção `row` e alinhamento `center`;
- a ação do formulário manteve largura intrínseca (`16px`) em vez da largura do contêiner (`700px`);
- o probe de acessibilidade manteve `scroll-behavior: smooth`, `transition-duration: 2s` e `animation-duration: 2s`.

A largura do `page-shell` recebeu um RED isolado adicional: sem a nova declaração móvel, a largura calculada foi `700px`, em vez dos `716px` esperados no viewport do Chrome Headless.

### GREEN

Após a implementação mínima em `src/styles.css`:

```text
npm.cmd test -- --watch=false --browsers=ChromeHeadless --include=src/app/app.component.spec.ts
```

Resultado: **7/7 success**, exit code 0.

## Verificação final

Suíte completa:

```text
npm.cmd test -- --watch=false --browsers=ChromeHeadless
```

Resultado: **84/84 success**, exit code 0, sem falha, timeout ou navegador desconectado.

Build de produção:

```text
npm.cmd run build
```

Resultado: exit code 0; artefatos gerados em `dist/gestao-acao-front`.

Avisos não bloqueantes registrados pelo build:

- bundle inicial de **628,46 kB**, excedendo o budget de 500,00 kB em **128,46 kB**;
- quatro regras do Bootstrap ignoradas por erros de seletor do otimizador: `.form-floating>~label`, duas ocorrências de `.btn-group>+.btn` e `.btn-group-vertical>+.btn`.

Não houve erro de template, CSS ou TypeScript. Nenhuma métrica além das exibidas pelos comandos foi inferida.

`git diff --check` terminou sem whitespace inválido. Os únicos avisos foram de normalização LF para CRLF no Windows.

## Isolamento e commit

Durante esta Task 5, todas as escritas de código/documentação foram direcionadas exclusivamente ao repositório `gestao-acao-front`; nenhuma dependência foi adicionada e nenhum arquivo do backend foi editado. O repositório backend possui alterações próprias preexistentes e fora deste escopo, que foram apenas observadas por uma consulta de status somente leitura.

O commit final será criado com a mensagem `fix: polish responsive portfolio interface`, sem push. O hash será informado no handoff após a criação, evitando uma referência circular dentro do próprio commit.

## Onda final de correções do review

Após a revisão do branch completo, quatro findings adicionais foram reproduzidos e corrigidos sem alterar rotas, contratos de serviço ou estado compartilhado:

1. Os cartões de resultado dos formulários de corretora, ação e operação agora são exibidos apenas quando o sucesso ainda é o estado corrente. Como `toLoadingState` e `toErrorState` preservam `data` deliberadamente para outros fluxos, a correção ficou nos templates: loading e erro ocultam o resultado anterior sem mudar a semântica global de `RequestState`.
2. A configuração de testes em `angular.json` passou a carregar o Bootstrap antes de `src/styles.css`, reproduzindo a mesma cascata da produção. Os seletores de foco de `.form-control`, `.form-select` e `.form-check-input` ganharam especificidade suficiente para aplicar um outline esmeralda opaco de 3 px. O teste cobre as três classes reais em fundos claro e escuro e exige contraste mínimo de 3:1.
3. As três tabelas financeiras passaram a usar `table-hover`. `finance-table` define `--bs-table-hover-bg` e `--bs-table-hover-color`, integrando o hover ao mecanismo de células/inset shadow do Bootstrap. As cores de lucro e prejuízo usam seletores de célula suficientemente específicos para vencer a regra de cor da tabela.
4. As tabelas de ações e operações agora exibem a coluna ID como primeira coluna, com cabeçalho e células usando `.numeric`.

A consulta à documentação atual do Bootstrap 5.3 via Context7 confirmou que controles de formulário usam variáveis/regras próprias de focus border e box-shadow, enquanto variantes e hover de tabelas são aplicados por `--bs-table-*` nas células com inset box-shadow. Isso orientou a correção na camada correta da cascata.

### TDD da onda final

Configuração e testes foram alterados antes dos templates/CSS. A rodada RED focada executou 42 testes:

- **35 success e 7 failed**;
- os três cartões antigos continuaram visíveis durante a segunda submissão e após erro;
- controles Bootstrap calcularam `outline-style: none` e `outline-width: 0px`;
- ações/operações não tinham `table-hover`, mantinham `--bs-table-hover-bg` padrão e lucro/prejuízo calculavam cor preta;
- as primeiras colunas de ações/operações eram Ticker/Data, não ID.

O contrato de hover da listagem de corretoras recebeu um RED isolado adicional. Após corrigir o setup para o serviço entregar uma lista, foram observados **6 success e 1 failed**, especificamente pela ausência de `table-hover` e pela variável de hover padrão.

Depois da implementação mínima, a rodada GREEN com as sete specs afetadas executou **49/49 success**.

### Verificação da onda final

```text
npm.cmd test -- --watch=false --browsers=ChromeHeadless
```

Resultado final: **87/87 success**, exit code 0, sem falha, timeout ou navegador desconectado.

```text
npm.cmd run build
```

Resultado final: exit code 0. Bundle inicial de **628,89 kB**, excedendo o budget de 500,00 kB em **128,90 kB**. Permanecem os mesmos quatro avisos não bloqueantes de seletores Bootstrap ignorados pelo otimizador: `.form-floating>~label`, duas ocorrências de `.btn-group>+.btn` e `.btn-group-vertical>+.btn`.

O commit desta onda final será criado com a mensagem `fix: resolve final portfolio review findings`, sem push; seu hash será informado no handoff.
