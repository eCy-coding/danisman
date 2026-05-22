# EcyPro Dashboard - Troubleshooting Guide

## 🐛 Common Issues & Solutions

### 1. Build Failures

#### Issue: `npm install` fails with peer dependency warnings

**Symptom:** Installation aborts or warns about React version mismatch

**Solution:**

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Root Cause:** React 19 compatibility. Ensure all dependencies support React 19.

---

#### Issue: TypeScript compilation errors

**Symptom:** `tsc --noEmit` fails

**Solution:**

```bash
# Check TypeScript version
npx tsc --version

# Ensure it's ~5.8.2
npm install -D typescript@~5.8.2
```

---

### 2. Runtime Errors

#### Issue: "Cannot find module '@/...'"

**Symptom:** Import paths not resolving

**Solution:**
Check `tsconfig.json` and `vite.config.ts`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

#### Issue: Blank screen on production build

**Symptom:** App works in dev but not after `npm run build`

**Debugging Steps:**

1. Check browser console for errors
2. Verify assets loaded: Open DevTools → Network
3. Check base URL in `vite.config.ts`:

```ts
export default defineConfig({
  base: '/', // Ensure this matches your deployment path
});
```

---

### 3. E2E Test Failures

#### Issue: Playwright tests timeout

**Symptom:** `Error: page.goto: Timeout exceeded`

**Solution:**

```bash
# Ensure preview server is running
npm run build
npm run preview

# In another terminal
npx playwright test
```

---

#### Issue: Authentication errors in E2E

**Symptom:** Tests can't access `/app/*` routes

**Root Cause:** `localStorage` not persisted between page navigations

**Solution:** Already implemented in current tests:

```ts
await page.addInitScript(() => {
  window.localStorage.setItem('ecypro-app-storage', JSON.stringify({...}));
});
```

---

### 4. Docker Issues

#### Issue: OOM (Out of Memory) during build

**Symptom:** `FATAL ERROR: JavaScript heap out of memory`

**Solution:**

```dockerfile
# Already implemented in Dockerfile
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

**Note:** Static analysis (ESLint, TSC) is intentionally removed from Docker build due to memory constraints. Validation happens in CI/CD.

---

#### Issue: Container starts but app not accessible

**Symptom:** `curl http://localhost` fails

**Debugging:**

```bash
# Check if container is running
docker ps

# Check logs
docker logs ecypro-dashboard

# Verify port mapping
docker port ecypro-dashboard

# Should show: 80/tcp -> 0.0.0.0:80
```

---

### 5. Performance Issues

#### Issue: Slow initial page load

**Symptom:** LCP > 2.5s

**Solutions:**

1. **Enable compression** (nginx config):

```nginx
gzip on;
gzip_types text/css application/javascript;
```

2. **Lazy load routes:**

```tsx
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
```

3. **Image optimization:**
   Already implemented via `vite-plugin-image-optimizer`

---

#### Issue: Large bundle size

**Check bundle:**

```bash
npm run build

# Analyze
npx vite-bundle-visualizer
```

**Optimize:**

- Check for duplicate dependencies
- Use dynamic imports for heavy libraries (e.g., `recharts`)

---

### 6. UI/UX Issues

#### Issue: Dark mode not working

**Symptom:** Theme doesn't change

**Check:**

1. `ThemeProvider` is wrapping the app
2. `localStorage` key `vite-ui-theme` exists
3. CSS variables defined in `index.css`

---

#### Issue: Animations janky

**Symptom:** Framer Motion animations stutter

**Solution:**

```tsx
// Reduce motion for performance
const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  initial={shouldReduceMotion ? false : { opacity: 0 }}
  // ...
/>;
```

---

### 7. Data Persistence Issues

#### Issue: Data lost on page refresh

**Symptom:** Consulting sessions disappear

**Root Cause:** `localStorage` quota exceeded or blocked

**Debugging:**

```ts
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
} catch (e) {
  console.error('localStorage not available:', e);
}
```

**Solution:**

- Check browser settings (incognito mode blocks localStorage)
- Clear old data
- Implement fallback to sessionStorage

---

## 🔍 Debugging Tools

### Browser DevTools

- **Console:** Check for errors
- **Network:** Verify API calls and asset loading
- **Application:** Inspect localStorage
- **Lighthouse:** Performance audit

### CLI Tools

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Test
npm test

# E2E
npx playwright test --debug
```

### Docker Debugging

```bash
# Interactive shell
docker exec -it ecypro-dashboard sh

# Check nginx config
docker exec ecypro-dashboard cat /etc/nginx/conf.d/default.conf
```

---

## 📞 Escalation Path

1. **Check Logs:** Application + Container logs
2. **Reproduce Locally:** `npm run dev`
3. **Check CI:** Review GitHub Actions workflow results
4. **Rollback:** Use previous Docker image version
5. **Contact Support:** admin@ecypro.com

---

## 📚 Additional Resources

- [Vite Troubleshooting](https://vitejs.dev/guide/troubleshooting.html)
- [React 19 Migration Guide](https://react.dev/blog/2024/12/05/react-19)
- [Playwright Debugging](https://playwright.dev/docs/debug)
- [Docker Logs](https://docs.docker.com/engine/reference/commandline/logs/)
