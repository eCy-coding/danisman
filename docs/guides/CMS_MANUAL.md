# 🧠 EcyPro CMS Manual (Autonomous Intelligence)

**System:** Keystatic (Git-based, Local-First)
**URL:** `/keystatic`

## 🚀 How to Manage Content

1.  **Access the Admin UI:**
    - Navigate to `http://localhost:3000/keystatic` (Local)
    - Or `/keystatic` on your deployed site.
2.  **Collections:**
    - **Blog Posts:** Write articles in Markdown with a rich editor.
    - **Case Studies:** Manage client success stories.
3.  **Saving Changes:**
    - **Local Mode:** Content is saved directly to `src/content/`. Git tracks these changes. You simply commit them.
    - **Production:** If configured with GitHub, clicking "Save" creates a Pull Request automatically.

## ⚡ Zero Waste Architecture

- **No Database:** All data is in your repo.
- **No API Costs:** 100% free and open source.
- **Performance:** Static JSON is generated at build time. Zero client-side fetching overhead.

## 🛠️ Developer Notes

- **Config:** `keystatic.config.ts` in root.
- **Adapter:** Use `import { createReader } from '@keystatic/core/reader'` to fetch data in your app.
