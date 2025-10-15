'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Flag,
  Loader2,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string | null;
  rolloutPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export default function FeatureFlagsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loadingFlags, setLoadingFlags] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: false,
    rolloutPercentage: 100,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SUPER_ADMIN')) {
      router.push('/admin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === 'SUPER_ADMIN') {
      fetchFlags();
    }
  }, [user]);

  const fetchFlags = async () => {
    setLoadingFlags(true);
    try {
      const response = await fetch('/api/admin/features');
      if (response.ok) {
        const data = await response.json();
        setFlags(data.flags);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch feature flags',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch feature flags',
        variant: 'destructive',
      });
    } finally {
      setLoadingFlags(false);
    }
  };

  const handleOpenDialog = (flag?: FeatureFlag) => {
    if (flag) {
      setEditingFlag(flag);
      setFormData({
        name: flag.name,
        description: flag.description || '',
        enabled: flag.enabled,
        rolloutPercentage: flag.rolloutPercentage,
      });
    } else {
      setEditingFlag(null);
      setFormData({
        name: '',
        description: '',
        enabled: false,
        rolloutPercentage: 100,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingFlag
        ? `/api/admin/features/${editingFlag.id}`
        : '/api/admin/features';
      const method = editingFlag ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Feature flag ${editingFlag ? 'updated' : 'created'} successfully`,
        });
        setDialogOpen(false);
        fetchFlags();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to save feature flag',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving feature flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to save feature flag',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (flag: FeatureFlag) => {
    try {
      const response = await fetch(`/api/admin/features/${flag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...flag,
          enabled: !flag.enabled,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Feature ${flag.enabled ? 'disabled' : 'enabled'}`,
        });
        fetchFlags();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to toggle feature flag',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling feature flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle feature flag',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature flag?')) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/features/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Feature flag deleted successfully',
        });
        fetchFlags();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete feature flag',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting feature flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete feature flag',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading || loadingFlags) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Unauthorized Access
            </CardTitle>
            <CardDescription>
              Only Super Admins can manage feature flags.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin">Go to Admin Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8'>
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <div className='flex items-center gap-2 mb-2'>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin">← Back to Dashboard</Link>
              </Button>
            </div>
            <h1 className='text-3xl font-bold'>Feature Flags</h1>
            <p className='text-muted-foreground'>
              Enable or disable features across the application
            </p>
          </div>
          <div className='flex gap-2'>
            <Button onClick={fetchFlags} variant='outline' size='sm'>
              <RefreshCw className='h-4 w-4 mr-2' />
              Refresh
            </Button>
            <Button onClick={() => handleOpenDialog()} size='sm'>
              <Plus className='h-4 w-4 mr-2' />
              New Flag
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              All Feature Flags
            </CardTitle>
            <CardDescription>
              {flags.length} feature flag{flags.length !== 1 ? 's' : ''} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {flags.length === 0 ? (
              <div className='text-center py-12'>
                <Flag className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                <p className='text-muted-foreground mb-4'>No feature flags configured</p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className='h-4 w-4 mr-2' />
                  Create First Flag
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Rollout %</TableHead>
                    <TableHead className="text-center">Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flags.map((flag) => (
                    <TableRow key={flag.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4" />
                          {flag.name}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        {flag.description || (
                          <span className="text-muted-foreground italic">No description</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={flag.enabled}
                            onCheckedChange={() => handleToggle(flag)}
                          />
                          <Badge variant={flag.enabled ? 'default' : 'secondary'}>
                            {flag.enabled ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Enabled
                              </>
                            ) : (
                              'Disabled'
                            )}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {flag.rolloutPercentage}%
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {new Date(flag.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(flag)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(flag.id)}
                            disabled={deleting === flag.id}
                          >
                            {deleting === flag.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingFlag ? 'Edit Feature Flag' : 'Create Feature Flag'}
            </DialogTitle>
            <DialogDescription>
              {editingFlag
                ? 'Update the feature flag settings'
                : 'Add a new feature flag to control application features'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Feature Name</Label>
              <Input
                id="name"
                placeholder="e.g., dark_mode, ai_recipes, social_sharing"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!!editingFlag} // Can't change name after creation
              />
              <p className="text-xs text-muted-foreground">
                Use lowercase with underscores. Cannot be changed after creation.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this feature does"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="enabled">Enabled</Label>
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enabled: checked })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enable or disable this feature immediately
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rollout">Rollout Percentage</Label>
                <span className="text-sm font-mono">{formData.rolloutPercentage}%</span>
              </div>
              <Slider
                id="rollout"
                min={0}
                max={100}
                step={5}
                value={[formData.rolloutPercentage]}
                onValueChange={([value]) =>
                  setFormData({ ...formData, rolloutPercentage: value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Gradually roll out to a percentage of users (100% = all users)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {editingFlag ? 'Update' : 'Create'} Flag
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
