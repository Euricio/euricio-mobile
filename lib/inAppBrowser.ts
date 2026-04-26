import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform } from 'react-native';
import { colors } from '../constants/theme';

const APP_HOST = 'crm.euricio.es';
const IN_APP_PATH_PREFIXES = ['/sign/', '/portal/'];

export function isInAppBrowserUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.hostname !== APP_HOST) return false;
    return IN_APP_PATH_PREFIXES.some((p) => u.pathname.startsWith(p));
  } catch {
    return false;
  }
}

// On iOS this presents an SFSafariViewController — same Safari engine + cookies
// as Universal Links resolution, no visible URL bar / chrome toolbar by default.
// On Android it opens a Custom Tab (toolbar with title only). For URLs the app
// can't render natively (signing flow + customer portal live on the web today)
// this is the closest we get to "inside the app".
export async function openInAppBrowser(url: string): Promise<void> {
  if (Platform.OS === 'web') {
    await Linking.openURL(url);
    return;
  }
  try {
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: colors.primary,
      controlsColor: '#ffffff',
      dismissButtonStyle: 'close',
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      enableBarCollapsing: true,
      showTitle: false,
    });
  } catch {
    await Linking.openURL(url);
  }
}

// Convenience: route Universal-Link-eligible URLs (sign/portal on crm.euricio.es)
// through the in-app browser, fall back to system handler otherwise.
export async function openSmartUrl(url: string): Promise<void> {
  if (isInAppBrowserUrl(url)) {
    await openInAppBrowser(url);
    return;
  }
  await Linking.openURL(url);
}
