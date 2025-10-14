export function MapSkeleton() {
  return (
    <div className="w-full h-[70vh] lg:h-[80vh] bg-muted animate-pulse relative overflow-hidden">
      {/* Subtle grid pattern to mimic map */}
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

      {/* Center loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>

      {/* Mock map controls (top-left corner) */}
      <div className="absolute top-4 left-4 space-y-2">
        <div className="w-8 h-8 bg-background/80 rounded shadow" />
        <div className="w-8 h-8 bg-background/80 rounded shadow" />
      </div>

      {/* Mock zoom controls (bottom-right corner) */}
      <div className="absolute bottom-4 right-4 space-y-1">
        <div className="w-10 h-10 bg-background/80 rounded shadow" />
        <div className="w-10 h-10 bg-background/80 rounded shadow" />
      </div>
    </div>
  );
}
