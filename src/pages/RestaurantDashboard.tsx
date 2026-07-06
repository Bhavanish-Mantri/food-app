import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Order, OrderStatus } from '../types/database';
import { ChefHat, ShoppingBag, Clock, CheckCircle2, TrendingUp, DollarSign, Award, Users } from 'lucide-react';

export const RestaurantDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('pending');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        setOrders(data as Order[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);
      if (!error) {
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getFilteredOrders = () => {
    if (activeTab === 'all') return orders;
    return orders.filter(o => o.status === activeTab);
  };

  // Stats calculation
  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total_price, 0);

  const totalKitchenOrders = orders.filter(o => o.status === 'preparing').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Dashboard Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <span className="text-[10px] uppercase font-bold text-neutral-400">Kitchen Portal</span>
          <h1 className="font-display font-extrabold text-2xl text-neutral-800 dark:text-white flex items-center space-x-2 mt-0.5">
            <ChefHat className="text-brand-500 animate-float" />
            <span>Chef Isabella's Kitchen</span>
          </h1>
        </div>
        <button 
          onClick={fetchOrders}
          className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-xs font-semibold text-neutral-500 dark:text-neutral-300"
        >
          Refresh Orders
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Earnings */}
        <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider leading-none">Delivered Earnings</span>
            <strong className="text-lg font-extrabold text-neutral-800 dark:text-white mt-1 block">${totalRevenue.toFixed(2)}</strong>
          </div>
        </div>

        {/* Cooking */}
        <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <ChefHat size={20} />
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider leading-none">In the Oven</span>
            <strong className="text-lg font-extrabold text-neutral-800 dark:text-white mt-1 block">{totalKitchenOrders} cooking</strong>
          </div>
        </div>

        {/* New tickets */}
        <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-brand-500/10 text-brand-500">
            <ShoppingBag size={20} />
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider leading-none">Incoming Tickets</span>
            <strong className="text-lg font-extrabold text-neutral-800 dark:text-white mt-1 block">{pendingOrdersCount} pending</strong>
          </div>
        </div>

        {/* Performance Score */}
        <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500">
            <Award size={20} />
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider leading-none">Chef Rating</span>
            <strong className="text-lg font-extrabold text-neutral-800 dark:text-white mt-1 block">4.9 / 5.0</strong>
          </div>
        </div>

      </div>

      {/* Tabs selectors */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-6 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'pending', label: 'New Tickets', count: orders.filter(o => o.status === 'pending').length },
          { id: 'preparing', label: 'Cooking', count: orders.filter(o => o.status === 'preparing').length },
          { id: 'ready', label: 'Ready for Courier', count: orders.filter(o => o.status === 'ready').length },
          { id: 'all', label: 'All Orders History', count: orders.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === tab.id 
                ? 'text-brand-500' 
                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 text-[9px] font-extrabold">
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Order cards list */}
      {loading && orders.length === 0 ? (
        <div className="text-center py-12">
          <span className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin inline-block"></span>
          <p className="text-[11px] text-neutral-400 mt-2">Loading orders...</p>
        </div>
      ) : getFilteredOrders().length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
          <p className="text-neutral-400 text-sm">No active tickets in this section.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {getFilteredOrders().map((order) => (
            <div 
              key={order.id} 
              className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow"
            >
              {/* Card top */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Order ID: {order.id}</span>
                    <span className="text-xs text-neutral-500 mt-0.5 block">{new Date(order.created_at).toLocaleTimeString()}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                    order.status === 'pending' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                    order.status === 'preparing' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                    order.status === 'ready' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                    'bg-neutral-100 dark:bg-neutral-850 text-neutral-500'
                  }`}>
                    {order.status}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-dark-border/40">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-semibold text-neutral-800 dark:text-white">
                          {item.quantity}x {item.menuItem.name}
                        </p>
                        {item.customization && (
                          <div className="mt-1 p-2 rounded-lg bg-orange-500/[0.04] dark:bg-orange-500/[0.02] border border-orange-500/20 animate-pulse-slow">
                            <span className="text-[9px] font-bold text-orange-500 block uppercase tracking-wider">AI Chef Instruction</span>
                            <span className="text-[10px] text-neutral-600 dark:text-neutral-350 italic mt-0.5 block">
                              "{item.customization.notes}"
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-neutral-850 dark:text-white">
                        ${((item.menuItem.price + (item.customization?.priceDelta || 0)) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-neutral-100 dark:border-dark-border/40 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-neutral-400 block uppercase tracking-wider">Address</span>
                  <span className="text-xs text-neutral-600 dark:text-neutral-300 font-semibold block truncate max-w-[200px]">{order.delivery_address}</span>
                </div>

                <div className="flex space-x-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/10 flex items-center space-x-1.5 hover:scale-[1.01] transition-all"
                    >
                      <ChefHat size={12} />
                      <span>Accept & Cook</span>
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/10 flex items-center space-x-1.5 hover:scale-[1.01] transition-all"
                    >
                      <CheckCircle2 size={12} />
                      <span>Ready for Pickup</span>
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <span className="text-xs text-neutral-400 flex items-center space-x-1">
                      <Clock size={12} />
                      <span>Awaiting Courier</span>
                    </span>
                  )}
                  {(order.status === 'delivering' || order.status === 'delivered') && (
                    <span className="text-xs text-emerald-500 font-bold flex items-center space-x-1">
                      <CheckCircle2 size={12} />
                      <span>Dispatched</span>
                    </span>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
