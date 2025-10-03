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
    const response = await fetch('https://admin.pickafarm.com/wp-json/wp/v2/varieties?per_page=100');
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
    'sitemap-christmas-tree-farms.xml',
    'sitemap-varieties.xml',
    'sitemap-blog.xml'
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  sitemaps.forEach(sitemap => {
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
    { url: '', priority: '1.0', changefreq: 'daily' },
    { url: 'about/', priority: '0.7', changefreq: 'monthly' },
    { url: 'blog/', priority: '0.8', changefreq: 'weekly' },
  ];
  
  mainPages.forEach(page => {
    xml += generateUrlEntry(`${baseUrl}/${page.url}`, currentDate, page.changefreq, page.priority);
  });
  
  xml += generateXmlFooter();
  return xml;
}

// Generate farms sitemap
function generateFarmsSitemap() {
  let xml = generateXmlHeader();
  
  const activeFarms = farmsData.filter(farm => farm.active === 1);
  
  activeFarms.forEach(farm => {
    const priority = farm.featured === 1 ? '0.8' : (farm.verified === 1 ? '0.7' : '0.6');
    const changefreq = farm.featured === 1 ? 'weekly' : 'monthly';
    const lastmod = farm.updated_at || currentDate;
    
    xml += generateUrlEntry(`${baseUrl}/farms/${farm.slug}/`, lastmod, changefreq, priority);
  });
  
  xml += generateXmlFooter();
  return xml;
}

// Generate locations sitemap
function generateLocationsSitemap() {
  let xml = generateXmlHeader();
  
  const locations = locationsData.filter(location => location.farms && location.farms.length > 0);
  
  locations.forEach(location => {
    xml += generateUrlEntry(`${baseUrl}/farms-near/${location.location_slug}/`, currentDate, 'weekly', '0.8');
  });
  
  xml += generateXmlFooter();
  return xml;
}

// Generate christmas tree farms sitemap
function generateChristmasTreeFarmsSitemap() {
  let xml = generateXmlHeader();
  
  const category = 'christmas-tree-farms';
  const locations = locationsData.filter(location => location.farms && location.farms.length > 0);
  
  // Category landing page
  xml += generateUrlEntry(`${baseUrl}/${category}/`, currentDate, 'weekly', '0.9');
  
  // Category + location pages
  locations.forEach(location => {
    xml += generateUrlEntry(`${baseUrl}/${category}/near/${location.location_slug}/`, currentDate, 'weekly', '0.8');
  });
  
  xml += generateXmlFooter();
  return xml;
}

// Generate states sitemap
function generateStatesSitemap() {
  let xml = generateXmlHeader();
  
  statesData.forEach(state => {
    const priority = state.total_farms >= 20 ? '0.9' : '0.8';
    xml += generateUrlEntry(`${baseUrl}/${state.state_slug}/`, currentDate, 'weekly', priority);
  });
  
  xml += generateXmlFooter();
  return xml;
}

// Generate varieties sitemap
function generateVarietiesSitemap(varieties) {
  let xml = generateXmlHeader();
  
  if (varieties && varieties.length > 0) {
    varieties.forEach(variety => {
      xml += generateUrlEntry(`${baseUrl}/varieties/${variety.slug}/`, currentDate, 'monthly', '0.7');
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

# Disallow admin and private pages
Disallow: /admin/
Disallow: /api/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay
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
  
  fs.writeFileSync(path.join(publicDir, 'sitemap-christmas-tree-farms.xml'), generateChristmasTreeFarmsSitemap());
  console.log('✅ Generated sitemap-christmas-tree-farms.xml');
  
  fs.writeFileSync(path.join(publicDir, 'sitemap-varieties.xml'), generateVarietiesSitemap(varieties));
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
