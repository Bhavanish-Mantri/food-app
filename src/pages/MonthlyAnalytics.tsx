import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Order } from '../types/database';
import { getAIMonthlyReport, MonthlyReportResult } from '../services/gemini';
import { 
  Sparkles, 
  DollarSign, 
  ShoppingBag, 
  TrendingDown, 
  Utensils, 
  Heart, 
  Calendar, 
  TrendingUp, 
  Scale, 
  FileText, 
  ChevronRight, 
  HelpCircle, 
  CheckCircle,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export const MonthlyAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [report, setReport] = useState<MonthlyReportResult | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [selectedWeek, setSelectedWeek] = useState<number>(4);

  // Weight logs simulation state
  const [weightLogs, setWeightLogs] = useState<{ date: string; weight: number }[]>(() => {
    const saved = localStorage.getItem('nn_weight_logs');
    if (saved) return JSON.parse(saved);
    return [
      { date: '06/08', weight: 72.8 },
      { date: '06/15', weight: 72.1 },
      { date: '06/22', weight: 71.5 },
      { date: '06/29', weight: 70.9 },
      { date: '07/06', weight: 70.2 }
    ];
  });
  
  const [newWeight, setNewWeight] = useState<string>('');
  const [newWeightDate, setNewWeightDate] = useState<string>(new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }));

  // Load orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        
        if (data && data.length > 0) {
          setOrders(data as Order[]);
        } else {
          // Mock seed orders for realistic charts
          const mockOrders: Order[] = [
            {
              id: 'ord-1',
              user_id: user.id,
              restaurant_id: 'rest-1',
              restaurant_name: 'The Spice Route',
              status: 'delivered',
              total_price: 24.50,
              items: [],
              created_at: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
              delivery_address: '123 Main St'
            },
            {
              id: 'ord-2',
              user_id: user.id,
              restaurant_id: 'rest-2',
              restaurant_name: 'Keto Kitchen',
              status: 'delivered',
              total_price: 32.80,
              items: [],
              created_at: new Date(Date.now() - 19 * 24 * 3600 * 1000).toISOString(),
              delivery_address: '123 Main St'
            },
            {
              id: 'ord-3',
              user_id: user.id,
              restaurant_id: 'rest-3',
              restaurant_name: 'Green Bowl Co',
              status: 'delivered',
              total_price: 19.90,
              items: [],
              created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
              delivery_address: '123 Main St'
            },
            {
              id: 'ord-4',
              user_id: user.id,
              restaurant_id: 'rest-1',
              restaurant_name: 'The Spice Route',
              status: 'delivered',
              total_price: 22.40,
              items: [],
              created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
              delivery_address: '123 Main St'
            },
            {
              id: 'ord-5',
              user_id: user.id,
              restaurant_id: 'rest-2',
              restaurant_name: 'Keto Kitchen',
              status: 'delivered',
              total_price: 38.50,
              items: [],
              created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
              delivery_address: '123 Main St'
            }
          ];
          setOrders(mockOrders);
        }
      } catch (err) {
        console.error('Failed to load orders for analytics:', err);
      }
    };
    fetchOrders();
  }, [user]);

  // Load Monthly AI Report
  const fetchReport = async () => {
    if (!user || orders.length === 0) return;
    setLoadingReport(true);
    try {
      const res = await getAIMonthlyReport(
        orders,
        user.preferences,
        1920, // avgCalories
        85,   // avgProtein
        180,  // avgCarbs
        68,   // avgFat
        86,   // avgHealthScore
        weightLogs
      );
      setReport(res);
    } catch (e) {
      console.error('Failed to load monthly AI report:', e);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (orders.length > 0) {
      fetchReport();
    }
  }, [orders, weightLogs]);

  // Save weight logs to localStorage
  const addWeightLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || isNaN(Number(newWeight))) return;
    const newLogs = [...weightLogs, { date: newWeightDate, weight: parseFloat(newWeight) }].slice(-8); // keep last 8
    setWeightLogs(newLogs);
    localStorage.setItem('nn_weight_logs', JSON.stringify(newLogs));
    setNewWeight('');
  };

  // Spending calculations
  const totalMoneySpent = orders.reduce((sum, o) => sum + o.total_price, 0);
  const totalOrdersCount = orders.length;
  const averageOrderValue = totalOrdersCount > 0 ? totalMoneySpent / totalOrdersCount : 0;

  // Favorite Restaurants & Cuisines parsing
  const restaurantOrders: { [name: string]: number } = {};
  orders.forEach(o => {
    restaurantOrders[o.restaurant_name] = (restaurantOrders[o.restaurant_name] || 0) + 1;
  });
  
  const restaurantChartData = Object.keys(restaurantOrders).map(name => ({
    name,
    Orders: restaurantOrders[name]
  })).sort((a, b) => b.Orders - a.Orders);

  const cuisinePieData = [
    { name: 'Low-Carb Italian', value: 35, color: '#3b82f6' },
    { name: 'Indian Spiced', value: 30, color: '#f59e0b' },
    { name: 'Vegan Wellness', value: 20, color: '#10b981' },
    { name: 'Keto Carnivore', value: 15, color: '#ec4899' }
  ];

  // Weight Trend parsing
  const weightChange = weightLogs.length > 1 
    ? parseFloat((weightLogs[weightLogs.length - 1].weight - weightLogs[0].weight).toFixed(1))
    : 0;

  // Weekly reports breakdown data
  const weeklyReportsData = [
    {
      week: 1,
      label: 'Week 1 (06/08 - 06/14)',
      avgCal: 1850,
      avgPro: 78,
      orders: 1,
      spent: 24.50,
      weight: 72.8,
      healthScore: 84,
      summary: 'Excellent calorie compliance. High protein ratio kept cravings stable.'
    },
    {
      week: 2,
      label: 'Week 2 (06/15 - 06/21)',
      avgCal: 2080,
      avgPro: 92,
      orders: 1,
      spent: 32.80,
      weight: 72.1,
      healthScore: 78,
      summary: 'Slightly higher sugar intake due to weekend desserts, but protein remained high.'
    },
    {
      week: 3,
      label: 'Week 3 (06/22 - 06/28)',
      avgCal: 1780,
      avgPro: 80,
      orders: 1,
      spent: 19.90,
      weight: 71.5,
      healthScore: 89,
      summary: 'Superb alignment with target goals. Increased fiber intake and lowered sodium.'
    },
    {
      week: 4,
      label: 'Week 4 (06/29 - 07/06)',
      avgCal: 1910,
      avgPro: 88,
      orders: 2,
      spent: 60.90,
      weight: 70.2,
      healthScore: 86,
      summary: 'Substantially lowered average weight. Strong consistency across low-carb items.'
    }
  ];

  const currentWeeklyDetails = weeklyReportsData.find(w => w.week === selectedWeek) || weeklyReportsData[3];

  // Spending trend data
  const spendingTrendData = [
    { name: 'Week 1', Spent: 24.50, Orders: 1 },
    { name: 'Week 2', Spent: 32.80, Orders: 1 },
    { name: 'Week 3', Spent: 19.90, Orders: 1 },
    { name: 'Week 4', Spent: 60.90, Orders: 2 }
  ];

  const handleExportToExcel = () => {
    // CSV Headers
    const headers = [
      'Date',
      'Restaurant',
      'Meal',
      'Calories (kcal)',
      'Protein (g)',
      'Carbs (g)',
      'Fat (g)',
      'Price ($)',
      'Health Score'
    ];

    // Map order rows
    const rows = orders.map(o => {
      const date = new Date(o.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const restaurant = o.restaurant_name;

      // Extract meal items or default to simulated premium names
      const meal = o.items && o.items.length > 0
        ? o.items.map(i => `${i.menuItem.name} (x${i.quantity})`).join('; ')
        : o.restaurant_name === 'The Spice Route'
          ? 'Clean High-Protein Butter Chicken & Quinoa'
          : o.restaurant_name === 'Keto Kitchen'
            ? 'Avocado Quinoa Buddha Bowl'
            : 'Superfood Acai Energy Bowl';

      // Macros values mapping
      const calories = o.restaurant_name === 'The Spice Route' ? 510 : o.restaurant_name === 'Keto Kitchen' ? 420 : 340;
      const protein = o.restaurant_name === 'The Spice Route' ? 46 : o.restaurant_name === 'Keto Kitchen' ? 12 : 7;
      const carbs = o.restaurant_name === 'The Spice Route' ? 14 : o.restaurant_name === 'Keto Kitchen' ? 48 : 58;
      const fat = o.restaurant_name === 'The Spice Route' ? 28 : o.restaurant_name === 'Keto Kitchen' ? 18 : 12;
      const price = o.total_price.toFixed(2);
      const healthScore = o.restaurant_name === 'The Spice Route' ? 88 : o.restaurant_name === 'Keto Kitchen' ? 92 : 84;

      return [
        `"${date}"`,
        `"${restaurant.replace(/"/g, '""')}"`,
        `"${meal.replace(/"/g, '""')}"`,
        calories,
        protein,
        carbs,
        fat,
        price,
        healthScore
      ];
    });

    // Summary block (Excel compatible format)
    const summaryRows = [
      [],
      ['Monthly Summary Statistics'],
      ['Metric Name', 'Value'],
      ['Total Orders Placed', totalOrdersCount],
      ['Total Capital Spent ($)', `$${totalMoneySpent.toFixed(2)}`],
      ['Average Order Value ($)', `$${averageOrderValue.toFixed(2)}`],
      ['Average Daily Calories (kcal)', '1920 kcal'],
      ['Average Daily Protein (g)', '85 g'],
      ['Average Daily Carbs (g)', '180 g'],
      ['Average Daily Fat (g)', '68 g'],
      ['Average Health Score', '86 / 100'],
      ['Net Weight Change (kg)', `${weightChange > 0 ? '+' : ''}${weightChange} kg`]
    ];

    // Combine headers, rows, and summaries
    const csvContent = "\uFEFF" // UTF-8 BOM
      + [
          headers.join(','),
          ...rows.map(r => r.join(',')),
          ...summaryRows.map(r => r.join(','))
        ].join('\n');

    // Create virtual download element
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NourishNow_Monthly_Report_${new Date().getFullYear()}_${String(new Date().getMonth() + 1).padStart(2, '0')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 dark:text-white">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/50 dark:border-dark-border/40 pb-5">
        <div>
          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-brand-500/10 text-brand-500 dark:text-brand-400 rounded-full text-xs font-semibold tracking-wide">
            <Calendar size={12} className="animate-pulse" />
            <span>Last 30 Days Executive Analytics</span>
          </span>
          <h1 className="font-display font-black text-3xl md:text-4xl text-neutral-800 dark:text-white tracking-tight mt-2">
            Monthly <span className="text-brand-500">Analytics</span> Dashboard
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Overview of spending, order behavior, weight milestones, and clinical AI evaluations.
          </p>
        </div>

        {/* Action Container (Logger + Exporter) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* Excel Export Button */}
          <button
            onClick={handleExportToExcel}
            className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-5 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            title="Download full monthly clinical and order report in Excel format"
          >
            <FileText size={18} />
            <span className="text-sm">Export Excel Report</span>
          </button>

          {/* Dynamic Weight Logger card */}
          <div className="bg-white/80 dark:bg-dark-surface/80 border border-neutral-200/40 dark:border-dark-border backdrop-blur-md p-4 rounded-2xl flex items-center space-x-4 shadow-sm">
            <div className="p-3 bg-brand-500/10 text-brand-500 rounded-xl">
              <Scale size={24} />
            </div>
            <div>
              <form onSubmit={addWeightLog} className="flex items-center space-x-2">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold block mb-0.5">Weight (kg)</span>
                <input 
                  type="number" 
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="e.g. 70.2"
                  className="w-16 bg-neutral-100 dark:bg-dark-bg border-none rounded p-1 text-center text-xs font-bold text-neutral-700 dark:text-neutral-200 focus:ring-1 focus:ring-brand-500" 
                  required
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 font-bold block mb-0.5">Date</span>
                <input 
                  type="text" 
                  value={newWeightDate}
                  onChange={(e) => setNewWeightDate(e.target.value)}
                  placeholder="07/06"
                  className="w-14 bg-neutral-100 dark:bg-dark-bg border-none rounded p-1 text-center text-xs font-bold text-neutral-700 dark:text-neutral-200 focus:ring-1 focus:ring-brand-500" 
                  required
                />
              </div>
              <button 
                type="submit" 
                className="mt-4 p-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-all"
              >
                <Plus size={12} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

      {/* Monthly Executive Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Money Spent card */}
        <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-extrabold block">Money Spent</span>
            <strong className="text-2xl font-black text-neutral-850 dark:text-white block mt-1">
              ${totalMoneySpent.toFixed(2)}
            </strong>
            <span className="text-[10px] text-neutral-400 block mt-1">Avg Order: ${averageOrderValue.toFixed(2)}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Orders Placed Card */}
        <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-extrabold block">Orders Placed</span>
            <strong className="text-2xl font-black text-neutral-850 dark:text-white block mt-1">
              {totalOrdersCount}
            </strong>
            <span className="text-[10px] text-neutral-400 block mt-1">All healthy curations</span>
          </div>
          <div className="p-3 bg-brand-500/10 text-brand-500 dark:text-brand-400 rounded-xl">
            <ShoppingBag size={24} />
          </div>
        </div>

        {/* Average Health Score Card */}
        <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-extrabold block">Avg Health Score</span>
            <strong className="text-2xl font-black text-neutral-850 dark:text-white block mt-1">
              86 <span className="text-xs text-neutral-400 font-normal">/ 100</span>
            </strong>
            <span className="text-[10px] text-emerald-500 font-semibold block mt-1">Grade: A- (Excellent)</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Heart size={24} />
          </div>
        </div>

        {/* Weight Milestones Card */}
        <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-extrabold block">Weight Change</span>
            <strong className="text-2xl font-black text-neutral-850 dark:text-white block mt-1">
              {weightChange > 0 ? `+${weightChange}` : weightChange} kg
            </strong>
            <span className="text-[10px] text-neutral-450 dark:text-neutral-400 block mt-1">
              {weightChange < 0 ? 'Consistent downward progress' : 'Stable weight profile'}
            </span>
          </div>
          <div className={`p-3 rounded-xl ${weightChange <= 0 ? 'bg-indigo-500/10 text-indigo-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {weightChange <= 0 ? <TrendingDown size={24} /> : <TrendingUp size={24} />}
          </div>
        </div>

      </div>

      {/* Main Grid: Recharts Analytical Timelines & Custom Pie Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Charts */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Weight Trend Chart */}
          <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-3xl shadow-sm">
            <div>
              <h3 className="font-display font-black text-lg text-neutral-850 dark:text-white">Weight Trend Timeline</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Biometric weight tracking records logged over the last 30 days.</p>
            </div>

            <div className="h-64 w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightLogs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      borderRadius: '16px', 
                      fontSize: '12px' 
                    }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Spending & Order Volumes Chart */}
          <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-3xl shadow-sm">
            <h3 className="font-display font-black text-lg text-neutral-850 dark:text-white mb-2">Spending & Order Frequency</h3>
            <p className="text-xs text-neutral-400 mb-6">Analyze order volumes vs capital spent on a weekly basis.</p>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar dataKey="Spent" name="Money Spent ($)" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="Orders" name="Orders Placed" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Favorite Restaurants Chart */}
          <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-3xl shadow-sm">
            <h3 className="font-display font-black text-lg text-neutral-850 dark:text-white mb-4">Favorite Kitchen Destinations</h3>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={restaurantChartData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={110} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      borderRadius: '16px', 
                      fontSize: '12px' 
                    }}
                  />
                  <Bar dataKey="Orders" name="Orders" fill="#6366f1" radius={[0, 6, 6, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column: AI Monthly Executive Summary & Weekly breakdown */}
        <div className="space-y-8">
          
          {/* Executive AI Summary Card */}
          <div className="bg-gradient-to-b from-neutral-900 to-neutral-850 dark:from-dark-surface dark:to-dark-surface/90 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full filter blur-2xl"></div>
            
            <div className="flex items-center space-x-2">
              <Sparkles className="text-brand-400 stroke-[2] animate-bounce" size={20} />
              <h3 className="font-display font-black text-lg">AI Executive Report</h3>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 leading-normal">
              Clinical nutrition summary compiled from your health scores and store purchases.
            </p>

            <div className="mt-6 space-y-5">
              {loadingReport ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                  <span className="w-8 h-8 rounded-full border-4 border-brand-400 border-t-transparent animate-spin"></span>
                  <span className="text-[10px] text-neutral-450">Gemini compilation in progress...</span>
                </div>
              ) : !report ? (
                <div className="py-8 text-center text-neutral-400">
                  <p className="text-xs">Loading monthly report details...</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-brand-400 font-extrabold uppercase tracking-widest">Executive Summary</span>
                    <p className="text-[11px] text-neutral-300 leading-relaxed font-medium">
                      {report.executiveSummary}
                    </p>
                  </div>

                  {/* Milestones */}
                  <div className="space-y-2 pt-3 border-t border-white/10">
                    <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest">Nutrition Milestones</span>
                    <ul className="space-y-2">
                      {report.nutritionMilestones.map((mile, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-[10px] text-neutral-300">
                          <CheckCircle className="text-emerald-450 shrink-0 mt-0.5" size={12} />
                          <span>{mile}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Spending insights */}
                  <div className="space-y-1.5 pt-3 border-t border-white/10">
                    <span className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest">Curation Spending Insight</span>
                    <p className="text-[11px] text-neutral-300 leading-normal">
                      {report.spendingInsights}
                    </p>
                  </div>

                  {/* Clinical Recommendations */}
                  <div className="space-y-2 pt-3 border-t border-white/10">
                    <span className="text-[9px] text-brand-400 font-extrabold uppercase tracking-widest">Clinical Adjustments</span>
                    <ul className="space-y-2">
                      {report.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-[10px] text-neutral-300">
                          <ChevronRight className="text-brand-500 shrink-0 mt-0.5" size={12} />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Favorite Cuisine Distribution Pie Chart */}
          <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-3xl shadow-sm flex flex-col justify-between">
            <h3 className="font-display font-black text-lg text-neutral-850 dark:text-white">Cuisine Preferences</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Distribution of ordered meal types.</p>
            
            <div className="h-56 w-full flex items-center justify-center mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cuisinePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {cuisinePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300">
              {cuisinePieData.map((c, i) => (
                <div key={i} className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }}></span>
                  <span className="truncate">{c.name} ({c.value}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Reports Segment selector */}
          <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-6 rounded-3xl shadow-sm">
            <h3 className="font-display font-black text-lg text-neutral-850 dark:text-white mb-4">Weekly Progress Reports</h3>
            
            <div className="flex space-x-2 mb-4">
              {[1, 2, 3, 4].map(w => (
                <button
                  key={w}
                  onClick={() => setSelectedWeek(w)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    selectedWeek === w 
                      ? 'bg-brand-500 text-white shadow-xs' 
                      : 'bg-neutral-100 dark:bg-dark-bg text-neutral-500 hover:bg-neutral-200'
                  }`}
                >
                  W{w}
                </button>
              ))}
            </div>

            {/* Weekly Report Details */}
            <div className="p-4 bg-neutral-50 dark:bg-dark-bg/60 border border-neutral-250/20 dark:border-dark-border/40 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-neutral-400 capitalize">{currentWeeklyDetails.label}</span>
                <span className="text-[10px] bg-brand-500/10 text-brand-500 font-bold px-2 py-0.5 rounded-lg">
                  Score: {currentWeeklyDetails.healthScore}
                </span>
              </div>
              
              <p className="text-[11px] text-neutral-600 dark:text-neutral-350 leading-relaxed">
                {currentWeeklyDetails.summary}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2.5 border-t border-neutral-200/40 dark:border-dark-border/40 text-[10px] font-semibold text-neutral-500">
                <div>
                  <span className="block text-[8px] text-neutral-400 uppercase">Avg Calories</span>
                  <strong className="text-neutral-800 dark:text-white">{currentWeeklyDetails.avgCal} kcal</strong>
                </div>
                <div>
                  <span className="block text-[8px] text-neutral-400 uppercase">Weight Tracking</span>
                  <strong className="text-neutral-800 dark:text-white">{currentWeeklyDetails.weight} kg</strong>
                </div>
                <div>
                  <span className="block text-[8px] text-neutral-400 uppercase">Weekly Spent</span>
                  <strong className="text-emerald-500">${currentWeeklyDetails.spent.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="block text-[8px] text-neutral-400 uppercase">Weekly Orders</span>
                  <strong className="text-neutral-800 dark:text-white">{currentWeeklyDetails.orders}</strong>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
