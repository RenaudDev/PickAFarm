import { Skeleton } from '@/components/ui/skeleton';
import { FarmNavbar } from '@/components/farm-navbar';
import { FarmFooter } from '@/components/farm-footer';

export default function BlogLoading() {
  return (
    <div className="bg-background">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <Skeleton className="h-10 w-32 mb-12" />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <Skeleton className="w-full h-48" />
              <div className="p-6">
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
