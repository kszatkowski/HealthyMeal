# HealthyMeal - Database Schema

This document outlines the PostgreSQL database schema for the HealthyMeal application, designed for implementation on the Supabase platform.

## 1. ENUM Types

Custom ENUM types to ensure data consistency across the application.

```sql
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'dessert', 'snack');
CREATE TYPE recipe_difficulty AS ENUM ('easy', 'medium', 'hard');
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
| `disliked_ingredients_note`          | `varchar(200)`|                                           | Free-form text listing ingredients the user wants to avoid.                  |
| `allergens_note`                     | `varchar(200)`|                                           | Free-form text listing allergen warnings provided by the user.              |
| `onboarding_notification_hidden_until` | `timestamptz` |                                           | Stores the timestamp until which the onboarding notification should be hidden. |
| `created_at`                         | `timestamptz` | `NOT NULL`, `DEFAULT now()`               | Timestamp of profile creation.                                              |
| `updated_at`                         | `timestamptz` | `NOT NULL`, `DEFAULT now()`               | Timestamp of the last profile update.                                       |

### `recipes`

Stores all recipes, both user-created and AI-generated.

- **Relationship**: Many-to-One with `users`.
- **Primary Key**: `id`.

| Column            | Type                | Constraints                                                                          | Description                                            |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `id`              | `uuid`              | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                           | Unique identifier for the recipe.                      |
| `user_id`         | `uuid`              | `NOT NULL`, `REFERENCES users(id) ON DELETE CASCADE`                              | Foreign key to the user who owns the recipe.           |
| `name`            | `varchar(50)`              | `NOT NULL`                                                                           | Name of the recipe.                                    |
| `instructions`    | `varchar(5000)`              | `NOT NULL`                                                                           | Step-by-step preparation instructions.                 |
| `ingredients`    | `varchar(1000)`              | `NOT NULL`                                                                           | Ingredients for the meal.                 |
| `meal_type`       | `meal_type`         | `NOT NULL`                                                                           | Category of the meal (e.g., 'breakfast', 'dinner').    |
| `difficulty`      | `recipe_difficulty` | `NOT NULL`                                                                           | Difficulty level ('easy', 'medium', 'hard').           |
| `is_ai_generated` | `boolean`           | `NOT NULL`, `DEFAULT false`                                                          | Flag to distinguish AI-generated recipes.              |
| `created_at`      | `timestamptz`       | `NOT NULL`, `DEFAULT now()`                                                          | Timestamp of recipe creation.                          |
| `updated_at`      | `timestamptz`       | `NOT NULL`, `DEFAULT now()`                                                          | Timestamp of the last recipe update.                   |

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
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Policies for `profiles`
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for `recipes`
CREATE POLICY "Users can manage their own recipes" ON recipes FOR ALL USING (auth.uid() = user_id);
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
