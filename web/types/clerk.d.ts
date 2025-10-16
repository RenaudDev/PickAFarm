/**
 * Custom Clerk Session Claims Type Definitions
 * Story 2.2.2: Fix Clerk Metadata Access & Static Export Compatibility
 *
 * These types extend Clerk's default session claims to include our custom
 * metadata fields that are exposed via Clerk Dashboard session token customization.
 *
 * Configuration Required:
 * In Clerk Dashboard → Sessions → Customize session token:
 *   - Custom claim name: "metadata"
 *   - Custom claim value: {{user.public_metadata}}
 */

declare global {
  /**
   * CustomJwtSessionClaims extends Clerk's default JwtSessionClaims
   * to include our custom metadata claim.
   *
   * This gives us type-safe access to user.publicMetadata.role in middleware
   * via sessionClaims.metadata.role
   */
  interface CustomJwtSessionClaims {
    /**
     * Custom metadata claim containing user.publicMetadata
     * Configured in Clerk Dashboard to expose publicMetadata to middleware
     */
    metadata?: {
      /**
       * User role: 'farmer' or 'user'
       * Used by middleware for role-based route guards
       */
      role?: 'farmer' | 'user';

      /**
       * Farm ID (Zoho CRM record ID)
       * Only present for farmer users
       * Format: "zcrm_38729000000440015"
       */
      farmId?: string;
    };
  }
}

// This export is required to make this a module and allow global augmentation
export {};
