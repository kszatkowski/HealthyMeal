-- ============================================================================
-- Migration: Remove products and user_preferences tables
-- Description: Removes the old product catalogue and preference linking tables
--              as the application now uses free-text preference notes stored
--              directly in the profiles table.
-- Tables Affected: user_preferences (dropped), products (dropped)
-- Author: Database Migration Script
-- Date: 2025-10-14
-- ============================================================================

-- ============================================================================
-- SECTION 1: DROP CONSTRAINTS AND POLICIES
-- ============================================================================

-- Drop all RLS policies for user_preferences
drop policy if exists "Users can view their own preferences" on user_preferences;
drop policy if exists "Users can insert their own preferences" on user_preferences;
drop policy if exists "Users can update their own preferences" on user_preferences;
drop policy if exists "Users can delete their own preferences" on user_preferences;

-- Drop all RLS policies for products
drop policy if exists "Authenticated users can read all products" on products;
drop policy if exists "Anonymous users can read all products" on products;

-- Drop trigger and function for validating user preferences
drop trigger if exists before_user_preferences_insert_update on user_preferences;
drop function if exists public.validate_user_preferences();

-- ============================================================================
-- SECTION 2: DROP TABLES
-- ============================================================================

-- Drop user_preferences table (depends on products, so drop this first)
drop table if exists user_preferences;

-- Drop products table
drop table if exists products;

-- ============================================================================
-- SECTION 3: REMOVE ENUMS IF NO LONGER NEEDED
-- ============================================================================

-- NOTE: The preference_type enum could be retained for future use or dropped
-- if the application no longer references it. For now, we leave it intact
-- as it may be referenced in application code or future migrations.
-- To drop uncomment the following:
-- drop type if exists preference_type;
