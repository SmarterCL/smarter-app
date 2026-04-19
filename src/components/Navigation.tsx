import { motion } from 'motion/react';
import { Home, QrCode, ShoppingBasket, User } from 'lucide-react';
import { cn } from '../lib/utils.ts';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'scan', label: 'Scan', icon: QrCode },
    { id: 'store', label: 'Store', icon: ShoppingBasket },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full h-20 flex justify-around items-center px-4 pb-2 bg-primary-container z-50 shadow-xl border-t border-secondary/50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center transition-all duration-300 relative",
              isActive 
                ? "bg-primary text-white rounded-full w-14 h-14 -mt-8 shadow-lg shadow-sky-500/20 active:scale-90" 
                : "text-slate-400 p-2 hover:text-white active:scale-90"
            )}
          >
            <Icon className={cn("w-6 h-6", isActive && "fill-current")} />
            {!isActive && (
              <span className="font-headline font-semibold text-[10px] tracking-wide uppercase mt-1">
                {tab.label}
              </span>
            )}
            {isActive && (
               <motion.span 
                 layoutId="activeTab"
                 className="sr-only"
               >
                 {tab.label}
               </motion.span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
