import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from './lib/supabase';
import { UserProfile, Product } from './types';
import Navigation from './components/Navigation';
import Home from './screens/Home';
import Store from './screens/Store';
import Scanner from './screens/Scanner';
import Checkout from './screens/Checkout';
import Login from './screens/Login';
import Reports from './screens/Reports';
import Profile from './screens/Profile';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Product[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showReports, setShowReports] = useState(false);

  // Memoized function to fetch real profile data
  const syncUserProfile = useCallback(async (sessionUser: any) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      setUser({
        id: sessionUser.id,
        name: data?.full_name || sessionUser.user_metadata.full_name || 'Usuario',
        email: sessionUser.email || '',
        avatar: data?.avatar_url || sessionUser.user_metadata.avatar_url || '',
        balance: data?.eco_coupons || 0,
        activeCoupons: 0 // This would come from a separate coupons table in the future
      });
    } catch (err) {
      console.error('Error syncing user profile:', err);
      // Fallback to basic session info
      setUser({
        id: sessionUser.id,
        name: sessionUser.user_metadata.full_name || 'Usuario',
        email: sessionUser.email || '',
        avatar: sessionUser.user_metadata.avatar_url || '',
        balance: 0,
        activeCoupons: 0
      });
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncUserProfile(session.user);
      }
      setLoading(false);
    });

    // Real-time auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncUserProfile(session.user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [syncUserProfile]);

  const handleAddToCart = (product: Product) => {
    setCart((prev) => [...prev, product]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 bg-slate-900 rounded-2xl mb-4 shadow-xl flex items-center justify-center"
        >
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        </motion.div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Iniciando SmarterOS</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />; // Login handles redirect
  }

  if (showReports) {
    return <Reports onBack={() => setShowReports(false)} />;
  }

  if (activeTab === 'scan') {
    return (
      <Scanner 
        onClose={() => setActiveTab('home')}
        onSuccess={(code) => {
          console.log('Coupon scanned:', code);
          // Future: integrate with Supabase to add points
          setActiveTab('home');
        }}
      />
    );
  }

  if (isCheckingOut) {
    return (
      <Checkout 
        items={cart}
        total={cart.reduce((sum, item) => sum + item.price, 0)}
        onBack={() => setIsCheckingOut(false)}
        onComplete={() => {
          setCart([]);
          setIsCheckingOut(false);
          setActiveTab('home');
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'home' && (
            <Home user={user} onNavigate={setActiveTab} onViewReports={() => setShowReports(true)} />
          )}
          {activeTab === 'store' && (
            <Store 
              onAddToCart={handleAddToCart}
              cartCount={cart.length}
              cartTotal={cart.reduce((sum, item) => sum + item.price, 0)}
              onViewCart={() => setIsCheckingOut(true)}
            />
          )}
          {activeTab === 'profile' && (
            <Profile user={user} onLogout={() => setUser(null)} />
          )}
        </motion.div>
      </AnimatePresence>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
