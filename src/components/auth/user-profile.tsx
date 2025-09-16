'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/utils/api';
import { Switch } from '@radix-ui/react-switch';
import Image from 'next/image';

export function UserProfile() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { data: userProfile, isLoading } = api.user.getProfile.useQuery();
  const updatePreferences = api.user.updatePreferences.useMutation({
    onSuccess: () => {
      // Refetch user profile to get updated data
      utils.user.getProfile.invalidate();
    },
  });

  const utils = api.useUtils();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ callbackUrl: '/auth/signin' });
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  const handleThemeChange = async (theme: 'LIGHT' | 'DARK') => {
    try {
      await updatePreferences.mutateAsync({ theme });
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  const handleNotificationChange = async (emailNotifications: boolean) => {
    try {
      await updatePreferences.mutateAsync({ emailNotifications });
    } catch (error) {
      console.error('Failed to update notifications:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <Spinner size="md" />
        </CardContent>
      </Card>
    );
  }

  if (!userProfile) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Failed to load profile
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>
          Manage your account preferences and settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Info */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            {userProfile.image && (
              <Image
                src={userProfile.image}
                alt={userProfile.name || 'Profile'}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full"
              />
            )}
            <div>
              <p className="font-medium">{userProfile.name || 'Anonymous'}</p>
              <p className="text-sm text-muted-foreground">
                {userProfile.email}
              </p>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Theme</Label>
          <div className="flex items-center space-x-4">
            <Button
              variant={userProfile.theme === 'LIGHT' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleThemeChange('LIGHT')}
              disabled={updatePreferences.isPending}
            >
              Light
            </Button>
            <Button
              variant={userProfile.theme === 'DARK' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleThemeChange('DARK')}
              disabled={updatePreferences.isPending}
            >
              Dark
            </Button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive updates about your conversations
            </p>
          </div>
          <Switch
            checked={userProfile.emailNotifications}
            onCheckedChange={handleNotificationChange}
            disabled={updatePreferences.isPending}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        {/* Account Actions */}
        <div className="pt-4 border-t">
          <Button
            variant="destructive"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full"
          >
            {isSigningOut ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Signing out...
              </>
            ) : (
              'Sign Out'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
