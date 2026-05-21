import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const WP_DIR = path.resolve(process.cwd(), 'dist_wp');
const THEME_NAME = 'ecypro-theme';
const ZIP_NAME = `${THEME_NAME}.zip`;

function buildTheme() {
  console.log('🚀 Starting WordPress Theme Build...');

  // 1. Clean & Prepare
  if (fs.existsSync(WP_DIR)) {
    fs.rmSync(WP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(WP_DIR);

  // 2. Build React App
  console.log('📦 Building React App...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (_e) {
    console.error('❌ Build failed');
    process.exit(1);
  }

  // 3. Copy Assets
  console.log('📂 Copying assets...');
  // Copy everything from dist to dist_wp
  execSync(`cp -R "${DIST_DIR}/"* "${WP_DIR}/"`);

  // 4. Transform index.html -> index.php
  const indexHtmlPath = path.join(WP_DIR, 'index.html');
  const indexPhpPath = path.join(WP_DIR, 'index.php');

  let htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

  // Replace asset paths to use PHP function
  // Look for src="/assets/..." and href="/assets/..."
  // Vite puts assets in /assets/ by default.
  // We need to allow it to load from theme directory

  // Regex for /assets/
  // We replace '="/' with '="<?php echo get_template_directory_uri(); ?>/'
  // But only for specific resource tags to be safe, or globally for simple paths

  // Safer approach: Replace specific known patterns
  // href="/assets -> href="<?php echo get_template_directory_uri(); ?>/assets
  // src="/assets  -> src="<?php echo get_template_directory_uri(); ?>/assets

  htmlContent = htmlContent.replace(
    /href="\//g,
    'href="<?php echo get_template_directory_uri(); ?>/',
  );
  htmlContent = htmlContent.replace(
    /src="\//g,
    'src="<?php echo get_template_directory_uri(); ?>/',
  );

  // Also handle possible favicon or manifest paths if they are absolute

  fs.writeFileSync(indexPhpPath, htmlContent);
  fs.unlinkSync(indexHtmlPath); // Remove index.html as WP uses index.php

  // 5. Create style.css (Required for WP Theme detection)
  const styleCss = `/*
Theme Name: eCyPro Premium
Theme URI: https://ecypro.com
Author: Antigravity
Author URI: https://ecypro.com
Description: High-performance React Theme for eCyPro
Version: 1.0.0
*/
/* Reset and base styles handled by React */
body { margin: 0; padding: 0; }
`;
  fs.writeFileSync(path.join(WP_DIR, 'style.css'), styleCss);

  // 6. Create functions.php (Minimal)
  const functionsPhp = `<?php
// Minimal functions.php
// We don't need to enqueue scripts the traditional way because we injected them into index.php
// But we should ensure essentials work.

add_theme_support('title-tag');
add_theme_support('post-thumbnails');
`;
  fs.writeFileSync(path.join(WP_DIR, 'functions.php'), functionsPhp);

  // 7. Create Screenshot (Optional but good) - just a placeholder if not exists
  // fs.writeFileSync(path.join(WP_DIR, 'screenshot.png'), ...);

  // 8. ZIP it
  console.log('🤐 Zipping theme...');
  const zipPath = path.resolve(process.cwd(), ZIP_NAME);
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  // We need to zip the CONTENT of dist_wp into a folder named 'ecypro-theme' inside the zip
  // or just zip the contents directly? WP themes usually expect a folder inside.
  // Let's create a temp folder structure: temp/ecypro-theme/...

  const tempDir = path.resolve(process.cwd(), 'temp_build');
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir);
  const themeDir = path.join(tempDir, THEME_NAME);
  fs.renameSync(WP_DIR, themeDir); // Move dist_wp to temp/ecypro-theme

  try {
    // Zip the folder 'ecypro-theme'
    execSync(`cd "${tempDir}" && zip -r "${zipPath}" "${THEME_NAME}"`);
    console.log(`✅ Theme created successfully: ${ZIP_NAME}`);
  } catch (_e) {
    console.error('❌ Zip failed (ensure run on Mac/Linux with zip installed)');
  }

  // Cleanup
  fs.rmSync(tempDir, { recursive: true, force: true });
}

buildTheme();
