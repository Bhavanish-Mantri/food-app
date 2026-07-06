import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Order, OrderStatus } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { Truck, MapPin, CheckCircle, Navigation, Award, DollarSign, Clock, RefreshCw } from 'lucide-react';

export const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatingOrderId, setSimulatingOrderId] = useState<string | null>(null);
  const [simProgress, setSimProgress] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('orders').select('*');
      if (data) {
        const allOrders = data as Order[];
        // Orders ready for pickup and have no driver assigned
        setAvailableOrders(allOrders.filter(o => o.status === 'ready' && !o.driver_id));
        // Orders assigned to this driver that are active
        if (user) {
          setMyOrders(allOrders.filter(o => o.driver_id === user.id));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [user]);

  // Simulated GPS driving
  useEffect(() => {
    let timer: any;
    if (simulatingOrderId) {
      timer = setInterval(() => {
        setSimProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            // Auto complete or enable button
            return 100;
          }
          return prev + 10; // 10% per tick
        });
      }, 1000);
    } else {
      setSimProgress(0);
    }

    return () => clearInterval(timer);
  }, [simulatingOrderId]);

  const handleAcceptPickup = async (orderId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          driver_id: user.id,
          status: 'delivering'
        })
        .eq('id', orderId);

      if (!error) {
        fetchData();
        // Start simulation immediately for this order
        setSimulatingOrderId(orderId);
        setSimProgress(0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'delivered'
        })
        .eq('id', orderId);

      if (!error) {
        setSimulatingOrderId(null);
        setSimProgress(0);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Calculate earnings ($4.99 per delivery)
  const earnings = myOrders.filter(o => o.status === 'delivered').length * 4.99;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <span className="text-[10px] uppercase font-bold text-neutral-400">Driver Portal</span>
          <h1 className="font-display font-extrabold text-2xl text-neutral-800 dark:text-white flex items-center space-x-2 mt-0.5">
            <Truck className="text-brand-500 animate-float" />
            <span>Driver Dashboard: Swift Rider</span>
          </h1>
        </div>
        <button 
          onClick={fetchData}
          className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-xs font-semibold text-neutral-500 dark:text-neutral-300 flex items-center space-x-1.5"
        >
          <RefreshCw size={12} />
          <span>Sync Database</span>
        </button>
      </div>

      {/* Driver stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider leading-none">Your Earnings</span>
            <strong className="text-lg font-extrabold text-neutral-800 dark:text-white mt-1 block">${earnings.toFixed(2)}</strong>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-brand-500/10 text-brand-500">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider leading-none">Completed Runs</span>
            <strong className="text-lg font-extrabold text-neutral-800 dark:text-white mt-1 block">
              {myOrders.filter(o => o.status === 'delivered').length} Drops
            </strong>
          </div>
        </div>
        <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500">
            <Award size={20} />
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider leading-none">Courier Level</span>
            <strong className="text-lg font-extrabold text-neutral-800 dark:text-white mt-1 block">Pro Partner</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Orders Awaiting Pickup */}
        <div className="space-y-4">
          <h3 className="font-display font-extrabold text-base text-neutral-800 dark:text-white flex items-center space-x-1.5">
            <Clock size={16} className="text-brand-500" />
            <span>Available Pickups ({availableOrders.length})</span>
          </h3>

          {availableOrders.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-250/20 dark:border-neutral-800 rounded-3xl">
              <p className="text-neutral-400 text-xs">No orders ready for pickup. Tell the Kitchen to mark an order as "Ready".</p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableOrders.map((order) => (
                <div key={order.id} className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-2xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold text-neutral-450 uppercase block">Restaurant</span>
                      <h4 className="font-bold text-sm text-neutral-800 dark:text-white">{order.restaurant_name}</h4>
                    </div>
                    <span className="text-xs font-bold text-brand-500">${order.total_price.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-start space-x-2 text-xs text-neutral-500">
                    <MapPin size={14} className="text-neutral-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-[9px] font-bold text-neutral-450 uppercase block">Dropoff Address</span>
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">{order.delivery_address}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcceptPickup(order.id)}
                    className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/10 flex items-center justify-center space-x-1.5 hover:scale-[1.01] transition-all"
                  >
                    <Truck size={12} />
                    <span>Accept Job & Route GPS</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Active Jobs & GPS Simulator */}
        <div className="space-y-4">
          <h3 className="font-display font-extrabold text-base text-neutral-800 dark:text-white flex items-center space-x-1.5">
            <Navigation size={16} className="text-brand-500" />
            <span>Active Deliveries ({myOrders.filter(o => o.status === 'delivering').length})</span>
          </h3>

          {myOrders.filter(o => o.status === 'delivering').length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-250/20 dark:border-neutral-800 rounded-3xl">
              <p className="text-neutral-400 text-xs">No active runs. Accept a job from the available list.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.filter(o => o.status === 'delivering').map((order) => {
                const isSimulating = simulatingOrderId === order.id;
                return (
                  <div key={order.id} className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-neutral-850 dark:text-white">{order.restaurant_name}</h4>
                        <span className="text-[10px] text-neutral-450 block truncate max-w-[200px] mt-1">{order.delivery_address}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-500 uppercase">Driving</span>
                    </div>

                    {/* GPS Simulation Control */}
                    <div className="p-4 bg-neutral-50 dark:bg-dark-bg/60 border border-neutral-100 dark:border-dark-border/40 rounded-xl space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-400">GPS Route simulation</span>
                        <strong className="text-brand-500">{isSimulating ? `${simProgress}%` : '0%'}</strong>
                      </div>
                      <div className="w-full bg-neutral-250 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-500 rounded-full transition-all duration-300"
                          style={{ width: `${isSimulating ? simProgress : 0}%` }}
                        />
                      </div>
                      
                      {!isSimulating ? (
                        <button
                          onClick={() => {
                            setSimulatingOrderId(order.id);
                            setSimProgress(0);
                          }}
                          className="w-full py-1.5 border border-brand-500/30 text-brand-500 text-xs font-bold rounded-lg hover:bg-brand-500/5"
                        >
                          Start GPS Simulator
                        </button>
                      ) : simProgress < 100 ? (
                        <p className="text-[10px] text-center text-neutral-450 italic">Driving scooter towards customer house...</p>
                      ) : (
                        <button
                          onClick={() => handleMarkDelivered(order.id)}
                          className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-500/10 flex items-center justify-center space-x-1"
                        >
                          <CheckCircle size={12} />
                          <span>Arrived: Mark as Delivered</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
