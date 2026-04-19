import { motion } from 'motion/react';
import { Bell, QrCode, ShoppingBasket, Leaf, Ticket, ReceiptText, ShoppingBag, Zap } from 'lucide-react';
import { ACTIVITIES } from '../constants';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';

const iconMap: Record<string, any> = {
  Recycle: ReceiptText,
  ShoppingBag: ShoppingBag,
  Zap: Zap
};

interface HomeProps {
  user: UserProfile;
  onNavigate: (tab: string) => void;
  onViewReports: () => void;
}

export default function Home({ user, onNavigate, onViewReports }: HomeProps) {
  return (
    <div className="pb-24">
      {/* Header */}
      <header className="fixed top-0 w-full z-10 bg-white/80 backdrop-blur-md flex justify-between items-center px-6 h-16 max-w-2xl mx-auto left-1/2 -translate-x-1/2 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
            <img 
              src={user.avatar} 
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-headline font-bold text-slate-900 tracking-tight text-xl">
            SmarterOS
          </span>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 transition-colors active:scale-95">
          <Bell size={18} />
        </button>
      </header>

      <main className="pt-20 px-6 max-w-2xl mx-auto">
        {/* Welcome */}
        <section className="mt-8 mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 headline">
            Hola, <span className="text-primary italic">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">
            Tu impacto positivo de hoy está floreciendo.
          </p>
        </section>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <button 
            onClick={() => onNavigate('scan')}
            className="group flex flex-col justify-between p-5 bg-primary-container text-white rounded-xl h-44 transition-all active:scale-[0.98] border border-slate-800 shadow-sm"
          >
            <div className="bg-sky-400/20 w-12 h-12 rounded-lg flex items-center justify-center text-primary">
              <QrCode size={24} />
            </div>
            <div className="text-left">
              <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider headline">Acción rápida</span>
              <span className="block text-lg font-bold headline text-sky-400">Escanear cupón</span>
            </div>
          </button>
          <button 
            onClick={() => onNavigate('store')}
            className="flex flex-col justify-between p-5 bg-white text-slate-900 rounded-xl h-44 transition-all active:scale-[0.98] border border-slate-200 shadow-sm"
          >
            <div className="bg-sky-50 w-12 h-12 rounded-lg flex items-center justify-center">
              <ShoppingBasket size={24} className="text-primary" />
            </div>
            <div className="text-left">
              <span className="block text-slate-500 text-xs font-bold uppercase tracking-wider headline">Mi cesta</span>
              <span className="block text-lg font-bold headline">Ver canasta</span>
            </div>
          </button>
        </div>

        {/* Summary Card */}
        <section className="mb-10">
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h2 className="font-headline font-bold text-slate-900 text-lg">Resumen de Impacto</h2>
                <p className="text-slate-500 text-xs font-medium">Actualizado hace 5 min</p>
              </div>
              <div className="user-avatar bg-sky-100 text-sky-600 font-bold text-xs w-8 h-8 rounded-full flex items-center justify-center">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            <div className="flex gap-4 relative z-10">
              <div className="flex-1 bg-slate-50 p-5 rounded-lg border border-slate-100 shadow-sm">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-1">
                  Ecocupones Activos
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold headline text-slate-900">
                    {user.activeCoupons}
                  </span>
                  <div className="dot bg-success w-2 h-2 rounded-full" />
                </div>
              </div>
              <div className="flex-1 bg-slate-50 p-5 rounded-lg border border-slate-100 shadow-sm">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-1">
                  Saldo Ecocanasta
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold headline text-slate-900">
                    ${((user.balance || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6 px-2">
            <h2 className="font-headline font-bold text-slate-900 text-lg">Actividad Reciente</h2>
            <button
              onClick={onViewReports}
              className="text-primary font-bold text-xs uppercase tracking-wider hover:underline transition-all font-headline"
            >
              Ver todo
            </button>
          </div>
          <div className="space-y-3">
            {ACTIVITIES.map((activity) => {
              const Icon = iconMap[activity.icon] || ReceiptText;
              return (
                <motion.div 
                  key={activity.id}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                    <Icon className="text-slate-400 w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-sm leading-tight">{activity.title}</h3>
                    <p className="text-slate-400 text-xs mt-0.5">{activity.points} • {activity.time}</p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "font-bold text-sm",
                      activity.type === 'gain' ? "text-success" : "text-error"
                    )}>
                      {activity.amount}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
