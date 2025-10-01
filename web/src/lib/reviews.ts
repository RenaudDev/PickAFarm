export interface Review {
    id: string
    author: string
    content: string
    rating: number
    date: string
    date_gmt: string
  }
  
  export interface ReviewsData {
    reviews: Review[]
    count: number
    average_rating: number
  }
  
  export async function getReviews(farmId: string): Promise<ReviewsData | null> {
    try {
      const res = await fetch(
        `https://admin.pickafarm.com/wp-json/reviews/v1/listing/${farmId}`,
        { 
          next: { revalidate: 3600 }
        }
      )
      
      if (!res.ok) {
        // Don't log error for 404 - just means no reviews yet
        if (res.status !== 404) {
          console.error(`Failed to fetch reviews for ${farmId}: ${res.status}`)
        }
        return null
      }
      
      return await res.json()
    } catch (error) {
      console.error('Error fetching reviews:', error)
      return null
    }
  }
  
  export async function submitReview(data: {
    listing_id: string
    listing_title: string
    rating: number
    comment: string
    name: string
    email: string
  }) {
    try {
      const res = await fetch(
        'https://admin.pickafarm.com/wp-json/reviews/v1/submit',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      )
      
      return await res.json()
    } catch (error) {
      console.error('Error submitting review:', error)
      throw error
    }
  }