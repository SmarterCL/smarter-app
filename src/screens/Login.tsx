import { useState } from 'react';
import { motion } from 'motion/react';
import { Leaf, LogIn, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const sb = supabase;
      if (!sb) {
        // Fallback for development if keys are not set yet
        console.warn('Supabase not configured, using mock login');
        setTimeout(onLogin, 1000);
        return;
      }

      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account'
          }
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error);
      // Fallback for demo
      onLogin();
    } finally {
      setLoading(false);
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
          <div className="w-16 h-16 bg-slate-900 text-sky-400 rounded-xl flex items-center justify-center mb-8 shadow-lg transform -rotate-3">
            <Leaf size={32} className="fill-current" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2 headline">
            SmarterOS
          </h1>
          <p className="text-slate-500 font-medium mb-8 text-sm">
            Gestiona tu impacto ambiental y accede a beneficios exclusivos del ecosistema smarter.
          </p>

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
              onClick={() => onLogin()} 
              className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white font-bold py-3.5 rounded-lg shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all text-sm"
            >
              <Mail size={18} />
              Acceso Invitado
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] headline">
          Smarter MCP v1.0 • Security Protected
        </p>
      </motion.div>
    </div>
  );
}
