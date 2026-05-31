# 🍏 Mac Developer Hygiene: Zero Waste Protocol

## Core Philosophy

Maintain a lean, fast machine by regularly purging ephemeral developer artifacts.

## 🧹 Automated Cleanup Commands

### 1. Xcode (The Biggest Offender)

**Frequency:** Weekly
**Savings:** 10GB - 50GB

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf ~/Library/Developer/Xcode/Archives
rm -rf ~/Library/Developer/Xcode/iOS\ DeviceSupport
```

### 2. Package Managers (Global Stores)

**Frequency:** Monthly
**Savings:** 5GB - 20GB

```bash
# NPM
npm cache clean --force

# Yarn
yarn cache clean

# PNPM (The Good Citizen)
pnpm store prune
```

### 3. Docker (Hidden Bloat)

**Frequency:** Bi-Weekly
**Savings:** 10GB+

```bash
# WARNING: Removes all stopped containers, unused networks, and dangling images
docker system prune -a --volumes
```

### 4. Android Studio

**Frequency:** Monthly

```bash
rm -rf ~/.android/avd/*.avd/*.lock
```

### 5. Browser Caches (Dev Testing)

**Frequency:** Weekly

```bash
# Chrome
rm -rf ~/Library/Caches/Google/Chrome/Default/Cache

# Safari
rm -rf ~/Library/Caches/com.apple.Safari
```

## 🛡️ Prevention Strategy

1. **Use PNPM:** Reduces disk usage by ~50x for React projects.
2. **Git LFS:** Never commit binaries to git history.
3. **Docker Multi-Stage Builds:** Keep images small.
