#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeBlogImages() {
  console.log('🖼️  Optimizing blog images...');

  try {
    // Fetch latest posts
    const response = await fetch(
      'https://admin.pickafarm.com/wp-json/wp/v2/posts?_embed&per_page=10'
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
    }

    const posts = await response.json();
    console.log(`📚 Fetched ${posts.length} blog posts`);

    const imageDir = path.join(__dirname, '..', 'public', 'blog-images');
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
      console.log(`📁 Created directory: ${imageDir}`);
    }

    const manifest = {};
    let successCount = 0;
    let skipCount = 0;

    for (const post of posts) {
      const featuredImage = post._embedded?.['wp:featuredmedia']?.[0];

      if (!featuredImage) {
        console.log(`⚠️  No image for post: ${post.slug}`);
        skipCount++;
        continue;
      }

      try {
        // Download image
        console.log(`⬇️  Downloading image for: ${post.slug}`);
        const imageResponse = await fetch(featuredImage.source_url);

        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`);
        }

        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const filename = post.slug;

        // Generate multiple formats and sizes
        console.log(`🔄 Processing: ${post.slug}`);
        await Promise.all([
          // AVIF (best compression, modern browsers)
          sharp(imageBuffer)
            .resize(800, 450, { fit: 'cover', position: 'center' })
            .avif({ quality: 60, effort: 4 })
            .toFile(path.join(imageDir, `${filename}-800.avif`)),

          sharp(imageBuffer)
            .resize(400, 225, { fit: 'cover', position: 'center' })
            .avif({ quality: 60, effort: 4 })
            .toFile(path.join(imageDir, `${filename}-400.avif`)),

          // WebP (fallback for Safari <16)
          sharp(imageBuffer)
            .resize(800, 450, { fit: 'cover', position: 'center' })
            .webp({ quality: 75 })
            .toFile(path.join(imageDir, `${filename}-800.webp`)),

          sharp(imageBuffer)
            .resize(400, 225, { fit: 'cover', position: 'center' })
            .webp({ quality: 75 })
            .toFile(path.join(imageDir, `${filename}-400.webp`)),
        ]);

        manifest[post.id] = {
          slug: post.slug,
          avif: {
            800: `/blog-images/${filename}-800.avif`,
            400: `/blog-images/${filename}-400.avif`,
          },
          webp: {
            800: `/blog-images/${filename}-800.webp`,
            400: `/blog-images/${filename}-400.webp`,
          },
          alt: featuredImage.alt_text || post.title.rendered,
          width: 800,
          height: 450,
        };

        successCount++;
        console.log(`✅ Optimized: ${post.slug}`);
      } catch (error) {
        console.error(`❌ Failed to optimize ${post.slug}:`, error.message);
        skipCount++;
      }
    }

    // Write manifest
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(path.join(dataDir, 'blog-images.json'), JSON.stringify(manifest, null, 2));

    console.log(`\n🎉 Blog image optimization complete!`);
    console.log(`   ✅ Optimized: ${successCount}`);
    console.log(`   ⚠️  Skipped: ${skipCount}`);
    console.log(`   📄 Manifest: data/blog-images.json`);
  } catch (error) {
    console.error('❌ Error optimizing blog images:', error.message);

    // Create empty manifest so build doesn't fail
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(path.join(dataDir, 'blog-images.json'), JSON.stringify({}, null, 2));

    console.log('🔄 Created empty manifest to prevent build failure');
    process.exit(0); // Don't fail the build
  }
}

optimizeBlogImages().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(0); // Don't fail the build
});
