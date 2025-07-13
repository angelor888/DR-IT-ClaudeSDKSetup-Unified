// Compatibility wrapper for use-sync-external-store
// This ensures React 18 compatibility by always using the shim version

// Re-export everything from the shim
export * from 'use-sync-external-store/shim';
export { useSyncExternalStore as default } from 'use-sync-external-store/shim';

// Also export the with-selector functionality
export { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';