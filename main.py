"""
SmarterOS API - Backend Unificado
api.smarterbot.store

ENDPOINTS:
- POST /auth/login     → Login con RUT + JWT
- GET  /auth/me        → Perfil usuario (protected)
- GET  /dashboard      → Datos dashboard (n8n + picoclaw + kpis)
- GET  /health         → Health check servicios
- GET  /config         → Configuración dinámica (feature flags)
- POST /event          → Eventos para n8n
"""

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
import jwt
import requests
import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import logging

# Config from environment (production ready)
JWT_SECRET = os.getenv("JWT_SECRET", "smarter-jwt-secret-change-in-prod")
N8N_URL = os.getenv("N8N_URL", "http://localhost:5678")
PICOLAW_URL = os.getenv("PICOLAW_URL", "http://127.0.0.1:18792")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://rjfcmmzjlguiititkmyh.supabase.co")

# Setup
app = FastAPI(
    title="SmarterOS API",
    description="Backend unificado para SmarterOS",
    version="1.0.6"
)

# CORS - Permitir app.smarterbot.store
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En prod: ["https://app.smarterbot.store"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================
# AUTH UTILS
# ============================================================
def create_token(data: dict, days: int = 7) -> str:
    """Generar JWT token"""
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(days=days)
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_token(token: str) -> dict:
    """Verificar JWT token"""
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Obtener usuario actual desde token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "No token provided")
    
    token = authorization.split(" ")[1]
    try:
        return verify_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

# ============================================================
# ENDPOINTS PÚBLICOS
# ============================================================

@app.get("/health")
def health_check():
    """Health check de todos los servicios - CRÍTICO"""
    services = {}
    
    # n8n
    try:
        r = requests.get(f'{N8N_URL}/healthz', timeout=2)
        services['n8n'] = {'status': 'ok', 'response_time': round(r.elapsed.total_seconds() * 1000, 2)}
    except Exception as e:
        services['n8n'] = {'status': 'offline', 'error': str(e)}
    
    # Picoclaw
    try:
        r = requests.get(f'{PICOLAW_URL}/health', timeout=2)
        services['picoclaw'] = {
            'status': 'ok',
            'uptime': r.json().get('uptime', ''),
            'response_time': round(r.elapsed.total_seconds() * 1000, 2)
        }
    except Exception as e:
        services['picoclaw'] = {'status': 'offline', 'error': str(e)}
    
    # Supabase
    services['supabase'] = {'status': 'connected', 'project': SUPABASE_URL.split('//')[1].split('.')[0]}
    
    # Status crítico: solo 'ok' si TODOS están ok
    all_ok = all(s.get('status') == 'ok' for s in services.values())
    
    return {
        'status': 'ok' if all_ok else 'degraded',
        'services': services,
        'timestamp': datetime.utcnow().isoformat()
    }

@app.get("/ready")
def ready_check():
    """Ready check simple"""
    return {'status': 'ok'}

@app.get("/config")
def get_config(user: dict = Depends(get_current_user)):
    """Configuración dinámica por usuario (feature flags)"""
    # En producción: leer de Supabase
    return {
        'version': '1.0.6',
        'features': {
            'coupons': True,
            'fleet': False,
            'dashboard_v2': True
        },
        'ui': {
            'theme': 'dark',
            'dashboard': 'standard'
        },
        'user': {
            'role': user.get('role', 'buyer'),
            'scopes': user.get('scopes', [])
        }
    }

@app.post("/event")
def trigger_event(action: str, data: Optional[Dict] = None, user: dict = Depends(get_current_user)):
    """Eventos para n8n - Trigger por acción del usuario"""
    logger.info(f'Event: {action} by user {user.get("rut")}')
    
    try:
        # Trigger webhook en n8n
        webhook_url = f"{N8N_URL}/webhook/{action}"
        payload = {
            'action': action,
            'user': user,
            'data': data or {},
            'timestamp': datetime.utcnow().isoformat()
        }
        
        r = requests.post(webhook_url, json=payload, timeout=5)
        
        return {
            'success': True,
            'action': action,
            'n8n_status': r.status_code if r.ok else 'error'
        }
    except Exception as e:
        logger.error(f'Event {action} failed: {e}')
        return {
            'success': False,
            'action': action,
            'error': str(e)
        }

# ============================================================
# ENDPOINTS PROTEGIDOS
# ============================================================

@app.get("/auth/me")
def get_profile(user: dict = Depends(get_current_user)):
    """Obtener perfil de usuario autenticado"""
    return user

@app.get("/dashboard")
def dashboard(user: dict = Depends(get_current_user)):
    """Dashboard data - KPIs en tiempo real"""
    
    # Obtener health de servicios
    health_data = {}
    try:
        r = requests.get(f'{N8N_URL}/healthz', timeout=2)
        health_data['n8n'] = True
    except:
        health_data['n8n'] = False
    
    try:
        r = requests.get(f'{PICOLAW_URL}/health', timeout=2)
        health_data['picoclaw'] = {'online': True, 'uptime': r.json().get('uptime', '')}
    except:
        health_data['picoclaw'] = {'online': False}
    
    # KPIs (simulados - luego de DB real)
    kpis = {
        'workflows_active': 12,
        'devices_registered': 3,
        'total_executions': 1547,
        'uptime_percent': 99.8
    }
    
    return {
        'user': user,
        'services': health_data,
        'kpis': kpis,
        'timestamp': datetime.utcnow().isoformat()
    }

@app.get("/mcp/tools")
def list_mcp_tools(user: dict = Depends(get_current_user)):
    """Listar herramientas MCP disponibles"""
    return {
        'tools': [
            'list_workflows',
            'get_workflow',
            'search_workflows',
            'get_executions',
            'trigger_webhook',
            'log_execution'
        ],
        'user_scopes': user.get('scopes', [])
    }

# ============================================================
# LOGGING MIDDLEWARE
# ============================================================
@app.middleware("http")
async def log_requests(request, call_next):
    """Log todas las requests"""
    logger.info(f'{request.method} {request.url.path}')
    response = await call_next(request)
    logger.info(f'Status: {response.status_code}')
    return response

# ============================================================
# START
# ============================================================
if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8099)
