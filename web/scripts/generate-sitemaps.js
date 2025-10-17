const fs = require('fs');
const path = require('path');

const baseUrl = 'https://pickafarm.com';
const currentDate = new Date().toISOString();

// Import static data
const farmsData = require('../data/farms.json');
const locationsData = require('../data/locations-with-farms.json');
const categoriesData = require('../data/categories.json');
const statesData = require('../data/states-with-farms.json');

// Fetch varieties from WordPress API
async function fetchVarietiesFromWordPress() {
  try {
    const response = await fetch(
      'https://admin.pickafarm.com/wp-json/wp/v2/varieties?per_page=100'
    );
    if (!response.ok) {
      console.warn('⚠️  Could not fetch varieties from WordPress, skipping varieties sitemap');
      return [];
    }
    const varieties = await response.json();
    return varieties;
  } catch (error) {
    console.warn('⚠️  Error fetching varieties:', error.message);
    return [];
  }
}

function generateXmlHeader() {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
}

function generateXmlFooter() {
  return `</urlset>`;
}

function generateUrlEntry(loc, lastmod = currentDate, changefreq = 'weekly', priority = '0.8') {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
}

// Generate main sitemap index
function generateSitemapIndex() {
  const sitemaps = [
    'sitemap-main.xml',
    'sitemap-farms.xml',
    'sitemap-locations.xml',
    'sitemap-states.xml',
    'sitemap-state-categories.xml',
    'sitemap-christmas-tree-farms.xml',
    'sitemap-varieties.xml',
    'sitemap-blog.xml',
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  sitemaps.forEach((sitemap) => {
    xml += `  <sitemap>\n`;
    xml += `    <loc>${baseUrl}/${sitemap}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `  </sitemap>\n`;
  });

  xml += `</sitemapindex>`;

  return xml;
}

// Generate main pages sitemap
function generateMainSitemap() {
  let xml = generateXmlHeader();

  const mainPages = [
    { url: '', priority: '1.0', changefreq: 'daily' }, // Homepage - highest priority
    { url: 'christmas-tree-farms/', priority: '0.95', changefreq: 'weekly' }, // Popular category
    { url: 'pumpkin-patches/', priority: '0.95', changefreq: 'weekly' }, // Popular category
    { url: 'farms-near/', priority: '0.9', changefreq: 'weekly' }, // Location finder
    { url: 'blog/', priority: '0.8', changefreq: 'weekly' }, // Blog
    { url: 'about/', priority: '0.7', changefreq: 'monthly' }, // About page
  ];

  mainPages.forEach((page) => {
    xml += generateUrlEntry(`${baseUrl}/${page.url}`, currentDate, page.changefreq, page.priority);
  });

  xml += generateXmlFooter();
  return xml;
}

// Generate farms sitemap
function generateFarmsSitemap() {
  let xml = generateXmlHeader();

  const activeFarms = farmsData.filter((farm) => farm.active === 1);

  // Sort farms by priority: featured first, then verified, then by subscriber count
  const sortedFarms = activeFarms.sort((a, b) => {
    if (a.featured !== b.featured) return b.featured - a.featured;
    if (a.verified !== b.verified) return b.verified - a.verified;
    return (b.subscriber_count || 0) - (a.subscriber_count || 0);
  });

  sortedFarms.forEach((farm) => {
    // Dynamic priority based on multiple factors
    let priority = '0.5'; // base priority
    if (farm.featured === 1) priority = '0.9';
    else if (farm.verified === 1) priority = '0.8';
    else if (farm.reviews > 10) priority = '0.7';
    else if (farm.subscriber_count > 5) priority = '0.6';

    // More frequent updates for popular farms
    let changefreq = 'monthly';
    if (farm.featured === 1 || farm.subscriber_count > 20) changefreq = 'weekly';
    else if (farm.verified === 1 || farm.reviews > 5) changefreq = 'weekly';

    // Use actual update date if available, ensure valid ISO format
    let lastmod = currentDate;
    if (farm.updated_at) {
      try {
        // Ensure it's a valid date
        const date = new Date(farm.updated_at);
        if (!isNaN(date.getTime())) {
          lastmod = date.toISOString();
        }
      } catch (e) {
        // Use current date if parsing fails
      }
    }

    xml += generateUrlEntry(`${baseUrl}/farms/${farm.slug}/`, lastmod, changefreq, priority);
  });

  xml += generateXmlFooter();

  console.log(`  ✅ Added ${sortedFarms.length} active farms to sitemap`);
  return xml;
}

// Generate locations sitemap
function generateLocationsSitemap() {
  let xml = generateXmlHeader();

  const locations = locationsData.filter((location) => location.farms && location.farms.length > 0);

  locations.forEach((location) => {
    xml += generateUrlEntry(
      `${baseUrl}/farms-near/${location.location_slug}/`,
      currentDate,
      'weekly',
      '0.8'
    );
  });

  xml += generateXmlFooter();
  return xml;
}

// Generate christmas tree farms sitemap
function generateChristmasTreeFarmsSitemap() {
  let xml = generateXmlHeader();

  const category = 'christmas-tree-farms';
  const locations = locationsData.filter((location) => location.farms && location.farms.length > 0);

  // Category landing page
  xml += generateUrlEntry(`${baseUrl}/${category}/`, currentDate, 'weekly', '0.9');

  // Category + location pages
  locations.forEach((location) => {
    xml += generateUrlEntry(
      `${baseUrl}/${category}/near/${location.location_slug}/`,
      currentDate,
      'weekly',
      '0.8'
    );
  });

  xml += generateXmlFooter();
  return xml;
}

// Generate states sitemap
function generateStatesSitemap() {
  let xml = generateXmlHeader();

  statesData.forEach((state) => {
    const priority = state.total_farms >= 20 ? '0.9' : '0.8';
    xml += generateUrlEntry(`${baseUrl}/${state.state_slug}/`, currentDate, 'weekly', priority);
  });

  xml += generateXmlFooter();
  return xml;
}

// Generate state+category pages sitemap (money pages)
function generateStateCategoriesSitemap() {
  let xml = generateXmlHeader();

  // Helper to get category variations
  const getCategoryVariations = (categoryName) => {
    const variations = [categoryName];

    if (categoryName.includes('Christmas Tree')) {
      variations.push('Christmas Tree', 'Christmas Trees', 'Christmas Tree Farms');
    }
    if (categoryName.includes('Apple')) {
      variations.push('Apple', 'Apple Orchard', 'Apple Picking', 'Apple Orchards');
    }
    if (categoryName.includes('Pumpkin')) {
      variations.push('Pumpkin', 'Pumpkin Patch', 'Pumpkin Patches');
    }
    if (categoryName.includes('Berry')) {
      variations.push('Berry', 'Berry Farm', 'Berry Picking', 'Berry Farms');
    }

    return variations;
  };

  // For each state
  statesData.forEach((state) => {
    // For each category
    categoriesData.forEach((category) => {
      const matchingCategories = getCategoryVariations(category.name);

      // Check if state has farms in this category
      const hasFarms = state.farms.some((farm) => {
        let farmCategories = [];
        try {
          farmCategories = JSON.parse(farm.categories || '[]');
          if (typeof farmCategories === 'string') {
            farmCategories = [farmCategories];
          }
        } catch (error) {
          farmCategories = farm.categories ? [farm.categories] : [];
        }

        return matchingCategories.some((catName) =>
          farmCategories.some((farmCat) => farmCat.toLowerCase().includes(catName.toLowerCase()))
        );
      });

      if (hasFarms) {
        // High priority for money pages
        xml += generateUrlEntry(
          `${baseUrl}/${state.state_slug}/${category.slug}/`,
          currentDate,
          'weekly',
          '0.9'
        );
      }
    });
  });

  xml += generateXmlFooter();
  return xml;
}

// Generate varieties sitemap
function generateVarietiesSitemap(varieties) {
  let xml = generateXmlHeader();

  if (varieties && varieties.length > 0) {
    varieties.forEach((variety) => {
      xml += generateUrlEntry(
        `${baseUrl}/varieties/${variety.slug}/`,
        currentDate,
        'monthly',
        '0.7'
      );
    });
  }

  xml += generateXmlFooter();
  return xml;
}

// Generate blog sitemap (placeholder - add your blog posts logic)
function generateBlogSitemap() {
  let xml = generateXmlHeader();

  // Add blog post URLs here if you have them
  // For now, just the blog index
  xml += generateUrlEntry(`${baseUrl}/blog/`, currentDate, 'weekly', '0.8');

  xml += generateXmlFooter();
  return xml;
}

// Generate robots.txt
function generateRobotsTxt() {
  return `User-agent: *
Allow: /

# Important farm content
Allow: /farms/
Allow: /christmas-tree-farms/
Allow: /pumpkin-patches/
Allow: /maple-syrup-farms/
Allow: /berry-farms/
Allow: /farms-near/

# Static assets
Allow: *.js
Allow: *.css
Allow: *.jpg
Allow: *.jpeg
Allow: *.png
Allow: *.gif
Allow: *.svg
Allow: *.webp
Allow: *.avif

# Disallow admin and private pages
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /saved-farms/
Disallow: /claim/

# Block search pages (these should have noindex anyway)
Disallow: /search
Disallow: /search/
Disallow: /search?

# Block WordPress/CMS artifacts (if any leaked from old site)
Disallow: /wp-
Disallow: *.php
Disallow: /wp-admin/
Disallow: /wp-login.php
Disallow: /wp-content/

# Block development/test pages
Disallow: /test/
Disallow: /dev/
Disallow: /_next/
Disallow: /node_modules/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay (be nice to Google)
Crawl-delay: 1`;
}

// Main execution
async function generateAllSitemaps() {
  const publicDir = path.join(__dirname, '../public');

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('🗺️  Generating sitemaps...');

  // Fetch varieties from WordPress
  console.log('📡 Fetching varieties from WordPress...');
  const varieties = await fetchVarietiesFromWordPress();
  console.log(`✅ Fetched ${varieties.length} varieties`);

  // Generate sitemap index
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), generateSitemapIndex());
  console.log('✅ Generated sitemap.xml (index)');

  // Generate individual sitemaps
  fs.writeFileSync(path.join(publicDir, 'sitemap-main.xml'), generateMainSitemap());
  console.log('✅ Generated sitemap-main.xml');

  fs.writeFileSync(path.join(publicDir, 'sitemap-farms.xml'), generateFarmsSitemap());
  console.log('✅ Generated sitemap-farms.xml');

  fs.writeFileSync(path.join(publicDir, 'sitemap-locations.xml'), generateLocationsSitemap());
  console.log('✅ Generated sitemap-locations.xml');

  fs.writeFileSync(path.join(publicDir, 'sitemap-states.xml'), generateStatesSitemap());
  console.log('✅ Generated sitemap-states.xml');

  fs.writeFileSync(
    path.join(publicDir, 'sitemap-state-categories.xml'),
    generateStateCategoriesSitemap()
  );
  console.log('✅ Generated sitemap-state-categories.xml');

  fs.writeFileSync(
    path.join(publicDir, 'sitemap-christmas-tree-farms.xml'),
    generateChristmasTreeFarmsSitemap()
  );
  console.log('✅ Generated sitemap-christmas-tree-farms.xml');

  fs.writeFileSync(
    path.join(publicDir, 'sitemap-varieties.xml'),
    generateVarietiesSitemap(varieties)
  );
  console.log('✅ Generated sitemap-varieties.xml');

  fs.writeFileSync(path.join(publicDir, 'sitemap-blog.xml'), generateBlogSitemap());
  console.log('✅ Generated sitemap-blog.xml');

  // Generate robots.txt
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), generateRobotsTxt());
  console.log('✅ Generated robots.txt');

  console.log('✨ All sitemaps generated successfully!');
}

// Run the generator
(async () => {
  try {
    await generateAllSitemaps();
  } catch (error) {
    console.error('❌ Error generating sitemaps:', error);
    process.exit(1);
  }
})();
