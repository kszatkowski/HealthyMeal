-- ============================================================================
-- Migration: Remove recipe_ingredients table and add ingredients field to recipes
-- Description: Refactors recipe storage by removing the join table and storing
--              ingredients as a text field directly in the recipes table
-- Tables Affected: recipes (updated), recipe_ingredients (dropped)
-- Author: Database Migration Script
-- Date: 2025-10-13
-- ============================================================================

-- ============================================================================
-- SECTION 1: DROP CONSTRAINTS AND POLICIES
-- ============================================================================

-- Drop all RLS policies for recipe_ingredients
drop policy if exists "Users can view ingredients for their own recipes" on recipe_ingredients;
drop policy if exists "Users can insert ingredients for their own recipes" on recipe_ingredients;
drop policy if exists "Users can update ingredients for their own recipes" on recipe_ingredients;
drop policy if exists "Users can delete ingredients for their own recipes" on recipe_ingredients;

-- ============================================================================
-- SECTION 2: DROP TABLE
-- ============================================================================

-- Drop the recipe_ingredients table completely
drop table if exists recipe_ingredients;

-- ============================================================================
-- SECTION 3: REMOVE ENUMS IF NO LONGER NEEDED
-- ============================================================================

-- NOTE: The recipe_unit enum could be retained for future use or dropped
-- if the application no longer references it. For now, we leave it intact
-- as it may be referenced in application code or future migrations.
-- To drop uncomment the following:
-- drop type if exists recipe_unit;

-- ============================================================================
-- SECTION 4: ADD INGREDIENTS COLUMN TO RECIPES
-- ============================================================================

-- Add the ingredients column to the recipes table
-- This column stores a text representation of ingredients (JSON or plain text)
alter table recipes
add column ingredients varchar(1000) not null default '';

-- Update the comment to reflect the new column
comment on column recipes.ingredients is 'Ingredients for the recipe stored as text, max 1000 characters';

-- ============================================================================
-- SECTION 5: MIGRATE EXISTING DATA (if recipes exist)
-- ============================================================================

-- NOTE: If there are existing recipes with ingredients in the recipe_ingredients table,
-- you would need to migrate that data here. Since this is an early migration in the
-- project, this is likely not necessary. If needed, uncomment and adapt the following:
--
-- update recipes
-- set ingredients = (
--   select string_agg(
--     'Name: ' || p.name || ', Amount: ' || ri.amount || ', Unit: ' || ri.unit,
--     '; '
--   )
--   from recipe_ingredients ri
--   join products p on ri.product_id = p.id
--   where ri.recipe_id = recipes.id
-- )
-- where exists (
--   select 1 from recipe_ingredients where recipe_id = recipes.id
-- );
-- ============================================================================
-- SECTION 6: ADD PREFERENCE NOTE COLUMNS TO PROFILES
-- ============================================================================

-- Add preference note columns to the profiles table
alter table profiles
add column disliked_ingredients_note varchar(200),
add column allergens_note varchar(200);

-- Update comments to reflect new columns
comment on column profiles.disliked_ingredients_note is 'User-defined list of disliked ingredients (free text), max 200 characters';
comment on column profiles.allergens_note is 'User-defined list of allergens (free text), max 200 characters';
