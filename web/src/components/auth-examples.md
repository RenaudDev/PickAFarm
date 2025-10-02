# Client-Side Route Protection Examples

## Method 1: Using ProtectedRoute Component (Recommended)

```tsx
"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { useUser } from "@clerk/nextjs"

export default function MyProtectedPage() {
  const { user } = useUser()

  return (
    <ProtectedRoute>
      <div>
        <h1>Welcome {user?.firstName}!</h1>
        <p>This content is only visible to authenticated users</p>
      </div>
    </ProtectedRoute>
  )
}
```

## Method 2: Using useRequireAuth Hook

```tsx
"use client"

import { useRequireAuth } from "@/hooks/use-require-auth"
import { useUser } from "@clerk/nextjs"

export default function MyProtectedPage() {
  const { isLoaded, isSignedIn } = useRequireAuth()
  const { user } = useUser()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return null // Will redirect
  }

  return (
    <div>
      <h1>Welcome {user?.firstName}!</h1>
    </div>
  )
}
```

## Method 3: Conditional Rendering (For Sections)

```tsx
"use client"

import { useAuth, useUser } from "@clerk/nextjs"
import { SignInButton } from "@clerk/nextjs"

export default function MyPage() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()

  return (
    <div>
      <h1>Public Content</h1>
      <p>Everyone can see this</p>

      {isSignedIn ? (
        <div>
          <h2>Private Section</h2>
          <p>Welcome back, {user?.firstName}!</p>
        </div>
      ) : (
        <div>
          <p>Sign in to see more</p>
          <SignInButton mode="modal">
            <button>Sign In</button>
          </SignInButton>
        </div>
      )}
    </div>
  )
}
```

## Method 4: Protecting Actions/Buttons

```tsx
"use client"

import { useAuth } from "@clerk/nextjs"
import { SignInButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export function SaveFarmButton({ farmId }: { farmId: string }) {
  const { isSignedIn } = useAuth()

  const handleSave = () => {
    // This will only run if user is signed in
    console.log("Saving farm:", farmId)
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button>Sign in to Save</Button>
      </SignInButton>
    )
  }

  return (
    <Button onClick={handleSave}>
      Save Farm
    </Button>
  )
}
```

## Best Practices

1. **Always use "use client"** directive for components using Clerk hooks
2. **Check isLoaded** before checking isSignedIn to avoid flashing content
3. **Use ProtectedRoute** for entire pages that require auth
4. **Use conditional rendering** for mixed public/private content
5. **Show loading states** while auth is being checked
6. **Provide clear CTAs** for unauthenticated users to sign in

## Security Notes

⚠️ **Client-side protection is UI-only** - The HTML is still in the static build
⚠️ **Never put sensitive data** in static files
⚠️ **Always validate on the backend** - If you have external APIs, validate tokens there
✅ **Good for**: Personalizing UI, hiding features, improving UX
❌ **Not good for**: Protecting truly sensitive data or business logic
