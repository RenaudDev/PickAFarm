'use client';

import React from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FarmMediaSectionProps {
  farmName?: string;
}

export function FarmMediaSection({ farmName = 'Your Farm' }: FarmMediaSectionProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* Section Title */}
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Media</h2>

      <div className="space-y-3">
        {/* Logo Upload */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-24">
            <label className="text-sm font-medium text-gray-900">Logo</label>
            <p className="text-xs text-gray-600 mt-0.5">1:1 • 5MB max</p>
          </div>
          <div className="w-16 h-16 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-6 h-6 text-gray-400" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled
          >
            <Upload className="w-4 h-4" />
            Upload
          </Button>
        </div>

        {/* Cover Photo Upload */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-24">
            <label className="text-sm font-medium text-gray-900">Cover Photo</label>
            <p className="text-xs text-gray-600 mt-0.5">8:5 • 10MB max</p>
          </div>
          <div className="w-32 h-20 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-6 h-6 text-gray-400" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled
          >
            <Upload className="w-4 h-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="pt-2 border-t border-gray-300" />
    </div>
  );
}
