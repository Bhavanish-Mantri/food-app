import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { CreditCard, MapPin, Sparkles, CheckCircle2, ChevronRight, Apple } from 'lucide-react';

export const Checkout: React.FC = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dietMatchAlert, setDietMatchAlert] = useState<{ match: boolean; text: string } | null>(null);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/');
      return;
    }

    if (user) {
      setAddress(user.address || '');
    }

    // Determine diet match alignment warnings
    const userDiet = user?.preferences?.diet || 'none';
    if (userDiet !== 'none') {
      let conflictText = '';
      const hasConflict = cart.some(c => {
        const name = c.menuItem.name.toLowerCase();
        const desc = c.menuItem.description.toLowerCase();
        const itemMacros = c.customization ? c.customization.macroUpdates : c.menuItem.macros;
        
        if (userDiet === 'vegan') {
          const isNonVegan = name.includes('chicken') || name.includes('beef') || name.includes('pork') || name.includes('cheese') || name.includes('salmon') || name.includes('shrimp') || name.includes('egg') || name.includes('lamb') ||
                             desc.includes('chicken') || desc.includes('beef') || desc.includes('pork') || desc.includes('cheese') || desc.includes('salmon') || desc.includes('shrimp') || desc.includes('egg') || desc.includes('lamb');
          if (isNonVegan) {
            conflictText = `Diet Alert: "${c.menuItem.name}" contains animal ingredients, violating your VEGAN program.`;
            return true;
          }
        }
        if (userDiet === 'keto') {
          if (itemMacros.carbs > 15) {
            conflictText = `Diet Alert: "${c.menuItem.name}" contains ${itemMacros.carbs}g of Carbs, which exceeds the KETO limit of 15g per serving.`;
            return true;
          }
          const hasHighCarbIngredients = name.includes('pasta') || name.includes('rice') || name.includes('noodle') || name.includes('bread') || name.includes('sweet potato') ||
                                         desc.includes('pasta') || desc.includes('rice') || desc.includes('noodle') || desc.includes('bread') || desc.includes('sweet potato');
          if (hasHighCarbIngredients) {
            conflictText = `Diet Alert: "${c.menuItem.name}" has starch ingredients violating your KETO program.`;
            return true;
          }
        }
        if (userDiet === 'low-carb') {
          if (itemMacros.carbs > 30) {
            conflictText = `Diet Alert: "${c.menuItem.name}" contains ${itemMacros.carbs}g of Carbs, which exceeds the LOW-CARB goal of 30g per serving.`;
            return true;
          }
          const hasHighCarbIngredients = name.includes('pasta') || name.includes('rice') || name.includes('noodle') || name.includes('bread') ||
                                         desc.includes('pasta') || desc.includes('rice') || desc.includes('noodle') || desc.includes('bread');
          if (hasHighCarbIngredients) {
            conflictText = `Diet Alert: "${c.menuItem.name}" has starch ingredients violating your LOW-CARB program.`;
            return true;
          }
        }
        return false;
      });

      if (hasConflict) {
        setDietMatchAlert({
          match: false,
          text: conflictText
        });
      } else {
        setDietMatchAlert({
          match: true,
          text: `Perfect Fit: Every item in your cart matches your ${userDiet.toUpperCase()} dietary program!`
        });
      }
    }
  }, [cart, user, navigate]);

  if (cart.length === 0) return null;

  // Calculate cart macros
  const cartMacros = cart.reduce((acc, c) => {
    const itemMacros = c.customization ? c.customization.macroUpdates : c.menuItem.macros;
    acc.calories += itemMacros.calories * c.quantity;
    acc.protein += itemMacros.protein * c.quantity;
    acc.carbs += itemMacros.carbs * c.quantity;
    acc.fat += itemMacros.fat * c.quantity;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !phone.trim() || !user) {
      setError('Please fill in delivery address and phone number.');
      return;
    }
    setLoading(true);
    setError(null);

    const firstItem = cart[0].menuItem;
    // Get restaurant name for the order record
    let restaurantName = 'Nourish Kitchen';
    try {
      const { data } = await supabase
        .from('restaurants')
        .select('name')
        .eq('id', firstItem.restaurant_id)
        .single();
      if (data) restaurantName = data.name;
    } catch (e) {
      console.error(e);
    }

    try {
      const newOrder = {
        user_id: user.id,
        restaurant_id: firstItem.restaurant_id,
        restaurant_name: restaurantName,
        items: cart,
        total_price: cartTotal + 4.99, // price + delivery fee
        status: 'pending',
        delivery_address: address,
        created_at: new Date().toISOString()
      };

      const { data, error: insertError } = await supabase
        .from('orders')
        .insert(newOrder)
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
      } else {
        clearCart();
        navigate('/'); // Active order banner will show on customer home!
      }
    } catch (err) {
      setError('Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="font-display font-extrabold text-2xl text-neutral-800 dark:text-white mb-6">Confirm Order</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form Details */}
        <form onSubmit={handlePlaceOrder} className="lg:col-span-2 space-y-6">
          
          {/* Delivery Address */}
          <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-2xl space-y-4">
            <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white flex items-center space-x-1.5">
              <MapPin size={16} className="text-brand-500 animate-float" />
              <span>Delivery Details</span>
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street Address, Apt No, Zip Code"
                  className="w-full text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 px-3 py-2.5 outline-none focus:border-brand-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 px-3 py-2.5 outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-2xl space-y-4">
            <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white flex items-center space-x-1.5">
              <CreditCard size={16} className="text-neutral-400" />
              <span>Payment Option</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center space-y-2 transition-all ${
                  paymentMethod === 'card' 
                    ? 'border-brand-500 bg-brand-500/5 text-brand-500' 
                    : 'border-neutral-200 dark:border-neutral-850 hover:border-neutral-300'
                }`}
              >
                <CreditCard size={20} />
                <span className="text-xs font-bold">Credit/Debit Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center space-y-2 transition-all ${
                  paymentMethod === 'cash' 
                    ? 'border-brand-500 bg-brand-500/5 text-brand-500' 
                    : 'border-neutral-200 dark:border-neutral-850 hover:border-neutral-300'
                }`}
              >
                <MapPin size={20} />
                <span className="text-xs font-bold">Cash on Delivery</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-650 dark:text-red-400 text-xs rounded-xl">
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/10 flex items-center justify-center space-x-1.5 hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
            ) : (
              <>
                <span>Place Order & Pay ${(cartTotal + 4.99).toFixed(2)}</span>
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Right Column: Cart items & Macro Validation */}
        <div className="space-y-6">
          
          {/* Order Summary list */}
          <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-2xl space-y-4">
            <h3 className="font-display font-bold text-sm text-neutral-800 dark:text-white flex items-center space-x-1.5">
              <Apple size={16} className="text-brand-500" />
              <span>Order Summary</span>
            </h3>

            <div className="space-y-3.5 divide-y divide-neutral-100 dark:divide-dark-border/40">
              {cart.map((item, index) => {
                const price = item.menuItem.price + (item.customization?.priceDelta || 0);
                return (
                  <div key={index} className="flex justify-between items-start pt-3 first:pt-0 text-xs">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-semibold text-neutral-800 dark:text-white truncate">
                        {item.quantity}x {item.menuItem.name}
                      </p>
                      {item.customization && (
                        <span className="text-[9px] text-neutral-400 block leading-tight truncate">
                          Chef Edit: {item.customization.notes}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-neutral-800 dark:text-white">
                      ${(price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Calculations fees */}
            <div className="pt-4 border-t border-neutral-250/20 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Delivery Courier Fee</span>
                <span>$4.99</span>
              </div>
              <div className="flex justify-between font-display font-extrabold text-neutral-800 dark:text-white pt-2 border-t border-neutral-100 dark:border-dark-border/40 text-sm">
                <span>Total Amount</span>
                <span>${(cartTotal + 4.99).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Diet Align AI Alert */}
          {dietMatchAlert && (
            <div className={`p-4 border rounded-2xl flex items-start space-x-2.5 animate-fade-in ${
              dietMatchAlert.match 
                ? 'bg-emerald-50/5 dark:bg-emerald-950/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-50/5 dark:bg-amber-950/5 border-amber-500/20 text-amber-600 dark:text-amber-400'
            }`}>
              <div className="p-1 rounded-lg bg-current/10 mt-0.5">
                {dietMatchAlert.match ? <CheckCircle2 size={14} /> : <Sparkles size={14} />}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block">AI Nutrition Alert</span>
                <p className="text-xs mt-1 leading-relaxed">
                  {dietMatchAlert.text}
                </p>
              </div>
            </div>
          )}

          {/* Energy Macros details */}
          <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-2xl space-y-3.5">
            <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Order Energy</span>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Calories</span>
                <strong className="text-neutral-850 dark:text-white">{cartMacros.calories} kcal</strong>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-500 rounded-full"
                  style={{ width: `${Math.min((cartMacros.calories / (user?.preferences?.targetCalories || 2000)) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] text-center pt-2">
              <div className="bg-neutral-50 dark:bg-dark-bg/60 border border-neutral-100 dark:border-dark-border/40 py-1.5 rounded-xl text-neutral-600 dark:text-neutral-300">
                Protein <strong className="text-brand-500 block text-xs">{cartMacros.protein}g</strong>
              </div>
              <div className="bg-neutral-50 dark:bg-dark-bg/60 border border-neutral-100 dark:border-dark-border/40 py-1.5 rounded-xl text-neutral-600 dark:text-neutral-300">
                Carbs <strong className="text-amber-500 block text-xs">{cartMacros.carbs}g</strong>
              </div>
              <div className="bg-neutral-50 dark:bg-dark-bg/60 border border-neutral-100 dark:border-dark-border/40 py-1.5 rounded-xl text-neutral-600 dark:text-neutral-300">
                Fat <strong className="text-sky-500 block text-xs">{cartMacros.fat}g</strong>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
