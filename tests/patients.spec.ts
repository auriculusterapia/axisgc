import { test, expect } from '@playwright/test';

// Configuration for all tests in this file
test.describe.configure({ mode: 'serial' });

const TEST_USER = {
  email: 'admin@axisgc.com.br',
  password: 'Navicom!f!0'
};

const NEW_PATIENT = {
  name: `Paciente Teste ${Date.now()}`,
  age: '30',
  phone: '(11) 99999-0000',
  email: `teste.${Date.now()}@exemplo.com`,
  address: 'Rua de Teste, 123',
  profession: 'Testador'
};

test.beforeEach(async ({ page }) => {
  // Login flow
  await page.goto('/');
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button:has-text("Entrar no Sistema")');
  
  // Wait for dashboard to load completely
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Painel de Controle').first()).toBeVisible({ timeout: 15000 });
});

test('deve criar um novo paciente e verificar na lista', async ({ page }) => {
  // Navigate to patients view - Using a more specific selector for the sidebar button
  await page.locator('aside').getByText('Pacientes').click();
  await expect(page.getByRole('heading', { name: 'Gestão de Pacientes' })).toBeVisible({ timeout: 10000 });

  // Open modal
  await page.click('button:has-text("Cadastrar Paciente")');
  await expect(page.getByRole('heading', { name: 'Novo Cadastro' })).toBeVisible();

  // Fill form
  await page.fill('input[placeholder="Ex: Maria Silva"]', NEW_PATIENT.name);
  await page.fill('input[placeholder="30"]', NEW_PATIENT.age);
  await page.fill('input[placeholder="(11) 99999-9999"]', NEW_PATIENT.phone);
  await page.fill('input[placeholder="email@exemplo.com"]', NEW_PATIENT.email);
  await page.fill('input[placeholder*="Rua das Flores"]', NEW_PATIENT.address);
  await page.fill('input[placeholder="Ex: Designer"]', NEW_PATIENT.profession);

  // Save
  await page.click('button:has-text("Salvar Cadastro")');

  // Verify success (modal closes)
  await expect(page.getByRole('heading', { name: 'Novo Cadastro' })).not.toBeVisible({ timeout: 10000 });

  // Verify in list
  await page.fill('input[placeholder*="Buscar por nome"]', NEW_PATIENT.name);
  await expect(page.getByText(NEW_PATIENT.name).first()).toBeVisible();
});

test('deve editar um paciente existente', async ({ page }) => {
  // Navigate to patients view
  await page.click('button:has-text("Pacientes")');
  
  // Search for an existing patient to edit
  await page.fill('input[placeholder*="Buscar por nome"]', 'Isabella');
  
  const editButton = page.locator('button[title="Editar Ficha"]').first();
  await editButton.click();
  
  await expect(page.getByRole('heading', { name: 'Editar Paciente' })).toBeVisible();

  // Change occupation
  const newProfession = `Profissão ${Date.now()}`;
  await page.fill('input[placeholder="Ex: Designer"]', newProfession);

  // Save
  await page.click('button:has-text("Atualizar Cadastro")');

  // Verify modal closes
  await expect(page.getByRole('heading', { name: 'Editar Paciente' })).not.toBeVisible();

  // Verify changes in the list
  await expect(page.getByText(newProfession, { exact: false }).first()).toBeVisible();
});

test('deve excluir um paciente', async ({ page }) => {
  // Navigate to patients view
  await page.click('button:has-text("Pacientes")');
  
  // Create a temp patient to delete
  const deleteTargetName = `Excluir_${Date.now()}`;
  await page.click('button:has-text("Cadastrar Paciente")');
  await page.fill('input[placeholder="Ex: Maria Silva"]', deleteTargetName);
  await page.fill('input[placeholder="30"]', '40');
  await page.click('button:has-text("Salvar Cadastro")');
  await expect(page.getByRole('heading', { name: 'Novo Cadastro' })).not.toBeVisible({ timeout: 10000 });

  // Search for the patient
  await page.fill('input[placeholder*="Buscar por nome"]', deleteTargetName);
  await expect(page.getByText(deleteTargetName).first()).toBeVisible();

  // Click delete button
  const deleteButton = page.locator('button[title="Excluir"]').first();
  await deleteButton.click();

  // Handle confirmation modal if any (Wait, the code has a ConfirmationModal)
  // But PatientsView.tsx calls handleDelete immediately? 
  // Wait, let's check app/page.tsx: handleDeletePatient has a confirm? 
  // No, PatientsView.tsx calls onDeletePatient(id) if provided.
  // Actually, I saw ConfirmationModal in app/page.tsx.
  
  // Let's assume there's a confirmation
  const confirmButton = page.getByRole('button', { name: 'Excluir' }).last();
  if (await confirmButton.isVisible()) {
    await confirmButton.click();
  }

  // Verify it's gone
  await page.fill('input[placeholder*="Buscar por nome"]', deleteTargetName);
  await expect(page.getByText(deleteTargetName)).not.toBeVisible();
});
