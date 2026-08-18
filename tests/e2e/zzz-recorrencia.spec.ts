import { test, expect } from "@playwright/test";

const TEST_USER = {
  name: "Maria Teste",
  email: "e2e@fluxomed.test",
  password: "senha12345",
};

test.describe("Atividade Recorrente (FIXO_MENSAL)", () => {
  test("should generate monthly activity for FIXO_MENSAL, idempotent on reload, works for previous month", async ({
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

    // ── Navigate to fontes and create a unique FIXO_MENSAL source ──────────
    await page.click("text=Fontes de Renda");
    await page.waitForURL("/app/fontes");

    await page.click("text=Nova Fonte");
    await page.waitForURL("/app/fontes/novo");
    await page.fill("#nome", "Salário E2E");
    await page.selectOption("#perfilFiscalId", { index: 1 });
    await page.selectOption("#modelo", "FIXO_MENSAL");
    await page.fill("#prazoPagamentoDias", "30");
    await page.fill("#valorMensal", "8000");
    await page.click('button:has-text("Salvar")');
    await page.waitForURL("/app/fontes");
    await expect(page.locator("text=Salário E2E")).toBeVisible();

    // ── Go to atividades (current month) ────────────────────────────────────
    await page.click("text=Atividades");
    await page.waitForURL("/app/atividades");
    await expect(page.locator("h1")).toHaveText("Atividades");

    // The Salário E2E activity should appear with R$ 8.000,00 and REALIZADA badge
    // Note: there may be other atividades from previous tests — use unique name
    const salarioCard = page.locator("text=Salário E2E").locator("..");
    await expect(salarioCard.locator("text=R$ 8.000,00")).toBeVisible();
    await expect(salarioCard.locator("text=Realizada")).toBeVisible();

    // ── Reload the page — should still be exactly ONE Salário E2E ────────────
    await page.reload();
    await page.waitForURL("/app/atividades");

    // Count occurrences of "Salário E2E" — should be exactly 1
    const salarioCards = page.locator("text=Salário E2E");
    await expect(salarioCards).toHaveCount(1);

    // ── Navigate to previous month — should also generate ────────────────────
    // Get current month filter value and go to previous
    const mesSelect = page.locator('select[name="mes"]');
    const currentValue = await mesSelect.inputValue();
    const [ano, mes] = currentValue.split("-").map(Number);
    const prevMes = mes === 1 ? `/${ano - 1}-12` : `/${ano}-${String(mes - 1).padStart(2, "0")}`;
    const prevValue = mes === 1 ? `${ano - 1}-12` : `${ano}-${String(mes - 1).padStart(2, "0")}`;

    await mesSelect.selectOption(prevValue);
    await page.click('button:has-text("Filtrar")');
    await page.waitForURL("/app/atividades**");

    // The Salário E2E should now appear in the previous month too
    await expect(page.locator("text=Salário E2E")).toBeVisible();
    await expect(page.locator("text=R$ 8.000,00")).toBeVisible();

    // Go back to current month — should still have exactly one
    await mesSelect.selectOption(currentValue);
    await page.click('button:has-text("Filtrar")');
    await page.waitForURL("/app/atividades**");
    await expect(page.locator("text=Salário E2E")).toHaveCount(1);
    await expect(page.locator("text=R$ 8.000,00")).toBeVisible();
  });
});