"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, AlertCircle } from "lucide-react";

// Import the full locations data
import locationsWithFarms from "../../data/locations-with-farms.json";

interface CategoryPageClientProps {
  category: any;
  slug: string;
}

export default function CategoryPageClient({ category, slug }: CategoryPageClientProps) {
  const router = useRouter();
  const [locationQuery, setLocationQuery] = useState("");
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Create searchable location strings from locations that have farms
  const locationOptions = locationsWithFarms
    .filter(location => location.farmCount > 0) // Only locations with farms
    .map(location => ({
      displayName: location.full_location, // "Ajax, Ontario, Canada"
      searchName: `${location.name}, ${location.province}`, // "Ajax, Ontario" for easier searching
      slug: location.location_slug, // "ajax-ontario-canada"
      farmCount: location.farmCount
    }));

  const filteredLocations = locationOptions
    .filter((location) => 
      location.displayName.toLowerCase().includes(locationQuery.toLowerCase()) ||
      location.searchName.toLowerCase().includes(locationQuery.toLowerCase()) ||
      location.slug.toLowerCase().includes(locationQuery.toLowerCase())
    )
    .slice(0, 8); // Show more suggestions

  const handleSearch = () => {
    if (locationQuery.trim()) {
      setSearchError(""); // Clear any previous errors
      
      // Try to find exact match first
      const exactMatch = locationOptions.find(location => 
        location.displayName.toLowerCase() === locationQuery.toLowerCase() ||
        location.searchName.toLowerCase() === locationQuery.toLowerCase()
      );

      if (exactMatch) {
        // Use the exact location slug
        router.push(`/${slug}/near/${exactMatch.slug}`);
      } else {
        // Try partial match
        const partialMatch = locationOptions.find(location =>
          location.displayName.toLowerCase().includes(locationQuery.toLowerCase()) ||
          location.searchName.toLowerCase().includes(locationQuery.toLowerCase())
        );

        if (partialMatch) {
          router.push(`/${slug}/near/${partialMatch.slug}`);
        } else {
          // No match found - show error message
          setSearchError(`Sorry, we don't have any farms near "${locationQuery}". Try searching for a different location.`);
        }
      }
    }
  };

  const handleLocationSelect = (location: typeof locationOptions[0]) => {
    setLocationQuery(location.searchName);
    setShowLocationSuggestions(false);
    setSearchError(""); // Clear any errors
    // Immediately redirect when a suggestion is clicked
    router.push(`/${slug}/near/${location.slug}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationQuery(e.target.value);
    setSearchError(""); // Clear error when user starts typing
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              placeholder="Enter city, province..."
              className={`pl-10 h-12 text-base ${searchError ? 'border-red-500' : ''}`}
              value={locationQuery}
              onChange={handleInputChange}
              onFocus={() => setShowLocationSuggestions(true)}
              onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
              onKeyPress={handleKeyPress}
            />
            {showLocationSuggestions && locationQuery && filteredLocations.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-20 mt-1 max-h-64 overflow-y-auto">
                {filteredLocations.map((location, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors text-sm border-b border-border last:border-b-0"
                    onClick={() => handleLocationSelect(location)}
                  >
                    <div className="font-medium">{location.searchName}</div>
                    <div className="text-xs text-muted-foreground">
                      {location.farmCount} farm{location.farmCount !== 1 ? 's' : ''} nearby
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showLocationSuggestions && locationQuery && filteredLocations.length === 0 && (
              <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-20 mt-1 p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  No locations found with farms nearby
                </div>
              </div>
            )}
          </div>
          {searchError && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {searchError}
            </div>
          )}
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
