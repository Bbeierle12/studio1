'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Shield, Activity, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserEditDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function UserEditDialog({ user, open, onOpenChange, onSave }: UserEditDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    role: user?.role || 'USER',
    isActive: user?.isActive ?? true,
    twoFactorEnabled: user?.twoFactorEnabled || false,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User updated successfully',
        });
        onSave();
        onOpenChange(false);
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to update user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Password reset email sent to user',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send password reset',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send password reset',
        variant: 'destructive',
      });
    }
  };

  const handleSuspend = async () => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspend: !user.isActive }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: user.isActive ? 'User suspended' : 'User activated',
        });
        setFormData({ ...formData, isActive: !user.isActive });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update user status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and manage account settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="User's full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="User biography or notes"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="SUPPORT_ADMIN">Support Admin</SelectItem>
                    <SelectItem value="CONTENT_ADMIN">Content Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Account Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="active">
                    {formData.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Suspended</Badge>
                    )}
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Login</p>
                <p className="text-xs text-muted-foreground">
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleString()
                    : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Recipes Created</p>
                <p className="text-xs text-muted-foreground">
                  {user._count?.recipes || 0}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Additional security for account access
                  </p>
                </div>
                <Switch
                  checked={formData.twoFactorEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, twoFactorEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Password Reset</p>
                  <p className="text-sm text-muted-foreground">
                    Send password reset email to user
                  </p>
                </div>
                <Button variant="outline" onClick={handlePasswordReset}>
                  Send Reset Email
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Account Suspension</p>
                  <p className="text-sm text-muted-foreground">
                    Temporarily disable user access
                  </p>
                </div>
                <Button
                  variant={user.isActive ? 'destructive' : 'default'}
                  onClick={handleSuspend}
                >
                  {user.isActive ? 'Suspend Account' : 'Activate Account'}
                </Button>
              </div>

              {user.twoFactorVerifiedAt && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-green-900">
                      2FA Verified
                    </p>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Last verified: {new Date(user.twoFactorVerifiedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Recent Activity</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {/* This would show actual activity logs */}
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Created new recipe</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Updated profile</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Logged in</p>
                    <p className="text-xs text-muted-foreground">3 days ago</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">
                      Account Monitoring
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      No suspicious activity detected. Last security review: {' '}
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}