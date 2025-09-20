import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Wheat } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="flex justify-center">
          <Wheat className="h-16 w-16 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <h2 className="text-xl font-semibold text-muted-foreground">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/">
              Return Home
            </Link>
          </Button>
          
        </div>
      </div>
    </div>
  )
}
