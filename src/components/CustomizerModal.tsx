import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, OrderItemCustomization } from '../types/database';
import { customizeDish } from '../services/gemini';
import { X, Sparkles, AlertCircle, Play, Check, ChefHat } from 'lucide-react';

interface CustomizerModalProps {
  isOpen: boolean;
  menuItem: MenuItem | null;
  onClose: () => void;
  onConfirm: (customization: OrderItemCustomization) => void;
}

export const CustomizerModal: React.FC<CustomizerModalProps> = ({ isOpen, menuItem, onClose, onConfirm }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [customization, setCustomization] = useState<OrderItemCustomization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomization(null);
      setPrompt('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !menuItem) return null;

  const handleCustomize = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const result = await customizeDish(menuItem, prompt);
      setCustomization(result);
    } catch (e) {
      console.error(e);
      setError('The Chef is currently busy. Try requesting standard customizations like "make it spicy" or "add avocado".');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (customization) {
      onConfirm(customization);
    }
  };

  const currentPrice = menuItem.price + (customization?.priceDelta || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border shadow-2xl flex flex-col max-h-[90vh] animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-dark-border">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
              <ChefHat size={20} />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-neutral-800 dark:text-white">AI Chef Customizer</h2>
              <p className="text-xs text-neutral-400">Instruct Chef Isabella to customize your recipe</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {/* Dish Overview */}
          <div className="flex flex-col sm:flex-row gap-4 bg-neutral-50 dark:bg-dark-bg/40 p-4 rounded-xl border border-neutral-100 dark:border-dark-border/40">
            <img 
              src={menuItem.image_url} 
              alt={menuItem.name} 
              className="w-full sm:w-28 h-28 object-cover rounded-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-brand-500 tracking-widest">{menuItem.category}</span>
              <h3 className="font-display font-bold text-neutral-800 dark:text-white text-base mt-0.5">{menuItem.name}</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{menuItem.description}</p>
              <div className="mt-3 flex items-center space-x-4">
                <span className="text-sm font-bold text-neutral-800 dark:text-white">${menuItem.price.toFixed(2)}</span>
                <span className="text-xs text-neutral-400">Original: {menuItem.macros.calories} kcal | P: {menuItem.macros.protein}g | C: {menuItem.macros.carbs}g | F: {menuItem.macros.fat}g</span>
              </div>
            </div>
          </div>

          {/* AI Customization Chat Interface */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-xs text-neutral-500 uppercase tracking-wider">How would you like the Chef to customize this?</h4>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomize()}
                placeholder='e.g., "Add extra bacon, double check carbs, swap pasta for zucchini noodles"'
                className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-dark-bg text-xs px-4 py-3 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <button
                onClick={handleCustomize}
                disabled={loading || !prompt.trim()}
                className="px-4 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/10 flex items-center space-x-1.5 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Instruct Chef</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button 
                onClick={() => { setPrompt("Make it spicy with some fresh chili flakes"); }}
                className="text-[10px] border border-neutral-200 dark:border-neutral-800 px-2.5 py-1 rounded-full text-neutral-500 dark:text-neutral-300 hover:border-brand-500"
              >
                🌶️ Make it Spicy
              </button>
              <button 
                onClick={() => { setPrompt("Double the chicken and add extra avocado"); }}
                className="text-[10px] border border-neutral-200 dark:border-neutral-800 px-2.5 py-1 rounded-full text-neutral-500 dark:text-neutral-300 hover:border-brand-500"
              >
                🥩 Extra Protein & Avocado
              </button>
              <button 
                onClick={() => { setPrompt("Swap pasta for zucchini noodles to lower the carbs"); }}
                className="text-[10px] border border-neutral-200 dark:border-neutral-800 px-2.5 py-1 rounded-full text-neutral-500 dark:text-neutral-300 hover:border-brand-500"
              >
                🥒 Zoodles Swap (Low Carb)
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center space-x-2 animate-fade-in">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Customization Result Overview */}
          {customization && (
            <div className="border border-brand-500/20 dark:border-brand-500/10 rounded-xl bg-brand-50/5 dark:bg-brand-950/5 p-5 space-y-4 animate-fade-in">
              
              {/* Chef Notes */}
              <div className="flex items-start space-x-3">
                <div className="p-1.5 rounded-lg bg-brand-500 text-white flex-shrink-0">
                  <ChefHat size={16} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-neutral-800 dark:text-white leading-none">Chef Isabella's Notes</h5>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1.5 italic leading-relaxed">
                    "{customization.notes}"
                  </p>
                </div>
              </div>

              {/* Adjustments Badges */}
              <div className="pt-2 border-t border-neutral-200/40 dark:border-neutral-800/40">
                <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Recipe Adjustments</span>
                <div className="flex flex-wrap gap-2">
                  {customization.ingredientAdjustments.map((adj, idx) => (
                    <span 
                      key={idx} 
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        adj.startsWith('+') 
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                          : adj.startsWith('-')
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {adj}
                    </span>
                  ))}
                </div>
              </div>

              {/* Macros Comparison */}
              <div className="pt-4 border-t border-neutral-200/40 dark:border-neutral-800/40">
                <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Macronutrient Adjustment</span>
                <div className="grid grid-cols-4 gap-3">
                  
                  {/* Calories */}
                  <div className="bg-white dark:bg-dark-bg/60 border border-neutral-100 dark:border-dark-border/40 p-2.5 rounded-xl text-center">
                    <span className="block text-[9px] font-medium text-neutral-400 uppercase tracking-wider">Energy</span>
                    <strong className="text-xs font-bold text-neutral-800 dark:text-white mt-1 block">
                      {customization.macroUpdates.calories} kcal
                    </strong>
                    <span className={`text-[9px] font-semibold block mt-0.5 ${
                      customization.macroUpdates.calories < menuItem.macros.calories ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {customization.macroUpdates.calories - menuItem.macros.calories >= 0 ? '+' : ''}
                      {customization.macroUpdates.calories - menuItem.macros.calories} kcal
                    </span>
                  </div>

                  {/* Protein */}
                  <div className="bg-white dark:bg-dark-bg/60 border border-neutral-100 dark:border-dark-border/40 p-2.5 rounded-xl text-center">
                    <span className="block text-[9px] font-medium text-neutral-400 uppercase tracking-wider">Protein</span>
                    <strong className="text-xs font-bold text-brand-500 mt-1 block">
                      {customization.macroUpdates.protein}g
                    </strong>
                    <span className={`text-[9px] font-semibold block mt-0.5 ${
                      customization.macroUpdates.protein >= menuItem.macros.protein ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {customization.macroUpdates.protein - menuItem.macros.protein >= 0 ? '+' : ''}
                      {customization.macroUpdates.protein - menuItem.macros.protein}g
                    </span>
                  </div>

                  {/* Carbs */}
                  <div className="bg-white dark:bg-dark-bg/60 border border-neutral-100 dark:border-dark-border/40 p-2.5 rounded-xl text-center">
                    <span className="block text-[9px] font-medium text-neutral-400 uppercase tracking-wider">Carbs</span>
                    <strong className="text-xs font-bold text-amber-500 mt-1 block">
                      {customization.macroUpdates.carbs}g
                    </strong>
                    <span className={`text-[9px] font-semibold block mt-0.5 ${
                      customization.macroUpdates.carbs <= menuItem.macros.carbs ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {customization.macroUpdates.carbs - menuItem.macros.carbs >= 0 ? '+' : ''}
                      {customization.macroUpdates.carbs - menuItem.macros.carbs}g
                    </span>
                  </div>

                  {/* Fat */}
                  <div className="bg-white dark:bg-dark-bg/60 border border-neutral-100 dark:border-dark-border/40 p-2.5 rounded-xl text-center">
                    <span className="block text-[9px] font-medium text-neutral-400 uppercase tracking-wider">Fat</span>
                    <strong className="text-xs font-bold text-sky-500 mt-1 block">
                      {customization.macroUpdates.fat}g
                    </strong>
                    <span className={`text-[9px] font-semibold block mt-0.5 ${
                      customization.macroUpdates.fat - menuItem.macros.fat >= 0 ? '+' : ''
                      // Wait, let's keep it simple
                    }`}>
                      {customization.macroUpdates.fat - menuItem.macros.fat >= 0 ? '+' : ''}
                      {customization.macroUpdates.fat - menuItem.macros.fat}g
                    </span>
                  </div>

                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-dark-border bg-neutral-50 dark:bg-dark-bg/40 flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-neutral-400 uppercase font-semibold">Custom Price</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-base font-extrabold text-neutral-800 dark:text-white">
                ${currentPrice.toFixed(2)}
              </span>
              {customization && customization.priceDelta !== 0 && (
                <span className={`text-[10px] font-bold ${customization.priceDelta > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  ({customization.priceDelta > 0 ? '+' : ''}${customization.priceDelta.toFixed(2)})
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={onClose} 
              className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-xs font-semibold text-neutral-500 dark:text-neutral-300"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!customization}
              className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-brand-500/10 flex items-center space-x-1 transition-all"
            >
              <Check size={14} />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
