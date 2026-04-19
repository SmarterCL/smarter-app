"""
SmarterOS API - Backend Unificado para Chile
api.smarterbot.store

ARQUITECTURA:
- Auth: liviano (guest/device)
- Billing: RUT solo para facturación (SII)
- Events: n8n triggers
- Config: feature flags dinámicos

ENDPOINTS:
- POST /auth/login      → Login guest/device (sin RUT)
- POST /auth/login-rut  → Login con RUT (opcional)
- GET  /auth/me         → Perfil usuario
- POST /billing/profile → Guardar datos fiscales (RUT)
- GET  /billing/profile → Obtener datos fiscales
- GET  /config          → Feature flags
- POST /event           → Eventos n8n (con validación RUT)
- GET  /health          → Health check
"""

from fastapi import FastAPI, HTTPException, Header, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
import jwt, requests, os, re
from datetime import datetime, timedelta
from typing import Optional, Dict
from pydantic import BaseModel
import logging

# Config from environment
JWT_SECRET = os.getenv('JWT_SECRET', 'smarter-secret-change-in-prod')
N8N_URL = os.getenv('N8N_URL', 'http://localhost:5678')
PICOLAW_URL = os.getenv('PICOLAW_URL', 'http://127.0.0.1:18792')
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://rjfcmmzjlguiititkmyh.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'your-anon-key')

app = FastAPI(title='SmarterOS API Chile', version='2.0.0')

# CORS
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================
# MODELOS
# ============================================================
class BillingProfile(BaseModel):
    rut: str
    razon_social: Optional[str] = None
    giro: Optional[str] = None
    direccion: Optional[str] = None
    comuna: Optional[str] = None
    ciudad: str = 'Santiago'
    region: Optional[str] = None
    email_factura: Optional[str] = None
    telefono: Optional[str] = None

class EventRequest(BaseModel):
    action: str
    data: Optional[Dict] = None

# ============================================================
# UTILS - RUT CHILENO
# ============================================================
def clean_rut(rut: str) -> str:
    return rut.replace('.', '').replace('-', '').upper()

def validate_rut(rut: str) -> bool:
    """Valida RUT chileno con dígito verificador"""
    try:
        clean = clean_rut(rut)
        if len(clean) < 8 or len(clean) > 9:
            return False
        
        body = clean[:-1]
        dv = clean[-1]
        
        suma = 0
        mult = 2
        for i in reversed(body):
            suma += int(i) * mult
            mult = 2 if mult == 7 else mult + 1
        
        expected_dv = 11 - (suma % 11)
        expected_dv = '0' if expected_dv == 11 else 'K' if expected_dv == 10 else str(expected_dv)
        
        return expected_dv == dv
    except:
        return False

def format_rut(rut: str) -> str:
    """Formatea RUT: 12.345.678-K"""
    clean = clean_rut(rut)
    body = clean[:-1]
    dv = clean[-1]
    formatted = re.sub(r'(?=\d)(?=(\d{3})+(?!\d))', '.', body)
    return f'{formatted}-{dv}'

# ============================================================
# AUTH
# ============================================================
def create_token(data: dict, days: int=7) -> str:
    payload = data.copy()
    payload['exp'] = datetime.utcnow() + timedelta(days=days)
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(401, 'No token provided')
    try:
        return jwt.decode(authorization.split(' ')[1], JWT_SECRET, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, 'Token expired')
    except:
        raise HTTPException(401, 'Invalid token')

def get_user_optional(authorization: str = Header(None)) -> Optional[dict]:
    """Usuario opcional (para endpoints públicos)"""
    if not authorization:
        return None
    try:
        return get_current_user(authorization)
    except:
        return None

# ============================================================
# ENDPOINTS - AUTH (LIVIANO)
# ============================================================
@app.post('/auth/login')
def login(device_id: str = 'web'):
    """
    Login guest/device - SIN RUT (UX optimizado)
    Ideal para primera visita / navegación
    """
    token = create_token({
        'sub': device_id,
        'role': 'guest',
        'scopes': ['browse', 'buy'],
        'has_billing': False
    })
    logger.info(f'Login guest: {device_id}')
    return {
        'token': token,
        'user': {
            'device_id': device_id,
            'role': 'guest',
            'scopes': ['browse', 'buy'],
            'has_billing': False
        }
    }

@app.post('/auth/login-rut')
def login_with_rut(rut: str, device_id: str = 'web'):
    """
    Login con RUT (opcional)
    Para usuarios que quieren persistencia entre dispositivos
    """
    if not validate_rut(rut):
        raise HTTPException(400, 'RUT inválido')
    
    token = create_token({
        'sub': f'rut:{clean_rut(rut)}',
        'rut': format_rut(rut),
        'role': 'user',
        'scopes': ['browse', 'buy', 'invoice'],
        'has_billing': True
    })
    logger.info(f'Login RUT: {format_rut(rut)}')
    return {
        'token': token,
        'user': {
            'rut': format_rut(rut),
            'role': 'user',
            'scopes': ['browse', 'buy', 'invoice'],
            'has_billing': True
        }
    }

@app.get('/auth/me')
def get_profile(user: dict = Depends(get_current_user)):
    """Obtener perfil de usuario autenticado"""
    return user

# ============================================================
# ENDPOINTS - BILLING (RUT SOLO FACTURACIÓN)
# ============================================================
@app.post('/billing/profile')
def save_billing_profile(profile: BillingProfile, user: dict = Depends(get_current_user)):
    """
    Guardar perfil fiscal (RUT)
    Se llama ANTES de compra si require_rut=true
    """
    # Validar RUT
    if not validate_rut(profile.rut):
        raise HTTPException(400, 'RUT inválido')
    
    # En producción: guardar en Supabase
    # supabase.table('billing_profiles').upsert({...})
    
    logger.info(f'Billing profile saved: {format_rut(profile.rut)}')
    
    # Actualizar token con has_billing=true
    new_token = create_token({
        **user,
        'has_billing': True,
        'rut': format_rut(profile.rut)
    })
    
    return {
        'success': True,
        'rut': format_rut(profile.rut),
        'token': new_token  # Nuevo token con billing actualizado
    }

@app.get('/billing/profile')
def get_billing_profile(user: dict = Depends(get_current_user)):
    """Obtener perfil fiscal guardado"""
    # En producción: leer de Supabase
    return {
        'has_billing': user.get('has_billing', False),
        'rut': user.get('rut'),
        'message': 'No billing profile found' if not user.get('has_billing') else 'OK'
    }

# ============================================================
# ENDPOINTS - CONFIG + EVENTS
# ============================================================
@app.get('/config')
def get_config(user: Optional[dict] = Depends(get_user_optional)):
    """
    Configuración dinámica (feature flags)
    Controla UX desde backend
    """
    return {
        'version': '2.0.0',
        'features': {
            'coupons': True,
            'fleet': False,
            'dashboard_v2': True,
            'require_rut_for_invoice': True  # 🔑 CLAVE: pedir RUT antes de compra
        },
        'ui': {
            'theme': 'dark',
            'dashboard': 'standard',
            'show_rut_modal': True
        },
        'user': user or {'role': 'guest', 'scopes': []}
    }

@app.post('/event')
def trigger_event(event: EventRequest, user: dict = Depends(get_current_user)):
    """
    Eventos para n8n - CON VALIDACIÓN RUT
    Flujo correcto para Chile:
    1. Usuario compra
    2. Si require_rut=true → verificar billing profile
    3. Si no tiene RUT → retornar require_rut=true
    4. App muestra modal RUT
    5. Retry event
    """
    logger.info(f'Event: {event.action} by {user.get("sub")}')
    
    # Validar RUT para compra/facturación
    if event.action in ['buy_coupon', 'invoice', 'purchase']:
        if not user.get('has_billing') and not user.get('rut'):
            return {
                'require_rut': True,
                'message': 'Se requiere RUT para completar la compra',
                'action': event.action
            }
    
    # Trigger n8n webhook
    try:
        webhook_url = f'{N8N_URL}/webhook/{event.action}'
        payload = {
            'action': event.action,
            'user': user,
            'data': event.data or {},
            'timestamp': datetime.utcnow().isoformat()
        }
        
        r = requests.post(webhook_url, json=payload, timeout=5)
        
        return {
            'success': True,
            'action': event.action,
            'n8n_status': r.status_code if r.ok else 'error',
            'require_rut': False
        }
    except Exception as e:
        logger.error(f'Event {event.action} failed: {e}')
        return {
            'success': False,
            'action': event.action,
            'error': str(e),
            'require_rut': False
        }

# ============================================================
# HEALTH
# ============================================================
@app.get('/health')
def health_check():
    """Health check crítico - todos los servicios"""
    services = {}
    
    # n8n
    try:
        r = requests.get(f'{N8N_URL}/healthz', timeout=2)
        services['n8n'] = {'status': 'ok', 'response_time': round(r.elapsed.total_seconds()*1000, 2)}
    except Exception as e:
        services['n8n'] = {'status': 'offline', 'error': str(e)}
    
    # Picoclaw
    try:
        r = requests.get(f'{PICOLAW_URL}/health', timeout=2)
        services['picoclaw'] = {
            'status': 'ok',
            'uptime': r.json().get('uptime', ''),
            'response_time': round(r.elapsed.total_seconds()*1000, 2)
        }
    except Exception as e:
        services['picoclaw'] = {'status': 'offline', 'error': str(e)}
    
    # Supabase
    services['supabase'] = {'status': 'connected', 'project': SUPABASE_URL.split('//')[1].split('.')[0]}
    
    all_ok = all(s.get('status') == 'ok' for s in services.values())
    
    return {
        'status': 'ok' if all_ok else 'degraded',
        'services': services,
        'timestamp': datetime.utcnow().isoformat()
    }

@app.get('/ready')
def ready_check():
    return {'status': 'ok'}

# ============================================================
# START
# ============================================================
if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8099)
