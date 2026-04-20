import { Platform } from 'react-native';

// Register the Android home-screen widget task handler at JS boot so the OS
// can render the widget even when the main app is not in the foreground.
// On iOS this is a no-op (the Swift widget runs in its own extension).
if (Platform.OS === 'android') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { registerWidgetTaskHandler } = require('react-native-android-widget');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { widgetTaskHandler } = require('./widgets/widget-task-handler');
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch {
    // Module not linked yet (Expo Go / web) — skip.
  }
}

import 'expo-router/entry';
