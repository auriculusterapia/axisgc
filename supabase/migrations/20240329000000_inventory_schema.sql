-- Create inventory_items table
CREATE TABLE inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  min_quantity DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  unit TEXT NOT NULL DEFAULT 'Unidade',
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create inventory_transactions table
CREATE TABLE inventory_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
  quantity DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for inventory_items
CREATE POLICY "Inventory items are viewable by authenticated users" ON inventory_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert inventory items" ON inventory_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update inventory items" ON inventory_items
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete inventory items" ON inventory_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

-- Policies for inventory_transactions
CREATE POLICY "Inventory transactions viewable by authenticated" ON inventory_transactions 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Inventory transactions insertable by authenticated" ON inventory_transactions 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Modify handle_new_user to include inventory permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role TEXT;
  v_permissions TEXT[];
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'PROFESSIONAL');
  
  -- Force admin role for special email
  IF new.email = 'auriculusterapia@gmail.com' THEN
    v_role := 'ADMIN';
  END IF;

  -- Try to get permissions from metadata if provided
  IF new.raw_user_meta_data->'permissions' IS NOT NULL THEN
    -- Convert JSON array to TEXT[]
    SELECT ARRAY_AGG(x)::TEXT[] INTO v_permissions
    FROM jsonb_array_elements_text(new.raw_user_meta_data->'permissions') AS x;
  ELSE
    -- Set default permissions based on role
    IF v_role = 'ADMIN' THEN
      v_permissions := ARRAY[
        'dashboard', 'dashboard:view',
        'patients', 'patients:view', 'patients:create', 'patients:edit', 'patients:delete',
        'evaluations', 'evaluations:view', 'evaluations:create', 'evaluations:edit', 'evaluations:delete',
        'calendar', 'calendar:view', 'calendar:create', 'calendar:edit', 'calendar:delete',
        'auricular', 'auricular:view', 'auricular:edit',
        'protocols', 'protocols:view', 'protocols:create', 'protocols:edit', 'protocols:delete',
        'financial', 'financial:view', 'financial:create', 'financial:reports',
        'inventory', 'inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete',
        'users', 'users:view', 'users:create', 'users:edit', 'users:delete',
        'settings', 'settings:profile', 'settings:clinic', 'settings:users', 'settings:backup'
      ];
    ELSIF v_role = 'PROFESSIONAL' THEN
      v_permissions := ARRAY[
        'dashboard', 'dashboard:view',
        'patients', 'patients:view', 'patients:create', 'patients:edit',
        'evaluations', 'evaluations:view', 'evaluations:create', 'evaluations:edit',
        'calendar', 'calendar:view', 'calendar:create', 'calendar:edit',
        'auricular', 'auricular:view', 'auricular:edit',
        'protocols', 'protocols:view', 'protocols:create', 'protocols:edit',
        'inventory', 'inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete',
        'settings', 'settings:profile'
      ];
    ELSE -- SECRETARY
      v_permissions := ARRAY[
        'dashboard', 'dashboard:view',
        'patients', 'patients:view', 'patients:create',
        'calendar', 'calendar:view', 'calendar:create', 'calendar:edit',
        'settings', 'settings:profile'
      ];
    END IF;
  END IF;

  INSERT INTO public.profiles (id, name, email, role, permissions)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    v_role,
    v_permissions
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
