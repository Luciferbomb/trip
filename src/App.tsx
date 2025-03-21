/**
 * App.tsx - Main application component and routing
 * 
 * FORCE REBUILD: 2023-07-23T10:25:00Z - CLEAR CACHE NOW
 * 
 * Fixed imports:
 * - Updated to use runMigrations from ./lib/migrations instead of ./lib/migration
 * - Added local scrollToTop implementation instead of importing from utils
 * - Updated the Feed import to use the component from ./components/Feed
 * - Installed react-hot-toast package for toast notifications
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BrowserRouter as Router } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { supabase } from './lib/supabase';
import runMigrations from './lib/migrations';
import { cn } from './lib/utils';
import { AuthProvider, useAuth } from './lib/auth-context';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppHeader from '@/components/AppHeader';
import DesktopRestriction from './components/DesktopRestriction';

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

// Create a client for react-query
const queryClient = new QueryClient();

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
    <div className="min-h-screen bg-gray-50">
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
              <ProtectedRoute>
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
            <Route path="*" element={
              <PageTransition>
                <NotFound />
              </PageTransition>
            } />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global AppHeader - only shown once at the app level */}
      {user && <AppHeader />}
      <div className="max-w-md mx-auto">
        <div className={user ? 'pb-24' : ''}>
          <AppRoutes />
        </div>
      </div>
      {/* Bottom navigation - only shown when user is logged in */}
      {user && <BottomNav />}
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <AuthProvider>
        <Router>
          <ErrorBoundary>
            <DesktopRestriction>
              <AppContent />
            </DesktopRestriction>
          </ErrorBoundary>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
