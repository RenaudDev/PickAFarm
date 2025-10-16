'use client';

/**
 * Metadata Migration Button
 * Story 2.2.2: Fix Clerk Metadata Access & Static Export Compatibility
 *
 * Client component that allows users to migrate their metadata from
 * unsafeMetadata to publicMetadata with a single click.
 */

import { useState } from 'react';

interface MigrateButtonProps {
  hasPublicMetadata: boolean;
  hasUnsafeMetadata: boolean;
  role?: string;
}

export function MigrateButton({ hasPublicMetadata, hasUnsafeMetadata, role }: MigrateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    role?: string;
    farmId?: string;
  } | null>(null);

  // Only show button if publicMetadata is empty but unsafeMetadata has role
  if (hasPublicMetadata || !hasUnsafeMetadata) {
    return null;
  }

  const handleMigrate = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/migrate-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          role: data.role,
          farmId: data.farmId,
        });

        // Refresh the page after 2 seconds to show updated metadata
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setResult({
          success: false,
          error: data.error || 'Migration failed',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-red-50 border-2 border-red-500 rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-red-900">⚠️ Metadata Migration Required</h2>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded">
          <p className="text-gray-900 mb-2">
            <strong>Issue Detected:</strong> Your account has role information in{' '}
            <code>unsafeMetadata</code> but not in <code>publicMetadata</code>.
          </p>
          <p className="text-gray-700 mb-2">
            This happens for accounts created before the recent authentication update. Your role is
            stored in the wrong location, which causes routing issues (e.g., farmers being
            redirected to regular user dashboard).
          </p>
          <p className="text-gray-700">
            <strong>Your role:</strong>{' '}
            <code className="bg-gray-100 px-2 py-1 rounded">{role}</code>
          </p>
        </div>

        <div className="bg-yellow-50 p-4 rounded border border-yellow-400">
          <p className="text-yellow-900">
            <strong>Solution:</strong> Click the button below to migrate your metadata to the
            correct location. This is a one-time fix that will enable proper role-based routing.
          </p>
        </div>

        <button
          onClick={handleMigrate}
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          {isLoading ? '🔄 Migrating...' : '✅ Migrate Metadata Now'}
        </button>

        {result && (
          <div
            className={`p-4 rounded ${
              result.success
                ? 'bg-green-50 border border-green-500'
                : 'bg-red-50 border border-red-500'
            }`}
          >
            {result.success ? (
              <div className="text-green-900">
                <p className="font-bold mb-2">✅ {result.message}</p>
                <p className="text-sm">
                  Role: <code className="bg-white px-2 py-1 rounded">{result.role}</code>
                  {result.farmId && (
                    <>
                      {' | '}
                      Farm ID: <code className="bg-white px-2 py-1 rounded">{result.farmId}</code>
                    </>
                  )}
                </p>
                <p className="text-sm mt-2 italic">Refreshing page in 2 seconds...</p>
              </div>
            ) : (
              <div className="text-red-900">
                <p className="font-bold mb-2">❌ Migration Failed</p>
                <p className="text-sm">{result.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
