import { test, expect } from "@playwright/test";

const TEST_USER = {
  name: "Maria Teste",
  email: "e2e@fluxomed.test",
  password: "senha12345",
};

async function selectOptionByText(page: any, selectId: string, text: string) {
  const option = page.locator(`#${selectId} option:has-text("${text}")`);
  const value = await option.getAttribute("value");
  if (value) {
    await page.selectOption(`#${selectId}`, value);
  }
}

test.describe("Meta Financeira Mensal", () => {
  test("deve exibir card Meta do Mês, definir meta, editar, e validar barras", async ({
    page,
  }) => {
    // ── Login ──────────────────────────────────────────────────────────────
    await page.goto("/login");
    await page.fill("#email", TEST_USER.email);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("/app");

    // ── (a) Card "Meta do Mês" visível com CTA "Definir meta" ──────────────
    await expect(page.locator("text=Meta do Mês")).toBeVisible();
    await expect(page.locator('button:has-text("Definir meta")')).toBeVisible();

    // ── (b) Definir meta com valor alto (9.999.999) ────────────────────────
    await page.fill('input[name="valorAlvo"]', "9999999");
    await page.click('button:has-text("Definir meta")');
    await page.waitForURL("/app");

    // Assert valor alvo exibido
    await expect(page.locator("text=Valor alvo:")).toBeVisible();
    await expect(page.locator("text=R$ 9.999.999,00")).toBeVisible();

    // Assert "Faltam R$" visível
    await expect(page.locator("text=Faltam")).toBeVisible();

    // Assert barras de progresso visíveis
    const barras = page.locator(".rounded-full.bg-emerald-500, .rounded-full.bg-amber-400, .rounded-full.bg-red-500");
    await expect(barras.first()).toBeVisible();

    // ── (c) Editar meta para R$ 1,00 ──────────────────────────────────────
    await page.fill('input[name="valorAlvo"]', "1");
    await page.click('button:has-text("Editar")');
    await page.waitForURL("/app");

    // Assert "Meta atingida" + cor verde (≥100%)
    await expect(page.locator("text=Meta atingida").first()).toBeVisible();
    // Barras devem estar verdes
    await expect(page.locator(".rounded-full.bg-emerald-500").first()).toBeVisible();

    // ── (d) Criar atividade REALIZADA e recebimento (nomes únicos) ──────
    // Garantir perfil fiscal (reusa o existente)
    await page.click("text=Perfis Fiscais");
    await page.waitForURL("/app/perfis");
    const emptyPerfilState = page.locator("text=Nenhum perfil fiscal");
    if (await emptyPerfilState.isVisible()) {
      await page.click("text=Novo Perfil");
      await page.waitForURL("/app/perfis/novo");
      await page.selectOption("#tipo", "PF");
      await page.selectOption("#regime", "PF_AUTONOMO");
      await page.fill("#aliquotaEfetiva", "27.5");
      await page.click('button:has-text("Salvar")');
      await page.waitForURL("/app/perfis");
    }

    // Criar fonte para a meta (nome único)
    await page.click("text=Fontes de Renda");
    await page.waitForURL("/app/fontes");
    await page.click("text=Nova Fonte");
    await page.waitForURL("/app/fontes/novo");
    await page.fill("#nome", `Fonte Meta E2E ${Date.now()}`);
    await page.selectOption("#perfilFiscalId", { index: 1 });
    await page.selectOption("#modelo", "POR_ATIVIDADE");
    await page.fill("#prazoPagamentoDias", "0");
    await page.fill("#valorPorAtividade", "500");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/fontes");

    // Criar atividade REALIZADA
    await page.click("text=Atividades");
    await page.waitForURL("/app/atividades");
    await page.click("text=Nova Atividade");
    await page.waitForURL("/app/atividades/novo");
    await page.selectOption("#tipo", "CONSULTA");
    await selectOptionByText(page, "fonteDeRendaId", "Fonte Meta E2E");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/atividades");

    // Realizar a atividade
    const cardAtividade = page
      .locator("div.rounded-lg:has(p:has-text('Fonte Meta E2E'))")
      .filter({ hasText: "Agendada" })
      .first();
    await cardAtividade.locator("text=Realizar").click();
    await page.waitForURL("/app/atividades");

    // Criar recebimento
    await page.click("text=Recebimentos");
    await page.waitForURL("/app/recebimentos");
    await page.click("text=Novo Recebimento");
    await page.waitForURL("/app/recebimentos/novo");
    await selectOptionByText(page, "fonteDeRendaId", "Fonte Meta E2E");
    await page.fill("#valor", "500");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/recebimentos");

    // Voltar ao dashboard e verificar as duas dimensões
    await page.click("text=Dashboard");
    await page.waitForURL("/app");

    await expect(page.locator("text=Produção do mês")).toBeVisible();
    await expect(page.locator("text=Caixa recebido")).toBeVisible();
    await expect(page.locator("text=Meta atingida").first()).toBeVisible();
  });
});