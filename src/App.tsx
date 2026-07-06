import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { AIChatSidebar } from './components/AIChatSidebar';

// Pages
import { Login } from './pages/Login';
import { CustomerHome } from './pages/CustomerHome';
import { RestaurantDetails } from './pages/RestaurantDetails';
import { Checkout } from './pages/Checkout';
import { RestaurantDashboard } from './pages/RestaurantDashboard';
import { DriverDashboard } from './pages/DriverDashboard';
import { NutritionDashboard } from './pages/NutritionDashboard';
import { MonthlyAnalytics } from './pages/MonthlyAnalytics';

// Helper component to redirect based on user role
const RoleBasedHome = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <span className="w-8 h-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></span>
        <span className="text-xs text-neutral-400">Restoring your session...</span>
      </div>
    );
  }

  if (user?.role === 'restaurant') {
    return <Navigate to="/restaurant-dashboard" replace />;
  }
  if (user?.role === 'driver') {
    return <Navigate to="/driver-dashboard" replace />;
  }
  return <CustomerHome />;
};

// Protected routes wrapper for safety
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <span className="w-8 h-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></span>
        <span className="text-xs text-neutral-400">Authorizing...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 flex flex-col transition-colors duration-200">
      <Navbar onToggleCart={() => setIsCartOpen(!isCartOpen)} />
      
      <main className="flex-1 w-full relative">
        <Routes>
          {/* Public / Role-Based Homepage */}
          <Route path="/" element={<RoleBasedHome />} />
          
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          
          {/* Restaurant Menu */}
          <Route path="/restaurant/:id" element={<RestaurantDetails />} />
          
          {/* Checkout (needs login) */}
          <Route 
            path="/checkout" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Checkout />
              </ProtectedRoute>
            } 
          />
          
          {/* Nutrition Analytics (needs login) */}
          <Route 
            path="/nutrition-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <NutritionDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Monthly Analytics (needs login) */}
          <Route 
            path="/monthly-analytics" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <MonthlyAnalytics />
              </ProtectedRoute>
            } 
          />
          
          {/* Chef Portal (needs restaurant role) */}
          <Route 
            path="/restaurant-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['restaurant']}>
                <RestaurantDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Driver Simulator Portal (needs driver role) */}
          <Route 
            path="/driver-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Cart & AI Nutritionist Coach Sidebar */}
      <AIChatSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
