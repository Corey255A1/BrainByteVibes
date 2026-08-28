/**
 * Unregisters all active service workers and clears Workbox static file caches,
 * then reloads the client page from the server without deleting IndexedDB or user profile data.
 */
export async function forceAppRefresh(): Promise<void> {
  try {
    // 1. Unregister Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }

    // 2. Clear static file cache storage (leaves IndexedDB and localStorage safe!)
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
      }
    }
  } catch (e) {
    console.warn('Error clearing service worker cache:', e);
  } finally {
    // 3. Force reload page from server
    window.location.reload();
  }
}

/**
 * Manually prompts the service worker to check for new builds on the server.
 */
export async function checkForPwaUpdate(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    let hasUpdated = false;
    for (const reg of registrations) {
      try {
        await reg.update();
        if (reg.waiting || reg.installing) {
          hasUpdated = true;
        }
      } catch (e) {
        console.warn('SW update check failed:', e);
      }
    }
    return hasUpdated;
  }
  return false;
}
