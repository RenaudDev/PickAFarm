'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Upload, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Image from 'next/image';

interface FarmMediaSectionProps {
  farmName?: string;
}

interface FarmData {
  logo_url?: string | null;
  background_url?: string | null;
}

export function FarmMediaSection({ farmName = 'Your Farm' }: FarmMediaSectionProps) {
  const { getToken } = useAuth();
  const [farmData, setFarmData] = useState<FarmData | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  // Fetch farm data to get current images
  useEffect(() => {
    async function fetchFarmData() {
      try {
        const token = await getToken();
        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pickafarm-api.94623956quebecinc.workers.dev';
        const response = await fetch(`${apiUrl}/api/farmer/farm`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setFarmData({
            logo_url: data.farm?.logo_url,
            background_url: data.farm?.background_url
          });
        }
      } catch (err) {
        console.error('Error fetching farm data:', err);
      }
    }

    fetchFarmData();
  }, [getToken]);

  const handleImageUpload = async (imageType: 'logo' | 'background', file: File) => {
    const setUploading = imageType === 'logo' ? setUploadingLogo : setUploadingBackground;
    setUploading(true);

    try {
      const token = await getToken();
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('imageType', imageType);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pickafarm-api.94623956quebecinc.workers.dev';
      const response = await fetch(`${apiUrl}/api/farmer/farm/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Update local state with new image URL
      setFarmData(prev => ({
        ...prev,
        [`${imageType}_url`]: result.url
      }));

      toast.success(`${imageType === 'logo' ? 'Logo' : 'Cover photo'} uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (imageType: 'logo' | 'background', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
      return;
    }

    // Validate file size
    const maxSize = imageType === 'logo' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size exceeds ${imageType === 'logo' ? '5MB' : '10MB'} limit`);
      return;
    }

    handleImageUpload(imageType, file);
  };

  return (
    <section className="bg-green-50 border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Farm Media</h2>
          <p className="text-sm text-gray-600">Add your farm logo and cover photo</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Logo Upload */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm border border-gray-300" />
            Farm Logo
          </h3>
          <div className="flex items-start gap-4">
            <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-gray-200 bg-white flex-shrink-0">
              {farmData?.logo_url ? (
                <Image
                  src={farmData.logo_url}
                  alt="Farm logo"
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-100">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-2">
                <p className="mb-1">Square format recommended</p>
                <p>Appears in search results and listing header</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => handleFileSelect('logo', e)}
                  disabled={uploadingLogo}
                />
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {farmData?.logo_url ? 'Change Logo' : 'Upload Logo'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Cover Photo Upload */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm border border-gray-300" />
            Cover Photo
          </h3>
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video bg-white">
              {farmData?.background_url ? (
                <Image
                  src={farmData.background_url}
                  alt="Farm cover photo"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-100">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                ref={backgroundInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleFileSelect('background', e)}
                disabled={uploadingBackground}
              />
              <Button
                type="button"
                variant="default"
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
                onClick={() => backgroundInputRef.current?.click()}
                disabled={uploadingBackground}
              >
                {uploadingBackground ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {farmData?.background_url ? 'Change Cover Photo' : 'Upload Cover Photo'}
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-600">Wide format - This is the first image visitors see</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
