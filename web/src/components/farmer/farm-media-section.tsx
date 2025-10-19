'use client';

import React from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FarmMediaSectionProps {
  farmName?: string;
}

export function FarmMediaSection({ farmName = 'Your Farm' }: FarmMediaSectionProps) {
  return (
    <div className="mb-8 space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Your Farm's First Impression</h2>
        <p className="text-sm text-gray-600 mt-1">
          Upload your farm's logo and cover photo. This is what customers see first.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo Upload */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-900">
            Farm Logo
            <span className="text-green-600 ml-1">•</span>
          </label>
          <div className="relative group">
            <div className="w-full aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 hover:border-green-500 transition-colors duration-200 flex items-center justify-center cursor-pointer group-hover:bg-gray-100">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-3 group-hover:bg-green-200 transition-colors">
                  <Upload className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">Click or drag to upload</p>
                <p className="text-xs text-gray-600 mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>
            {/* Hidden input for future functionality */}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled
              aria-label="Upload farm logo"
            />
          </div>
          <p className="text-xs text-gray-600">
            Square format recommended (1:1). Shows as circular badge on your listing.
          </p>
        </div>

        {/* Cover Photo Upload */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-900">
            Cover Photo
            <span className="text-green-600 ml-1">•</span>
          </label>
          <div className="relative group">
            <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 hover:border-green-500 transition-colors duration-200 flex items-center justify-center cursor-pointer group-hover:bg-gray-100"
              style={{ aspectRatio: '16/9' }}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-3 group-hover:bg-green-200 transition-colors">
                  <ImageIcon className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">Click or drag to upload</p>
                <p className="text-xs text-gray-600 mt-1">PNG, JPG up to 10MB</p>
              </div>
            </div>
            {/* Hidden input for future functionality */}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled
              aria-label="Upload cover photo"
            />
          </div>
          <p className="text-xs text-gray-600">
            Landscape format recommended (16:9). First thing customers see on your listing.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-100">
              <span className="text-green-600 text-xs font-bold">i</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-green-900">
              Pro tip: A high-quality cover photo increases listing views by up to 40%
            </p>
            <p className="text-xs text-green-700 mt-1">
              Use bright, clear images that showcase your farm's best features.
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="pt-4 border-t border-gray-200" />
    </div>
  );
}
