# Euricio Home-Screen Widgets

Phase 3 liefert ein natives Home-Screen-Widget für iOS (WidgetKit / SwiftUI)
und Android (Glance-artig via `react-native-android-widget`). Das Widget
zeigt auf einen Blick:

- **Nächster Call** (aus `appointments`, bevorzugt `type='call'`, nächste 24 h)
- **Fokus/Busy-Status** (aus `voice_user_permissions.is_busy`)
- **Offene Aufgaben-Anzahl** (manager-scoped)
- **Offene Rückrufe-Anzahl**

Tap auf das Widget öffnet:

- bei aktiver Karte → `euricio://call/<entity_id>` (Call-Workspace)
- sonst → `euricio://tasks`

---

## Architektur

```
┌────────────────────┐      fetch      ┌─────────────────────────┐
│  Euricio Mobile    │ ──────────────► │  /api/widget/snapshot    │
│  (React Native)    │                 │  (Next.js / crm.euricio) │
└─────────┬──────────┘                 └─────────────────────────┘
          │ writeSnapshotToNativeStorage()
          ▼
┌──────────────────────────┐
│ iOS   App Group          │ ── UserDefaults suite
│   group.com.euricio.crm.widget/euricio_widget_snapshot
│                          │
│ Android AsyncStorage     │ ── key euricio_widget_snapshot
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ iOS  Swift Widget        │  TimelineProvider liest suite
│ Android JSX Widget       │  task-handler rendert RemoteViews
└──────────────────────────┘
```

### Trigger für Widget-Refresh

`components/WidgetBootstrap.tsx` subscribe’d auf den TanStack Query Cache
und ruft `refreshWidgetSnapshot()` (fetch + write + reload) auf, wenn:

1. App startet (mount)
2. App in den Vordergrund kommt (`AppState` → `active`)
3. Eine dieser Queries neu befüllt wird:
   `busy-status`, `tasks`, `appointments`, `calendar`, `calendar-events`,
   `call-workspace`
4. Throttle: max. 1 Refresh pro 10 s

→ Damit greifen automatisch alle `useSetBusy` / `useRecordInteraction` /
Calendar-Mutations als Trigger, ohne dass diese Hooks selbst geändert
werden müssen.

---

## Build-Anleitung (User führt aus)

**Wichtig:** Der Agent triggert **nie** einen EAS Build. Alle
Kommandos unten musst du lokal ausführen, nachdem der PR gemerged ist.

### 1. Apple Team ID setzen

In `app.config.js` die Zeile

```js
// appleTeamId: 'XXXXXXXXXX',
```

entkommentieren und deine Apple Developer Team ID eintragen. Ohne Team-ID
kann `@bacons/apple-targets` das Widget-Target nicht signieren.

### 2. Prebuild

```bash
cd euricio-mobile
npm install           # sicherstellen dass alle deps da sind
npx expo prebuild --clean
```

Das legt die `ios/` und `android/` Native-Projekte mit dem Widget-Target an.

### 3. EAS Build

```bash
eas build -p ios --profile preview
eas build -p android --profile preview
```

Nach dem Install auf dem Gerät:

- **iOS**: Home-Screen lang drücken → „+“ → „Euricio“ → „Euricio · Next Call“
  auf den Home-Screen ziehen.
- **Android**: App-Drawer öffnen → Widgets → „Euricio · Next Call“ auf den
  Home-Screen ziehen.

### 4. Validierung

1. App öffnen, einloggen — innerhalb von ~5 s muss das Widget den nächsten
   Call anzeigen.
2. Busy-Toggle in der App umschalten — Widget zeigt innerhalb weniger
   Sekunden „Fokus aktiv“.
3. App in den Hintergrund schicken, einen Call abschließen (Interaktion
   speichern) — beim nächsten Foreground wird der Zähler aktualisiert.

---

## Dateien

| Pfad | Zweck |
|------|-------|
| `app.config.js` | App Group entitlement + `@bacons/apple-targets` plugin + `react-native-android-widget` plugin config |
| `targets/widget/expo-target.config.js` | iOS Widget Target Config (Waldgrün-Farben, App Group, iOS 17+) |
| `targets/widget/index.swift` | Swift Widget: `TimelineProvider`, SwiftUI View, `WidgetConfiguration` |
| `widgets/EuricioNextCallWidget.tsx` | Android Widget JSX (via `react-native-android-widget`) |
| `widgets/widget-task-handler.tsx` | Android `WIDGET_ADDED / UPDATE / RESIZED` task handler |
| `lib/widgets/snapshot.ts` | `fetchWidgetSnapshot()` + `writeSnapshotToNativeStorage()` + `refreshWidgetSnapshot()` |
| `components/WidgetBootstrap.tsx` | Mount in `app/(app)/_layout.tsx`, abonniert Cache + AppState |
| `index.ts` | Registriert den Android widget task handler am JS-Boot |
| `lib/i18n/locales/{de,en,es}.ts` | `widget_*` Keys |

## API

**Endpoint**: `GET /api/widget/snapshot`
**Auth**: `Authorization: Bearer <supabase_access_token>`
**Cache-Control**: `private, no-store`

**Response-Schema** (`WidgetSnapshot`):

```ts
{
  is_busy: boolean;
  busy_until: string | null;            // ISO 8601
  next_call: {
    when: string;                        // ISO 8601
    title: string | null;
    entity_name: string | null;
    entity_type: 'lead' | 'property_owner' | 'partner' | null;
    entity_id: string | number | null;
  } | null;
  open_tasks_count: number;
  open_callbacks_count: number;
  generated_at: string;                  // ISO 8601
}
```

## Konstanten

| Konstante | Wert |
|-----------|------|
| App Group ID | `group.com.euricio.crm.widget` |
| Storage Key | `euricio_widget_snapshot` |
| iOS Deployment Target | 17.0 |
| Android min update period | 30 min (OS clamp) |
| Widget-Farben | `#1B5E3F` (bg), `#2A8F5F` (accent) |

## Troubleshooting

- **iOS Widget bleibt leer**: App Group ID in Xcode unter Signing &
  Capabilities prüfen. Beide Targets (App + Widget Extension) müssen
  `group.com.euricio.crm.widget` haben.
- **Android Widget zeigt „Open Euricio“ dauerhaft**: App nie im
  authentifizierten Zustand geöffnet → Cache leer. Einmal einloggen.
- **Widget aktualisiert sich nicht**: iOS refresh-Policy ist `.after(20min)` +
  `ExtensionStorage.reloadWidget()`. Android ist durch das OS auf ≥ 30 min
  geclampt — für Tests die App in den Vordergrund bringen.
