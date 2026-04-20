/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  name: 'Euricio',
  slug: 'euricio',
  platforms: ['ios', 'android'],
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'euricio',
  userInterfaceStyle: 'light',
  newArchEnabled: true,

  runtimeVersion: {
    policy: 'appVersion',
  },

  updates: {
    url: 'https://u.expo.dev/4ba0629a-d808-4d1d-a26f-5ffe8909c66e',
  },

  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#1B5E3F',
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.euricio.crm',
    // appleTeamId muss vor dem ersten prebuild/eas build gesetzt werden,
    // damit @bacons/apple-targets das Widget-Target signieren kann.
    // Setze entweder hier oder via EAS credentials in der Build-Profile.
    // appleTeamId: 'XXXXXXXXXX',
    entitlements: {
      'com.apple.security.application-groups': [
        'group.com.euricio.crm.widget',
      ],
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSMicrophoneUsageDescription:
        'Euricio benötigt Zugriff auf das Mikrofon für Telefonate.',
      UIBackgroundModes: ['voip', 'audio', 'fetch', 'remote-notification'],
    },
    // Note: aps-environment entitlement temporarily removed so EAS can reuse
    // the existing Distribution Certificate in non-interactive CI builds.
    // Outbound calls work without it. Add back + run `eas credentials -p ios`
    // interactively when enabling incoming-call push notifications.
  },

  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#1B5E3F',
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

  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-updates',
    // iOS Widget Target (WidgetKit / SwiftUI) via @bacons/apple-targets.
    // Expects targets/widget/expo-target.config.js + Swift sources.
    '@bacons/apple-targets',
    // Android Widget (Glance-like, JSX-based) via react-native-android-widget.
    [
      'react-native-android-widget',
      {
        widgets: [
          {
            name: 'EuricioNextCall',
            label: 'Euricio · Next Call',
            minWidth: '180dp',
            minHeight: '110dp',
            targetCellWidth: 3,
            targetCellHeight: 2,
            description:
              'Nächster Call, offene Aufgaben, Fokus-Status auf einen Blick.',
            previewImage: './assets/adaptive-icon.png',
            updatePeriodMillis: 1800000, // 30 min (OS clamps to ≥ 30 min)
          },
        ],
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    eas: {
      projectId: '4ba0629a-d808-4d1d-a26f-5ffe8909c66e',
    },
  },
});
