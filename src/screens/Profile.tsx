import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, LogOut, ChevronRight, Award, Shield, Bell, HelpCircle, Heart, User } from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';

interface ProfileProps {
  user: UserProfile;
  onLogout: () => void;
}

export default function Profile({ user, onLogout }: ProfileProps) {
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (data) setDbProfile(data);
        }
      } catch (e) {
        console.error("Error loading real profile data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    onLogout();
  };

  const menuItems = [
    { icon: Award, label: 'Mis Logros', color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Heart, label: 'Mis Favoritos', color: 'text-rose-500', bg: 'bg-rose-50' },
    { icon: Bell, label: 'Notificaciones', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: Shield, label: 'Privacidad y Seguridad', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: HelpCircle, label: 'Centro de Ayuda', color: 'text-slate-500', bg: 'bg-slate-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white px-6 pt-12 pb-8 rounded-b-[3rem] shadow-sm border-b border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />

        <div className="flex justify-between items-start mb-6">
          <h1 className="font-headline font-bold text-2xl text-slate-900">Mi Perfil</h1>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Settings size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-2xl mb-4">
              <img
                src={dbProfile?.avatar_url || user.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute bottom-4 right-0 w-8 h-8 bg-success rounded-full border-4 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>

          <h2 className="text-2xl font-bold headline text-slate-900">{dbProfile?.full_name || user.name}</h2>
          <p className="text-slate-500 font-medium text-sm">{user.email}</p>

          <div className="mt-6 flex gap-3">
             <div className="bg-slate-900 text-white px-6 py-2 rounded-full text-xs font-bold headline flex items-center gap-2">
               <Award size={14} className="text-amber-400" />
               Nivel {dbProfile?.impact_level || 'Héroe'}
             </div>
             {dbProfile && (
               <div className="bg-emerald-100 text-emerald-700 px-6 py-2 rounded-full text-xs font-bold headline flex items-center gap-2">
                 {dbProfile.co2_saved}kg CO2
               </div>
             )}
          </div>
        </div>
      </header>

      <main className="px-6 py-8 space-y-6 max-w-2xl mx-auto">
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors ${
                i !== menuItems.length - 1 ? 'border-b border-slate-50' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg}`}>
                  <item.icon size={20} className={item.color} />
                </div>
                <span className="font-bold text-slate-700 text-sm">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </button>
          ))}
        </section>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 bg-white text-error font-bold py-4 rounded-2xl border border-red-100 hover:bg-red-50 active:scale-[0.98] transition-all shadow-sm"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>

        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-8">
          SmarterOS v1.0.4 • Build 2026
        </p>
      </main>
    </div>
  );
}
