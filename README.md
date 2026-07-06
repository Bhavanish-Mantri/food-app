# 🥗 NourishNow AI

NourishNow AI is a premium, high-fidelity, AI-driven nutrition tracking and food delivery web application. It combines real-time nutrition science, predictive machine learning recommendations, and interactive order-building into a single, seamless digital product. 

Designed with rich visual aesthetics, glassmorphism, responsive navigation drawers, and fluid shimmer skeleton loading screens, NourishNow AI demonstrates how modern wellness goals can integrate naturally with standard food ordering workflows.

---

## 🚀 Key Features

*   **Premium Startup Homepage**: Clean, search-focused jumbotron banner, interactive mood chips, quick filters, and elegant micro-animations.
*   **Complete Restaurant Portal**: Interactive menu categories, veg/non-veg filter pills, and a real-time review sentiment tracking suite.
*   **High-Fidelity Skeleton Loaders**: Fluid shimmer animation layout blocks that mirror page grids to prevent layout shifts.
*   **Driver & Chef Dashboards**: Simulators for the end-to-end delivery lifecycle, tracking orders from "Pending Acceptance" to "Cooking", "Ready for Pickup", and "Delivered".
*   **Nutrition Dashboard & Monthly Analytics**: Dynamic Recharts visualizations tracking Daily, Weekly, and Monthly targets for calories, protein, carbs, fat, and budget spending.
*   **One-Click Excel Reports**: Direct client-side generation of fully structured spreadsheet logs containing dates, meals, restaurant details, macros, prices, and health scores.

---

## 🧠 Core AI Systems

### 1. Nourish Coach (AI Assistant)
An interactive floating chat assistant (`AIChatSidebar.tsx`) backed by **Gemini 3.1 Pro**.
*   **Natural Language Interaction**: Understands diet preferences, target limits, protein goals, budgets, and allergies.
*   **Direct Cart Action Integration**: The model can issue background actions to dynamically append or remove items from the checkout cart in real time based on conversation context.

### 2. Contextual AI Recommendation Engine
Uses a custom scoring matrix (`CustomerHome.tsx`) to generate personalized food suggestions:
*   **Context Factors**: Considers simulated current time, weather conditions, active user mood chips, budget constraints, delivery speeds, and previous orders.
*   **Explanation & Trust**: Displays confidence scores alongside visual reasoning cards explaining exactly *why* each meal fits the current profile.

### 3. Smart Offer & Coupon Engine
Triggers custom coupon rewards (`NutritionDashboard.tsx`) linked to biological needs:
*   **Protein Booster**: Triggers discounts on protein-heavy entrees if the user's daily protein log drops below target thresholds.
*   **Low Calorie Treat / Combo Swaps**: Promotes healthy options, enabling users to swap low-nutrition sides for nutrient-dense ones.

### 4. AI Clinical Macro Evaluation
Performs automatic checkout-level audit checks (`Checkout.tsx`) preventing nutrition violations:
*   **Carb Restrictions**: Automatically alerts and blocks items with >15g carbs on Keto or >30g carbs on Low-Carb diets, outputting dynamic, clear explanations of exactly where the violation occurs.

---

## 🛠️ Tech Stack

*   **Frontend**: React 19 (Hooks, Context Architecture), TypeScript, Vite
*   **Styling**: Tailwind CSS v4, Lucide Icons, Google Fonts (Inter, Outfit)
*   **Database & Auth**: Supabase JS Client (Mock Auth & Storage seed integration)
*   **Large Language Model**: Gemini API (`@google/generative-ai`)
*   **Charts & Visuals**: Recharts (Responsive Area, Bar, and Line charts)

---

## 📁 Folder Structure

```text
food-app/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI Components
│   │   ├── AIChatSidebar.tsx       # AI Coach drawer & backdrop
│   │   ├── CustomizerModal.tsx     # AI ingredient adjustment
│   │   └── Navbar.tsx              # Mobile responsive navigation
│   ├── context/            # Global React Contexts
│   │   ├── AuthContext.tsx         # Session & User Profile
│   │   └── CartContext.tsx         # Order state management
│   ├── pages/              # Application Pages
│   │   ├── CustomerHome.tsx        # Homepage & Rec Engine
│   │   ├── RestaurantDetails.tsx   # Menus, Reviews, & Skeletons
│   │   ├── Checkout.tsx            # Macro-aware checkout
│   │   ├── NutritionDashboard.tsx  # Logs, Swaps, & Coupons
│   │   ├── MonthlyAnalytics.tsx    # Charts & Excel export
│   │   ├── RestaurantDashboard.tsx # Kitchen Simulator
│   │   ├── DriverDashboard.tsx     # Delivery Simulator
│   │   └── Login.tsx               # Redirection portal
│   ├── services/           # External API & Client Configs
│   │   ├── supabase.ts             # Supabase Client & Mock DB
│   │   └── gemini.ts               # LLM system prompts
│   ├── types/              # TS interface definitions
│   │   └── database.ts
│   ├── index.css           # Custom styling classes
│   └── main.tsx            # React initialization
├── package.json
└── vite.config.ts
```

---

## ⚙️ Installation & Setup

### Prerequisites
*   Node.js (v18.0.0 or higher)
*   NPM or Yarn package manager

### 1. Clone the repository
```bash
git clone https://github.com/your-username/nourishnow-ai.git
cd nourishnow-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```
By default, the application will spin up at `http://localhost:5173/` (or the next available port).

---

## 🔑 Environment Variables

To enable the real **Gemini AI** model responses, create a `.env` file in the root directory:

```env
# Gemini API Key for Nutritionist Chat & Review Analysis
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Credentials (Optional for production sync)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

*Note: If no Gemini API Key is specified, the application seamlessly falls back to a highly realistic rules-based mockup engine, ensuring full offline functionality and zero page breaks during demos.*

---

## 📸 Screenshots Placeholder

| Homepage (Skeleton Loaders) | AI Chat Coach (Backdrop Mode) |
|---|---|
| ![Homepage Skeleton Placeholder](https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400) | ![Coach Sidebar Placeholder](https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=400) |

| Nutrition Dashboard (Recharts) | Checkout Evaluation (Conflict Check) |
|---|---|
| ![Nutrition Dashboard Placeholder](https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=400) | ![Checkout Warning Placeholder](https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&q=80&w=400) |

---

## 🔮 Future Improvements

1.  **Production Supabase Sync**: Transition user state from local mock storage databases directly to live hosted Supabase PostgreSQL instances.
2.  **Extended Zod Schema Validations**: Integrate Zod schemas into the driver/restaurant registry forms to reinforce visual error feedback.
3.  **Real-Time Geolocation Tracking**: Connect MapBox APIs to the Driver portal to calculate exact delivery durations.
4.  **Multi-Language AI Coach**: Support voice dictation and localization responses in the AI Chat Assistant.

---

## 📦 Deployment

### Building for Production
To generate a compiled production bundle, execute:
```bash
npm run build
```
This generates a static output directory (`/dist`) optimized for hosting on platforms like Vercel, Netlify, or AWS Amplify.

### Deploying to Vercel (One-Click)
1. Install Vercel CLI: `npm i -g vercel`
2. Run command: `vercel`
3. Configure the environment variables inside your Vercel Dashboard project settings.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
