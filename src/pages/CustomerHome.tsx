import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { smartSearch, getAIRecommendations, RecommendationResult } from '../services/gemini';
import { Restaurant, MenuItem, Order } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { OrderTracker } from '../components/OrderTracker';
import { 
  Search, Sparkles, Star, MapPin, ChevronRight, RefreshCw, 
  Percent, Flame, Zap, ArrowRight, Compass, ShieldCheck, Mail, Info,
  CloudRain, Sun, Snowflake, Smile, Calendar, Clock3, AlertCircle, 
  ShoppingCart, Sliders, ChevronDown, Check, User, Activity
} from 'lucide-react';

export const CustomerHome: React.FC = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  
  // Recommendation engine control states
  const [recHealthGoal, setRecHealthGoal] = useState<string>(() => localStorage.getItem('nn_rec_health_goal') || 'General Wellness');
  const [recMood, setRecMood] = useState<string>(() => localStorage.getItem('nn_rec_mood') || 'Neutral');
  const [recWeather, setRecWeather] = useState<string>(() => localStorage.getItem('nn_rec_weather') || 'Rainy/Monsoon');
  const [recFestival, setRecFestival] = useState<string>(() => localStorage.getItem('nn_rec_festival') || 'Monsoon Special');
  const [recBudget, setRecBudget] = useState<number>(() => {
    const v = localStorage.getItem('nn_rec_budget');
    return v ? parseFloat(v) : 30;
  });
  const [recCalories, setRecCalories] = useState<number>(() => {
    const v = localStorage.getItem('nn_rec_calories');
    return v ? parseInt(v, 10) : 850;
  });
  const [recProtein, setRecProtein] = useState<number>(() => {
    const v = localStorage.getItem('nn_rec_protein');
    return v ? parseInt(v, 10) : 30;
  });

  useEffect(() => {
    localStorage.setItem('nn_rec_health_goal', recHealthGoal);
    localStorage.setItem('nn_rec_mood', recMood);
    localStorage.setItem('nn_rec_weather', recWeather);
    localStorage.setItem('nn_rec_festival', recFestival);
    localStorage.setItem('nn_rec_budget', recBudget.toString());
    localStorage.setItem('nn_rec_calories', recCalories.toString());
    localStorage.setItem('nn_rec_protein', recProtein.toString());
  }, [recHealthGoal, recMood, recWeather, recFestival, recBudget, recCalories, recProtein]);

  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);
  const [showRecSettings, setShowRecSettings] = useState<boolean>(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ ids: string[]; explanation: string } | null>(null);

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const [loading, setLoading] = useState(true);

  // Offers Mock Data
  const promoOffers = [
    {
      id: 'promo-1',
      title: '50% Off First AI Meal',
      desc: 'Let our AI Chef customize your meal. Use code: NUTRITION50',
      badge: 'Special',
      bgGradient: 'from-orange-600 to-amber-500',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300'
    },
    {
      id: 'promo-2',
      title: 'Free Delivery on Keto',
      desc: 'Order from Keto Kitchen and enjoy 0 delivery fee. Auto applied.',
      badge: 'Free Delivery',
      bgGradient: 'from-emerald-600 to-teal-500',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=300'
    },
    {
      id: 'promo-3',
      title: 'Double Protein Weekend',
      desc: 'Ask AI Chef to "add double meat" on any grill item for only $1.99.',
      badge: 'Limited Time',
      bgGradient: 'from-rose-600 to-pink-500',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=300'
    }
  ];

  // Circular Categories Mock Data
  const categories = [
    { id: 'all', label: 'All Curations', icon: '🍽️', image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=120' },
    { id: 'vegan', label: 'Vegan / Plant', icon: '🌱', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=120' },
    { id: 'keto', label: 'Keto / Low-Carb', icon: '🥑', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=120' },
    { id: 'indian', label: 'Spiced / Indian', icon: '🌶️', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=120' },
    { id: 'italian', label: 'Pasta & Flatbreads', icon: '🍕', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=120' },
    { id: 'desserts', label: 'Healthy Desserts', icon: '🍓', image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&q=80&w=120' }
  ];

  // Popular Combos Mock Data
  const combos = [
    {
      id: 'combo-1',
      name: 'Vegan Wellness Power Pack',
      items: 'Avocado Quinoa Buddha Bowl + Green Goddess Smoothie',
      price: 20.99,
      calories: 630,
      protein: '17g',
      carbs: '84g',
      fat: '25g',
      savings: 'Save $2.99',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=300',
      restaurantId: 'rest-1'
    },
    {
      id: 'combo-2',
      name: 'Keto Carnivore Muscle Fuel',
      nameDisplay: 'Keto Muscle Pack',
      items: 'Grass-Fed Ribeye Steak + Avocado Bacon Salmon Skillet',
      price: 48.99,
      calories: 1530,
      protein: '102g',
      carbs: '8g',
      fat: '121g',
      savings: 'Save $5.99',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=300',
      restaurantId: 'rest-2'
    }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch restaurants
      const { data: rests } = await supabase.from('restaurants').select('*');
      if (rests) setRestaurants(rests as Restaurant[]);

      // Fetch menus for search indexing
      const { data: items } = await supabase.from('menu_items').select('*');
      if (items) setMenuItems(items as MenuItem[]);

      // Fetch order history and active orders
      if (user) {
        // Fetch all orders for history
        const { data: allOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (allOrders) setOrderHistory(allOrders as Order[]);

        // Active orders (not delivered)
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .neq('status', 'delivered')
          .order('created_at', { ascending: false });
        
        if (orders && orders.length > 0) {
          const active = orders.find((o: any) => o.user_id === user.id);
          if (active) {
            setActiveOrder(active as Order);
          } else {
            setActiveOrder(null);
          }
        } else {
          setActiveOrder(null);
        }
      }
    } catch (e) {
      console.error('Failed to fetch home data:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    if (menuItems.length === 0) return;
    setLoadingRecs(true);
    try {
      const results = await getAIRecommendations(menuItems, {
        orderHistory,
        currentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        weather: recWeather,
        budget: recBudget,
        calories: recCalories,
        protein: recProtein,
        festival: recFestival,
        mood: recMood,
        healthGoal: recHealthGoal
      });
      setRecommendations(results);
    } catch (e) {
      console.error('Failed to load AI Recommendations:', e);
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (menuItems.length > 0) {
      fetchRecommendations();
    }
  }, [menuItems, orderHistory]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResult(null);
      return;
    }
    setSearching(true);

    try {
      const result = await smartSearch(menuItems, searchQuery);
      setSearchResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResult(null);
  };

  // Filter restaurants by category
  const filteredRestaurants = restaurants.filter(r => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'vegan') return r.cuisine.toLowerCase().includes('vegan') || r.cuisine.toLowerCase().includes('plant');
    if (activeCategory === 'keto') return r.cuisine.toLowerCase().includes('keto') || r.cuisine.toLowerCase().includes('low-carb');
    if (activeCategory === 'indian') return r.cuisine.toLowerCase().includes('indian') || r.cuisine.toLowerCase().includes('spice');
    if (activeCategory === 'italian') return r.cuisine.toLowerCase().includes('italian') || r.cuisine.toLowerCase().includes('pasta');
    if (activeCategory === 'desserts') return r.cuisine.toLowerCase().includes('dessert') || r.cuisine.toLowerCase().includes('bowls');
    return true;
  });

  // Trending Restaurants (Rating >= 4.7)
  const trendingRestaurants = [...restaurants]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  // Featured Brands
  const featuredRestaurants = restaurants.slice(0, 2);

  // Healthy Picks (Calories < 550 or Protein > 25g)
  const healthyPicks = menuItems
    .filter(item => item.macros.calories < 550 || item.macros.protein > 25)
    .slice(0, 4);

  // AI Recommended Meals (Aligned with user preferences or default to Keto/Vegan)
  const userDiet = user?.preferences?.diet || 'vegan';
  const aiRecommendedMeals = menuItems
    .filter(item => {
      const name = item.name.toLowerCase();
      const desc = item.description.toLowerCase();
      if (userDiet === 'vegan') {
        return !name.includes('chicken') && !name.includes('beef') && !name.includes('pork') && !name.includes('salmon') && !name.includes('lamb');
      }
      if (userDiet === 'keto' || userDiet === 'low-carb') {
        return item.macros.carbs <= 15 || name.includes('salmon') || name.includes('ribeye') || name.includes('kebab');
      }
      return true;
    })
    .slice(0, 4);

  const matchedDishes = menuItems.filter(item => searchResult?.ids.includes(item.id));

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg flex flex-col justify-between">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 animate-fade-in w-full">
        
        {/* Active Order Banner */}
        {activeOrder && (
          <div className="space-y-3 p-1 rounded-3xl bg-brand-500/[0.03] dark:bg-brand-500/[0.01] border border-brand-500/20">
            <div className="px-6 pt-4 flex items-center justify-between">
              <span className="flex items-center space-x-2 text-xs font-bold text-brand-500">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-500 animate-ping"></span>
                <span>Active Order Progress Tracker</span>
              </span>
              <button 
                onClick={fetchData}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                title="Refresh status"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            <div className="p-4 pt-1">
              <OrderTracker 
                order={activeOrder} 
                onOrderUpdated={(updated) => {
                  if (updated.status === 'delivered') {
                    setActiveOrder(null);
                    fetchData();
                  } else {
                    setActiveOrder(updated);
                  }
                }} 
              />
            </div>
          </div>
        )}

        {/* HERO BANNER SECTION (Combined Swiggy/Uber Eats Premium Look) */}
        <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-neutral-900 via-emerald-950 to-teal-900 text-white shadow-2xl p-8 sm:p-14 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-8 border border-neutral-800">
          <div className="relative z-10 max-w-xl space-y-6 text-left">
            <span className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-500/20 text-brand-400 border border-brand-500/30 backdrop-blur-md">
              <Sparkles size={12} className="animate-float" />
              <span>Smart Nutrition Food Delivery</span>
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-white">
              Nourish Your Body, <span className="text-brand-500">Tweak With AI.</span>
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-lg">
              Combine the quick comfort of Swiggy and Uber Eats with a premium AI Chef customizer. Change ingredients, reduce carbs, or swap proteins, and watch nutrition tags update instantly.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="#nearby-kitchens" className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/20 flex items-center space-x-1.5 transition-all hover:scale-[1.02]">
                <span>Explore Restaurants</span>
                <ArrowRight size={14} />
              </a>
              <button 
                onClick={() => {
                  const element = document.getElementById('ai-search-advisor');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 rounded-xl border border-neutral-700 hover:border-neutral-500 bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center space-x-1.5 transition-all"
              >
                <span>Ask AI Advisor</span>
              </button>
            </div>
          </div>

          {/* Right Floating Food Display mockup */}
          <div className="relative w-full max-w-md h-64 sm:h-80 lg:w-[420px] flex-shrink-0 select-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 rounded-full blur-3xl"></div>
            <img 
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500" 
              alt="Premium Salad Bowl"
              className="w-56 h-56 sm:w-72 sm:h-72 object-cover rounded-full border-4 border-white/15 shadow-2xl animate-float mx-auto absolute inset-0 m-auto z-10"
            />
            {/* Float badges */}
            <div className="absolute top-8 left-4 sm:left-12 bg-white/10 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex items-center space-x-2.5 z-20 shadow-xl animate-pulse-slow">
              <span className="text-xl">🥗</span>
              <div className="text-left">
                <span className="text-[10px] text-neutral-400 block font-bold">CALORIES</span>
                <strong className="text-xs font-black text-white">420 kcal</strong>
              </div>
            </div>
            <div className="absolute bottom-8 right-4 sm:right-12 bg-brand-500 text-white p-3 rounded-2xl flex items-center space-x-2.5 z-20 shadow-lg shadow-brand-500/20">
              <Sparkles size={16} />
              <div className="text-left font-display">
                <span className="text-[9px] text-brand-100 block font-bold">AI CUSTOMIZED</span>
                <strong className="text-xs font-black">Spicy Zoodles Swap</strong>
              </div>
            </div>
          </div>
        </div>

        {/* AI SMART SEARCH ENGINE (Zomato/Swiggy style prominent component) */}
        <div id="ai-search-advisor" className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-[2rem] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-display font-extrabold text-neutral-800 dark:text-white text-base flex items-center space-x-2">
                <Sparkles size={18} className="text-brand-500 animate-float" />
                <span>AI Smart Search Advisor</span>
              </h3>
              <p className="text-xs text-neutral-400">Search meals using natural language (e.g. "high protein dahl under 500 cal", "vegan keto salad")</p>
            </div>
            {/* Quick Suggestion Tags */}
            <div className="flex flex-wrap gap-1.5">
              {['Keto Bowls', 'Vegan Pasta', 'High Protein Curry'].map((sug) => (
                <button
                  key={sug}
                  onClick={() => setSearchQuery(sug)}
                  className="px-2.5 py-1 bg-neutral-100 dark:bg-dark-bg text-neutral-500 dark:text-neutral-300 rounded-lg text-[10px] font-bold border border-neutral-200/45 dark:border-neutral-800 hover:border-brand-500 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-neutral-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search: Try "low-carb salmon under $25" or "spicy tempeh burger"...'
                className="w-full text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 pl-11 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="px-6 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/10 flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              {searching ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Search AI</span>
                </>
              )}
            </button>
          </form>

          {/* AI Search Results Section */}
          {searchResult && (
            <div className="p-5 border border-brand-500/20 rounded-2xl bg-brand-50/5 dark:bg-brand-950/5 space-y-4 animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-brand-500 uppercase tracking-wider">AI Culinary Analysis</span>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 italic font-medium leading-relaxed">
                    "{searchResult.explanation}"
                  </p>
                </div>
                <button 
                  onClick={handleClearSearch}
                  className="text-[10px] font-bold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  Clear Results
                </button>
              </div>

              {matchedDishes.length === 0 ? (
                <p className="text-xs text-neutral-400 pt-2">No menu items matched your specific parameters. Try queries like "keto", "vegan", or "spicy".</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {matchedDishes.map((dish) => {
                    const rest = restaurants.find(r => r.id === dish.restaurant_id);
                    return (
                      <Link
                        to={`/restaurant/${dish.restaurant_id}`}
                        key={dish.id}
                        className="group flex flex-col bg-white dark:bg-dark-surface border border-neutral-150 dark:border-dark-border/40 p-3.5 rounded-2xl shadow-sm hover:border-brand-500 transition-all hover:scale-[1.01]"
                      >
                        <div className="flex space-x-3">
                          <img 
                            src={dish.image_url} 
                            alt={dish.name} 
                            className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-bold text-brand-500 bg-brand-500/5 px-2 py-0.5 rounded uppercase tracking-wider block w-max">
                              {rest?.name || 'Restaurant'}
                            </span>
                            <h4 className="font-semibold text-neutral-800 dark:text-white text-xs truncate mt-1">{dish.name}</h4>
                            <span className="text-xs font-bold text-neutral-850 dark:text-white mt-1 block">${dish.price.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-dark-border/40 grid grid-cols-4 gap-1 text-[9px] text-center text-neutral-500">
                          <div>Cal: <strong className="text-neutral-750 dark:text-neutral-200">{dish.macros.calories}</strong></div>
                          <div>Pro: <strong className="text-brand-500 font-bold">{dish.macros.protein}g</strong></div>
                          <div>Carbs: <strong className="text-amber-500 font-bold">{dish.macros.carbs}g</strong></div>
                          <div>Fat: <strong className="text-sky-500 font-bold">{dish.macros.fat}g</strong></div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* TODAY'S OFFERS SECTION (Swiggy horizontal scroll list) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-extrabold text-lg text-neutral-800 dark:text-white flex items-center space-x-1.5">
              <Percent size={18} className="text-brand-500" />
              <span>Offers For You Today</span>
            </h3>
            <span className="text-xs text-neutral-400 font-semibold">Swipe to view</span>
          </div>

          <div className="flex space-x-5 overflow-x-auto pb-2 no-scrollbar scroll-smooth snap-x">
            {promoOffers.map((offer) => (
              <div 
                key={offer.id} 
                className={`snap-center flex-shrink-0 w-80 rounded-3xl overflow-hidden bg-gradient-to-r ${offer.bgGradient} p-5 text-white flex justify-between relative shadow-lg hover:scale-[1.01] transition-transform duration-300 border border-white/5`}
              >
                <div className="space-y-2 max-w-[60%] z-10 text-left">
                  <span className="px-2 py-0.5 bg-white/20 rounded-md text-[8px] font-extrabold uppercase tracking-widest">{offer.badge}</span>
                  <h4 className="font-display font-black text-base leading-tight">{offer.title}</h4>
                  <p className="text-[10px] text-white/95 leading-relaxed">{offer.desc}</p>
                </div>
                <img 
                  src={offer.image} 
                  alt={offer.title} 
                  className="w-24 h-24 object-cover rounded-2xl shadow-md border border-white/10 absolute right-4 bottom-4 rotate-6 group-hover:rotate-0 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>

        {/* CATEGORIES SECTION (Swiggy/Zomato style circular curation buttons) */}
        <div className="space-y-5">
          <h3 className="font-display font-extrabold text-lg text-neutral-800 dark:text-white">What's on your mind?</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  const element = document.getElementById('nearby-kitchens');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`group p-3.5 rounded-3xl flex flex-col items-center justify-between space-y-3 transition-all border ${
                  activeCategory === cat.id
                    ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                    : 'bg-white dark:bg-dark-surface border-neutral-200/50 dark:border-dark-border text-neutral-800 dark:text-neutral-255 hover:border-neutral-350'
                }`}
              >
                {/* Circular image wrapper */}
                <div className="w-16 h-16 rounded-full overflow-hidden border border-neutral-200/20 shadow-inner">
                  <img 
                    src={cat.image} 
                    alt={cat.label} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                  />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-center truncate max-w-full leading-tight">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* FEATURED RESTAURANTS SECTION (Swiggy highlighted cards) */}
        <div className="space-y-4">
          <h3 className="font-display font-extrabold text-lg text-neutral-800 dark:text-white">Featured Brands</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredRestaurants.map((rest) => (
              <Link
                to={`/restaurant/${rest.id}`}
                key={rest.id}
                className="group relative rounded-3xl overflow-hidden h-52 flex flex-col justify-end p-6 border border-neutral-850 shadow-lg hover:shadow-2xl transition-all"
              >
                <div className="absolute inset-0 bg-neutral-900/40 group-hover:bg-neutral-900/35 transition-colors z-10"></div>
                <img 
                  src={rest.image_url} 
                  alt={rest.name} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                
                {/* Top badges overlay */}
                <div className="absolute top-4 left-4 bg-amber-500 text-white px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest z-20 shadow-md">
                  ★ TOP BRAND
                </div>
                
                <div className="relative z-20 text-left space-y-1.5">
                  <h4 className="font-display font-black text-lg text-white leading-none drop-shadow">{rest.name}</h4>
                  <p className="text-[11px] text-neutral-200 font-medium drop-shadow">{rest.cuisine} • Partner Kitchen</p>
                  <div className="flex items-center space-x-3 pt-2 text-[10px] text-white/90">
                    <span className="flex items-center space-x-0.5"><Star size={10} className="text-amber-400 fill-amber-400" /> <strong>{rest.rating}</strong></span>
                    <span>•</span>
                    <span>20-25 mins</span>
                    <span>•</span>
                    <strong className="text-brand-400">Free Customizations</strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        {/* AI RECOMMENDED MEALS SECTION (Goal alignment highlights) */}
        <div className="bg-gradient-to-br from-emerald-500/[0.03] to-teal-500/[0.03] border border-neutral-200 dark:border-dark-border/60 p-6 sm:p-8 rounded-[2rem] space-y-6 shadow-md text-left">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Sparkles size={20} className="animate-float" />
                </span>
                <h3 className="font-display font-extrabold text-xl text-neutral-800 dark:text-white">
                  AI Recommendation Engine
                </h3>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Hyper-personalized meals matching your goals, mood, weather, budget, and orders history.
              </p>
            </div>
            
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <button
                onClick={() => setShowRecSettings(!showRecSettings)}
                className={`flex items-center justify-center space-x-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
                  showRecSettings 
                    ? 'bg-neutral-800 text-white border-neutral-800 dark:bg-white dark:text-neutral-900 dark:border-white' 
                    : 'bg-white dark:bg-dark-surface text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-dark-border hover:border-neutral-350'
                }`}
              >
                <Sliders size={14} />
                <span>Simulate Context</span>
                <ChevronDown size={14} className={`transform transition-transform duration-200 ${showRecSettings ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={fetchRecommendations}
                disabled={loadingRecs}
                className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-brand-500/10 transition-all disabled:opacity-50"
              >
                <RefreshCw size={14} className={loadingRecs ? 'animate-spin' : ''} />
                <span>Recalculate</span>
              </button>
            </div>
          </div>

          {/* AI Quick Mood Selector */}
          <div className="pt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block mb-2">
              How are you feeling today? (AI Mood Enhancer)
            </span>
            <div className="flex flex-wrap gap-2.5">
              {[
                { label: 'Tired 🥱', value: 'Tired', color: 'hover:border-amber-500/50 hover:bg-amber-500/[0.02]', activeColor: 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400' },
                { label: 'Stressed 😫', value: 'Stressed', color: 'hover:border-rose-500/50 hover:bg-rose-500/[0.02]', activeColor: 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400' },
                { label: 'Energetic ⚡', value: 'Energetic', color: 'hover:border-emerald-500/50 hover:bg-emerald-500/[0.02]', activeColor: 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                { label: 'Happy 😊', value: 'Happy', color: 'hover:border-yellow-500/50 hover:bg-yellow-500/[0.02]', activeColor: 'border-yellow-500 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
                { label: 'Lazy 🦥', value: 'Lazy', color: 'hover:border-indigo-500/50 hover:bg-indigo-500/[0.02]', activeColor: 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
                { label: 'Balanced 😐', value: 'Neutral', color: 'hover:border-teal-500/50 hover:bg-teal-500/[0.02]', activeColor: 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400' },
              ].map(moodItem => {
                const isActive = recMood === moodItem.value;
                return (
                  <button
                    key={moodItem.value}
                    onClick={async () => {
                      setRecMood(moodItem.value);
                      localStorage.setItem('nn_rec_mood', moodItem.value);
                      setLoadingRecs(true);
                      try {
                        const results = await getAIRecommendations(menuItems, {
                          orderHistory,
                          currentTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                          weather: recWeather,
                          budget: recBudget,
                          calories: recCalories,
                          protein: recProtein,
                          festival: recFestival,
                          mood: moodItem.value,
                          healthGoal: recHealthGoal
                        });
                        setRecommendations(results);
                      } catch (e) {
                        console.error('Failed to load AI Recommendations:', e);
                      } finally {
                        setLoadingRecs(false);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all duration-200 transform active:scale-95 ${
                      isActive 
                        ? moodItem.activeColor 
                        : `bg-white dark:bg-dark-surface border-neutral-200/60 dark:border-dark-border text-neutral-600 dark:text-neutral-300 ${moodItem.color}`
                    }`}
                  >
                    {moodItem.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SIMULATION PANEL */}
          {showRecSettings && (
            <div className="bg-neutral-100/50 dark:bg-dark-bg/40 border border-neutral-200/50 dark:border-dark-border/40 p-6 rounded-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
              {/* Health Goal */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 flex items-center space-x-1">
                  <Activity size={10} className="text-brand-500" />
                  <span>Health Goal</span>
                </label>
                <select
                  value={recHealthGoal}
                  onChange={(e) => setRecHealthGoal(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-xl p-2 text-neutral-700 dark:text-neutral-200 font-medium focus:ring-1 focus:ring-brand-500"
                >
                  <option value="General Wellness">General Wellness 🥗</option>
                  <option value="Diabetes Control">Diabetes Control 🩸</option>
                  <option value="Weight Loss">Weight Loss ⚖️</option>
                  <option value="Muscle Gain">Muscle Gain 💪</option>
                </select>
              </div>

              {/* Mood */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 flex items-center space-x-1">
                  <Smile size={10} className="text-amber-500" />
                  <span>Current Mood</span>
                </label>
                <select
                  value={recMood}
                  onChange={(e) => setRecMood(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-xl p-2 text-neutral-700 dark:text-neutral-200 font-medium focus:ring-1 focus:ring-brand-500"
                >
                  <option value="Neutral">Neutral 😐</option>
                  <option value="Tired">Tired 🥱</option>
                  <option value="Stressed">Stressed 😫</option>
                  <option value="Energetic">Energetic ⚡</option>
                  <option value="Happy">Happy 😊</option>
                  <option value="Lazy">Lazy 🦥</option>
                </select>
              </div>

              {/* Weather */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 flex items-center space-x-1">
                  <CloudRain size={10} className="text-sky-500" />
                  <span>Simulated Weather</span>
                </label>
                <select
                  value={recWeather}
                  onChange={(e) => setRecWeather(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-xl p-2 text-neutral-700 dark:text-neutral-200 font-medium focus:ring-1 focus:ring-brand-500"
                >
                  <option value="Rainy/Monsoon">Rainy / Monsoon 🌧️</option>
                  <option value="Sunny/Hot">Sunny / Hot ☀️</option>
                  <option value="Cold/Windy">Cold / Windy ❄️</option>
                  <option value="Pleasant">Pleasant 🌤️</option>
                </select>
              </div>

              {/* Festival */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 flex items-center space-x-1">
                  <Calendar size={10} className="text-rose-500" />
                  <span>Festival / Season</span>
                </label>
                <select
                  value={recFestival}
                  onChange={(e) => setRecFestival(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-xl p-2 text-neutral-700 dark:text-neutral-200 font-medium focus:ring-1 focus:ring-brand-500"
                >
                  <option value="None">None 🚫</option>
                  <option value="Monsoon Special">Monsoon Special ☔</option>
                  <option value="Diwali">Diwali 🪔</option>
                  <option value="Christmas">Christmas 🎄</option>
                </select>
              </div>

              {/* Sliders: Budget, Calories, Protein */}
              <div className="space-y-2 sm:col-span-2">
                <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  <span>Simulated Budget Limit</span>
                  <span className="text-brand-500 font-black">${recBudget}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={recBudget}
                  onChange={(e) => setRecBudget(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 dark:bg-dark-surface rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
              </div>

              <div className="space-y-2 sm:col-span-1">
                <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  <span>Max Calories</span>
                  <span className="text-amber-500 font-black">{recCalories} kcal</span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="1200"
                  value={recCalories}
                  onChange={(e) => setRecCalories(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 dark:bg-dark-surface rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              <div className="space-y-2 sm:col-span-1">
                <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  <span>Min Protein</span>
                  <span className="text-sky-500 font-black">{recProtein}g</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={recProtein}
                  onChange={(e) => setRecProtein(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 dark:bg-dark-surface rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>
            </div>
          )}

          {/* ENGINE RESULTS */}
          {loadingRecs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-[2rem] space-y-4 animate-pulse">
                  <div className="w-full h-44 bg-neutral-200 dark:bg-dark-bg/60 rounded-2xl"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-200 dark:bg-dark-bg/60 rounded w-2/3"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-dark-bg/60 rounded w-1/2"></div>
                  </div>
                  <div className="bg-emerald-500/[0.04] dark:bg-dark-bg/40 p-3 rounded-2xl space-y-2">
                    <div className="h-2 bg-neutral-200 dark:bg-dark-bg/60 rounded w-1/4"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-dark-bg/60 rounded w-5/6"></div>
                  </div>
                  <div className="pt-3 border-t border-neutral-100 dark:border-dark-border/40 flex justify-between items-center">
                    <div className="h-4 bg-neutral-200 dark:bg-dark-bg/60 rounded w-1/4"></div>
                    <div className="h-8 bg-neutral-200 dark:bg-dark-bg/60 rounded-xl w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-neutral-200 dark:border-dark-border rounded-3xl">
              <AlertCircle size={28} className="mx-auto text-neutral-400" />
              <p className="text-xs text-neutral-400 font-medium mt-2">
                No items matches current filters. Try stretching your budget or calorie limits.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.map((rec) => {
                const dish = menuItems.find(m => m.id === rec.menuItemId);
                if (!dish) return null;
                const rest = restaurants.find(r => r.id === dish.restaurant_id);
                
                return (
                  <div
                    key={dish.id}
                    className="group bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-[2rem] flex flex-col justify-between hover:border-brand-500 transition-all hover:shadow-xl relative"
                  >
                    <div className="space-y-4">
                      {/* Image and badges */}
                      <div className="relative h-44 rounded-2xl overflow-hidden bg-neutral-100">
                        <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-350" />
                        
                        {/* Confidence score badge */}
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-lg flex items-center space-x-1 border border-white/10">
                          <Sparkles size={9} />
                          <span>{rec.confidenceScore}% Match</span>
                        </div>

                        {/* Restaurant Name Overlay */}
                        <div className="absolute bottom-3 left-3 bg-neutral-900/75 backdrop-blur-md text-white font-bold text-[9px] px-2 py-1 rounded-lg">
                          {rest?.name} • ★{rest?.rating}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1">
                        <h4 className="font-display font-black text-sm text-neutral-850 dark:text-white leading-tight">
                          {dish.name}
                        </h4>
                        <p className="text-[10px] text-neutral-450 line-clamp-1">
                          {dish.description}
                        </p>
                      </div>

                      {/* Explanation - WHY suggested */}
                      <div className="bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] border border-emerald-500/10 p-3 rounded-2xl text-[10px] text-neutral-600 dark:text-neutral-300 leading-relaxed space-y-1">
                        <span className="font-bold text-brand-600 dark:text-brand-400 block text-[9px] uppercase tracking-wide">Why suggested:</span>
                        <p>{rec.explanation}</p>
                      </div>
                    </div>

                    {/* Footer & Action */}
                    <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-dark-border/40 space-y-3">
                      {/* Macros display */}
                      <div className="grid grid-cols-4 gap-1.5 text-[9px] text-center text-neutral-600 dark:text-neutral-350 font-bold">
                        <div className="bg-neutral-50 dark:bg-dark-bg/60 py-1 rounded-xl border border-neutral-200/20">Cal: <strong className="text-neutral-800 dark:text-neutral-200 block text-xs">{dish.macros.calories}</strong></div>
                        <div className="bg-neutral-50 dark:bg-dark-bg/60 py-1 rounded-xl border border-neutral-200/20">Pro: <strong className="text-brand-500 block text-xs">{dish.macros.protein}g</strong></div>
                        <div className="bg-neutral-50 dark:bg-dark-bg/60 py-1 rounded-xl border border-neutral-200/20">Carb: <strong className="text-amber-500 block text-xs">{dish.macros.carbs}g</strong></div>
                        <div className="bg-neutral-50 dark:bg-dark-bg/60 py-1 rounded-xl border border-neutral-200/20">Fat: <strong className="text-sky-500 block text-xs">{dish.macros.fat}g</strong></div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-left">
                          <span className="text-[8px] text-neutral-400 uppercase tracking-widest font-extrabold block">Price</span>
                          <strong className="text-neutral-850 dark:text-white text-base">${dish.price.toFixed(2)}</strong>
                        </div>

                        {/* Add to Cart button */}
                        <button
                          onClick={() => {
                            addToCart(dish, 1);
                            // Set addedId for micro-animation
                            const btn = document.getElementById(`rec-add-btn-${dish.id}`);
                            if (btn) {
                              const originalContent = btn.innerHTML;
                              btn.innerHTML = 'Added! ✓';
                              btn.classList.add('bg-emerald-600');
                              setTimeout(() => {
                                btn.innerHTML = originalContent;
                                btn.classList.remove('bg-emerald-600');
                              }, 1500);
                            }
                          }}
                          id={`rec-add-btn-${dish.id}`}
                          className="flex items-center space-x-1.5 px-4.5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-xs font-extrabold shadow-md transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <ShoppingCart size={12} />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TRENDING RESTAURANTS SECTION (Zomato high-rating lists) */}
        <div className="space-y-4">
          <h3 className="font-display font-extrabold text-lg text-neutral-800 dark:text-white flex items-center space-x-1.5">
            <Flame size={18} className="text-amber-500" />
            <span>Trending Kitchens This Week</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border rounded-3xl overflow-hidden p-5 space-y-4 animate-pulse">
                  <div className="w-full h-40 bg-neutral-200 dark:bg-dark-bg/60 rounded-2xl"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-200 dark:bg-dark-bg/60 rounded w-2/3"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-dark-bg/60 rounded w-1/2"></div>
                  </div>
                  <div className="pt-3 border-t border-neutral-100 dark:border-dark-border/40 h-4 bg-neutral-200 dark:bg-dark-bg/60 rounded w-1/3"></div>
                </div>
              ))
            ) : (
              trendingRestaurants.map((rest) => (
                <Link
                  to={`/restaurant/${rest.id}`}
                  key={rest.id}
                  className="group bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-350"
                >
                  <div className="relative h-40 overflow-hidden bg-neutral-100">
                    <img src={rest.image_url} alt={rest.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-3 right-3 bg-white/95 dark:bg-dark-surface/95 px-2 py-0.5 rounded-lg flex items-center space-x-1 shadow-md">
                      <Star size={11} className="text-amber-500 fill-amber-500" />
                      <span className="text-xs font-black text-neutral-850 dark:text-white">{rest.rating}</span>
                    </div>
                    <span className="absolute bottom-3 left-3 bg-neutral-900/80 text-white px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest backdrop-blur-sm">
                      {rest.cuisine.split('&')[0]}
                    </span>
                  </div>
                  <div className="p-5 text-left space-y-3">
                    <div>
                      <h4 className="font-display font-extrabold text-sm text-neutral-800 dark:text-white leading-tight">{rest.name}</h4>
                      <p className="text-[10px] text-neutral-450 mt-1">{rest.address}</p>
                    </div>
                    <div className="pt-3 border-t border-neutral-100 dark:border-dark-border/40 flex justify-between items-center text-[10px] text-neutral-500">
                      <span>🔥 High Demand</span>
                      <span className="font-bold text-neutral-700 dark:text-neutral-300">$$ • 25 mins</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* HEALTHY PICKS SECTION (Uber Eats / Zomato style wellness focus) */}
        <div className="space-y-4">
          <div>
            <h3 className="font-display font-extrabold text-lg text-neutral-800 dark:text-white flex items-center space-x-1.5">
              <Zap size={18} className="text-emerald-500" />
              <span>Healthy Picks under 550 Calories</span>
            </h3>
            <p className="text-xs text-neutral-400">Nutritionally optimized meals designed to support energy without the carb crash.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-4 rounded-3xl space-y-3 animate-pulse">
                  <div className="w-full h-28 bg-neutral-200 dark:bg-dark-bg/60 rounded-2xl"></div>
                  <div className="h-3.5 bg-neutral-200 dark:bg-dark-bg/60 rounded w-3/4"></div>
                  <div className="h-3 bg-neutral-200 dark:bg-dark-bg/60 rounded w-1/2"></div>
                  <div className="pt-3 border-t border-neutral-100 dark:border-dark-border/40 flex justify-between">
                    <div className="h-3 bg-neutral-200 dark:bg-dark-bg/60 rounded w-1/4"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-dark-bg/60 rounded w-1/4"></div>
                  </div>
                </div>
              ))
            ) : (
              healthyPicks.map((dish) => {
                const rest = restaurants.find(r => r.id === dish.restaurant_id);
                return (
                  <Link
                    to={`/restaurant/${dish.restaurant_id}`}
                    key={dish.id}
                    className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-4 rounded-3xl flex flex-col justify-between hover:border-brand-500 transition-all hover:scale-[1.01]"
                  >
                    <div className="space-y-3 text-left">
                      <img src={dish.image_url} alt={dish.name} className="w-full h-28 object-cover rounded-2xl" />
                      <div>
                        <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block leading-none">{rest?.name}</span>
                        <h4 className="font-bold text-xs text-neutral-800 dark:text-white mt-1 leading-snug truncate">{dish.name}</h4>
                        <span className="text-[10px] font-bold text-emerald-500 mt-1 block">{dish.macros.calories} kcal</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-dark-border/40 flex justify-between items-center">
                      <strong className="text-neutral-800 dark:text-white text-xs">${dish.price.toFixed(2)}</strong>
                      <span className="text-[9px] font-extrabold text-brand-500 uppercase flex items-center space-x-0.5">
                        <span>Order</span>
                        <ChevronRight size={10} />
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* POPULAR COMBOS SECTION (Bundle savings) */}
        <div className="space-y-4">
          <h3 className="font-display font-extrabold text-lg text-neutral-800 dark:text-white">Popular Health Combos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {combos.map((combo) => (
              <Link
                to={`/restaurant/${combo.restaurantId}`}
                key={combo.id}
                className="group bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-[2rem] flex flex-col sm:flex-row items-center gap-5 hover:shadow-lg transition-all hover:border-brand-500"
              >
                <img src={combo.image} alt={combo.name} className="w-24 h-24 object-cover rounded-2xl flex-shrink-0" />
                <div className="text-left flex-1 min-w-0 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-lg text-[9px] font-extrabold uppercase tracking-wide">
                      {combo.savings}
                    </span>
                    <strong className="text-brand-500 text-xs">${combo.price.toFixed(2)}</strong>
                  </div>
                  <h4 className="font-bold text-sm text-neutral-800 dark:text-white leading-tight truncate">{combo.name}</h4>
                  <p className="text-[10px] text-neutral-450 leading-relaxed line-clamp-1">{combo.items}</p>
                  
                  {/* Energy details */}
                  <div className="grid grid-cols-4 gap-1 text-[8px] text-center text-neutral-400 pt-1.5 border-t border-neutral-100 dark:border-dark-border/40">
                    <div>Energy: <strong className="text-neutral-700 dark:text-neutral-200 block text-[10px]">{combo.calories}</strong></div>
                    <div>Pro: <strong className="text-brand-500 block text-[10px]">{combo.protein}</strong></div>
                    <div>Carbs: <strong className="text-amber-500 block text-[10px]">{combo.carbs}</strong></div>
                    <div>Fat: <strong className="text-sky-500 block text-[10px]">{combo.fat}</strong></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* NEARBY RESTAURANTS LIST (Zomato/Uber Eats grid) */}
        <div id="nearby-kitchens" className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-display font-extrabold text-lg text-neutral-800 dark:text-white">All Kitchens Near You</h3>
              <p className="text-xs text-neutral-400">Order customized energy meals delivered straight to your door.</p>
            </div>
            <span className="text-xs text-neutral-400 font-semibold">{filteredRestaurants.length} Kitchens Open</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border rounded-3xl overflow-hidden p-5 space-y-4 animate-pulse">
                  <div className="w-full h-44 bg-neutral-200 dark:bg-dark-bg/60 rounded-2xl"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-200 dark:bg-dark-bg/60 rounded w-2/3"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-dark-bg/60 rounded w-1/2"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-dark-bg/60 rounded w-3/4"></div>
                  </div>
                  <div className="pt-4 border-t border-neutral-100 dark:border-dark-border/40 flex justify-between">
                    <div className="h-3 bg-neutral-200 dark:bg-dark-bg/60 rounded w-1/3"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-dark-bg/60 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
              <p className="text-neutral-400 text-sm">No kitchens match this cuisine criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((rest) => (
                <Link 
                  to={`/restaurant/${rest.id}`}
                  key={rest.id} 
                  className="group flex flex-col bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border rounded-3xl overflow-hidden hover:shadow-xl transition-all hover:scale-[1.01] hover:border-brand-500"
                >
                  <div className="relative h-44 overflow-hidden bg-neutral-100">
                    <img 
                      src={rest.image_url} 
                      alt={rest.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 bg-white/95 dark:bg-dark-surface/95 px-2.5 py-1 rounded-xl flex items-center space-x-1 shadow-md backdrop-blur-md">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      <span className="text-xs font-extrabold text-neutral-800 dark:text-white">{rest.rating}</span>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-brand-500 text-white px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-md">
                      {rest.cuisine.split('&')[0]}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="font-display font-extrabold text-base text-neutral-800 dark:text-white leading-tight">
                        {rest.name}
                      </h4>
                      <p className="text-xs text-neutral-450 mt-1 font-medium">{rest.cuisine}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed line-clamp-2 text-left">
                        {rest.description}
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t border-neutral-100 dark:border-dark-border/40 flex items-center justify-between text-xs text-neutral-500">
                      <span className="flex items-center space-x-1 truncate max-w-[160px]">
                        <MapPin size={12} className="text-neutral-400 flex-shrink-0" />
                        <span className="truncate">{rest.address}</span>
                      </span>
                      <span className="flex items-center text-brand-500 font-bold group-hover:translate-x-1 transition-transform">
                        <span>Order Now</span>
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* PREMIUM RESPONSIVE FOOTER (Zomato/Swiggy style layout) */}
      <footer className="w-full bg-neutral-900 text-neutral-350 border-t border-neutral-800 pt-16 pb-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
            {/* Branding Column */}
            <div className="space-y-4">
              <span className="font-display font-black text-xl text-white tracking-tight flex items-center space-x-2">
                <span className="p-2 rounded-xl bg-brand-500 text-white w-max block">🥗</span>
                <span>NourishNow <span className="text-brand-500">AI</span></span>
              </span>
              <p className="text-xs leading-relaxed text-neutral-400">
                Premium calorie-aligned food delivery services powered by AI Chef customization engines. Custom-tweak macro nutrients in real time.
              </p>
              <div className="flex space-x-3 text-neutral-450 text-xs">
                <span>© {new Date().getFullYear()} NourishNow Inc.</span>
              </div>
            </div>

            {/* Program Column */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Dietary Programs</h5>
              <ul className="space-y-2 text-xs">
                <li><Link to="/" onClick={() => setActiveCategory('vegan')} className="hover:text-white transition-colors">Plant-Based & Vegan</Link></li>
                <li><Link to="/" onClick={() => setActiveCategory('keto')} className="hover:text-white transition-colors">Ketogenic & Low-Carb</Link></li>
                <li><Link to="/" onClick={() => setActiveCategory('indian')} className="hover:text-white transition-colors">Gluten-Free & Spiced</Link></li>
                <li><Link to="/" onClick={() => setActiveCategory('italian')} className="hover:text-white transition-colors">Calorie-Aligned Italian</Link></li>
              </ul>
            </div>

            {/* Partners Column */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Partner Portals</h5>
              <ul className="space-y-2 text-xs">
                <li><Link to="/login" className="hover:text-white transition-colors">Chef Kitchen Registry</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Courier Partner Portal</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Restaurant Dashboard</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Sponsorships & Franchise</Link></li>
              </ul>
            </div>

            {/* Newsletter Column */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Join Nutrition Circle</h5>
              <p className="text-xs text-neutral-400">Get weekly AI-calculated recipes, nutrition science, and promo codes.</p>
              <form onSubmit={(e) => e.preventDefault()} className="flex space-x-1.5 pt-1">
                <input 
                  type="email" 
                  placeholder="your@email.com" 
                  className="bg-neutral-800 border border-neutral-700/60 rounded-xl px-3 py-2 text-xs outline-none focus:border-brand-500 text-white w-full"
                />
                <button type="submit" className="p-2.5 bg-brand-500 hover:bg-brand-600 rounded-xl text-white transition-colors">
                  <Mail size={14} />
                </button>
              </form>
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-800 text-center text-[10px] text-neutral-500 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex space-x-4">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Service</a>
              <a href="#" className="hover:underline">Cookie Settings</a>
            </div>
            <div className="flex items-center space-x-1 text-neutral-450 font-semibold">
              <ShieldCheck size={12} className="text-brand-500" />
              <span>Secured and AI-optimized delivery networks.</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
