# Euricio CRM — Mobile App

Die mobile App für das Euricio Immobilien-CRM. Gebaut mit React Native (Expo) und integriert mit Twilio Voice für VoIP-Telefonie.

## Tech Stack

- **Framework**: React Native mit [Expo](https://expo.dev/) (SDK 54)
- **Sprache**: TypeScript
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Backend**: [Supabase](https://supabase.com/) (Auth, Database, Realtime)
- **Telefonie**: [Twilio Voice React Native SDK](https://www.twilio.com/docs/voice/sdks/react-native)
- **Push**: Expo Notifications + Firebase Cloud Messaging
- **Secure Storage**: Expo SecureStore
- **Build**: [EAS Build](https://docs.expo.dev/build/introduction/)

## Features (geplant)

- Login / Authentifizierung via Supabase Auth
- Dashboard mit Tagesübersicht (verpasste Anrufe, Aufgaben, neue Leads)
- Lead-Verwaltung (Liste, Suche, Detail-Ansicht)
- Immobilien-Katalog
- Aufgaben-Management (Rückruf-Tasks, Follow-ups)
- VoIP-Telefonie (ein-/ausgehende Anrufe via Twilio)
- Push-Benachrichtigungen (verpasste Anrufe, neue Leads, fällige Aufgaben)
- WhatsApp / Telegram Chat-Integration
- Offline-Caching

## Voraussetzungen

- Node.js >= 18
- npm oder yarn
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS: Xcode 15+ (für natives Build)
- Android: Android Studio (für natives Build)
- [EAS CLI](https://docs.expo.dev/build/setup/): `npm install -g eas-cli`

## Installation

```bash
# Repository klonen
git clone https://github.com/Euricio/euricio-mobile.git
cd euricio-mobile

# Abhängigkeiten installieren
npm install

# Umgebungsvariablen einrichten
cp .env.example .env
# .env-Datei mit echten Werten befüllen
```

## Umgebungsvariablen

| Variable | Beschreibung |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase Projekt-URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key |
| `EXPO_PUBLIC_API_URL` | API-URL (crm.euricio.es) |

## Entwicklung starten

```bash
# Expo Dev Server starten
npx expo start

# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android
```

> **Hinweis**: Für Twilio Voice und Push-Benachrichtigungen wird ein Development Build benötigt (kein Expo Go).

## Build-Anweisungen

### Development Build (zum Testen)

```bash
# iOS
eas build --platform ios --profile development

# Android
eas build --platform android --profile development
```

### Preview Build (internes Testing)

```bash
eas build --platform all --profile preview
```

### Production Build

```bash
# iOS + Android
eas build --platform all --profile production

# Einreichen bei App Store / Google Play
eas submit --platform ios
eas submit --platform android
```

## Architektur-Übersicht

```
euricio-mobile/
├── app/                    # Expo Router — Screens & Navigation
│   ├── (auth)/             # Auth-Flow (Login)
│   ├── (app)/              # Authentifizierter Bereich
│   │   ├── (tabs)/         # Tab-Navigation
│   │   │   ├── dashboard   # Tagesübersicht
│   │   │   ├── leads/      # Lead-Verwaltung
│   │   │   ├── properties/ # Immobilien
│   │   │   ├── tasks/      # Aufgaben
│   │   │   └── settings    # Einstellungen
│   │   └── call/           # Anruf-Screen (Modal)
│   └── _layout.tsx         # Root Layout
├── components/             # Wiederverwendbare UI-Komponenten
│   ├── call/               # Anruf-Komponenten
│   ├── chat/               # Chat-Komponenten
│   ├── common/             # Allgemeine Komponenten
│   └── leads/              # Lead-Komponenten
├── lib/                    # Business Logic & Services
│   ├── api/                # Supabase Client & API-Funktionen
│   ├── voice/              # Twilio Voice SDK Wrapper
│   ├── push/               # Push-Benachrichtigungen
│   ├── auth/               # Auth Context & Secure Storage
│   └── offline/            # Offline-Cache
├── hooks/                  # Custom React Hooks
├── store/                  # Zustand Stores (State Management)
├── constants/              # Farben, Konfiguration
├── app.config.ts           # Expo-Konfiguration
├── eas.json                # EAS Build-Profile
└── .env.example            # Umgebungsvariablen-Vorlage
```

## Wichtige Konzepte

### VoIP-Telefonie (Twilio)

Die App registriert sich beim Start über den Twilio Voice SDK für eingehende Anrufe. Access Tokens werden vom Backend (`/api/voice/token`) bezogen und automatisch erneuert.

- **Ausgehend**: `voiceManager.connect(token, phoneNumber)`
- **Eingehend**: Wird über `Voice.Event.CallInvite` empfangen
- **Verpasste Anrufe**: Erzeugen automatisch Rückruf-Aufgaben

### Authentifizierung

Supabase Auth mit Session-Persistierung über Expo SecureStore. JWT-Tokens werden automatisch erneuert.

### Realtime

Supabase Realtime-Subscriptions für:
- Neue Benachrichtigungen
- Lead-Updates
- Task-Änderungen

## Lizenz

Proprietär — Euricio Real Estate Group S.L.
