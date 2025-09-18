"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { locations } from "@/data/search-data";

interface CategoryPageClientProps {
  category: any;
  slug: string;
}

export default function CategoryPageClient({ category, slug }: CategoryPageClientProps) {
  const router = useRouter();
  const [locationQuery, setLocationQuery] = useState("");
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  const filteredLocations = locations
    .filter((location) => location.toLowerCase().includes(locationQuery.toLowerCase()))
    .slice(0, 5);

  const handleSearch = () => {
    if (locationQuery.trim()) {
      // Convert location to slug format (e.g., "Toronto, Ontario" -> "toronto-ontario-canada")
      const locationSlug = locationQuery
        .toLowerCase()
        .replace(/,\s*/g, '-')
        .replace(/\s+/g, '-')
        .concat('-canada'); // Add country suffix for consistency
      router.push(`/${slug}/near/${locationSlug}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              placeholder="Enter city, province..."
              className="pl-10 h-12 text-base"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onFocus={() => setShowLocationSuggestions(true)}
              onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
              onKeyPress={handleKeyPress}
            />
            {showLocationSuggestions && locationQuery && filteredLocations.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-20 mt-1">
                {filteredLocations.map((location, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm"
                    onClick={() => {
                      setLocationQuery(location);
                      setShowLocationSuggestions(false);
                    }}
                  >
                    {location}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <Button 
          onClick={handleSearch} 
          className="h-12 px-8 bg-primary hover:bg-primary/90" 
          size="lg"
          disabled={!locationQuery.trim()}
        >
          <Search className="h-4 w-4 mr-2" />
          Find Farms
        </Button>
      </div>
    </div>
  );
}
