import { motion } from 'motion/react';
import { Settings, LogOut, ChevronRight, MapPin, ShieldCheck, Mail, Phone, ShoppingBag, Leaf, Gift, Activity, Cloud } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileProps {
  user: UserProfile;
  onLogout: () => void;
  onOpenDashboard?: () => void;
  onOpenStitchDashboard?: () => void;
}

export default function Profile({ user, onLogout, onOpenDashboard, onOpenStitchDashboard }: ProfileProps) {
  const formatCLP = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
  };

  const menuItems = [
    { icon: Cloud, label: 'Stitch Dashboard', detail: 'Google MCP + n8n', action: 'stitch' },
    { icon: Activity, label: 'Dashboard MCP', detail: 'Monitoreo de servicios', action: 'dashboard' },
    { icon: MapPin, label: 'Mis Direcciones', detail: 'Vitacura, Santiago' },
    { icon: ShoppingBag, label: 'Historial de Pedidos', detail: '8 pedidos realizados' },
    { icon: Gift, label: 'Mis Ecocupones', detail: `${user.activeCoupons} activos` },
    { icon: ShieldCheck, label: 'Seguridad y Privacidad', detail: 'Protección activada' },
  ];

  return (
    <div className="pb-32 bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-6 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight headline">Mi Perfil</h1>
          <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-8 space-y-8">
        {/* Profile Card */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-success w-5 h-5 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 headline">{user.name}</h2>
            <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
              <Mail size={14} />
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="inline-flex items-center gap-1 mt-3 px-2 py-1 bg-sky-50 text-sky-600 rounded-md">
              <Leaf size={12} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Miembro Smarter Platinum</span>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Leaf size={80} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 headline">Impacto CO2</p>
            <p className="text-2xl font-bold headline">12.5 <span className="text-xs font-medium text-slate-400">kg</span></p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 headline">Ahorro Total</p>
            <p className="text-2xl font-bold headline text-primary">{formatCLP(45200)}</p>
          </div>
        </section>

        {/* Menu Items */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] px-2 mb-4 headline">Configuración</h3>
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (item.action === 'stitch') onOpenStitchDashboard?.();
                  else if (item.action === 'dashboard') onOpenDashboard?.();
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
                    <item.icon size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 headline">{item.label}</p>
                    <p className="text-xs text-slate-400 font-medium">{item.detail}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </button>
            ))}
          </div>
        </section>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full py-4 rounded-xl bg-white border border-error/10 text-error font-bold text-sm flex items-center justify-center gap-2 hover:bg-error/5 transition-colors shadow-sm headline uppercase tracking-widest"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>

        <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest pt-4">
          SmarterOS v1.0.4 • 2026
        </p>
      </main>
    </div>
  );
}
