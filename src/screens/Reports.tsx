import { motion } from 'motion/react';
import { ArrowLeft, TrendingUp, Leaf, Wallet, Calendar, ChevronRight } from 'lucide-react';
import { ACTIVITIES } from '../constants';
import { cn } from '../lib/utils';

interface ReportsProps {
  onBack: () => void;
}

export default function Reports({ onBack }: ReportsProps) {
  const formatCLP = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
  };

  const stats = [
    { label: 'CO2 Ahorrado', value: '12.5 kg', icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Ahorro Total', value: formatCLP(124500), icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Eficiencia', value: '+18%', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 h-16 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="font-headline font-bold text-xl text-slate-900">Reporte de Impacto</h1>
      </header>

      <main className="px-6 py-8 max-w-2xl mx-auto space-y-8">
        {/* Summary Card */}
        <section className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Estado del Planeta</p>
              <h2 className="text-3xl font-bold headline tracking-tight">Nivel Héroe</h2>
              <p className="text-slate-400 text-sm mt-1 font-medium">Has salvado 3 árboles este mes.</p>
            </div>
            <div className="w-20 h-20 rounded-full border-4 border-emerald-500/30 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-[spin_3s_linear_infinite]" />
              <Leaf className="text-emerald-400" size={32} />
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={stat.label}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.bg)}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">{stat.label}</span>
              <span className="text-sm font-bold text-slate-900 headline">{stat.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Chart Placeholder */}
        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline font-bold text-slate-900">Progreso Semanal</h2>
            <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
              <Calendar size={14} />
              <span>Oct 7 - Oct 13</span>
            </div>
          </div>

          <div className="h-40 flex items-end justify-between gap-2 px-2">
            {[40, 70, 45, 90, 65, 80, 55].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                  className={cn(
                    "w-full rounded-t-lg transition-colors",
                    i === 3 ? "bg-primary" : "bg-slate-100 hover:bg-slate-200"
                  )}
                />
                <span className="text-[10px] font-bold text-slate-400">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* History List */}
        <section>
          <h2 className="font-headline font-bold text-slate-900 mb-4 px-2">Historial Completo</h2>
          <div className="space-y-3">
            {[...ACTIVITIES, ...ACTIVITIES].map((activity, i) => (
              <div
                key={`${activity.id}-${i}`}
                className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                  <span className="text-lg">♻️</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-sm leading-tight">{activity.title}</h3>
                  <p className="text-slate-400 text-xs mt-0.5">{activity.time}</p>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "font-bold text-sm",
                    activity.type === 'gain' ? "text-success" : "text-error"
                  )}>
                    {activity.amount}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">{activity.points}</div>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
