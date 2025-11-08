import { NextResponse } from 'next/server';
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
export async function POST(request: Request) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Attempting to demote user: ${userId}`);

    // Update publicMetadata via Clerk Backend API
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: 'user',
        farmId: null, // Explicitly clear the farmId
      },
    });

    console.log(`✅ Successfully demoted user: ${userId}`);

    return NextResponse.json({ success: true });
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
