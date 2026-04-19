/**
 * SmarterOS Identity Server - Backend para VPS
 * Autenticación con RUT + JWT + Supabase
 * 
 * ENDPOINTS:
 * POST /api/auth/validate  - Validar RUT
 * POST /api/auth/login     - Login + emitir JWT
 * GET  /api/auth/me        - Obtener perfil (requiere token)
 * POST /api/auth/logout    - Logout (revocar token)
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'smarter-secret-change-in-production';

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://rjfcmmzjlguiititkmyh.supabase.co',
  process.env.SUPABASE_KEY || 'your-anon-key'
);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// ============================================================
// UTILS - Validador de RUT
// ============================================================
function cleanRut(rut) {
  return rut.replace(/\./g, '').replace('-', '').toUpperCase();
}

function validateRut(rut) {
  try {
    const clean = cleanRut(rut);
    if (clean.length < 8 || clean.length > 9) return false;
    
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);
    
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
      sum += multiplier * parseInt(body[i], 10);
      multiplier = multiplier < 7 ? multiplier + 1 : 2;
    }
    
    const expected = 11 - (sum % 11);
    const dvCalc = expected === 11 ? '0' : expected === 10 ? 'K' : expected.toString();
    
    return dvCalc === dv;
  } catch (err) {
    return false;
  }
}

// ============================================================
// MIDDLEWARE - Auth
// ============================================================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ============================================================
// ENDPOINTS
// ============================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SmarterOS Identity',
    auth: 'JWT + RUT',
    supabase: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Validar RUT
app.post('/api/auth/validate', async (req, res) => {
  try {
    const { rut } = req.body;
    
    if (!rut) {
      return res.status(400).json({ error: 'RUT required' });
    }
    
    const isValid = validateRut(rut);
    const normalized = isValid ? cleanRut(rut) : null;
    
    res.json({
      valid: isValid,
      normalized,
      formatted: normalized ? formatRut(normalized) : null
    });
  } catch (err) {
    console.error('[Validate] Error:', err);
    res.status(500).json({ error: 'Validation error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { rut, device_id } = req.body;
    
    if (!rut || !device_id) {
      return res.status(400).json({ error: 'RUT and device_id required' });
    }
    
    // Validar RUT
    if (!validateRut(rut)) {
      return res.status(400).json({ error: 'Invalid RUT' });
    }
    
    const normalizedRut = cleanRut(rut);
    
    // Buscar o crear usuario
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('rut', normalizedRut)
      .single();
    
    if (!user) {
      // Crear usuario nuevo
      const { data: newUser } = await supabase
        .from('users')
        .insert([{
          rut: normalizedRut,
          email: `${normalizedRut}@smarterbot.store`,
          full_name: `Usuario ${normalizedRut}`,
          role: 'buyer'
        }])
        .select()
        .single();
      
      user = newUser;
      
      // Agregar scope por defecto
      await supabase
        .from('scopes')
        .insert([{ user_id: user.id, scope: 'coupon:buy' }]);
    }
    
    // Registrar dispositivo
    await supabase
      .from('devices')
      .upsert({
        user_id: user.id,
        device_id,
        platform: 'android',
        last_login: new Date().toISOString()
      }, {
        onConflict: 'user_id,device_id'
      });
    
    // Obtener scopes
    const { data: scopesData } = await supabase
      .from('scopes')
      .select('scope')
      .eq('user_id', user.id);
    
    const scopes = scopesData?.map(s => s.scope) || [];
    
    // Generar JWT
    const token = jwt.sign(
      {
        rut: user.rut,
        role: user.role,
        scopes,
        sub: user.id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Guardar token hash (para blacklist)
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    await supabase
      .from('auth_tokens')
      .insert([{
        user_id: user.id,
        token_hash: tokenHash,
        device_id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }]);
    
    // Log login
    await supabase
      .rpc('log_login_attempt', {
        p_user_id: user.id,
        p_device_id: device_id,
        p_ip_address: req.ip,
        p_user_agent: req.get('user-agent'),
        p_success: true
      });
    
    res.json({
      token,
      user: {
        rut: user.rut,
        role: user.role,
        scopes,
        devices: user.device_count || 1
      }
    });
    
  } catch (err) {
    console.error('[Login] Error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Obtener perfil (requiere auth)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ error: 'Profile error' });
  }
});

// Logout
app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Revocar token
    await supabase
      .from('auth_tokens')
      .update({ revoked: true })
      .eq('token_hash', tokenHash);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Helper: Formatear RUT
function formatRut(rut) {
  const body = rut.slice(0, -1);
  const dv = rut.slice(-1);
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
}

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🔐 SmarterOS Identity Server`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
  console.log(`   Supabase: ${process.env.SUPABASE_URL || 'configured'}`);
  console.log(`\n   Endpoints:`);
  console.log(`   POST /api/auth/validate`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/auth/me (protected)`);
  console.log(`   POST /api/auth/logout (protected)\n`);
});
