import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, MailIcon, UserIcon, LockIcon, Globe, ArrowRight, CheckCircle2, BarChart3, CalendarDays, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { scrollToTop } from "@/lib/navigation-utils";
import { supabase } from "@/lib/supabase";
import { resendConfirmationEmail } from "@/lib/supabase";

// Create schema for form validation
const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signUpCompleted, setSignUpCompleted] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");
  const [resendingEmail, setResendingEmail] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Initialize react-hook-form with zod validation
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  useEffect(() => {
    scrollToTop(false);
  }, []);
  
  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First check if the email already exists
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: "random_temp_password_check",
      });
      
      // If there's no generic "invalid credentials" error, it likely means the email exists
      if (signInError && !signInError.message.includes("Invalid login credentials")) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }
      
      // If we got a user back or a auth/user-not-found error wasn't thrown, email exists
      if (signInData.user) {
        setError("This email is already registered. Please use the login page instead.");
        setIsLoading(false);
        return;
      }
      
      // Proceed with signup if email doesn't exist
      const { error, user } = await signUp(data.email, data.password, {});
      
      if (error) {
        // Handle specific error cases more explicitly
        if (error.message?.includes("already registered") || 
            error.message?.includes("already exists")) {
          setError("This email is already registered. Please try signing in instead.");
        } else {
          setError(error.message || 'Failed to sign up. Please try again.');
        }
        setIsLoading(false);
        return;
      }
      
      setRegisteredEmail(data.email);
      setSignUpCompleted(true);
      
      toast({
        title: 'Account Created',
        description: 'Please check your email to confirm your account before logging in.',
      });
    } catch (err: any) {
      console.error('SignUp error:', err);
      setError(err.message || 'Failed to sign up. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleResendConfirmation = async () => {
    if (!registeredEmail) {
      toast({
        title: 'Error',
        description: 'Email address not found. Please try signing up again.',
        variant: 'destructive'
      });
      return;
    }

    setResendingEmail(true);
    
    try {
      // Use the enhanced resendConfirmationEmail function
      const { error } = await resendConfirmationEmail(registeredEmail);
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to resend confirmation email. Please try again.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Email Sent',
          description: 'Confirmation email has been resent. Please check your inbox (including spam folder).',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setResendingEmail(false);
    }
  };
  
  if (signUpCompleted) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full opacity-20 filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full opacity-20 filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-purple-500 rounded-full opacity-10 filter blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute bottom-1/3 left-1/3 w-60 h-60 bg-blue-400 rounded-full opacity-10 filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Content Container */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
          <div className="glassmorphism-card p-8 w-full max-w-md text-center">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg mb-4">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Email Confirmation Sent</h1>
              <p className="text-white/80 mb-6">
                We've sent a confirmation link to <span className="font-semibold">{registeredEmail || "your email address"}</span>. Please check your inbox and click the link to activate your account.
              </p>
              
              <div className="bg-white/10 p-4 rounded-lg mb-6 text-left">
                <h3 className="text-white font-medium mb-2">Important Information:</h3>
                <ul className="text-white/80 text-sm space-y-2">
                  <li>• The confirmation email may take a few minutes to arrive</li>
                  <li>• Please check your spam/junk folder if you don't see it</li>
                  <li>• The confirmation link will expire after 24 hours</li>
                  <li>• You must confirm your email before you can log in</li>
                </ul>
              </div>
              
              <div className="flex flex-col space-y-3 w-full">
                <Button 
                  variant="sleek"
                  className="w-full font-semibold rounded-lg"
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-white border-white/30 hover:bg-white/10"
                  onClick={handleResendConfirmation}
                  disabled={resendingEmail}
                >
                  {resendingEmail ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Resending...</span>
                    </div>
                  ) : (
                    "Resend Confirmation Email"
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => setSignUpCompleted(false)}
                >
                  Back to Sign Up
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full opacity-20 filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full opacity-20 filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-purple-500 rounded-full opacity-10 filter blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-60 h-60 bg-blue-400 rounded-full opacity-10 filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Content Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        {/* Logo and App Name */}
        <div className="flex items-center mb-8 fade-in-up visible relative group">
          <div className="absolute -inset-4 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-700"></div>
          <Globe className="h-12 w-12 mr-3 text-white relative z-10" />
          <h1 className="text-5xl font-bold text-white relative z-10 animated-gradient-text">
            Hireyth
          </h1>
        </div>
        
        <h2 className="text-2xl font-semibold text-white/90 mb-2 text-center fade-in-up visible" style={{ transitionDelay: '150ms' }}>
          Join our community
        </h2>
        
        <p className="text-lg text-white/80 mb-8 text-center max-w-md fade-in-up visible" style={{ transitionDelay: '200ms' }}>
          Create an account to start sharing your journeys and connect with like-minded travelers
        </p>
        
        {/* Why Join Section - New Feature Cards */}
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 fade-in-up visible" style={{ transitionDelay: '220ms' }}>
          <div className="glassmorphism-card p-4 flex flex-col items-center text-center group hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg mb-3">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">Share Experiences</h3>
            <p className="text-sm text-white/70">Document your adventures and inspire others</p>
          </div>
          
          <div className="glassmorphism-card p-4 flex flex-col items-center text-center group hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg mb-3">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">Track Progress</h3>
            <p className="text-sm text-white/70">Monitor your journey stats and achievements</p>
          </div>
          
          <div className="glassmorphism-card p-4 flex flex-col items-center text-center group hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg mb-3">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">Plan Trips</h3>
            <p className="text-sm text-white/70">Organize your next adventure with fellow travelers</p>
          </div>
        </div>
        
        {/* SignUp Form Card */}
        <div className="w-full max-w-md fade-in-up visible" style={{ transitionDelay: '250ms' }}>
          {error && (
            <Alert variant="destructive" className="mb-6 glassmorphism-card bg-red-500/10 border-red-400/30 text-white">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="glassmorphism-card p-8">
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
                              "glass-button pl-10 h-12 placeholder:text-white/40 text-white focus:border-white/40 focus-visible:ring-1 focus-visible:ring-white/50 modern-focus rounded-lg border-white/40",
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
                              "glass-button pl-10 pr-10 h-12 placeholder:text-white/40 text-white focus:border-white/40 focus-visible:ring-1 focus-visible:ring-white/50 modern-focus rounded-lg border-white/40",
                              form.formState.errors.password && "border-red-400"
                            )}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/90 transition-colors"
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
                
                <Button
                  type="submit"
                  variant="sleek"
                  className="w-full font-semibold text-lg h-12 rounded-lg mt-2 relative overflow-hidden group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center relative z-10">
                      <span>Sign Up</span>
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  )}
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 text-white/60 bg-blue-600/30 backdrop-blur-sm rounded">or</span>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center glass-button border-white/30 hover:bg-white/10 text-white h-12 rounded-lg"
                  onClick={() => navigate('/login')}
                >
                  <span>Already have an account?</span>
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          </div>
          
          <div className="mt-6 text-center pb-6">
            <p className="text-white/80 text-sm">
              By signing up, you agree to our{" "}
              <Link to="/terms" className="text-white hover:text-blue-300 font-medium transition-colors">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-white hover:text-blue-300 font-medium transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 