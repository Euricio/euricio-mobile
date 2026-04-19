# Security policy — Euricio Mobile

**This repository is PUBLIC.** Everything committed here — code, comments,
screenshots, sample data — is visible to the entire internet and
permanently in git history.

## Non-negotiable rules

1. **No secrets in code, ever.** Not API keys, not tokens, not
   passwords, not SDK IDs that identify private infrastructure, not even
   as a fallback after `||`. All secrets come from `process.env.*` at
   build time and are configured as EAS secrets or local `.env`.
2. **No real customer data.** No real emails, phone numbers, property
   addresses, or names in fixtures, tests, or comments. Use synthetic
   data.
3. **RLS is the only thing protecting our Supabase data** from the
   anon key that ships with every app bundle. Never disable it.
4. **Pre-commit:** run `gitleaks protect --staged` locally. CI runs
   gitleaks on every PR and push; a finding blocks the merge.

## Reporting

Suspected leaks → security@euricio.es (private). Do **not** open a
public issue — that amplifies the leak.
