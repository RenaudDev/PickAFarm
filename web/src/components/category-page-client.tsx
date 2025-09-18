"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CategoryPageClientProps {
  category: any;
  slug: string;
}

export default function CategoryPageClient({ category, slug }: CategoryPageClientProps) {
  const router = useRouter();
  const [searchLocation, setSearchLocation] = useState("");

  const handleSearch = () => {
    if (searchLocation.trim()) {
      const locationSlug = searchLocation.toLowerCase().replace(/\s+/g, "-");
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
        <div className="flex-1">
          <Input
            placeholder="Enter city, province..."
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            onKeyPress={handleKeyPress}
            className="h-12 text-base"
          />
        </div>
        <Button onClick={handleSearch} className="h-12 px-8 bg-primary hover:bg-primary/90" size="lg">
          <Search className="h-4 w-4 mr-2" />
          Find Farms
        </Button>
      </div>
    </div>
  );
}
