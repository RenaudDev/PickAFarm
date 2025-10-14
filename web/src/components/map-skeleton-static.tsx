// Server component - NO "use client" directive
// Pure HTML/CSS skeleton that appears instantly without JavaScript

export function MapSkeletonStatic() {
  return (
    <div className="w-full h-[70vh] lg:h-[80vh] bg-muted animate-pulse relative overflow-hidden">
      {/* Grid pattern background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(0 0 0 / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(0 0 0 / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>

      {/* Mock map controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <div className="w-10 h-10 bg-background/80 rounded-lg shadow-sm" />
        <div className="w-10 h-10 bg-background/80 rounded-lg shadow-sm" />
      </div>

      {/* Mock zoom controls */}
      <div className="absolute bottom-24 right-4 space-y-1">
        <div className="w-10 h-10 bg-background/80 rounded-t-lg shadow-sm" />
        <div className="w-10 h-10 bg-background/80 rounded-b-lg shadow-sm" />
      </div>
    </div>
  );
}
