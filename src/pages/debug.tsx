import { useEffect, useState } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { runMigrations } from '@/lib/migrations';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@/components/ui/badge';
import { checkSupabaseConnection, checkApprovalTables } from '@/lib/supabase';
import { AlertCircle, CheckCircle, Database, RefreshCw, XCircle, UserCheck } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function DebugPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    chatTables: {
      trip_chats: boolean;
      trip_messages: boolean;
    };
    error?: string;
  } | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<{
    connected: boolean;
    approvalTables: {
      trips: boolean;
      trip_participants: boolean;
      users: boolean;
    };
    error?: string;
  } | null>(null);
  
  // Check database connection on page load (once)
  useEffect(() => {
    const checkAllSystems = async () => {
      setCheckingConnection(true);
      try {
        const chatStatus = await checkSupabaseConnection();
        setConnectionStatus(chatStatus);
        
        const approvalStatus = await checkApprovalTables();
        setApprovalStatus(approvalStatus);
      } catch (error) {
        console.error('Error checking systems:', error);
      } finally {
        setCheckingConnection(false);
      }
    };
    
    checkAllSystems();
  }, []);
  
  const refreshConnectionStatus = async () => {
    setCheckingConnection(true);
    try {
      const status = await checkSupabaseConnection();
      setConnectionStatus(status);
      toast({
        title: status.connected ? "Connection Successful" : "Connection Failed",
        description: status.connected 
          ? "Database connection is working properly" 
          : `Connection failed: ${status.error || 'Unknown error'}`,
        variant: status.connected ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Error checking connection:', error);
      toast({
        title: "Error",
        description: "Failed to check connection status",
        variant: "destructive"
      });
      setConnectionStatus({
        connected: false,
        chatTables: { trip_chats: false, trip_messages: false },
        error: 'Unexpected error checking connection'
      });
    } finally {
      setCheckingConnection(false);
    }
  };
  
  const createChatTablesOnly = async () => {
    toast({
      title: "Creating Chat Tables",
      description: "Setting up trip_chats and trip_messages tables..."
    });
    
    try {
      const { createTripChatsTable, createTripMessagesTable } = await import('@/lib/migrations');
      
      // Create the chat tables specifically
      const chatTableResult = await createTripChatsTable();
      const messagesTableResult = await createTripMessagesTable();
      
      if (chatTableResult && messagesTableResult) {
        toast({
          title: "Success",
          description: "Chat tables created successfully"
        });
      } else {
        toast({
          title: "Partial Success",
          description: chatTableResult 
            ? "Created trip_chats but failed with trip_messages" 
            : "Failed to create chat tables",
          variant: "destructive"
        });
      }
      
      // Refresh connection status
      refreshConnectionStatus();
    } catch (error) {
      console.error('Error creating chat tables:', error);
      toast({
        title: "Error",
        description: "Failed to create chat tables",
        variant: "destructive"
      });
    }
  };
  
  const runDatabaseMigrations = async () => {
    toast({
      title: "Running Migrations",
      description: "Checking and creating database tables..."
    });
    
    try {
      const result = await runMigrations(false);
      toast({
        title: result ? "Success" : "Warning",
        description: result 
          ? "Database tables verified successfully" 
          : "Some migrations may have failed",
        variant: result ? "default" : "destructive"
      });
      
      // Refresh connection status
      refreshConnectionStatus();
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: "Error",
        description: "Failed to run migrations",
        variant: "destructive"
      });
    }
  };
  
  const checkApprovalSystem = async () => {
    setCheckingConnection(true);
    try {
      const status = await checkApprovalTables();
      setApprovalStatus(status);
      
      if (status.connected && Object.values(status.approvalTables).every(val => val)) {
        toast({
          title: "Approval System OK",
          description: "All approval tables are found and accessible"
        });
      } else {
        toast({
          title: "Approval System Issues",
          description: status.error || "Some approval tables are missing",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error checking approval system:', error);
      toast({
        title: "Error",
        description: "Failed to check approval system",
        variant: "destructive"
      });
    } finally {
      setCheckingConnection(false);
    }
  };
  
  // If not in development mode, don't show debug tools
  if (process.env.NODE_ENV !== 'development') {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center p-8">
          <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
          <p>This page is only available in development mode.</p>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug Tools</h1>
        <p className="mb-4 text-gray-600">Use these tools to debug the chat functionality and database connection.</p>
        
        <div className="grid gap-8">
          {/* Connection Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Database Connection
                  </CardTitle>
                  <CardDescription>
                    Check your Supabase connection and table status
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshConnectionStatus}
                  disabled={checkingConnection}
                >
                  {checkingConnection ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {connectionStatus ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Connection Status:</span>
                    {connectionStatus.connected ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <XCircle className="h-3 w-3 mr-1" /> Disconnected
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3">
                      <div className="text-sm font-medium mb-2">trip_chats Table</div>
                      {connectionStatus.chatTables.trip_chats ? (
                        <div className="flex items-center text-green-700">
                          <CheckCircle className="h-4 w-4 mr-1" /> Exists
                        </div>
                      ) : (
                        <div className="flex items-center text-red-700">
                          <XCircle className="h-4 w-4 mr-1" /> Missing
                          <Button
                            variant="link"
                            size="sm"
                            className="text-xs ml-2 h-auto p-0 text-red-700"
                            onClick={runDatabaseMigrations}
                          >
                            Fix Now
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <div className="text-sm font-medium mb-2">trip_messages Table</div>
                      {connectionStatus.chatTables.trip_messages ? (
                        <div className="flex items-center text-green-700">
                          <CheckCircle className="h-4 w-4 mr-1" /> Exists
                        </div>
                      ) : (
                        <div className="flex items-center text-red-700">
                          <XCircle className="h-4 w-4 mr-1" /> Missing
                          <Button
                            variant="link"
                            size="sm"
                            className="text-xs ml-2 h-auto p-0 text-red-700"
                            onClick={runDatabaseMigrations}
                          >
                            Fix Now
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {connectionStatus.error && (
                    <div className="text-red-600 border border-red-200 rounded-md p-3 bg-red-50 text-sm">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      Error: {connectionStatus.error}
                    </div>
                  )}

                  <div className="text-sm text-gray-600 border-t pt-2 mt-2">
                    <p>If tables are missing, click "Run Migrations" below to create them.</p>
                    <p className="mt-1"><strong>Note:</strong> You must be logged in for migrations to work properly.</p>
                  </div>
                </div>
              ) : checkingConnection ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Could not retrieve connection status
                </div>
              )}
            </CardContent>
            <CardFooter>
              <div className="w-full flex flex-col gap-4">
                <div className="flex gap-4">
                  <Button
                    variant="default"
                    onClick={createChatTablesOnly}
                    className="flex-1"
                  >
                    Create Chat Tables
                  </Button>
                  <Button
                    variant="outline"
                    onClick={runDatabaseMigrations}
                    className="flex-1"
                  >
                    Run Full Migrations
                  </Button>
                </div>
                <div className="text-xs text-gray-500">
                  Use "Create Chat Tables" if only the chat functionality is missing, 
                  or "Run Full Migrations" to set up all database tables.
                </div>
              </div>
            </CardFooter>
          </Card>
          
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                Current authenticated user details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm mb-1 font-medium">
                    Email:
                  </p>
                  <p className="bg-gray-50 border rounded p-2 text-sm">
                    {user?.email || "Not logged in"}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm mb-1 font-medium">
                    User ID:
                  </p>
                  <p className="bg-gray-50 border rounded p-2 text-sm font-mono overflow-x-auto">
                    {user?.id || "N/A"}
                  </p>
                </div>
                
                {user && (
                  <div>
                    <p className="text-sm mb-1 font-medium">
                      Email Verified:
                    </p>
                    <p className="flex items-center">
                      {user.email_confirmed_at ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <AlertCircle className="h-3 w-3 mr-1" /> Not Verified
                        </Badge>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Approval System Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <UserCheck className="h-5 w-5 mr-2" />
                    Approval System
                  </CardTitle>
                  <CardDescription>
                    Check approval tables (trips, participants, users)
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkApprovalSystem}
                  disabled={checkingConnection}
                >
                  {checkingConnection ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Check
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {approvalStatus ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Connection Status:</span>
                    {approvalStatus.connected ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <XCircle className="h-3 w-3 mr-1" /> Disconnected
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border rounded-lg p-3">
                      <div className="text-sm font-medium mb-2">trips Table</div>
                      {approvalStatus.approvalTables.trips ? (
                        <div className="flex items-center text-green-700">
                          <CheckCircle className="h-4 w-4 mr-1" /> Exists
                        </div>
                      ) : (
                        <div className="flex items-center text-red-700">
                          <XCircle className="h-4 w-4 mr-1" /> Missing
                        </div>
                      )}
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <div className="text-sm font-medium mb-2">trip_participants Table</div>
                      {approvalStatus.approvalTables.trip_participants ? (
                        <div className="flex items-center text-green-700">
                          <CheckCircle className="h-4 w-4 mr-1" /> Exists
                        </div>
                      ) : (
                        <div className="flex items-center text-red-700">
                          <XCircle className="h-4 w-4 mr-1" /> Missing
                        </div>
                      )}
                    </div>
                    
                    <div className="border rounded-lg p-3">
                      <div className="text-sm font-medium mb-2">users Table</div>
                      {approvalStatus.approvalTables.users ? (
                        <div className="flex items-center text-green-700">
                          <CheckCircle className="h-4 w-4 mr-1" /> Exists
                        </div>
                      ) : (
                        <div className="flex items-center text-red-700">
                          <XCircle className="h-4 w-4 mr-1" /> Missing
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {approvalStatus.error && (
                    <div className="text-red-600 border border-red-200 rounded-md p-3 bg-red-50 text-sm">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      Error: {approvalStatus.error}
                    </div>
                  )}
                </div>
              ) : checkingConnection ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Could not retrieve approval system status
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 