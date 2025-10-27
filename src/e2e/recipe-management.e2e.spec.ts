import { test, expect } from "@playwright/test";
import { MyRecipesPage, RecipeFormPage, RecipeDetailsPage } from "./pages/recipes.page";

// Helper function to generate unique recipe names
function generateUniqueName(prefix = "Test Recipe") {
  return `${prefix} - ${Date.now()}`;
}

// Test data
const testRecipeData = {
  name: generateUniqueName("Test Salad"),
  mealType: "lunch" as const,
  difficulty: "easy" as const,
  instructions: "1. Wash vegetables\n2. Cut ingredients\n3. Mix together\n4. Serve fresh",
  ingredients: "Lettuce - 200g\nTomatoes - 100g\nCucumber - 100g\nOlive oil - 2 tbsp",
};

test.describe("Recipe Management E2E Tests", () => {
  let myRecipesPage: MyRecipesPage;
  let recipeFormPage: RecipeFormPage;
  let recipeDetailsPage: RecipeDetailsPage;

  test.beforeEach(async ({ page }) => {
    // Initialize Page Objects
    myRecipesPage = new MyRecipesPage(page);
    recipeFormPage = new RecipeFormPage(page);
    recipeDetailsPage = new RecipeDetailsPage(page);

    // Navigate to recipes page (user is already authenticated via setup)
    await myRecipesPage.navigate();
  });

  test.describe("Scenario 1: Happy Path - Create Recipe", () => {
    test("should create a new recipe with all required fields and see it in the list", async ({ page }) => {
      // Step 1: Click on "Add Recipe" button
      await myRecipesPage.clickAddRecipeButton();
      await page.waitForLoadState("networkidle");

      // Step 2: Verify we're on the recipe creation form
      expect(await recipeFormPage.getPageTitle()).toContain("Dodaj nowy przepis");

      // Step 3: Fill in all required fields
      await recipeFormPage.fillRecipeName(testRecipeData.name);
      await recipeFormPage.selectMealType(testRecipeData.mealType);
      await recipeFormPage.selectDifficulty(testRecipeData.difficulty);
      await recipeFormPage.fillInstructions(testRecipeData.instructions);
      await recipeFormPage.fillIngredients(testRecipeData.ingredients);

      // Step 4: Submit the form
      await recipeFormPage.submitForm();

      // Step 5: Wait for redirect and verification
      await page.waitForURL(/.*\/$/);
      await page.getByTestId("recipes-list").waitFor({ state: "visible" });

      // Step 6: Verify the recipe appears in the list
      const recipreCard = await myRecipesPage.getRecipeCardByName(testRecipeData.name);
      expect(recipreCard).toBeVisible();

      // // Step 7: Navigate to the recipe details to verify all data
      recipreCard.click();
      await page.waitForLoadState("networkidle");

      const recipeName = await recipeDetailsPage.getRecipeName();
      expect(recipeName).toContain(testRecipeData.name);

      const instructions = await recipeDetailsPage.getRecipeInstructions();
      expect(instructions).toContain(testRecipeData.instructions);

      const ingredients = await recipeDetailsPage.getRecipeIngredients();
      expect(ingredients).toContain(testRecipeData.ingredients);
    });
  });

  test.describe("Scenario 2: Form Validation", () => {
    test("should show validation errors when submitting empty form", async ({ page }) => {
      // Step 1: Navigate to create recipe form
      await myRecipesPage.clickAddRecipeButton();
      // await page.waitForURL(/.*\/recipes\/new/);
      await page.waitForLoadState("networkidle");

      // Step 2: Try to submit without filling anything
      await recipeFormPage.submitForm();

      // Step 3: Verify form is still visible (not submitted)
      expect(await recipeFormPage.getPageTitle()).toContain("Dodaj nowy przepis");

      // Step 4: Check for error messages
      const errors = await recipeFormPage.getFormErrorMessages();
      expect(errors.length).toBeGreaterThan(0);

      // Step 5: Verify we're still on the same page (form not submitted)
      expect(page.url()).toContain("/recipes/new");
    });
  });
});
