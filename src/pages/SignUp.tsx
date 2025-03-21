import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Globe, User, Mail, LockIcon, ArrowRight, UsersRound, MapPin, Compass } from "lucide-react";

// Create schema for form validation
const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [signupCompleted, setSignupCompleted] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize react-hook-form with zod validation
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true);
    
    try {
      const { error, user } = await signUp(data.email, data.password, {
        name: data.name,
        username: data.username.toLowerCase()
      });
      
      if (error) {
        console.error('Sign-up error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to create account. Please try again.',
          variant: 'destructive'
        });
        return;
      }
      
      // Set signup as completed to show success state
      setSignupCompleted(true);
      
      toast({
        title: 'Account created successfully!',
        description: 'You can now sign in to your account.',
      });
      
      // Auto-redirect to login after delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If signup is completed, show success message
  if (signupCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Account Created!</CardTitle>
            <CardDescription className="text-center">
              Your account has been successfully created.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="rounded-full bg-green-100 p-3">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8 text-green-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
            <p className="mt-4 text-center text-gray-600">
              You're all set! You will be redirected to the login page in a moment.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700">
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
          Create your account
        </h2>
        
        <p className="text-lg text-white/80 mb-8 text-center max-w-md fade-in-up visible" style={{ transitionDelay: '200ms' }}>
          Join Hireyth and start your travel journey
        </p>

        {/* Sign Up Form */}
        <div className="w-full max-w-md fade-in-up visible" style={{ transitionDelay: '250ms' }}>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm font-medium">Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">
                            <User className="h-5 w-5" />
                          </div>
                          <Input 
                            placeholder="Enter your full name" 
                            className="bg-white/10 border-white/20 text-white pl-10 h-12 placeholder:text-white/40 focus:border-white focus-visible:ring-1 focus-visible:ring-white rounded-lg"
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
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm font-medium">Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">
                            <User className="h-5 w-5" />
                          </div>
                          <Input 
                            placeholder="Choose a username" 
                            className="bg-white/10 border-white/20 text-white pl-10 h-12 placeholder:text-white/40 focus:border-white focus-visible:ring-1 focus-visible:ring-white rounded-lg"
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-white/60 mt-1">
                        3-20 characters, letters, numbers, and underscores only
                      </p>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">
                            <Mail className="h-5 w-5" />
                          </div>
                          <Input 
                            type="email" 
                            placeholder="Enter your email address" 
                            className="bg-white/10 border-white/20 text-white pl-10 h-12 placeholder:text-white/40 focus:border-white focus-visible:ring-1 focus-visible:ring-white rounded-lg"
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
                            type="password" 
                            placeholder="Create a password" 
                            className="bg-white/10 border-white/20 text-white pl-10 h-12 placeholder:text-white/40 focus:border-white focus-visible:ring-1 focus-visible:ring-white rounded-lg"
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm font-medium">Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">
                            <LockIcon className="h-5 w-5" />
                          </div>
                          <Input 
                            type="password" 
                            placeholder="Confirm your password" 
                            className="bg-white/10 border-white/20 text-white pl-10 h-12 placeholder:text-white/40 focus:border-white focus-visible:ring-1 focus-visible:ring-white rounded-lg"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-300" />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold text-lg h-12 shadow-lg hover:shadow-xl transition-all shadow-black/20 rounded-lg mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span>Create Account</span>
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
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white rounded-lg px-3 py-1.5 text-sm font-medium text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg">
                Explore the world
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center pb-6">
            <p className="text-white/80 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-white hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 