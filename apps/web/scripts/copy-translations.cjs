#!/usr/bin/env node
/**
 * Copy Lingo translation files from .next to public/translations
 * This ensures translations are accessible via /translations/*.json in production
 */

const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', '.next');
const publicTranslationsDir = path.join(__dirname, '..', 'public', 'translations');

// Language codes to copy
const languages = [
  'ar', 'de', 'es', 'fr', 'he', 'hi', 'id', 'it', 'ja', 'ko',
  'nl', 'pl', 'pt', 'ru', 'sv', 'th', 'tr', 'uk', 'vi', 'zh'
];

try {
  // Check if .next directory exists
  if (!fs.existsSync(nextDir)) {
    console.error('❌ Error: .next directory not found. Run build first.');
    process.exit(1);
  }

  // Create public/translations directory if it doesn't exist
  if (!fs.existsSync(publicTranslationsDir)) {
    fs.mkdirSync(publicTranslationsDir, { recursive: true });
    console.log('✓ Created public/translations directory');
  }

  // Copy each translation file
  let copiedCount = 0;
  languages.forEach(lang => {
    const sourceFile = path.join(nextDir, `${lang}.json`);
    const destFile = path.join(publicTranslationsDir, `${lang}.json`);
    
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, destFile);
      copiedCount++;
    } else {
      console.warn(`⚠ Warning: ${lang}.json not found in .next/`);
    }
  });

  if (copiedCount === 0) {
    console.error('❌ Error: No translation files found in .next/');
    process.exit(1);
  }

  console.log(`✓ Copied ${copiedCount}/${languages.length} translation files to public/translations/`);
  process.exit(0);
} catch (error) {
  console.error('❌ Error copying translations:', error.message);
  process.exit(1);
}
