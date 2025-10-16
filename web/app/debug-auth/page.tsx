/**
 * Debug Auth Page
 * Shows current user authentication state and session claims
 *
 * Route: /debug-auth
 *
 * TEMPORARY: For debugging role-based routing issues
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

// Cloudflare Pages requires edge runtime
export const runtime = 'edge';

export default async function DebugAuthPage() {
  // Get auth state and user
  const authState = await auth();
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Extract metadata from different sources
  const sessionClaims = authState.sessionClaims;
  const unsafeMetadata = user.unsafeMetadata;
  const publicMetadata = user.publicMetadata;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Auth Debug Info</h1>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Info</h2>
          <div className="space-y-2">
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</p>
            <p><strong>First Name:</strong> {user.firstName || 'N/A'}</p>
            <p><strong>Last Name:</strong> {user.lastName || 'N/A'}</p>
          </div>
        </div>

        {/* Session Claims - What middleware sees */}
        <div className="bg-blue-50 border-2 border-blue-500 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">
            📋 Session Claims (What Middleware Sees)
          </h2>
          <pre className="bg-white p-4 rounded overflow-auto text-sm">
            {JSON.stringify(sessionClaims, null, 2)}
          </pre>
        </div>

        {/* User.unsafeMetadata - What currentUser() sees */}
        <div className="bg-green-50 border-2 border-green-500 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-green-900">
            🔓 user.unsafeMetadata (What Server Components See)
          </h2>
          <pre className="bg-white p-4 rounded overflow-auto text-sm">
            {JSON.stringify(unsafeMetadata, null, 2)}
          </pre>
        </div>

        {/* User.publicMetadata */}
        <div className="bg-purple-50 border-2 border-purple-500 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-900">
            🌐 user.publicMetadata
          </h2>
          <pre className="bg-white p-4 rounded overflow-auto text-sm">
            {JSON.stringify(publicMetadata, null, 2)}
          </pre>
        </div>

        {/* Middleware Access Test */}
        <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-900">
            ⚠️ Middleware Access Test
          </h2>
          <div className="space-y-3">
            <div>
              <p className="font-semibold">Attempting to access role via sessionClaims.unsafeMetadata:</p>
              <code className="bg-white px-3 py-2 rounded block mt-2">
                {(sessionClaims as any)?.unsafeMetadata?.role || '❌ NOT FOUND'}
              </code>
            </div>

            <div>
              <p className="font-semibold">Attempting to access role via sessionClaims.metadata:</p>
              <code className="bg-white px-3 py-2 rounded block mt-2">
                {(sessionClaims as any)?.metadata?.role || '❌ NOT FOUND'}
              </code>
            </div>

            <div>
              <p className="font-semibold">Attempting to access role via sessionClaims.publicMetadata:</p>
              <code className="bg-white px-3 py-2 rounded block mt-2">
                {(sessionClaims as any)?.publicMetadata?.role || '❌ NOT FOUND'}
              </code>
            </div>

            <div className="mt-4 p-4 bg-white rounded">
              <p className="font-semibold text-lg">✅ Expected Role:</p>
              <code className="text-2xl text-green-700">
                {(unsafeMetadata as any)?.role || 'undefined'}
              </code>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <a href="/dashboard" className="text-blue-600 hover:underline mr-4">← Back to Dashboard</a>
          <a href="/dashboard/farmer" className="text-green-600 hover:underline">Farmer Dashboard →</a>
        </div>
      </div>
    </div>
  );
}
