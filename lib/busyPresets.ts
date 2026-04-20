export type BusyPresetKey =
  | 'in_appointment'
  | 'at_notary'
  | 'at_viewing'
  | 'on_call'
  | 'in_meeting'
  | 'off_duty'
  | 'on_vacation'
  | 'sick_leave'
  | 'custom'

export type AnnouncementLang = 'es' | 'de' | 'en'

export interface BusyPreset {
  key: BusyPresetKey
  icon: string
}

export const BUSY_PRESETS: BusyPreset[] = [
  { key: 'in_appointment', icon: '📅' },
  { key: 'at_notary',      icon: '✍️' },
  { key: 'at_viewing',     icon: '🏠' },
  { key: 'on_call',        icon: '📞' },
  { key: 'in_meeting',     icon: '👥' },
  { key: 'off_duty',       icon: '🌙' },
  { key: 'on_vacation',    icon: '🏖️' },
  { key: 'sick_leave',     icon: '🤒' },
  { key: 'custom',         icon: '✏️' },
]

/** Twilio SayLanguage codes matching an AnnouncementLang */
export const TWILIO_SAY_LANG: Record<AnnouncementLang, string> = {
  es: 'es-ES',
  de: 'de-DE',
  en: 'en-GB',
}

type Tpl = { base: string; withCallback: string }
type PresetMap = Record<Exclude<BusyPresetKey, 'custom'>, Tpl>

/**
 * Single source of truth for spoken announcements in all 3 languages.
 * Used both client-side (preview) and server-side (TwiML <Say>).
 * Friendly, verbose, apologetic tone. Placeholders: {{name}}, {{callbackTime}}.
 */
export const PRESET_TEMPLATES: Record<AnnouncementLang, PresetMap> = {
  es: {
    in_appointment: {
      base: 'Hola, gracias por su llamada. En este momento {{name}} se encuentra atendiendo una cita y no puede atenderle personalmente. Le rogamos disculpe las molestias; en seguida le pasamos con un compañero que estará encantado de ayudarle.',
      withCallback: 'Hola, gracias por su llamada. En este momento {{name}} se encuentra atendiendo una cita y no puede atenderle personalmente. Estará disponible de nuevo a partir de las {{callbackTime}} aproximadamente. Le rogamos disculpe las molestias; en seguida le pasamos con un compañero que estará encantado de ayudarle.',
    },
    at_notary: {
      base: 'Hola y gracias por ponerse en contacto con nosotros. En este momento {{name}} se encuentra en la notaría formalizando una operación y no puede atenderle directamente. Disculpe las molestias; le atenderá enseguida otro miembro del equipo.',
      withCallback: 'Hola y gracias por ponerse en contacto con nosotros. En este momento {{name}} se encuentra en la notaría formalizando una operación y no puede atenderle directamente. Prevé estar de vuelta sobre las {{callbackTime}}. Disculpe las molestias; le atenderá enseguida otro miembro del equipo.',
    },
    at_viewing: {
      base: 'Hola, muchas gracias por su llamada. {{name}} está en estos momentos enseñando una propiedad a un cliente y no puede atenderle personalmente. Le atendemos igualmente con mucho gusto: le pasamos con un compañero del equipo.',
      withCallback: 'Hola, muchas gracias por su llamada. {{name}} está en estos momentos enseñando una propiedad a un cliente y no puede atenderle personalmente. Volverá a estar disponible aproximadamente a las {{callbackTime}}. Le atendemos igualmente con mucho gusto: le pasamos con un compañero del equipo.',
    },
    on_call: {
      base: 'Hola y gracias por su llamada. En este momento {{name}} está atendiendo otra conversación telefónica. Le pasamos enseguida con un compañero del equipo que estará encantado de atenderle.',
      withCallback: 'Hola y gracias por su llamada. En este momento {{name}} está atendiendo otra conversación telefónica. Estimamos que podrá devolverle la llamada a partir de las {{callbackTime}}. Si lo prefiere, le pasamos enseguida con un compañero del equipo que estará encantado de atenderle.',
    },
    in_meeting: {
      base: 'Hola, gracias por contactar con nosotros. {{name}} se encuentra en una reunión interna en este momento y no puede atender su llamada personalmente. Mientras tanto, le pasamos con un compañero que podrá ayudarle de inmediato.',
      withCallback: 'Hola, gracias por contactar con nosotros. {{name}} se encuentra en una reunión interna en este momento y no puede atender su llamada personalmente. Prevé finalizar hacia las {{callbackTime}}. Mientras tanto, le pasamos con un compañero que podrá ayudarle de inmediato.',
    },
    off_duty: {
      base: 'Hola y gracias por su llamada. {{name}} se encuentra hoy fuera de servicio y no estará disponible durante el día de hoy. Para que su consulta no quede sin respuesta, le atenderá enseguida un compañero del equipo.',
      withCallback: 'Hola y gracias por su llamada. {{name}} se encuentra hoy fuera de servicio y no estará disponible durante el día de hoy. Volverá a estar operativo a partir de las {{callbackTime}}. Para que su consulta no quede sin respuesta, le atenderá enseguida un compañero del equipo.',
    },
    on_vacation: {
      base: 'Hola y gracias por llamar. En estos momentos {{name}} se encuentra disfrutando de sus vacaciones y no podrá atenderle personalmente. Durante su ausencia, un compañero del equipo se encargará de atenderle con la misma dedicación de siempre — le pasamos enseguida.',
      withCallback: 'Hola y gracias por llamar. En estos momentos {{name}} se encuentra disfrutando de sus vacaciones y no podrá atenderle personalmente. Estará de vuelta a partir del {{callbackTime}}. Durante su ausencia, un compañero del equipo se encargará de atenderle con la misma dedicación de siempre — le pasamos enseguida.',
    },
    sick_leave: {
      base: 'Hola, gracias por su llamada. {{name}} se encuentra hoy ausente por motivos de salud y no puede atenderle personalmente. Para que reciba la atención que merece, un compañero del equipo se pondrá con usted en unos segundos.',
      withCallback: 'Hola, gracias por su llamada. {{name}} se encuentra hoy ausente por motivos de salud y no puede atenderle personalmente. Prevé reincorporarse a partir del {{callbackTime}}. Para que reciba la atención que merece, un compañero del equipo se pondrá con usted en unos segundos.',
    },
  },

  de: {
    in_appointment: {
      base: 'Guten Tag und vielen Dank für Ihren Anruf. {{name}} befindet sich gerade in einem Termin und kann Sie persönlich leider nicht entgegennehmen. Wir bitten um Ihr Verständnis und verbinden Sie gleich mit einem Kollegen, der Ihnen gerne weiterhilft.',
      withCallback: 'Guten Tag und vielen Dank für Ihren Anruf. {{name}} befindet sich gerade in einem Termin und kann Sie persönlich leider nicht entgegennehmen. Ab ca. {{callbackTime}} Uhr ist er wieder erreichbar. Wir bitten um Ihr Verständnis und verbinden Sie gleich mit einem Kollegen, der Ihnen gerne weiterhilft.',
    },
    at_notary: {
      base: 'Guten Tag und vielen Dank für Ihren Anruf. {{name}} ist gerade beim Notar und nimmt dort eine Beurkundung wahr, sodass er Ihr Gespräch im Moment nicht persönlich entgegennehmen kann. Bitte entschuldigen Sie die Unannehmlichkeiten — ein Kollege kümmert sich gleich um Ihr Anliegen.',
      withCallback: 'Guten Tag und vielen Dank für Ihren Anruf. {{name}} ist gerade beim Notar und nimmt dort eine Beurkundung wahr, sodass er Ihr Gespräch im Moment nicht persönlich entgegennehmen kann. Gegen {{callbackTime}} Uhr ist er voraussichtlich wieder erreichbar. Bitte entschuldigen Sie die Unannehmlichkeiten — ein Kollege kümmert sich gleich um Ihr Anliegen.',
    },
    at_viewing: {
      base: 'Guten Tag und vielen Dank für Ihren Anruf. {{name}} führt gerade eine Besichtigung mit Kunden durch und kann Ihr Gespräch im Moment nicht persönlich entgegennehmen. Damit Sie nicht warten müssen, verbinden wir Sie direkt mit einem Kollegen, der Ihnen gerne weiterhilft.',
      withCallback: 'Guten Tag und vielen Dank für Ihren Anruf. {{name}} führt gerade eine Besichtigung mit Kunden durch und kann Ihr Gespräch im Moment nicht persönlich entgegennehmen. Ab etwa {{callbackTime}} Uhr ist er wieder erreichbar. Damit Sie nicht warten müssen, verbinden wir Sie direkt mit einem Kollegen, der Ihnen gerne weiterhilft.',
    },
    on_call: {
      base: 'Guten Tag und vielen Dank für Ihren Anruf. {{name}} befindet sich gerade in einem anderen Telefonat und kann Sie leider nicht direkt entgegennehmen. Gerne verbinden wir Sie sofort mit einem Kollegen, der sich um Ihr Anliegen kümmert.',
      withCallback: 'Guten Tag und vielen Dank für Ihren Anruf. {{name}} befindet sich gerade in einem anderen Telefonat und kann Sie leider nicht direkt entgegennehmen. Voraussichtlich ab {{callbackTime}} Uhr kann er Sie zurückrufen. Gerne verbinden wir Sie sofort mit einem Kollegen, der sich um Ihr Anliegen kümmert.',
    },
    in_meeting: {
      base: 'Guten Tag und vielen Dank, dass Sie uns anrufen. {{name}} nimmt gerade an einer internen Besprechung teil und kann Ihr Gespräch derzeit nicht persönlich entgegennehmen. In der Zwischenzeit verbinden wir Sie gerne mit einem Kollegen, der Ihnen sofort weiterhelfen kann.',
      withCallback: 'Guten Tag und vielen Dank, dass Sie uns anrufen. {{name}} nimmt gerade an einer internen Besprechung teil und kann Ihr Gespräch derzeit nicht persönlich entgegennehmen. Voraussichtlich gegen {{callbackTime}} Uhr ist er wieder erreichbar. In der Zwischenzeit verbinden wir Sie gerne mit einem Kollegen, der Ihnen sofort weiterhelfen kann.',
    },
    off_duty: {
      base: 'Guten Tag und vielen Dank für Ihren Anruf. {{name}} ist heute außer Dienst und steht Ihnen tagsüber nicht zur Verfügung. Damit Ihr Anliegen nicht unbearbeitet bleibt, kümmert sich gleich ein Kollege um Sie.',
      withCallback: 'Guten Tag und vielen Dank für Ihren Anruf. {{name}} ist heute außer Dienst und steht Ihnen tagsüber nicht zur Verfügung. Ab {{callbackTime}} Uhr ist er wieder im Einsatz. Damit Ihr Anliegen nicht unbearbeitet bleibt, kümmert sich gleich ein Kollege um Sie.',
    },
    on_vacation: {
      base: 'Guten Tag und vielen Dank für Ihren Anruf. {{name}} befindet sich zurzeit im Urlaub und kann Sie persönlich leider nicht entgegennehmen. Während seiner Abwesenheit betreut Sie ein Kollege aus dem Team mit der gewohnten Sorgfalt — wir verbinden Sie direkt weiter.',
      withCallback: 'Guten Tag und vielen Dank für Ihren Anruf. {{name}} befindet sich zurzeit im Urlaub und kann Sie persönlich leider nicht entgegennehmen. Ab {{callbackTime}} ist er wieder für Sie da. Während seiner Abwesenheit betreut Sie ein Kollege aus dem Team mit der gewohnten Sorgfalt — wir verbinden Sie direkt weiter.',
    },
    sick_leave: {
      base: 'Guten Tag und vielen Dank für Ihren Anruf. {{name}} ist heute krankheitsbedingt abwesend und kann Ihr Gespräch nicht persönlich entgegennehmen. Damit Sie die gewohnte Betreuung erhalten, meldet sich in wenigen Sekunden ein Kollege aus dem Team bei Ihnen.',
      withCallback: 'Guten Tag und vielen Dank für Ihren Anruf. {{name}} ist heute krankheitsbedingt abwesend und kann Ihr Gespräch nicht persönlich entgegennehmen. Voraussichtlich ab {{callbackTime}} ist er wieder im Büro. Damit Sie die gewohnte Betreuung erhalten, meldet sich in wenigen Sekunden ein Kollege aus dem Team bei Ihnen.',
    },
  },

  en: {
    in_appointment: {
      base: 'Hello and thank you for calling. {{name}} is currently in a meeting and unable to take your call personally. We apologise for the inconvenience and will connect you with a colleague who will be happy to assist you.',
      withCallback: 'Hello and thank you for calling. {{name}} is currently in a meeting and unable to take your call personally. He will be available again from approximately {{callbackTime}}. We apologise for the inconvenience and will connect you with a colleague who will be happy to assist you.',
    },
    at_notary: {
      base: 'Hello and thank you for calling. {{name}} is currently at the notary attending a signing and cannot take your call in person. We apologise for any inconvenience; a colleague will be with you shortly.',
      withCallback: 'Hello and thank you for calling. {{name}} is currently at the notary attending a signing and cannot take your call in person. He expects to be back around {{callbackTime}}. We apologise for any inconvenience; a colleague will be with you shortly.',
    },
    at_viewing: {
      base: 'Hello and thank you for calling. {{name}} is currently showing a property to a client and is unable to take your call personally. So you don\'t have to wait, we\'ll connect you with a colleague who will be glad to help.',
      withCallback: 'Hello and thank you for calling. {{name}} is currently showing a property to a client and is unable to take your call personally. He will be available again from approximately {{callbackTime}}. So you don\'t have to wait, we\'ll connect you with a colleague who will be glad to help.',
    },
    on_call: {
      base: 'Hello and thank you for calling. {{name}} is currently on another call and cannot take your call directly. If you prefer, we can connect you with a colleague right away who will be happy to help.',
      withCallback: 'Hello and thank you for calling. {{name}} is currently on another call and cannot take your call directly. He expects to be able to call you back from around {{callbackTime}}. If you prefer, we can connect you with a colleague right away who will be happy to help.',
    },
    in_meeting: {
      base: 'Hello and thank you for contacting us. {{name}} is currently in an internal meeting and cannot take your call personally. In the meantime, we\'ll connect you with a colleague who can assist you right away.',
      withCallback: 'Hello and thank you for contacting us. {{name}} is currently in an internal meeting and cannot take your call personally. He expects to finish around {{callbackTime}}. In the meantime, we\'ll connect you with a colleague who can assist you right away.',
    },
    off_duty: {
      base: 'Hello and thank you for calling. {{name}} is off duty today and will not be available during the day. To make sure your enquiry doesn\'t go unanswered, a colleague will be with you shortly.',
      withCallback: 'Hello and thank you for calling. {{name}} is off duty today and will not be available during the day. He will be back on duty from {{callbackTime}}. To make sure your enquiry doesn\'t go unanswered, a colleague will be with you shortly.',
    },
    on_vacation: {
      base: 'Hello and thank you for calling. {{name}} is currently on holiday and unfortunately cannot take your call in person. During his absence, a colleague from the team will look after you with the same care as always — we\'ll connect you right away.',
      withCallback: 'Hello and thank you for calling. {{name}} is currently on holiday and unfortunately cannot take your call in person. He will be back from {{callbackTime}}. During his absence, a colleague from the team will look after you with the same care as always — we\'ll connect you right away.',
    },
    sick_leave: {
      base: 'Hello and thank you for calling. {{name}} is out sick today and unable to take your call personally. To ensure you receive the attention you deserve, a colleague from the team will be with you in just a few seconds.',
      withCallback: 'Hello and thank you for calling. {{name}} is out sick today and unable to take your call personally. He expects to be back from {{callbackTime}}. To ensure you receive the attention you deserve, a colleague from the team will be with you in just a few seconds.',
    },
  },
}

/**
 * Build a spoken announcement. Pure — no i18n dependency.
 * Used by both client (preview) and server (TwiML).
 */
export function renderPresetAnnouncement(
  presetKey: BusyPresetKey | null,
  language: AnnouncementLang,
  displayName: string,
  callbackTime: string | null | undefined,
): string {
  if (!presetKey || presetKey === 'custom') return ''
  const hasCallback = !!(callbackTime && callbackTime.trim().length > 0)
  const tpl = PRESET_TEMPLATES[language]?.[presetKey]
  if (!tpl) return ''
  const template = hasCallback ? tpl.withCallback : tpl.base
  return template
    .replace(/\{\{\s*name\s*\}\}/g, displayName)
    .replace(/\{\{\s*callbackTime\s*\}\}/g, callbackTime ?? '')
}

/**
 * LEGACY: Kept for existing callers that still pass a t() function.
 * New code should use renderPresetAnnouncement() directly.
 */
export function buildBusyAnnouncement(
  presetKey: BusyPresetKey,
  displayName: string,
  callbackTime: string | null | undefined,
  // Legacy `t` arg kept for backward compatibility with existing call sites.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _t: (key: string) => string,
): string {
  // Default to German to preserve previous behaviour
  return renderPresetAnnouncement(presetKey, 'de', displayName, callbackTime)
}

/** HH:MM from an ISO timestamp (browser local time zone). */
export function formatHHMM(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
