export type UserRole = 'customer' | 'restaurant' | 'driver';

export interface UserPreferences {
  diet: 'none' | 'vegan' | 'gluten-free' | 'keto' | 'low-carb';
  targetCalories: number;
  allergies: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  preferences: UserPreferences;
  address?: string;
}

export interface MenuItemMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  macros: MenuItemMacros;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  image_url: string;
  rating: number;
  address: string;
  description: string;
  reviews_count: number;
}

export interface OrderItemCustomization {
  notes: string;
  ingredientAdjustments: string[];
  priceDelta: number;
  macroUpdates: MenuItemMacros;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  customization?: OrderItemCustomization;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivering' | 'delivered';

export interface Order {
  id: string;
  user_id: string;
  restaurant_id: string;
  restaurant_name: string;
  status: OrderStatus;
  total_price: number;
  items: CartItem[];
  created_at: string;
  driver_id?: string;
  delivery_address: string;
}

export interface AISentiment {
  sentimentScore: number; // 0 to 100
  positives: string[];
  negatives: string[];
  summary: string;
}

export interface Review {
  id: string;
  user_id: string;
  user_name: string;
  restaurant_id: string;
  rating: number;
  comment: string;
  created_at: string;
  ai_sentiment?: AISentiment;
}
