-- Supabase Migration SQL for NutriSnap AI
-- Run this in Supabase SQL Editor to add required columns

-- 1. Add height_cm, age, gender, first_name, last_name columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS height_cm NUMERIC,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 2. Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Ensure avatar_stats has user_id foreign key reference
-- (Should already exist, but adding for completeness)
ALTER TABLE avatar_stats
ADD CONSTRAINT fk_avatar_stats_user_id
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 4. Ensure meals table has user_id foreign key
ALTER TABLE meals
ADD CONSTRAINT fk_meals_user_id
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 5. Ensure meal_items table has meal_id foreign key
ALTER TABLE meal_items
ADD CONSTRAINT fk_meal_items_meal_id
FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE;

-- 6. RLS Policies for users table
-- Enable RLS (should already be enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 7. RLS Policies for avatar_stats
ALTER TABLE avatar_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own avatar" ON avatar_stats;
CREATE POLICY "Users can view own avatar" ON avatar_stats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own avatar" ON avatar_stats;
CREATE POLICY "Users can insert own avatar" ON avatar_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own avatar" ON avatar_stats;
CREATE POLICY "Users can update own avatar" ON avatar_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- 8. RLS Policies for meals
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own meals" ON meals;
CREATE POLICY "Users can view own meals" ON meals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own meals" ON meals;
CREATE POLICY "Users can insert own meals" ON meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. RLS Policies for meal_items (access via meals)
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own meal items" ON meal_items;
CREATE POLICY "Users can view own meal items" ON meal_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own meal items" ON meal_items;
CREATE POLICY "Users can insert own meal items" ON meal_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM meals WHERE meals.id = meal_items.meal_id AND meals.user_id = auth.uid()
    )
  );

-- 10. Function to create user profile on signup (optional, for auto-profile creation)
-- This can be used as a database trigger if you want automatic profile creation
/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.avatar_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/