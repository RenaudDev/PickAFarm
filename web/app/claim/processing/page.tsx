'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * A client-side component that polls for user metadata after signup
 * and redirects them to the appropriate dashboard once the webhook
 * has processed their role.
 */
export default function ClaimProcessingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) {
      // Wait for the user object to be loaded
      return;
    }

    // Immediately check if the role is already available
    const role = user?.publicMetadata?.role as string | undefined;
    if (role === 'farmer') {
      console.log('✅ Role found immediately, redirecting to farmer dashboard.');
      router.push('/dashboard/farmer');
      return;
    }

    // If role is not available, start polling
    const interval = setInterval(() => {
      // user.reload() will trigger a re-render of the component with the new user object
      user?.reload();
      const updatedRole = user?.publicMetadata?.role as string | undefined;
      console.log(`Polling for role... Current role: ${updatedRole}`);
      if (updatedRole === 'farmer') {
        clearInterval(interval);
        console.log('✅ Role found after polling, redirecting to farmer dashboard.');
        router.push('/dashboard/farmer');
      }
    }, 1000); // Poll every 1 second

    // Set a timeout to prevent infinite polling
    const timeout = setTimeout(() => {
      clearInterval(interval);
      console.error('⚠️ Polling timed out. Redirecting to error page.');
      router.push('/claim-error?reason=timeout');
    }, 20000); // 20-second timeout

    // Cleanup function to clear interval and timeout on component unmount
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isLoaded, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-md" style={{ backgroundColor: 'oklch(0.98 0.02 142)' }}>
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin" style={{ color: 'oklch(0.35 0.15 142)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'oklch(0.35 0.15 142)' }}>
            We're setting up your farmer dashboard...
          </h1>
          <p className="text-sm" style={{ color: 'oklch(0.4 0 0)' }}>
            This usually takes a few seconds
          </p>
        </div>
      </div>
    </div>
  );
}
