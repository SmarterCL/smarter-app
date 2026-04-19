import { motion } from 'motion/react';
import { ArrowLeft, ShieldCheck, MapPin, CheckCircle, CreditCard, Wallet } from 'lucide-react';
import { Product } from '../types';

interface CheckoutProps {
  items: Product[];
  total: number;
  onBack: () => void;
  onComplete: () => void;
}

export default function Checkout({ items, total, onBack, onComplete }: CheckoutProps) {
  const discount = total * 0.2;
  const finalTotal = total - discount;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="fixed top-0 w-full z-10 bg-white/80 backdrop-blur-md flex justify-between items-center px-6 h-16 max-w-2xl mx-auto left-1/2 -translate-x-1/2 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors active:scale-95"
          >
            <ArrowLeft size={18} className="text-slate-900" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight headline">Checkout</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg">
          <ShieldCheck size={14} className="text-slate-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider headline font-medium">Secured</span>
        </div>
      </header>

      <main className="pt-24 px-4 max-w-2xl mx-auto space-y-6">
        {/* Delivery Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 headline">Entrega y Datos</h2>
            <button className="text-primary font-bold text-xs uppercase tracking-wider headline">Editar</button>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-sky-50 rounded-lg border border-sky-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1 headline">Dirección de despacho</p>
                <p className="text-slate-900 font-bold headline text-sm">Av. Vitacura 2670, Depto 402</p>
                <p className="text-slate-500 text-xs font-medium">Las Condes, Región Metropolitana</p>
              </div>
            </div>
          </div>
        </section>

        {/* Order Items */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 px-2 headline">Tu Pedido</h2>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl flex items-center gap-4 border border-slate-100 shadow-sm">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-50 shrink-0 border border-slate-50">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-800 leading-tight text-sm headline">{item.name}</h3>
                    <span className="font-bold text-slate-900 text-sm">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic font-medium">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Coupon Section */}
        <section className="bg-slate-950 text-white rounded-xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-900/20 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="fill-current text-sky-400" />
              <h2 className="font-headline font-bold text-md tracking-tight">Ecocupon Aplicado</h2>
            </div>
            <div className="flex items-center gap-2 bg-slate-900 w-fit px-4 py-2 rounded-lg border border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">ECOGREEN20</span>
              <CheckCircle size={12} className="text-sky-400" />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estás ahorrando {(total * 0.1).toFixed(1)}kg de CO2 con esta compra</p>
          </div>
        </section>

        {/* Total Breakdown */}
        <section className="bg-slate-900 text-white rounded-xl p-8 space-y-6 shadow-2xl border border-slate-800">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Subtotal</span>
              <span className="font-bold text-sm">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sky-400">
              <span className="text-xs font-bold uppercase tracking-wider">Descuento Ecocupon (20%)</span>
              <span className="font-bold">-${discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Costo de Envío</span>
              <span className="font-bold text-xs uppercase text-success">Gratis</span>
            </div>
            <div className="pt-4 border-t border-slate-800 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase headline">Total a pagar</p>
                <p className="text-3xl font-bold text-white tracking-tight headline">${finalTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={onComplete}
            className="w-full bg-sky-400 text-slate-950 py-4 rounded-lg font-bold text-sm shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all headline uppercase tracking-widest"
          >
            <span>Pagar con Flow</span>
            <Wallet size={20} />
          </button>

          <div className="flex flex-col items-center gap-3 pt-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] headline">Medios de pago seguros</p>
            <div className="flex items-center justify-center gap-4 opacity-50">
              <CreditCard size={20} />
              <div className="h-4 w-px bg-slate-700" />
              <span className="text-[10px] font-bold headline uppercase tracking-widest">Webpay Plus</span>
            </div>
          </div>
        </section>
      </main>

      {/* Security Badge */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-fit px-6 text-center">
        <div className="flex items-center justify-center gap-2 text-zinc-400">
          <ShieldCheck size={14} />
          <p className="text-[10px] font-medium leading-tight headline uppercase tracking-wider">
            Encriptación de grado bancario
          </p>
        </div>
      </div>
    </div>
  );
}
