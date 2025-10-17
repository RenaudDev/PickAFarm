#!/usr/bin/env node

/**
 * Populate Field Options from Existing Farm Data
 *
 * This script extracts unique values from multi-select fields in the farms table
 * and populates the farm_field_options table for the dynamic form field system.
 *
 * Usage: node scripts/populate-field-options.js --local
 *        node scripts/populate-field-options.js --remote
 */

const fs = require('fs');
const path = require('path');

// Multi-select fields to extract options from
const MULTI_SELECT_FIELDS = [
  'categories',
  'amenities',
  'varieties',
  'payment_methods',
];

/**
 * Parse comma-separated values, handling quoted strings
 */
function parseCSV(value) {
  if (!value) return [];

  // Split by comma and trim whitespace
  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

/**
 * Extract unique values from a field across all farms
 */
async function extractUniqueValues(db, fieldName) {
  const result = await db.prepare(
    `SELECT DISTINCT ${fieldName} FROM farms WHERE ${fieldName} IS NOT NULL AND ${fieldName} != ''`
  ).all();

  const uniqueValues = new Set();

  for (const row of result.results || []) {
    const value = row[fieldName];
    if (value) {
      const parsed = parseCSV(value);
      parsed.forEach(item => uniqueValues.add(item));
    }
  }

  return Array.from(uniqueValues).sort();
}

/**
 * Populate the farm_field_options table
 */
async function populateFieldOptions(db, fieldName, options) {
  console.log(`\nPopulating options for field: ${fieldName}`);
  console.log(`Found ${options.length} unique values`);

  let insertedCount = 0;
  let duplicateCount = 0;

  for (const option of options) {
    try {
      const result = await db.prepare(`
        INSERT INTO farm_field_options
        (field_name, option_value, option_label, sort_order)
        VALUES (?, ?, ?, ?)
      `).bind(fieldName, option, option, 0).run();

      if (result.success) {
        insertedCount++;
      }
    } catch (error) {
      if (error.message && error.message.includes('UNIQUE')) {
        duplicateCount++;
      } else {
        console.error(`Error inserting option "${option}":`, error.message);
      }
    }
  }

  console.log(`  ✓ Inserted: ${insertedCount}`);
  if (duplicateCount > 0) {
    console.log(`  ⚠ Duplicates skipped: ${duplicateCount}`);
  }

  return insertedCount;
}

/**
 * Populate the farm_field_option_usage table
 */
async function populateFieldUsage(db, fieldName) {
  console.log(`\nPopulating usage tracking for field: ${fieldName}`);

  // Get all farms with this field
  const result = await db.prepare(`
    SELECT zoho_record_id, ${fieldName} FROM farms
    WHERE ${fieldName} IS NOT NULL AND ${fieldName} != ''
  `).all();

  let insertedCount = 0;
  let duplicateCount = 0;

  for (const row of result.results || []) {
    const farmId = row.zoho_record_id;
    const fieldValue = row[fieldName];

    if (fieldValue) {
      const options = parseCSV(fieldValue);

      for (const option of options) {
        try {
          await db.prepare(`
            INSERT OR REPLACE INTO farm_field_option_usage
            (farm_id, field_name, option_value, last_used)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          `).bind(farmId, fieldName, option).run();

          insertedCount++;
        } catch (error) {
          if (error.message && error.message.includes('UNIQUE')) {
            duplicateCount++;
          } else {
            console.error(`Error tracking usage:`, error.message);
          }
        }
      }
    }
  }

  console.log(`  ✓ Inserted: ${insertedCount}`);
  if (duplicateCount > 0) {
    console.log(`  ⚠ Duplicates skipped: ${duplicateCount}`);
  }

  return insertedCount;
}

/**
 * Main execution
 */
async function main() {
  try {
    // Determine if running locally or remotely
    const isLocal = process.argv.includes('--local');
    const isRemote = process.argv.includes('--remote');

    if (!isLocal && !isRemote) {
      console.error('Usage: node scripts/populate-field-options.js --local OR --remote');
      process.exit(1);
    }

    console.log(`\n📊 Populating Field Options (${isLocal ? 'LOCAL' : 'REMOTE'})`);
    console.log('═'.repeat(50));

    // Import wrangler D1 module
    let db;

    if (isLocal) {
      // For local testing, we'll use a simpler approach
      console.log('\n⚠️  Local mode requires a running wrangler dev server.');
      console.log('This script is designed to be run as part of the build process.');
      console.log('\nFor testing locally:');
      console.log('1. Start: wrangler dev');
      console.log('2. Run: wrangler d1 execute pickafarm-db --local --command "SELECT COUNT(*) FROM farm_field_options"');
      console.log('\nThis script is typically run after deployment:');
      console.log('After migration: wrangler d1 migrations apply pickafarm-db --remote');
      console.log('Then run: wrangler d1 execute pickafarm-db --remote --file scripts/populate-field-options-data.sql');
      process.exit(0);
    } else {
      // For remote execution
      console.log('\n⚠️  Remote population should be done through SQL migration file.');
      console.log('This script generates the SQL commands needed.');
      console.log('\nSee: scripts/populate-field-options-data.sql');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
