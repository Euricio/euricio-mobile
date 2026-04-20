/**
 * Euricio Next Call Widget (iOS)
 *
 * Reads `euricio_widget_snapshot` JSON from App Group
 * `group.com.euricio.crm.widget` (written by the main app via
 * @bacons/apple-targets ExtensionStorage) and renders a SwiftUI
 * widget with: next call, open tasks count, and busy/focus status.
 *
 * Docs: https://github.com/EvanBacon/expo-apple-targets
 */

/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  name: 'EuricioNextCall',
  icon: '../../assets/icon.png',
  colors: {
    // Waldgrün Brand (locked)
    $widgetBackground: '#1B5E3F',
    $accent: '#2A8F5F',
  },
  entitlements: {
    'com.apple.security.application-groups': [
      'group.com.euricio.crm.widget',
    ],
  },
  deploymentTarget: '17.0',
};
