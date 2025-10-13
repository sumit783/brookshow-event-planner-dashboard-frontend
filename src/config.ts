export const config = {
  API_BASE_URL: '/api',
  
  // Testing flags
  SIMULATE_OFFLINE: false,
  SIMULATE_FAILURE_RATE: 0, // 0-1, e.g., 0.1 = 10% failure rate
  
  // Sync settings
  SYNC_RETRY_MAX: 5,
  SYNC_RETRY_DELAY_MS: 1000,
  SYNC_RETRY_BACKOFF_FACTOR: 2,
  
  // Scanner settings
  DEFAULT_SCANNER_NAME: 'Scanner 1',
  
  // App metadata
  APP_NAME: 'BrookShow Event Planner',
  APP_VERSION: '1.0.0',
} as const;
