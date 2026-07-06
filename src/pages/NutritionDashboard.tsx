import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../services/supabase';
import { MenuItem } from '../types/database';
import { getAIHealthInsights, HealthInsight, IntakeLog } from '../services/gemini';
import { 
  Flame, 
  Activity, 
  TrendingUp, 
  Sparkles, 
  Plus, 
  Trash2, 
  Scale, 
  Heart, 
  PlusCircle, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Utensils,
  Calendar,
  DollarSign,
  ArrowLeftRight,
  Percent,
  ShoppingCart,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend
} from 'recharts';

export const NutritionDashboard: React.FC = () => {
  const { user, updatePreferences } = useAuth();
  const { addToCart } = useCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [logs, setLogs] = useState<IntakeLog[]>([]);
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);
  
  // Tab and planning states
  const [activeTab, setActiveTab] = useState<'analytics' | 'weekly-planner' | 'budget-planner' | 'swaps-hub' | 'smart-offers'>('analytics');
  const [dietPref, setDietPref] = useState<string>(() => user?.preferences?.diet || 'balanced');
  const [calTarget, setCalTarget] = useState<number>(() => user?.preferences?.targetCalories || 2000);
  const [protTarget, setProtTarget] = useState<number>(80);
  const [weeklyPlan, setWeeklyPlan] = useState<any[] | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState<boolean>(false);
  const [budgetVal, setBudgetVal] = useState<number>(30);
  const [budgetGoal, setBudgetGoal] = useState<'protein' | 'calories' | 'balanced'>('balanced');
  const [budgetResult, setBudgetResult] = useState<MenuItem[] | null>(null);

  // BMI states
  const [height, setHeight] = useState<number>(() => {
    const v = localStorage.getItem('nn_bmi_height');
    return v ? parseFloat(v) : 175;
  });
  const [weight, setWeight] = useState<number>(() => {
    const v = localStorage.getItem('nn_bmi_weight');
    return v ? parseFloat(v) : 70;
  });

  // Simulator modal/controls
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [customFoodName, setCustomFoodName] = useState<string>('');
  const [customCalories, setCustomCalories] = useState<number>(350);
  const [customProtein, setCustomProtein] = useState<number>(20);
  const [customCarbs, setCustomCarbs] = useState<number>(40);
  const [customFat, setCustomFat] = useState<number>(10);
  const [customSugar, setCustomSugar] = useState<number>(8);
  const [customFiber, setCustomFiber] = useState<number>(4);
  const [customSodium, setCustomSodium] = useState<number>(450);

  // Load menu items
  useEffect(() => {
    const fetchMenu = async () => {
      const { data } = await supabase.from('menu_items').select('*');
      if (data) setMenuItems(data as MenuItem[]);
    };
    fetchMenu();
  }, []);

  // Initialize and load logs from localStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('nn_intake_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    } else {
      // Seed default logs for today to give a rich starting experience
      const today = new Date().toISOString().split('T')[0];
      const defaultLogs: IntakeLog[] = [
        {
          id: 'log-1',
          name: 'Superfood Acai Energy Bowl',
          calories: 340,
          protein: 7,
          carbs: 58,
          fat: 12,
          sugar: 28,
          fiber: 9,
          sodium: 45,
          mealType: 'breakfast',
          date: today
        },
        {
          id: 'log-2',
          name: 'Clean High-Protein Butter Chicken',
          calories: 510,
          protein: 46,
          carbs: 14,
          fat: 28,
          sugar: 6,
          fiber: 3,
          sodium: 780,
          mealType: 'lunch',
          date: today
        }
      ];
      setLogs(defaultLogs);
      localStorage.setItem('nn_intake_logs', JSON.stringify(defaultLogs));
    }
  }, []);

  // Persist BMI inputs
  useEffect(() => {
    localStorage.setItem('nn_bmi_height', height.toString());
    localStorage.setItem('nn_bmi_weight', weight.toString());
  }, [height, weight]);

  // Save logs and refresh AI Insights
  const saveLogs = (newLogs: IntakeLog[]) => {
    setLogs(newLogs);
    localStorage.setItem('nn_intake_logs', JSON.stringify(newLogs));
  };

  // Run AI Insights
  const fetchAIInsights = async () => {
    if (!user) return;
    setLoadingInsights(true);
    try {
      const results = await getAIHealthInsights(logs, user.preferences, menuItems);
      setInsights(results);
    } catch (e) {
      console.error('Failed to load AI health insights:', e);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (menuItems.length > 0) {
      fetchAIInsights();
    }
  }, [logs, menuItems, user]);

  // Target metrics based on user preferences
  const targetCalories = user?.preferences?.targetCalories || 2000;
  const targetProtein = user?.preferences?.diet === 'low-carb' ? 120 : 80; // grams
  const targetCarbs = user?.preferences?.diet === 'low-carb' ? 50 : 250; // grams
  const targetFat = user?.preferences?.diet === 'low-carb' ? 90 : 65; // grams
  const limitSugar = 50; // grams max
  const limitFiber = 25; // grams min target
  const limitSodium = 2300; // mg max

  // Calculate totals for today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.date === todayStr);

  const totalCalories = todayLogs.reduce((sum, l) => sum + l.calories, 0);
  const totalProtein = todayLogs.reduce((sum, l) => sum + l.protein, 0);
  const totalCarbs = todayLogs.reduce((sum, l) => sum + l.carbs, 0);
  const totalFat = todayLogs.reduce((sum, l) => sum + l.fat, 0);
  const totalSugar = todayLogs.reduce((sum, l) => sum + l.sugar, 0);
  const totalFiber = todayLogs.reduce((sum, l) => sum + l.fiber, 0);
  const totalSodium = todayLogs.reduce((sum, l) => sum + l.sodium, 0);

  // BMI calculations
  const heightM = height / 100;
  const bmi = heightM > 0 ? parseFloat((weight / (heightM * heightM)).toFixed(1)) : 0;
  
  let bmiCategory = 'Normal';
  let bmiColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  if (bmi < 18.5) {
    bmiCategory = 'Underweight';
    bmiColor = 'text-sky-500 bg-sky-500/10 border-sky-500/20';
  } else if (bmi >= 25 && bmi < 30) {
    bmiCategory = 'Overweight';
    bmiColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  } else if (bmi >= 30) {
    bmiCategory = 'Obese';
    bmiColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  }

  // Health Score Calculation (0 to 100)
  const calculateHealthScore = () => {
    let score = 100;
    
    // Calorie check (deviation from target)
    const calDiff = Math.abs(totalCalories - targetCalories);
    if (calDiff > 200) {
      score -= Math.min(25, Math.floor((calDiff - 200) / 15));
    }

    // Protein check (reward hitting target or close)
    if (totalProtein < targetProtein) {
      score -= Math.min(20, Math.floor(((targetProtein - totalProtein) / targetProtein) * 20));
    }

    // Sugar check (penalty for exceeding limits)
    if (totalSugar > limitSugar) {
      score -= Math.min(15, Math.floor((totalSugar - limitSugar) * 0.5));
    }

    // Sodium check
    if (totalSodium > limitSodium) {
      score -= Math.min(15, Math.floor((totalSodium - limitSodium) * 0.02));
    }

    // Fiber check
    if (totalFiber < limitFiber) {
      score -= Math.min(10, Math.floor(((limitFiber - totalFiber) / limitFiber) * 10));
    }

    // Adjust for empty log
    if (todayLogs.length === 0) return 0;

    return Math.max(10, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();

  // Weekly Diet Planner generator logic
  const generateWeeklyPlan = () => {
    setGeneratingPlan(true);
    setTimeout(() => {
      const filtered = menuItems.filter(item => {
        const name = item.name.toLowerCase();
        const desc = item.description.toLowerCase();
        
        if (dietPref === 'vegan') {
          return !name.includes('chicken') && !name.includes('steak') && !name.includes('beef') && 
                 !name.includes('salmon') && !name.includes('shrimp') && !name.includes('lamb') && 
                 !name.includes('pork') && !name.includes('dairy') && !name.includes('bacon') &&
                 !desc.includes('chicken') && !desc.includes('beef') && !desc.includes('shrimp') &&
                 !desc.includes('bacon');
        }
        if (dietPref === 'keto' || dietPref === 'low-carb') {
          return item.macros.carbs <= 25 || name.includes('keto') || desc.includes('keto') || name.includes('low-carb');
        }
        return true;
      });

      const pool = filtered.length > 3 ? filtered : menuItems;
      const breakfasts = pool.filter(item => item.category === 'breakfast' || item.name.toLowerCase().includes('bowl') || item.name.toLowerCase().includes('smoothie') || item.name.toLowerCase().includes('toast'));
      const mainPool = pool.filter(item => item.category !== 'breakfast' && !item.name.toLowerCase().includes('smoothie'));
      
      const breakfastList = breakfasts.length > 0 ? breakfasts : pool;
      const mainList = mainPool.length > 0 ? mainPool : pool;

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const plan = days.map((day, index) => {
        const breakfast = breakfastList[(index) % breakfastList.length];
        const lunch = mainList[(index + 1) % mainList.length];
        const dinner = mainList[(index + 2) % mainList.length];

        const calories = breakfast.macros.calories + lunch.macros.calories + dinner.macros.calories;
        const protein = breakfast.macros.protein + lunch.macros.protein + dinner.macros.protein;
        const carbs = breakfast.macros.carbs + lunch.macros.carbs + dinner.macros.carbs;
        const fat = breakfast.macros.fat + lunch.macros.fat + dinner.macros.fat;
        const price = breakfast.price + lunch.price + dinner.price;

        return {
          day,
          meals: {
            breakfast,
            lunch,
            dinner
          },
          totals: {
            calories,
            protein,
            carbs,
            fat,
            price
          }
        };
      });

      setWeeklyPlan(plan);
      setGeneratingPlan(false);
    }, 1000);
  };

  // Budget Planner logic
  const calculateBudgetPlan = () => {
    if (menuItems.length === 0) return;
    
    let bestCombo: MenuItem[] = [];
    let bestScore = -1;

    for (let i = 0; i < menuItems.length; i++) {
      const item1 = menuItems[i];
      if (item1.price > budgetVal) continue;
      
      let score1 = 0;
      if (budgetGoal === 'protein') score1 = item1.macros.protein;
      else if (budgetGoal === 'calories') score1 = 1000 - item1.macros.calories;
      else score1 = item1.macros.protein * 2 - (item1.macros.carbs * 0.5);

      if (score1 > bestScore) {
        bestScore = score1;
        bestCombo = [item1];
      }

      for (let j = i + 1; j < menuItems.length; j++) {
        const item2 = menuItems[j];
        const totalPrice = item1.price + item2.price;
        if (totalPrice > budgetVal) continue;

        const totalProtein = item1.macros.protein + item2.macros.protein;
        const totalCalories = item1.macros.calories + item2.macros.calories;
        const totalCarbs = item1.macros.carbs + item2.macros.carbs;

        let pairScore = 0;
        if (budgetGoal === 'protein') pairScore = totalProtein;
        else if (budgetGoal === 'calories') pairScore = 1500 - totalCalories;
        else pairScore = totalProtein * 2 - (totalCarbs * 0.5);

        if (item1.category !== item2.category) {
          pairScore += 15; // variety bonus
        }

        if (pairScore > bestScore) {
          bestScore = pairScore;
          bestCombo = [item1, item2];
        }
      }
    }

    setBudgetResult(bestCombo.length > 0 ? bestCombo : null);
  };

  useEffect(() => {
    if (menuItems.length > 0) {
      calculateBudgetPlan();
    }
  }, [budgetVal, budgetGoal, menuItems]);

  // Add standard menu item to logs
  const logMenuItem = (item: MenuItem) => {
    const newLog: IntakeLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      name: item.name,
      calories: item.macros.calories,
      protein: item.macros.protein,
      carbs: item.macros.carbs,
      fat: item.macros.fat,
      sugar: Math.round(item.macros.carbs * 0.2), // estimate sugar
      fiber: Math.round(item.macros.carbs * 0.15), // estimate fiber
      sodium: item.macros.calories > 500 ? 850 : 380, // estimate sodium
      mealType: selectedMealType,
      date: todayStr
    };
    saveLogs([newLog, ...logs]);
  };

  // Add custom log
  const logCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFoodName.trim()) return;

    const newLog: IntakeLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      name: customFoodName,
      calories: Number(customCalories),
      protein: Number(customProtein),
      carbs: Number(customCarbs),
      fat: Number(customFat),
      sugar: Number(customSugar),
      fiber: Number(customFiber),
      sodium: Number(customSodium),
      mealType: selectedMealType,
      date: todayStr
    };
    
    saveLogs([newLog, ...logs]);
    setCustomFoodName('');
  };

  // Remove a log entry
  const removeLog = (id: string) => {
    saveLogs(logs.filter(l => l.id !== id));
  };

  // Mock progress data for Charts (Weekly / Monthly)
  const weeklyData = [
    { name: 'Mon', Calories: 1850, Protein: 75, Carbs: 220, Fat: 62 },
    { name: 'Tue', Calories: 2100, Protein: 95, Carbs: 180, Fat: 70 },
    { name: 'Wed', Calories: 1720, Protein: 82, Carbs: 190, Fat: 58 },
    { name: 'Thu', Calories: 1980, Protein: 68, Carbs: 240, Fat: 65 },
    { name: 'Fri', Calories: 2250, Protein: 110, Carbs: 160, Fat: 82 },
    { name: 'Sat', Calories: totalCalories > 0 ? totalCalories : 2050, Protein: totalProtein > 0 ? totalProtein : 88, Carbs: totalCarbs > 0 ? totalCarbs : 210, Fat: totalFat > 0 ? totalFat : 74 },
    { name: 'Sun', Calories: 1900, Protein: 80, Carbs: 200, Fat: 60 },
  ];

  const monthlyData = [
    { name: 'Week 1', AvgCalories: 1940, AvgHealthScore: 84 },
    { name: 'Week 2', AvgCalories: 2050, AvgHealthScore: 78 },
    { name: 'Week 3', AvgCalories: 1890, AvgHealthScore: 89 },
    { name: 'Week 4', AvgCalories: totalCalories > 0 ? Math.round((1910 * 6 + totalCalories) / 7) : 1920, AvgHealthScore: totalCalories > 0 ? Math.round((85 * 6 + healthScore) / 7) : 86 },
  ];

  const dailyMealBreakdown = [
    { name: 'Breakfast', Calories: todayLogs.filter(l => l.mealType === 'breakfast').reduce((s, l) => s + l.calories, 0) },
    { name: 'Lunch', Calories: todayLogs.filter(l => l.mealType === 'lunch').reduce((s, l) => s + l.calories, 0) },
    { name: 'Dinner', Calories: todayLogs.filter(l => l.mealType === 'dinner').reduce((s, l) => s + l.calories, 0) },
    { name: 'Snacks', Calories: todayLogs.filter(l => l.mealType === 'snack').reduce((s, l) => s + l.calories, 0) },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 dark:text-white">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/50 dark:border-dark-border/40 pb-5">
        <div>
          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-brand-500/10 text-brand-500 dark:text-brand-400 rounded-full text-xs font-semibold tracking-wide">
            <Sparkles size={12} className="animate-pulse" />
            <span>NourishNow AI Nutritionist</span>
          </span>
          <h1 className="font-display font-black text-3xl md:text-4xl text-neutral-800 dark:text-white tracking-tight mt-2">
            AI Nutrition <span className="text-brand-500">Dashboard</span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Real-time biometric analytics, intake simulation, and Gemini-optimized health insights.
          </p>
        </div>

        {/* BMI Card Quick Calculator */}
        <div className="bg-white/80 dark:bg-dark-surface/80 border border-neutral-200/40 dark:border-dark-border backdrop-blur-md p-4 rounded-2xl flex items-center space-x-4 shadow-sm">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <Scale size={24} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-neutral-400 font-medium">Height (cm)</span>
              <input 
                type="number" 
                value={height}
                onChange={(e) => setHeight(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-14 bg-neutral-100 dark:bg-dark-bg border-none rounded p-0.5 text-center text-xs font-bold text-neutral-700 dark:text-neutral-200 focus:ring-1 focus:ring-brand-500" 
              />
              <span className="text-xs text-neutral-400 font-medium">Weight (kg)</span>
              <input 
                type="number" 
                value={weight}
                onChange={(e) => setWeight(Math.max(1, parseFloat(e.target.value) || 0))}
                className="w-14 bg-neutral-100 dark:bg-dark-bg border-none rounded p-0.5 text-center text-xs font-bold text-neutral-700 dark:text-neutral-200 focus:ring-1 focus:ring-brand-500" 
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-neutral-600 dark:text-neutral-350">
                BMI: <strong className="text-sm text-neutral-850 dark:text-white">{bmi}</strong>
              </p>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${bmiColor}`}>
                {bmiCategory}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-neutral-100 dark:bg-dark-surface/60 border border-neutral-200/40 dark:border-dark-border/40 backdrop-blur-md rounded-2xl">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'analytics'
              ? 'bg-white dark:bg-dark-bg text-brand-500 shadow-sm border border-neutral-200/20'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-dark-surface'
          }`}
        >
          <Activity size={15} />
          <span>Biometric & Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('weekly-planner')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'weekly-planner'
              ? 'bg-white dark:bg-dark-bg text-brand-500 shadow-sm border border-neutral-200/20'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-dark-surface'
          }`}
        >
          <Calendar size={15} />
          <span>Weekly Diet Planner</span>
        </button>
        <button
          onClick={() => setActiveTab('budget-planner')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'budget-planner'
              ? 'bg-white dark:bg-dark-bg text-brand-500 shadow-sm border border-neutral-200/20'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-dark-surface'
          }`}
        >
          <DollarSign size={15} />
          <span>Budget Planner</span>
        </button>
        <button
          onClick={() => setActiveTab('swaps-hub')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'swaps-hub'
              ? 'bg-white dark:bg-dark-bg text-brand-500 shadow-sm border border-neutral-200/20'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-dark-surface'
          }`}
        >
          <ArrowLeftRight size={15} />
          <span>Healthy Swaps</span>
        </button>
        <button
          onClick={() => setActiveTab('smart-offers')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'smart-offers'
              ? 'bg-white dark:bg-dark-bg text-brand-500 shadow-sm border border-neutral-200/20'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-dark-surface'
          }`}
        >
          <Percent size={15} />
          <span>Smart Offers</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in">
          {/* Main Grid: Metrics Summary & Health Score */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Radial Health Score Gauge */}
            <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full filter blur-xl group-hover:bg-brand-500/10 transition-colors"></div>
              
              <h3 className="font-display font-bold text-xs text-neutral-400 uppercase tracking-widest self-start mb-4">Health Score</h3>
              
              <div className="relative flex items-center justify-center w-36 h-36">
                {/* SVG circle track */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    className="stroke-neutral-100 dark:stroke-neutral-800 fill-none"
                    strokeWidth="8"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    className={`fill-none transition-all duration-700 ease-out ${
                      healthScore >= 80 ? 'stroke-emerald-500' : healthScore >= 60 ? 'stroke-amber-500' : 'stroke-rose-500'
                    }`}
                    strokeWidth="10"
                    strokeDasharray={402}
                    strokeDashoffset={402 - (402 * healthScore) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-neutral-855 dark:text-white leading-none">{healthScore}</span>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-extrabold mt-1">out of 100</span>
                </div>
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-5 leading-normal">
                {healthScore >= 80 
                  ? 'Excellent nutritional alignment! Hitting macros with clean parameters.' 
                  : healthScore >= 60 
                    ? 'Moderate health score. Watch sodium intake and balance your carbs.' 
                    : todayLogs.length === 0 
                      ? 'No meals logged yet today. Use the simulator below to log food!' 
                      : 'Requires optimization. Check the AI Health Insights below for smart swaps.'}
              </p>
            </div>

            {/* Primary Macros: Cal, Pro, Carb, Fat */}
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Calorie Card */}
              <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-extrabold block">Calories</span>
                    <strong className="text-2xl font-black text-neutral-855 dark:text-white block mt-1">
                      {totalCalories} <span className="text-xs text-neutral-400 font-normal">/ {targetCalories} kcal</span>
                    </strong>
                  </div>
                  <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl">
                    <Flame size={20} />
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (totalCalories / targetCalories) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-2 text-right">
                    {Math.round((totalCalories / targetCalories) * 100)}% of goal
                  </span>
                </div>
              </div>

              {/* Protein Card */}
              <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-extrabold block">Protein</span>
                    <strong className="text-2xl font-black text-neutral-855 dark:text-white block mt-1">
                      {totalProtein}g <span className="text-xs text-neutral-400 font-normal">/ {targetProtein}g</span>
                    </strong>
                  </div>
                  <div className="p-2.5 bg-brand-500/10 text-brand-500 dark:text-brand-400 rounded-xl">
                    <Heart size={20} />
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-500 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (totalProtein / targetProtein) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-2 text-right">
                    {Math.round((totalProtein / targetProtein) * 100)}% of goal
                  </span>
                </div>
              </div>

              {/* Carb/Fat Double Tracker Card */}
              <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-extrabold block">Energy Balance</span>
                    <span className="text-xs text-neutral-500 block mt-0.5">Carbs & Fat Balance</span>
                  </div>
                  <div className="p-2.5 bg-sky-500/10 text-sky-500 rounded-xl">
                    <Activity size={20} />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Carbs */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-neutral-500">Carbs</span>
                      <span className="text-neutral-855 dark:text-white">{totalCarbs}g / {targetCarbs}g</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (totalCarbs / targetCarbs) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Fat */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-neutral-500">Fat</span>
                      <span className="text-neutral-855 dark:text-white">{totalFat}g / {targetFat}g</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sky-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (totalFat / targetFat) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Secondary Micronutrients Tracker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Sugar Card */}
            <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-extrabold block">Sugar Limit</span>
                <strong className="text-xl font-bold text-neutral-855 dark:text-white block mt-1">{totalSugar}g / {limitSugar}g</strong>
                <span className="text-[10px] text-neutral-400 block mt-1">Recommended: &lt;50g/day</span>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-neutral-100 dark:border-neutral-800 flex items-center justify-center font-bold text-xs text-neutral-700 dark:text-neutral-200">
                {Math.round((totalSugar / limitSugar) * 100)}%
              </div>
            </div>

            {/* Fiber Card */}
            <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-extrabold block">Fiber Intake</span>
                <strong className="text-xl font-bold text-neutral-855 dark:text-white block mt-1">{totalFiber}g / {limitFiber}g</strong>
                <span className="text-[10px] text-neutral-400 block mt-1">Recommended: &gt;25g/day</span>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-neutral-100 dark:border-neutral-800 flex items-center justify-center font-bold text-xs text-brand-500">
                {Math.round((totalFiber / limitFiber) * 100)}%
              </div>
            </div>

            {/* Sodium Card */}
            <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-extrabold block">Sodium Alert</span>
                <strong className="text-xl font-bold text-neutral-855 dark:text-white block mt-1">{totalSodium}mg / {limitSodium}mg</strong>
                <span className="text-[10px] text-neutral-400 block mt-1">Recommended: &lt;2,300mg</span>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-neutral-100 dark:border-neutral-800 flex items-center justify-center font-bold text-xs text-amber-500">
                {Math.round((totalSodium / limitSodium) * 100)}%
              </div>
            </div>

          </div>

          {/* Progress Charts & Simulation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Columns: Charts */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Weekly / Monthly chart tab */}
              <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-3xl shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-display font-black text-lg text-neutral-855 dark:text-white">Nutrition Timelines</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">Track your long-term calorie and protein targets.</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => {
                        // Create CSV from logged foods
                        const headers = ['Date', 'Meal Type', 'Name', 'Calories (kcal)', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Sugar (g)', 'Sodium (mg)'];
                        const rows = logs.map(l => [
                          l.date,
                          l.mealType,
                          `"${l.name.replace(/"/g, '""')}"`,
                          l.calories,
                          l.protein,
                          l.carbs,
                          l.fat,
                          l.sugar || 0,
                          l.sodium || 0
                        ]);
                        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `nourishnow_nutrition_report_${new Date().toISOString().split('T')[0]}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <TrendingUp size={12} />
                      <span>Export Report</span>
                    </button>
                    <div className="flex space-x-1.5 p-1 bg-neutral-100 dark:bg-dark-bg rounded-xl border border-neutral-200/20">
                      <span className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-dark-surface shadow-xs rounded-lg text-brand-500 cursor-pointer">Weekly Progress</span>
                      <span className="px-3 py-1.5 text-xs font-bold text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer">Monthly Progress</span>
                    </div>
                  </div>
                </div>

                {/* Weekly chart (Calories & Macros area chart) */}
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPro" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                          borderRadius: '16px', 
                          borderColor: 'rgba(226, 232, 240, 0.5)',
                          fontSize: '12px' 
                        }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '600' }} />
                      <Area type="monotone" dataKey="Calories" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCal)" />
                      <Area type="monotone" dataKey="Protein" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPro)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Daily intake breakdown chart */}
              <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-3xl shadow-sm">
                <h3 className="font-display font-black text-lg text-neutral-855 dark:text-white mb-4">Meal Calorie Distribution</h3>
                
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyMealBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                          borderRadius: '16px', 
                          fontSize: '12px' 
                        }}
                      />
                      <Bar dataKey="Calories" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={50}>
                        {dailyMealBreakdown.map((entry, index) => {
                          const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Right Column: AI Health Insights */}
            <div className="space-y-8">
              
              <div className="bg-gradient-to-b from-neutral-900 to-neutral-800 dark:from-dark-surface dark:to-dark-surface/90 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full filter blur-2xl"></div>
                
                <div className="flex items-center space-x-2">
                  <Sparkles className="text-brand-400 stroke-[2] animate-bounce" size={20} />
                  <h3 className="font-display font-black text-lg">AI Health Insights</h3>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 leading-normal">
                  Gemini real-time diagnostic engine scanning your logs for optimization opportunities.
                </p>

                <div className="mt-6 space-y-4">
                  {loadingInsights ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-2">
                      <span className="w-8 h-8 rounded-full border-4 border-brand-400 border-t-transparent animate-spin"></span>
                      <span className="text-[10px] text-neutral-400">Gemini optimizing insights...</span>
                    </div>
                  ) : insights.length === 0 ? (
                    <div className="py-8 text-center text-neutral-400">
                      <p className="text-xs">No active insights generated yet.</p>
                      <span className="text-[10px]">Log your breakfast or lunch to trigger AI optimization suggestions.</span>
                    </div>
                  ) : (
                    insights.map((ins, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col space-y-2.5 animate-fade-in"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            {ins.type === 'swap' && <Utensils className="text-indigo-400" size={16} />}
                            {ins.type === 'warning' && <AlertTriangle className="text-rose-400" size={16} />}
                            {ins.type === 'kudos' && <CheckCircle2 className="text-emerald-400" size={16} />}
                            {ins.type === 'suggestion' && <Sparkles className="text-brand-400" size={16} />}
                            <strong className="text-xs font-bold text-white">{ins.title}</strong>
                          </div>
                          <span className="text-[9px] bg-brand-500/20 text-brand-300 font-bold px-1.5 py-0.5 rounded">
                            Impact +{ins.impactScore}
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-300 leading-normal">{ins.description}</p>

                        {ins.type === 'swap' && ins.originalFood && ins.replacementFood && (
                          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-neutral-350 font-semibold">
                            <span>Swap <strong className="text-rose-300 font-bold">{ins.originalFood}</strong></span>
                            <ChevronRight size={10} className="text-neutral-500" />
                            <span>Use <strong className="text-emerald-400 font-bold">{ins.replacementFood}</strong></span>
                          </div>
                        )}

                        {ins.type === 'swap' && (ins.calorieDiff || ins.proteinDiff) && (
                          <div className="flex space-x-2 mt-1">
                            {ins.calorieDiff && (
                              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 text-[9px] font-bold">
                                Save {Math.abs(ins.calorieDiff)} kcal
                              </span>
                            )}
                            {ins.proteinDiff && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[9px] font-bold">
                                Increase Protein by {ins.proteinDiff}g
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Intake Log lists */}
              <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-3xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-display font-black text-lg text-neutral-855 dark:text-white">Logged Intake</h3>
                  <span className="text-[10px] bg-neutral-100 dark:bg-dark-bg text-neutral-500 font-bold px-2 py-0.5 rounded-full">
                    Today
                  </span>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar">
                  {todayLogs.length === 0 ? (
                    <div className="py-12 text-center text-neutral-400">
                      <p className="text-xs">No food logged today.</p>
                      <span className="text-[10px]">Use the simulator below to log.</span>
                    </div>
                  ) : (
                    todayLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className="flex justify-between items-center p-3 bg-neutral-50 dark:bg-dark-bg/60 border border-neutral-150/40 dark:border-dark-border/40 rounded-2xl animate-fade-in"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-neutral-855 dark:text-white truncate">{log.name}</p>
                          <div className="flex items-center space-x-2 mt-1 text-[9px] text-neutral-400 capitalize">
                            <span className="font-semibold text-brand-500">{log.mealType}</span>
                            <span>•</span>
                            <span>{log.calories} kcal</span>
                            <span>•</span>
                            <span>{log.protein}g P</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeLog(log.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Simulator: Log Intake Form & Direct Selections */}
          <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-3xl shadow-sm">
            <div className="border-b border-neutral-150/50 dark:border-dark-border/40 pb-4 mb-6">
              <h3 className="font-display font-black text-xl text-neutral-855 dark:text-white flex items-center space-x-2">
                <PlusCircle className="text-brand-500" size={20} />
                <span>Interactive Intake Simulator</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Simulate your diet by logging dishes from NourishNow menu curations or enter a custom meal description to observe live biometric updates.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Quick Select Menu Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Quick Log from NourishNow Menu</h4>
                  <div className="flex space-x-1">
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedMealType(type)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg capitalize transition-all ${
                          selectedMealType === type 
                        ? 'bg-brand-500 text-white shadow-xs' 
                        : 'bg-neutral-100 dark:bg-dark-bg text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                  {menuItems.map(item => (
                    <div 
                      key={item.id} 
                      className="p-3.5 bg-neutral-50 dark:bg-dark-bg/60 border border-neutral-200/30 dark:border-dark-border/40 hover:border-brand-500/40 rounded-2xl flex justify-between items-center transition-all group"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-neutral-855 dark:text-white group-hover:text-brand-500 transition-colors">{item.name}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{item.description}</p>
                        <div className="flex space-x-2 mt-1.5 text-[9px] font-semibold">
                          <span className="text-orange-500 bg-orange-500/5 px-1.5 py-0.5 rounded">{item.macros.calories} kcal</span>
                          <span className="text-brand-500 bg-brand-500/5 px-1.5 py-0.5 rounded">{item.macros.protein}g Pro</span>
                          <span className="text-amber-500 bg-amber-500/5 px-1.5 py-0.5 rounded">{item.macros.carbs}g Carb</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => logMenuItem(item)}
                        className="p-2 bg-white dark:bg-dark-surface hover:bg-brand-500 hover:text-white text-neutral-600 dark:text-neutral-300 rounded-xl border border-neutral-200/50 dark:border-dark-border shadow-xs transition-all active:scale-[0.95]"
                        title={`Log as ${selectedMealType}`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add custom logged item form */}
              <div>
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Add Custom Intake Description</h4>
                
                <form onSubmit={logCustomFood} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Meal / Food Name</label>
                    <input 
                      type="text" 
                      value={customFoodName}
                      onChange={(e) => setCustomFoodName(e.target.value)}
                      placeholder="e.g. Scrambled Eggs with Avocado Toast"
                      className="w-full bg-neutral-50 dark:bg-dark-bg border border-neutral-200/60 dark:border-dark-border/60 rounded-xl px-3 py-2 text-xs text-neutral-855 dark:text-white focus:outline-none focus:border-brand-500" 
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Calories (kcal)</label>
                      <input 
                        type="number" 
                        value={customCalories}
                        onChange={(e) => setCustomCalories(Number(e.target.value))}
                        className="w-full bg-neutral-50 dark:bg-dark-bg border border-neutral-200/60 dark:border-dark-border/60 rounded-xl px-3 py-1.5 text-xs text-neutral-855 dark:text-white" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Protein (g)</label>
                      <input 
                        type="number" 
                        value={customProtein}
                        onChange={(e) => setCustomProtein(Number(e.target.value))}
                        className="w-full bg-neutral-50 dark:bg-dark-bg border border-neutral-200/60 dark:border-dark-border/60 rounded-xl px-3 py-1.5 text-xs text-neutral-855 dark:text-white" 
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Carbs (g)</label>
                      <input 
                        type="number" 
                        value={customCarbs}
                        onChange={(e) => setCustomCarbs(Number(e.target.value))}
                        className="w-full bg-neutral-50 dark:bg-dark-bg border border-neutral-200/60 dark:border-dark-border/60 rounded-xl px-3 py-1.5 text-xs text-neutral-855 dark:text-white" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Fat (g)</label>
                      <input 
                        type="number" 
                        value={customFat}
                        onChange={(e) => setCustomFat(Number(e.target.value))}
                        className="w-full bg-neutral-50 dark:bg-dark-bg border border-neutral-200/60 dark:border-dark-border/60 rounded-xl px-3 py-1.5 text-xs text-neutral-855 dark:text-white" 
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">Sugar (g)</label>
                      <input 
                        type="number" 
                        value={customSugar}
                        onChange={(e) => setCustomSugar(Number(e.target.value))}
                        className="w-full bg-neutral-50 dark:bg-dark-bg border border-neutral-150/40 dark:border-dark-border/40 rounded-lg px-2 py-1 text-xs text-neutral-855 dark:text-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">Fiber (g)</label>
                      <input 
                        type="number" 
                        value={customFiber}
                        onChange={(e) => setCustomFiber(Number(e.target.value))}
                        className="w-full bg-neutral-50 dark:bg-dark-bg border border-neutral-150/40 dark:border-dark-border/40 rounded-lg px-2 py-1 text-xs text-neutral-855 dark:text-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-400 uppercase mb-1">Sodium (mg)</label>
                      <input 
                        type="number" 
                        value={customSodium}
                        onChange={(e) => setCustomSodium(Number(e.target.value))}
                        className="w-full bg-neutral-50 dark:bg-dark-bg border border-neutral-150/40 dark:border-dark-border/40 rounded-lg px-2 py-1 text-xs text-neutral-855 dark:text-white" 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md transition-all duration-200 mt-2 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    Log Custom Meal
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {activeTab === 'weekly-planner' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-3xl shadow-sm">
            <h3 className="font-display font-black text-xl text-neutral-855 dark:text-white flex items-center space-x-2">
              <Calendar className="text-brand-500" size={20} />
              <span>AI Weekly Diet Planner</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Configure your dietary goals and let Gemini construct a balanced 7-day culinary cycle.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Dietary Preference</label>
                <select
                  value={dietPref}
                  onChange={(e) => setDietPref(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-dark-bg border border-neutral-200/60 dark:border-dark-border/60 rounded-xl px-3 py-2 text-xs text-neutral-855 dark:text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="balanced">Balanced / Anything</option>
                  <option value="keto">Keto (Low Carb / High Fat)</option>
                  <option value="vegan">Vegan (Plant Based)</option>
                  <option value="high-protein">High Protein Focus</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Calorie Target (kcal/day)</label>
                <input
                  type="number"
                  value={calTarget}
                  onChange={(e) => setCalTarget(Number(e.target.value))}
                  className="w-full bg-neutral-50 dark:bg-dark-bg border border-neutral-200/60 dark:border-dark-border/60 rounded-xl px-3 py-2 text-xs text-neutral-855 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Min Protein Target (g/day)</label>
                <input
                  type="number"
                  value={protTarget}
                  onChange={(e) => setProtTarget(Number(e.target.value))}
                  className="w-full bg-neutral-50 dark:bg-dark-bg border border-neutral-200/60 dark:border-dark-border/60 rounded-xl px-3 py-2 text-xs text-neutral-855 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={generateWeeklyPlan}
                  disabled={generatingPlan}
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
                >
                  {generatingPlan ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                      <span>Generating Plan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Generate 7-Day Diet Plan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {weeklyPlan ? (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weeklyPlan.map((dayPlan, idx) => (
                <div 
                  key={idx} 
                  className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-4 rounded-2xl shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-brand-500 block mb-2">{dayPlan.day}</span>
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] text-neutral-400 font-extrabold uppercase">Breakfast</span>
                        <p className="text-xs font-bold text-neutral-800 dark:text-white truncate">{dayPlan.meals.breakfast.name}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-400 font-extrabold uppercase">Lunch</span>
                        <p className="text-xs font-bold text-neutral-800 dark:text-white truncate">{dayPlan.meals.lunch.name}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-neutral-400 font-extrabold uppercase">Dinner</span>
                        <p className="text-xs font-bold text-neutral-800 dark:text-white truncate">{dayPlan.meals.dinner.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-dark-border/40">
                    <div className="flex justify-between text-[10px] font-bold mb-1.5">
                      <span className="text-neutral-400">Total Price:</span>
                      <span className="text-neutral-800 dark:text-white">${dayPlan.totals.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-semibold text-neutral-400 mb-3">
                      <span>{dayPlan.totals.calories} kcal</span>
                      <span>•</span>
                      <span>{dayPlan.totals.protein}g P</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        addToCart(dayPlan.meals.breakfast);
                        addToCart(dayPlan.meals.lunch);
                        addToCart(dayPlan.meals.dinner);
                      }}
                      className="w-full py-1.5 bg-neutral-100 dark:bg-dark-bg hover:bg-brand-500 hover:text-white text-neutral-700 dark:text-neutral-300 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center space-x-1"
                    >
                      <ShoppingCart size={10} />
                      <span>Order Day's Plan</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-12 rounded-3xl shadow-sm text-center">
              <Calendar size={48} className="text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
              <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-200">No active weekly diet plan generated.</h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Select your preferences above and click generate to build a Gemini-curated dietary cycle.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'budget-planner' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-3xl shadow-sm">
            <h3 className="font-display font-black text-xl text-neutral-855 dark:text-white flex items-center space-x-2">
              <DollarSign className="text-brand-500" size={20} />
              <span>AI Combinatorial Budget Planner</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Find the mathematically optimal meal combinations from the NourishNow menu matching your maximum target spend limit.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Maximum Daily Spend Target</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={budgetVal}
                    onChange={(e) => setBudgetVal(Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                  <span className="text-sm font-bold text-neutral-800 dark:text-white">${budgetVal}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Macro Optimization Goal</label>
                <select
                  value={budgetGoal}
                  onChange={(e) => setBudgetGoal(e.target.value as any)}
                  className="w-full bg-neutral-50 dark:bg-dark-bg border border-neutral-200/60 dark:border-dark-border/60 rounded-xl px-3 py-2 text-xs text-neutral-855 dark:text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="balanced">Balanced / High Health Score</option>
                  <option value="protein">Maximize Protein Intake</option>
                  <option value="calories">Low Calorie / Lean Energy</option>
                </select>
              </div>

              <div className="flex items-end justify-between p-3.5 bg-brand-500/5 rounded-2xl border border-brand-500/10">
                <div>
                  <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase">Optimal Solution Found</span>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {budgetResult ? `${budgetResult.length} items within limits` : 'No combination matches'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-neutral-400 font-medium">Est. Cost</span>
                  <p className="text-sm font-black text-brand-500">
                    ${budgetResult ? budgetResult.reduce((sum, item) => sum + item.price, 0).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {budgetResult ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {budgetResult.map(item => (
                  <div 
                    key={item.id} 
                    className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] bg-neutral-100 dark:bg-dark-bg px-2 py-0.5 rounded text-neutral-500 font-bold uppercase">
                          {item.category}
                        </span>
                        <span className="text-xs font-bold text-brand-500">${item.price}</span>
                      </div>
                      <h4 className="font-display font-bold text-sm text-neutral-855 dark:text-white mt-3 truncate">{item.name}</h4>
                      <p className="text-xs text-neutral-400 mt-1 leading-normal line-clamp-2">{item.description}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-dark-border/40 flex justify-between items-center">
                      <div className="flex space-x-3 text-[10px] font-semibold text-neutral-500">
                        <span>{item.macros.calories} kcal</span>
                        <span>•</span>
                        <span>{item.macros.protein}g Protein</span>
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        className="px-3 py-1.5 bg-brand-500 text-white rounded-xl text-[10px] font-bold shadow-xs hover:bg-brand-600 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-b from-neutral-900 to-neutral-800 dark:from-dark-surface dark:to-dark-surface/90 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                <div>
                  <h4 className="font-display font-black text-base text-white">Daily Macro Combos</h4>
                  <p className="text-[11px] text-neutral-400 mt-1">Summary of optimal combinatorics solver results.</p>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400">Total Price:</span>
                      <strong className="text-sm font-bold text-brand-400">
                        ${budgetResult.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400">Total Calories:</span>
                      <strong className="text-sm font-bold">
                        {budgetResult.reduce((sum, item) => sum + item.macros.calories, 0)} kcal
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400">Total Protein:</span>
                      <strong className="text-sm font-bold text-emerald-400">
                        {budgetResult.reduce((sum, item) => sum + item.macros.protein, 0)}g
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400">Total Carbs:</span>
                      <strong className="text-sm font-bold">
                        {budgetResult.reduce((sum, item) => sum + item.macros.carbs, 0)}g
                      </strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    budgetResult.forEach(item => addToCart(item));
                  }}
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98] mt-6 flex items-center justify-center space-x-1.5"
                >
                  <ShoppingCart size={13} />
                  <span>Order Combo Now</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-12 rounded-3xl shadow-sm text-center">
              <DollarSign size={48} className="text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
              <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-200">No combinations match your parameters.</h4>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Adjust your maximum spend target slider upwards or try optimizing for a different dietary parameter.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'swaps-hub' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-3xl shadow-sm">
            <h3 className="font-display font-black text-xl text-neutral-855 dark:text-white flex items-center space-x-2">
              <ArrowLeftRight className="text-brand-500" size={20} />
              <span>NourishNow Healthy Swaps Hub</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Swap high-calorie, empty-nutrient dishes with dietitian-approved premium alternatives that maximize your daily health scores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Swap Card 1 */}
            <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-rose-500/10 text-rose-500 font-bold px-2 py-0.5 rounded-md">Original Meal</span>
                <span className="text-[10px] text-neutral-400 font-medium">Fast Food Standard</span>
              </div>
              
              <div className="grid grid-cols-2 gap-6 items-center">
                <div className="border border-rose-200/30 dark:border-rose-900/30 bg-rose-500/5 rounded-2xl p-4 flex flex-col items-center text-center">
                  <strong className="text-xs font-bold text-rose-600 dark:text-rose-400">French Fries Large</strong>
                  <span className="text-[10px] text-neutral-500 mt-1">380 kcal • 4g Protein</span>
                </div>
                <div className="border border-emerald-200/30 dark:border-emerald-950/30 bg-emerald-500/5 rounded-2xl p-4 flex flex-col items-center text-center">
                  <strong className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Sweet Potato Wedges</strong>
                  <span className="text-[10px] text-neutral-500 mt-1">160 kcal • 6g Protein</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-semibold p-3 bg-neutral-50 dark:bg-dark-bg/60 rounded-2xl border border-neutral-100 dark:border-dark-border/40">
                <span className="text-emerald-500 font-bold">Save 220 kcal</span>
                <span>•</span>
                <span className="text-emerald-500 font-bold">Gain 2g Protein</span>
                <span>•</span>
                <span className="text-indigo-500 font-bold">Save $1.20</span>
              </div>

              <button
                onClick={() => {
                  const item = menuItems.find(m => m.name.toLowerCase().includes('potato') || m.name.toLowerCase().includes('wedge')) || menuItems[0];
                  if (item) {
                    addToCart(item);
                    // Log replacement
                    const newLog: IntakeLog = {
                      id: 'log-' + Math.random().toString(36).substring(2, 9),
                      name: 'Sweet Potato Wedges (Healthy Swap)',
                      calories: 160,
                      protein: 6,
                      carbs: 24,
                      fat: 4,
                      sugar: 4,
                      fiber: 5,
                      sodium: 120,
                      mealType: 'snack',
                      date: todayStr
                    };
                    saveLogs([newLog, ...logs]);
                  }
                }}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-1"
              >
                <Check size={12} />
                <span>Log & Add Sweet Potato Wedges</span>
              </button>
            </div>

            {/* Swap Card 2 */}
            <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-rose-500/10 text-rose-500 font-bold px-2 py-0.5 rounded-md">Original Meal</span>
                <span className="text-[10px] text-neutral-400 font-medium">Creamy & Heavy</span>
              </div>
              
              <div className="grid grid-cols-2 gap-6 items-center">
                <div className="border border-rose-200/30 dark:border-rose-900/30 bg-rose-500/5 rounded-2xl p-4 flex flex-col items-center text-center">
                  <strong className="text-xs font-bold text-rose-600 dark:text-rose-400">Regular Butter Chicken</strong>
                  <span className="text-[10px] text-neutral-500 mt-1">790 kcal • 32g Protein</span>
                </div>
                <div className="border border-emerald-200/30 dark:border-emerald-950/30 bg-emerald-500/5 rounded-2xl p-4 flex flex-col items-center text-center">
                  <strong className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Clean Butter Chicken</strong>
                  <span className="text-[10px] text-neutral-500 mt-1">510 kcal • 46g Protein</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-semibold p-3 bg-neutral-50 dark:bg-dark-bg/60 rounded-2xl border border-neutral-100 dark:border-dark-border/40">
                <span className="text-emerald-500 font-bold">Save 280 kcal</span>
                <span>•</span>
                <span className="text-emerald-500 font-bold">Gain 14g Protein</span>
                <span>•</span>
                <span className="text-rose-500 font-bold">Sodium -250mg</span>
              </div>

              <button
                onClick={() => {
                  const item = menuItems.find(m => m.name.toLowerCase().includes('clean') || m.name.toLowerCase().includes('butter chicken')) || menuItems[1];
                  if (item) {
                    addToCart(item);
                    logMenuItem(item);
                  }
                }}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-1"
              >
                <Check size={12} />
                <span>Log & Add Clean Butter Chicken</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'smart-offers' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-3xl shadow-sm">
            <h3 className="font-display font-black text-xl text-neutral-855 dark:text-white flex items-center space-x-2">
              <Percent className="text-brand-500" size={20} />
              <span>Smart Offers & Coupon Engine</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Contextual discounts triggered dynamically by your real-time daily nutritional metrics and goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Coupon 1 */}
            <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/5 rounded-full filter blur-md"></div>
              <div>
                <span className="text-[10px] bg-brand-500/10 text-brand-500 font-bold px-2 py-0.5 rounded-md">Protein Booster</span>
                <h4 className="font-display font-bold text-base text-neutral-800 dark:text-white mt-4">20% Off Butter Chicken</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-normal">
                  Triggered because your protein intake is currently less than 80g today. Fill the gap with our highest-protein meal.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-dark-border/40 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-neutral-400 block font-bold uppercase">Promo Code</span>
                  <strong className="text-xs font-black text-brand-500">PROTEIN20</strong>
                </div>
                <button
                  onClick={() => {
                    const item = menuItems.find(m => m.name.toLowerCase().includes('butter chicken')) || menuItems[1];
                    if (item) addToCart(item);
                  }}
                  className="px-3 py-1.5 bg-neutral-900 dark:bg-dark-bg text-white rounded-xl text-[10px] font-bold shadow-xs hover:bg-neutral-800 transition-colors"
                >
                  Apply & Add to Cart
                </button>
              </div>
            </div>

            {/* Coupon 2 */}
            <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full filter blur-md"></div>
              <div>
                <span className="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded-md">Low Calorie Treat</span>
                <h4 className="font-display font-bold text-base text-neutral-800 dark:text-white mt-4">15% Off Acai Energy Bowl</h4>
                <p className="text-xs text-neutral-450 mt-1 leading-normal">
                  Stay under your calorie target! Enjoy a light acai cup filled with active fiber and vitamins.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-dark-border/40 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-neutral-400 block font-bold uppercase">Promo Code</span>
                  <strong className="text-xs font-black text-amber-500">LOWCAL15</strong>
                </div>
                <button
                  onClick={() => {
                    const item = menuItems.find(m => m.name.toLowerCase().includes('acai')) || menuItems[0];
                    if (item) addToCart(item);
                  }}
                  className="px-3 py-1.5 bg-neutral-900 dark:bg-dark-bg text-white rounded-xl text-[10px] font-bold shadow-xs hover:bg-neutral-800 transition-colors"
                >
                  Apply & Add to Cart
                </button>
              </div>
            </div>

            {/* Coupon 3 */}
            <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 rounded-full filter blur-md"></div>
              <div>
                <span className="text-[10px] bg-sky-500/10 text-sky-500 font-bold px-2 py-0.5 rounded-md">Combo Discount</span>
                <h4 className="font-display font-bold text-base text-neutral-800 dark:text-white mt-4">$5 Off Green Goddess Smoothie</h4>
                <p className="text-xs text-neutral-450 mt-1 leading-normal">
                  Get high-fiber cleansing green smoothie for only $3.99 when ordered alongside any healthy lunch wrap or salad.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-dark-border/40 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-neutral-400 block font-bold uppercase">Promo Code</span>
                  <strong className="text-xs font-black text-sky-500">COMBOSWAP</strong>
                </div>
                <button
                  onClick={() => {
                    const item = menuItems.find(m => m.name.toLowerCase().includes('smoothie')) || menuItems[0];
                    if (item) addToCart(item);
                  }}
                  className="px-3 py-1.5 bg-neutral-900 dark:bg-dark-bg text-white rounded-xl text-[10px] font-bold shadow-xs hover:bg-neutral-800 transition-colors"
                >
                  Apply & Add to Cart
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );

};
