import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Euricio',
  slug: 'euricio-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  scheme: 'euricio',

  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#1B4D3E',
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: 'es.euricio.crm',
    infoPlist: {
      UIBackgroundModes: ['voip', 'audio', 'remote-notification', 'fetch'],
      NSMicrophoneUsageDescription: 'Euricio benötigt Zugriff auf das Mikrofon für Telefonate.',
      NSCameraUsageDescription: 'Euricio benötigt Zugriff auf die Kamera für Dokumenten-Scans.',
    },
    entitlements: {
      'aps-environment': 'production',
    },
  },

  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1B4D3E',
    },
    edgeToEdgeEnabled: true,
    package: 'es.euricio.crm',
    permissions: [
      'RECORD_AUDIO',
      'INTERNET',
      'ACCESS_NETWORK_STATE',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
      'WAKE_LOCK',
      'FOREGROUND_SERVICE',
      'CAMERA',
    ],
  },

  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },

  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#1B4D3E',
        sounds: ['./assets/sounds/ringtone.wav'],
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    eas: {
      projectId: 'your-eas-project-id',
    },
  },
});
