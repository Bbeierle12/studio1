'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useUnit } from '@/context/unit-context';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Lock,
  Bell,
  Palette,
  Globe,
  Shield,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Camera
} from 'lucide-react';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { unit, toggleUnit } = useUnit();
  const router = useRouter();
  const { toast } = useToast();

  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [recipeUpdates, setRecipeUpdates] = useState(true);
  const [collectionShares, setCollectionShares] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Appearance preferences
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [measurementUnit, setMeasurementUnit] = useState<'imperial' | 'metric'>('imperial');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Load user data
    setName(user.name || '');
    setEmail(user.email || '');
    setAvatarUrl(user.avatarUrl || '');
    setBio(user.bio || '');
    setMeasurementUnit(unit);

    // Load preferences from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
    setTheme(savedTheme);

    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      const prefs = JSON.parse(savedNotifications);
      setEmailNotifications(prefs.email ?? true);
      setRecipeUpdates(prefs.recipes ?? true);
      setCollectionShares(prefs.collections ?? true);
      setWeeklyDigest(prefs.digest ?? false);
    }
  }, [user, router, unit]);

  const handleProfileUpdate = async () => {
    setIsProfileSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, avatarUrl }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        await updateProfile({ name: updatedData.name, avatarUrl: updatedData.avatarUrl });
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsPasswordSaving(true);
    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        toast({
          title: 'Password Changed',
          description: 'Your password has been successfully updated.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleNotificationUpdate = () => {
    const prefs = {
      email: emailNotifications,
      recipes: recipeUpdates,
      collections: collectionShares,
      digest: weeklyDigest,
    };
    localStorage.setItem('notifications', JSON.stringify(prefs));
    toast({
      title: 'Preferences Saved',
      description: 'Your notification preferences have been updated.',
    });
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme immediately
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    toast({
      title: 'Theme Updated',
      description: `Theme changed to ${newTheme}.`,
    });
  };

  const handleUnitChange = () => {
    toggleUnit();
    toast({
      title: 'Units Updated',
      description: `Switched to ${unit === 'imperial' ? 'metric' : 'imperial'} units.`,
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile details and how others see you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl} alt={name} />
                  <AvatarFallback className="text-2xl">
                    {name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Profile Picture URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="avatar"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-80"
                    />
                    <Button size="icon" variant="outline">
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800"
                />
                <p className="text-sm text-gray-500">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself and your cooking journey..."
                  className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none"
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 text-right">
                  {bio.length}/500 characters
                </p>
              </div>

              <Button
                onClick={handleProfileUpdate}
                disabled={isProfileSaving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {isProfileSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Must be at least 8 characters long
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                onClick={handlePasswordChange}
                disabled={isPasswordSaving || !currentPassword || !newPassword || !confirmPassword}
                className="w-full"
              >
                <Lock className="h-4 w-4 mr-2" />
                {isPasswordSaving ? 'Changing Password...' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what updates you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Receive email updates about your account
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Recipe Updates</Label>
                  <p className="text-sm text-gray-500">
                    Get notified when recipes you follow are updated
                  </p>
                </div>
                <Switch
                  checked={recipeUpdates}
                  onCheckedChange={setRecipeUpdates}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Collection Shares</Label>
                  <p className="text-sm text-gray-500">
                    Notifications when someone shares a collection with you
                  </p>
                </div>
                <Switch
                  checked={collectionShares}
                  onCheckedChange={setCollectionShares}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Digest</Label>
                  <p className="text-sm text-gray-500">
                    Get a weekly summary of new recipes and updates
                  </p>
                </div>
                <Switch
                  checked={weeklyDigest}
                  onCheckedChange={setWeeklyDigest}
                />
              </div>

              <Button onClick={handleNotificationUpdate} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Notification Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
              <CardDescription>
                Customize your cooking experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => handleThemeChange('light')}
                    className="w-full"
                  >
                    ☀️ Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => handleThemeChange('dark')}
                    className="w-full"
                  >
                    🌙 Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    onClick={() => handleThemeChange('system')}
                    className="w-full"
                  >
                    💻 System
                  </Button>
                </div>
              </div>

              {/* Measurement Units */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Measurement Units</Label>
                  <p className="text-sm text-gray-500">
                    Current: {unit === 'imperial' ? 'Imperial (cups, °F)' : 'Metric (grams, °C)'}
                  </p>
                </div>
                <Button onClick={handleUnitChange} variant="outline">
                  <Globe className="h-4 w-4 mr-2" />
                  Switch to {unit === 'imperial' ? 'Metric' : 'Imperial'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
              <CardDescription>
                Manage your account settings and data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h3 className="font-semibold mb-2">Account Status</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Your account is active and in good standing
                  </p>
                  {user.role && user.role !== 'USER' && (
                    <div className="mt-2">
                      <Badge className="bg-orange-500 text-white">
                        {user.role.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                    Danger Zone
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    Once you delete your account, there is no going back. All your recipes, collections, and data will be permanently deleted.
                  </p>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
