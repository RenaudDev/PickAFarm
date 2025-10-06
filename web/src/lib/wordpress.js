const WP_API_URL = 'https://admin.pickafarm.com/wp-json/wp/v2';

export async function getAllVarieties() {
  const res = await fetch(`${WP_API_URL}/varieties?_embed&per_page=100`, {
    next: { revalidate: 3600 } // Cache for 1 hour
  });
  if (!res.ok) throw new Error('Failed to fetch varieties');
  return res.json();
}

export async function getVarietyBySlug(slug) {
  const res = await fetch(`${WP_API_URL}/varieties?slug=${slug}&_embed`, {
    next: { revalidate: 3600 }
  });
  if (!res.ok) throw new Error('Failed to fetch variety');
  const data = await res.json();
  return data[0];
}

export async function getVarietyPaths() {
  const varieties = await getAllVarieties();
  return varieties.map(variety => ({
    variety: variety.slug
  }));
}

export async function getAllPosts() {
  const res = await fetch(`${WP_API_URL}/posts?_embed`, {
    next: { revalidate: 3600 }
  });
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function getPostBySlug(slug) {
  const res = await fetch(`${WP_API_URL}/posts?slug=${slug}&_embed`, {
    next: { revalidate: 3600 }
  });
  if (!res.ok) throw new Error('Failed to fetch post');
  const data = await res.json();
  return data[0];
}

export async function getPostPaths() {
  const posts = await getAllPosts();
  return posts.map(post => ({
    posts: post.slug
  }));
}

export async function getVarietiesByTag(tagSlug) {
  try {
    // First, get the tag ID from the slug
    const tagRes = await fetch(`${WP_API_URL}/tags?slug=${tagSlug}`, {
      next: { revalidate: 3600 }
    });

    if (!tagRes.ok) {
      console.warn(`Tag "${tagSlug}" not found`);
      return [];
    }

    const tags = await tagRes.json();
    if (tags.length === 0) {
      console.warn(`No tags found for slug "${tagSlug}"`);
      return [];
    }

    const tagId = tags[0].id;

    // Fetch varieties with this tag
    const res = await fetch(`${WP_API_URL}/varieties?tags=${tagId}&_embed&per_page=100`, {
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      console.warn(`Failed to fetch varieties for tag ${tagSlug}`);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error(`Error fetching varieties by tag "${tagSlug}":`, error);
    return [];
  }
}

/**
 * Get multiple varieties by their slugs
 * @param {string[]} slugs - Array of variety slugs to fetch
 * @returns {Promise<Array>} Array of variety objects
 */
export async function getVarietiesBySlugs(slugs) {
  if (!slugs || slugs.length === 0) {
    return [];
  }

  try {
    // WordPress REST API supports fetching by slug array
    const slugQuery = slugs.map(s => `slug[]=${encodeURIComponent(s)}`).join('&');
    const res = await fetch(`${WP_API_URL}/varieties?${slugQuery}&_embed&per_page=100`, {
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      console.warn(`Failed to fetch varieties by slugs`);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error(`Error fetching varieties by slugs:`, error);
    return [];
  }
}

// Get review aggregates for a farm (count and average rating only)
export async function getReviewAggregates(farmId) {
  try {
    const res = await fetch(
      `https://admin.pickafarm.com/wp-json/reviews/v1/listing/${farmId}`,
      { next: { revalidate: 3600 } }
    );
    
    if (!res.ok) {
      // No reviews or farm not found
      return { count: 0, average_rating: null };
    }
    
    const data = await res.json();
    return {
      count: data.count || 0,
      average_rating: data.average_rating || null
    };
  } catch (error) {
    console.error(`Error fetching review aggregates for ${farmId}:`, error);
    return { count: 0, average_rating: null };
  }
}