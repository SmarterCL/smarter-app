/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from './lib/supabase';
import { UserProfile, Product } from './types';
import Navigation from './components/Navigation';
import Home from './screens/Home';
import Store from './screens/Store';
import Scanner from './screens/Scanner';
import Checkout from './screens/Checkout';
import Login from './screens/Login';

const MOCK_USER: UserProfile = {
  id: '1',
  name: 'Carlos Rivera',
  email: 'carlos@smarter.os',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiwizDhhdXhLS5_yqhbw3SxyjT0uoD_WW9QiatUEuoI359ev-6g0mZXb73DteACHB7gCWIQIuY3GQ6plo0jQEg1uLWEzFXF547ga4x76vhG-HZtTYZu-d_YUz4n6Mf9QyrTFRFY-f44XykNyzLVFWnabGjFM7il7znFQkCMOmG-WLVQ8EIp_DEjcs3DCGmmuSDj-hpNyug-u6DXgA73W-le3taTzOq_wLCKObOSECL3N4CfYmHgTWxezC47m-EBN9THNYENRVmidNb',
  balance: 4250,
  activeCoupons: 12
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Product[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    // Listen for auth changes
    const sb = supabase;
    if (!sb) {
      setLoading(false);
      return;
    }

    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || 'Usuario',
          email: session.user.email || '',
          avatar: session.user.user_metadata.avatar_url || MOCK_USER.avatar,
          balance: 4250,
          activeCoupons: 12
        });
      }
      setLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || 'Usuario',
          email: session.user.email || '',
          avatar: session.user.user_metadata.avatar_url || MOCK_USER.avatar,
          balance: 4250,
          activeCoupons: 12
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAddToCart = (product: Product) => {
    setCart((prev) => [...prev, product]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => setUser(MOCK_USER)} />;
  }

  if (activeTab === 'scan') {
    return (
      <Scanner 
        onClose={() => setActiveTab('home')}
        onSuccess={(code) => {
          console.log('Coupon scanned:', code);
          // Reward logic here
        }}
      />
    );
  }

  if (isCheckingOut) {
    return (
      <Checkout 
        items={cart}
        total={cartTotal}
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
    <div className="relative min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'home' && (
            <Home user={user} onNavigate={setActiveTab} />
          )}
          {activeTab === 'store' && (
            <Store 
              onAddToCart={handleAddToCart}
              cartCount={cart.length}
              cartTotal={cartTotal}
              onViewCart={() => setIsCheckingOut(true)}
            />
          )}
          {activeTab === 'profile' && (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-12 text-center space-y-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white mb-4 shadow-xl">
                 <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <h2 className="text-2xl font-bold headline text-slate-900">{user.name}</h2>
              <p className="text-slate-500 font-medium">{user.email}</p>
              <button 
                onClick={() => supabase?.auth.signOut().then(() => setUser(null)) || setUser(null)}
                className="mt-8 px-8 py-3 bg-white text-slate-700 border border-slate-200 font-bold rounded-lg hover:bg-slate-50 shadow-sm active:scale-95 transition-all headline"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
