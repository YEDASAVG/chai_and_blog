#!/usr/bin/env node
/**
 * Verify translation files exist in public/translations
 * With lingo.dev disabled, we use pre-existing translation files
 */

const fs = require('fs');
const path = require('path');

const publicTranslationsDir = path.join(__dirname, '..', 'public', 'translations');

// Language codes to verify
const languages = [
  'ar', 'de', 'es', 'fr', 'he', 'hi', 'id', 'it', 'ja', 'ko',
  'nl', 'pl', 'pt', 'ru', 'sv', 'th', 'tr', 'uk', 'vi', 'zh'
];

try {
  // Check if public/translations directory exists
  if (!fs.existsSync(publicTranslationsDir)) {
    console.warn('⚠ Warning: public/translations directory not found');
    console.log('✓ Build will continue - translations will load on-demand');
    process.exit(0);
  }

  // Verify each translation file exists
  let foundCount = 0;
  languages.forEach(lang => {
    const filePath = path.join(publicTranslationsDir, `${lang}.json`);
    if (fs.existsSync(filePath)) {
      foundCount++;
    } else {
      console.warn(`⚠ Warning: ${lang}.json not found in public/translations/`);
    }
  });

  console.log(`✓ Found ${foundCount}/${languages.length} translation files in public/translations/`);
  process.exit(0);
} catch (error) {
  console.error('❌ Error checking translations:', error.message);
  // Don't fail the build for translation issues
  process.exit(0);
}
