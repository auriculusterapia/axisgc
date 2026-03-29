-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'PROFESSIONAL', 'SECRETARY')),
  avatar_url TEXT,
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create patients table
CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  marital_status TEXT,
  profession TEXT,
  status TEXT DEFAULT 'Ativo',
  last_visit DATE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create appointments table
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration INTEGER DEFAULT 60,
  type TEXT NOT NULL, -- 'initial', 'return', 'emergency'
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  payment_status TEXT DEFAULT 'pendente', -- 'pago', 'pendente'
  price DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create consultations table
CREATE TABLE consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  main_complaint TEXT,
  history TEXT,
  tongue_diagnosis TEXT,
  pulse_diagnosis TEXT,
  syndrome_hypothesis TEXT,
  treatment_plan TEXT,
  points_used TEXT[], -- Array of auricular points
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create evaluations table
CREATE TABLE evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  data JSONB NOT NULL, -- Store full evaluation data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create protocols table
CREATE TABLE protocols (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points TEXT[], -- Array of auricular points
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;

-- Policies
-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Patients: Authenticated users can read/write
CREATE POLICY "Patients are viewable by authenticated users" ON patients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert patients" ON patients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update patients" ON patients
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete patients" ON patients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
  );

-- Similar policies for other tables...
-- Appointments
CREATE POLICY "Appointments viewable by authenticated" ON appointments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Appointments insertable by authenticated" ON appointments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Appointments updatable by authenticated" ON appointments FOR UPDATE USING (auth.role() = 'authenticated');

-- Consultations
CREATE POLICY "Consultations viewable by authenticated" ON consultations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Consultations insertable by authenticated" ON consultations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Evaluations
CREATE POLICY "Evaluations viewable by authenticated" ON evaluations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Evaluations insertable by authenticated" ON evaluations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Protocols
CREATE POLICY "Protocols viewable by authenticated" ON protocols FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Protocols insertable by authenticated" ON protocols FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Function to handle new user signup
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

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
