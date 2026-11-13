import { randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

// Credenciais exclusivamente sintéticas, recriadas no H2 a cada execução.
const API = 'http://127.0.0.1:18080';
const ADMIN = { username: 'e2e_admin', password: 'E2e-only-admin-123!' };
const PASSWORD = 'E2e-only-user-123!';
type Account = { id: number; username: string; password: string; papel: 'ADMIN' | 'USER' };
let adminToken: string;
let account: Account;

async function tokenFor(request: APIRequestContext, username: string, password = PASSWORD): Promise<string> {
  const response = await request.post(`${API}/api/auth/login`, { data: { username, password } });
  expect(response.status()).toBe(200);
  return (await response.json()).token;
}
function headers(token: string) { return { Authorization: `Bearer ${token}` }; }
async function createAccount(request: APIRequestContext, papel: 'ADMIN' | 'USER' = 'USER'): Promise<Account> {
  const username = `e2e_${randomUUID().slice(0, 8)}`;
  const response = await request.post(`${API}/api/usuarios`, {
    headers: headers(adminToken), data: { username, password: PASSWORD, papel }
  });
  expect(response.status()).toBe(201);
  return { ...(await response.json()), password: PASSWORD };
}
async function login(page: Page, username: string, password = PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('Usuário', { exact: true }).fill(username);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
}
async function trade(page: Page, type: 'Compra' | 'Venda', quantity: number, price: number) {
  await page.goto('/operacoes/nova');
  await page.getByLabel('Ação', { exact: true }).selectOption({ label: 'PETR4 — Empresa E2E PETR4' });
  await page.getByLabel(type, { exact: true }).check();
  await page.getByLabel('Quantidade', { exact: true }).fill(String(quantity));
  await page.getByLabel(type === 'Compra' ? 'Preço de compra' : 'Preço de venda', { exact: true }).fill(String(price));
  await page.getByRole('button', { name: 'Revisar operação', exact: true }).click();
  await page.getByRole('button', { name: type === 'Compra' ? 'Confirmar compra' : 'Confirmar venda', exact: true }).click();
}

test.beforeEach(async ({ request }) => {
  adminToken = await tokenFor(request, ADMIN.username, ADMIN.password);
  account = await createAccount(request);
});

test('login, rota protegida e permissão USER são aplicados no navegador e na API', async ({ page, request }) => {
  await page.goto('/carteira');
  await expect(page).toHaveURL(/\/login\?returnUrl=/);
  await page.getByLabel('Usuário', { exact: true }).fill(account.username);
  await page.getByLabel('Senha', { exact: true }).fill('senha-incorreta');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await login(page, account.username);
  await expect(page.getByRole('link', { name: 'Usuários', exact: true })).toHaveCount(0);
  await page.goto('/usuarios');
  await expect(page).toHaveURL('http://127.0.0.1:4300/');
  const userToken = await tokenFor(request, account.username);
  expect((await request.get(`${API}/api/usuarios`, { headers: headers(userToken) })).status()).toBe(403);
});

test('interface impede rebaixar ou desativar o último ADMIN', async ({ page, request }) => {
  await login(page, ADMIN.username, ADMIN.password);
  await page.goto('/usuarios');
  await page.getByRole('row').filter({ hasText: ADMIN.username }).getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByLabel('Permissão', { exact: true }).selectOption('USER');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('administrador ativo');
  await page.getByLabel('Permissão', { exact: true }).selectOption('ADMIN');
  await page.getByLabel('Usuário ativo').uncheck();
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('administrador ativo');
  expect((await request.get(`${API}/api/usuarios`, { headers: headers(adminToken) })).status()).toBe(200);
});

test('troca de senha identifica o alvo e invalida sua sessão anterior', async ({ page, request }) => {
  const oldToken = await tokenFor(request, account.username);
  await login(page, ADMIN.username, ADMIN.password);
  await page.goto('/usuarios');
  await page.getByRole('row').filter({ hasText: account.username }).getByRole('button', { name: 'Alterar senha', exact: true }).click();
  await expect(page.getByTestId('senha-destinatario')).toContainText(account.username);
  await expect(page.getByTestId('senha-destinatario')).toContainText('USER');
  const newPassword = 'E2e-only-new-password-123!';
  await page.getByLabel('Nova senha (8 a 72 caracteres)', { exact: true }).fill(newPassword);
  await page.locator('form').filter({ has: page.locator('#nova-senha') })
    .getByRole('button', { name: 'Alterar senha', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Senha alterada');
  expect((await request.get(`${API}/acoes`, { headers: headers(oldToken) })).status()).toBe(401);
  expect((await request.post(`${API}/api/auth/login`, { data: { username: account.username, password: PASSWORD } })).status()).toBe(401);
  await login(page, account.username, newPassword);
});

test('compra de um investidor não aparece na carteira, histórico ou consulta de outro', async ({ page, request, browser }) => {
  await login(page, account.username);
  await trade(page, 'Compra', 10, 20);
  await expect(page.getByRole('heading', { name: 'Operação registrada', exact: true })).toBeVisible();
  await page.goto('/carteira');
  await expect(page.getByTestId('posicao-PETR4').locator('td').nth(1)).toHaveText('10');
  const ownerToken = await tokenFor(request, account.username);
  const owned = await (await request.get(`${API}/operacoes`, { headers: headers(ownerToken) })).json();
  const other = await createAccount(request);
  const otherToken = await tokenFor(request, other.username);
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4300' });
  try {
    const otherPage = await context.newPage();
    await login(otherPage, other.username);
    await otherPage.goto('/carteira');
    await expect(otherPage.getByText('Nenhuma ação em posse', { exact: false })).toBeVisible();
    for (const path of ['/operacoes', `/operacoes/${owned[0].acao.id}`, '/operacoes/compras', '/operacoes/vendas']) {
      const response = await request.get(`${API}${path}`, { headers: headers(otherToken) });
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual([]);
    }
    expect((await request.get(`${API}/operacoes/buscar/${owned[0].id}`, { headers: headers(otherToken) })).status()).toBe(404);
    await trade(otherPage, 'Venda', 1, 30);
    await expect(otherPage.getByRole('alert')).toContainText('Não existe posição comprada');
    const adminWallet = await (await request.get(`${API}/operacoes/carteira`, { headers: headers(adminToken) })).json();
    expect(adminWallet.posicoes).toEqual([]);
  } finally { await context.close(); }
});

test('venda respeita saldo, preserva formulário após erro e atualiza a posição', async ({ page }) => {
  await login(page, account.username);
  await trade(page, 'Compra', 10, 20);
  await expect(page.getByRole('heading', { name: 'Operação registrada', exact: true })).toBeVisible();
  await trade(page, 'Venda', 11, 30);
  await expect(page.getByRole('alert')).toContainText('excede a posição disponível');
  await expect(page.getByLabel('Quantidade', { exact: true })).toHaveValue('11');
  await page.getByRole('button', { name: 'Voltar e editar', exact: true }).click();
  await page.getByLabel('Quantidade', { exact: true }).fill('4');
  await page.getByRole('button', { name: 'Revisar operação', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar venda', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Operação registrada', exact: true })).toBeVisible();
  await page.goto('/carteira');
  await expect(page.getByTestId('posicao-PETR4').locator('td').nth(1)).toHaveText('6');
  await expect(page.getByTestId('posicao-PETR4').locator('td').nth(2)).toContainText('20,00');
});

test('mudança de perfil/status encerra acesso e reativação não revive token antigo', async ({ page, request }) => {
  const target = await createAccount(request, 'ADMIN');
  await login(page, target.username);
  await page.goto('/usuarios');
  await expect(page.getByRole('heading', { name: 'Usuários', exact: true })).toBeVisible();
  const update = async (ativo: boolean) => {
    const response = await request.put(`${API}/api/usuarios/${target.id}`, {
      headers: headers(adminToken), data: { username: target.username, papel: 'USER', ativo }
    });
    expect(response.status()).toBe(200);
  };
  await update(true);
  await page.goto('/acoes');
  await expect(page).toHaveURL(/\/login/);
  await login(page, target.username);
  const userToken = await tokenFor(request, target.username);
  await update(false);
  await page.goto('/carteira');
  await expect(page).toHaveURL(/\/login/);
  await update(true);
  expect((await request.get(`${API}/acoes`, { headers: headers(userToken) })).status()).toBe(401);
});

test('atualização geral comunica falha parcial do provedor sem encerrar o login', async ({ page, request }) => {
  const catalog = await (await request.get(`${API}/acoes`, { headers: headers(adminToken) })).json();
  await login(page, ADMIN.username, ADMIN.password);
  await page.getByRole('button', { name: 'Atualizar todas as cotações', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'cotações atualizadas' }))
    .toContainText(`${catalog.length - 1} de ${catalog.length} cotações atualizadas.`);
  await expect(page.getByRole('alert').filter({ hasText: 'ERRO3' })).toContainText('autenticação');
  await expect(page).not.toHaveURL(/\/login/);
  const stats = await (await request.get('http://127.0.0.1:19090/__e2e/stats')).json();
  expect(stats['/api/quote/PETR4']).toBeGreaterThan(0);
  expect(stats['/api/quote/ERRO3']).toBeGreaterThan(0);
});

test('ADMIN cadastra ação pelo formulário com cotação obtida pelo backend', async ({ page, request }) => {
  await login(page, ADMIN.username, ADMIN.password);
  await page.goto('/acoes/nova');
  await page.getByLabel('Ticker', { exact: true }).fill('roxo34');
  await page.getByLabel('Corretora', { exact: true }).selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Salvar ação', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ação cadastrada', exact: true })).toBeVisible();
  await expect(page.locator('.result-card')).toContainText('ROXO34');
  const catalog = await (await request.get(`${API}/acoes`, { headers: headers(adminToken) })).json();
  expect(catalog.find((stock: { ticker: string }) => stock.ticker === 'ROXO34')?.cotacaoAtual).toBe(30);
});

test('revisão preserva preço fracionário, total e foco antes de registrar no backend', async ({ page, request }) => {
  await login(page, account.username);
  await page.goto('/operacoes/nova');
  await page.getByLabel('Ação', { exact: true }).selectOption({ label: 'PETR4 — Empresa E2E PETR4' });
  await page.getByLabel('Quantidade', { exact: true }).fill('100');
  await page.getByLabel('Preço de compra', { exact: true }).fill('35.125');
  await page.getByRole('button', { name: 'Revisar operação', exact: true }).click();
  await expect(page.locator('.operation-review')).toContainText('35,125');
  await expect(page.getByTestId('review-total')).toContainText('3.512,50');
  await expect(page.getByRole('heading', { name: 'Confira sua operação.', exact: true })).toBeFocused();
  await page.getByTestId('editar-operacao').click();
  await expect(page.getByLabel('Ação', { exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Revisar operação', exact: true }).click();
  await page.getByTestId('confirmar-operacao').click();
  await expect(page.getByRole('heading', { name: 'Operação registrada', exact: true })).toBeFocused();
  const ownerToken = await tokenFor(request, account.username);
  const operations = await (await request.get(`${API}/operacoes`, { headers: headers(ownerToken) })).json();
  expect(operations).toHaveLength(1);
  expect(operations[0].precoUnitario).toBe(35.125);
  expect(operations[0].valorTotal).toBe(3512.5);
  await page.getByRole('button', { name: 'Nova operação', exact: true }).click();
  await expect(page.getByLabel('Ação', { exact: true })).toBeFocused();
});

test('distribuição interativa permanece utilizável em desktop e celular', async ({ page, request }, testInfo) => {
  const token = await tokenFor(request, account.username);
  const catalog = await (await request.get(`${API}/acoes`, { headers: headers(token) })).json();
  for (const [ticker, quantidade] of [['PETR4', 10], ['VALE3', 4], ['TAEE11', 1]] as const) {
    const stock = catalog.find((item: { ticker: string }) => item.ticker === ticker);
    expect(stock).toBeDefined();
    const response = await request.post(`${API}/operacoes/comprar/${stock.id}`, {
      headers: headers(token), params: { quantidade, precoCompra: 20 }
    });
    expect(response.status()).toBe(200);
  }
  await login(page, account.username);
  await expect(page.locator('.allocation-segment')).toHaveCount(3);
  await page.locator('.allocation-legend__button').filter({ hasText: 'VALE3' }).click();
  await expect(page.getByTestId('allocation-detail')).toContainText('VALE3');
  await page.screenshot({ path: testInfo.outputPath('dashboard-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.allocation-legend__button').filter({ hasText: 'TAEE11' })).toBeVisible();
  await page.locator('.allocation-legend__button').filter({ hasText: 'TAEE11' }).click();
  await expect(page.getByTestId('allocation-detail')).toContainText('TAEE11');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('dashboard-mobile.png'), fullPage: true });
});
