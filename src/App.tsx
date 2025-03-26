/**
 * App.tsx - Main application component and routing
 * 
 * FORCE REBUILD: 2023-07-23T10:25:00Z - CLEAR CACHE NOW
 * 
 * Fixed imports:
 * - Updated to use runMigrations from ./lib/migrations instead of ./lib/migration
 * - Added local scrollToTop implementation instead of importing from utils
 * - Updated the Feed import to use the component from ./components/Feed
 * - Using custom ToastProvider instead of react-hot-toast package
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BrowserRouter as Router } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { runMigrations } from './lib/migrations';
import { cn } from './lib/utils';
import { AuthProvider, useAuth } from './lib/auth-context';
import ToastProvider from './components/ToastProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/Header';
import DesktopRestriction from './components/DesktopRestriction';
import { Toaster } from './components/ui/toaster';

// Simple scrollToTop function
const scrollToTop = (smooth = true) => {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
};

// Import Pages
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Onboarding from './pages/Onboarding';
import ResetPassword from './pages/ResetPassword';
import EmailConfirmation from './pages/EmailConfirmation';
import NotFound from './pages/NotFound';
import Trips from './pages/Trips';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Index from './pages/Index';
import TripDetails from './pages/TripDetails';
import CreateTrip from './pages/CreateTrip';
import EditTrip from './pages/EditTrip';
import Notifications from './components/Notifications';
import LandingPage from './pages/LandingPage';
import Feed from './components/Feed';
import Experiences from './pages/Experiences';
import Search from './pages/Search';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import { BottomNav } from './components/BottomNav';
import ChatDemo from './pages/ChatDemo';
import Debug from './pages/debug';
import UIShowcase from './pages/ui-showcase';
import AdminPanel from "./pages/AdminPanel";

// Create a client for react-query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5min
    },
  },
});

// Error Boundary component to catch rendering errors
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="mb-4 text-gray-700">
              There was an error rendering the application. Please try refreshing the page.
            </p>
            <div className="mb-4">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Refresh Page
              </button>
            </div>
            <details className="mt-4 border border-gray-200 rounded p-2">
              <summary className="cursor-pointer text-sm text-gray-600">Technical Details</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {this.state.error?.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Add the Google Fonts link for Dancing Script font
// This would typically go in the index.html file, but for now we'll add it here
if (!document.getElementById('dancing-script-font')) {
  const link = document.createElement('link');
  link.id = 'dancing-script-font';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap';
  document.head.appendChild(link);
}

// Reusable loading component
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <div className="relative">
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse blur-md opacity-75"></div>
      <svg className="w-12 h-12 animate-spin text-blue-600 relative" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
    <p className="text-gray-600 mt-4 font-medium">Loading...</p>
  </div>
);

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
        setCheckingOnboarding(true);
        
        const { data, error } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error checking onboarding status:', error);
          // Default to false to ensure safety if we can't determine status
          setIsOnboardingCompleted(false);
        } else {
          // Check if data exists before accessing properties
          const onboardingStatus = data?.onboarding_completed ?? false;
          setIsOnboardingCompleted(onboardingStatus);
          
          // If not onboarded and route requires onboarding, pre-emptively navigate to onboarding
          if (requireOnboarding && !onboardingStatus) {
            navigate('/onboarding', { replace: true });
          }
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
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
  }, [user, navigate, requireOnboarding]);
  
  if (loading || checkingOnboarding) {
    return <LoadingScreen />;
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
        setCheckingOnboarding(true);
        
        const { data, error } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error checking onboarding status:', error);
          // Default to false to ensure user can access onboarding
          setIsOnboardingCompleted(false);
        } else {
          // Check if data exists before accessing properties
          const onboardingStatus = data?.onboarding_completed ?? false;
          setIsOnboardingCompleted(onboardingStatus);
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
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
    return <LoadingScreen />;
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

// Page transition component
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

const AppRoutes = () => {
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const { user, loading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    const initDb = async () => {
      try {
        // Check if migrations have already run in this session
        const lastMigrationTime = localStorage.getItem('hireyth_db_migration_time');
        const currentTime = Date.now();
        const oneHourMs = 60 * 60 * 1000;
        
        // Get app version - using package.json version or a fixed value
        const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
        const lastAppVersion = localStorage.getItem('hireyth_app_version');
        
        // Only run migrations if:
        // 1. No previous migration has been recorded, or
        // 2. It's been more than an hour since last migration, or
        // 3. App version has changed
        const shouldRunMigrations = 
          !lastMigrationTime || 
          (currentTime - parseInt(lastMigrationTime, 10)) > oneHourMs ||
          lastAppVersion !== appVersion;
          
        let success = true;
        
        if (shouldRunMigrations) {
          console.log('Running database migrations...');
          success = await runMigrations();
          
          // Store the migration timestamp and app version
          if (success) {
            localStorage.setItem('hireyth_db_migration_time', currentTime.toString());
            localStorage.setItem('hireyth_app_version', appVersion);
          }
        } else {
          console.log('Skipping database migrations - already run recently');
        }
        
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

  useEffect(() => {
    // Scroll to top on route changes
    const handleRouteChange = () => {
      scrollToTop(false);
    };
    
    // Handle initial page load
    handleRouteChange();
    
    // Add event listener
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return (
    <>
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
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            user ? (
              <PageTransition>
                <Feed />
              </PageTransition>
            ) : (
              <PageTransition>
                <LandingPage />
              </PageTransition>
            )
          } />
          <Route path="/login" element={
            <PageTransition>
              <Login />
            </PageTransition>
          } />
          <Route path="/signup" element={
            <PageTransition>
              <SignUp />
            </PageTransition>
          } />
          <Route path="/reset-password" element={
            <PageTransition>
              <ResetPassword />
            </PageTransition>
          } />
          <Route path="/email-confirmation" element={
            <PageTransition>
              <EmailConfirmation />
            </PageTransition>
          } />
          <Route path="/onboarding" element={
            <OnboardingRoute>
              <PageTransition>
                <Onboarding />
              </PageTransition>
            </OnboardingRoute>
          } />
          <Route path="/trips" element={
            <ProtectedRoute>
              <PageTransition>
                <Trips />
              </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <PageTransition>
                <Profile />
              </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/profile/:username" element={
            <ProtectedRoute>
              <PageTransition>
                <Profile />
              </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/create" element={
            <ProtectedRoute>
              <PageTransition>
                <CreateTrip />
              </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/trips/:id" element={
            <ProtectedRoute>
              <PageTransition>
                <TripDetails />
              </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/trips/:id/edit" element={
            <ProtectedRoute>
              <PageTransition>
                <EditTrip />
              </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/experiences" element={
            <ProtectedRoute>
              <PageTransition>
                <Experiences />
              </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/explore" element={
            <ProtectedRoute requireOnboarding={false}>
              <PageTransition>
                <Explore />
              </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/about" element={
            <PageTransition>
              <About />
            </PageTransition>
          } />
          <Route path="/terms" element={
            <PageTransition>
              <Terms />
            </PageTransition>
          } />
          <Route path="/privacy" element={
            <PageTransition>
              <Privacy />
            </PageTransition>
          } />
          <Route path="/contact" element={
            <PageTransition>
              <Contact />
            </PageTransition>
          } />
          <Route path="/search" element={
            <ProtectedRoute>
              <PageTransition>
                <Search />
              </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/chat-demo" element={
            <PageTransition>
              <ChatDemo />
            </PageTransition>
          } />
          <Route path="/debug" element={
            <PageTransition>
              <Debug />
            </PageTransition>
          } />
          <Route path="/ui-showcase" element={
            <PageTransition>
              <UIShowcase />
            </PageTransition>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          } />
          <Route path="*" element={
            <PageTransition>
              <NotFound />
            </PageTransition>
          } />
        </Routes>
      </AnimatePresence>
    </>
  );
};

const AppContent = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Header - only shown once at the app level */}
      {user && <Header />}
      <main className={cn(
        "w-full mx-auto",
        user ? "pt-16 pb-24" : "" // Add padding top when header is present
      )}>
        <div className="max-w-7xl mx-auto px-4">
          <AppRoutes />
        </div>
      </main>
      {/* Bottom navigation - only shown when user is logged in */}
      {user && <BottomNav />}
    </div>
  );
};

const App = () => {
  const [migrationChecked, setMigrationChecked] = useState(false);
  
  // Check database tables on app start - but only check once
  useEffect(() => {
    // If migrations were already checked in this session, don't run again
    const migrationCheckKey = 'hireyth_migration_check';
    const alreadyChecked = sessionStorage.getItem(migrationCheckKey);
    
    if (alreadyChecked) {
      console.log('Skipping database migration check - already performed in this session');
      setMigrationChecked(true);
      return;
    }
    
    const checkDatabase = async () => {
      try {
        console.log('Checking database tables on app start...');
        await runMigrations(false);
        console.log('Database migration check completed');
        
        // Mark as checked for this session
        sessionStorage.setItem(migrationCheckKey, 'true');
      } catch (error) {
        console.error('Error during database migration check:', error);
      } finally {
        setMigrationChecked(true);
      }
    };
    
    checkDatabase();
  }, []);
  
  if (!migrationChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <ErrorBoundary>
              <DesktopRestriction>
                <AppContent />
              </DesktopRestriction>
            </ErrorBoundary>
          </Router>
        </AuthProvider>
      </ToastProvider>
      <Toaster />
    </QueryClientProvider>
  );
};

export default App;
