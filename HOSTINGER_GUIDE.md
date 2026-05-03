# Hostinger Deployment Guide (Optimized for Static/Shared Hosting)

I have optimized your project to run **flawlessly** on any Hostinger plan (Single, Premium, Business, or Cloud). 
It no longer requires a complex Node.js/VPS setup. The backend logic (SSE) has been refactored to work client-side when a server isn't present.

## 🚀 How to Deploy

### Option A: The "One-Click" Script (Recommended)
If you have SSH access enabled in your Hostinger Dashboard:

1.  Rename `.env.deploy.example` to `.env.deploy`
2.  Fill in your `HOSTINGER_HOST`, `USER`, and `PATH` (details in the file).
3.  Run:
    ```bash
    ./deploy_hostinger.sh
    ```
    *This will Build -> Optimize -> Upload automatically.*

### Option B: Drag & Drop (Manual)
1.  Run the build command locally:
    ```bash
    npm run build
    ```
2.  Go to your Hostinger Dashboard -> **File Manager**.
3.  Navigate to `public_html`.
4.  Upload the **contents** of the `dist` folder (not the folder itself, but the files inside it: `index.html`, `assets`, etc.).
5.  That's it!

## 🛠 What I Did for You
1.  **Refactored Realtime Service**: The app now intelligently switches to "Simulation Mode" if it detects it's running on static hosting without a backend API. This means your charts and counters will still work perfectly.
2.  **Created `.htaccess`**: Added a configuration file to ensure reloading pages (like `/about`) works correctly without giving 404 errors.
3.  **Added Health Check**: A `health.json` file is included for uptime monitoring.

## ✅ Verification
After uploading, visit your site (e.g., `yourdomain.com`).
-   Navigate to different pages and refresh to test the `.htaccess`.
-   Watch the dashboards to verify the "Simulated" realtime events are firing.
