import type { Tables, TablesInsert } from "./db/database.types";

// Base aliases to keep DTOs connected to the underlying database schema.
type ProfileRow = Tables<"profiles">;
type ProductRow = Tables<"products">;
type UserPreferenceRow = Tables<"user_preferences">;
type UserPreferenceInsert = TablesInsert<"user_preferences">;
type RecipeRow = Tables<"recipes">;
type RecipeIngredientRow = Tables<"recipe_ingredients">;

// -----------------------------------------------------------------------------
// Profile
// -----------------------------------------------------------------------------

export interface ProfileResponseDto {
  id: ProfileRow["id"];
  aiRequestsCount: ProfileRow["ai_requests_count"];
  onboardingNotificationHiddenUntil: ProfileRow["onboarding_notification_hidden_until"];
  createdAt: ProfileRow["created_at"];
  updatedAt: ProfileRow["updated_at"];
  likesCount: number;
  dislikesCount: number;
  allergensCount: number;
}

export interface ProfileUpdateCommand {
  /** Allows null to clear the dismissal window. */
  onboardingNotificationHiddenUntil: ProfileRow["onboarding_notification_hidden_until"];
}

// -----------------------------------------------------------------------------
// Products
// -----------------------------------------------------------------------------

export type ProductListItemDto = Pick<ProductRow, "id" | "name">;

export type ProductResponseDto = ProductListItemDto;

export interface ProductListResponseDto {
  items: ProductListItemDto[];
  total: number;
  limit: number;
  offset: number;
}

// -----------------------------------------------------------------------------
// User Preferences
// -----------------------------------------------------------------------------

export interface PreferenceListItemDto {
  id: UserPreferenceRow["id"];
  preferenceType: UserPreferenceRow["preference_type"];
  createdAt: UserPreferenceRow["created_at"];
  product: ProductListItemDto;
}

export type PreferenceResponseDto = PreferenceListItemDto;

export interface PreferenceListResponseDto {
  items: PreferenceListItemDto[];
}

export interface PreferenceCreateCommand {
  productId: UserPreferenceInsert["product_id"];
  preferenceType: UserPreferenceInsert["preference_type"];
}

export interface PreferenceDeleteCommand {
  preferenceId: UserPreferenceRow["id"];
}

// -----------------------------------------------------------------------------
// Recipes
// -----------------------------------------------------------------------------

export interface RecipeListItemDto {
  id: RecipeRow["id"];
  name: RecipeRow["name"];
  mealType: RecipeRow["meal_type"];
  difficulty: RecipeRow["difficulty"];
  isAiGenerated: RecipeRow["is_ai_generated"];
  createdAt: RecipeRow["created_at"];
  updatedAt: RecipeRow["updated_at"];
}

export interface RecipeIngredientDto {
  id: RecipeIngredientRow["id"];
  amount: RecipeIngredientRow["amount"];
  unit: RecipeIngredientRow["unit"];
  product: ProductListItemDto;
}

export interface RecipeListResponseDto {
  items: RecipeListItemDto[];
  total: number;
  limit: number;
  offset: number;
}

interface RecipeCommandIngredient {
  productId: RecipeIngredientRow["product_id"];
  amount: RecipeIngredientRow["amount"];
  unit: RecipeIngredientRow["unit"];
}

export interface RecipeCreateCommand {
  name: RecipeRow["name"];
  mealType: RecipeRow["meal_type"];
  difficulty: RecipeRow["difficulty"];
  instructions: RecipeRow["instructions"];
  /** Optional because manual recipes default to false in the database. */
  isAiGenerated?: RecipeRow["is_ai_generated"];
  ingredients: RecipeCommandIngredient[];
}

export type RecipeUpdateCommand = RecipeCreateCommand;

export interface RecipeResponseDto {
  id: RecipeRow["id"];
  userId: RecipeRow["user_id"];
  name: RecipeRow["name"];
  mealType: RecipeRow["meal_type"];
  difficulty: RecipeRow["difficulty"];
  instructions: RecipeRow["instructions"];
  isAiGenerated: RecipeRow["is_ai_generated"];
  createdAt: RecipeRow["created_at"];
  updatedAt: RecipeRow["updated_at"];
  ingredients: RecipeIngredientDto[];
}

export interface RecipeDeleteCommand {
  recipeId: RecipeRow["id"];
}

// -----------------------------------------------------------------------------
// AI Recipe Generation
// -----------------------------------------------------------------------------

export interface AiRecipeGenerationCommand {
  mealType: RecipeRow["meal_type"];
  difficulty: RecipeRow["difficulty"];
  mainIngredient: string;
}

export interface AiRecipeDraftIngredientDto {
  name: string;
  amount: RecipeIngredientRow["amount"];
  unit: RecipeIngredientRow["unit"];
}

export interface AiRecipeDraftDto {
  name: RecipeRow["name"];
  mealType: RecipeRow["meal_type"];
  difficulty: RecipeRow["difficulty"];
  instructions: RecipeRow["instructions"];
  ingredients: AiRecipeDraftIngredientDto[];
}

export interface AiRecipeGenerationResponseDto {
  draft: AiRecipeDraftDto;
  aiRequestsRemaining: ProfileRow["ai_requests_count"];
}

export type AiRecipeSaveCommand = Omit<RecipeCreateCommand, "isAiGenerated"> & {
  /** Enforce the invariant that saved AI recipes persist the AI flag. */
  isAiGenerated: true;
};

// -----------------------------------------------------------------------------
// Onboarding Notice
// -----------------------------------------------------------------------------

export interface OnboardingNoticeResponseDto {
  show: boolean;
  dismissibleUntil: ProfileRow["onboarding_notification_hidden_until"];
}

export type OnboardingNoticeDismissCommand = Record<never, never>;

export interface OnboardingNoticeDismissResponseDto {
  hiddenUntil: ProfileRow["onboarding_notification_hidden_until"];
}

// -----------------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------------

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
}

export type PaginatedDto<TItem> = {
  items: TItem[];
} & PaginationMeta;
