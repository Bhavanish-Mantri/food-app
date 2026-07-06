import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { analyzeReviews } from '../services/gemini';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CustomizerModal } from '../components/CustomizerModal';
import { Restaurant, MenuItem, Review, OrderItemCustomization, AISentiment } from '../types/database';
import { 
  Star, MapPin, Sparkles, Plus, Info, 
  MessageSquare, Send, TrendingUp, ThumbsUp, ThumbsDown,
  Heart, Clock, Compass, Search, Filter, ArrowUpDown, ChevronDown
} from 'lucide-react';

export const RestaurantDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Customizer Modal State
  const [selectedCustomizeItem, setSelectedCustomizeItem] = useState<MenuItem | null>(null);

  // Interactive Features State
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [filterVeg, setFilterVeg] = useState(false);
  const [filterNonVeg, setFilterNonVeg] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'calories-low' | 'protein-high'>('default');
  const [isRestaurantFavorite, setIsRestaurantFavorite] = useState(false);
  const [favoritedItems, setFavoritedItems] = useState<string[]>([]);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');

  // Review System State
  const [aiAnalysis, setAiAnalysis] = useState<AISentiment | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewsFilterRating, setReviewsFilterRating] = useState<number | 'all'>('all');
  const [reviewHelpfulVotes, setReviewHelpfulVotes] = useState<Record<string, number>>({});
  const [votedReviews, setVotedReviews] = useState<string[]>([]);

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Restaurant details
      const { data: rest } = await supabase.from('restaurants').select('*').eq('id', id).single();
      if (rest) setRestaurant(rest as Restaurant);

      // Menu Items
      const { data: items } = await supabase.from('menu_items').select('*').eq('restaurant_id', id);
      if (items) setMenuItems(items as MenuItem[]);

      // Reviews
      const { data: revs } = await supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', id)
        .order('created_at', { ascending: false });
      if (revs) setReviews(revs as Review[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Run AI Review analysis
  useEffect(() => {
    const runAnalysis = async () => {
      if (reviews.length === 0) return;
      setLoadingAnalysis(true);
      try {
        const analysis = await analyzeReviews(reviews);
        setAiAnalysis(analysis);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAnalysis(false);
      }
    };
    if (reviews.length > 0) {
      runAnalysis();
    }
  }, [reviews]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in w-full">
        {/* Restaurant Header Jumbotron Skeleton */}
        <div className="relative rounded-[2.5rem] overflow-hidden bg-neutral-200 dark:bg-dark-bg/60 h-72 sm:h-96 animate-pulse p-6 sm:p-10 flex flex-col justify-end">
          <div className="space-y-4">
            <div className="h-6 bg-neutral-300 dark:bg-neutral-800 rounded w-1/4"></div>
            <div className="h-10 bg-neutral-300 dark:bg-neutral-800 rounded w-1/2"></div>
            <div className="h-4 bg-neutral-300 dark:bg-neutral-800 rounded w-1/3"></div>
            <div className="flex gap-4 pt-2">
              <div className="h-6 bg-neutral-300 dark:bg-neutral-800 rounded-lg w-20"></div>
              <div className="h-6 bg-neutral-300 dark:bg-neutral-800 rounded-lg w-24"></div>
              <div className="h-6 bg-neutral-300 dark:bg-neutral-800 rounded-lg w-16"></div>
            </div>
          </div>
        </div>

        {/* Tab / Category Bar Skeleton */}
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-neutral-200 dark:bg-dark-surface rounded-2xl w-24 flex-shrink-0"></div>
          ))}
        </div>

        {/* Filters and Search controls Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2 animate-pulse">
          <div className="h-11 bg-neutral-200 dark:bg-dark-surface rounded-2xl w-full md:w-80"></div>
          <div className="flex gap-2.5 w-full md:w-auto">
            <div className="h-10 bg-neutral-200 dark:bg-dark-surface rounded-2xl w-1/2 md:w-28"></div>
            <div className="h-10 bg-neutral-200 dark:bg-dark-surface rounded-2xl w-1/2 md:w-36"></div>
          </div>
        </div>

        {/* Main Grid: Menu items & Sidebar AI analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Items (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-[2rem] space-y-4 animate-pulse">
                  <div className="w-full h-44 bg-neutral-200 dark:bg-dark-bg/60 rounded-2xl"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-neutral-200 dark:bg-dark-bg/60 rounded w-2/3"></div>
                    <div className="h-3 bg-neutral-200 dark:bg-dark-bg/60 rounded w-1/2"></div>
                  </div>
                  <div className="pt-3 border-t border-neutral-100 dark:border-dark-border/40 flex justify-between items-center">
                    <div className="h-4 bg-neutral-200 dark:bg-dark-bg/60 rounded w-1/4"></div>
                    <div className="h-8 bg-neutral-200 dark:bg-dark-bg/60 rounded-xl w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Sidebar & Reviews (1 col) */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-[2rem] space-y-4 animate-pulse">
              <div className="h-6 bg-neutral-200 dark:bg-dark-bg/60 rounded w-1/2"></div>
              <div className="h-16 bg-neutral-200 dark:bg-dark-bg/60 rounded-2xl"></div>
              <div className="h-4 bg-neutral-200 dark:bg-dark-bg/60 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-16">
        <p className="text-neutral-500 text-sm">Restaurant not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-xs font-bold text-brand-500 hover:underline">
          Go Back Home
        </button>
      </div>
    );
  }

  // Helper to check Veg status based on keywords
  const isVegItem = (item: MenuItem): boolean => {
    const name = item.name.toLowerCase();
    const desc = item.description.toLowerCase();
    
    if (name.includes('chicken') || name.includes('steak') || name.includes('beef') || 
        name.includes('salmon') || name.includes('shrimp') || name.includes('lamb') || 
        name.includes('pepperoni') || name.includes('meat') || name.includes('fish') || 
        name.includes('ribeye')) {
      return false;
    }
    return true;
  };

  // Toggle favorites
  const toggleItemFavorite = (itemId: string) => {
    if (favoritedItems.includes(itemId)) {
      setFavoritedItems(favoritedItems.filter(id => id !== itemId));
    } else {
      setFavoritedItems([...favoritedItems, itemId]);
    }
  };

  // Handle Review upvotes
  const handleUpvoteReview = (reviewId: string) => {
    if (votedReviews.includes(reviewId)) return;
    setVotedReviews([...votedReviews, reviewId]);
    setReviewHelpfulVotes(prev => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1
    }));
  };

  // Handle Review Submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user || !id) return;
    setSubmittingReview(true);

    try {
      const newReview: Partial<Review> = {
        restaurant_id: id,
        user_id: user.id,
        user_name: user.name,
        rating,
        comment,
      };

      const { error } = await supabase.from('reviews').insert(newReview).select().single();
      if (!error) {
        setComment('');
        setRating(5);
        fetchDetails(); // Reload reviews
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Customizer confirm handler
  const handleCustomizerConfirm = (customization: OrderItemCustomization) => {
    if (selectedCustomizeItem) {
      addToCart(selectedCustomizeItem, 1, customization);
      setSelectedCustomizeItem(null);
    }
  };

  // Filter & Sort menu items
  const filteredMenuItems = menuItems
    .filter(item => {
      // Search filter
      const matchesSearch = item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
                            item.description.toLowerCase().includes(menuSearchQuery.toLowerCase());
      
      // Veg/Non Veg filter
      const isVeg = isVegItem(item);
      let matchesVegFilter = true;
      if (filterVeg && !isVeg) matchesVegFilter = false;
      if (filterNonVeg && isVeg) matchesVegFilter = false;

      // Category filter (if tab matches)
      const matchesCategoryTab = activeCategoryTab === 'all' || item.category === activeCategoryTab;

      return matchesSearch && matchesVegFilter && matchesCategoryTab;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'calories-low') return a.macros.calories - b.macros.calories;
      if (sortBy === 'protein-high') return b.macros.protein - a.macros.protein;
      return 0; // default
    });

  // Extract actual menu categories
  const allCategories = Array.from(new Set(menuItems.map(item => item.category)));
  const visibleCategories = Array.from(new Set(filteredMenuItems.map(item => item.category)));

  // Filtered reviews
  const filteredReviews = reviews.filter(rev => {
    if (reviewsFilterRating === 'all') return true;
    return rev.rating === reviewsFilterRating;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in">
      
      {/* Restaurant Header Jumbotron (Swiggy / Uber Eats look) */}
      <div className="relative rounded-[2.5rem] overflow-hidden shadow-xl border border-neutral-200/10">
        <img 
          src={restaurant.image_url} 
          alt={restaurant.name} 
          className="w-full h-72 sm:h-96 object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/50 to-transparent"></div>
        
        {/* Favorite button */}
        <button 
          onClick={() => setIsRestaurantFavorite(!isRestaurantFavorite)}
          className={`absolute top-6 right-6 p-3.5 rounded-full border backdrop-blur-md transition-all shadow-lg hover:scale-105 ${
            isRestaurantFavorite 
              ? 'bg-rose-500 border-rose-500 text-white' 
              : 'bg-black/30 border-white/20 text-white hover:bg-black/40'
          }`}
          title={isRestaurantFavorite ? 'Favorited' : 'Add to Favorites'}
        >
          <Heart size={20} className={isRestaurantFavorite ? 'fill-white' : ''} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-white space-y-4 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-brand-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-xl uppercase tracking-wider shadow-md">
              {restaurant.cuisine}
            </span>
            <div className="flex items-center space-x-1 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-bold border border-white/10">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              <span>{restaurant.rating}</span>
              <span className="text-neutral-350">({restaurant.reviews_count} reviews)</span>
            </div>
            
            {/* Delivery indicators */}
            <div className="flex items-center space-x-1 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-semibold border border-white/10">
              <Clock size={12} className="text-brand-400" />
              <span>25 mins</span>
            </div>
            <div className="flex items-center space-x-1 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-semibold border border-white/10">
              <Compass size={12} className="text-sky-400" />
              <span>1.8 miles</span>
            </div>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl tracking-tight leading-none text-white">
            {restaurant.name}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-350 leading-relaxed max-w-2xl">
            {restaurant.description}
          </p>
          <div className="flex items-center space-x-1.5 text-xs text-neutral-300 pt-1">
            <MapPin size={14} className="text-neutral-450" />
            <span>{restaurant.address}</span>
          </div>
        </div>
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        
        {/* Left Columns (Menu) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* MENU SEARCH, FILTERS & SORT PANEL (Swiggy / Zomato Toolbar style) */}
          <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-3xl space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Menu */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-neutral-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  placeholder="Search inside menu items..."
                  className="w-full text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-dark-bg text-neutral-850 dark:text-neutral-200 pl-9 pr-4 py-2.5 outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              {/* Sort dropdown */}
              <div className="relative min-w-[160px]">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-450 pointer-events-none">
                  <ArrowUpDown size={12} />
                </span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="w-full text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-dark-bg text-neutral-800 dark:text-neutral-250 pl-8 pr-8 py-2.5 outline-none focus:border-brand-500 appearance-none font-bold"
                >
                  <option value="default">Default Sort</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="calories-low">Calories: Low to High</option>
                  <option value="protein-high">Protein: High to Low</option>
                </select>
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 pointer-events-none">
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Veg / Non Veg toggles */}
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setFilterVeg(!filterVeg);
                    if (filterNonVeg) setFilterNonVeg(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all flex items-center space-x-1.5 ${
                    filterVeg 
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-450' 
                      : 'bg-neutral-50 dark:bg-dark-bg border-neutral-200/50 dark:border-neutral-800 text-neutral-500 dark:text-neutral-350 hover:border-neutral-300'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-600"></span>
                  <span>Pure Veg</span>
                </button>

                <button
                  onClick={() => {
                    setFilterNonVeg(!filterNonVeg);
                    if (filterVeg) setFilterVeg(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all flex items-center space-x-1.5 ${
                    filterNonVeg 
                      ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-450' 
                      : 'bg-neutral-50 dark:bg-dark-bg border-neutral-200/50 dark:border-neutral-800 text-neutral-500 dark:text-neutral-350 hover:border-neutral-300'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-600"></span>
                  <span>Non-Veg</span>
                </button>
              </div>

              {/* Favorites filter toggle */}
              <span className="text-[10px] text-neutral-450 font-bold">
                Showing {filteredMenuItems.length} of {menuItems.length} items
              </span>
            </div>

            {/* Category horizontal scrolling bar */}
            <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar pt-2 border-t border-neutral-100 dark:border-dark-border/40">
              <button
                onClick={() => setActiveCategoryTab('all')}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold flex-shrink-0 transition-colors ${
                  activeCategoryTab === 'all'
                    ? 'bg-brand-500 text-white'
                    : 'bg-neutral-100 dark:bg-dark-bg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200'
                }`}
              >
                All Menu
              </button>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryTab(cat)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold flex-shrink-0 transition-colors ${
                    activeCategoryTab === cat
                      ? 'bg-brand-500 text-white'
                      : 'bg-neutral-100 dark:bg-dark-bg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

          </div>

          {/* MENU ITEMS GRID SECTION */}
          {visibleCategories.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border rounded-[2rem]">
              <p className="text-neutral-400 text-sm">No items found matching the current filters.</p>
              <button 
                onClick={() => {
                  setMenuSearchQuery('');
                  setFilterVeg(false);
                  setFilterNonVeg(false);
                  setActiveCategoryTab('all');
                }}
                className="mt-3 text-xs font-bold text-brand-500 hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            visibleCategories.map((cat) => (
              <div key={cat} className="space-y-4">
                <h3 className="font-display font-extrabold text-base text-neutral-800 dark:text-white border-b border-neutral-150 dark:border-dark-border/40 pb-2">
                  {cat}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMenuItems.filter(item => item.category === cat).map((item) => {
                    const isVeg = isVegItem(item);
                    const isFav = favoritedItems.includes(item.id);
                    return (
                      <div 
                        key={item.id}
                        className="group bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-4 rounded-3xl flex flex-col justify-between hover:shadow-lg transition-all hover:border-brand-500/35 relative overflow-hidden"
                      >
                        {/* Veg/Non-Veg icon badge top left */}
                        <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-dark-surface/90 p-1.5 rounded-lg border border-neutral-100 dark:border-dark-border/60">
                          <span className={`w-3.5 h-3.5 border-2 rounded flex items-center justify-center ${
                            isVeg ? 'border-emerald-500' : 'border-rose-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}></span>
                          </span>
                        </div>

                        {/* Favorite button on food card */}
                        <button
                          onClick={() => toggleItemFavorite(item.id)}
                          className={`absolute top-4 right-4 z-10 p-1.5 rounded-full border backdrop-blur-md shadow transition-all hover:scale-105 ${
                            isFav 
                              ? 'bg-rose-500 border-rose-500 text-white' 
                              : 'bg-white/80 dark:bg-dark-surface/80 border-neutral-200/50 text-neutral-400 dark:text-neutral-300'
                          }`}
                        >
                          <Heart size={12} className={isFav ? 'fill-white' : ''} />
                        </button>

                        <div className="flex space-x-4">
                          {item.image_url && (
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="w-24 h-24 object-cover rounded-2xl flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1 space-y-1">
                            <h4 className="font-bold text-neutral-850 dark:text-white text-xs leading-snug line-clamp-1">{item.name}</h4>
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-350 leading-relaxed line-clamp-3">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Macro stats chart breakdown style */}
                        <div className="mt-4 p-3 bg-neutral-50 dark:bg-dark-bg/60 border border-neutral-100 dark:border-dark-border/40 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-bold text-neutral-400 uppercase tracking-wider leading-none">
                            <span>Nutritional Breakdown</span>
                            <span className="text-neutral-700 dark:text-neutral-200">{item.macros.calories} kcal</span>
                          </div>
                          
                          {/* Visual progress bar overlays */}
                          <div className="grid grid-cols-3 gap-2 text-[9px]">
                            <div className="space-y-1">
                              <span className="text-brand-500 font-semibold block">Pro: {item.macros.protein}g</span>
                              <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-850 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min((item.macros.protein / 50) * 100, 100)}%` }}></div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-amber-500 font-semibold block">Carbs: {item.macros.carbs}g</span>
                              <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-850 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min((item.macros.carbs / 100) * 100, 100)}%` }}></div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-sky-500 font-semibold block">Fat: {item.macros.fat}g</span>
                              <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-850 rounded-full overflow-hidden">
                                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${Math.min((item.macros.fat / 40) * 100, 100)}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pricing & Order Actions */}
                        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-dark-border/40 flex justify-between items-center">
                          <span className="text-sm font-black text-neutral-850 dark:text-white">${item.price.toFixed(2)}</span>
                          <div className="flex space-x-1.5">
                            {/* Customizer */}
                            <button
                              onClick={() => setSelectedCustomizeItem(item)}
                              className="px-2.5 py-1.5 rounded-xl border border-brand-500/20 text-brand-500 hover:bg-brand-500/5 text-[10px] font-extrabold flex items-center space-x-1 transition-all"
                            >
                              <Sparkles size={11} />
                              <span>AI Tweak</span>
                            </button>
                            {/* Standard Add */}
                            <button
                              onClick={() => addToCart(item, 1)}
                              className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-extrabold flex items-center space-x-1 shadow-md shadow-brand-500/10 hover:scale-[1.02] transition-all"
                            >
                              <Plus size={12} />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

        </div>

        {/* Right Column (Insights & Reviews) */}
        <div className="space-y-6">
          
          {/* AI Sentiment Analysis Box */}
          <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-[2rem] shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-500 animate-float">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-display font-black text-sm text-neutral-850 dark:text-white leading-none">AI Reviews Index</h3>
                <span className="text-[9px] text-neutral-400 font-semibold block mt-0.5">GEMINI NLP AUDITOR</span>
              </div>
            </div>

            {loadingAnalysis ? (
              <div className="py-8 text-center space-y-2">
                <span className="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin inline-block"></span>
                <p className="text-[10px] text-neutral-400 font-medium">Extracting sentiments...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-4 animate-fade-in">
                
                {/* Score badge */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 dark:bg-dark-bg/60 border border-neutral-100 dark:border-dark-border/40">
                  <div className="flex items-center space-x-2.5">
                    <TrendingUp size={16} className="text-emerald-500" />
                    <div>
                      <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider leading-none">Satisfaction index</span>
                      <span className="text-xs font-black text-neutral-850 dark:text-white mt-1 block">Good Balance</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-display font-extrabold text-lg text-emerald-500">{aiAnalysis.sentimentScore}%</span>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-neutral-500 dark:text-neutral-450 leading-relaxed italic border-l-2 border-brand-500 pl-3 text-left">
                  "{aiAnalysis.summary}"
                </p>

                {/* Pros/Cons */}
                <div className="space-y-2.5 pt-3 border-t border-neutral-150 dark:border-dark-border/40 text-[10px]">
                  <div className="flex items-start space-x-2">
                    <ThumbsUp size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-neutral-700 dark:text-neutral-200 block uppercase tracking-wider text-[9px] font-bold">What users love:</strong>
                      <span className="text-neutral-450 leading-tight block mt-0.5">
                        {aiAnalysis.positives.join(', ') || 'Fresh food.'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <ThumbsDown size={12} className="text-rose-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-neutral-700 dark:text-neutral-200 block uppercase tracking-wider text-[9px] font-bold">Complaints:</strong>
                      <span className="text-neutral-450 leading-tight block mt-0.5">
                        {aiAnalysis.negatives.join(', ') || 'None reported.'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <p className="text-xs text-neutral-400 py-4 text-center">No reviews submitted yet to analyze.</p>
            )}
          </div>

          {/* Customer Reviews Section (Swiggy / Zomato style) */}
          <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-[2rem] shadow-sm space-y-4">
            <h3 className="font-display font-extrabold text-neutral-850 dark:text-white text-sm flex items-center space-x-1.5">
              <MessageSquare size={16} className="text-neutral-450 animate-float" />
              <span>Customer Reviews ({reviews.length})</span>
            </h3>

            {/* Review submission box */}
            {user ? (
              <form onSubmit={handleSubmitReview} className="p-3.5 bg-neutral-50 dark:bg-dark-bg/60 border border-neutral-100 dark:border-dark-border/40 rounded-2xl space-y-3">
                <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block leading-none">Rate your order</span>
                
                <div className="flex items-center justify-between">
                  {/* Stars select */}
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setRating(val)}
                        className="text-amber-500 focus:outline-none"
                      >
                        <Star size={14} className={val <= rating ? 'fill-amber-500' : 'stroke-[1.5]'} />
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase">{rating} Stars</span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you liked..."
                    className="w-full text-xs rounded-xl border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-dark-surface text-neutral-805 dark:text-neutral-200 pl-3 pr-8 py-2.5 outline-none focus:border-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview || !comment.trim()}
                    className="absolute right-2 top-2 p-1 text-brand-500 hover:text-brand-600 disabled:opacity-50"
                  >
                    <Send size={12} />
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-neutral-50 dark:bg-dark-bg/30 text-center rounded-2xl text-[10px] text-neutral-400 font-bold">
                Please login to write review feedback.
              </div>
            )}

            {/* Interactive Stars Filter */}
            <div className="flex space-x-1.5 overflow-x-auto pb-1 border-b border-neutral-100 dark:border-dark-border/40">
              <button
                onClick={() => setReviewsFilterRating('all')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold flex-shrink-0 transition-colors uppercase tracking-wider ${
                  reviewsFilterRating === 'all'
                    ? 'bg-neutral-800 dark:bg-white text-white dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-dark-bg text-neutral-500 hover:bg-neutral-200'
                }`}
              >
                All ratings
              </button>
              {[5, 4, 3, 2, 1].map((num) => (
                <button
                  key={num}
                  onClick={() => setReviewsFilterRating(num)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-extrabold flex-shrink-0 transition-colors flex items-center space-x-1 ${
                    reviewsFilterRating === num
                      ? 'bg-neutral-800 dark:bg-white text-white dark:text-neutral-900'
                      : 'bg-neutral-100 dark:bg-dark-bg text-neutral-550 hover:bg-neutral-200'
                  }`}
                >
                  <span>{num}</span>
                  <Star size={8} className="fill-amber-500 stroke-amber-500" />
                </button>
              ))}
            </div>

            {/* Feedback entries list */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
              {filteredReviews.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-6">No reviews fit this filter description.</p>
              ) : (
                filteredReviews.map((rev) => {
                  const helpfulVotes = reviewHelpfulVotes[rev.id] || 0;
                  const hasVoted = votedReviews.includes(rev.id);
                  return (
                    <div key={rev.id} className="border-b border-neutral-100 dark:border-dark-border/40 pb-3.5 last:border-none animate-fade-in text-left space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200">{rev.user_name}</span>
                        <div className="flex items-center space-x-0.5 text-amber-500">
                          <Star size={10} className="fill-amber-500" />
                          <span className="text-[10px] font-extrabold">{rev.rating}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        {rev.comment}
                      </p>
                      
                      {/* Interactive Helpfulness Upvotes */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[8px] text-neutral-400">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                        
                        <button
                          onClick={() => handleUpvoteReview(rev.id)}
                          className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-lg border text-[8px] font-bold transition-all ${
                            hasVoted
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-450'
                              : 'bg-neutral-50 dark:bg-dark-bg border-neutral-200/50 dark:border-neutral-800 text-neutral-400 dark:text-neutral-350 hover:bg-neutral-100'
                          }`}
                        >
                          <ThumbsUp size={8} />
                          <span>Helpful ({helpfulVotes})</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* AI Chef Customizer Modal */}
      <CustomizerModal
        isOpen={selectedCustomizeItem !== null}
        menuItem={selectedCustomizeItem}
        onClose={() => setSelectedCustomizeItem(null)}
        onConfirm={handleCustomizerConfirm}
      />

    </div>
  );
};
