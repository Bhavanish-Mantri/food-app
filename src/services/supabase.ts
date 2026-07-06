import { createClient } from '@supabase/supabase-js';
import { Restaurant, MenuItem, Order, Review, UserProfile } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isRealSupabase = !!(supabaseUrl && supabaseAnonKey);

// Define real client (only initialized if variables are present)
const realSupabase = isRealSupabase ? createClient(supabaseUrl, supabaseAnonKey) : null;

// ==========================================
// MOCK DATABASE & CLIENT FOR OFFLINE MODE
// ==========================================

const SEED_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-1',
    name: 'Vibe & Vegans',
    cuisine: 'Organic & Plant-Based',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600',
    rating: 4.8,
    address: '42 Green Garden Way, Wellness District',
    description: '100% organic, vibrant plant-based dishes tailored to nourish your body and feed your soul. Packed with superfoods and crafted with love.',
    reviews_count: 142
  },
  {
    id: 'rest-2',
    name: 'Keto Kitchen',
    cuisine: 'High-Protein & Low-Carb',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600',
    rating: 4.9,
    address: '88 Carnivore Blvd, Strength Plaza',
    description: 'Indulge in premium wood-fired cuts, avocado creations, and healthy fats. Perfectly optimized for ketogenic and low-carb lifestyles.',
    reviews_count: 189
  },
  {
    id: 'rest-3',
    name: 'The Spice Route',
    cuisine: 'Halal & Fusion Indian',
    image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=600',
    rating: 4.7,
    address: '107 Curry Lane, Heritage Square',
    description: 'Traditional slow-cooked recipes with a healthy, high-protein twist. Experience the rich spices and flavors of the subcontinent.',
    reviews_count: 125
  },
  {
    id: 'rest-4',
    name: 'Bella Italia',
    cuisine: 'Classic & Healthy Italian',
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=600',
    rating: 4.6,
    address: '12 Tuscan Sun Way, Little Italy',
    description: 'Handcrafted ancient-grain pastas, light wood-fired flatbreads, and fresh garden salads. Real Italian flavor, lightened for modern nutrition.',
    reviews_count: 98
  }
];

const SEED_MENU_ITEMS: MenuItem[] = [
  // Vibe & Vegans (rest-1)
  {
    id: 'menu-101',
    restaurant_id: 'rest-1',
    name: 'Avocado Quinoa Buddha Bowl',
    description: 'Warm organic quinoa topped with avocado halves, massage kale, spicy roasted chickpeas, shredded carrots, and a creamy tahini-lemon dressing.',
    price: 14.99,
    category: 'Bowls',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400',
    macros: { calories: 480, protein: 14, carbs: 52, fat: 24 }
  },
  {
    id: 'menu-102',
    restaurant_id: 'rest-1',
    name: 'Crispy Tempeh & Avocado Burger',
    description: 'House-made smoky tempeh patty, smashed avocado, vine-ripened tomatoes, and butter lettuce on a gluten-free charcoal bun. Served with sweet potato wedges.',
    price: 16.49,
    category: 'Burgers',
    image_url: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&q=80&w=400',
    macros: { calories: 590, protein: 26, carbs: 64, fat: 22 }
  },
  {
    id: 'menu-103',
    restaurant_id: 'rest-1',
    name: 'Superfood Acai Energy Bowl',
    description: 'Pure acai pulp blended with coconut water, topped with organic chia seeds, hemp seeds, fresh blueberries, gluten-free granola, and almond butter drizzle.',
    price: 11.99,
    category: 'Desserts & Bowls',
    image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&q=80&w=400',
    macros: { calories: 340, protein: 7, carbs: 58, fat: 12 }
  },
  {
    id: 'menu-104',
    restaurant_id: 'rest-1',
    name: 'Green Goddess Cleansing Smoothie',
    description: 'Spinach, cucumber, celery, green apple, ginger, fresh lemon, and premium spirulina. Cold-pressed and refreshing.',
    price: 8.99,
    category: 'Drinks',
    image_url: 'https://images.unsplash.com/photo-1610970881699-44a5587caaec?auto=format&fit=crop&q=80&w=400',
    macros: { calories: 150, protein: 3, carbs: 32, fat: 1 }
  },

  // Keto Kitchen (rest-2)
  {
    id: 'menu-201',
    restaurant_id: 'rest-2',
    name: 'Grass-Fed Ribeye & Chimichurri',
    description: '10oz prime grass-fed ribeye steak seared in grass-fed butter, sliced and topped with house chimichurri. Served with roasted garlic asparagus.',
    price: 29.99,
    category: 'Mains',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400',
    macros: { calories: 840, protein: 58, carbs: 3, fat: 66 }
  },
  {
    id: 'menu-202',
    restaurant_id: 'rest-2',
    name: 'Avocado Bacon Salmon Skillet',
    description: 'Pan-seared Atlantic salmon fillet topped with crisp applewood bacon, diced avocado, and a cilantro lime crema. Served over butter-braised spinach.',
    price: 24.99,
    category: 'Seafood',
    image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=400',
    macros: { calories: 690, protein: 44, carbs: 5, fat: 55 }
  },
  {
    id: 'menu-203',
    restaurant_id: 'rest-2',
    name: 'Keto Carbonara (Zucchini Noodles)',
    description: 'Spiralized fresh zucchini tossed in a rich egg yolk and pecorino romano cream sauce with crispy pancetta and black pepper.',
    price: 18.99,
    category: 'Mains',
    image_url: 'https://images.unsplash.com/photo-1554998171-89445e31c52b?auto=format&fit=crop&q=80&w=400',
    macros: { calories: 470, protein: 18, carbs: 9, fat: 41 }
  },

  // The Spice Route (rest-3)
  {
    id: 'menu-301',
    restaurant_id: 'rest-3',
    name: 'Clean High-Protein Butter Chicken',
    description: 'Tender tandoori chicken breast pieces simmered in a lightened butter tomato sauce made with Greek yogurt and raw honey instead of heavy cream. Served with cauliflower rice.',
    price: 19.99,
    category: 'Curries',
    image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=400',
    macros: { calories: 510, protein: 46, carbs: 14, fat: 28 }
  },
  {
    id: 'menu-302',
    restaurant_id: 'rest-3',
    name: 'Red Lentil Dahl & Sweet Potato Bowl',
    description: 'Creamy yellow and red split-lentil dahl cooked with fresh turmeric, ginger, and garlic. Accompanied by roasted sweet potatoes and fresh spinach.',
    price: 15.99,
    category: 'Bowls',
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=400',
    macros: { calories: 420, protein: 19, carbs: 68, fat: 8 }
  },
  {
    id: 'menu-303',
    restaurant_id: 'rest-3',
    name: 'Spiced Lamb Kebabs & Mint Yogurt',
    description: 'Three flame-grilled lean minced lamb skewers seasoned with cumin, coriander, and chili. Served with a cool mint Greek yogurt sauce and a cucumber tomato salad.',
    price: 21.99,
    category: 'Grills',
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=400',
    macros: { calories: 540, protein: 38, carbs: 8, fat: 36 }
  },

  // Bella Italia (rest-4)
  {
    id: 'menu-401',
    restaurant_id: 'rest-4',
    name: 'Tuscan Garlic Shrimp Pasta',
    description: 'Sautéed jumbo prawns, sun-dried tomatoes, and wild baby spinach tossed with ancient-grain spelt spaghetti in a white wine garlic sauce.',
    price: 22.99,
    category: 'Pasta',
    image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=400',
    macros: { calories: 580, protein: 34, carbs: 62, fat: 18 }
  },
  {
    id: 'menu-402',
    restaurant_id: 'rest-4',
    name: 'Caprese Flatbread Pizza',
    description: 'Stone-baked thin flatbread topped with home-style tomato sauce, buffalo mozzarella slices, vine tomatoes, and finished with fresh basil and aged balsamic glaze.',
    price: 16.99,
    category: 'Pizzas',
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400',
    macros: { calories: 520, protein: 21, carbs: 56, fat: 20 }
  },
  {
    id: 'menu-403',
    restaurant_id: 'rest-4',
    name: 'Grilled Chicken & Pesto Garden Salad',
    description: 'Sliced grilled free-range chicken breast, cherry tomatoes, cucumbers, toasted pine nuts, and shaved parmesan over mixed field greens. Dressed with a home-style basil pesto vinaigrette.',
    price: 17.99,
    category: 'Salads',
    image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=400',
    macros: { calories: 460, protein: 38, carbs: 11, fat: 31 }
  }
];

const SEED_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    restaurant_id: 'rest-1',
    user_id: 'user-2',
    user_name: 'Sophia Green',
    rating: 5,
    comment: 'The Avocado Buddha bowl is delicious and so filling! Love the tahini dressing.',
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    ai_sentiment: {
      sentimentScore: 95,
      positives: ['Delicious taste', 'Generous portion', 'Creamy dressing'],
      negatives: [],
      summary: 'An outstanding review focusing on the flavor, sizing, and specific dressing quality.'
    }
  },
  {
    id: 'rev-2',
    restaurant_id: 'rest-1',
    user_id: 'user-3',
    user_name: 'Dave Miller',
    rating: 4,
    comment: 'Tempeh burger was great, bun was slightly crumbly but avocado was super fresh.',
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    ai_sentiment: {
      sentimentScore: 80,
      positives: ['Great burger', 'Very fresh avocado'],
      negatives: ['Crumbly gluten-free bun'],
      summary: 'Positive feedback regarding the main ingredients, with minor criticism on gluten-free bun texture.'
    }
  },
  {
    id: 'rev-3',
    restaurant_id: 'rest-2',
    user_id: 'user-4',
    user_name: 'Brooke Fit',
    rating: 5,
    comment: 'Finally a place that gets keto! The chimichurri steak is cooked to absolute perfection. Absolute favorite.',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    ai_sentiment: {
      sentimentScore: 98,
      positives: ['Steak cooked perfectly', 'Keto friendliness'],
      negatives: [],
      summary: 'Highly supportive review praising the steak preparation and keto alignment.'
    }
  }
];

const SEED_ORDERS: Order[] = [
  {
    id: 'ord-101',
    user_id: 'cust-123',
    restaurant_id: 'rest-1',
    restaurant_name: 'Vibe & Vegans',
    status: 'delivered',
    total_price: 31.48,
    items: [
      {
        menuItem: SEED_MENU_ITEMS[0],
        quantity: 2
      }
    ],
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    delivery_address: '123 Health Ave, Wellness City',
    driver_id: 'driver-1'
  },
  {
    id: 'ord-102',
    user_id: 'cust-123',
    restaurant_id: 'rest-2',
    restaurant_name: 'Keto Kitchen',
    status: 'delivered',
    total_price: 54.98,
    items: [
      {
        menuItem: SEED_MENU_ITEMS[4], // Ribeye
        quantity: 1
      },
      {
        menuItem: SEED_MENU_ITEMS[5], // Salmon
        quantity: 1
      }
    ],
    created_at: new Date(Date.now() - 2400 * 3600 * 1000).toISOString(),
    delivery_address: '123 Health Ave, Wellness City',
    driver_id: 'driver-1'
  }
];

const SEED_USERS: UserProfile[] = [
  {
    id: 'cust-123',
    email: 'customer@nourish.now',
    name: 'Alex Healthy',
    role: 'customer',
    preferences: {
      diet: 'low-carb',
      targetCalories: 2200,
      allergies: ['peanuts']
    }
  },
  {
    id: 'rest-123',
    email: 'chef@nourish.now',
    name: 'Chef Isabella',
    role: 'restaurant',
    preferences: {
      diet: 'none',
      targetCalories: 2000,
      allergies: []
    }
  },
  {
    id: 'driver-123',
    email: 'driver@nourish.now',
    name: 'Swift Rider',
    role: 'driver',
    preferences: {
      diet: 'none',
      targetCalories: 2500,
      allergies: []
    }
  }
];

const initializeMockDB = () => {
  if (!localStorage.getItem('nn_users')) {
    localStorage.setItem('nn_users', JSON.stringify(SEED_USERS));
  }
  if (!localStorage.getItem('nn_restaurants')) {
    localStorage.setItem('nn_restaurants', JSON.stringify(SEED_RESTAURANTS));
  }
  if (!localStorage.getItem('nn_menu_items')) {
    localStorage.setItem('nn_menu_items', JSON.stringify(SEED_MENU_ITEMS));
  }
  if (!localStorage.getItem('nn_orders')) {
    localStorage.setItem('nn_orders', JSON.stringify(SEED_ORDERS));
  }
  if (!localStorage.getItem('nn_reviews')) {
    localStorage.setItem('nn_reviews', JSON.stringify(SEED_REVIEWS));
  }
};

// Auto hydrate
if (!isRealSupabase) {
  initializeMockDB();
}

const getTableData = (table: string): any[] => {
  const map: Record<string, string> = {
    users: 'nn_users',
    restaurants: 'nn_restaurants',
    menu_items: 'nn_menu_items',
    orders: 'nn_orders',
    reviews: 'nn_reviews'
  };
  return JSON.parse(localStorage.getItem(map[table] || `nn_${table}`) || '[]');
};

const setTableData = (table: string, data: any[]) => {
  const map: Record<string, string> = {
    users: 'nn_users',
    restaurants: 'nn_restaurants',
    menu_items: 'nn_menu_items',
    orders: 'nn_orders',
    reviews: 'nn_reviews'
  };
  localStorage.setItem(map[table] || `nn_${table}`, JSON.stringify(data));
};

const mockClient = {
  auth: {
    signUp: async ({ email, password, options }: any) => {
      await new Promise(r => setTimeout(r, 400));
      const users = getTableData('users');
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { data: { user: null }, error: { message: 'A user with this email already exists.' } };
      }
      const newUser: UserProfile = {
        id: 'usr-' + Math.random().toString(36).substring(2, 11),
        email,
        name: options?.data?.name || email.split('@')[0],
        role: options?.data?.role || 'customer',
        preferences: options?.data?.preferences || { diet: 'none', targetCalories: 2000, allergies: [] }
      };
      users.push(newUser);
      setTableData('users', users);
      localStorage.setItem('nn_session', JSON.stringify({ user: newUser }));
      return { data: { user: newUser, session: { user: newUser } }, error: null };
    },

    signInWithPassword: async ({ email, password }: any) => {
      await new Promise(r => setTimeout(r, 400));
      const users = getTableData('users');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return { data: { user: null, session: null }, error: { message: 'Invalid login credentials. Try: customer@nourish.now, chef@nourish.now, or driver@nourish.now (password: any).' } };
      }
      localStorage.setItem('nn_session', JSON.stringify({ user }));
      return { data: { user, session: { user } }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('nn_session');
      return { error: null };
    },

    getSession: async () => {
      const sessionStr = localStorage.getItem('nn_session');
      if (!sessionStr) return { data: { session: null }, error: null };
      return { data: { session: JSON.parse(sessionStr) }, error: null };
    },

    getUser: async () => {
      const sessionStr = localStorage.getItem('nn_session');
      if (!sessionStr) return { data: { user: null }, error: null };
      return { data: { user: JSON.parse(sessionStr).user }, error: null };
    }
  },

  from: (table: string) => {
    return {
      select: (columns: string = '*') => {
        let list = getTableData(table);
        const chainObj = {
          data: list,
          eq: (col: string, val: any) => {
            chainObj.data = chainObj.data.filter(item => item[col] === val);
            return chainObj;
          },
          neq: (col: string, val: any) => {
            chainObj.data = chainObj.data.filter(item => item[col] !== val);
            return chainObj;
          },
          order: (col: string, { ascending = true } = {}) => {
            chainObj.data = [...chainObj.data].sort((a, b) => {
              if (a[col] < b[col]) return ascending ? -1 : 1;
              if (a[col] > b[col]) return ascending ? 1 : -1;
              return 0;
            });
            return chainObj;
          },
          limit: (n: number) => {
            chainObj.data = chainObj.data.slice(0, n);
            return chainObj;
          },
          single: async () => {
            return { data: chainObj.data[0] || null, error: chainObj.data[0] ? null : { message: 'No item found' } };
          },
          // Allows standard async/await calling directly on select
          then: (onfulfilled?: (value: { data: any[]; error: any }) => any) => {
            const promise = Promise.resolve({ data: chainObj.data, error: null });
            return onfulfilled ? promise.then(onfulfilled) : promise;
          }
        };
        return chainObj;
      },

      insert: (values: any) => {
        let list = getTableData(table);
        const rows = Array.isArray(values) ? values : [values];
        const inserted = rows.map(r => ({
          id: r.id || (table === 'orders' ? 'ord-' : table === 'reviews' ? 'rev-' : 'id-') + Math.random().toString(36).substring(2, 9),
          created_at: new Date().toISOString(),
          ...r
        }));
        list = [...list, ...inserted];
        setTableData(table, list);

        const returnObj = {
          select: () => ({
            single: async () => ({ data: inserted[0], error: null }),
            then: (onfulfilled?: any) => Promise.resolve({ data: inserted, error: null }).then(onfulfilled)
          }),
          then: (onfulfilled?: any) => Promise.resolve({ data: inserted, error: null }).then(onfulfilled)
        };
        return returnObj;
      },

      update: (values: any) => {
        return {
          eq: (col: string, val: any) => {
            let list = getTableData(table);
            let updated: any[] = [];
            list = list.map(item => {
              if (item[col] === val) {
                const u = { ...item, ...values };
                updated.push(u);
                return u;
              }
              return item;
            });
            setTableData(table, list);

            const returnObj = {
              then: (onfulfilled?: any) => Promise.resolve({ data: updated, error: null }).then(onfulfilled)
            };
            return returnObj;
          }
        };
      },

      upsert: (values: any) => {
        let list = getTableData(table);
        const rows = Array.isArray(values) ? values : [values];
        rows.forEach(r => {
          const idx = list.findIndex(x => x.id === r.id);
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...r };
          } else {
            list.push({
              id: r.id || 'id-' + Math.random().toString(36).substring(2, 9),
              created_at: new Date().toISOString(),
              ...r
            });
          }
        });
        setTableData(table, list);
        return {
          then: (onfulfilled?: any) => Promise.resolve({ data: list, error: null }).then(onfulfilled)
        };
      },

      delete: () => {
        return {
          eq: (col: string, val: any) => {
            let list = getTableData(table);
            list = list.filter(item => item[col] !== val);
            setTableData(table, list);
            return {
              then: (onfulfilled?: any) => Promise.resolve({ data: null, error: null }).then(onfulfilled)
            };
          }
        };
      }
    };
  }
};

export const supabase = (isRealSupabase ? realSupabase : mockClient) as any;
