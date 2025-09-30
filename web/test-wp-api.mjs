import { getAllVarieties } from './src/lib/wordpress.js';

async function testGetAllVarieties() {
  console.log('Fetching varieties from WordPress API...');
  try {
    const varieties = await getAllVarieties();
    console.log('Successfully fetched varieties:');
    console.log(JSON.stringify(varieties, null, 2));
    console.log(`Total varieties fetched: ${varieties.length}`);

    const varietyNames = varieties.map(v => v.title.rendered);
    console.log('Variety names:', varietyNames);

  } catch (error) {
    console.error('Error fetching varieties:', error);
  }
}

testGetAllVarieties();
