import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flashlight, Target, CloudRain, PartyPopper } from 'lucide-react';
import { cn } from '../lib/utils';

interface ScannerProps {
  onClose: () => void;
  onSuccess: (code: string) => void;
}

export default function Scanner({ onClose, onSuccess }: ScannerProps) {
  const [isCanceled, setIsCanceled] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Simulation: show success after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-900 overflow-hidden font-sans">
      {/* Header */}
      <header className="absolute top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-transparent">
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white active:scale-95"
        >
          <X size={24} />
        </button>
        <h1 className="font-headline font-bold text-lg tracking-tight text-white drop-shadow-md">Ecocupon Scanner</h1>
        <div className="w-10 h-10" />
      </header>

      {/* Viewfinder Background (Blurred Simulation) */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center brightness-75 grayscale-[0.2]"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC-eHObtIGwAXv-ch_eAtKqFulsfWZ1frXnEohDm83nygS4tu8dR8B4v27KpniHoS_h5up4NmZ4pNs7MtI0uO96cSY3W3zFKj2JP4TSLlnZmP4oR-reKNLHBwtGMWsgwtt0kbFBsvSyL0LStbw9y84FHmMiWNyByGvG40Y7ZJytOTcW3Fyyl1FCoN0GKB7rPR1LgCYLUlx1Qnw_pzxRyhXlCHYXluRTAg3S4-ezhV_WrTV2AVBjfntr09Lj8IhR5eRU25QIRn3--BMB')" }}
        />
        
        {/* Scanner Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64 border-2 border-primary/30 rounded-2xl shadow-[0_0_0_2000px_rgba(15,23,42,0.7)]">
             {/* Animating Line */}
             <motion.div 
               animate={{ top: ['10%', '90%', '10%'] }}
               transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
               className="absolute left-4 right-4 h-0.5 bg-primary shadow-[0_0_15px_#38bdf8] z-10 opacity-70"
             />
             
             {/* Corners */}
             <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
             <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
             <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
             <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
          </div>
        </div>
      </div>

      {/* Interface */}
      <main className="relative z-10 flex flex-col items-center justify-end h-screen pb-12 px-6">
        <button className="mb-8 w-14 h-14 rounded-full bg-slate-900/40 backdrop-blur-xl flex items-center justify-center text-white border border-slate-700 hover:bg-slate-800 active:scale-95 transition-all shadow-xl">
          <Flashlight size={24} />
        </button>

        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border border-slate-200 text-center">
          <div className="p-3 bg-sky-50 rounded-full">
            <Target className="text-primary w-6 h-6" />
          </div>
          <div>
            <p className="font-headline font-bold text-lg leading-snug px-4 text-slate-900">
              Apunta al código QR para recibir tu beneficio
            </p>
            <p className="text-slate-500 text-xs font-medium mt-1 px-6">
              Busca los códigos Ecocupon en tus productos locales favoritos para ganar descuentos.
            </p>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm"
          >
            <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl relative border border-slate-200"
            >
              <div className="h-40 bg-slate-900 flex items-center justify-center relative">
                <div className="relative flex flex-col items-center text-white">
                  <div className="w-16 h-16 bg-sky-400 text-slate-950 rounded-lg flex items-center justify-center mb-3">
                    <PartyPopper size={32} className="fill-current" />
                  </div>
                  <span className="font-headline font-bold text-2xl tracking-tight text-sky-400">15% OFF</span>
                </div>
              </div>

              <div className="p-8 text-center">
                <h2 className="font-headline font-bold text-xl text-slate-900 mb-2">¡Felicidades!</h2>
                <p className="text-slate-500 text-sm mb-8 px-2 leading-relaxed font-medium">
                  Tienes un 15% en tu próxima canasta de productos orgánicos. Tu compromiso con el planeta rinde frutos.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      onSuccess('COUPON15');
                      onClose();
                    }}
                    className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-lg shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all text-sm"
                  >
                    Canjear Beneficio
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full bg-white text-slate-500 border border-slate-200 font-bold py-3.5 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                  >
                    Guardar para más tarde
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
