# Clerk Session Token Configuration

## Required: Configure Custom Session Claims

For farmer role-based routing to work in middleware, you must configure Clerk's session token to include custom claims.

### Steps:

1. **Open Clerk Dashboard**
   - Go to [https://dashboard.clerk.com/](https://dashboard.clerk.com/)
   - Select your application

2. **Navigate to Sessions**
   - Click **Sessions** in the left sidebar
   - Click **Customize session token**

3. **Add Custom Claims**

   Paste this JSON configuration:
   ```json
   {
     "role": "{{user.unsafe_metadata.role}}",
     "farmId": "{{user.unsafe_metadata.farmId}}"
   }
   ```

4. **Save Changes**
   - Click **Save** or **Apply**

5. **Sign Out and Sign Back In**
   - Users must re-authenticate for new token format to take effect

### Verification

After configuration:

1. Log in as a farmer user
2. Visit `/debug-auth`
3. Check "Session Claims" section - should show `"role": "farmer"`
4. Navigate to `/dashboard` - should auto-redirect to `/dashboard/farmer`

### Why This Is Needed

- Middleware accesses `sessionClaims` (JWT), not the full User object
- `unsafeMetadata` is NOT automatically included in JWT tokens
- Session token customization exposes `unsafeMetadata.role` as a top-level claim
- Middleware can then read `sessionClaims.role` to detect farmers

### Troubleshooting

**Middleware still can't see role:**
- Sign out completely
- Clear cookies (or use incognito)
- Sign back in
- Visit `/debug-auth` to verify

**For more details:** See `web/middleware.ts` comments
