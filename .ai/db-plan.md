# HealthyMeal - Database Schema

This document outlines the PostgreSQL database schema for the HealthyMeal application, designed for implementation on the Supabase platform.

## 1. ENUM Types

Custom ENUM types to ensure data consistency across the application.

```sql
CREATE TYPE preference_type AS ENUM ('like', 'dislike', 'allergen');
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'dessert', 'snack');
CREATE TYPE recipe_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE recipe_unit AS ENUM ('gram', 'kilogram', 'milliliter', 'liter', 'teaspoon', 'tablespoon', 'cup', 'piece');
```

## 2. Tables

Detailed schema for each table in the database.

### `users`

This table is managed by Supabase Auth.

| Column                | Type            | Constraints                                | Description                                                               |
|-----------------------|-----------------|--------------------------------------------|-------------------------------------------------------------------------- |
| `id`                  | `uuid`          | `PRIMARY KEY, DEFAULT gen_random_uuid()`   | Unique identifier for each user record, automatically generated           |
| `email`               | `VARCHAR(255)`  | `UNIQUE, NOT NULL`                         | User's email address, must be unique across all users                     |
| `encrypted_password`  | `VARCHAR(255)`  | `NOT NULL`                                 | Hashed password for user authentication, stored securely                  |
| `created_at`          | `TIMESTAMP`     | `NOT NULL, DEFAULT NOW()`                  | Timestamp when the user account was created                               |
| `confirmed_at`        | `TIMESTAMP`     | `NULL`                                     | Timestamp when the user's email was confirmed (null if not confirmed yet) |


### `profiles`

Stores user-specific application data, extending the `users` table.

- **Relationship**: One-to-One with `users`.
- **Primary Key**: `id` (references `users.id`).

| Column                               | Type          | Constraints                               | Description                                                                 |
| ------------------------------------ | ------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| `id`                                 | `uuid`        | `PRIMARY KEY`, `REFERENCES users(id)` | Foreign key to `users`, creating a 1-to-1 relationship.               |
| `ai_requests_count`                  | `smallint`    | `NOT NULL`, `DEFAULT 3`                   | Daily counter for AI recipe generation requests. Resets daily via pg_cron.  |
| `onboarding_notification_hidden_until` | `timestamptz` |                                           | Stores the timestamp until which the onboarding notification should be hidden. |
| `created_at`                         | `timestamptz` | `NOT NULL`, `DEFAULT now()`               | Timestamp of profile creation.                                              |
| `updated_at`                         | `timestamptz` | `NOT NULL`, `DEFAULT now()`               | Timestamp of the last profile update.                                       |

### `products`

A dictionary table containing all available food products/ingredients.

- **Primary Key**: `id`.

| Column     | Type          | Constraints                                  | Description                         |
| ---------- | ------------- | -------------------------------------------- | ----------------------------------- |
| `id`       | `uuid`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for the product.  |
| `name`     | `varchar(50)`        | `NOT NULL`, `UNIQUE`                         | Name of the food product.           |
| `created_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()`                | Timestamp of product creation.      |

### `user_preferences`

A join table linking users to products, defining their dietary preferences.

- **Relationship**: Many-to-Many between `users` and `products`.
- **Primary Key**: `id`.

| Column            | Type              | Constraints                                                                                             | Description                                                     |
| ----------------- | ----------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `id`              | `uuid`            | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                                            | Unique identifier for the preference entry.                     |
| `user_id`         | `uuid`            | `NOT NULL`, `REFERENCES users(id) ON DELETE CASCADE`                                                 | Foreign key to the `users` table.                            |
| `product_id`      | `uuid`            | `NOT NULL`, `REFERENCES products(id) ON DELETE CASCADE`                                                 | Foreign key to the `products` table.                            |
| `preference_type` | `preference_type` | `NOT NULL`                                                                                              | Type of preference ('like', 'dislike', 'allergen').             |
| `created_at`      | `timestamptz`     | `NOT NULL`, `DEFAULT now()`                                                                             | Timestamp of preference creation.                               |
| **Constraints**   |                   | `UNIQUE (user_id, product_id)`                                                                          | Ensures a user can only have one preference type per product.   |

### `recipes`

Stores all recipes, both user-created and AI-generated.

- **Relationship**: Many-to-One with `users`.
- **Primary Key**: `id`.

| Column            | Type                | Constraints                                                                          | Description                                            |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `id`              | `uuid`              | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                           | Unique identifier for the recipe.                      |
| `user_id`         | `uuid`              | `NOT NULL`, `REFERENCES users(id) ON DELETE CASCADE`                              | Foreign key to the user who owns the recipe.           |
| `name`            | `varchar(100)`              | `NOT NULL`                                                                           | Name of the recipe.                                    |
| `instructions`    | `varchar(5000)`              | `NOT NULL`                                                                           | Step-by-step preparation instructions.                 |
| `meal_type`       | `meal_type`         | `NOT NULL`                                                                           | Category of the meal (e.g., 'breakfast', 'dinner').    |
| `difficulty`      | `recipe_difficulty` | `NOT NULL`                                                                           | Difficulty level ('easy', 'medium', 'hard').           |
| `is_ai_generated` | `boolean`           | `NOT NULL`, `DEFAULT false`                                                          | Flag to distinguish AI-generated recipes.              |
| `created_at`      | `timestamptz`       | `NOT NULL`, `DEFAULT now()`                                                          | Timestamp of recipe creation.                          |
| `updated_at`      | `timestamptz`       | `NOT NULL`, `DEFAULT now()`                                                          | Timestamp of the last recipe update.                   |

### `recipe_ingredients`

A join table linking recipes to their required ingredients from the `products` table.

- **Relationship**: Many-to-Many between `recipes` and `products`.
- **Primary Key**: `id`.

| Column      | Type          | Constraints                                                                       | Description                                     |
| ----------- | ------------- | --------------------------------------------------------------------------------- | ----------------------------------------------- |
| `id`        | `uuid`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                      | Unique identifier for the ingredient entry.     |
| `recipe_id` | `uuid`        | `NOT NULL`, `REFERENCES recipes(id) ON DELETE CASCADE`                            | Foreign key to the `recipes` table.             |
| `product_id`| `uuid`        | `NOT NULL`, `REFERENCES products(id) ON DELETE CASCADE`                           | Foreign key to the `products` table.            |
| `amount`    | `numeric`     | `NOT NULL`                                                                        | Quantity of the ingredient required.            |
| `unit`      | `recipe_unit` | `NOT NULL`                                                                        | Unit of measurement for the amount.             |
| `created_at`| `timestamptz` | `NOT NULL`, `DEFAULT now()`                                                       | Timestamp of ingredient entry creation.         |

## 3. Indexes

Indexes to optimize query performance.

- **Foreign Keys**: Indexes are automatically created for all foreign key columns by Supabase/PostgreSQL.
- **Custom Indexes**:
  ```sql
  CREATE INDEX idx_recipes_meal_type ON recipes(meal_type);
  ```

## 4. Row-Level Security (RLS)

RLS policies to ensure users can only access their own data. RLS must be enabled for each table.

```sql
-- Enable RLS for all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY; -- All users can read all products

-- Policies for `profiles`
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for `user_preferences`
CREATE POLICY "Users can manage their own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- Policies for `recipes`
CREATE POLICY "Users can manage their own recipes" ON recipes FOR ALL USING (auth.uid() = user_id);

-- Policies for `recipe_ingredients`
CREATE POLICY "Users can manage ingredients for their own recipes" ON recipe_ingredients FOR ALL USING (
  EXISTS (
    SELECT 1 FROM recipes WHERE recipes.id = recipe_id AND recipes.user_id = auth.uid()
  )
);

-- Policies for `products`
CREATE POLICY "All authenticated users can read products" ON products FOR SELECT TO authenticated USING (true);
```

## 5. Automation & Triggers

### Function & Trigger: `handle_new_user`

Automatically creates a `profiles` entry for each new user in `auth.users`.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Function & Trigger: `update_updated_at_column`

Automatically updates the `updated_at` timestamp on row modification.

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

### Function & Trigger: `validate_user_preferences`

Validates preference conflicts and enforces limits before inserting or updating `user_preferences`.

```sql
CREATE OR REPLACE FUNCTION public.validate_user_preferences()
RETURNS TRIGGER AS $$
DECLARE
  like_count INTEGER;
  dislike_count INTEGER;
  allergen_count INTEGER;
  conflicting_preference preference_type;
BEGIN
  -- 1. Check for conflicting preferences
  SELECT preference_type INTO conflicting_preference
  FROM user_preferences
  WHERE user_id = NEW.user_id AND product_id = NEW.product_id AND id != NEW.id;

  IF conflicting_preference IS NOT NULL THEN
    RAISE EXCEPTION 'Conflict: This product is already in the "%" list.', conflicting_preference;
  END IF;

  -- 2. Enforce the 30-item limit per category
  SELECT
    COUNT(*) FILTER (WHERE preference_type = 'like') INTO like_count,
    COUNT(*) FILTER (WHERE preference_type = 'dislike') INTO dislike_count,
    COUNT(*) FILTER (WHERE preference_type = 'allergen') INTO allergen_count
  FROM user_preferences
  WHERE user_id = NEW.user_id;

  IF NEW.preference_type = 'like' AND like_count >= 30 THEN
    RAISE EXCEPTION 'Limit reached: You cannot add more than 30 items to the "like" list.';
  ELSIF NEW.preference_type = 'dislike' AND dislike_count >= 30 THEN
    RAISE EXCEPTION 'Limit reached: You cannot add more than 30 items to the "dislike" list.';
  ELSIF NEW.preference_type = 'allergen' AND allergen_count >= 30 THEN
    RAISE EXCEPTION 'Limit reached: You cannot add more than 30 items to the "allergen" list.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_user_preferences_insert_update
  BEFORE INSERT OR UPDATE ON user_preferences
  FOR EACH ROW EXECUTE PROCEDURE public.validate_user_preferences();
```

### Scheduled Job: `reset_ai_requests`

A `pg_cron` job to reset `ai_requests_count` to 3 for all users daily at midnight UTC.

```sql
-- This command should be run in the Supabase SQL Editor to schedule the job.
-- It cannot be part of a migration script.
SELECT cron.schedule('reset-ai-requests-daily', '0 0 * * *', $$
  UPDATE public.profiles
  SET ai_requests_count = 3;
$$);
```
