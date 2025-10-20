'use client';

import React from 'react';
import { ExternalLink, Loader2, PenSquare, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FarmHeaderProps {
  farmName: string;
  farmSlug?: string;
  verificationStatus?: 'Active' | 'Pending' | 'Suspended';
  isSaving?: boolean;
  onViewListing?: () => void;
}

export function FarmHeader({
  farmName,
  farmSlug,
  verificationStatus = 'Pending',
  isSaving = false,
  onViewListing,
}: FarmHeaderProps) {
  const getBadgeStyle = () => {
    switch (verificationStatus) {
      case 'Active':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          dot: 'bg-emerald-500',
          label: '✓ Verified',
        };
      case 'Pending':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          dot: 'bg-amber-500',
          label: '⏱ Pending Verification',
        };
      case 'Suspended':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          dot: 'bg-red-500',
          label: '✗ Suspended',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          dot: 'bg-gray-500',
          label: 'Unknown',
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <div className="mb-8 bg-gradient-to-r from-green-50 to-green-50/50 border border-green-200 rounded-xl p-6">
      <div className="flex items-start justify-between gap-6">
        {/* Left: Farm Name & Badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-900 break-words">{farmName}</h1>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${badge.bg} ${badge.border} ${badge.text} text-sm font-medium flex-shrink-0`}>
              <div className={`w-2 h-2 rounded-full ${badge.dot}`} />
              {badge.label}
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            type="submit"
            form="farm-form"
            disabled={isSaving}
            className="text-white"
            style={{ backgroundColor: 'oklch(35% .15 142)' }}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <PenSquare className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
          {farmSlug && (
            <Button variant="outline" asChild>
              <a href={`/farms/${farmSlug}/`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
