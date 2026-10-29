/**
 * Phone helpers for the Pipedrive click-to-call bridge.
 * Kept in sync with Euricio.es/lib/pipedrive/phone.ts (same tests apply).
 *
 * Pipedrive stores numbers exactly as the user typed them
 * ("603 47 06 48", "+34 922 123 456", "0034922123456", "0151 1234567" …),
 * Twilio needs E.164. These helpers convert in both directions and compare
 * numbers independent of formatting.
 */

/** Convert any user-entered number into E.164 (`+<cc><number>`), or null if implausible. */
export function normalizePhone(raw: string | null | undefined, defaultCountryCode = '34'): string | null {
  if (!raw) return null
  let s = String(raw).trim()
  try { s = decodeURIComponent(s) } catch { /* keep as is */ }
  s = s.replace(/^(tel|callto|sip):/i, '').replace(/^\/\//, '')
  // Drop extensions ("…;ext=12", "… ext 12", "… x12")
  s = s.replace(/\s*(?:;\s*ext=|ext\.?|x)\s*\d+\s*$/i, '')

  const hasPlus = s.trim().startsWith('+')
  let digits = s.replace(/\D/g, '')
  if (!digits) return null

  const cc = (defaultCountryCode || '34').replace(/\D/g, '') || '34'

  if (hasPlus) {
    // +34 (0) 922 … → +34922…
    if (digits.startsWith(cc + '0') && s.includes('(0)')) digits = cc + digits.slice(cc.length + 1)
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2)
  } else if (digits.startsWith(cc) && digits.length >= cc.length + 8) {
    // Already international without "+" (e.g. 34922123456)
  } else {
    // National format: strip a single trunk prefix "0" (DE/AT/…: 0151… → 151…)
    if (digits.startsWith('0')) digits = digits.slice(1)
    digits = cc + digits
  }

  if (digits.length < 8 || digits.length > 15) return null
  return `+${digits}`
}

/** Digits-only representation. */
export function digitsOnly(raw: string | null | undefined): string {
  return (raw ?? '').replace(/\D/g, '')
}

/**
 * True when two numbers are the same line regardless of formatting / country prefix.
 * Compares the last 9 significant digits (Spanish subscriber numbers are 9 digits,
 * most European mobile/landline numbers are ≥ 9), falling back to full equality.
 */
export function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const da = digitsOnly(a).replace(/^00/, '')
  const db = digitsOnly(b).replace(/^00/, '')
  if (!da || !db) return false
  if (da.length >= 9 && db.length >= 9) return da.slice(-9) === db.slice(-9)
  return da === db
}

/**
 * Search terms to try against Pipedrive's person search, most specific first.
 * Pipedrive matches the stored text, so we try the common stored variants.
 */
export function phoneSearchTerms(e164: string, defaultCountryCode = '34'): string[] {
  const digits = digitsOnly(e164)
  const cc = defaultCountryCode.replace(/\D/g, '')
  const national = cc && digits.startsWith(cc) ? digits.slice(cc.length) : digits
  const terms = [national, e164, digits, digits.slice(-9)]
  return Array.from(new Set(terms.filter((t) => t && t.length >= 6)))
}

/** Read ?number= from the raw query string, keeping a literal "+". */
export function readRawNumber(search: string): string {
  const m = /[?&](?:number|phone|to)=([^&#]*)/i.exec(search)
  if (!m) return ''
  const keepPlus = m[1].replace(/\+/g, '%2B')
  try { return decodeURIComponent(keepPlus).trim() } catch { return m[1].trim() }
}
