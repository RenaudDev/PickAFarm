/**
 * Metadata Migration Endpoint
 * Story 2.2.2: Fix Clerk Metadata Access & Static Export Compatibility
 *
 * This endpoint allows users to migrate their metadata from unsafeMetadata to publicMetadata.
 * It's needed because users created before the webhook fix have empty publicMetadata.
 *
 * Security:
 * - User must be authenticated (checked via Clerk)
 * - Users can only migrate their own metadata (uses their session token)
 * - Validates that unsafeMetadata exists before migrating
 *
 * Usage:
 * POST /api/migrate-metadata
 * Returns: { success: true, role: string, farmId?: string }
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user to access metadata
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if publicMetadata already has role
    if (user.publicMetadata?.role) {
      return NextResponse.json(
        {
          success: true,
          message: 'Metadata already migrated',
          role: user.publicMetadata.role,
          farmId: user.publicMetadata.farmId,
        },
        { status: 200 }
      );
    }

    // Get role and farmId from unsafeMetadata
    const role = user.unsafeMetadata?.role as string | undefined;
    const farmId = user.unsafeMetadata?.farmId as string | undefined;

    if (!role) {
      return NextResponse.json(
        {
          error: 'No role found in unsafeMetadata. User may not be a farmer.',
        },
        { status: 400 }
      );
    }

    // Call Clerk Backend API to set publicMetadata
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;

    if (!clerkSecretKey) {
      console.error('CLERK_SECRET_KEY not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const clerkApiUrl = `https://api.clerk.com/v1/users/${userId}`;

    const clerkResponse = await fetch(clerkApiUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_metadata: {
          role: role,
          ...(farmId ? { farmId } : {}),
        },
      }),
    });

    if (!clerkResponse.ok) {
      const errorText = await clerkResponse.text();
      console.error(`Failed to update Clerk publicMetadata: ${clerkResponse.status} - ${errorText}`);
      return NextResponse.json(
        {
          error: 'Failed to update metadata',
          details: errorText,
        },
        { status: 500 }
      );
    }

    // Success!
    return NextResponse.json(
      {
        success: true,
        message: 'Metadata migrated successfully',
        role: role,
        ...(farmId ? { farmId } : {}),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Metadata migration error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
