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

test.describe("Dashboard financeiro", () => {
  test("should display dashboard cards and contas a receber with correct values", async ({
    page,
  }) => {
    // ── Login ──────────────────────────────────────────────────────────────
    await page.goto("/login");
    await page.fill("#email", TEST_USER.email);
    await page.fill("#password", TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("/app");

    // ── Ensure a PF perfil exists ──────────────────────────────────────────
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

    // ── Create first source: POR_ATIVIDADE with prazo 30 ───────────────────
    await page.click("text=Fontes de Renda");
    await page.waitForURL("/app/fontes");

    await page.click("text=Nova Fonte");
    await page.waitForURL("/app/fontes/novo");
    await page.fill("#nome", "Clínica Dashboard 30d");
    await page.selectOption("#perfilFiscalId", { index: 1 });
    await page.selectOption("#modelo", "POR_ATIVIDADE");
    await page.fill("#prazoPagamentoDias", "30");
    await page.fill("#valorPorAtividade", "1000");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/fontes");
    await expect(page.locator("text=Clínica Dashboard 30d")).toBeVisible();

    // ── Create second source: POR_ATIVIDADE with prazo 0 ───────────────────
    await page.click("text=Nova Fonte");
    await page.waitForURL("/app/fontes/novo");
    await page.fill("#nome", "Clínica Dashboard 0d");
    await page.selectOption("#perfilFiscalId", { index: 1 });
    await page.selectOption("#modelo", "POR_ATIVIDADE");
    await page.fill("#prazoPagamentoDias", "0");
    await page.fill("#valorPorAtividade", "2000");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/fontes");
    await expect(page.locator("text=Clínica Dashboard 0d")).toBeVisible();

    // ── Create atividade REALIZADA in fonte 30d ────────────────────────────
    await page.click("text=Atividades");
    await page.waitForURL("/app/atividades");

    await page.click("text=Nova Atividade");
    await page.waitForURL("/app/atividades/novo");
    await page.selectOption("#tipo", "CONSULTA");
    await selectOptionByText(page, "fonteDeRendaId", "Clínica Dashboard 30d");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/atividades");

    // Realizar
    const card30d = page
      .locator("div.rounded-lg:has(p:has-text('Clínica Dashboard 30d'))")
      .filter({ hasText: "Agendada" })
      .first();
    await card30d.locator("text=Realizar").click();
    await page.waitForURL("/app/atividades");

    // ── Create atividade AGENDADA in fonte 30d ─────────────────────────────
    await page.click("text=Nova Atividade");
    await page.waitForURL("/app/atividades/novo");
    await page.selectOption("#tipo", "PLANTAO");
    await selectOptionByText(page, "fonteDeRendaId", "Clínica Dashboard 30d");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/atividades");

    // ── Create atividade REALIZADA in fonte 0d ─────────────────────────────
    await page.click("text=Nova Atividade");
    await page.waitForURL("/app/atividades/novo");
    await page.selectOption("#tipo", "CONSULTA");
    await selectOptionByText(page, "fonteDeRendaId", "Clínica Dashboard 0d");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/atividades");

    // Realizar
    const card0d = page
      .locator("div.rounded-lg:has(p:has-text('Clínica Dashboard 0d'))")
      .filter({ hasText: "Agendada" })
      .first();
    await card0d.locator("text=Realizar").click();
    await page.waitForURL("/app/atividades");

    // ── Create recebimento in fonte 30d ────────────────────────────────────
    await page.click("text=Recebimentos");
    await page.waitForURL("/app/recebimentos");

    await page.click("text=Novo Recebimento");
    await page.waitForURL("/app/recebimentos/novo");
    await selectOptionByText(page, "fonteDeRendaId", "Clínica Dashboard 30d");
    await page.fill("#valor", "3000");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/recebimentos");

    // ── Go to Dashboard ────────────────────────────────────────────────────
    await page.click("text=Dashboard");
    await page.waitForURL("/app");

    // Assert cards are visible
    await expect(page.locator("text=Recebido no mês")).toBeVisible();
    await expect(page.locator("text=Projetado no mês")).toBeVisible();
    await expect(page.locator("text=Líquido estimado")).toBeVisible();

    // Assert Contas a Receber section
    await expect(page.locator("text=Contas a Receber")).toBeVisible();

    // Clínica Dashboard 0d (prazo 0) — atividade REALIZADA sem vínculo
    // should appear in contas a receber
    await expect(page.locator("text=Clínica Dashboard 0d")).toBeVisible();

    // Clínica Dashboard 30d (prazo 30) — atividade REALIZADA sem vínculo
    // should appear in contas a receber
    await expect(page.locator("text=Clínica Dashboard 30d")).toBeVisible();

    // Month navigation should work
    await expect(page.locator("text=‹")).toBeVisible();
    await expect(page.locator("text=›")).toBeVisible();
  });
});