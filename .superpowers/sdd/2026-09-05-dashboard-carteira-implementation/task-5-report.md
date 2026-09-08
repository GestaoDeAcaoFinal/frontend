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
