import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, MenuItem, OrderItemCustomization } from '../types/database';

interface CartContextType {
  cart: CartItem[];
  addToCart: (menuItem: MenuItem, quantity?: number, customization?: OrderItemCustomization) => void;
  removeFromCart: (itemId: string, customizationNotes?: string) => void;
  updateQuantity: (itemId: string, quantity: number, customizationNotes?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  restaurantId: string | null;
  restaurantName: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const parseNumeric = (val: any): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const parseInteger = (val: any): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('nn_cart');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          ...item,
          quantity: typeof item.quantity === 'number' && !isNaN(item.quantity) ? Math.max(1, item.quantity) : 1,
          menuItem: {
            ...item.menuItem,
            price: parseNumeric(item.menuItem?.price),
            macros: {
              calories: parseInteger(item.menuItem?.macros?.calories),
              protein: parseInteger(item.menuItem?.macros?.protein),
              carbs: parseInteger(item.menuItem?.macros?.carbs),
              fat: parseInteger(item.menuItem?.macros?.fat),
            }
          }
        }));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [restaurantId, setRestaurantId] = useState<string | null>(() => {
    return localStorage.getItem('nn_cart_restaurant_id') || null;
  });

  const [restaurantName, setRestaurantName] = useState<string | null>(() => {
    return localStorage.getItem('nn_cart_restaurant_name') || null;
  });

  useEffect(() => {
    localStorage.setItem('nn_cart', JSON.stringify(cart));
    if (cart.length === 0) {
      setRestaurantId(null);
      setRestaurantName(null);
      localStorage.removeItem('nn_cart_restaurant_id');
      localStorage.removeItem('nn_cart_restaurant_name');
    }
  }, [cart]);

  const addToCart = (menuItem: MenuItem, quantity: number = 1, customization?: OrderItemCustomization) => {
    // Sanitize incoming menu item and quantity
    const cleanQuantity = typeof quantity === 'number' && !isNaN(quantity) ? Math.max(1, quantity) : 1;
    const cleanMenuItem: MenuItem = {
      ...menuItem,
      price: parseNumeric(menuItem.price),
      macros: {
        calories: parseInteger(menuItem.macros?.calories),
        protein: parseInteger(menuItem.macros?.protein),
        carbs: parseInteger(menuItem.macros?.carbs),
        fat: parseInteger(menuItem.macros?.fat),
      }
    };

    // If the cart has items from a different restaurant, clear it first
    if (restaurantId && restaurantId !== cleanMenuItem.restaurant_id) {
      if (!confirm('Add item from a different restaurant? This will clear your current cart.')) {
        return;
      }
      setCart([]);
    }

    setRestaurantId(cleanMenuItem.restaurant_id);
    const fetchRestaurantName = async () => {
      const savedRest = localStorage.getItem('nn_restaurants');
      if (savedRest) {
        const rests = JSON.parse(savedRest);
        const r = rests.find((x: any) => x.id === cleanMenuItem.restaurant_id);
        if (r) {
          setRestaurantName(r.name);
          localStorage.setItem('nn_cart_restaurant_name', r.name);
        }
      }
    };
    fetchRestaurantName();
    localStorage.setItem('nn_cart_restaurant_id', cleanMenuItem.restaurant_id);

    setCart(prevCart => {
      const existingIdx = prevCart.findIndex(item => 
        item.menuItem.id === cleanMenuItem.id && 
        (item.customization?.notes === customization?.notes)
      );

      if (existingIdx >= 0) {
        const newCart = [...prevCart];
        newCart[existingIdx].quantity += cleanQuantity;
        return newCart;
      } else {
        return [...prevCart, { menuItem: cleanMenuItem, quantity: cleanQuantity, customization }];
      }
    });
  };

  const removeFromCart = (itemId: string, customizationNotes?: string) => {
    setCart(prevCart => 
      prevCart.filter(item => 
        !(item.menuItem.id === itemId && item.customization?.notes === customizationNotes)
      )
    );
  };

  const updateQuantity = (itemId: string, quantity: number, customizationNotes?: string) => {
    if (quantity <= 0) {
      removeFromCart(itemId, customizationNotes);
      return;
    }
    setCart(prevCart => 
      prevCart.map(item => 
        (item.menuItem.id === itemId && item.customization?.notes === customizationNotes)
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setRestaurantId(null);
    setRestaurantName(null);
    localStorage.removeItem('nn_cart_restaurant_id');
    localStorage.removeItem('nn_cart_restaurant_name');
    localStorage.removeItem('nn_cart');
  };

  const cartTotal = cart.reduce((total, item) => {
    const itemPrice = item.menuItem.price + (item.customization?.priceDelta || 0);
    return total + (itemPrice * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      restaurantId,
      restaurantName
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
