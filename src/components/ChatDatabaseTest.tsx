import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { testChatMessageStorage } from '@/lib/chat-db-test';
import { useAuth } from '@/lib/auth-context';

/**
 * A component for testing the chat database functionality
 * Only visible in development mode
 */
const ChatDatabaseTest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tripId, setTripId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  
  const runTest = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to run this test",
        variant: "destructive"
      });
      return;
    }
    
    if (!tripId) {
      toast({
        title: "Error",
        description: "Please enter a trip ID",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setTestResult(null);
    
    try {
      console.log('Running chat database test...');
      const result = await testChatMessageStorage(tripId, user.id);
      setTestResult(result);
      
      toast({
        title: result.success ? "Test Passed" : "Test Failed",
        description: result.success 
          ? "Chat messages are being saved to the database" 
          : `Test failed: ${result.error}`,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Error running test:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while running the test",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (process.env.NODE_ENV !== 'development') {
    return null; // Don't render in production
  }
  
  return (
    <Card className="max-w-md mx-auto my-8">
      <CardHeader>
        <CardTitle>Chat Database Test</CardTitle>
        <CardDescription>
          Test if chat messages are being properly saved to the database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="tripId">Trip ID</Label>
            <Input
              id="tripId"
              placeholder="Enter a trip ID to test"
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
            />
          </div>
          
          {testResult && (
            <Alert 
              variant={testResult.success ? "default" : "destructive"}
              className={testResult.success ? "bg-green-50 border-green-200" : undefined}
            >
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>{testResult.success ? "Test Passed" : "Test Failed"}</AlertTitle>
              <AlertDescription>
                {testResult.success ? (
                  <div className="text-sm text-green-700">
                    Chat messages are being correctly saved to the database.
                    <div className="mt-2 font-mono text-xs">
                      Chat ID: {testResult.chatId}<br />
                      Message ID: {testResult.messageId}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm">
                    <p>{testResult.error}</p>
                    <div className="mt-2 space-y-1">
                      <p>Steps completed:</p>
                      <p>✅ Chat Exists: {testResult.chatExists ? 'Yes' : 'No'}</p>
                      <p>✅ Message Sent: {testResult.messageSent ? 'Yes' : 'No'}</p>
                      <p>✅ Message Verified: {testResult.messageVerified ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={runTest} 
          disabled={isLoading || !user}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <AlertCircle className="mr-2 h-4 w-4" />
              Run Database Test
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChatDatabaseTest; 