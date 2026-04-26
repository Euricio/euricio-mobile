# Euricio CRM — Mobile App

Die mobile App für das Euricio Immobilien-CRM. Gebaut mit React Native (Expo) und TypeScript. Integriert sich mit dem bestehenden Backend unter `crm.euricio.es` (Supabase + Next.js).

## Tech Stack

- **Framework**: React Native mit [Expo](https://expo.dev/) (SDK 54)
- **Sprache**: TypeScript (strict mode)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing mit typed routes)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Auth-Store)
- **Server State**: [@tanstack/react-query](https://tanstack.com/query) (Caching, Refetching, Mutations)
- **Backend**: [Supabase](https://supabase.com/) (Auth, PostgreSQL, Realtime)
- **Telefonie**: Twilio Voice React Native SDK (Phase 2)
- **Secure Storage**: Expo SecureStore (Session-Token, Credentials)
- **Build & Deploy**: [EAS Build](https://docs.expo.dev/build/introduction/)

## Features

- **Authentifizierung** — Supabase Auth mit E-Mail/Passwort, Session-Persistierung via SecureStore
- **Dashboard** — Tagesübersicht mit Statistiken (offene Aufgaben, neue Leads, verpasste Anrufe), Schnellzugriff, letzte Aktivitäten
- **Lead-Verwaltung** — Liste mit Suche, Detail-Ansicht mit Kontaktdaten, Anrufen, WhatsApp, E-Mail
- **Immobilien-Katalog** — Bildergalerie, Preise, Fläche, Zimmer, Standort-Link, Exposé senden
- **Aufgaben-Management** — Filtern (Alle/Offen/In Arbeit/Erledigt), Prioritäten, Fälligkeitsdaten, direkt als erledigt markieren
- **Einstellungen** — Profil, Verfügbarkeit, Benachrichtigungen, App-Info, Abmelden
- **Pull-to-Refresh** auf allen Daten-Screens
- **VoIP-Telefonie** — Vorbereitet für Twilio Voice SDK (Phase 2)

## Voraussetzungen

- Node.js >= 18
- npm
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [EAS CLI](https://docs.expo.dev/build/setup/): `npm install -g eas-cli`
- iOS: Xcode 15+ (für natives Build)
- Android: Android Studio (für natives Build)
- Apple Developer Account (für iOS-Builds)

## Installation

```bash
# Repository klonen
git clone https://github.com/Euricio/euricio-mobile.git
cd euricio-mobile

# Abhängigkeiten installieren
npm install

# Umgebungsvariablen einrichten
cp .env.example .env.local
# .env.local mit echten Werten befüllen (Supabase Anon Key etc.)

# Expo Dev Server starten
npx expo start
```

## Umgebungsvariablen

| Variable | Beschreibung |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase Projekt-URL (von `supabase.com` → Project Settings → API) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key (aus Supabase Dashboard → Settings → API) |
| `EXPO_PUBLIC_API_URL` | Backend-API URL (`https://crm.euricio.es`) |

## iOS Development Build

```bash
# Einmalig:
npm install -g eas-cli
eas login
eas build:configure

# Simulator Build:
eas build --platform ios --profile development

# Geräte-Build (iPhone):
eas build --platform ios --profile development-device
# → Installiere die .ipa über den Link von EAS
```

## Build-Profile

| Profil | Zweck | Befehl |
|---|---|---|
| `development` | iOS Simulator zum Entwickeln | `eas build --platform ios --profile development` |
| `development-device` | Auf echtem iPhone testen | `eas build --platform ios --profile development-device` |
| `preview` | Internes Testing (TestFlight-Äquivalent) | `eas build --platform ios --profile preview` |
| `production` | App Store Release | `eas build --platform ios --profile production` |

## Projektstruktur

```
euricio-mobile/
├── app/                      # Expo Router — Screens & Navigation
│   ├── _layout.tsx           # Root Layout (QueryClient, AuthProvider)
│   ├── (auth)/               # Auth-Flow
│   │   ├── _layout.tsx       # Auth Stack
│   │   └── login.tsx         # Login-Screen
│   └── (app)/                # Authentifizierter Bereich
│       ├── _layout.tsx       # Auth Guard + Loading
│       ├── (tabs)/           # Tab-Navigation (5 Tabs)
│       │   ├── _layout.tsx   # Tab-Bar Konfiguration
│       │   ├── dashboard.tsx # Dashboard
│       │   ├── leads/        # Leads (Liste + Detail)
│       │   ├── properties/   # Immobilien (Liste + Detail)
│       │   ├── tasks/        # Aufgaben (mit Filter-Tabs)
│       │   └── settings.tsx  # Einstellungen
│       └── call/[id].tsx     # Anruf-Screen (Modal)
├── components/ui/            # Design-System Komponenten
│   ├── Avatar.tsx            # Avatar mit Initialen-Fallback
│   ├── Badge.tsx             # Status-Badges
│   ├── Button.tsx            # Button-Varianten
│   ├── Card.tsx              # Karten mit Shadow
│   ├── EmptyState.tsx        # "Keine Daten" Platzhalter
│   ├── Header.tsx            # Screen-Header
│   ├── Input.tsx             # Eingabefeld mit Label & Icon
│   ├── LoadingScreen.tsx     # Ladeindikator
│   └── SearchBar.tsx         # Suchleiste
├── lib/                      # Business Logic & Services
│   ├── supabase.ts           # Supabase Client (SecureStore Adapter)
│   ├── auth/authContext.tsx   # Auth Context Provider
│   ├── api/                  # React Query Hooks für Supabase
│   │   ├── leads.ts          # useLeads, useLead, useCreateLead, useUpdateLead
│   │   ├── tasks.ts          # useTasks, useCompleteTask, useCreateTask
│   │   ├── properties.ts     # useProperties, useProperty
│   │   └── dashboard.ts      # useDashboardStats, useRecentActivity
│   └── voice/                # Twilio Voice (Phase 2)
│       ├── voiceManager.ts   # SDK-Wrapper (Platzhalter)
│       └── accessToken.ts    # Token-Fetch vom Backend
├── store/                    # Zustand Stores
│   └── authStore.ts          # User, Session, Auth State
├── constants/                # Design Tokens
│   └── theme.ts              # Farben, Spacing, Typography, Shadows
├── app.config.ts             # Expo-Konfiguration (iOS + Android)
├── eas.json                  # EAS Build-Profile
└── .env.example              # Umgebungsvariablen-Vorlage
```

## Apple Developer — Manuelle Schritte

Folgende Schritte müssen im Apple Developer Portal manuell durchgeführt werden:

1. **App ID** `com.euricio.crm` im Apple Developer Portal anlegen
2. **Push Notification** Capability aktivieren
3. **VoIP Services** Capability aktivieren (für Twilio Voice in Phase 2)
4. **Associated Domains** Capability aktivieren (für Universal Links auf `crm.euricio.es`)
5. **Provisioning Profile** für Development erstellen (oder EAS Managed Credentials nutzen)
6. In **App Store Connect**: Neue App anlegen mit Bundle ID `com.euricio.crm`, App ID `6762286649`, SKU `euricio-crm-ios-001`

## In-App Signing & Universal Links (iOS)

Signier- und Kunden-Portal-Links auf `crm.euricio.es` öffnen ab Build #3 direkt in
der App (`SFSafariViewController` ohne sichtbare URL-Leiste) statt im System-Safari.

**Backend (einmalig):** unter `https://crm.euricio.es/.well-known/apple-app-site-association`
folgendes JSON ausliefern (Content-Type `application/json`, ohne `.json`-Endung):

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": ["ZCAN59P52X.com.euricio.crm"],
        "components": [
          { "/": "/sign/*" },
          { "/": "/portal/*" }
        ]
      }
    ]
  }
}
```

**iOS-Konfiguration** (`app.config.js`): `associatedDomains: ['applinks:crm.euricio.es']`.

**Android (Platzhalter):** Universal-Links-Pendant (App Links) ist vorbereitet,
aber nicht aktiv. Aktivieren mit:
1. SHA-256-Fingerprint des Release-Signing-Keys ermitteln (`eas credentials`)
2. `https://crm.euricio.es/.well-known/assetlinks.json` mit dem Fingerprint hosten
3. Den auskommentierten `intentFilters`-Block in `app.config.js` (Android-Sektion) aktivieren
4. Neuer EAS-Build

## Design-System

| Token | Wert | Verwendung |
|---|---|---|
| `colors.primary` | `#1E3A5F` | Euricio Dunkelblau — Buttons, aktive Tabs, Akzente |
| `colors.primaryLight` | `#2D5F8B` | Avatar-Hintergrund, Hover-States |
| `colors.accent` | `#E8A838` | Warm-Akzent für Aufgaben-Buttons |
| `colors.background` | `#F5F7FA` | Hintergrund aller Screens |
| `colors.surface` | `#FFFFFF` | Karten, Tab-Bar, Header |

## Architektur-Entscheidungen

- **React Query statt useEffect**: Alle API-Aufrufe laufen über `useQuery`/`useMutation` — automatisches Caching, Refetching, Error Handling
- **Zustand nur für Auth**: Server-State wird via React Query verwaltet, nur Auth-State liegt im Zustand-Store
- **Supabase direkt**: Die App nutzt den Supabase JS Client direkt (kein Backend-Proxy für CRUD-Operationen), da RLS die Mandantentrennung sicherstellt
- **Expo Router**: File-based Routing mit typed routes für Typsicherheit bei Navigation
- **SecureStore für Auth**: Session-Tokens werden im iOS Keychain / Android Keystore gespeichert

## Lizenz

Proprietär — Euricio Real Estate Group S.L.
