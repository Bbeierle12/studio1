'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Crown, Edit2, Mail } from 'lucide-react';
import { getRoleName, getRoleBadgeColor } from '@/lib/permissions';

interface HouseholdMember {
  id: string;
  email: string;
  name: string | null;
  householdRole: string;
  avatarUrl: string | null;
}

interface HouseholdData {
  id: string;
  name: string;
  ownerId: string;
  digestEnabled: boolean;
  digestDay: string;
  digestTime: string;
  members: HouseholdMember[];
}

export default function HouseholdPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [household, setHousehold] = useState<HouseholdData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchHousehold();
    }
  }, [user]);

  const fetchHousehold = async () => {
    try {
      const response = await fetch('/api/household');
      if (response.ok) {
        const data = await response.json();
        setHousehold(data);
      }
    } catch (error) {
      console.error('Failed to fetch household:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className='flex min-h-[80vh] items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!household) {
    return (
      <div className='container mx-auto py-8'>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>No Household Found</CardTitle>
            <CardDescription>
              You haven't joined a household yet. Contact your family owner to get invited!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')}>
              Back to Foyer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwner = household.ownerId === user.id;

  return (
    <div className='container mx-auto py-8 max-w-4xl'>
      <div className="mb-8">
        <h1 className='text-3xl font-bold mb-2 flex items-center gap-2'>
          <Users className="h-8 w-8" />
          {household.name}
        </h1>
        <p className='text-muted-foreground'>
          Manage your family household and members
        </p>
      </div>

      {/* Household Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Household Settings</CardTitle>
          <CardDescription>Your family's configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Household Name</p>
              <p className="text-sm text-muted-foreground">{household.name}</p>
            </div>
            {isOwner && (
              <Button variant="outline" size="sm">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="font-medium mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Weekly Family Digest
            </p>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Status:</span>{' '}
                <Badge variant={household.digestEnabled ? 'default' : 'secondary'}>
                  {household.digestEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </p>
              {household.digestEnabled && (
                <>
                  <p>
                    <span className="font-medium">Day:</span> {household.digestDay}
                  </p>
                  <p>
                    <span className="font-medium">Time:</span> {household.digestTime}
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Family Members ({household.members.length})</span>
            {isOwner && (
              <Button size="sm">
                <Users className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Your household family members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {household.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name || member.email}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-primary">
                        {(member.name || member.email)[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {member.name || member.email}
                      {member.id === household.ownerId && (
                        <Crown className="h-4 w-4 text-yellow-600" />
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <Badge className={getRoleBadgeColor(member.householdRole as any)}>
                  {getRoleName(member.householdRole as any)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>What each role can do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-2">👑 Owner</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Full household control</li>
                <li>• Manage all members</li>
                <li>• Edit any recipe</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">👥 Curator</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Edit all recipes</li>
                <li>• Curate collections</li>
                <li>• Feature recipes</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">👤 Contributor</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Add new recipes</li>
                <li>• Edit own recipes</li>
                <li>• Plan meals</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">👶 Kid</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• View recipes</li>
                <li>• React with emojis</li>
                <li>• Add comments</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
