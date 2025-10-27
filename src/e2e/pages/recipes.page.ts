import { type Page } from "@playwright/test";

/**
 * Page Object Model - My Recipes List Page
 * Handles interactions with the recipes list view at /
 */
export class MyRecipesPage {
  constructor(public page: Page) {}

  async navigate() {
    await this.page.goto("/");
    // await this.page.waitForLoadState("networkidle");
  }

  async clickAddRecipeButton() {
    const button = await this.page.getByTestId("add-recipe-button");
    await button.click();
  }

  getRecipeCard(recipeId: string) {
    return this.page.getByTestId(`recipe-card-${recipeId}`);
  }

  async openRecipeCardMenu(recipeId: string) {
    const menuTrigger = this.page.getByTestId(`recipe-menu-trigger-${recipeId}`);
    await menuTrigger.click();
  }

  async clickEditRecipeFromCard(recipeId: string) {
    await this.openRecipeCardMenu(recipeId);
    const editMenuItem = this.page.getByTestId(`recipe-edit-${recipeId}`);
    await editMenuItem.click();
    await this.page.waitForLoadState("networkidle");
  }

  async clickDeleteRecipeFromCard(recipeId: string) {
    await this.openRecipeCardMenu(recipeId);
    const deleteMenuItem = this.page.getByTestId(`recipe-delete-${recipeId}`);
    await deleteMenuItem.click();
  }

  async isRecipeCardVisible(recipeId: string) {
    const card = this.getRecipeCard(recipeId);
    return await card.isVisible().catch(() => false);
  }

  async getRecipeCardName(recipeId: string) {
    return await this.page.getByTestId(`recipe-name-${recipeId}`).textContent();
  }

  async getRecipeCardByName(name: string) {
    return await this.page.getByTestId("recipe-card-name").filter({ hasText: name });
  }

  async getRecipesListItems() {
    return await this.page.getByTestId("recipes-list").waitFor({ state: "visible" });
  }
}

/**
 * Page Object Model - Recipe Form Page
 * Handles interactions with the recipe form at /recipes/new and /recipes/[id]/edit
 */
export class RecipeFormPage {
  constructor(public page: Page) {}

  async navigate() {
    await this.page.goto("/recipes/new");
    await this.page.waitForLoadState("networkidle");
  }

  async navigateToNewRecipe() {
    await this.navigate();
  }

  async navigateToEditRecipe(recipeId: string) {
    await this.page.goto(`/recipes/${recipeId}/edit`);
    await this.page.waitForLoadState("networkidle");
  }

  async fillRecipeName(name: string) {
    const input = await this.page.getByTestId("recipe-name-input");
    await input.fill(name);
  }

  async selectMealType(mealType: "breakfast" | "lunch" | "dinner" | "dessert" | "snack") {
    const select = await this.page.getByTestId("recipe-meal-type-select");
    await select.click();

    const option = this.page.getByRole("option", { name: this.getMealTypeLabel(mealType) });
    await option.waitFor({ state: "visible", timeout: 5000 });

    await this.page.getByRole("option", { name: this.getMealTypeLabel(mealType) }).click();
  }

  async selectDifficulty(difficulty: "easy" | "medium" | "hard") {
    const select = await this.page.getByTestId("recipe-difficulty-select");
    await select.click();
    await this.page.getByRole("option", { name: this.getDifficultyLabel(difficulty) }).click();
  }

  async fillInstructions(instructions: string) {
    const textarea = await this.page.getByTestId("recipe-instructions-textarea");
    await textarea.fill(instructions);
  }

  async fillIngredients(ingredients: string) {
    const textarea = await this.page.getByTestId("recipe-ingredients-textarea");
    await textarea.fill(ingredients);
  }

  async submitForm() {
    const button = await this.page.getByTestId("recipe-form-submit-button");
    await button.click();
  }

  async clickCancelButton() {
    const button = await this.page.getByTestId("recipe-form-cancel-button");
    if (await button.isVisible().catch(() => false)) {
      await button.click();
    }
  }

  async getFormErrorMessages() {
    const errors = await this.page.locator('[role="alert"]').allTextContents();
    return errors.filter((text) => text.trim().length > 0);
  }

  async getNameFieldError() {
    const input = this.page.getByTestId("recipe-name-input");
    return await input.locator("..").locator('[role="alert"]').textContent();
  }

  async isSubmitButtonDisabled() {
    const button = this.page.getByTestId("recipe-form-submit-button");
    return await button.isDisabled();
  }

  async getPageTitle() {
    return await this.page.getByTestId("recipe-form-page-title").textContent();
  }

  private getMealTypeLabel(mealType: "breakfast" | "lunch" | "dinner" | "dessert" | "snack"): string {
    const labels: Record<string, string> = {
      breakfast: "Śniadanie",
      lunch: "Lunch",
      dinner: "Obiad",
      dessert: "Deser",
      snack: "Przekąska",
    };
    return labels[mealType];
  }

  private getDifficultyLabel(difficulty: "easy" | "medium" | "hard"): string {
    const labels: Record<string, string> = {
      easy: "Łatwy",
      medium: "Średni",
      hard: "Trudny",
    };
    return labels[difficulty];
  }
}

/**
 * Page Object Model - Recipe Details Page
 * Handles interactions with the recipe details view at /recipes/[id]
 */
export class RecipeDetailsPage {
  constructor(public page: Page) {}

  async navigateToRecipe(recipeId: string) {
    await this.page.goto(`/recipes/${recipeId}`);
    await this.page.waitForLoadState("networkidle");
  }

  async getRecipeName() {
    return await this.page.getByTestId("recipe-details-page-title").textContent();
  }

  async getRecipeInstructions() {
    return await this.page.getByTestId("recipe-instructions-content").textContent();
  }

  async getRecipeIngredients() {
    return await this.page.getByTestId("recipe-ingredients-content").textContent();
  }

  async clickEditButton() {
    const button = this.page.getByTestId("recipe-details-edit-button");
    await button.click();
    await this.page.waitForLoadState("networkidle");
  }

  async clickDeleteButton() {
    const button = this.page.getByTestId("recipe-details-delete-button");
    await button.click();
    // Wait for the delete dialog to appear
    await this.page.getByTestId("recipe-delete-dialog").waitFor({ state: "visible", timeout: 5000 });
  }
}

/**
 * Page Object Model - Recipe Delete Dialog
 * Handles interactions with the delete confirmation dialog
 */
export class RecipeDeleteDialog {
  constructor(public page: Page) {}

  async isDialogVisible() {
    const dialog = this.page.getByTestId("recipe-delete-dialog");
    return await dialog.isVisible().catch(() => false);
  }

  async confirmDelete() {
    const confirmButton = this.page.getByTestId("recipe-delete-dialog-confirm");
    await confirmButton.click();
    // Wait for the deletion and navigation
    await this.page.waitForTimeout(1000);
  }

  async cancelDelete() {
    const cancelButton = this.page.getByTestId("recipe-delete-dialog-cancel");
    await cancelButton.click();
  }

  async getDeleteConfirmationText() {
    const dialog = this.page.getByTestId("recipe-delete-dialog");
    return await dialog.textContent();
  }
}
