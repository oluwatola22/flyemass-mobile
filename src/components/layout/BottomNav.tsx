import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  Wallet, 
  Truck, 
  ShoppingBag, 
  User, 
  Plus
} from 'lucide-react';
import { ScreenRoute } from '../../types';

export const BottomNav: React.FC = () => {
  const { currentRoute, navigate, setIsQuickActionOpen, cart } = useApp();

  const isTabActive = (tab: ScreenRoute) => {
    if (tab === 'home' && ['home', 'notifications'].includes(currentRoute)) return true;
    if (tab === 'wallets' && ['wallets', 'fund', 'pay', 'exchange', 'withdraw', 'history'].includes(currentRoute)) return true;
    if (tab === 'logistics' && ['logistics', 'track', 'register-package'].includes(currentRoute)) return true;
    if (tab === 'shop' && ['shop', 'product-detail', 'cart', 'checkout', 'shop-saved', 'shop-compare', 'shop-orders', 'shop-order-detail'].includes(currentRoute)) return true;
    if (tab === 'profile' && ['profile', 'security', 'support', 'support-chat', 'support-tickets', 'terms', 'privacy', 'delete-account'].includes(currentRoute)) return true;
    return false;
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Hide bottom nav on auth screens
  if (['welcome', 'login', 'signup', 'reset-password', 'verify-email', 'setup-pin', 'switch-device'].includes(currentRoute)) {
    return null;
  }

  return (
    <div className="sticky bottom-0 z-40 w-full bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 safe-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Home */}
        <button
          onClick={() => navigate('home')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
            isTabActive('home') ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <Home className="w-5 h-5 transition-transform duration-200" />
            {isTabActive('home') && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80" />
            )}
          </div>
          <span className="text-[10px] mt-1">Home</span>
        </button>

        {/* Wallets */}
        <button
          onClick={() => navigate('wallets')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
            isTabActive('wallets') ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <Wallet className="w-5 h-5 transition-transform duration-200" />
            {isTabActive('wallets') && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80" />
            )}
          </div>
          <span className="text-[10px] mt-1">Wallets</span>
        </button>

        {/* Center Quick Action Button */}
        <button
          onClick={() => setIsQuickActionOpen(true)}
          className="relative -top-4 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all"
          title="Quick Trade Actions"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Logistics */}
        <button
          onClick={() => navigate('logistics')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
            isTabActive('logistics') ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <Truck className="w-5 h-5 transition-transform duration-200" />
            {isTabActive('logistics') && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80" />
            )}
          </div>
          <span className="text-[10px] mt-1">Cargo</span>
        </button>

        {/* Shop */}
        <button
          onClick={() => navigate('shop')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
            isTabActive('shop') ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 transition-transform duration-200" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-slate-950 font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-950">
                {cartCount}
              </span>
            )}
            {isTabActive('shop') && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80" />
            )}
          </div>
          <span className="text-[10px] mt-1">Shop</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate('profile')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
            isTabActive('profile') ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <User className="w-5 h-5 transition-transform duration-200" />
            {isTabActive('profile') && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80" />
            )}
          </div>
          <span className="text-[10px] mt-1">Profile</span>
        </button>
      </div>
    </div>
  );
};
