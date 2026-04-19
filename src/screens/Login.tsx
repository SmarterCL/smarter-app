import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Leaf, LogIn, Mail, Smartphone, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { syncService } from '../lib/sync';

interface LoginProps {
  onLogin: (user: any) => void;
}

// Configuración de endpoints
const API_ENDPOINTS = {
  RUT_OAUTH: 'https://rut.smarterbot.store',
  PICOLAW: 'https://flow.smarterbot.cl',
  LOCAL_RUT: 'http://localhost:8080',
  LOCAL_PICOLAW: 'http://localhost:18792'
};

const isAndroid = () => {
  return /android/i.test(navigator.userAgent) || (window as any).android !== undefined;
};

const isWeb = () => !isAndroid();

// Verificar si hay sesión guardada
const hasPersistentSession = (): boolean => {
  const savedSession = localStorage.getItem('smarter_session');
  const savedDeviceId = syncService.getDeviceId();
  return !!(savedSession || savedDeviceId);
};

const getSavedSession = (): any => {
  try {
    const saved = localStorage.getItem('smarter_session');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export default function Login({ onLogin }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'web'>('web');
  const [configuring, setConfiguring] = useState(false);
  const [status, setStatus] = useState<{ rut: boolean; picoclaw: boolean }>({ rut: false, picoclaw: false });
  const [autoLoginExecuting, setAutoLoginExecuting] = useState(false);

  // Verificar estado de backends
  const checkBackendStatus = async () => {
    try {
      const rutResponse = await fetch(`${API_ENDPOINTS.RUT_OAUTH}/`, { method: 'GET', mode: 'cors' }).catch(() => null);
      const picoclawResponse = await fetch(`${API_ENDPOINTS.PICOLAW}/health`, { method: 'GET', mode: 'cors' }).catch(() => null);

      setStatus({
        rut: rutResponse?.ok || false,
        picoclaw: picoclawResponse?.ok || false
      });
    } catch (err) {
      console.error('Backend status check failed:', err);
    }
  };

  // Auto-login con sesión guardada - DEFINIDA ANTES DEL USEEFFECT
  const handleAutoLogin = async (userData: any) => {
    console.log('[Login] ✅ Auto-login con sesión persistente:', userData.email);
    
    try {
      // Sincronizar con backend si es Android
      if (syncService.getDeviceId()) {
        await syncService.syncUser(userData);
        syncService.startHeartbeat(30000);
      }
    } catch (err) {
      console.error('[AutoLogin] Error sincronizando:', err);
    }
    
    // LLAMAR A ONLOGIN - Esto pasa al usuario a la app principal
    onLogin(userData);
  };

  // useEffect para auto-login
  useEffect(() => {
    setPlatform(isAndroid() ? 'android' : 'web');
    checkBackendStatus();

    // AUTO-LOGIN: Buscar sesión guardada y pasar directo
    const savedSession = getSavedSession();
    if (savedSession && !autoLoginExecuting) {
      console.log('[Login] ✅ Sesión persistente encontrada:', savedSession.email);
      setAutoLoginExecuting(true);
      // Ejecutar auto-login inmediatamente
      handleAutoLogin(savedSession);
    }
  }, []); // Empty deps array - solo se ejecuta una vez al montar

  // Sincronizar login Android con backend RUT
  const handleAndroidLogin = async (email: string) => {
    try {
      // 1. Registrar dispositivo en RUT OAuth
      const response = await fetch(`${API_ENDPOINTS.RUT_OAUTH}/api/device/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          deviceId: `android-${Date.now()}`,
          platform: 'android',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Android Login] Device registered:', data);
        
        // 2. Enviar heartbeat a Picoclaw
        await fetch(`${API_ENDPOINTS.PICOLAW}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeId: data.deviceId,
            timestamp: Date.now(),
            status: 'active',
            connectivity: 'online'
          })
        });

        return data;
      }

      return null;
    } catch (err) {
      console.error('[Android Login] Error:', err);
      return null;
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const sb = supabase;
      if (!sb) {
        console.warn('Supabase not configured, using mock login');
        const mockUser = { email: 'user@smarterbot.store', provider: 'google', name: 'Usuario' };
        
        // GUARDAR SESIÓN PERSISTENTE
        localStorage.setItem('smarter_session', JSON.stringify(mockUser));
        
        if (platform === 'android') {
          await syncService.syncUser(mockUser);
        }
        
        setTimeout(() => onLogin(mockUser), 1000);
        return;
      }

      let redirectTo = window.location.origin.replace(/\/$/, "");
      if (!redirectTo.includes('localhost') && !redirectTo.includes('run.app')) {
        redirectTo = 'https://localhost';
      }

      console.log('Login Auth -> Redirect URI:', redirectTo);

      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: { prompt: 'select_account' }
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error);
      const mockUser = { email: 'guest@smarterbot.store', provider: 'google', name: 'Usuario' };
      
      // GUARDAR SESIÓN PERSISTENTE
      localStorage.setItem('smarter_session', JSON.stringify(mockUser));
      
      if (platform === 'android') {
        await syncService.syncUser(mockUser);
      }
      
      onLogin(mockUser);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const guestEmail = `guest-${Date.now()}@smarterbot.store`;
      const guestUser = { 
        id: `guest-${Date.now()}`,
        email: guestEmail, 
        provider: 'guest', 
        name: 'Invitado',
        balance: 0,
        activeCoupons: 0
      };

      console.log('[Guest Login] Iniciando como invitado:', guestEmail);

      // GUARDAR SESIÓN PERSISTENTE
      localStorage.setItem('smarter_session', JSON.stringify(guestUser));

      // Sincronizar con backend si es Android
      if (platform === 'android' && syncService.getDeviceId()) {
        try {
          await syncService.syncUser(guestUser);
        } catch (err) {
          console.error('[Guest] Error sincronizando:', err);
        }
      }

      console.log('[Guest Login] ✅ Login exitoso, llamando a onLogin');
      
      // IMPORTANTE: Llamar a onLogin para pasar a la app principal
      onLogin(guestUser);
      
    } catch (error) {
      console.error('[Guest Login] Error:', error);
      const fallbackUser = { 
        id: 'guest-fallback',
        email: 'guest@smarterbot.store', 
        provider: 'guest', 
        name: 'Invitado',
        balance: 0,
        activeCoupons: 0
      };
      localStorage.setItem('smarter_session', JSON.stringify(fallbackUser));
      onLogin(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  // Configurar conexión con backend
  const configureBackend = async () => {
    setConfiguring(true);
    try {
      // Intentar conexión local primero
      const localCheck = await fetch(`${API_ENDPOINTS.LOCAL_RUT}/`).catch(() => null);
      
      if (localCheck?.ok) {
        console.log('[Config] Local backend detected');
      } else {
        // Verificar conexión remota
        const remoteCheck = await fetch(`${API_ENDPOINTS.RUT_OAUTH}/`).catch(() => null);
        if (remoteCheck?.ok) {
          console.log('[Config] Remote backend detected');
        }
      }
      
      checkBackendStatus();
    } catch (err) {
      console.error('[Config] Error:', err);
    } finally {
      setConfiguring(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-sky-100/50 rounded-full blur-[100px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-200/50 rounded-full blur-[100px] -ml-48 -mb-48" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
          {/* Logo */}
          <div className="w-16 h-16 bg-slate-900 text-sky-400 rounded-xl flex items-center justify-center mb-8 shadow-lg transform -rotate-3">
            <Leaf size={32} className="fill-current" />
          </div>

          {/* Platform Badge */}
          {platform === 'android' && (
            <div className="mb-4 flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold">
              <Smartphone size={14} />
              Android App • Sincronizado con RUT OAuth
            </div>
          )}

          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2 headline">
            SmarterOS
          </h1>
          <p className="text-slate-500 font-medium mb-8 text-sm">
            Gestiona tu impacto ambiental y accede a beneficios exclusivos.
          </p>

          {/* Backend Status */}
          <div className="mb-6 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-500 font-medium">Estado del Backend:</span>
              <button 
                onClick={configureBackend}
                disabled={configuring}
                className="text-sky-600 font-bold hover:underline disabled:opacity-50"
              >
                {configuring ? '...' : 'Actualizar'}
              </button>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">RUT OAuth</span>
                <span className={`text-xs font-bold ${status.rut ? 'text-green-600' : 'text-red-500'}`}>
                  {status.rut ? '● Online' : '● Offline'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Picoclaw</span>
                <span className={`text-xs font-bold ${status.picoclaw ? 'text-green-600' : 'text-red-500'}`}>
                  {status.picoclaw ? '● Online' : '● Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Login Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-700 font-bold py-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.9 2.25c1.7-1.57 2.69-3.88 2.69-6.6z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.25c-.8.54-1.83.85-3.06.85-2.35 0-4.35-1.58-5.06-3.71l-3 2.33C2.42 15.82 5.48 18 9 18z" fill="#34A853"/>
                <path d="M3.94 10.71c-.18-.54-.28-1.11-.28-1.71s.1-1.17.28-1.71l-3-2.33C.36 6.13 0 7.53 0 9s.36 2.87 1.05 4.04l3-2.33z" fill="#FBBC05"/>
                <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0 5.48 0 2.42 2.18 1.05 4.96l3 2.33c.71-2.13 2.71-3.71 5.06-3.71z" fill="#EA4335"/>
              </svg>
              {loading ? 'Iniciando...' : 'Continuar con Google'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-bold tracking-widest">O</span>
              </div>
            </div>

            <button
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white font-bold py-3.5 rounded-lg shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all text-sm"
            >
              <Mail size={18} />
              Acceso Invitado
            </button>

            {/* BOTÓN SALTAR LOGIN - Para desarrollo/testing */}
            <button
              onClick={() => {
                console.log('[Skip Login] ⚡ Saltando login...');
                const skipUser = { 
                  id: `skip-${Date.now()}`,
                  email: 'skip@local.dev', 
                  provider: 'skip', 
                  name: 'Demo',
                  balance: 1000,
                  activeCoupons: 5
                };
                localStorage.setItem('smarter_session', JSON.stringify(skipUser));
                console.log('[Skip Login] ✅ Sesión guardada, llamando a onLogin');
                onLogin(skipUser);
              }}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 text-white font-bold py-3 rounded-lg hover:bg-sky-700 active:scale-[0.98] transition-all text-xs mt-4"
            >
              <Zap size={16} />
              Saltar Login (Demo)
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] headline">
          Smarter MCP v1.0 • {platform === 'android' ? 'Android Sync' : 'Web'} • Security Protected
        </p>
      </motion.div>
    </div>
  );
}
