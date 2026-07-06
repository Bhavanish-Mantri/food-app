import React, { useEffect, useState } from 'react';
import { Order, OrderStatus } from '../types/database';
import { supabase } from '../services/supabase';
import { Clock, CheckCircle2, ChefHat, Truck, MapPin, Smile, ArrowRight } from 'lucide-react';

interface OrderTrackerProps {
  order: Order;
  onOrderUpdated?: (updatedOrder: Order) => void;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({ order, onOrderUpdated }) => {
  const [driverName, setDriverName] = useState('Searching for driver...');
  const [simProgress, setSimProgress] = useState(0);

  // Poll order status changes from database/localStorage
  useEffect(() => {
    const checkStatus = setInterval(async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order.id)
        .single();
      if (data && data.status !== order.status && onOrderUpdated) {
        onOrderUpdated(data as Order);
      }
    }, 3000);

    return () => clearInterval(checkStatus);
  }, [order.id, order.status, onOrderUpdated]);

  // Fetch driver name
  useEffect(() => {
    if (order.driver_id) {
      const fetchDriver = async () => {
        const { data } = await supabase
          .from('users')
          .select('name')
          .eq('id', order.driver_id)
          .single();
        if (data) {
          setDriverName(data.name);
        }
      };
      fetchDriver();
    } else {
      setDriverName('Searching for driver...');
    }
  }, [order.driver_id]);

  // Simulate Map GPS tracking progress
  useEffect(() => {
    let interval: any;
    if (order.status === 'delivering') {
      interval = setInterval(() => {
        setSimProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 1.5;
        });
      }, 500);
    } else if (order.status === 'delivered') {
      setSimProgress(100);
    } else {
      setSimProgress(0);
    }

    return () => clearInterval(interval);
  }, [order.status]);

  const stages: { status: OrderStatus; label: string; desc: string; icon: any }[] = [
    { 
      status: 'pending', 
      label: 'Order Placed', 
      desc: 'Restaurant is reviewing your order', 
      icon: Clock 
    },
    { 
      status: 'preparing', 
      label: 'Preparing', 
      desc: 'Chef is custom crafting your meal', 
      icon: ChefHat 
    },
    { 
      status: 'ready', 
      label: 'Ready for Pickup', 
      desc: 'Packed and waiting for the driver', 
      icon: CheckCircle2 
    },
    { 
      status: 'delivering', 
      label: 'Out for Delivery', 
      desc: 'Driver is zooming to your location', 
      icon: Truck 
    },
    { 
      status: 'delivered', 
      label: 'Delivered', 
      desc: 'Enjoy your warm, customized meal!', 
      icon: Smile 
    }
  ];

  const getStageIndex = (status: OrderStatus) => {
    const idx = stages.findIndex(s => s.status === status);
    return idx === -1 ? 0 : idx;
  };

  const currentIdx = getStageIndex(order.status);

  return (
    <div className="space-y-6">
      
      {/* Tracker Status Stepper */}
      <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 pb-6 border-b border-neutral-100 dark:border-dark-border/40">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400">Order ID: {order.id}</span>
            <h3 className="font-display font-bold text-lg text-neutral-800 dark:text-white mt-0.5">
              Tracking: <span className="text-brand-500">{order.restaurant_name}</span>
            </h3>
          </div>
          <div className="text-right">
            <span className="text-xs text-neutral-400 block">Estimated Time</span>
            <span className="font-display font-extrabold text-base text-brand-500">
              {order.status === 'pending' ? '25-35 mins' : 
               order.status === 'preparing' ? '15-20 mins' : 
               order.status === 'ready' ? '10 mins' : 
               order.status === 'delivering' ? '5-7 mins' : 'Arrived!'}
            </span>
          </div>
        </div>

        {/* Stepper Timeline */}
        <div className="pt-8 relative flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0">
          
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-[48px] left-[5%] right-[5%] h-0.5 bg-neutral-200 dark:bg-neutral-800 -z-10">
            <div 
              className="h-full bg-brand-500 transition-all duration-500" 
              style={{ width: `${(currentIdx / (stages.length - 1)) * 100}%` }}
            />
          </div>

          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < currentIdx;
            const isActive = idx === currentIdx;
            const isPending = idx > currentIdx;

            return (
              <div 
                key={stage.status}
                className="flex md:flex-col items-center md:text-center w-full md:w-auto relative"
              >
                {/* Status Dot / Icon */}
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-500/20' 
                      : isActive
                      ? 'bg-brand-500/10 border-brand-500 text-brand-500 animate-pulse-slow font-bold ring-4 ring-brand-500/10'
                      : 'bg-neutral-50 dark:bg-dark-bg border-neutral-200 dark:border-neutral-800 text-neutral-400'
                  }`}
                >
                  <Icon size={18} />
                </div>

                {/* Details */}
                <div className="ml-4 md:ml-0 md:mt-3 text-left md:text-center">
                  <p className={`text-xs font-bold ${
                    isActive ? 'text-brand-500' : isCompleted ? 'text-neutral-800 dark:text-neutral-200' : 'text-neutral-400'
                  }`}>
                    {stage.label}
                  </p>
                  <span className="text-[10px] text-neutral-400 block mt-0.5 leading-tight max-w-[140px] md:mx-auto">
                    {stage.desc}
                  </span>
                </div>
              </div>
            );
          })}

        </div>
      </div>

      {/* GPS Simulation Map Visualizer */}
      {(order.status === 'delivering' || order.status === 'delivered') && (
        <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-display font-semibold text-sm text-neutral-800 dark:text-white flex items-center space-x-1.5">
                <MapPin size={16} className="text-brand-500" />
                <span>Live Route Simulation</span>
              </h4>
              <span className="text-[10px] text-neutral-400">Mock GPS coordinates from kitchen to door</span>
            </div>
            <span className="text-xs font-bold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-lg">
              {Math.round(simProgress)}% Complete
            </span>
          </div>

          {/* Animated Route Canvas Map */}
          <div className="relative h-44 rounded-xl bg-neutral-100 dark:bg-dark-bg/60 border border-neutral-200/20 overflow-hidden flex items-center justify-center">
            {/* Map Roads Outline Vector */}
            <svg className="absolute inset-0 w-full h-full stroke-neutral-200 dark:stroke-neutral-800 stroke-[4] fill-none" xmlns="http://www.w3.org/2000/svg">
              {/* Roads grid */}
              <line x1="0" y1="40" x2="600" y2="40" />
              <line x1="0" y1="120" x2="600" y2="120" />
              <line x1="100" y1="0" x2="100" y2="200" />
              <line x1="280" y1="0" x2="280" y2="200" />
              <line x1="460" y1="0" x2="460" y2="200" />

              {/* Delivery Path */}
              <path 
                d="M 100 120 L 280 120 L 280 40 L 460 40 L 460 120" 
                className="stroke-brand-500/30 stroke-[3] stroke-dasharray-[6]"
              />
              
              {/* Animated progress overlay */}
              <path 
                id="route-path"
                d="M 100 120 L 280 120 L 280 40 L 460 40 L 460 120" 
                className="stroke-brand-500 stroke-[3] transition-all"
                strokeDasharray="600"
                strokeDashoffset={600 - (600 * (simProgress / 100))}
              />
            </svg>

            {/* Restaurant Marker */}
            <div className="absolute left-[88px] top-[108px] flex flex-col items-center">
              <div className="p-1.5 rounded-lg bg-emerald-500 text-white shadow-md">
                <ChefHat size={12} />
              </div>
              <span className="text-[8px] font-bold text-neutral-500 mt-1 uppercase">Kitchen</span>
            </div>

            {/* Customer Marker */}
            <div className="absolute left-[448px] top-[108px] flex flex-col items-center">
              <div className="p-1.5 rounded-lg bg-brand-500 text-white shadow-md">
                <MapPin size={12} />
              </div>
              <span className="text-[8px] font-bold text-neutral-500 mt-1 uppercase">Home</span>
            </div>

            {/* Moving Scooter Icon */}
            {order.status === 'delivering' && simProgress < 100 && (
              <div 
                className="absolute p-1.5 rounded-full bg-white dark:bg-dark-surface border border-neutral-300 dark:border-neutral-700 shadow-lg text-brand-500 z-10 transition-all duration-300"
                style={{
                  // Calculate dynamic positions along the segments
                  left: simProgress < 40 
                    ? `${100 + (180 * (simProgress / 40))}px` // Seg 1: M 100 120 L 280 120
                    : simProgress < 65
                    ? '280px' // Seg 2: L 280 40
                    : simProgress < 85
                    ? `${280 + (180 * ((simProgress - 65) / 20))}px` // Seg 3: L 460 40
                    : '460px', // Seg 4: L 460 120
                  top: simProgress < 40
                    ? '120px'
                    : simProgress < 65
                    ? `${120 - (80 * ((simProgress - 40) / 25))}px`
                    : simProgress < 85
                    ? '40px'
                    : `${40 + (80 * ((simProgress - 85) / 15))}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <Truck size={14} className="animate-bounce" />
              </div>
            )}
          </div>

          {/* Driver details subcard */}
          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-dark-border/40 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                <Truck size={18} />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wider leading-none">Your Courier</span>
                <span className="text-xs font-bold text-neutral-800 dark:text-white mt-1 block">{driverName}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg font-bold">
                {order.status === 'delivering' ? 'On Route' : 'Delivered'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cart Summary Panel */}
      <div className="bg-white dark:bg-dark-surface border border-neutral-200/50 dark:border-dark-border rounded-2xl p-6 shadow-sm">
        <h4 className="font-display font-semibold text-sm text-neutral-800 dark:text-white mb-4">Items Ordered</h4>
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-800 dark:text-white truncate">
                  {item.quantity}x {item.menuItem.name}
                </p>
                {item.customization && (
                  <span className="text-[9px] text-neutral-400 block leading-tight max-w-[280px] truncate">
                    {item.customization.notes}
                  </span>
                )}
              </div>
              <span className="font-bold text-neutral-800 dark:text-white ml-4">
                ${((item.menuItem.price + (item.customization?.priceDelta || 0)) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="pt-3 border-t border-neutral-100 dark:border-dark-border/40 flex justify-between items-center">
            <span className="font-semibold text-neutral-500">Total Charged</span>
            <span className="font-display font-extrabold text-base text-neutral-800 dark:text-white">
              ${order.total_price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
