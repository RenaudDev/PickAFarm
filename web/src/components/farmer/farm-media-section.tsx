'use client';

import React from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface FarmMediaSectionProps {
  farmName?: string;
}

export function FarmMediaSection({ farmName = 'Your Farm' }: FarmMediaSectionProps) {
  return (
    <div className="mb-8 space-y-4">
      {/* Section Title */}
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Media</h2>

      <div className="flex gap-6 items-flex-start">
        {/* Logo Upload - 250x250px */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-900">
            Logo
            <span className="text-green-600 ml-1">•</span>
          </label>
          <div className="relative group">
            <div
              className="w-[250px] h-[250px] bg-gradient-to-br from-green-50 to-green-50/50 rounded-lg border-2 border-dashed border-green-300 hover:border-green-600 hover:bg-green-100/30 transition-all duration-200 flex items-center justify-center cursor-pointer group"
              style={{ aspectRatio: '1/1' }}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-green-600/90 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-900">Drag or click</p>
                <p className="text-xs text-gray-600 mt-0.5">PNG, JPG • 5MB max</p>
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled
              aria-label="Upload farm logo"
            />
          </div>
          <p className="text-xs text-gray-600">Square (1:1)</p>
        </div>

        {/* Cover Photo Upload - 8x5 ratio, compact */}
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-medium text-gray-900">
            Cover Photo
            <span className="text-green-600 ml-1">•</span>
          </label>
          <div className="relative group">
            <div
              className="w-full bg-gradient-to-br from-green-50 to-green-50/50 rounded-lg border-2 border-dashed border-green-300 hover:border-green-600 hover:bg-green-100/30 transition-all duration-200 flex items-center justify-center cursor-pointer"
              style={{ aspectRatio: '8/5' }}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-green-600/90 rounded-lg mb-2 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-900">Drag or click</p>
                <p className="text-xs text-gray-600 mt-0.5">PNG, JPG • 10MB max</p>
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled
              aria-label="Upload cover photo"
            />
          </div>
          <p className="text-xs text-gray-600">Landscape (8:5)</p>
        </div>
      </div>

      {/* Divider */}
      <div className="pt-2 border-t border-gray-300" />
    </div>
  );
}
