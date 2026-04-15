import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Euricio',
  slug: 'euricio',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'euricio',
  userInterfaceStyle: 'light',
  newArchEnabled: true,

  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#1E3A5F',
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.euricio.crm',
    infoPlist: {
      NSMicrophoneUsageDescription:
        'Euricio benötigt Zugriff auf das Mikrofon für Telefonate.',
      UIBackgroundModes: ['voip', 'audio', 'fetch', 'remote-notification'],
    },
  },

  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1E3A5F',
    },
    package: 'com.euricio.crm',
    permissions: [
      'RECORD_AUDIO',
      'INTERNET',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
    ],
  },

  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },

  plugins: ['expo-router', 'expo-secure-store'],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    eas: {
      projectId: '',
    },
  },
});
