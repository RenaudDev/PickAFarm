/**
 * Farm Profile Header Component
 *
 * Facebook-style profile layout with background image and logo overlay
 * Responsive: Desktop (150x150 logo, 24px margins), Mobile (120x120 logo, 16px margins)
 */

import Image from 'next/image';
import { generateFallbackLogo, getDefaultBackground, isValidImageUrl } from '@/lib/fallback-image';

interface FarmProfileHeaderProps {
  farmName: string;
  logoUrl?: string | null;
  backgroundUrl?: string | null;
  className?: string;
}

export default function FarmProfileHeader({
  farmName,
  logoUrl,
  backgroundUrl,
  className = '',
}: FarmProfileHeaderProps) {
  // Determine which images to use
  const displayBackground = isValidImageUrl(backgroundUrl) ? backgroundUrl : getDefaultBackground();
  const displayLogo = isValidImageUrl(logoUrl) ? logoUrl : generateFallbackLogo(farmName);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Background Image */}
      <div className="relative w-full h-80 lg:h-[500px] rounded-2xl overflow-hidden shadow-sm border">
        <Image
          src={displayBackground}
          alt={`${farmName} - Farm Background`}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
          unoptimized={displayBackground === getDefaultBackground()} // Local images already optimized
        />
      </div>

      {/* Logo Overlay - Bottom Left */}
      <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
        <div className="relative">
          {/* Logo Image */}
          <div className="relative w-[120px] h-[120px] md:w-[150px] md:h-[150px]">
            <Image
              src={displayLogo}
              alt={`${farmName} Logo`}
              fill
              className="rounded-full border-4 border-white shadow-lg object-cover"
              sizes="150px"
              unoptimized={displayLogo.startsWith('data:')} // SVG data URIs don't need optimization
            />
          </div>
        </div>
      </div>
    </div>
  );
}
