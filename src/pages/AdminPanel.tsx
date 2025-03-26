import React, { useState, useEffect } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { 
  CheckSquare,
  Shield,
  Search,
  User,
  Loader2,
  X,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  profile_image: string | null;
  location: string | null;
  is_verified: boolean;
  verification_reason: string | null;
  created_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  is_admin: boolean;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('verify');
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState({
    reason: '',
    type: 'celebrity' as 'celebrity' | 'business' | 'government' | 'community' | 'other'
  });
  
  useEffect(() => {
    checkAdminAccess();
  }, [user]);
  
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);
  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
      return;
    }
    
    console.log('Searching for:', searchQuery);
    console.log('Total users:', users.length);
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = users.filter(user => {
      const matchesName = user.name?.toLowerCase().includes(query);
      const matchesUsername = user.username?.toLowerCase().includes(query);
      const matchesEmail = user.email?.toLowerCase().includes(query);
      
      return matchesName || matchesUsername || matchesEmail;
    });
    
    console.log('Found matching users:', filtered.length);
    setFilteredUsers(filtered);
  }, [searchQuery, users]);
  
  const checkAdminAccess = async () => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }
    
    try {
      // Check if user is in admin table
      const { data, error } = await supabase
        .from('admins')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data?.is_admin || false);
      }
    } catch (error) {
      console.error('Error:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching users...');
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, email, profile_image, location, is_verified, verification_reason, created_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      
      console.log('Users fetched:', data?.length || 0);
      
      // Ensure all properties exist to prevent null reference errors
      const safeData = (data || []).map(user => ({
        ...user,
        name: user.name || 'Unknown',
        username: user.username || 'unknown',
        email: user.email || '',
        profile_image: user.profile_image || null,
        location: user.location || null,
        is_verified: Boolean(user.is_verified),
        verification_reason: user.verification_reason || null
      }));
      
      setUsers(safeData);
      setFilteredUsers(safeData);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerifyUser = async () => {
    if (!selectedUser) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_verified: true,
          verification_reason: `${verificationDetails.type.charAt(0).toUpperCase() + verificationDetails.type.slice(1)}: ${verificationDetails.reason}`,
          verification_date: new Date().toISOString()
        })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === selectedUser.id 
            ? {
                ...u, 
                is_verified: true, 
                verification_reason: `${verificationDetails.type.charAt(0).toUpperCase() + verificationDetails.type.slice(1)}: ${verificationDetails.reason}`
              } 
            : u
        )
      );
      
      toast({
        title: 'Success',
        description: `${selectedUser.name} has been verified!`
      });
      
      // Reset the form and close dialog
      setVerificationDetails({
        reason: '',
        type: 'celebrity'
      });
      setShowVerifyDialog(false);
      
    } catch (error) {
      console.error('Error verifying user:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify user',
        variant: 'destructive'
      });
    }
  };
  
  const handleUnverifyUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_verified: false,
          verification_reason: null,
          verification_date: null
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId 
            ? {
                ...u, 
                is_verified: false, 
                verification_reason: null
              } 
            : u
        )
      );
      
      toast({
        title: 'Success',
        description: 'Verification badge removed'
      });
      
    } catch (error) {
      console.error('Error removing verification:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove verification',
        variant: 'destructive'
      });
    }
  };
  
  const openVerifyDialog = (user: User) => {
    setSelectedUser(user);
    setShowVerifyDialog(true);
  };
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You do not have permission to access the admin panel. Please contact an administrator if you believe this is an error.
          </p>
          <Button variant="outline" onClick={() => navigate('/')} className="mr-2">
            Go Home
          </Button>
          <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600">
            Logout
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <BottomNav />
      
      <div className="max-w-6xl mx-auto p-4 pt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
              <img src="/verification-badge.svg" alt="" className="w-5 h-5 mr-2" />
              Admin Panel
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage verification badges and user accounts</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline" 
            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 whitespace-nowrap self-end sm:self-auto"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <Tabs defaultValue="verify" value={activeTab} onValueChange={setActiveTab}>
            <div className="px-4 pt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="verify" className="text-sm">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  User Verification
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Settings
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="verify" className="p-4">
              <div className="mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search users by name, username or email..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoComplete="off"
                      onKeyDown={(e) => e.key === 'Escape' && setSearchQuery('')}
                    />
                    {searchQuery && (
                      <button 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={fetchUsers}
                    disabled={isLoading}
                    className="flex-shrink-0"
                    title="Refresh user list"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                {users.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Showing {filteredUsers.length} of {users.length} users
                  </p>
                )}
              </div>
              
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No users found</p>
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <div 
                      key={user.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors gap-3"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 border border-gray-200 flex-shrink-0">
                          <AvatarImage src={user.profile_image || ''} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex items-center">
                            <h3 className="font-medium text-gray-900 truncate">{user.name}</h3>
                            {user.is_verified && (
                              <img src="/verification-badge.svg" alt="Verified" className="ml-1 h-4 w-4 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500">
                            <span className="truncate">@{user.username}</span>
                            <span className="hidden sm:inline mx-1">•</span>
                            <span className="truncate text-xs">{user.email}</span>
                          </div>
                          {user.is_verified && user.verification_reason && (
                            <Badge variant="outline" className="mt-1 text-xs bg-purple-50 border-purple-200 text-purple-700 truncate max-w-full">
                              {user.verification_reason}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end mt-2 sm:mt-0">
                        {user.is_verified ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 whitespace-nowrap"
                            onClick={() => handleUnverifyUser(user.id)}
                          >
                            <X className="w-3 h-3 mr-1 flex-shrink-0" />
                            Unverify
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-purple-600 border-purple-200 hover:bg-purple-50 whitespace-nowrap"
                            onClick={() => openVerifyDialog(user)}
                          >
                            <img src="/verification-badge.svg" alt="" className="w-3 h-3 mr-1 flex-shrink-0" />
                            Verify
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="p-4 sm:p-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Admin Settings</CardTitle>
                  <CardDescription>
                    Manage admin privileges and system settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 sm:p-4 text-amber-800">
                    <div className="flex flex-col sm:flex-row sm:items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mb-2 sm:mb-0" />
                      <div>
                        <h4 className="font-medium">Admin Settings</h4>
                        <p className="text-sm mt-1">
                          This section is available for future expansion. Admin privileges are currently managed directly through the database.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-6">
                    <h3 className="font-medium text-gray-800 mb-2">Verification Guidelines</h3>
                    <div className="bg-purple-50 border border-purple-200 rounded-md p-3 sm:p-4 text-purple-800 text-sm space-y-2">
                      <p className="flex items-start">
                        <img src="/verification-badge.svg" alt="" className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Celebrity:</strong> Well-known individuals in entertainment, sports, arts, etc.</span>
                      </p>
                      <p className="flex items-start">
                        <img src="/verification-badge.svg" alt="" className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Business:</strong> Official accounts of companies and organizations.</span>
                      </p>
                      <p className="flex items-start">
                        <img src="/verification-badge.svg" alt="" className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Government:</strong> Official government institutions and representatives.</span>
                      </p>
                      <p className="flex items-start">
                        <img src="/verification-badge.svg" alt="" className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span><strong>Community:</strong> Notable community leaders, experts, and influencers.</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Verify User Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="sm:max-w-md max-w-[95vw] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Verify User</DialogTitle>
            <DialogDescription>
              Add a verification badge to this user's profile.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-10 w-10 border border-gray-200 flex-shrink-0">
                <AvatarImage src={selectedUser.profile_image || ''} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 overflow-hidden">
                <div className="flex items-center">
                  <h3 className="font-medium text-gray-900 truncate">{selectedUser.name}</h3>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="truncate">@{selectedUser.username}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-type">Verification Category</Label>
              <Select 
                value={verificationDetails.type} 
                onValueChange={(value) => setVerificationDetails({...verificationDetails, type: value as any})}
              >
                <SelectTrigger id="verification-type">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="celebrity">Celebrity</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="community">Community Leader</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verification-reason">Verification Reason</Label>
              <Textarea
                id="verification-reason"
                placeholder="Explain why this user should be verified..."
                value={verificationDetails.reason}
                onChange={(e) => setVerificationDetails({...verificationDetails, reason: e.target.value})}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)} className="sm:order-1 order-2">
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyUser}
              disabled={!verificationDetails.reason.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white sm:order-2 order-1"
            >
              <img src="/verification-badge.svg" alt="" className="mr-2 h-4 w-4" />
              Verify User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel; 