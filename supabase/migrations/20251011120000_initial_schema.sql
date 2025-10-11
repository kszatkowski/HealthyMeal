-- ============================================================================
-- Migration: Initial Schema for HealthyMeal Application
-- Description: Creates all tables, enums, indexes, RLS policies, triggers, 
--              and functions for the HealthyMeal recipe management system
-- Tables Affected: profiles, products, user_preferences, recipes, recipe_ingredients
-- Author: Database Migration Script
-- Date: 2025-10-11
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENUM TYPES
-- ============================================================================
-- These custom enum types ensure data consistency across the application
-- and prevent invalid values from being inserted into the database.

-- preference_type: Defines the types of dietary preferences a user can have
create type preference_type as enum ('like', 'dislike', 'allergen');

-- meal_type: Categorizes recipes into meal categories
create type meal_type as enum ('breakfast', 'lunch', 'dinner', 'dessert', 'snack');

-- recipe_difficulty: Indicates the complexity level of a recipe
create type recipe_difficulty as enum ('easy', 'medium', 'hard');

-- recipe_unit: Standardizes measurement units for recipe ingredients
create type recipe_unit as enum ('gram', 'kilogram', 'milliliter', 'liter', 'teaspoon', 'tablespoon', 'cup', 'piece');

-- ============================================================================
-- SECTION 2: TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: profiles
-- ----------------------------------------------------------------------------
-- Extends the auth.users table with application-specific user data.
-- Maintains a 1-to-1 relationship with auth.users via the id column.
-- This table stores user preferences and tracks AI recipe generation limits.

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  ai_requests_count smallint not null default 3,
  onboarding_notification_hidden_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add helpful comment to the table
comment on table profiles is 'User profiles with application-specific data, extending auth.users';
comment on column profiles.ai_requests_count is 'Daily counter for AI recipe generation requests, resets to 3 at midnight UTC';
comment on column profiles.onboarding_notification_hidden_until is 'Timestamp until which the onboarding notification should be hidden';

-- ----------------------------------------------------------------------------
-- TABLE: products
-- ----------------------------------------------------------------------------
-- Dictionary table containing all available food products and ingredients.
-- This is a shared resource that all users reference for their preferences
-- and recipes. Products are read-only for regular users.

create table products (
  id uuid primary key default gen_random_uuid(),
  name varchar(50) not null unique,
  created_at timestamptz not null default now()
);

-- Add helpful comment to the table
comment on table products is 'Dictionary of all available food products and ingredients';
comment on column products.name is 'Unique name of the food product, used for searching and display';

-- ----------------------------------------------------------------------------
-- TABLE: user_preferences
-- ----------------------------------------------------------------------------
-- Join table linking users to products with preference types.
-- Implements a many-to-many relationship between users and products.
-- Each user can have only ONE preference type per product (enforced by unique constraint).
-- Maximum 30 items per preference category (enforced by trigger).

create table user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  preference_type preference_type not null,
  created_at timestamptz not null default now(),
  -- Ensure a user can only have one preference type per product
  unique(user_id, product_id)
);

-- Add helpful comments
comment on table user_preferences is 'User dietary preferences (likes, dislikes, allergens) for products';
comment on column user_preferences.preference_type is 'Type of preference: like, dislike, or allergen';

-- ----------------------------------------------------------------------------
-- TABLE: recipes
-- ----------------------------------------------------------------------------
-- Stores all recipes, both user-created and AI-generated.
-- Each recipe belongs to a single user (many-to-one relationship).
-- Recipes can be categorized by meal type and difficulty level.

create table recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(100) not null,
  instructions varchar(5000) not null,
  meal_type meal_type not null,
  difficulty recipe_difficulty not null,
  is_ai_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add helpful comments
comment on table recipes is 'User recipes, both manually created and AI-generated';
comment on column recipes.is_ai_generated is 'Flag to distinguish AI-generated recipes from user-created ones';
comment on column recipes.instructions is 'Step-by-step preparation instructions, max 5000 characters';

-- ----------------------------------------------------------------------------
-- TABLE: recipe_ingredients
-- ----------------------------------------------------------------------------
-- Join table linking recipes to their required ingredients.
-- Implements a many-to-many relationship between recipes and products.
-- Stores the quantity and unit of measurement for each ingredient.

create table recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  amount numeric not null,
  unit recipe_unit not null,
  created_at timestamptz not null default now()
);

-- Add helpful comments
comment on table recipe_ingredients is 'Ingredients required for each recipe with quantities';
comment on column recipe_ingredients.amount is 'Quantity of the ingredient required (numeric value)';
comment on column recipe_ingredients.unit is 'Unit of measurement for the amount';

-- ============================================================================
-- SECTION 3: INDEXES
-- ============================================================================
-- Indexes to optimize query performance. Foreign key indexes are created
-- automatically by PostgreSQL, so we only add custom indexes here.

-- Index on meal_type for filtering recipes by category
create index idx_recipes_meal_type on recipes(meal_type);

-- Index on user_id for faster recipe lookups by user
create index idx_recipes_user_id on recipes(user_id);

-- Index on user_preferences for faster lookups
create index idx_user_preferences_user_id on user_preferences(user_id);
create index idx_user_preferences_product_id on user_preferences(product_id);

-- Index on recipe_ingredients for faster lookups
create index idx_recipe_ingredients_recipe_id on recipe_ingredients(recipe_id);
create index idx_recipe_ingredients_product_id on recipe_ingredients(product_id);

-- ============================================================================
-- SECTION 4: ROW-LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables to ensure users can only access their own data.
-- Even publicly readable tables (like products) should have RLS enabled
-- with appropriate policies.

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table products enable row level security;
alter table user_preferences enable row level security;
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;

-- ----------------------------------------------------------------------------
-- RLS POLICIES: profiles
-- ----------------------------------------------------------------------------
-- Users can only view and update their own profile.
-- No insert policy needed (handled by trigger on auth.users).
-- No delete policy needed (cascade delete from auth.users).

-- Policy: Authenticated users can view their own profile
create policy "Users can view their own profile"
  on profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Policy: Authenticated users can update their own profile
create policy "Users can update their own profile"
  on profiles
  for update
  to authenticated
  using (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- RLS POLICIES: products
-- ----------------------------------------------------------------------------
-- All authenticated users can read all products (shared dictionary).
-- No write access for regular users (products are managed by admins).

-- Policy: Authenticated users can read all products
create policy "Authenticated users can read all products"
  on products
  for select
  to authenticated
  using (true);

-- Policy: Anonymous users can read all products (for public recipe browsing)
create policy "Anonymous users can read all products"
  on products
  for select
  to anon
  using (true);

-- ----------------------------------------------------------------------------
-- RLS POLICIES: user_preferences
-- ----------------------------------------------------------------------------
-- Users have full CRUD access to their own preferences only.
-- Separate policies for each operation for better security granularity.

-- Policy: Authenticated users can view their own preferences
create policy "Users can view their own preferences"
  on user_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Authenticated users can insert their own preferences
create policy "Users can insert their own preferences"
  on user_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Authenticated users can update their own preferences
create policy "Users can update their own preferences"
  on user_preferences
  for update
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Authenticated users can delete their own preferences
create policy "Users can delete their own preferences"
  on user_preferences
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- RLS POLICIES: recipes
-- ----------------------------------------------------------------------------
-- Users have full CRUD access to their own recipes only.
-- Recipes are private to each user and not shared across the platform.

-- Policy: Authenticated users can view their own recipes
create policy "Users can view their own recipes"
  on recipes
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Authenticated users can insert their own recipes
create policy "Users can insert their own recipes"
  on recipes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Authenticated users can update their own recipes
create policy "Users can update their own recipes"
  on recipes
  for update
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Authenticated users can delete their own recipes
create policy "Users can delete their own recipes"
  on recipes
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- RLS POLICIES: recipe_ingredients
-- ----------------------------------------------------------------------------
-- Users can manage ingredients only for recipes they own.
-- Access is determined by checking recipe ownership via a subquery.

-- Policy: Authenticated users can view ingredients for their own recipes
create policy "Users can view ingredients for their own recipes"
  on recipe_ingredients
  for select
  to authenticated
  using (
    exists (
      select 1 from recipes
      where recipes.id = recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- Policy: Authenticated users can insert ingredients for their own recipes
create policy "Users can insert ingredients for their own recipes"
  on recipe_ingredients
  for insert
  to authenticated
  with check (
    exists (
      select 1 from recipes
      where recipes.id = recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- Policy: Authenticated users can update ingredients for their own recipes
create policy "Users can update ingredients for their own recipes"
  on recipe_ingredients
  for update
  to authenticated
  using (
    exists (
      select 1 from recipes
      where recipes.id = recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- Policy: Authenticated users can delete ingredients for their own recipes
create policy "Users can delete ingredients for their own recipes"
  on recipe_ingredients
  for delete
  to authenticated
  using (
    exists (
      select 1 from recipes
      where recipes.id = recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SECTION 5: FUNCTIONS AND TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FUNCTION: handle_new_user
-- ----------------------------------------------------------------------------
-- Automatically creates a profile entry when a new user signs up.
-- This function is triggered after an insert on auth.users.
-- SECURITY DEFINER is required to allow the trigger to insert into profiles
-- even though it runs in the context of the auth schema.

create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  -- Create a new profile for the user with default values
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

-- Add helpful comment
comment on function public.handle_new_user is 'Automatically creates a profile entry for new users';

-- Trigger: Create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- FUNCTION: update_updated_at_column
-- ----------------------------------------------------------------------------
-- Automatically updates the updated_at timestamp whenever a row is modified.
-- This ensures the updated_at column always reflects the last modification time.

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  -- Set the updated_at column to the current timestamp
  new.updated_at = now();
  return new;
end;
$$;

-- Add helpful comment
comment on function public.update_updated_at_column is 'Updates the updated_at timestamp on row modification';

-- Trigger: Update updated_at on profiles modification
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute procedure public.update_updated_at_column();

-- Trigger: Update updated_at on recipes modification
create trigger update_recipes_updated_at
  before update on recipes
  for each row
  execute procedure public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- FUNCTION: validate_user_preferences
-- ----------------------------------------------------------------------------
-- Validates user preferences before insert or update to ensure:
-- 1. No conflicting preferences (a product can only have one preference type)
-- 2. Maximum 30 items per preference category (like, dislike, allergen)
-- This function raises exceptions if validation fails, preventing the operation.

create or replace function public.validate_user_preferences()
returns trigger
language plpgsql
as $$
declare
  like_count integer;
  dislike_count integer;
  allergen_count integer;
  conflicting_preference preference_type;
begin
  -- Check 1: Ensure no conflicting preferences exist
  -- A user cannot have the same product in multiple preference lists
  select preference_type into conflicting_preference
  from user_preferences
  where user_id = new.user_id
    and product_id = new.product_id
    and id != coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if conflicting_preference is not null then
    raise exception 'Conflict: This product is already in the "%" list.', conflicting_preference;
  end if;

  -- Check 2: Enforce the 30-item limit per preference category
  -- Count existing preferences for this user by type
  select
    count(*) filter (where preference_type = 'like'),
    count(*) filter (where preference_type = 'dislike'),
    count(*) filter (where preference_type = 'allergen')
  into like_count, dislike_count, allergen_count
  from user_preferences
  where user_id = new.user_id
    and id != coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Raise exception if the limit is exceeded for the new preference type
  if new.preference_type = 'like' and like_count >= 30 then
    raise exception 'Limit reached: You cannot add more than 30 items to the "like" list.';
  elsif new.preference_type = 'dislike' and dislike_count >= 30 then
    raise exception 'Limit reached: You cannot add more than 30 items to the "dislike" list.';
  elsif new.preference_type = 'allergen' and allergen_count >= 30 then
    raise exception 'Limit reached: You cannot add more than 30 items to the "allergen" list.';
  end if;

  return new;
end;
$$;

-- Add helpful comment
comment on function public.validate_user_preferences is 'Validates user preferences to prevent conflicts and enforce limits';

-- Trigger: Validate preferences before insert or update
create trigger before_user_preferences_insert_update
  before insert or update on user_preferences
  for each row
  execute procedure public.validate_user_preferences();

-- ============================================================================
-- SECTION 6: SCHEDULED JOBS (pg_cron)
-- ============================================================================
-- NOTE: The pg_cron extension and job scheduling must be configured
-- separately in the Supabase Dashboard or via the SQL Editor.
-- This migration creates the necessary structure, but the cron job
-- itself should be scheduled using the following command in the SQL Editor:
--
-- SELECT cron.schedule(
--   'reset-ai-requests-daily',
--   '0 0 * * *',
--   $$
--   UPDATE public.profiles
--   SET ai_requests_count = 3;
--   $$
-- );
--
-- This job runs daily at midnight UTC and resets the AI request counter
-- to 3 for all users, implementing the daily limit functionality.
-- ============================================================================

