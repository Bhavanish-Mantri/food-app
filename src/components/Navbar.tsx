import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingBag, Sun, Moon, LogOut, User, ChefHat, Truck, Menu, X } from 'lucide-react';

interface NavbarProps {
  onToggleCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleCart }) => {
  const { user, signOut } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('nn_theme') === 'dark' || 
      (!localStorage.getItem('nn_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nn_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nn_theme', 'light');
    }
  }, [darkMode]);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <nav className="sticky top-0 z-40 w-full transition-colors duration-200 border-b border-neutral-200/40 dark:border-dark-border bg-white/70 dark:bg-dark-bg/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
                <div className="p-2 rounded-xl bg-brand-500 text-white animate-float">
                  <ChefHat size={22} />
                </div>
                <span className="font-display font-extrabold text-xl tracking-tight text-neutral-800 dark:text-white">
                  NourishNow <span className="text-brand-500">AI</span>
                </span>
              </Link>
            </div>

            {/* Navigation Links based on role */}
            <div className="hidden md:flex items-center space-x-4">
              {user?.role === 'restaurant' && (
                <Link to="/restaurant-dashboard" className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  <ChefHat size={16} />
                  <span>Chef Dashboard</span>
                </Link>
              )}
              {user?.role === 'driver' && (
                <Link to="/driver-dashboard" className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                  <Truck size={16} />
                  <span>Driver Portal</span>
                </Link>
              )}
              {user?.role === 'customer' && (
                <>
                  <Link to="/" className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    Browse Restaurants
                  </Link>
                  <Link to="/nutrition-dashboard" className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    Nutrition Dashboard
                  </Link>
                  <Link to="/monthly-analytics" className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    Monthly Analytics
                  </Link>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Toggle Theme"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Shopping Cart (only for customers/anonymous) */}
              {(!user || user.role === 'customer') && (
                <button
                  onClick={onToggleCart}
                  className="relative p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  aria-label="Open Cart & AI Assistant"
                >
                  <ShoppingBag size={18} />
                  {totalCartItems > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-dark-bg animate-pulse">
                      {totalCartItems}
                    </span>
                  )}
                </button>
              )}

              {/* User Profile */}
              {user ? (
                <div className="flex items-center space-x-3 pl-2 border-l border-neutral-200/60 dark:border-neutral-800">
                  <div className="hidden lg:block text-right">
                    <p className="text-xs font-semibold text-neutral-800 dark:text-white leading-3">{user.name}</p>
                    <span className="text-[10px] text-neutral-400 capitalize">{user.role}</span>
                  </div>
                  
                  {/* User avatar or icon */}
                  <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    <User size={16} />
                  </div>

                  {/* Logout */}
                  <button
                    onClick={() => {
                      signOut();
                      navigate('/login');
                    }}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-all shadow-md shadow-brand-500/20 hover:scale-[1.02]"
                >
                  Sign In
                </Link>
              )}

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Toggle Mobile Menu"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="absolute left-0 right-0 top-16 md:hidden border-b border-neutral-200/50 dark:border-dark-border bg-white/95 dark:bg-dark-bg/95 backdrop-blur-md py-4 px-4 space-y-2 animate-fade-in z-50 shadow-xl">
          {user?.role === 'customer' && (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
              >
                Browse Restaurants
              </Link>
              <Link
                to="/nutrition-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
              >
                Nutrition Dashboard
              </Link>
              <Link
                to="/monthly-analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
              >
                Monthly Analytics
              </Link>
            </>
          )}
          {user?.role === 'restaurant' && (
            <Link
              to="/restaurant-dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
            >
              Chef Dashboard
            </Link>
          )}
          {user?.role === 'driver' && (
            <Link
              to="/driver-dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
            >
              Driver Portal
            </Link>
          )}
        </div>
      )}
    </>
  );
};
