import { motion } from 'motion/react';
import { Search, Plus, ArrowRight, ShoppingBasket } from 'lucide-react';
import { PRODUCTS } from '../constants';
import { Product } from '../types';
import { cn } from '../lib/utils';

interface StoreProps {
  onAddToCart: (product: Product) => void;
  cartCount: number;
  cartTotal: number;
  onViewCart: () => void;
}

export default function Store({ onAddToCart, cartCount, cartTotal, onViewCart }: StoreProps) {
  const formatCLP = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
  };

  return (
    <div className="pb-32">
      <header className="fixed top-0 w-full z-10 bg-white/80 backdrop-blur-md flex justify-between items-center px-6 h-16 max-w-2xl mx-auto left-1/2 -translate-x-1/2 border-b border-slate-100">
        <span className="text-xl font-bold text-primary tracking-tight headline">SmarterOS</span>
        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-500 hover:bg-slate-100 transition-colors active:scale-95 duration-200">
            <Search size={18} />
          </button>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-2xl mx-auto">
        <section className="mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight leading-tight headline">
            Fresco de la <span className="text-primary italic">Tierra</span> a tu puerta.
          </h1>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="text-slate-400 w-5 h-5" />
            </div>
            <input 
              type="text"
              placeholder="Buscar productos orgánicos..."
              className="w-full pl-12 pr-6 py-4 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 text-md transition-all duration-300 placeholder:text-slate-300 shadow-sm"
            />
          </div>
        </section>

        {/* Categories */}
        <section className="mb-10 overflow-x-auto no-scrollbar flex gap-3 pb-2">
          {['Todo', 'Verduras', 'Frutas', 'Lácteos', 'Artesanal'].map((cat, i) => (
            <button 
              key={cat}
              className={cn(
                "px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all",
                i === 0 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              )}
            >
              {cat}
            </button>
          ))}
        </section>

        {/* Products */}
        <section className="grid grid-cols-1 gap-6">
          {PRODUCTS.map((product) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative rounded-xl overflow-hidden bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all"
            >
              {product.id === '1' ? (
                // Featured Box
                <div className="relative h-72 w-full">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6">
                    {product.badge && (
                      <span className="inline-block px-2 py-1 rounded-md bg-sky-400 text-slate-950 text-[10px] font-bold uppercase tracking-wider mb-2">
                        {product.badge}
                      </span>
                    )}
                    <h3 className="text-2xl font-bold text-white mb-1 headline">{product.name}</h3>
                    <p className="text-slate-300 mb-4 max-w-sm text-xs line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-white">{formatCLP(product.price)}</span>
                      <button 
                        onClick={() => onAddToCart(product)}
                        className="px-5 py-2 rounded-lg bg-sky-400 text-slate-950 font-bold hover:bg-sky-300 transition-colors text-xs headline"
                      >
                        Añadir al Carrito
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Standard Card
                <div className="p-4 flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-md text-slate-800 headline leading-tight">{product.name}</h4>
                        <span className="font-bold text-primary">{formatCLP(product.price)}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1 italic line-clamp-1">{product.description}</p>
                    </div>
                    <button 
                      onClick={() => onAddToCart(product)}
                      className="w-full mt-3 py-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-100 font-bold flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all text-xs"
                    >
                      <Plus size={14} />
                      Añadir Rápido
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </section>
      </main>

      {/* Cart Summary */}
      {cartCount > 0 && (
        <div className="fixed bottom-24 left-6 right-6 z-40 max-w-2xl mx-auto">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={onViewCart}
            className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between group transition-all hover:scale-[1.01] cursor-pointer border border-slate-800"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-sky-400 text-slate-950 rounded-lg flex items-center justify-center">
                <ShoppingBasket size={20} className="fill-current" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-headline">Tu Carrito</p>
                <p className="font-bold text-md headline">{cartCount} Ítems <span className="mx-2 opacity-30">|</span> {formatCLP(cartTotal)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-sky-400 text-slate-950 px-4 py-2 rounded-lg">
              <span className="font-bold text-xs headline uppercase tracking-wide">Pagar</span>
              <ArrowRight size={16} />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
