import { NextResponse, NextRequest } from 'next/server';
import { getAuth, clerkClient } from '@clerk/nextjs/server';

// Cloudflare Pages requires edge runtime for dynamic routes
export const runtime = 'edge';

/**
 * POST /api/user/demote-farmer
 *
 * Secure endpoint to demote a user from 'farmer' to 'user'.
 * This is called when the farmer's associated farm is found to be deleted.
 * It clears the farmId and updates the role in the user's publicMetadata.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Attempting to demote user: ${userId}`);

    // The clerkClient from @clerk/nextjs/server is not compatible with the Edge runtime.
    // We must call the Clerk Backend API directly using fetch.
    const clerkApiUrl = `https://api.clerk.com/v1/users/${userId}`;
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;

    if (!clerkSecretKey) {
      console.error('Demotion API error: CLERK_SECRET_KEY is not set.');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(clerkApiUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_metadata: {
          role: 'user',
          farmId: null, // Explicitly clear the farmId
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Clerk API error during demotion: ${response.status} - ${errorText}`);
      throw new Error(`Failed to demote user in Clerk: ${errorText}`);
    }

    console.log(`✅ Successfully demoted user: ${userId}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to demote user:', error);

    // It's possible the user object doesn't exist or there's a Clerk API issue
    // We still return a 500 but log the detailed error server-side.
    return new Response(JSON.stringify({ error: 'Failed to update user role' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
