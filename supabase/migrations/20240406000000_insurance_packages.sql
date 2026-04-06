-- 1. Create Insurers (Operadoras)
CREATE TABLE IF NOT EXISTS insurers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ans_registration TEXT,
  cnpj TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Create Insurance Plans (Planos)
CREATE TABLE IF NOT EXISTS insurance_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  insurer_id UUID REFERENCES insurers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  external_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Patient Insurance Link
CREATE TABLE IF NOT EXISTS patient_insurances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES insurance_plans(id) ON DELETE CASCADE,
  card_number TEXT NOT NULL,
  validity_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Patient Packages (Pacotes)
CREATE TABLE IF NOT EXISTS patient_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_sessions INTEGER NOT NULL,
  used_sessions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  price DECIMAL(10, 2),
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 5. Enable RLS and add basic policies
ALTER TABLE insurers ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_insurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_packages ENABLE ROW LEVEL SECURITY;

-- Policies for insurers
DROP POLICY IF EXISTS "Allow authenticated view insurers" ON insurers;
CREATE POLICY "Allow authenticated view insurers" ON insurers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert insurers" ON insurers;
CREATE POLICY "Allow authenticated insert insurers" ON insurers FOR INSERT TO authenticated WITH CHECK (true);

-- Policies for insurance_plans
DROP POLICY IF EXISTS "Allow authenticated view plans" ON insurance_plans;
CREATE POLICY "Allow authenticated view plans" ON insurance_plans FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert plans" ON insurance_plans;
CREATE POLICY "Allow authenticated insert plans" ON insurance_plans FOR INSERT TO authenticated WITH CHECK (true);

-- Policies for patient_insurances
DROP POLICY IF EXISTS "Allow authenticated view patient_insurances" ON patient_insurances;
CREATE POLICY "Allow authenticated view patient_insurances" ON patient_insurances FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert patient_insurances" ON patient_insurances;
CREATE POLICY "Allow authenticated insert patient_insurances" ON patient_insurances FOR INSERT TO authenticated WITH CHECK (true);

-- Policies for patient_packages
DROP POLICY IF EXISTS "Allow authenticated view patient_packages" ON patient_packages;
CREATE POLICY "Allow authenticated view patient_packages" ON patient_packages FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert patient_packages" ON patient_packages;
CREATE POLICY "Allow authenticated insert patient_packages" ON patient_packages FOR INSERT TO authenticated WITH CHECK (true);
