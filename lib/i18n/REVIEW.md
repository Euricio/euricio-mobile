# Editorial review — Catalan (ca-ES) and Basque (eu-ES)

This document tracks the items in the Catalan and Basque translations that
need a final pass from a native speaker before the new locales are turned
on for end users.

## Locale-code decision

| Locale  | Persisted (SecureStore + `profiles.language`) | `Intl` / `toLocale*` code |
| ------- | --------------------------------------------- | ------------------------- |
| Catalan | `ca`                                          | `ca-ES`                   |
| Basque  | `eu`                                          | `eu-ES`                   |

The runtime persists the bare 2-letter code (`ca`, `eu`) but feeds the
region-tagged form into every `Intl` / `toLocale*` call via
`LOCALE_DATE_FORMATS`. Region-tagged inputs (`ca-ES`, `ca_ES`, `CA-es`,
`ca-AD`) are accepted on the way in and normalized to the short code by
`normalizeLocale()` in `lib/i18n/context.tsx`.

## Fallback strategy

Defined in `LOCALE_FALLBACK_CHAIN` in `lib/i18n/types.ts`:

```
ca → es → en → de → <key>
eu → es → en → de → <key>
```

The previous chain (de → key) is preserved for de/es/en. The Catalan and
Basque chains fall back to Spanish *first* because:

1. Catalan and Basque speakers in Spain are co-fluent in Spanish, so a
   Spanish string is always a graceful degradation, never a broken UI.
2. Spanish is the only one of de/en that all regional CRM users reliably
   read.

This means: the long tail of less-visible keys that this PR did NOT
hand-translate will render in Spanish. The user is never shown a raw key.
This is intentional and documented in the header of each locale file.

## Surfaces fully hand-translated in this PR

- Common UI (save / cancel / delete / yes / no / loading / error / etc.)
- Navigation tabs and the dashboard greeting/stats/quick-access surface
- Login and auth error screens
- Settings: language picker, logout, notifications, telephony, about
- Leads: list, create/edit forms, statuses, sources, detail header,
  call-history card
- Properties: list, statuses, types, sections, form labels (subset),
  features, orientation, condition, heating, offer type, legal status
- Tasks: list, filters, form, types, priorities
- Property media: photos, documents, permissions, errors
- HR module: clock-in/out, shifts, team, vacation
- Language picker labels (used in lead and recruitment forms)
- Contracts / email send sheet (legal-sensitive — see review notes below)
- Busy mode: announcement language picker UI labels
- Document portal: customer-facing access modal
- Widgets: home-screen widget settings
- Pipeline admin stage editor: per-language stage name inputs

## Surfaces that intentionally fall back to Spanish

The remaining ~2000 keys (deep admin screens, less-trafficked configuration
panels, voice flow editor, recruitment internals, etc.) fall through to
Spanish via the documented chain. They will surface in Spanish to
Catalan/Basque users until additional translation passes are budgeted —
which is a normal phased rollout for a CRM with ~2370 keys.

A native-speaker pass can extend coverage incrementally by adding entries
to `lib/i18n/locales/ca.ts` and `lib/i18n/locales/eu.ts` — the parity test
in `lib/i18n/i18n.test.ts` will continue to enforce that no key is ever
left undefined.

## Items flagged for native-speaker review

The following strings are usable but were authored by a non-native
contributor and are business-, legal-, or compliance-sensitive enough that
a final pass from a native Catalan and a native Basque speaker is strongly
recommended before public rollout. None of them block the rollout: the
fallback chain ensures users see correct Spanish if these strings are ever
removed pending review.

### Catalan (ca-ES)

1. **Busy-mode announcement templates** (`lib/busyPresets.ts` → `PRESET_TEMPLATES.ca`)
   These are the spoken text that the customer hears when the agent is
   unavailable. They were authored from the Spanish source with care for
   tone but should be read aloud by a native speaker to verify they sound
   natural on the phone. Twilio does not yet ship a Catalan TTS voice, so
   today they are spoken by the Spanish voice (see `TWILIO_SAY_LANG.ca`)
   — the text is still kept ready for the future TTS upgrade.

2. **Contract / signature email copy** (`email_sendContract`,
   `email_recipientEmail*`, `email_send*`)
   The mobile app uses these as the language picker for the *server-side*
   email template. The mobile-facing strings are translated; the actual
   email body is rendered by the backend, where the locale identifier is
   passed through as `language: 'ca'` and currently falls back to Spanish
   server-side.

3. **Document portal customer-facing labels** (`docportal.accessModal.*`)
   This wording is what the *broker* sees while creating a portal-access
   link for an end customer. The customer-facing portal pages themselves
   are served by the web codebase (separate repository), not this app.

4. **Legal/property terminology**
   `propStatus_reserved` → "Reservat", `legalStatus_legal_dispute` →
   "Litigi", `feature_storage` → "Traster", and the heating / condition /
   orientation enums should be cross-referenced against real-estate
   industry usage in Catalonia (some regions prefer `Magatzem` over
   `Traster` for property storage rooms).

### Basque (eu-ES)

1. **Busy-mode announcement templates** (`lib/busyPresets.ts` → `PRESET_TEMPLATES.eu`)
   Same caveat as Catalan: spoken text needs a native reader. Twilio
   currently has no Basque TTS voice; today the announcement falls back
   to Spanish (`TWILIO_SAY_LANG.eu = 'es-ES'`). Templates are ready for
   when a TTS engine adds eu-ES support.

2. **Contract / signature email copy**
   See note 2 above; same considerations.

3. **Document portal customer-facing labels**
   See note 3 above; same considerations.

4. **Property-type and feature terminology**
   `propType_villa` and `propType_chalet` both map to "Txaleta" in the
   first pass — a native speaker may prefer different distinctions, e.g.
   keeping `Villa` as the international term. Similarly `feature_storage`
   → "Trastelekua" and `feature_garage` → "Garajea" should be confirmed
   against local industry usage in the Basque Country.

5. **Greetings**
   `greeting_evening` → "Gabon" is currently in use for "Good evening";
   some speakers reserve "Gabon" for night and use "Arratsalde on" until
   later. The dashboard greeting threshold (which key fires at which hour)
   lives in the dashboard component and is independent of this file.

## How to extend coverage

Add the missing key in `lib/i18n/locales/ca.ts` or `lib/i18n/locales/eu.ts`
mirroring the Spanish key in `lib/i18n/locales/es.ts`. The parity test
will keep passing as long as keys remain a superset of (or equal to) what
the app actually references.

```bash
npx ts-node --transpile-only \
  -O '{"module":"commonjs","moduleResolution":"node","customConditions":null}' \
  lib/i18n/i18n.test.ts
```

The test enforces:
- normalization of OS-supplied region-tagged codes (`ca-ES`, `eu_ES`, …)
- fallback chain correctness
- per-key resolvability across all five locales
- a native-authoring sanity check on the hottest keys
