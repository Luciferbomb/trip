import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Separator } from "@/components/ui/separator";

// Create schema for form validation
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  
  // Check if user came from email confirmation
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const confirmed = query.get('confirmed');
    
    if (confirmed === 'true') {
      toast({
        title: 'Email confirmed!',
        description: 'Your email has been confirmed. You can now sign in.',
      });
    }
    
    // Show email form immediately if we have the confirmed param
    if (confirmed) {
      setShowEmailForm(true);
    }
  }, [location, toast]);
  
  // Initialize react-hook-form with zod validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to sign in',
          variant: 'destructive',
        });
        return;
      }
      
      // Check if user has completed onboarding
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user?.id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching user data:', fetchError);
        navigate('/onboarding');
        return;
      }
      
      // Navigate based on onboarding status
      if (userData && userData.onboarding_completed) {
        navigate('/trips');
      } else {
        navigate('/onboarding');
      }
      
      toast({
        title: 'Welcome back!',
        description: 'You have been successfully signed in.',
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle OAuth logins
  const handleSocialLogin = (provider: string) => {
    toast({
      title: 'Not Implemented',
      description: `${provider} login is not implemented in this demo`,
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="p-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => showEmailForm ? setShowEmailForm(false) : navigate('/')}
          className="w-10 h-10"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <div className="w-16 h-16 rounded-full bg-hireyth-main flex items-center justify-center mb-6">
          <span className="font-['Dancing_Script'] text-2xl font-bold text-white">TM</span>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Log in to Hireyth</h1>
        <p className="text-gray-600 text-sm mb-8">Welcome back! Please sign in to continue</p>
        
        {showEmailForm ? (
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email address" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Password</FormLabel>
                          <Link to="/reset-password" className="text-xs text-hireyth-main hover:underline">
                            Forgot password?
                          </Link>
                        </div>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter your password" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-hireyth-main hover:bg-hireyth-main/90" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Signing In...
                      </>
                    ) : "Sign In"}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-6">
                <Separator className="my-4" />
                
                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/signup" className="font-medium text-hireyth-main hover:text-hireyth-main/90">
                    Sign Up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 space-y-4">
              <Button 
                className="w-full bg-[#4285F4] hover:bg-[#4285F4]/90 text-white"
                onClick={() => handleSocialLogin('Google')}
              >
                Continue with Google
              </Button>
              
              <Button 
                className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
                onClick={() => handleSocialLogin('Facebook')}
              >
                Continue with Facebook
              </Button>
              
              <Button 
                className="w-full bg-black hover:bg-black/90 text-white"
                onClick={() => handleSocialLogin('Apple')}
              >
                Continue with Apple
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowEmailForm(true)}
              >
                Continue with email
              </Button>
              
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-hireyth-main hover:underline font-medium">
                    Sign Up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="py-4 px-6 text-center text-xs text-gray-500 border-t border-gray-100 bg-white">
        By continuing, you agree to Hireyth's Terms of Service and Privacy Policy.
      </div>
    </div>
  );
};

export default Login;
