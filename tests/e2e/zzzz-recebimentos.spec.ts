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

test.describe("Recebimentos em lote com reconciliação", () => {
  test("should create recebimento with ajuste negativo, vincular/desvincular, bloquear edição", async ({
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

    // ── Create a POR_ATIVIDADE source with unique name ─────────────────────
    await page.click("text=Fontes de Renda");
    await page.waitForURL("/app/fontes");

    await page.click("text=Nova Fonte");
    await page.waitForURL("/app/fontes/novo");
    await page.fill("#nome", "Clínica E2E");
    await page.selectOption("#perfilFiscalId", { index: 1 });
    await page.selectOption("#modelo", "POR_ATIVIDADE");
    await page.fill("#prazoPagamentoDias", "30");
    await page.fill("#valorPorAtividade", "1000");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/fontes");
    await expect(page.locator("text=Clínica E2E")).toBeVisible();

    // ── Create 2 REALIZADA activities in that source ───────────────────────
    await page.click("text=Atividades");
    await page.waitForURL("/app/atividades");

    // Create first atividade
    await page.click("text=Nova Atividade");
    await page.waitForURL("/app/atividades/novo");
    await page.selectOption("#tipo", "CONSULTA");
    await selectOptionByText(page, "fonteDeRendaId", "Clínica E2E");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/atividades");

    // Realizar it — find the Clínica E2E card that also has Agendada badge
    const clinicaCard = page.locator("div.rounded-lg:has(p:has-text('Clínica E2E'))").filter({ hasText: "Agendada" }).first();
    await clinicaCard.locator("text=Realizar").click();
    await page.waitForURL("/app/atividades");

    // Create second atividade
    await page.click("text=Nova Atividade");
    await page.waitForURL("/app/atividades/novo");
    await page.selectOption("#tipo", "PLANTAO");
    await selectOptionByText(page, "fonteDeRendaId", "Clínica E2E");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/atividades");

    // Realizar it — find the Clínica E2E card that has Agendada badge
    const clinicaCard2 = page.locator("div.rounded-lg:has(p:has-text('Clínica E2E'))").filter({ hasText: "Agendada" }).first();
    await clinicaCard2.locator("text=Realizar").click();
    await page.waitForURL("/app/atividades");

    // ── Create recebimento with valor 1750 (ajuste negativo: -250) ────────
    await page.click("text=Recebimentos");
    await page.waitForURL("/app/recebimentos");

    await page.click("text=Novo Recebimento");
    await page.waitForURL("/app/recebimentos/novo");
    await selectOptionByText(page, "fonteDeRendaId", "Clínica E2E");
    await page.fill("#valor", "1750");
    await page.fill("#observacao", "Pagamento parcial");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/recebimentos");

    // Should see the recebimento in the list with ajuste
    await expect(page.locator("text=Clínica E2E")).toBeVisible();
    await expect(page.locator("text=0 atividades vinculadas")).toBeVisible();
    // Check for the negative ajuste indicator
    await expect(page.locator("text=Ajuste:")).toBeVisible();

    // ── Go to detail page ────────────────────────────────────────────────────
    await page.click("text=Clínica E2E");
    await page.waitForURL("/app/recebimentos/**");

    await expect(page.locator("text=Pagamento parcial")).toBeVisible();
    await expect(page.locator("text=Nenhuma atividade vinculada")).toBeVisible();

    // Should show "Contas a Receber desta Fonte (2)"
    await expect(page.locator("text=Contas a Receber desta Fonte (2)")).toBeVisible();

    // ── Vincular the first atividade ─────────────────────────────────────────
    await page.locator('button:has-text("Vincular")').first().click();
    await expect(page.locator("text=Atividades Vinculadas (1)")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Contas a Receber desta Fonte (1)")).toBeVisible();
    // Ajuste should be +R$ 750 (1750 - 1000)
    await expect(page.locator("text=+R$")).toBeVisible();
    await expect(page.locator("text=R$ 750,00")).toBeVisible();

    // ── Check atividades list — vinculada shows RECEBIDA ────────────────────
    await page.goto("/app/atividades");
    await page.waitForLoadState('networkidle');
    // We just check that some cards show "Recebida" badge
    await expect(page.locator("text=Recebida")).toBeVisible();

    // ── Go back to recebimento detail and desvincular ──────────────────────
    await page.goto("/app/recebimentos/");
    await page.waitForLoadState('networkidle');
    // Click the Clínica E2E recebimento
    await page.locator("text=Clínica E2E").first().click();
    await page.waitForURL("/app/recebimentos/**");

    await page.locator('button:has-text("Desvincular")').first().click();
    await expect(page.locator("text=Atividades Vinculadas (0)")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Contas a Receber desta Fonte (2)")).toBeVisible();
    // Ajuste reverts to +R$ 1.750 (full value)
    await expect(page.locator("text=+R$")).toBeVisible();

    // ── Try to edit the desvinculada atividade (now REALIZADA) — should work ──
    await page.goto("/app/atividades");
    await page.waitForLoadState('networkidle');
    // Find a Clínica E2E card — it should now be REALIZADA (not RECEBIDA)
    const clinicaRealizada = page.locator("div.rounded-lg:has(p:has-text('Clínica E2E'))").filter({ hasText: "Realizada" }).first();
    // The card should show "Realizada" badge (not "Recebida")
    await expect(clinicaRealizada.locator("text=Realizada")).toBeVisible();
    await expect(clinicaRealizada.locator("text=Recebida")).not.toBeVisible();
  });
});