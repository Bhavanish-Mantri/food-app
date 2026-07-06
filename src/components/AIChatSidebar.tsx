import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { nutritionistChat } from '../services/gemini';
import { supabase } from '../services/supabase';
import { MenuItem, Order } from '../types/database';
import { 
  X, Send, Sparkles, Trash2, Plus, Minus, Settings, 
  Apple, Brain, ChevronRight, Activity 
} from 'lucide-react';

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const AIChatSidebar: React.FC<AIChatSidebarProps> = ({ isOpen, onClose }) => {
  const { cart, addToCart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { user, updatePreferences } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Local states for preferences before applying
  const [diet, setDiet] = useState(user?.preferences?.diet || 'none');
  const [calories, setCalories] = useState(user?.preferences?.targetCalories || 2000);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync preferences with user state
  useEffect(() => {
    if (user?.preferences) {
      setDiet(user.preferences.diet);
      setCalories(user.preferences.targetCalories);
    }
  }, [user]);

  // Load menu items and order history
  useEffect(() => {
    const fetchData = async () => {
      const { data: menuData } = await supabase.from('menu_items').select('*');
      if (menuData) setMenuItems(menuData as MenuItem[]);

      if (user) {
        const { data: orderData } = await supabase.from('orders').select('*').eq('user_id', user.id);
        if (orderData) setOrders(orderData as Order[]);
      }
    };
    fetchData();
  }, [user]);

  // Hydrate chat with welcome message if empty
  useEffect(() => {
    if (messages.length === 0 && user) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: `Hello ${user.name}! I'm your **NourishNow AI Nutritionist**.\n\nI can recommend items that match your **${user.preferences?.diet.toUpperCase() || 'NONE'}** diet, analyze your cart's nutrition profile, or build your order. Try asking me: \n*   *"What do you recommend for dinner?"*\n*   *"Add a high protein dish to my cart"*`
        }
      ]);
    }
  }, [user, messages.length]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingAI]);

  if (!isOpen) return null;

  // Calculate cart macros
  const cartMacros = cart.reduce((acc, c) => {
    const itemMacros = c.customization ? c.customization.macroUpdates : c.menuItem.macros;
    acc.calories += itemMacros.calories * c.quantity;
    acc.protein += itemMacros.protein * c.quantity;
    acc.carbs += itemMacros.carbs * c.quantity;
    acc.fat += itemMacros.fat * c.quantity;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    if (!textToSend) setInput('');

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      text
    };

    setMessages(prev => [...prev, userMsg]);
    setLoadingAI(true);

    try {
      const chatHistory = messages.map(m => ({
        role: m.role,
        parts: m.text
      }));

      // Call Gemini (will run real API if key available, else fallback rule engine)
      const result = await nutritionistChat(
        chatHistory,
        text,
        cart,
        user?.preferences || { diet: 'none', targetCalories: 2000, allergies: [] },
        menuItems,
        orders
      );

      const modelMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'model',
        text: result.response
      };

      setMessages(prev => [...prev, modelMsg]);

      // Execute Cart Commands returned by AI
      if (result.cartCommands && result.cartCommands.length > 0) {
        result.cartCommands.forEach(cmd => {
          const item = menuItems.find(m => m.id === cmd.menuItemId);
          if (item) {
            if (cmd.action === 'add') {
              addToCart(item, cmd.quantity);
            } else if (cmd.action === 'remove') {
              removeFromCart(cmd.menuItemId);
            }
          }
        });
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        role: 'model',
        text: "I experienced a slight glitch communicating with my database. Let's try again!"
      }]);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSaveSettings = () => {
    updatePreferences({
      diet: diet as any,
      targetCalories: Number(calories),
      allergies: user?.preferences?.allergies || []
    });
    setShowSettings(false);
    setMessages(prev => [...prev, {
      id: Math.random().toString(),
      role: 'model',
      text: `Preferences updated! Your diet is now set to **${diet.toUpperCase()}** and calorie goal is **${calories} kcal**. Let's review the menu items matching your new setup!`
    }]);
  };

  return (
    <>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-45 bg-black/30 dark:bg-black/60 backdrop-blur-[2px] transition-opacity animate-fade-in"
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] h-full flex flex-col bg-white dark:bg-dark-surface border-l border-neutral-200/50 dark:border-dark-border shadow-2xl animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200/40 dark:border-dark-border bg-neutral-50 dark:bg-dark-bg/40">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="font-display font-bold text-neutral-800 dark:text-white text-base leading-none">Nourish Coach</h2>
            <span className="text-[10px] text-neutral-400">AI Nutritionist & Cart Assistant</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
            title="Dietary Settings"
          >
            <Settings size={18} />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Preferences/Settings Panel overlay */}
      {showSettings && (
        <div className="px-4 py-4 border-b border-neutral-200/50 dark:border-dark-border bg-brand-50/10 dark:bg-brand-950/5 animate-fade-in">
          <h3 className="font-display font-semibold text-sm text-neutral-800 dark:text-neutral-200 mb-3 flex items-center space-x-1.5">
            <Activity size={16} className="text-brand-500" />
            <span>Target Nutrition Profile</span>
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Diet Program</label>
              <select
                value={diet}
                onChange={(e) => setDiet(e.target.value as any)}
                className="w-full text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 px-3 py-2 outline-none focus:border-brand-500"
              >
                <option value="none">Standard Diet</option>
                <option value="vegan">Vegan / Plant-Based</option>
                <option value="keto">Ketogenic (Keto)</option>
                <option value="low-carb">Low-Carb Diet</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Daily Calorie Target</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 px-3 py-2 outline-none focus:border-brand-500"
                min="1000"
                max="5000"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => setShowSettings(false)}
              className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveSettings}
              className="px-3 py-1.5 text-xs text-white bg-brand-500 hover:bg-brand-600 rounded-lg font-medium shadow-md shadow-brand-500/10"
            >
              Save Targets
            </button>
          </div>
        </div>
      )}

      {/* Main Container: Split Chat & Cart */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        
        {/* CHAT SECTION */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar bg-neutral-50/50 dark:bg-dark-bg/20">
          {messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10 rounded-tr-none' 
                    : 'bg-white dark:bg-dark-surface border border-neutral-100 dark:border-dark-border text-neutral-700 dark:text-neutral-200 rounded-tl-none shadow-sm'
                }`}
              >
                {(() => {
                  const paragraphs = m.text.split('\n');
                  return paragraphs.map((para, paraIdx) => {
                    const trimmed = para.trim();
                    if (!trimmed) return <div key={paraIdx} className="h-1.5" />;

                    // Handle list item * or -
                    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                      const content = trimmed.substring(2);
                      return (
                        <div key={paraIdx} className="flex items-start space-x-2 my-1 pl-1">
                          <span className="text-brand-500 font-bold mt-0.5">•</span>
                          <span className="flex-1">
                            {content.split('**').map((chunk, j) => 
                              j % 2 === 1 ? <strong key={j} className={`font-bold ${m.role === 'user' ? 'text-white' : 'text-neutral-900 dark:text-white'}`}>{chunk}</strong> : chunk
                            )}
                          </span>
                        </div>
                      );
                    }

                    // Handle numbered list
                    const numMatch = trimmed.match(/^(\d+)\.\s(.*)$/);
                    if (numMatch) {
                      const num = numMatch[1];
                      const content = numMatch[2];
                      return (
                        <div key={paraIdx} className="flex items-start space-x-2 my-1 pl-1">
                          <span className="text-brand-500 font-bold text-[9px] bg-brand-500/10 dark:bg-brand-500/20 px-1 py-0.5 rounded mt-0.5">{num}</span>
                          <span className="flex-1 pt-0.5">
                            {content.split('**').map((chunk, j) => 
                              j % 2 === 1 ? <strong key={j} className={`font-bold ${m.role === 'user' ? 'text-white' : 'text-neutral-900 dark:text-white'}`}>{chunk}</strong> : chunk
                            )}
                          </span>
                        </div>
                      );
                    }

                    // Standard paragraph text
                    return (
                      <p key={paraIdx} className={`${paraIdx > 0 ? 'mt-1.5' : ''}`}>
                        {para.split('**').map((chunk, j) => 
                          j % 2 === 1 ? <strong key={j} className={`font-semibold ${m.role === 'user' ? 'text-white' : 'text-neutral-900 dark:text-white'}`}>{chunk}</strong> : chunk
                        )}
                      </p>
                    );
                  });
                })()}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {loadingAI && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white dark:bg-dark-surface border border-neutral-100 dark:border-dark-border rounded-2xl rounded-tl-none px-4 py-3 space-x-1 flex items-center shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 bg-neutral-50/50 dark:bg-dark-bg/25 border-t border-neutral-100 dark:border-dark-border/40 overflow-x-auto flex space-x-2 no-scrollbar">
          <button 
            onClick={() => handleSendMessage("What diet recommended items do you have?")}
            className="flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-medium border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-dark-surface text-neutral-600 dark:text-neutral-300 hover:border-brand-500 transition-colors"
          >
            🥗 Show Recommendations
          </button>
          <button 
            onClick={() => handleSendMessage("Analyze my cart macros")}
            className="flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-medium border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-dark-surface text-neutral-600 dark:text-neutral-300 hover:border-brand-500 transition-colors"
          >
            📊 Analyze Cart Macros
          </button>
          <button 
            onClick={() => handleSendMessage("Is there anything low-carb?")}
            className="flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-medium border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-dark-surface text-neutral-600 dark:text-neutral-300 hover:border-brand-500 transition-colors"
          >
            🥑 Recommend Low-Carb
          </button>
        </div>

        {/* Chat Input */}
        <div className="p-3 border-t border-neutral-200/50 dark:border-dark-border bg-white dark:bg-dark-surface flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask AI Nutrition Coach..."
            className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-dark-bg text-xs px-3 py-2 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button 
            onClick={() => handleSendMessage()}
            className="p-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/10 hover:scale-[1.02] transition-all"
          >
            <Send size={14} />
          </button>
        </div>

        {/* CART DRAWER SECTION */}
        <div className="border-t border-neutral-200 dark:border-dark-border/80 bg-neutral-50 dark:bg-dark-surface max-h-[40%] flex flex-col">
          <div className="px-4 py-2 border-b border-neutral-200/40 dark:border-dark-border flex items-center justify-between">
            <span className="font-display font-bold text-xs text-neutral-800 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Apple size={14} className="text-brand-500 animate-float" />
              <span>Shopping Cart ({cart.reduce((sum, c) => sum + c.quantity, 0)})</span>
            </span>
            {cart.length > 0 && (
              <button 
                onClick={clearCart}
                className="text-[10px] font-medium text-red-500 hover:underline flex items-center space-x-1"
              >
                <Trash2 size={10} />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 no-scrollbar min-h-0">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-neutral-400 flex flex-col items-center justify-center space-y-1">
                <Brain size={24} className="stroke-[1.5] text-neutral-300 dark:text-neutral-700" />
                <p className="text-[11px] font-medium">Cart is empty</p>
                <span className="text-[10px]">Add dishes or ask the Coach to build your bowl!</span>
              </div>
            ) : (
              cart.map((item, index) => {
                const effectivePrice = item.menuItem.price + (item.customization?.priceDelta || 0);
                return (
                  <div 
                    key={`${item.menuItem.id}-${index}`}
                    className="flex items-start justify-between bg-white dark:bg-dark-bg/60 border border-neutral-100 dark:border-dark-border/60 p-2.5 rounded-xl animate-fade-in"
                  >
                    <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                      <img 
                        src={item.menuItem.image_url} 
                        alt={item.menuItem.name} 
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-neutral-800 dark:text-white truncate">{item.menuItem.name}</p>
                        {item.customization ? (
                          <div className="mt-0.5 space-y-0.5">
                            <span className="inline-block px-1.5 py-0.5 text-[8px] bg-brand-500/10 text-brand-500 rounded font-medium">AI Chef Adjusted</span>
                            <p className="text-[9px] text-neutral-400 italic truncate max-w-[200px]" title={item.customization.notes}>
                              {item.customization.notes}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-neutral-400 capitalize">{item.menuItem.category}</p>
                        )}
                        <span className="text-xs font-bold text-brand-500 block mt-1">${(effectivePrice * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2 ml-2">
                      <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50 dark:bg-dark-surface/40 overflow-hidden">
                        <button 
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1, item.customization?.notes)}
                          className="p-1 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="px-2 text-[10px] font-bold text-neutral-800 dark:text-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1, item.customization?.notes)}
                          className="p-1 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.menuItem.id, item.customization?.notes)}
                        className="text-neutral-400 hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Macro Bar Indicators */}
          {cart.length > 0 && (
            <div className="px-4 py-2 bg-neutral-100 dark:bg-dark-bg/40 border-t border-neutral-200/50 dark:border-dark-border/40 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-400">Total Cart Energy:</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {cartMacros.calories} / {user?.preferences?.targetCalories || 2000} kcal
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    cartMacros.calories > (user?.preferences?.targetCalories || 2000) 
                      ? 'bg-rose-500' 
                      : 'bg-brand-500'
                  }`}
                  style={{ width: `${Math.min((cartMacros.calories / (user?.preferences?.targetCalories || 2000)) * 100, 100)}%` }}
                />
              </div>
              {/* Macros pills */}
              <div className="grid grid-cols-3 gap-1.5 text-[9px] text-center pt-0.5">
                <div className="bg-white dark:bg-dark-bg/60 border border-neutral-200/20 py-0.5 rounded text-neutral-600 dark:text-neutral-300">
                  Pro: <strong className="text-brand-500">{cartMacros.protein}g</strong>
                </div>
                <div className="bg-white dark:bg-dark-bg/60 border border-neutral-200/20 py-0.5 rounded text-neutral-600 dark:text-neutral-300">
                  Carbs: <strong className="text-amber-500">{cartMacros.carbs}g</strong>
                </div>
                <div className="bg-white dark:bg-dark-bg/60 border border-neutral-200/20 py-0.5 rounded text-neutral-600 dark:text-neutral-300">
                  Fat: <strong className="text-sky-500">{cartMacros.fat}g</strong>
                </div>
              </div>
            </div>
          )}

          {/* Checkout Footer */}
          {cart.length > 0 && (
            <div className="p-3 bg-white dark:bg-dark-surface border-t border-neutral-200 dark:border-dark-border flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-neutral-400">Total Price</span>
                <span className="text-base font-extrabold text-neutral-800 dark:text-white">${cartTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={() => {
                  onClose();
                  navigate('/checkout');
                }}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-all shadow-md shadow-brand-500/10 hover:scale-[1.02]"
              >
                <span>Checkout</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

      </div>

      </div>
    </div>
  </>
);
};
