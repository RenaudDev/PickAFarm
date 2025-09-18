/**
 * PickAFarm API - Cloudflare Worker
 * Serves farm data to web and mobile platforms
 * Handles Zoho CRM webhooks for real-time updates
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for cross-origin requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API Routes
      if (path.startsWith('/api/')) {
        return await handleAPIRequest(request, env, path, corsHeaders);
      }

      // Default response
      return new Response(
        JSON.stringify({
          message: 'PickAFarm API',
          version: '1.0.0',
          endpoints: {
            farms: '/api/farms',
            cities: '/api/cities',
            search: '/api/search',
            notifications: '/api/notifications'
          }
        }),
        {
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        }
      );

    } catch (error) {
      console.error('API Error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Internal Server Error',
          message: error.message 
        }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        }
      );
    }
  },
};

/**
 * Handle API requests
 */
async function handleAPIRequest(request, env, path, corsHeaders) {
  const method = request.method;
  
  // Remove /api prefix
  const apiPath = path.replace('/api', '');

  switch (apiPath) {
    case '/farms':
      return await handleFarms(request, env, method, corsHeaders);
    
    case '/cities':
      return await handleCities(request, env, method, corsHeaders);
    
    case '/search':
      return await handleSearch(request, env, method, corsHeaders);
    
    case '/notifications':
      return await handleNotifications(request, env, method, corsHeaders);
    
    default:
      return new Response(
        JSON.stringify({ error: 'Endpoint not found' }),
        { 
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        }
      );
  }
}

/**
 * Handle /api/farms requests
 */
async function handleFarms(request, env, method, corsHeaders) {
  if (method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }

  try {
    // Get query parameters
    const url = new URL(request.url);
    const state = url.searchParams.get('state');
    const city = url.searchParams.get('city');
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Build query
    let query = `
      SELECT 
        f.zoho_record_id as id,
        f.name,
        f.slug,
        f.street,
        f.city as city_name,
        f.postal_code,
        f.state as state_province,
        f.country,
        f.latitude,
        f.longitude,
        f.phone,
        f.email,
        f.website,
        f.facebook,
        f.instagram,
        f.location_link,
        f.description,
        f.categories,
        f.type,
        f.amenities,
        f.varieties,
        f.pet_friendly,
        f.price_range,
        f.price_range_min,
        f.price_range_max,
        f.payment_methods,
        f.established_in,
        f.opening_date,
        f.closing_date,
        f.sunday_hours,
        f.monday_hours,
        f.tuesday_hours,
        f.wednesday_hours,
        f.thursday_hours,
        f.friday_hours,
        f.saturday_hours,
        f.verified,
        f.featured,
        f.active,
        f.updated_at
      FROM farms f
      WHERE f.active = 1
    `;

    const params = [];

    if (state) {
      query += ' AND f.state = ?';
      params.push(state);
    }

    if (city) {
      query += ' AND f.city = ?';
      params.push(city);
    }

    query += ' ORDER BY f.featured DESC, f.verified DESC, f.name ASC';
    query += ' LIMIT ?';
    params.push(limit);

    // Execute query
    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(...params).all();

    return new Response(
      JSON.stringify({
        farms: result.results || [],
        count: result.results?.length || 0,
        filters: { state, city, category, limit }
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );

  } catch (error) {
    console.error('Farms API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch farms',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }
}

/**
 * Handle /api/cities requests
 */
async function handleCities(request, env, method, corsHeaders) {
  if (method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }

  try {
    const url = new URL(request.url);
    const state = url.searchParams.get('state');

    let query = `
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.state_province,
        c.country,
        c.tier,
        COUNT(f.zoho_record_id) as farm_count
      FROM cities c
      LEFT JOIN farms f ON c.name = f.city AND f.active = 1
    `;

    const params = [];

    if (state) {
      query += ' WHERE c.state_province = ?';
      params.push(state);
    }

    query += ' GROUP BY c.id ORDER BY c.tier ASC, c.name ASC';

    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(...params).all();

    return new Response(
      JSON.stringify({
        cities: result.results || [],
        count: result.results?.length || 0
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );

  } catch (error) {
    console.error('Cities API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch cities',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }
}

/**
 * Handle /api/search requests
 */
async function handleSearch(request, env, method, corsHeaders) {
  if (method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }

  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    if (!q || q.length < 2) {
      return new Response(
        JSON.stringify({ 
          error: 'Search query must be at least 2 characters',
          farms: [],
          count: 0 
        }),
        {
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        }
      );
    }

    // Use FTS for search
    const query = `
      SELECT 
        f.zoho_record_id as id,
        f.name,
        f.slug,
        f.street,
        f.description,
        f.city as city_name,
        f.state as state_province,
        farms_fts.rank
      FROM farms_fts
      JOIN farms f ON farms_fts.rowid = f.zoho_record_id
      WHERE farms_fts MATCH ? AND f.active = 1
      ORDER BY farms_fts.rank
      LIMIT ?
    `;

    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(q, limit).all();

    return new Response(
      JSON.stringify({
        farms: result.results || [],
        count: result.results?.length || 0,
        query: q
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );

  } catch (error) {
    console.error('Search API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Search failed',
        message: error.message,
        farms: [],
        count: 0 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }
}

/**
 * Handle /api/notifications requests
 */
async function handleNotifications(request, env, method, corsHeaders) {
  // Placeholder for notification system
  return new Response(
    JSON.stringify({ 
      message: 'Notifications endpoint - coming soon',
      method: method 
    }),
    {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    }
  );
}
