/**
 * App-Konfiguration
 */
export const Config = {
  // API
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://crm.euricio.es',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',

  // Feature Flags
  features: {
    voipEnabled: true,
    pushNotificationsEnabled: true,
    offlineModeEnabled: true,
    whatsappEnabled: true,
    telegramEnabled: false,
  },

  // Twilio
  twilio: {
    tokenEndpoint: '/api/voice/token',
    identityPrefix: 'euricio_agent_',
  },

  // Timeouts (ms)
  timeouts: {
    apiRequest: 15_000,
    callRinging: 30_000,
    tokenRefresh: 3_500_000, // ~58 min (Token gilt 1h)
  },

  // Pagination
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
} as const;
