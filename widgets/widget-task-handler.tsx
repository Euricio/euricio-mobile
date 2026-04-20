import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { EuricioNextCallWidget } from './EuricioNextCallWidget';
import {
  WIDGET_STORAGE_KEY,
  type WidgetSnapshot,
} from '../lib/widgets/snapshot';

/**
 * Android widget task handler. Invoked by the OS on WIDGET_ADDED,
 * WIDGET_UPDATE, WIDGET_RESIZED and WIDGET_CLICK events.
 *
 * Reads the last snapshot written by the app (AsyncStorage) and renders the
 * widget JSX. The app is responsible for keeping the snapshot fresh via
 * `refreshWidgetSnapshot()` on foreground / busy toggle / interaction.
 */

async function readCachedSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const { default: AsyncStorage } = await import(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — optional dependency
      '@react-native-async-storage/async-storage'
    );
    const raw = await AsyncStorage?.getItem?.(WIDGET_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WidgetSnapshot;
  } catch {
    return null;
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const name = widgetInfo.widgetName;

  if (name !== 'EuricioNextCall') return;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const snapshot = await readCachedSnapshot();
      props.renderWidget(
        <EuricioNextCallWidget snapshot={snapshot} locale="de" />,
      );
      break;
    }
    case 'WIDGET_DELETED':
    default:
      break;
  }
}
