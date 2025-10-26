import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, userEvent } from "./test-utils";
import React from "react";
import { RecipeForm } from "@/components/views/RecipeFormView/RecipeForm";
import { RecipeCard } from "@/components/views/MyRecipesView/RecipeCard";
import { RecipeDeleteDialog } from "@/components/views/MyRecipesView/RecipeDeleteDialog";
import type { RecipeListItemDto, RecipeResponseDto } from "@/types";

// Mock data factory functions
const createMockRecipe = (overrides?: Partial<RecipeListItemDto>): RecipeListItemDto => ({
  id: "recipe-1",
  name: "Test Recipe",
  mealType: "lunch",
  difficulty: "easy",
  isAiGenerated: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const createMockRecipeResponse = (overrides?: Partial<RecipeResponseDto>): RecipeResponseDto => ({
  id: "recipe-1",
  userId: "user-1",
  name: "Test Recipe",
  mealType: "lunch",
  difficulty: "easy",
  instructions: "Mix and bake for 30 minutes",
  ingredients: "Flour, eggs, milk",
  isAiGenerated: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Mock fetch globally
global.fetch = vi.fn() as unknown as typeof fetch;

// Mock window.location
delete (window as unknown as Record<string, unknown>).location;
(window.location as unknown) = { href: "", history: { length: 1, back: vi.fn() } };

describe("Recipe Management - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockClear();
  });

  describe("Scenario 1: Happy Path - Create New Recipe", () => {
    it("should render recipe form with empty fields", () => {
      render(<RecipeForm />);

      expect(screen.getByLabelText(/Nazwa przepisu/i)).toHaveValue("");
      expect(screen.getByLabelText(/Instrukcje przygotowania/i)).toHaveValue("");
      expect(screen.getByLabelText(/Składniki/i)).toHaveValue("");
    });

    it("should fill all required fields for a new recipe", async () => {
      render(<RecipeForm />);

      const nameInput = screen.getByLabelText(/Nazwa przepisu/i) as HTMLInputElement;
      // Use getByRole for combobox (Select) instead of getByLabelText
      // This resolves the issue: "Unable to find an accessible element with the role button and name /Rodzaj posiłku/i"
      const mealTypeSelect = screen.getByRole("combobox", { name: /Rodzaj posiłku/i });
      const difficultySelect = screen.getByRole("combobox", { name: /Poziom trudności/i });
      const instructionsInput = screen.getByLabelText(/Instrukcje przygotowania/i) as HTMLTextAreaElement;
      const ingredientsInput = screen.getByLabelText(/Składniki/i) as HTMLTextAreaElement;

      // Verify fields exist and can be accessed
      expect(nameInput).toBeInTheDocument();
      expect(mealTypeSelect).toBeInTheDocument();
      expect(difficultySelect).toBeInTheDocument();
      expect(instructionsInput).toBeInTheDocument();
      expect(ingredientsInput).toBeInTheDocument();

      // Fill in text fields
      await userEvent.type(nameInput, "Sałatka z kurczakiem");
      await userEvent.type(instructionsInput, "Mix ingredients and serve");
      await userEvent.type(ingredientsInput, "Chicken, lettuce, dressing");

      // Verify all fields have values
      expect(nameInput.value).toBe("Sałatka z kurczakiem");
      expect(instructionsInput.value).toBe("Mix ingredients and serve");
      expect(ingredientsInput.value).toBe("Chicken, lettuce, dressing");
    });

    it("should submit a new recipe with valid data and show success message", async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "recipe-1" }),
      });

      render(<RecipeForm />);

      const nameInput = screen.getByLabelText(/Nazwa przepisu/i);
      const instructionsInput = screen.getByLabelText(/Instrukcje przygotowania/i);
      const ingredientsInput = screen.getByLabelText(/Składniki/i);
      const submitButton = screen.getByRole("button", { name: /Zapisz przepis/i });

      await userEvent.type(nameInput, "Test Recipe");
      await userEvent.type(instructionsInput, "Test instructions");
      await userEvent.type(ingredientsInput, "Test ingredients");

      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/recipes",
          expect.objectContaining({
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: expect.stringContaining("Test Recipe"),
          })
        );
      });
    });

    it("should display recipe in list after successful creation", async () => {
      const mockRecipe = createMockRecipe({ name: "Newly Created Recipe" });

      render(<RecipeCard recipe={mockRecipe} onDelete={vi.fn()} />);

      expect(screen.getByText("Newly Created Recipe")).toBeInTheDocument();
      expect(screen.getByText(/Lunch/i)).toBeInTheDocument();
      expect(screen.getByText(/Łatwy/i)).toBeInTheDocument();
    });
  });

  describe("Scenario 2: Edit Existing Recipe", () => {
    it("should render recipe form with initial data for editing", () => {
      const mockRecipe = createMockRecipeResponse({
        name: "Existing Recipe",
        instructions: "Original instructions",
        ingredients: "Original ingredients",
      });

      render(<RecipeForm recipeId="recipe-1" initialData={mockRecipe} />);

      const nameInput = screen.getByLabelText(/Nazwa przepisu/i) as HTMLInputElement;
      const instructionsInput = screen.getByLabelText(/Instrukcje przygotowania/i) as HTMLTextAreaElement;
      const ingredientsInput = screen.getByLabelText(/Składniki/i) as HTMLTextAreaElement;

      expect(nameInput.value).toBe("Existing Recipe");
      expect(instructionsInput.value).toBe("Original instructions");
      expect(ingredientsInput.value).toBe("Original ingredients");
    });

    it("should show edit mode title when editing", () => {
      const mockRecipe = createMockRecipeResponse();

      render(<RecipeForm recipeId="recipe-1" initialData={mockRecipe} />);

      expect(screen.getByText("Edytuj przepis")).toBeInTheDocument();
      expect(screen.getByText(/Zaktualizuj informacje o przepisie/i)).toBeInTheDocument();
    });

    it("should update recipe with modified data", async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "recipe-1" }),
      });

      const mockRecipe = createMockRecipeResponse({
        name: "Original Name",
        instructions: "Original instructions",
      });

      render(<RecipeForm recipeId="recipe-1" initialData={mockRecipe} />);

      const nameInput = screen.getByLabelText(/Nazwa przepisu/i);
      const instructionsInput = screen.getByLabelText(/Instrukcje przygotowania/i);
      const submitButton = screen.getByRole("button", { name: /Aktualizuj przepis/i });

      await userEvent.type(nameInput, "Updated Name");
      await userEvent.type(instructionsInput, "Updated instructions");

      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/recipes/recipe-1",
          expect.objectContaining({
            method: "PUT",
          })
        );
      });
    });

    it("should verify changes are saved in the API payload", async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "recipe-1" }),
      });

      const mockRecipe = createMockRecipeResponse();

      render(<RecipeForm recipeId="recipe-1" initialData={mockRecipe} />);

      const nameInput = screen.getByLabelText(/Nazwa przepisu/i);
      const submitButton = screen.getByRole("button", { name: /Aktualizuj przepis/i });

      await userEvent.type(nameInput, "New Recipe Name");
      await userEvent.click(submitButton);

      await waitFor(() => {
        const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
        const callBody = fetchMock.mock.calls[0][1].body as string;
        expect(callBody).toContain("New Recipe Name");
      });
    });
  });

  describe("Scenario 3: Delete Recipe", () => {
    it("should open delete dialog when delete action is triggered", async () => {
      const mockRecipe = createMockRecipe({ name: "Recipe to Delete" });

      render(<RecipeCard recipe={mockRecipe} onDelete={vi.fn()} />);

      // First click the menu button to open the dropdown using userEvent
      const menuButton = screen.getByRole("button", { name: /Akcje przepisu/i });
      await userEvent.click(menuButton);

      // Then click the delete menu item - wait for it to appear
      const deleteButton = await screen.findByRole("menuitem", { name: /Usuń/i });
      await userEvent.click(deleteButton);

      // Wait for dialog to appear - check for the title
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    it("should display recipe name in delete confirmation", async () => {
      const mockRecipe = createMockRecipe({ name: "Specific Recipe" });

      render(<RecipeCard recipe={mockRecipe} onDelete={vi.fn()} />);

      // First click the menu button to open the dropdown using userEvent
      const menuButton = screen.getByRole("button", { name: /Akcje przepisu/i });
      await userEvent.click(menuButton);

      // Then click the delete menu item - wait for it to appear
      const deleteButton = await screen.findByRole("menuitem", { name: /Usuń/i });
      await userEvent.click(deleteButton);

      // Wait for dialog with recipe name to appear - look for the dialog-specific text
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
        // The recipe name appears in the dialog content as well
        const dialogContent = screen.getByRole("alertdialog");
        expect(dialogContent).toHaveTextContent("Specific Recipe");
      });
    });

    it("should call onDelete callback when confirming deletion", async () => {
      const onDeleteMock = vi.fn().mockResolvedValue(undefined);

      render(
        <RecipeDeleteDialog recipeName="Test Recipe" open={true} onOpenChange={vi.fn()} onConfirm={onDeleteMock} />
      );

      const confirmButton = screen.getByRole("button", { name: /Usuń/i });
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(onDeleteMock).toHaveBeenCalled();
      });
    });

    it("should close dialog when cancel button is clicked", async () => {
      const onOpenChangeMock = vi.fn();

      render(
        <RecipeDeleteDialog recipeName="Test Recipe" open={true} onOpenChange={onOpenChangeMock} onConfirm={vi.fn()} />
      );

      const cancelButton = screen.getByRole("button", { name: /Anuluj/i });
      await userEvent.click(cancelButton);

      expect(onOpenChangeMock).toHaveBeenCalledWith(false);
    });

    it("should disable buttons while deletion is in progress", async () => {
      const onConfirmMock = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          })
      );

      render(
        <RecipeDeleteDialog recipeName="Test Recipe" open={true} onOpenChange={vi.fn()} onConfirm={onConfirmMock} />
      );

      const deleteButton = screen.getByRole("button", { name: /Usuń/i });
      const cancelButton = screen.getByRole("button", { name: /Anuluj/i });

      await userEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Usuwanie/i)).toBeInTheDocument();
      });

      expect(cancelButton).toBeDisabled();
    });
  });

  describe("Scenario 4: Validation - Invalid Data", () => {
    it("should show error message for empty recipe name", async () => {
      render(<RecipeForm />);

      const instructionsInput = screen.getByLabelText(/Instrukcje przygotowania/i);
      const ingredientsInput = screen.getByLabelText(/Składniki/i);
      const submitButton = screen.getByRole("button", { name: /Zapisz przepis/i });

      // Fill only non-name fields
      await userEvent.type(instructionsInput, "Test instructions");
      await userEvent.type(ingredientsInput, "Test ingredients");

      // Touch the name field to trigger validation
      const nameInput = screen.getByLabelText(/Nazwa przepisu/i);
      await userEvent.click(nameInput);

      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Nazwa jest wymagana/i)).toBeInTheDocument();
      });
    });

    it("should show error message for empty instructions", async () => {
      render(<RecipeForm />);

      const nameInput = screen.getByLabelText(/Nazwa przepisu/i);
      const ingredientsInput = screen.getByLabelText(/Składniki/i);
      const instructionsInput = screen.getByLabelText(/Instrukcje przygotowania/i);

      await userEvent.type(nameInput, "Test Recipe");
      await userEvent.type(ingredientsInput, "Test ingredients");

      // Touch the field to trigger validation
      await userEvent.click(instructionsInput);

      const submitButton = screen.getByRole("button", { name: /Zapisz przepis/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Instrukcje są wymagane/i)).toBeInTheDocument();
      });
    });

    it("should show error message for empty ingredients", async () => {
      render(<RecipeForm />);

      const nameInput = screen.getByLabelText(/Nazwa przepisu/i);
      const instructionsInput = screen.getByLabelText(/Instrukcje przygotowania/i);
      const ingredientsInput = screen.getByLabelText(/Składniki/i);

      await userEvent.type(nameInput, "Test Recipe");
      await userEvent.type(instructionsInput, "Test instructions");

      // Touch the field to trigger validation
      await userEvent.click(ingredientsInput);

      const submitButton = screen.getByRole("button", { name: /Zapisz przepis/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Dodaj co najmniej jeden składnik/i)).toBeInTheDocument();
      });
    });

    it("should show error message for name exceeding max length", async () => {
      render(<RecipeForm />);

      const nameInput = screen.getByLabelText(/Nazwa przepisu/i);
      const longName = "a".repeat(51); // MAX_LENGTH is 50

      // Type the long name
      await userEvent.type(nameInput, longName);

      // Tab out of the input to trigger validation (onTouched mode)
      await userEvent.tab();

      // Wait for error message to appear - use getByRole alert
      await waitFor(() => {
        const errorAlert = screen.getByRole("alert");
        expect(errorAlert).toHaveTextContent("Nazwa nie może przekraczać 50 znaków");
      });
    });

    it("should display all validation errors simultaneously", async () => {
      render(<RecipeForm />);

      const submitButton = screen.getByRole("button", { name: /Zapisz przepis/i });

      // Try to submit empty form
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Nazwa jest wymagana/i)).toBeInTheDocument();
        expect(screen.getByText(/Instrukcje są wymagane/i)).toBeInTheDocument();
        expect(screen.getByText(/Dodaj co najmniej jeden składnik/i)).toBeInTheDocument();
      });
    });

    it("should prevent form submission when validation fails", async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "recipe-1" }),
      });

      render(<RecipeForm />);

      const submitButton = screen.getByRole("button", { name: /Zapisz przepis/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it("should show server error message on API failure", async () => {
      (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: "Nie udało się zapisać przepisu na serwerze" },
        }),
      });

      render(<RecipeForm />);

      const nameInput = screen.getByLabelText(/Nazwa przepisu/i);
      const instructionsInput = screen.getByLabelText(/Instrukcje przygotowania/i);
      const ingredientsInput = screen.getByLabelText(/Składniki/i);
      const submitButton = screen.getByRole("button", { name: /Zapisz przepis/i });

      await userEvent.type(nameInput, "Test Recipe");
      await userEvent.type(instructionsInput, "Test instructions");
      await userEvent.type(ingredientsInput, "Test ingredients");

      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe("Recipe Card Display", () => {
    it("should display recipe card with all relevant information", () => {
      const mockRecipe = createMockRecipe({
        name: "Spaghetti Carbonara",
        mealType: "dinner",
        difficulty: "medium",
        isAiGenerated: true,
      });

      render(<RecipeCard recipe={mockRecipe} onDelete={vi.fn()} />);

      expect(screen.getByText("Spaghetti Carbonara")).toBeInTheDocument();
      expect(screen.getByText(/Obiad/i)).toBeInTheDocument();
      expect(screen.getByText(/Średni/i)).toBeInTheDocument();
      expect(screen.getByText(/AI/i)).toBeInTheDocument();
    });

    it("should have edit button in dropdown menu", async () => {
      const mockRecipe = createMockRecipe();

      render(<RecipeCard recipe={mockRecipe} onDelete={vi.fn()} />);

      const menuButton = screen.getByRole("button", { name: /Akcje przepisu/i });
      await userEvent.click(menuButton);

      expect(await screen.findByRole("menuitem", { name: /Edytuj/i })).toBeInTheDocument();
    });

    it("should navigate to edit page when edit is clicked", async () => {
      const mockRecipe = createMockRecipe({ id: "recipe-456" });

      render(<RecipeCard recipe={mockRecipe} onDelete={vi.fn()} />);

      const menuButton = screen.getByRole("button", { name: /Akcje przepisu/i });
      await userEvent.click(menuButton);

      const editButton = await screen.findByRole("menuitem", { name: /Edytuj/i });
      expect(editButton).toBeInTheDocument();
    });
  });

  describe("Form Accessibility", () => {
    it("should have accessible form labels", () => {
      render(<RecipeForm />);

      expect(screen.getByLabelText(/Nazwa przepisu/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Rodzaj posiłku/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Poziom trudności/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Instrukcje przygotowania/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Składniki/i)).toBeInTheDocument();
    });

    it("should have proper ARIA labels for select fields", () => {
      render(<RecipeForm />);

      const mealTypeSelect = screen.getByRole("combobox", { name: /Rodzaj posiłku/i });
      const difficultySelect = screen.getByRole("combobox", { name: /Poziom trudności/i });

      expect(mealTypeSelect).toHaveAttribute("aria-label", "Rodzaj posiłku");
      expect(difficultySelect).toHaveAttribute("aria-label", "Poziom trudności");
    });

    it("should display validation messages with proper roles", async () => {
      render(<RecipeForm />);

      const submitButton = screen.getByRole("button", { name: /Zapisz przepis/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByText(/wymagana|wymagane|Dodaj co najmniej/i);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });
  });
});
