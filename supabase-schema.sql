-- ============================================================
-- SmarterOS Identity - Supabase Schema
-- Autenticación con RUT + JWT + Devices
-- ============================================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: users
-- Usuarios autenticados por RUT
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  rut TEXT UNIQUE NOT NULL,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'buyer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_rut ON users(rut);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- TABLA: devices
-- Dispositivos registrados por usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  platform TEXT DEFAULT 'android',
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

CREATE INDEX idx_devices_user ON devices(user_id);
CREATE INDEX idx_devices_device ON devices(device_id);

-- ============================================================
-- TABLA: scopes
-- Permisos/alcances por usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS scopes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, scope)
);

CREATE INDEX idx_scopes_user ON scopes(user_id);

-- Scopes por defecto
INSERT INTO scopes (user_id, scope) 
SELECT id, 'coupon:buy' FROM users 
WHERE NOT EXISTS (
  SELECT 1 FROM scopes WHERE scopes.user_id = users.id AND scopes.scope = 'coupon:buy'
);

-- ============================================================
-- TABLA: auth_tokens
-- Tokens JWT emitidos (para blacklist/revocación)
-- ============================================================
CREATE TABLE IF NOT EXISTS auth_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  device_id TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tokens_user ON auth_tokens(user_id);
CREATE INDEX idx_tokens_expires ON auth_tokens(expires_at);

-- ============================================================
-- TABLA: login_history
-- Historial de logins (auditoría)
-- ============================================================
CREATE TABLE IF NOT EXISTS login_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  device_id TEXT,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_login_user ON login_history(user_id);
CREATE INDEX idx_login_created ON login_history(created_at);

-- ============================================================
-- FUNCIONES: Auto-update timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCIONES: Registro automático de login
-- ============================================================
CREATE OR REPLACE FUNCTION log_login_attempt(
  p_user_id uuid,
  p_device_id TEXT,
  p_ip_address INET,
  p_user_agent TEXT,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO login_history (user_id, device_id, ip_address, user_agent, success, error_message)
  VALUES (p_user_id, p_device_id, p_ip_address, p_user_agent, p_success, p_error_message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VISTAS: Dashboard rápido
-- ============================================================
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  u.id,
  u.rut,
  u.email,
  u.role,
  COUNT(DISTINCT d.id) as device_count,
  COUNT(DISTINCT s.scope) as scope_count,
  MAX(d.last_login) as last_login,
  u.created_at
FROM users u
LEFT JOIN devices d ON u.id = d.user_id
LEFT JOIN scopes s ON u.id = s.user_id
GROUP BY u.id, u.rut, u.email, u.role, u.created_at;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE scopes ENABLE ROW LEVEL SECURITY;

-- Políticas users
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Políticas devices
CREATE POLICY "Users can view own devices"
  ON devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
  ON devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas scopes
CREATE POLICY "Users can view own scopes"
  ON scopes FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- DATOS INICIALES (Demo)
-- ============================================================
INSERT INTO users (rut, email, full_name, role) VALUES
  ('11111111-1', 'demo@smarterbot.store', 'Usuario Demo', 'buyer'),
  ('22222222-2', 'admin@smarterbot.store', 'Admin Smarter', 'admin')
ON CONFLICT (rut) DO NOTHING;

-- Scopes por defecto para demo
INSERT INTO scopes (user_id, scope)
SELECT u.id, 'coupon:buy'
FROM users u
WHERE u.rut = '11111111-1'
ON CONFLICT (user_id, scope) DO NOTHING;

INSERT INTO scopes (user_id, scope)
SELECT u.id, scope
FROM users u, (VALUES ('coupon:buy'), ('coupon:send'), ('admin:all')) as s(scope)
WHERE u.rut = '22222222-2'
ON CONFLICT (user_id, scope) DO NOTHING;

-- ============================================================
-- COMENTARIOS
-- ============================================================
COMMENT ON TABLE users IS 'Usuarios autenticados por RUT';
COMMENT ON TABLE devices IS 'Dispositivos registrados por usuario';
COMMENT ON TABLE scopes IS 'Permisos y alcances por usuario';
COMMENT ON TABLE auth_tokens IS 'Tokens JWT emitidos (blacklist)';
COMMENT ON TABLE login_history IS 'Historial de logins para auditoría';
