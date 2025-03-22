import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const EmailConfirmation = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Verifying your email...');
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkEmailConfirmation = async () => {
      try {
        console.log('Email confirmation page loaded');
        console.log('URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        
        // Get URL parameters
        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams(url.hash.substring(1));
        
        // Check for parameters in the hash
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const email = hashParams.get('email');
        
        console.log('URL Parameters:', {
          error,
          errorDescription,
          accessToken: accessToken ? 'exists' : 'not found',
          refreshToken: refreshToken ? 'exists' : 'not found',
          type,
          email
        });
        
        // Set the email if available
        if (email) {
          setEmail(email);
        }
        
        // Check for error in URL
        if (error) {
          console.error('Email confirmation error:', errorDescription);
          setStatus('error');
          setMessage(errorDescription || 'An error occurred during email confirmation.');
          return;
        }
        
        // Check for success (type=recovery or type=signup)
        if (type === 'signup') {
          setStatus('success');
          setMessage('Your email has been successfully confirmed!');
          
          // Create a toast notification
          toast({
            title: 'Email Confirmed',
            description: 'Your account has been successfully activated. You can now log in.',
          });
          
          // Force refresh the session
          if (accessToken && refreshToken) {
            try {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              console.log('Session set successfully');
              
              // Wait a moment before redirecting to ensure session is set
              setTimeout(() => {
                navigate('/login?confirmed=true');
              }, 2000);
              return;
            } catch (sessionError) {
              console.error('Error setting session:', sessionError);
            }
          }
          
          return;
        }
        
        if (type === 'recovery') {
          // This is a password recovery confirmation
          navigate('/reset-password');
          return;
        }
        
        // Check if there's an access_token, which means the email was confirmed
        if (accessToken) {
          // Successfully confirmed email
          setStatus('success');
          setMessage('Your email has been successfully confirmed!');
          
          // Set the session manually
          try {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            console.log('Session set successfully from access token');
          } catch (sessionError) {
            console.error('Error setting session from tokens:', sessionError);
          }
          
          return;
        }
        
        // If we reach here, no clear confirmation status was found
        console.log('No clear confirmation status found, checking for session');
        setStatus('loading');
        
        // After a delay, check for session presence as a fallback method
        setTimeout(async () => {
          const { data, error } = await supabase.auth.getSession();
          console.log('Session check result:', { data, error });
          
          if (data?.session) {
            setStatus('success');
            setMessage('Your email has been confirmed!');
            
            // Wait a moment before redirecting to ensure UI update
            setTimeout(() => {
              navigate('/login?confirmed=true');
            }, 2000);
          } else {
            setStatus('error');
            setMessage('Could not verify your email confirmation status. Please try logging in.');
          }
        }, 2000);
      } catch (error) {
        console.error('Error checking email confirmation:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try logging in.');
      }
    };

    checkEmailConfirmation();
  }, [navigate, location, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full opacity-20 filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600 rounded-full opacity-20 filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {/* Logo and App Name */}
      <div className="flex items-center mb-8 fade-in-up visible">
        <Globe className="h-12 w-12 mr-3 text-white" />
        <h1 className="text-5xl font-bold text-white">
          Hireyth
        </h1>
      </div>
      
      <Card className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 max-w-md w-full">
        <CardHeader>
          <div className="flex justify-center mb-5">
            {status === 'loading' && (
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            )}
            
            {status === 'success' && (
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            )}
            
            {status === 'error' && (
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            )}
          </div>
          
          <CardTitle className="text-xl font-bold text-white text-center">
            {status === 'loading' && 'Verifying Your Email'}
            {status === 'success' && 'Email Confirmed'}
            {status === 'error' && 'Confirmation Failed'}
          </CardTitle>
          
          <CardDescription className="text-white/80 text-center">
            {message}
            {email && status === 'success' && (
              <div className="mt-2">for <span className="font-medium">{email}</span></div>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'success' && (
            <p className="text-white/80 text-center">
              You can now sign in to your account and start exploring Hireyth!
            </p>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-white/80 text-center">
                Please check your email and try clicking the confirmation link again.
                If the problem persists, contact support.
              </p>
              <div className="bg-white/10 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">Troubleshooting Tips:</h3>
                <ul className="text-white/80 text-sm space-y-2 ml-2">
                  <li>• Make sure you're using the most recent confirmation email</li>
                  <li>• Check if you're already logged in on another device</li>
                  <li>• Clear your browser cookies and try again</li>
                  <li>• Try using a different browser or device</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          {status === 'loading' ? (
            <Button disabled className="w-full bg-white/50 text-white cursor-not-allowed">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-white text-blue-600 hover:bg-white/90"
            >
              Go to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default EmailConfirmation; 