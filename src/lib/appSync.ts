/**
 * Mobile App Synchronization System
 * Automatic cache invalidation, deployment-aware updates, forced refresh
 * Works on Android, iOS, PWA without requiring app reinstall
 */

export interface AppVersion {
  major: number;
  minor: number;
  patch: number;
  build: number;
  timestamp: number;
  hash: string; // Unique build hash (e.g., Git commit SHA)
  environment?: 'development' | 'staging' | 'production';
}

export interface DeploymentMetadata {
  version: AppVersion;
  timestamp: number;
  files: {
    [path: string]: {
      hash: string;
      size: number;
      lastModified: number;
    }
  };
  environment?: 'development' | 'staging' | 'production';
  critical: boolean; // Whether update is critical
  migration?: string; // Migration instructions if needed
}

export interface CacheSyncState {
  currentVersion: AppVersion;
  deployedVersion: AppVersion;
  isStaleBuild: boolean;
  needsUpdate: boolean;
  criticalUpdateAvailable: boolean;
  syncProgress: number; // 0-100
  updateState: 'checking' | 'downloading' | 'staging' | 'ready' | 'critical_update' | 'failed' | 'up_to_date';
}

/**
 * Current app version (updated at build time)
 */
export const CURRENT_APP_VERSION: AppVersion = {
  major: 2,
  minor: 0,
  patch: 1,
  build: 2026052401,
  timestamp: 1716556800000,
  hash: '9JAI-PROD-20260524-STABLE',
  environment: 'production',
};

/**
 * Get deployment metadata
 */
export async function getDeploymentMetadata(): Promise<DeploymentMetadata> {
  try {
    const response = await fetch('/deployment-manifest.json', {
      cache: 'no-store',
      headers: { 'X-Check-Fresh': 'true', 'Cache-Control': 'no-cache' }
    });
    
    if (!response.ok) throw new Error('Manifest not found');
    
    return await response.json();
  } catch (err) {
    console.error('[Sync] Failed to fetch deployment metadata:', err);
    return {
      version: CURRENT_APP_VERSION,
      timestamp: Date.now(),
      files: {},
      critical: false,
      environment: CURRENT_APP_VERSION.environment,
    };
  }
}

/**
 * Check if current build is stale
 */
export function isStale(current: AppVersion, deployed: AppVersion): boolean {
  // Compare versions

  // 1. HASH CHECK (Most reliable)
  if (deployed.hash !== current.hash) return true;

  // 2. BUILD NUMBER
  if (deployed.build > current.build) return true;

  // 3. SEMANTIC VERSION
  if (deployed.major > current.major) return true;
  if (deployed.major === current.major && deployed.minor > current.minor) return true;
  if (deployed.major === current.major && deployed.minor === current.minor && deployed.patch > current.patch) return true;

  // 4. TIMESTAMP (Least reliable, but good for ensuring freshness if other identifiers are identical)
  if (deployed.timestamp > current.timestamp) return true; // Deployed is newer

  return false; // Not stale
}

/**
 * Detect stale cache
 */
export async function detectStaleBuild(): Promise<CacheSyncState> {
  const deployed = await getDeploymentMetadata();
  const current = CURRENT_APP_VERSION;
  
  const isStaleBuild = isStale(current, deployed);
  const criticalUpdateAvailable = deployed.critical && isStaleBuild;
  
  return {
    currentVersion: current,
    deployedVersion: deployed,
    isStaleBuild,
    needsUpdate: isStaleBuild,
    criticalUpdateAvailable,
    syncProgress: 0,
    updateState: isStaleBuild ? (criticalUpdateAvailable ? 'critical_update' : 'checking') : 'up_to_date',
  };
}

/**
 * Invalidate Service Worker cache
 */
export async function invalidateServiceWorkerCache(): Promise<void> {
  try {
    const cacheNames = await caches.keys();
    
    for (const name of cacheNames) {
      const shouldDelete = name.includes('app-cache') || 
                          name.includes('static-v') ||
                          name.includes('dynamic-cache');
      
      if (shouldDelete) {
        await caches.delete(name);
        console.log(`[Sync] Deleted cache: ${name}`);
      }
    }
  } catch (err) {
    console.error('[Sync] Cache invalidation error:', err);
  }
}

/**
 * Clear browser cache for specific paths
 */
export async function clearCacheForPaths(paths: string[]): Promise<void> {
  try {
    const cache = await caches.open('app-cache');
    
    for (const path of paths) {
      const request = new Request(path);
      await cache.delete(request);
      console.log(`[Sync] Cleared cache for: ${path}`);
    }
  } catch (err) {
    console.error('[Sync] Path cache clear error:', err);
  }
}

/**
 * Force update service worker
 */
export async function forceUpdateServiceWorker(): Promise<boolean> {
  try {
    if (!navigator.serviceWorker) return false;
    
    const registration = await navigator.serviceWorker.getRegistrations();
    
    for (const reg of registration) {
      // Force update check
      await reg.update();
      
      // If update available, activate it
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        console.log('[Sync] Service Worker update activated');
        return true;
      }
    }
    
    return false;
  } catch (err) {
    console.error('[Sync] Service Worker update error:', err);
    return false;
  }
}

/**
 * Centralized busy state check to prevent destructive refreshes
 */
export const isAppBusy = (): boolean => {
  return (window as any).__9JAI_BUSY__ === true;
};

/**
 * Synchronize app state after deployment
 */
export async function synchronizeAppAfterDeployment(): Promise<CacheSyncState> {
  console.log('[Sync] Starting app synchronization...');
  
  // 1. Detect stale build
  // Initial state is 'checking'
  const state = await detectStaleBuild();
  
  if (!state.needsUpdate) {
    console.log('[Sync] App is up to date');
    return state;
  }
  
  console.log('[Sync] Stale build detected, starting sync...');
  state.updateState = 'downloading';
  
  // 2. Invalidate caches
  state.syncProgress = 25;
  await invalidateServiceWorkerCache();
  state.updateState = 'staging';
  
  // 3. Force service worker update
  state.syncProgress = 50;
  const swUpdated = await forceUpdateServiceWorker();
  state.updateState = swUpdated ? 'ready' : 'failed';
  
  // 4. Clear localStorage if migration needed
  if (state.deployedVersion.migration) {
    try {
      const key = `app-migration-${state.deployedVersion.hash}`;
      if (!localStorage.getItem(key)) {
        console.log('[Sync] Running migration:', state.deployedVersion.migration);
        // Execute migration (defined in migration metadata)
        localStorage.setItem(key, 'true');
      }
    } catch (err) {
      console.error('[Sync] Migration error:', err);
    }
  }
  
  // 5. Trigger safe page refresh
  state.syncProgress = 100;
  if (state.criticalUpdateAvailable) {
    if (!isAppBusy()) {
      console.log('[Sync] Executing safe critical refresh...');
      const url = new URL(window.location.href);
      url.searchParams.set('build', state.deployedVersion.hash);
      window.location.href = url.toString();
    } else {
      console.warn('[Sync] Critical update deferred: App is busy.');
      document.dispatchEvent(new CustomEvent('app:critical-update-deferred', { detail: state }));
    }
  }
  
  return state;
}

/**
 * Automatic sync check interval
 */
export function startAutoSyncMonitor(intervalMs: number = 300000): () => void {
  // Check every 5 minutes by default
  const interval = setInterval(async () => {
    const state = await detectStaleBuild();
    
    if (state.needsUpdate) {
      console.log('[Sync] Auto-sync: Update available, preparing...');
      state.updateState = 'downloading';
      
      if (state.criticalUpdateAvailable) { // Critical update
        console.log('[Sync] Critical update available. Dispatching notification.');
        document.dispatchEvent(new CustomEvent('app:critical-update-available', { detail: state }));
      } else {
        console.log('[Sync] Non-critical update available. Staging silently.');
        // For non-critical updates, we can attempt to synchronize silently
        // and then notify the user that an update is ready to be applied.
        const newState = await synchronizeAppAfterDeployment();
        if (newState.needsUpdate && newState.updateState === 'ready') {
          document.dispatchEvent(new CustomEvent('app:non-critical-update-ready', { detail: newState }));
        }
        state.updateState = 'ready'; // Staged for non-critical
        // Non-critical - sync silently
        await synchronizeAppAfterDeployment();
      }
    }
  }, intervalMs);
  
  // Return cleanup function
  return () => clearInterval(interval);
}

/**
 * Deployment manifest generator (run during build)
 */
export function generateDeploymentManifest(files: string[], buildHash: string, isCritical: boolean = false, environment: 'development' | 'staging' | 'production' = 'production'): DeploymentMetadata {
  const version: AppVersion = {
    major: CURRENT_APP_VERSION.major,
    minor: CURRENT_APP_VERSION.minor,
    patch: CURRENT_APP_VERSION.patch,
    build: Date.now(), // Use current timestamp for build number if not provided by CI
    timestamp: Date.now(),
    hash: buildHash, // Use the provided buildHash
    environment: CURRENT_APP_VERSION.environment,
  };
  
  const fileMap: Record<string, { hash: string; size: number; lastModified: number }> = {};
  
  // In real implementation, files would be read and hashed
  // For now, we create placeholder entries
  for (const file of files) {
    fileMap[file] = {
      hash: `hash-${Math.random()}`,
      size: 0,
      lastModified: Date.now(),
    };
  }
  
  return {
    version,
    timestamp: Date.now(),
    files: fileMap,
    critical: isCritical, // Use the provided critical flag
    environment: version.environment,
  };
}

/**
 * PWA Update Handler
 */
export function setupPWAUpdateHandler(): void {
  if (!navigator.serviceWorker) return;
  
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[Sync] New service worker activated, app updated');
    
    // Show update notification
    document.dispatchEvent(new CustomEvent('app:updated', {
      detail: { message: 'App updated to latest version' }
    }));
    
    // Optional: Reload UI components
    // window.location.reload();
  });
}

/**
 * Forced Update Notification
 */
export interface UpdateNotification {
  title: string;
  message: string;
  isCritical: boolean;
  action: () => Promise<void>;
}

export function createUpdateNotification(state: CacheSyncState): UpdateNotification {
  return {
    title: state.criticalUpdateAvailable ? 'Critical Update Available' : 'Update Available',
    message: state.criticalUpdateAvailable 
      ? 'A critical update is required for security and stability.'
      : 'A new version of the app is available. Update now for the best experience.',
    isCritical: state.criticalUpdateAvailable,
    action: () => synchronizeAppAfterDeployment()
  };
}

/**
 * Safe reload with new assets
 */
export function safeReloadApp(): void {
  // Clear all service worker caches
  invalidateServiceWorkerCache().then(() => {
    // Reload with cache busting
    const params = new URLSearchParams();
    params.set('refresh', Date.now().toString());
    
    // Force hard refresh
    window.location.href = `${window.location.href.split('?')[0]}?${params.toString()}`;
  });
}

/**
 * Check for updates on app startup
 */
export async function checkUpdatesOnStartup(): Promise<void> {
  try {
    const state = await detectStaleBuild();
    
    if (state.criticalUpdateAvailable) {
      const notification = createUpdateNotification(state);
      
      // Show notification to user
      console.warn('[Sync]', notification.title);
      document.dispatchEvent(new CustomEvent('app:update-notification', {
        detail: notification
      }));
    } else if (state.needsUpdate) {
      // Silently sync non-critical updates
      await synchronizeAppAfterDeployment();
    }
  } catch (err) {
    console.error('[Sync] Startup check error:', err);
  }
}
