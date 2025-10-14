'use client';

import { useAuth, SignInButton, useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://pickafarm-api.94623956quebecinc.workers.dev';

interface SaveFarmButtonProps {
  farmId: string;
  farmName: string;
  city: string;
  state: string;
  phone?: string;
  website?: string;
  variant?: 'default' | 'icon';
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function SaveFarmButton({
  farmId,
  farmName,
  city,
  state,
  phone,
  website,
  variant = 'default',
  size = 'default',
  className,
}: SaveFarmButtonProps) {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if farm is already saved on mount
  useEffect(() => {
    async function checkIfSaved() {
      if (!isSignedIn) return;

      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/api/farms/saved`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const savedFarms = data.saved_farms || [];
          setIsSaved(savedFarms.some((farm: any) => farm.farm_id === farmId));
        }
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    }

    checkIfSaved();
  }, [isSignedIn, farmId, getToken]);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);

    try {
      const token = await getToken();

      // First, ensure user is synced with the database
      const syncResponse = await fetch(`${API_URL}/api/users/sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.primaryEmailAddress?.emailAddress,
          firstName: user?.firstName,
          lastName: user?.lastName,
        }),
      });

      if (!syncResponse.ok) {
        console.error('Failed to sync user');
        alert('Failed to sync user. Please try again.');
        return;
      }

      const endpoint = isSaved ? '/api/farms/unsave' : '/api/farms/save';

      const requestData = {
        farm_id: farmId,
        farm_name: farmName,
        farm_city: city,
        farm_state: state,
        farm_phone: phone,
        farm_website: website,
      };

      console.log('Saving farm:', { endpoint: `${API_URL}${endpoint}`, data: requestData });

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        setIsSaved(!isSaved);
        console.log(`Farm ${!isSaved ? 'saved' : 'unsaved'}: ${farmName}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to save/unsave farm:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });

        // If user not found, the error message will tell us
        if (errorData.error?.includes('User not found')) {
          alert('Please refresh the page and try again.');
        } else {
          alert(`Failed to ${isSaved ? 'unsave' : 'save'} farm. Please try again.`);
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button
          size={size}
          variant={variant === 'icon' ? 'outline' : 'secondary'}
          className={cn(variant === 'icon' ? 'px-3' : '', className)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Heart className={cn(variant === 'icon' ? 'h-4 w-4' : 'h-4 w-4 mr-2')} />
          {variant !== 'icon' && 'Save'}
        </Button>
      </SignInButton>
    );
  }

  return (
    <Button
      size={size}
      variant={variant === 'icon' ? 'outline' : 'secondary'}
      className={cn(
        variant === 'icon' ? 'px-3' : '',
        isSaved
          ? 'bg-red-50 hover:bg-red-100 border-red-200'
          : 'border-red-500 hover:bg-red-50 hover:border-red-600',
        className
      )}
      onClick={toggleSave}
      disabled={isLoading}
    >
      <Heart
        className={cn(
          variant === 'icon' ? 'h-4 w-4' : 'h-4 w-4 mr-2',
          isSaved ? 'fill-red-500 text-red-500' : 'text-red-500'
        )}
      />
      {variant !== 'icon' && (isLoading ? '...' : isSaved ? 'Saved' : 'Save')}
    </Button>
  );
}
