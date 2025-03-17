import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please enter both email and password',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to sign in',
          variant: 'destructive',
        });
      } else {
        // Check if user has completed onboarding
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user?.id)
          .single();
          
        if (fetchError) {
          console.error('Error fetching user data:', fetchError);
          navigate('/onboarding');
        } else if (data && data.onboarding_completed) {
          navigate('/trips');
        } else {
          navigate('/onboarding');
        }
      }
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
  
  // These would be implemented with actual OAuth providers in a real app
  const handleSocialLogin = (provider: string) => {
    toast({
      title: 'Not Implemented',
      description: `${provider} login is not implemented in this demo`,
    });
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
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
      
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 rounded-full bg-hireyth-main flex items-center justify-center mb-6">
          <span className="font-['Dancing_Script'] text-2xl font-bold text-white">TM</span>
        </div>
        
        <h1 className="text-2xl font-bold mb-8">Log in to Hireyth</h1>
        
        {showEmailForm ? (
          <div className="w-full max-w-xs">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/reset-password" className="text-xs text-hireyth-main hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-hireyth-main hover:bg-hireyth-main/90"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
              
              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-hireyth-main hover:underline font-medium">
                    Sign Up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        ) : (
          <div className="w-full max-w-xs space-y-4">
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
          </div>
        )}
      </div>
      
      <div className="p-6 text-center text-sm text-gray-500">
        By continuing, you agree to Hireyth's Terms of Service and Privacy Policy.
      </div>
    </div>
  );
};

export default Login;
