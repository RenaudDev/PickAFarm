const WP_API_URL = 'https://admin.pickafarm.com/wp-json/wp/v2';

export async function getAllVarieties() {
  const res = await fetch(`${WP_API_URL}/varieties?_embed`, {
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
