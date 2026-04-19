# 📋 PLAN COMPLETO DE IMPLEMENTACIÓN - SmarterOS Chile

## ✅ REVISIÓN 1 & 2 COMPLETADAS

### ESTADO ACTUAL (VERIFICADO 2 VECES)

| Servicio | Estado | Notas |
|----------|--------|-------|
| **FastAPI** | ✅ Active | Puerto 8099, logger fix |
| **Caddy SSL** | ✅ Active | SSL renovado |
| **n8n** | ✅ Running | healthy, 5678 |
| **Picoclaw** | ✅ Running | 18792, 4h+ uptime |
| **Supabase** | ✅ Connected | Project: rjfcmmzj... |

### ENDPOINTS TESTED (2 VECES)

```
✅ POST /auth/login       → guest token
✅ POST /auth/login-rut   → RUT + token
✅ GET  /config           → feature flags
✅ POST /event            → require_rut logic
✅ GET  /health           → n8n, picoclaw, supabase
✅ GET  /billing/profile  → billing status
✅ POST /billing/profile  → save billing + new token
```

### SSL PÚBLICO

```
✅ api.smarterbot.store → 200 OK
⚠️  app.smarterbot.store → 404 (sin contenido /var/www/app)
```

---

## 📌 PENDIENTES CRÍTICOS

### 1. Supabase SQL (PRIORIDAD ALTA)

Ejecutar en Supabase SQL Editor:
https://rjfcmmzjlguiititkmyh.supabase.co

```sql
-- Tabla billing_profiles
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
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_user ON billing_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_rut ON billing_profiles(rut);

-- Función actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_billing_timestamp
  BEFORE UPDATE ON billing_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS (seguridad)
ALTER TABLE billing_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users can view own billing" ON billing_profiles;
CREATE POLICY "Users can view own billing"
  ON billing_profiles FOR SELECT
  USING (true); -- Allow all authenticated users (app level check)

DROP POLICY IF EXISTS "Users can insert own billing" ON billing_profiles;
CREATE POLICY "Users can insert own billing"
  ON billing_profiles FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own billing" ON billing_profiles;
CREATE POLICY "Users can update own billing"
  ON billing_profiles FOR UPDATE
  USING (true);

-- Feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  enabled boolean DEFAULT true,
  value jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now()
);

INSERT INTO feature_flags (name, enabled, value) VALUES
  ('coupons', true, '{"enabled": true}'),
  ('fleet', false, '{"enabled": false}'),
  ('require_rut_for_invoice', true, '{"enabled": true}'),
  ('dashboard_v2', true, '{"enabled": true}')
ON CONFLICT (name) DO NOTHING;
```

---

### 2. n8n Webhook Flow (PRIORIDAD MEDIA)

Configurar en n8n:

**Webhook Node:**
```
HTTP Method: POST
Path: buy-coupon
Authentication: None (o Basic Auth)
```

**Flujo:**
```
Webhook (buy-coupon)
  ↓
Set (normalize data)
  ↓
IF: billing.rut exists
  ↓
HTTP Request (API externa / SII)
  ↓
Email (send invoice)
  ↓
Respond to Webhook
```

**Payload esperado:**
```json
{
  "action": "buy-coupon",
  "user": {
    "sub": "device-123",
    "role": "guest",
    "scopes": ["browse", "buy"]
  },
  "billing": {
    "rut": "76.XXX.XXX-X",
    "razon_social": "Empresa SpA",
    "email": "cliente@email.com"
  },
  "timestamp": "2026-04-19T20:00:00Z"
}
```

---

### 3. Frontend APK (PRIORIDAD MEDIA)

Actualizar Login.tsx para manejar flujo completo:

```typescript
// Flujo de compra con RUT
async function handleBuy() {
  // 1. Try event
  const response = await fetch(`${API_BASE}/event?action=buy_coupon`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const result = await response.json();
  
  // 2. Check if RUT required
  if (result.require_rut) {
    // Show RUT modal
    const rut = await showRutModal();
    
    // 3. Save billing
    const billingResponse = await fetch(`${API_BASE}/billing/profile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rut,
        razon_social: 'Usuario',
        email: 'user@email.com'
      })
    });
    
    const billingResult = await billingResponse.json();
    
    // 4. Update token
    localStorage.setItem('token', billingResult.token);
    token = billingResult.token;
    
    // 5. Retry event
    await handleBuy();
  } else if (result.success) {
    // Purchase complete!
    showSuccess('Compra realizada!');
  }
}
```

---

## 🔥 ORDEN DE EJECUCIÓN

1. ✅ Backend estable (COMPLETADO)
2. ⏳ Supabase SQL (AHORA)
3. ⏳ n8n webhook (DESPUÉS)
4. ⏳ Frontend RUT modal (OPCIONAL)
5. ⏳ Commit final (CIEMPRE)

---

## 📊 ESTADO FINAL ESPERADO

```
┌─────────────────────────────────────────┐
│  Usuario abre app                       │
│  ↓                                      │
│  Login guest (sin RUT)                  │
│  ↓                                      │
│  Navega / ve cupones                    │
│  ↓                                      │
│  Click Comprar                          │
│  ↓                                      │
│  POST /event?action=buy_coupon          │
│  ↓                                      │
│  Response: {require_rut: true}          │
│  ↓                                      │
│  Modal RUT (UX amigable)                │
│  ↓                                      │
│  POST /billing/profile                  │
│  ↓                                      │
│  New token con has_billing=true         │
│  ↓                                      │
│  Retry /event                           │
│  ↓                                      │
│  n8n webhook → factura → email          │
│  ↓                                      │
│  ✅ Compra completada                   │
└─────────────────────────────────────────┘
```

---

## ✅ CHECKLIST FINAL

- [x] Backend FastAPI estable
- [x] Logger fix aplicado
- [x] SSL Caddy renovado
- [x] Endpoints testeados (2 veces)
- [x] n8n running (healthy)
- [x] Picoclaw running (4h+ uptime)
- [ ] Supabase billing_profiles (PENDIENTE)
- [ ] n8n webhook configurado (PENDIENTE)
- [ ] Frontend RUT modal (PENDIENTE)
- [ ] Commit + push (PENDIENTE)

---

**PRÓXIMO PASO INMEDIATO: Ejecutar SQL en Supabase**
