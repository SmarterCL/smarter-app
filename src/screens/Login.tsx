import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Leaf, Smartphone, Zap, User } from 'lucide-react';
import { syncService } from '../lib/sync';

interface LoginProps {
  onLogin: (user: any) => void;
}

const API_BASE = 'https://api.smarterbot.store';

const isAndroid = () => {
  return /android/i.test(navigator.userAgent) || (window as any).android !== undefined;
};

export default function Login({ onLogin }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'web'>('web');
  const [rut, setRut] = useState('');
  const [rutError, setRutError] = useState('');

  useEffect(() => {
    setPlatform(isAndroid() ? 'android' : 'web');
    
    // Auto-login si hay token guardado
    const token = localStorage.getItem('smarter_token');
    if (token) {
      handleTokenLogin(token);
    }
  }, []);

  // Login con token existente
  const handleTokenLogin = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const user = await response.json();
        onLogin({ ...user, token });
      }
    } catch (err) {
      console.error('[AutoLogin] Error:', err);
      localStorage.removeItem('smarter_token');
    }
  };

  // Validar RUT en tiempo real
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRut(value);
    
    if (value.length > 5) {
      // Validación básica (completa en backend)
      const clean = value.replace(/\./g, '').replace('-', '').toUpperCase();
      if (clean.length < 8 || clean.length > 9) {
        setRutError('RUT inválido');
      } else {
        setRutError('');
      }
    } else {
      setRutError('');
    }
  };

  // Login como invitado (sin RUT)
  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const deviceId = syncService.getDeviceId() || `device-${Date.now()}`;
      const response = await fetch(`${API_BASE}/auth/login?device_id=${deviceId}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('smarter_token', data.token);
        console.log('[Login] ✅ Guest login:', data.user);
        onLogin({ ...data.user, token: data.token });
      }
    } catch (err: any) {
      console.error('[Guest Login] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Login con RUT
  const handleRutLogin = async () => {
    if (!rut || rutError) {
      setRutError('Ingresa un RUT válido');
      return;
    }

    setLoading(true);
    try {
      const deviceId = syncService.getDeviceId() || `device-${Date.now()}`;
      const response = await fetch(`${API_BASE}/auth/login-rut?rut=${encodeURIComponent(rut)}&device_id=${deviceId}`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('smarter_token', data.token);
        console.log('[Login] ✅ RUT login:', data.user);
        onLogin({ ...data.user, token: data.token });
      } else {
        const error = await response.json();
        setRutError(error.detail || 'Error al iniciar sesión');
      }
    } catch (err: any) {
      console.error('[RUT Login] Error:', err);
      setRutError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-2xl">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SmarterOS</h1>
          <p className="text-purple-200 text-sm">
            Ingresa con o sin RUT
          </p>
        </div>

        {/* Card Login */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-xl">
          {/* Platform Badge */}
          {platform === 'android' && (
            <div className="mb-6 flex items-center gap-2 bg-green-500/20 text-green-300 px-3 py-1.5 rounded-full text-xs font-bold w-fit">
              <Smartphone size={14} />
              Android • Chile
            </div>
          )}

          {/* Input RUT */}
          <div className="mb-6">
            <label className="block text-purple-200 text-sm font-bold mb-2">
              RUT (Opcional)
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
              <input
                type="text"
                value={rut}
                onChange={handleRutChange}
                placeholder="12.345.678-K"
                className={`w-full bg-white/5 border ${rutError ? 'border-red-500' : 'border-purple-500/30'} rounded-xl py-4 pl-12 pr-4 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500 transition-all font-mono`}
              />
            </div>
            {rutError && (
              <p className="text-red-400 text-xs mt-2">{rutError}</p>
            )}
            {rut.length > 8 && !rutError && (
              <p className="text-green-400 text-xs mt-2">✓ Formato válido</p>
            )}
          </div>

          {/* Botón Login con RUT */}
          <button
            onClick={handleRutLogin}
            disabled={loading || !rut || !!rutError}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-[0.98] mb-4"
          >
            {loading ? 'Iniciando...' : (rut ? 'Iniciar con RUT' : 'Ingresa tu RUT')}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-500/20"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900/50 px-3 text-purple-300 font-bold tracking-widest">O</span>
            </div>
          </div>

          {/* Acceso Invitado (SIN RUT) */}
          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-purple-500/30 text-purple-200 font-bold py-4 rounded-xl transition-all active:scale-[0.98]"
          >
            <Zap size={16} />
            Continuar sin RUT
          </button>

          {/* Info */}
          <div className="mt-6 text-center">
            <p className="text-purple-300/60 text-xs">
              El RUT solo se requiere para facturación
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[10px] text-purple-300/40 font-bold uppercase tracking-[0.2em]">
          SmarterOS Chile • v2.0.0
        </p>
      </motion.div>
    </div>
  );
}
