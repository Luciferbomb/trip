import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Trips from "./pages/Trips";
import Profile from "./pages/Profile";
import CreateTrip from "./pages/CreateTrip";
import TripDetails from "./pages/TripDetails";
import NotFound from "./pages/NotFound";
import runMigrations from './lib/migrations';
import AuthProvider, { useAuth } from './lib/auth-context';
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";
import Footer from "./components/Footer";
import About from "./pages/About";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import Explore from "./pages/Explore";
import Onboarding from "./pages/Onboarding";
import { supabase } from "./lib/supabase";
import Search from './pages/Search';
import EditTrip from "./pages/EditTrip";
import Feed from '@/components/Feed';
import Navbar from '@/components/Navbar';
import Notifications from '@/components/Notifications';

// Add the Google Fonts link for Dancing Script font
// This would typically go in the index.html file, but for now we'll add it here
if (!document.getElementById('dancing-script-font')) {
  const link = document.createElement('link');
  link.id = 'dancing-script-font';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap';
  document.head.appendChild(link);
}

const queryClient = new QueryClient();

// Protected route component with onboarding check
const ProtectedRoute = ({ children, requireOnboarding = true }: { children: React.ReactNode, requireOnboarding?: boolean }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error checking onboarding status:', error);
          setIsOnboardingCompleted(false);
        } else {
          setIsOnboardingCompleted(data?.onboarding_completed || false);
        }
      } catch (error) {
        console.error('Error:', error);
        setIsOnboardingCompleted(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };
    
    if (user) {
      checkOnboardingStatus();
    } else {
      setCheckingOnboarding(false);
    }
  }, [user]);
  
  if (loading || checkingOnboarding) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If onboarding is required and not completed, redirect to onboarding
  if (requireOnboarding && isOnboardingCompleted === false) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
};

// Special route for onboarding - only accessible if onboarding is not completed
const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error checking onboarding status:', error);
          setIsOnboardingCompleted(false);
        } else {
          setIsOnboardingCompleted(data?.onboarding_completed || false);
        }
      } catch (error) {
        console.error('Error:', error);
        setIsOnboardingCompleted(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };
    
    if (user) {
      checkOnboardingStatus();
    } else {
      setCheckingOnboarding(false);
    }
  }, [user]);
  
  if (loading || checkingOnboarding) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If onboarding is already completed, redirect to trips
  if (isOnboardingCompleted) {
    return <Navigate to="/trips" replace />;
  }
  
  return <>{children}</>;
};

const AppHeader = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-hireyth-main">
          Hireyth
        </Link>
        {user && (
          <div className="flex items-center space-x-4">
            <Notifications />
          </div>
        )}
      </div>
    </header>
  );
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return null; // Don't show loading state for initial auth check
  }
  
  if (!user) {
    return <LandingPage />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  
  useEffect(() => {
    const initDb = async () => {
      try {
        const success = await runMigrations();
        setIsDbInitialized(success);
        if (!success) {
          setDbError('Database initialization failed. Some features may not work properly.');
        }
      } catch (error) {
        setDbError('Unexpected error initializing database. Some features may not work properly.');
        setIsDbInitialized(false);
      }
    };
    
    initDb();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {dbError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Database Error:</strong>
          <span className="block sm:inline"> {dbError}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" onClick={() => setDbError(null)}>
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </span>
        </div>
      )}
      <div className="flex-grow px-4 pt-4">
        <Routes>
          <Route path="/" element={
            <AuthRoute>
              <Feed />
            </AuthRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
          <Route path="/trips" element={<ProtectedRoute><Trips /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><CreateTrip /></ProtectedRoute>} />
          <Route path="/trips/:id" element={<ProtectedRoute><TripDetails /></ProtectedRoute>} />
          <Route path="/trips/:id/edit" element={<ProtectedRoute><EditTrip /></ProtectedRoute>} />
          <Route path="/experiences" element={<ProtectedRoute><div>Experiences Page Coming Soon</div></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => {
  const { user } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50">
              <div className="max-w-md mx-auto">
                <AppHeader />
                <AppRoutes />
              </div>
              {user && <Navbar />}
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
