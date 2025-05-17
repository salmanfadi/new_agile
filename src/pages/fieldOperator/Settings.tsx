
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const FieldOperatorSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSaveSettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Update profile information
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name: username
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Show success toast
      toast({
        title: 'Settings updated',
        description: 'Your settings have been successfully updated.',
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error updating settings',
        description: 'There was a problem updating your settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Settings" 
        description="Manage your account and preferences"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/field')}
        className="flex items-center gap-2 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Display Name</Label>
              <Input
                id="username"
                placeholder="Your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Your email"
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed. Contact administrator for assistance.</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Push Notifications</Label>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
              <p className="text-xs text-muted-foreground">Receive notifications about inventory status changes</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleSaveSettings} 
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
              {!isSaving && <Save className="h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how the application looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Toggle between light and dark mode</span>
                <ModeToggle />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <CardTitle>About SCA Warehouse Management</CardTitle>
            <CardDescription>System information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Version</p>
                <p className="text-sm text-muted-foreground">1.0.0</p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm text-muted-foreground">{user?.role}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Contact Support</p>
                <p className="text-sm text-muted-foreground">support@scawarehouse.com</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FieldOperatorSettings;
