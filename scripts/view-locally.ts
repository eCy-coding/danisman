import { execSync } from 'child_process';

// Helper script to build and preview the production bundle locally
console.warn('🚀 Starting Ultimate Local View...');
try {
    console.warn('📦 Building production bundle...');
    console.warn('   (This ensures we test the exact code that goes to production)');
    execSync('npm run build', { stdio: 'inherit' });
    
    console.warn('\n✨ Build complete!');
    console.warn('🌍 Starting Preview Server on port 4173...');
    console.warn('👉 Access at: http://localhost:4173');
    console.warn('👉 Press Ctrl+C to stop.');
    
    // Using vite preview
    execSync('npm run preview', { stdio: 'inherit' });
} catch (error) {
    console.error('\n❌ Error during local view execution:', error);
    process.exit(1);
}
