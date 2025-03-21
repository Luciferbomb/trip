import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff, MailIcon, Globe, LockIcon, ArrowRight, UsersRound, MapPin, Compass as CompassIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { scrollToTop } from "@/lib/navigation-utils";

// Create schema for form validation
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  
  // Check if user came from email confirmation
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('confirmed') === 'true') {
      toast({
        title: 'Email confirmed!',
        description: 'Your email has been confirmed. You can now log in.',
      });
    }
  }, [location, toast]);
  
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  // Initialize react-hook-form with zod validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await signIn(data.email, data.password);
      toast({
        title: 'Success',
        description: 'You have been successfully signed in.',
      });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials and try again.');
      setIsLoading(false);
    }
  };
  
  // Scroll to top when login page loads
  useEffect(() => {
    scrollToTop(false);
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full opacity-20 filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600 rounded-full opacity-20 filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {/* Content Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        {/* Logo and App Name */}
        <div className="flex items-center mb-8 fade-in-up visible">
          <Globe className="h-12 w-12 mr-3 text-white" />
          <h1 className="text-5xl font-bold text-white">
            Hireyth
          </h1>
        </div>
        
        <h2 className="text-2xl font-semibold text-white/90 mb-2 text-center fade-in-up visible" style={{ transitionDelay: '150ms' }}>
          Welcome back!
        </h2>
        
        <p className="text-lg text-white/80 mb-8 text-center max-w-md fade-in-up visible" style={{ transitionDelay: '200ms' }}>
          Sign in to continue your journey and connect with fellow travelers
        </p>
        
        {/* Login Form Card */}
        <div className="w-full max-w-md fade-in-up visible" style={{ transitionDelay: '250ms' }}>
          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-500/20 border-red-500/30 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">
                            <MailIcon className="h-5 w-5" />
                          </div>
                          <Input
                            placeholder="Enter your email"
                            className={cn(
                              "bg-white/10 border-white/20 text-white pl-10 h-12 placeholder:text-white/40 focus:border-white focus-visible:ring-1 focus-visible:ring-white rounded-lg",
                              form.formState.errors.email && "border-red-400"
                            )}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">
                            <LockIcon className="h-5 w-5" />
                          </div>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className={cn(
                              "bg-white/10 border-white/20 text-white pl-10 pr-10 h-12 placeholder:text-white/40 focus:border-white focus-visible:ring-1 focus-visible:ring-white rounded-lg",
                              form.formState.errors.password && "border-red-400"
                            )}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/90"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />
                
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-white/70 hover:text-white transition-colors">
                    Forgot password?
                  </Link>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold text-lg h-12 shadow-lg hover:shadow-xl transition-all shadow-black/20 rounded-lg mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span>Sign In</span>
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </div>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-3 gap-4 mt-8 px-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10 flex items-center justify-center group relative">
              <div className="w-10 h-10 bg-blue-500/30 rounded-full flex items-center justify-center">
                <UsersRound className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white rounded-lg px-3 py-1.5 text-sm font-medium text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg">
                Connect with travelers
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10 flex items-center justify-center group relative">
              <div className="w-10 h-10 bg-blue-500/30 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white rounded-lg px-3 py-1.5 text-sm font-medium text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg">
                Discover adventures
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/10 flex items-center justify-center group relative">
              <div className="w-10 h-10 bg-blue-500/30 rounded-full flex items-center justify-center">
                <CompassIcon className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white rounded-lg px-3 py-1.5 text-sm font-medium text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg">
                Explore the world
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center pb-6">
            <p className="text-white/80 text-sm">
              Don't have an account yet?{" "}
              <Link to="/signup" className="text-white hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
