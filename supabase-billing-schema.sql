-- ============================================================
-- SmarterOS Chile - Billing Profiles + Feature Flags
-- Ejecutar en: https://rjfcmmzjlguiititkmyh.supabase.co/sql
-- ============================================================

-- Habilitar UUID si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABLA billing_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  rut text NOT NULL,
  razon_social text,
  giro text,
  direccion text,
  comuna text,
  ciudad text DEFAULT 'Santiago',
  region text,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_user ON billing_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_rut ON billing_profiles(rut);
CREATE INDEX IF NOT EXISTS idx_billing_created ON billing_profiles(created_at);

-- Comentario
COMMENT ON TABLE billing_profiles IS 'Perfiles de facturación por usuario (RUT chileno)';

-- ============================================================
-- 2. FUNCIÓN update_updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para billing_profiles
DROP TRIGGER IF EXISTS update_billing_timestamp ON billing_profiles;
CREATE TRIGGER update_billing_timestamp
  BEFORE UPDATE ON billing_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE billing_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can view own billing" ON billing_profiles;
CREATE POLICY "Users can view own billing"
  ON billing_profiles FOR SELECT
  USING (true); -- Permitir lectura a usuarios autenticados

DROP POLICY IF EXISTS "Users can insert own billing" ON billing_profiles;
CREATE POLICY "Users can insert own billing"
  ON billing_profiles FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own billing" ON billing_profiles;
CREATE POLICY "Users can update own billing"
  ON billing_profiles FOR UPDATE
  USING (true);

-- ============================================================
-- 4. TABLA feature_flags
-- ============================================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  enabled boolean DEFAULT true,
  value jsonb DEFAULT '{}',
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);

-- Comentario
COMMENT ON TABLE feature_flags IS 'Feature flags para configuración dinámica del sistema';

-- Trigger para feature_flags
DROP TRIGGER IF EXISTS update_feature_flags_timestamp ON feature_flags;
CREATE TRIGGER update_feature_flags_timestamp
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. DATOS INICIALES (feature flags)
-- ============================================================
INSERT INTO feature_flags (name, enabled, value, description) VALUES
  ('coupons', true, '{"enabled": true, "label": "Cupones"}', 'Habilitar compra de cupones'),
  ('fleet', false, '{"enabled": false, "label": "Flota"}', 'Habilitar gestión de flota'),
  ('require_rut_for_invoice', true, '{"enabled": true, "label": "RUT requerido"}', 'Requerir RUT para facturación'),
  ('dashboard_v2', true, '{"enabled": true, "label": "Dashboard V2"}', 'Nueva versión del dashboard'),
  ('auto_login', true, '{"enabled": true}', 'Auto-login con sesión guardada'),
  ('guest_checkout', true, '{"enabled": true}', 'Checkout como invitado sin RUT inicial')
ON CONFLICT (name) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  value = EXCLUDED.value,
  updated_at = now();

-- ============================================================
-- 6. VISTA user_stats (dashboard rápido)
-- ============================================================
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.id,
  u.rut,
  u.email,
  u.created_at,
  COUNT(DISTINCT b.id) as billing_profiles,
  MAX(b.created_at) as last_billing_update
FROM (
  SELECT DISTINCT ON (user_id) 
    id, user_id, rut, email, created_at
  FROM billing_profiles
  ORDER BY user_id, created_at DESC
) b
RIGHT JOIN (
  SELECT DISTINCT user_id, rut, email, created_at
  FROM billing_profiles
) u ON b.user_id = u.user_id
GROUP BY u.id, u.rut, u.email, u.created_at;

-- ============================================================
-- 7. FUNCIÓN get_or_create_billing (utility)
-- ============================================================
CREATE OR REPLACE FUNCTION get_or_create_billing(
  p_user_id text,
  p_rut text DEFAULT NULL,
  p_email text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id text,
  rut text,
  email text,
  created_at timestamp with time zone
) AS $$
DECLARE
  v_billing_id uuid;
BEGIN
  -- Intentar obtener existente
  SELECT id INTO v_billing_id
  FROM billing_profiles
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Si no existe y se提供了 RUT, crear nuevo
  IF v_billing_id IS NULL AND p_rut IS NOT NULL THEN
    INSERT INTO billing_profiles (user_id, rut, email)
    VALUES (p_user_id, p_rut, p_email)
    RETURNING id INTO v_billing_id;
  END IF;

  -- Retornar resultado
  RETURN QUERY
  SELECT bp.id, bp.user_id, bp.rut, bp.email, bp.created_at
  FROM billing_profiles bp
  WHERE bp.id = v_billing_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8. VERIFICACIÓN
-- ============================================================
-- Ejecutar para verificar que todo está creado:
-- SELECT 'billing_profiles' as table_name, count(*) as rows FROM billing_profiles
-- UNION ALL
-- SELECT 'feature_flags', count(*) FROM feature_flags;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
