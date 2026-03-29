-- Criar tabela de Logs de Auditoria
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT
);

-- Criar tabela de Configurações de Sistema (Apenas 1 linha permitida)
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    audit_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Inserir o registro padrão
INSERT INTO system_settings (id, audit_enabled) VALUES (1, true) ON CONFLICT DO NOTHING;

-- Habilitar RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de Audit Logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs
FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

CREATE POLICY "Authenticated users can insert audit logs" ON audit_logs
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
);

-- Políticas de System Settings
CREATE POLICY "Authenticated users can read system settings" ON system_settings
FOR SELECT USING (
    auth.uid() IS NOT NULL
);

CREATE POLICY "Admins can update system settings" ON system_settings
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
