'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { getReviews, ReviewsData } from '@/lib/reviews';

interface ReviewsListProps {
  farmId: string;
}

export default function ReviewsList({ farmId }: ReviewsListProps) {
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      console.log('🔍 Fetching reviews for farmId:', farmId);
      console.log(
        '🔗 API URL:',
        `https://admin.pickafarm.com/wp-json/reviews/v1/listing/${farmId}`
      );
      try {
        const data = await getReviews(farmId);
        console.log('✅ Reviews data received:', data);
        setReviewsData(data);
      } catch (error) {
        console.error('❌ Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [farmId]);

  if (loading) {
    return (
      <Card className="shadow-sm border-0 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-semibold">
            <Star className="w-6 h-6 text-primary" />
            Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading reviews...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl font-semibold">
          <Star className="w-6 h-6 text-primary" />
          Reviews
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reviewsData && reviewsData.count > 0 ? (
          <div className="space-y-6">
            {/* Average Rating */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="text-4xl font-bold">{reviewsData.average_rating}</div>
              <div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(reviewsData.average_rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {reviewsData.count} {reviewsData.count === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviewsData.reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">{review.author}</p>
                      <div className="flex gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(review.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{review.content}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
        )}
      </CardContent>
    </Card>
  );
}
