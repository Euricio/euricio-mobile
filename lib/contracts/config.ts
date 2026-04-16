export interface ClauseConfig {
  id: string
  title_de: string
  title_es: string
  defaultText: string
  required?: boolean
}

export interface ContractTypeConfig {
  id: string
  label_de: string
  label_es: string
  pdfTitle: string
  clauses: ClauseConfig[]
}

// ── Shared clauses (reused across multiple contract types) ──

const cl_leistung: ClauseConfig = {
  id: 'leistung',
  title_de: 'Leistungsumfang',
  title_es: 'Alcance del servicio',
  defaultText: 'ALCANCE DEL SERVICIO: {agency_name} se compromete a realizar todas las gestiones necesarias para la intermediación del inmueble en {property_address}, incluyendo valoración, marketing y negociación con posibles interesados.',
}

const cl_alleinauftrag: ClauseConfig = {
  id: 'alleinauftrag',
  title_de: 'Alleinauftrag',
  title_es: 'Mandato exclusivo',
  defaultText: 'MANDATO EXCLUSIVO: El propietario otorga a {agency_name} el mandato exclusivo de intermediación del inmueble durante el período acordado. No se contratarán otros intermediarios ni se realizarán transacciones directas.',
  required: true,
}

const cl_provision: ClauseConfig = {
  id: 'provision',
  title_de: 'Provision',
  title_es: 'Comisión',
  defaultText: 'COMISIÓN: Los honorarios de {agency_name} ascienden al {commission_pct}% del precio de venta, más IVA (IGIC en Canarias), pagaderos a la firma de la escritura ante notario.',
}

const cl_pflichten_auftraggeber: ClauseConfig = {
  id: 'pflichten_auftraggeber',
  title_de: 'Pflichten des Auftraggebers',
  title_es: 'Obligaciones del mandante',
  defaultText: 'OBLIGACIONES DEL MANDANTE: El propietario se compromete a facilitar el acceso al inmueble para visitas, aportar documentación necesaria y comunicar cualquier cambio relevante.',
}

const cl_datenschutz: ClauseConfig = {
  id: 'datenschutz',
  title_de: 'Datenschutz',
  title_es: 'Protección de datos',
  defaultText: 'PROTECCIÓN DE DATOS: Los datos personales serán tratados conforme al RGPD y la LOPDGDD. El responsable es {agency_name}. El interesado podrá ejercer sus derechos de acceso, rectificación, supresión y oposición.',
}

const cl_widerrufsrecht: ClauseConfig = {
  id: 'widerrufsrecht',
  title_de: 'Widerrufsrecht',
  title_es: 'Derecho de desistimiento',
  defaultText: 'DERECHO DE DESISTIMIENTO: El consumidor tiene derecho a desistir del contrato en un plazo de 14 días naturales sin necesidad de justificación, conforme al artículo 71 del TRLGDCU.',
}

const cl_gerichtsstand: ClauseConfig = {
  id: 'gerichtsstand',
  title_de: 'Gerichtsstand',
  title_es: 'Jurisdicción',
  defaultText: 'JURISDICCIÓN: Para cualquier controversia derivada de este contrato, las partes se someten a los juzgados y tribunales de la localidad donde se ubica el inmueble.',
}

const cl_laufzeit: ClauseConfig = {
  id: 'laufzeit',
  title_de: 'Laufzeit',
  title_es: 'Duración',
  defaultText: 'DURACIÓN: El presente contrato tiene una duración de seis (6) meses desde la firma. Se prorroga automáticamente por períodos iguales salvo comunicación escrita con 15 días de preaviso.',
}

const cl_provision_vermietung: ClauseConfig = {
  id: 'provision_vermietung',
  title_de: 'Provision (Vermietung)',
  title_es: 'Comisión (alquiler)',
  defaultText: 'COMISIÓN DE ALQUILER: Los honorarios de {agency_name} equivalen a una mensualidad de renta más IVA (IGIC en Canarias), pagaderos a la firma del contrato de arrendamiento.',
}

const cl_anwendbares_recht: ClauseConfig = {
  id: 'anwendbares_recht',
  title_de: 'Anwendbares Recht',
  title_es: 'Derecho aplicable',
  defaultText: 'DERECHO APLICABLE: Este contrato se rige por la legislación española. Para cualquier controversia serán competentes los juzgados del lugar donde radique el inmueble.',
}

// ── Mieter-Suchauftrag ──

const cl_suchprofil_mieter: ClauseConfig = {
  id: 'suchprofil_mieter',
  title_de: 'Suchprofil Mietobjekt',
  title_es: 'Perfil de búsqueda de alquiler',
  defaultText: 'PERFIL DE BÚSQUEDA: {agency_name} se compromete a buscar un inmueble en alquiler conforme a los criterios del solicitante: ubicación, número de habitaciones, superficie mínima, presupuesto máximo de renta mensual y requisitos especiales (amueblado, parking, terraza, admisión de mascotas, etc.).',
}

const cl_suchgebiet_mieter: ClauseConfig = {
  id: 'suchgebiet_mieter',
  title_de: 'Suchgebiet',
  title_es: 'Zona de búsqueda',
  defaultText: 'ZONA DE BÚSQUEDA: La búsqueda se realizará en las zonas geográficas acordadas. {agency_name} podrá proponer inmuebles en zonas limítrofes si se ajustan al perfil del solicitante, previa consulta.',
}

const cl_mietbudget: ClauseConfig = {
  id: 'mietbudget',
  title_de: 'Mietbudget',
  title_es: 'Presupuesto de alquiler',
  defaultText: 'PRESUPUESTO: La renta mensual máxima aceptable por el solicitante se fija en el importe acordado, incluyendo/excluyendo gastos de comunidad según se especifique. {agency_name} presentará exclusivamente inmuebles dentro de este rango.',
}

const cl_objektvorschlaege_mieter: ClauseConfig = {
  id: 'objektvorschlaege_mieter',
  title_de: 'Objektvorschläge',
  title_es: 'Propuestas de inmuebles',
  defaultText: 'PROPUESTAS: {agency_name} presentará al solicitante los inmuebles disponibles que se ajusten a su perfil de búsqueda. El solicitante se compromete a evaluar las propuestas y comunicar su decisión en un plazo razonable.',
}

const cl_besichtigungen_mieter: ClauseConfig = {
  id: 'besichtigungen_mieter',
  title_de: 'Besichtigungen',
  title_es: 'Visitas',
  defaultText: 'VISITAS: {agency_name} coordinará las visitas a los inmuebles propuestos, acompañando al solicitante durante las mismas. El solicitante se compromete a asistir a las visitas acordadas o comunicar su imposibilidad con antelación suficiente.',
}

const cl_dokumentation_mieter: ClauseConfig = {
  id: 'dokumentation_mieter',
  title_de: 'Erforderliche Dokumentation',
  title_es: 'Documentación requerida',
  defaultText: 'DOCUMENTACIÓN: El solicitante se compromete a facilitar la documentación que pueda ser requerida por el arrendador: justificante de ingresos, contrato laboral, referencias anteriores, documento de identidad y cualquier otro documento razonablemente solicitado.',
}

// ── Kaufvertrag / Arras ──

const cl_kaufgegenstand: ClauseConfig = {
  id: 'kaufgegenstand',
  title_de: 'Kaufgegenstand',
  title_es: 'Objeto de la compraventa',
  defaultText: 'OBJETO: La parte vendedora transmite a la parte compradora la plena propiedad del inmueble sito en {property_address}, libre de cargas y gravámenes salvo las expresamente declaradas.',
}

const cl_kaufpreis: ClauseConfig = {
  id: 'kaufpreis',
  title_de: 'Kaufpreis',
  title_es: 'Precio de compraventa',
  defaultText: 'PRECIO: El precio de la compraventa se fija en la cantidad acordada entre las partes, que se abonará en la forma y plazos establecidos en este contrato.',
}

const cl_arras: ClauseConfig = {
  id: 'arras',
  title_de: 'Arras / Anzahlung',
  title_es: 'Arras',
  defaultText: 'ARRAS: La parte compradora entrega como arras penitenciales el 10% del precio total. Si desiste el comprador, pierde dicha cantidad; si desiste el vendedor, restituirá el doble.',
}

const cl_lasten_maengel: ClauseConfig = {
  id: 'lasten_maengel',
  title_de: 'Lasten und Mängel',
  title_es: 'Cargas y defectos',
  defaultText: 'CARGAS: El vendedor declara que el inmueble se encuentra libre de cargas, gravámenes, arrendamientos y ocupantes, y se compromete a cancelar cualquier carga pendiente antes de la escritura.',
}

const cl_uebergabetermin: ClauseConfig = {
  id: 'uebergabetermin',
  title_de: 'Übergabetermin',
  title_es: 'Fecha de entrega',
  defaultText: 'ENTREGA: La entrega del inmueble se realizará en la fecha de firma de la escritura pública de compraventa ante notario, momento en que se entregarán las llaves.',
}

const cl_notarielle_beurkundung: ClauseConfig = {
  id: 'notarielle_beurkundung',
  title_de: 'Notarielle Beurkundung',
  title_es: 'Escritura notarial',
  defaultText: 'ESCRITURA: La compraventa se formalizará en escritura pública ante notario elegido de común acuerdo. Los gastos notariales y registrales se distribuirán conforme a la ley.',
}

// ── Mietvertrag ──

const cl_mietobjekt: ClauseConfig = {
  id: 'mietobjekt',
  title_de: 'Mietobjekt',
  title_es: 'Objeto del arrendamiento',
  defaultText: 'OBJETO: Se arrienda el inmueble sito en {property_address} para uso como vivienda habitual del arrendatario, en el estado en que se encuentra.',
}

const cl_mietdauer: ClauseConfig = {
  id: 'mietdauer',
  title_de: 'Mietdauer',
  title_es: 'Duración del arrendamiento',
  defaultText: 'DURACIÓN: El contrato tendrá una duración de un (1) año, prorrogable automáticamente por períodos anuales hasta un máximo de cinco (5) años conforme a la LAU.',
}

const cl_miete_nebenkosten: ClauseConfig = {
  id: 'miete_nebenkosten',
  title_de: 'Miete und Nebenkosten',
  title_es: 'Renta y gastos',
  defaultText: 'RENTA: La renta mensual se fija en la cantidad acordada, pagadera dentro de los siete primeros días de cada mes. Los suministros corren a cargo del arrendatario.',
}

const cl_kaution: ClauseConfig = {
  id: 'kaution',
  title_de: 'Kaution',
  title_es: 'Fianza',
  defaultText: 'FIANZA: El arrendatario deposita una fianza equivalente a una mensualidad de renta conforme a la LAU, que será devuelta al finalizar el contrato previa verificación del estado del inmueble.',
}

const cl_hausordnung: ClauseConfig = {
  id: 'hausordnung',
  title_de: 'Hausordnung',
  title_es: 'Normas de convivencia',
  defaultText: 'NORMAS: El arrendatario se obliga a respetar las normas de la comunidad de propietarios y a no realizar actividades molestas, insalubres, nocivas o peligrosas.',
}

const cl_instandhaltung: ClauseConfig = {
  id: 'instandhaltung',
  title_de: 'Instandhaltung',
  title_es: 'Mantenimiento',
  defaultText: 'MANTENIMIENTO: Las reparaciones necesarias para conservar la vivienda corren a cargo del arrendador. Las pequeñas reparaciones por uso ordinario corresponden al arrendatario.',
}

const cl_kuendigung: ClauseConfig = {
  id: 'kuendigung',
  title_de: 'Kündigung',
  title_es: 'Resolución',
  defaultText: 'RESOLUCIÓN: El arrendatario podrá desistir del contrato una vez transcurridos seis meses, comunicándolo con un preaviso de treinta días. El arrendador podrá resolver por impago o incumplimiento.',
}

// ── Vollmacht ──

const cl_vollmachtgeber: ClauseConfig = {
  id: 'vollmachtgeber',
  title_de: 'Vollmachtgeber',
  title_es: 'Poderdante',
  defaultText: 'PODERDANTE: El compareciente, cuyos datos constan en el encabezamiento, otorga poder a favor de la persona designada a continuación.',
}

const cl_bevollmaechtigter: ClauseConfig = {
  id: 'bevollmaechtigter',
  title_de: 'Bevollmächtigter',
  title_es: 'Apoderado',
  defaultText: 'APODERADO: Se designa como apoderado a la persona indicada, quien podrá actuar en nombre y representación del poderdante en los actos especificados.',
}

const cl_umfang_vollmacht: ClauseConfig = {
  id: 'umfang_vollmacht',
  title_de: 'Umfang der Vollmacht',
  title_es: 'Alcance del poder',
  defaultText: 'ALCANCE: El apoderado queda facultado para vender, comprar, arrendar y realizar cuantos actos y gestiones sean necesarios respecto al inmueble en {property_address}.',
}

const cl_gueltigkeit_vollmacht: ClauseConfig = {
  id: 'gueltigkeit_vollmacht',
  title_de: 'Gültigkeit der Vollmacht',
  title_es: 'Vigencia del poder',
  defaultText: 'VIGENCIA: El presente poder tendrá una vigencia de doce (12) meses desde la fecha de otorgamiento ante notario, salvo revocación expresa anterior.',
}

const cl_widerruf_vollmacht: ClauseConfig = {
  id: 'widerruf_vollmacht',
  title_de: 'Widerruf der Vollmacht',
  title_es: 'Revocación del poder',
  defaultText: 'REVOCACIÓN: El poderdante podrá revocar el presente poder en cualquier momento mediante escritura notarial, debiendo notificarlo fehacientemente al apoderado.',
}

// ── Datenschutzerklärung / RGPD ──

const cl_verantwortlicher: ClauseConfig = {
  id: 'verantwortlicher',
  title_de: 'Verantwortlicher',
  title_es: 'Responsable del tratamiento',
  defaultText: 'RESPONSABLE: El responsable del tratamiento de datos personales es {agency_name}, con domicilio en la dirección indicada en el encabezamiento.',
}

const cl_zwecke_verarbeitung: ClauseConfig = {
  id: 'zwecke_verarbeitung',
  title_de: 'Zwecke der Verarbeitung',
  title_es: 'Finalidades del tratamiento',
  defaultText: 'FINALIDADES: Los datos se tratan para gestionar la relación contractual de intermediación inmobiliaria, incluyendo búsqueda de compradores/inquilinos, marketing y cumplimiento legal.',
}

const cl_rechtsgrundlagen: ClauseConfig = {
  id: 'rechtsgrundlagen',
  title_de: 'Rechtsgrundlagen',
  title_es: 'Bases jurídicas',
  defaultText: 'BASE JURÍDICA: El tratamiento se basa en la ejecución del contrato de intermediación y, en su caso, en el consentimiento expreso del interesado conforme al art. 6 RGPD.',
}

const cl_empfaenger: ClauseConfig = {
  id: 'empfaenger',
  title_de: 'Empfänger',
  title_es: 'Destinatarios',
  defaultText: 'DESTINATARIOS: Los datos podrán comunicarse a portales inmobiliarios, notarios y registradores, entidades financieras y administraciones públicas cuando sea legalmente exigible.',
}

const cl_speicherdauer: ClauseConfig = {
  id: 'speicherdauer',
  title_de: 'Speicherdauer',
  title_es: 'Plazo de conservación',
  defaultText: 'CONSERVACIÓN: Los datos se conservarán durante la vigencia del contrato y, una vez finalizado, durante los plazos de prescripción legal aplicables (mínimo 5 años).',
}

const cl_betroffenenrechte: ClauseConfig = {
  id: 'betroffenenrechte',
  title_de: 'Betroffenenrechte',
  title_es: 'Derechos del interesado',
  defaultText: 'DERECHOS: El interesado puede ejercer sus derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición dirigiéndose a {agency_name}.',
}

const cl_beschwerderecht: ClauseConfig = {
  id: 'beschwerderecht',
  title_de: 'Beschwerderecht',
  title_es: 'Derecho de reclamación',
  defaultText: 'RECLAMACIÓN: El interesado tiene derecho a presentar reclamación ante la Agencia Española de Protección de Datos (www.aepd.es) si considera vulnerados sus derechos.',
}

const cl_datenkategorien: ClauseConfig = {
  id: 'datenkategorien',
  title_de: 'Kategorien personenbezogener Daten',
  title_es: 'Categorías de datos personales',
  defaultText: 'CATEGORÍAS DE DATOS: Se recogen las siguientes categorías de datos personales: nombre y apellidos, documento de identidad, dirección postal, correo electrónico, número de teléfono, datos bancarios (en su caso) e información relativa al inmueble objeto de la intermediación.',
}

const cl_widerrufsrecht_einwilligung: ClauseConfig = {
  id: 'widerrufsrecht_einwilligung',
  title_de: 'Widerrufsrecht der Einwilligung',
  title_es: 'Derecho de revocación del consentimiento',
  defaultText: 'REVOCACIÓN DEL CONSENTIMIENTO: Cuando el tratamiento se base en el consentimiento, el interesado tiene derecho a retirarlo en cualquier momento sin que ello afecte a la licitud del tratamiento previo a su retirada.',
}

const cl_cookies_tracking: ClauseConfig = {
  id: 'cookies_tracking',
  title_de: 'Cookies und Tracking',
  title_es: 'Cookies y seguimiento',
  defaultText: 'COOKIES: El sitio web de {agency_name} utiliza cookies propias y de terceros con fines técnicos, analíticos y publicitarios. El usuario puede configurar o rechazar las cookies a través de los ajustes de su navegador. Para más información, consulte nuestra política de cookies.',
}

const cl_datensicherheit: ClauseConfig = {
  id: 'datensicherheit',
  title_de: 'Datensicherheit',
  title_es: 'Seguridad de los datos',
  defaultText: 'SEGURIDAD: {agency_name} ha adoptado las medidas técnicas y organizativas necesarias para garantizar la seguridad de los datos personales y evitar su alteración, pérdida, tratamiento o acceso no autorizado, conforme al estado de la tecnología y la naturaleza de los datos.',
}

// ── Widerrufsbelehrung ──

const cl_widerrufsrecht_14: ClauseConfig = {
  id: 'widerrufsrecht_14',
  title_de: 'Widerrufsrecht',
  title_es: 'Derecho de desistimiento',
  defaultText: 'DERECHO DE DESISTIMIENTO: Usted tiene derecho a desistir del presente contrato en un plazo de catorce (14) días naturales sin necesidad de indicar motivo alguno. El plazo de desistimiento expirará a los catorce días naturales del día de la celebración del contrato. / Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.',
}

const cl_widerrufsfrist: ClauseConfig = {
  id: 'widerrufsfrist',
  title_de: 'Widerrufsfrist',
  title_es: 'Plazo de desistimiento',
  defaultText: 'PLAZO DE DESISTIMIENTO: El plazo de desistimiento expirará a los catorce (14) días naturales del día de la celebración del contrato. Para cumplir el plazo de desistimiento, basta con que la comunicación relativa al ejercicio de este derecho sea enviada antes de que venza el plazo correspondiente. / Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses. Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.',
}

const cl_ausuebung_widerrufsrecht: ClauseConfig = {
  id: 'ausuebung_widerrufsrecht',
  title_de: 'Ausübung des Widerrufsrechts',
  title_es: 'Ejercicio del derecho de desistimiento',
  defaultText: 'EJERCICIO DEL DERECHO: Para ejercer el derecho de desistimiento, deberá notificarnos su decisión de desistir del contrato mediante una declaración inequívoca (por ejemplo, una carta enviada por correo postal o un correo electrónico) dirigida a {agency_name} en la dirección indicada. / Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ({agency_name}) mittels einer eindeutigen Erklärung (z.B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.',
}

const cl_widerrufsfolgen: ClauseConfig = {
  id: 'widerrufsfolgen',
  title_de: 'Folgen des Widerrufs',
  title_es: 'Consecuencias del desistimiento',
  defaultText: 'CONSECUENCIAS DEL DESISTIMIENTO: En caso de desistimiento por su parte, le devolveremos todos los pagos que hayamos recibido de usted sin demora indebida y, en todo caso, a más tardar en un plazo de catorce (14) días naturales a partir de la fecha en que se nos informe de su decisión de desistir del contrato. Procederemos a efectuar dicho reembolso utilizando el mismo medio de pago empleado por usted para la transacción inicial. / Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist.',
}

const cl_besondere_hinweise: ClauseConfig = {
  id: 'besondere_hinweise',
  title_de: 'Besondere Hinweise',
  title_es: 'Indicaciones especiales',
  defaultText: 'INDICACIONES ESPECIALES: Si usted ha solicitado expresamente que la prestación del servicio comience durante el plazo de desistimiento, deberá abonarnos un importe proporcional a la parte del servicio ya prestada hasta el momento en que nos comunique su desistimiento. El derecho de desistimiento se extinguirá cuando el servicio haya sido completamente ejecutado, siempre que la ejecución haya comenzado con su consentimiento expreso previo y con el reconocimiento de que perderá su derecho de desistimiento una vez el contrato haya sido completamente ejecutado. / Haben Sie verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zum Widerruf bereits erbrachten Dienstleistungen entspricht. Das Widerrufsrecht erlischt bei vollständiger Vertragserfüllung, wenn die Ausführung mit ausdrücklicher Zustimmung des Verbrauchers begonnen hat.',
}

const cl_ausschluss_widerruf: ClauseConfig = {
  id: 'ausschluss_widerruf',
  title_de: 'Ausnahmen vom Widerrufsrecht',
  title_es: 'Excepciones al derecho de desistimiento',
  defaultText: 'EXCEPCIONES: El derecho de desistimiento no será aplicable en los siguientes casos: (a) contratos de prestación de servicios completamente ejecutados con consentimiento expreso del consumidor; (b) suministro de bienes confeccionados conforme a las especificaciones del consumidor o claramente personalizados; (c) suministro de bienes precintados que no sean aptos para ser devueltos por razones de protección de la salud o de higiene y que hayan sido desprecintados tras la entrega; (d) demás supuestos previstos en el artículo 103 del TRLGDCU. / Das Widerrufsrecht besteht nicht bei: (a) Dienstleistungen, die vollständig erbracht wurden, wenn die Ausführung mit ausdrücklicher Zustimmung begonnen hat; (b) Waren, die nach Kundenspezifikation angefertigt wurden; (c) versiegelten Waren, die aus Gründen des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet sind und nach der Lieferung entsiegelt wurden; (d) weiteren gesetzlich geregelten Ausnahmen.',
}

const cl_muster_widerrufsformular: ClauseConfig = {
  id: 'muster_widerrufsformular',
  title_de: 'Muster-Widerrufsformular',
  title_es: 'Formulario modelo de desistimiento',
  defaultText: 'FORMULARIO MODELO DE DESISTIMIENTO (conforme al Anexo B del RD Legislativo 1/2007): A la atención de {agency_name}, por la presente le comunico/comunicamos (*) que desisto/desistimos (*) del contrato de prestación del siguiente servicio: ____________, pedido el / recibido el (*): ____________, nombre del consumidor: ____________, domicilio del consumidor: ____________, firma del consumidor (solo en caso de comunicación en papel): ____________, fecha: ____________. (*) Táchese lo que no proceda. / Muster-Widerrufsformular gemäß Anlage 2 zu Art. 246a § 1 Abs. 2 Satz 1 Nr. 1 EGBGB: An {agency_name}, hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung: ____________, bestellt am / erhalten am (*): ____________, Name des/der Verbraucher(s): ____________, Anschrift des/der Verbraucher(s): ____________, Unterschrift (nur bei Mitteilung auf Papier): ____________, Datum: ____________. (*) Unzutreffendes streichen.',
}

const cl_kontaktdaten_widerruf: ClauseConfig = {
  id: 'kontaktdaten_widerruf',
  title_de: 'Kontaktdaten für den Widerruf',
  title_es: 'Datos de contacto para el desistimiento',
  defaultText: 'DATOS DE CONTACTO PARA EL DESISTIMIENTO: Para ejercer su derecho de desistimiento, diríjase a: {agency_name}, dirección postal: {agency_address}, correo electrónico: {agency_email}. / Kontaktdaten für den Widerruf: Um Ihr Widerrufsrecht auszuüben, richten Sie Ihre Erklärung an: {agency_name}, Postanschrift: {agency_address}, E-Mail: {agency_email}.',
}

// ── Provisionsvereinbarung ──

const cl_provisionshoehe: ClauseConfig = {
  id: 'provisionshoehe',
  title_de: 'Provisionshöhe',
  title_es: 'Importe de los honorarios',
  defaultText: 'HONORARIOS: Los honorarios de {agency_name} por los servicios de intermediación inmobiliaria ascienden al {commission_pct}% del precio de venta/alquiler acordado, más el impuesto indirecto aplicable (IVA/IGIC).',
}

const cl_faelligkeit: ClauseConfig = {
  id: 'faelligkeit',
  title_de: 'Fälligkeit',
  title_es: 'Vencimiento',
  defaultText: 'VENCIMIENTO: Los honorarios se devengan en el momento de la formalización de la operación intermediada (firma de escritura pública, contrato de arrendamiento o documento equivalente) y serán pagaderos en el plazo máximo de siete (7) días naturales desde dicha fecha.',
}

const cl_zahlungsmodalitaeten: ClauseConfig = {
  id: 'zahlungsmodalitaeten',
  title_de: 'Zahlungsmodalitäten',
  title_es: 'Modalidades de pago',
  defaultText: 'FORMA DE PAGO: El pago se realizará mediante transferencia bancaria a la cuenta indicada por {agency_name}. Se emitirá la correspondiente factura con desglose de IVA/IGIC.',
}

const cl_provisionsanspruch: ClauseConfig = {
  id: 'provisionsanspruch',
  title_de: 'Provisionsanspruch',
  title_es: 'Derecho a honorarios',
  defaultText: 'DERECHO A HONORARIOS: El derecho a honorarios surge cuando {agency_name} haya probado la actividad de intermediación que condujo a la operación, ya sea mediante presentación del inmueble, facilitación de visitas o negociación entre las partes. El derecho subsiste aunque la operación se formalice después de la finalización del contrato, siempre que el contacto se hubiera establecido durante su vigencia.',
}

const cl_doppeltaetigkeit: ClauseConfig = {
  id: 'doppeltaetigkeit',
  title_de: 'Doppeltätigkeit',
  title_es: 'Actividad doble',
  defaultText: 'ACTIVIDAD DOBLE: El mandante consiente expresamente que {agency_name} pueda actuar simultáneamente en representación de ambas partes de la operación, siempre que se lo comunique previamente y no exista conflicto de intereses.',
}

const cl_aufwendungsersatz: ClauseConfig = {
  id: 'aufwendungsersatz',
  title_de: 'Aufwendungsersatz',
  title_es: 'Reembolso de gastos',
  defaultText: 'GASTOS: Los gastos derivados de la actividad de intermediación (publicidad, valoración, desplazamientos) corren a cargo de {agency_name}, salvo pacto expreso en contrario para servicios adicionales solicitados por el mandante.',
}

// ── Exposé-Freigabe ──

const cl_freigabe_veroeffentlichung: ClauseConfig = {
  id: 'freigabe_veroeffentlichung',
  title_de: 'Freigabe zur Veröffentlichung',
  title_es: 'Autorización de publicación',
  defaultText: 'AUTORIZACIÓN: El propietario autoriza a {agency_name} a publicar el exposé del inmueble en {property_address} con fotografías, planos y descripción detallada.',
}

const cl_zulaessige_plattformen: ClauseConfig = {
  id: 'zulaessige_plattformen',
  title_de: 'Zulässige Plattformen',
  title_es: 'Plataformas autorizadas',
  defaultText: 'PLATAFORMAS: La publicación se realizará en los principales portales inmobiliarios (Idealista, Fotocasa, etc.), redes sociales y la web de {agency_name}.',
}

const cl_urheberrecht: ClauseConfig = {
  id: 'urheberrecht',
  title_de: 'Urheberrecht',
  title_es: 'Derechos de autor',
  defaultText: 'DERECHOS DE AUTOR: Las fotografías, vídeos y textos del exposé son propiedad de {agency_name} y no podrán ser utilizados por terceros sin autorización expresa.',
}

const cl_haftungsausschluss_angaben: ClauseConfig = {
  id: 'haftungsausschluss_angaben',
  title_de: 'Haftungsausschluss Angaben',
  title_es: 'Exención de responsabilidad',
  defaultText: 'EXENCIÓN: {agency_name} no se responsabiliza de posibles errores en los datos facilitados por el propietario. La información del exposé es orientativa y no contractual.',
}

const cl_widerruf_freigabe: ClauseConfig = {
  id: 'widerruf_freigabe',
  title_de: 'Widerruf der Freigabe',
  title_es: 'Revocación de la autorización',
  defaultText: 'REVOCACIÓN: El propietario puede revocar esta autorización en cualquier momento por escrito. {agency_name} retirará las publicaciones en un plazo máximo de 48 horas.',
}

// ── Besichtigungsprotokoll ──

const cl_objektdaten_besichtigung: ClauseConfig = {
  id: 'objektdaten_besichtigung',
  title_de: 'Objektdaten',
  title_es: 'Datos del inmueble',
  defaultText: 'INMUEBLE: Identificación del inmueble visitado sito en {property_address}, con indicación de referencia catastral, superficie y características principales.',
}

const cl_datum_uhrzeit: ClauseConfig = {
  id: 'datum_uhrzeit',
  title_de: 'Datum und Uhrzeit',
  title_es: 'Fecha y hora',
  defaultText: 'FECHA Y HORA: La visita se ha realizado en la fecha y hora indicadas en el encabezamiento del presente protocolo.',
}

const cl_anwesende_personen: ClauseConfig = {
  id: 'anwesende_personen',
  title_de: 'Anwesende Personen',
  title_es: 'Personas presentes',
  defaultText: 'ASISTENTES: Han estado presentes en la visita las personas identificadas en este documento, quienes firman al pie en conformidad.',
}

const cl_zustand_objekt: ClauseConfig = {
  id: 'zustand_objekt',
  title_de: 'Zustand des Objekts',
  title_es: 'Estado del inmueble',
  defaultText: 'ESTADO: Se ha verificado el estado general del inmueble, instalaciones y elementos comunes. Las observaciones y deficiencias detectadas se recogen a continuación.',
}

const cl_vereinbarungen_naechste_schritte: ClauseConfig = {
  id: 'vereinbarungen_naechste_schritte',
  title_de: 'Vereinbarungen / Nächste Schritte',
  title_es: 'Acuerdos / Próximos pasos',
  defaultText: 'ACUERDOS: Las partes acuerdan los próximos pasos indicados a continuación, incluyendo plazos y responsabilidades de cada parte.',
}

const cl_unterschriften_besichtigung: ClauseConfig = {
  id: 'unterschriften_besichtigung',
  title_de: 'Unterschriften',
  title_es: 'Firmas',
  defaultText: 'FIRMAS: Los asistentes firman el presente protocolo en señal de conformidad con su contenido.',
}

// ── Reservierungsvertrag ──

const cl_reservierungsgegenstand: ClauseConfig = {
  id: 'reservierungsgegenstand',
  title_de: 'Reservierungsgegenstand',
  title_es: 'Objeto de la reserva',
  defaultText: 'OBJETO: Se reserva el inmueble sito en {property_address} a favor del interesado, quien manifiesta su intención firme de adquirirlo en las condiciones pactadas.',
}

const cl_reservierungspreis: ClauseConfig = {
  id: 'reservierungspreis',
  title_de: 'Reservierungspreis',
  title_es: 'Precio de reserva',
  defaultText: 'CANTIDAD: El reservante entrega la cantidad acordada en concepto de reserva, que se descontará del precio final de compraventa.',
}

const cl_gueltigkeit_reservierung: ClauseConfig = {
  id: 'gueltigkeit_reservierung',
  title_de: 'Gültigkeit der Reservierung',
  title_es: 'Vigencia de la reserva',
  defaultText: 'VIGENCIA: La reserva tendrá una validez de quince (15) días naturales desde la firma. Transcurrido dicho plazo sin formalizar contrato de arras, quedará sin efecto.',
}

const cl_rueckzahlungsbedingungen: ClauseConfig = {
  id: 'rueckzahlungsbedingungen',
  title_de: 'Rückzahlungsbedingungen',
  title_es: 'Condiciones de devolución',
  defaultText: 'DEVOLUCIÓN: Si la compraventa no se formaliza por causa imputable al vendedor, se devolverá íntegramente la cantidad entregada. En caso de desistimiento del comprador, el vendedor podrá retenerla.',
}

const cl_verbindlichkeit: ClauseConfig = {
  id: 'verbindlichkeit',
  title_de: 'Verbindlichkeit',
  title_es: 'Carácter vinculante',
  defaultText: 'VINCULACIÓN: El presente acuerdo de reserva es vinculante para ambas partes durante su período de vigencia y genera obligaciones recíprocas.',
}

// ── Übergabeprotokoll ──

const cl_objektdaten_uebergabe: ClauseConfig = {
  id: 'objektdaten_uebergabe',
  title_de: 'Objektdaten',
  title_es: 'Datos del inmueble',
  defaultText: 'INMUEBLE: Se procede a la entrega del inmueble sito en {property_address}, con las características descritas en el contrato de compraventa o arrendamiento.',
}

const cl_zaehlersstaende: ClauseConfig = {
  id: 'zaehlersstaende',
  title_de: 'Zählerstände',
  title_es: 'Lecturas de contadores',
  defaultText: 'CONTADORES: Se registran las lecturas de los contadores de agua, electricidad y gas a la fecha de entrega, sirviendo de base para la liquidación de suministros.',
}

const cl_schluesseluebergabe: ClauseConfig = {
  id: 'schluesseluebergabe',
  title_de: 'Schlüsselübergabe',
  title_es: 'Entrega de llaves',
  defaultText: 'LLAVES: Se hace entrega del siguiente juego de llaves: portal, puerta principal, buzón, garaje y trastero (según proceda). El receptor confirma la recepción.',
}

const cl_zustand_raeume: ClauseConfig = {
  id: 'zustand_raeume',
  title_de: 'Zustand der Räume',
  title_es: 'Estado de las estancias',
  defaultText: 'ESTADO: Se describen a continuación el estado de cada estancia y las posibles incidencias detectadas durante la inspección de entrega.',
}

const cl_inventar: ClauseConfig = {
  id: 'inventar',
  title_de: 'Inventar',
  title_es: 'Inventario',
  defaultText: 'INVENTARIO: Se adjunta listado del mobiliario y equipamiento incluido en la entrega. Ambas partes confirman que los elementos coinciden con lo pactado.',
}

const cl_unterschriften_uebergabe: ClauseConfig = {
  id: 'unterschriften_uebergabe',
  title_de: 'Unterschriften',
  title_es: 'Firmas',
  defaultText: 'FIRMAS: Las partes firman el presente protocolo de entrega en señal de conformidad, quedando cada una con un ejemplar.',
}

// ── AGB ──

const cl_geltungsbereich: ClauseConfig = {
  id: 'geltungsbereich',
  title_de: 'Geltungsbereich',
  title_es: 'Ámbito de aplicación',
  defaultText: 'ÁMBITO: Las presentes condiciones generales regulan la relación entre {agency_name} y sus clientes respecto a todos los servicios de intermediación inmobiliaria ofrecidos.',
}

const cl_leistungen_agentur: ClauseConfig = {
  id: 'leistungen_agentur',
  title_de: 'Leistungen der Agentur',
  title_es: 'Servicios de la agencia',
  defaultText: 'SERVICIOS: {agency_name} ofrece servicios de valoración, marketing, intermediación, asesoramiento y acompañamiento durante todo el proceso de compraventa o arrendamiento.',
}

const cl_verguetung: ClauseConfig = {
  id: 'verguetung',
  title_de: 'Vergütung',
  title_es: 'Remuneración',
  defaultText: 'REMUNERACIÓN: Los honorarios se devengan al perfeccionarse la operación intermediada y se calcularán según la tarifa vigente, más IVA (IGIC en Canarias).',
}

const cl_haftungsbeschraenkung: ClauseConfig = {
  id: 'haftungsbeschraenkung',
  title_de: 'Haftungsbeschränkung',
  title_es: 'Limitación de responsabilidad',
  defaultText: 'RESPONSABILIDAD: {agency_name} responde únicamente por dolo o negligencia grave. Queda excluida la responsabilidad por información errónea facilitada por terceros o por el propio cliente.',
}

const cl_aenderungsvorbehalt: ClauseConfig = {
  id: 'aenderungsvorbehalt',
  title_de: 'Änderungsvorbehalt',
  title_es: 'Reserva de modificación',
  defaultText: 'MODIFICACIÓN: {agency_name} se reserva el derecho de modificar las presentes condiciones generales, notificando los cambios con una antelación mínima de 30 días.',
}

// ── Gewerbemiet-Suchauftrag ──

const cl_suchprofil_gewerbe: ClauseConfig = {
  id: 'suchprofil_gewerbe',
  title_de: 'Suchprofil Gewerbeobjekt',
  title_es: 'Perfil de búsqueda comercial',
  defaultText: 'PERFIL DE BÚSQUEDA: {agency_name} se compromete a buscar un inmueble comercial conforme a los criterios definidos por el mandante: ubicación, superficie mínima/máxima, tipo de actividad, presupuesto mensual máximo y demás requisitos especificados en el anexo.',
}

const cl_suchgebiet: ClauseConfig = {
  id: 'suchgebiet',
  title_de: 'Suchgebiet',
  title_es: 'Zona de búsqueda',
  defaultText: 'ZONA DE BÚSQUEDA: La búsqueda se realizará en las zonas geográficas acordadas entre las partes, pudiendo ampliarse previa comunicación y consentimiento del mandante.',
}

const cl_gewerbe_mietkonditionen: ClauseConfig = {
  id: 'gewerbe_mietkonditionen',
  title_de: 'Mietkonditionen',
  title_es: 'Condiciones de alquiler',
  defaultText: 'CONDICIONES: El presupuesto máximo de renta mensual, los gastos de comunidad admisibles, la duración mínima del contrato de arrendamiento y las condiciones especiales (período de carencia, obras de adecuación) se definen en el presente documento.',
}

const cl_objektvorschlaege: ClauseConfig = {
  id: 'objektvorschlaege',
  title_de: 'Objektvorschläge',
  title_es: 'Propuestas de inmuebles',
  defaultText: 'PROPUESTAS: {agency_name} presentará al mandante los inmuebles comerciales que se ajusten al perfil de búsqueda. El mandante se compromete a evaluar las propuestas y comunicar su decisión en un plazo razonable.',
}

const cl_besichtigungen_gewerbe: ClauseConfig = {
  id: 'besichtigungen_gewerbe',
  title_de: 'Besichtigungen',
  title_es: 'Visitas',
  defaultText: 'VISITAS: {agency_name} coordinará las visitas a los inmuebles propuestos. El mandante se compromete a asistir a las visitas acordadas o a comunicar su imposibilidad con antelación suficiente.',
}

const cl_vertraulichkeit_gewerbe: ClauseConfig = {
  id: 'vertraulichkeit_gewerbe',
  title_de: 'Vertraulichkeit',
  title_es: 'Confidencialidad',
  defaultText: 'CONFIDENCIALIDAD: Las partes se obligan a mantener en estricta confidencialidad toda la información intercambiada en el marco del presente encargo, incluyendo datos de los inmuebles, condiciones económicas y datos personales de propietarios.',
}

// ── Investorensuchauftrag ──

const cl_anlageprofil: ClauseConfig = {
  id: 'anlageprofil',
  title_de: 'Anlageprofil',
  title_es: 'Perfil de inversión',
  defaultText: 'PERFIL DE INVERSIÓN: {agency_name} se compromete a buscar oportunidades de inversión inmobiliaria conforme a los criterios definidos por el inversor: tipo de activo (residencial, comercial, turístico), ubicación preferente, rentabilidad mínima esperada, presupuesto de inversión y horizonte temporal.',
}

const cl_investitionsvolumen: ClauseConfig = {
  id: 'investitionsvolumen',
  title_de: 'Investitionsvolumen',
  title_es: 'Volumen de inversión',
  defaultText: 'VOLUMEN DE INVERSIÓN: El presupuesto de inversión del mandante se sitúa entre el importe mínimo y máximo acordados. {agency_name} presentará exclusivamente oportunidades que se ajusten a este rango, salvo autorización expresa del inversor para importes superiores.',
}

const cl_renditeerwartung: ClauseConfig = {
  id: 'renditeerwartung',
  title_de: 'Renditeerwartung',
  title_es: 'Expectativa de rentabilidad',
  defaultText: 'RENTABILIDAD: El inversor establece una rentabilidad bruta mínima esperada según lo acordado. {agency_name} proporcionará un análisis de rentabilidad detallado para cada propuesta, incluyendo gastos de comunidad, impuestos, seguros y previsión de mantenimiento.',
}

const cl_marktanalyse: ClauseConfig = {
  id: 'marktanalyse',
  title_de: 'Marktanalyse',
  title_es: 'Análisis de mercado',
  defaultText: 'ANÁLISIS DE MERCADO: {agency_name} elaborará informes periódicos sobre la situación del mercado inmobiliario en las zonas de interés, incluyendo evolución de precios, demanda de alquiler, proyectos urbanísticos previstos y cualquier factor relevante para la decisión de inversión.',
}

const cl_due_diligence: ClauseConfig = {
  id: 'due_diligence',
  title_de: 'Due Diligence',
  title_es: 'Due Diligence',
  defaultText: 'DUE DILIGENCE: Para cada oportunidad presentada, {agency_name} facilitará la documentación necesaria para la verificación del activo: nota simple registral, certificado energético, situación de cargas, estado de ocupación, licencias y permisos, así como cualquier información relevante para la toma de decisión.',
}

const cl_exklusivitaet_investor: ClauseConfig = {
  id: 'exklusivitaet_investor',
  title_de: 'Exklusivität',
  title_es: 'Exclusividad',
  defaultText: 'EXCLUSIVIDAD: Durante la vigencia del presente encargo, el inversor se compromete a canalizar todas sus búsquedas de inversión inmobiliaria en la zona acordada exclusivamente a través de {agency_name}. Las oportunidades presentadas son confidenciales y no podrán ser compartidas con terceros.',
}

// ── Käufer-Suchauftrag ──

const cl_suchprofil_kaeufer: ClauseConfig = {
  id: 'suchprofil_kaeufer',
  title_de: 'Suchprofil Kaufobjekt',
  title_es: 'Perfil de búsqueda de compra',
  defaultText: 'PERFIL DE BÚSQUEDA: {agency_name} se compromete a buscar un inmueble para su adquisición conforme a los criterios del comprador: ubicación, tipología (piso, casa, finca), superficie mínima, número de habitaciones, estado (obra nueva, segunda mano, para reformar) y demás requisitos especificados.',
}

const cl_suchgebiet_kaeufer: ClauseConfig = {
  id: 'suchgebiet_kaeufer',
  title_de: 'Suchgebiet',
  title_es: 'Zona de búsqueda',
  defaultText: 'ZONA DE BÚSQUEDA: La búsqueda se realizará en las zonas geográficas acordadas entre las partes. {agency_name} podrá proponer inmuebles en zonas limítrofes si se ajustan al perfil del comprador, previa consulta.',
}

const cl_kaufbudget: ClauseConfig = {
  id: 'kaufbudget',
  title_de: 'Kaufbudget',
  title_es: 'Presupuesto de compra',
  defaultText: 'PRESUPUESTO: El presupuesto máximo de adquisición se fija en el importe acordado entre las partes. {agency_name} presentará exclusivamente inmuebles dentro de este rango. El comprador deberá informar sobre la modalidad de financiación prevista (fondos propios, hipoteca, etc.).',
}

const cl_objektvorschlaege_kaeufer: ClauseConfig = {
  id: 'objektvorschlaege_kaeufer',
  title_de: 'Objektvorschläge',
  title_es: 'Propuestas de inmuebles',
  defaultText: 'PROPUESTAS: {agency_name} presentará al comprador los inmuebles disponibles que se ajusten a su perfil de búsqueda, facilitando información detallada sobre cada uno (exposé, situación registral, estado de conservación). El comprador se compromete a evaluar las propuestas y comunicar su decisión.',
}

const cl_besichtigungen_kaeufer: ClauseConfig = {
  id: 'besichtigungen_kaeufer',
  title_de: 'Besichtigungen',
  title_es: 'Visitas',
  defaultText: 'VISITAS: {agency_name} coordinará las visitas a los inmuebles propuestos, acompañando al comprador durante las mismas. El comprador se compromete a asistir a las visitas acordadas o comunicar su imposibilidad con antelación suficiente.',
}

const cl_finanzierungsberatung: ClauseConfig = {
  id: 'finanzierungsberatung',
  title_de: 'Finanzierungsberatung',
  title_es: 'Asesoramiento financiero',
  defaultText: 'FINANCIACIÓN: {agency_name} podrá facilitar, a solicitud del comprador, el contacto con entidades financieras colaboradoras para la obtención de financiación hipotecaria, sin que ello genere obligación alguna de contratación por parte del comprador.',
}

// ── Vermieter-Maklervertrag ──

const cl_vermietungsauftrag: ClauseConfig = {
  id: 'vermietungsauftrag',
  title_de: 'Vermietungsauftrag',
  title_es: 'Encargo de arrendamiento',
  defaultText: 'ENCARGO: El propietario encarga a {agency_name} la búsqueda de un arrendatario solvente para el inmueble sito en {property_address}, incluyendo la publicación del anuncio, organización de visitas, verificación de solvencia de candidatos y negociación de las condiciones de arrendamiento.',
}

const cl_mietpreisvorstellung: ClauseConfig = {
  id: 'mietpreisvorstellung',
  title_de: 'Mietpreisvorstellung',
  title_es: 'Precio de alquiler deseado',
  defaultText: 'RENTA OBJETIVO: La renta mensual orientativa fijada por el propietario es la acordada entre las partes. {agency_name} asesorará sobre el precio de mercado y podrá sugerir ajustes para optimizar la rapidez y calidad de la intermediación.',
}

const cl_mieterauswahl: ClauseConfig = {
  id: 'mieterauswahl',
  title_de: 'Mieterauswahl und Bonitätsprüfung',
  title_es: 'Selección de inquilino y verificación de solvencia',
  defaultText: 'SELECCIÓN: {agency_name} realizará una preselección de candidatos verificando su solvencia económica (justificantes de ingresos, referencias) y presentará al propietario únicamente aquellos que cumplan los requisitos mínimos acordados. La decisión final de aceptación corresponde al propietario.',
}

const cl_vermarktung: ClauseConfig = {
  id: 'vermarktung',
  title_de: 'Vermarktung',
  title_es: 'Comercialización',
  defaultText: 'COMERCIALIZACIÓN: {agency_name} publicará el inmueble en los principales portales inmobiliarios, redes sociales y su propia web. Se realizarán fotografías profesionales y, si procede, visitas virtuales. El propietario autoriza expresamente dicha publicación.',
}

const cl_pflichten_vermieter: ClauseConfig = {
  id: 'pflichten_vermieter',
  title_de: 'Pflichten des Vermieters',
  title_es: 'Obligaciones del arrendador',
  defaultText: 'OBLIGACIONES DEL ARRENDADOR: El propietario se compromete a: facilitar el acceso al inmueble para visitas previa cita, aportar la documentación necesaria (cédula de habitabilidad, certificado energético, nota simple), mantener el inmueble en condiciones adecuadas para su arrendamiento y comunicar cualquier cambio relevante.',
}

const cl_mietvertragsabschluss: ClauseConfig = {
  id: 'mietvertragsabschluss',
  title_de: 'Mietvertragsabschluss',
  title_es: 'Formalización del contrato de arrendamiento',
  defaultText: 'FORMALIZACIÓN: Una vez aceptado el candidato, {agency_name} preparará el borrador del contrato de arrendamiento conforme a la LAU. Los gastos de formalización se distribuirán según lo pactado. {agency_name} asistirá en la firma y entrega de llaves.',
}

// ── Verkäufer-Maklervertrag ──

const cl_verkaufsauftrag: ClauseConfig = {
  id: 'verkaufsauftrag',
  title_de: 'Verkaufsauftrag',
  title_es: 'Encargo de venta',
  defaultText: 'ENCARGO: El propietario encarga a {agency_name} la intermediación para la venta del inmueble sito en {property_address}. {agency_name} realizará todas las gestiones necesarias para encontrar un comprador solvente al precio acordado.',
}

const cl_immobilienbewertung: ClauseConfig = {
  id: 'immobilienbewertung',
  title_de: 'Immobilienbewertung',
  title_es: 'Valoración del inmueble',
  defaultText: 'VALORACIÓN: {agency_name} realizará una valoración profesional del inmueble basada en el análisis comparativo de mercado, estado de conservación, ubicación y características específicas. El precio de oferta se fijará de común acuerdo entre las partes.',
}

const cl_vermarktungsstrategie: ClauseConfig = {
  id: 'vermarktungsstrategie',
  title_de: 'Vermarktungsstrategie',
  title_es: 'Estrategia de comercialización',
  defaultText: 'COMERCIALIZACIÓN: {agency_name} elaborará un plan de marketing que incluye: reportaje fotográfico profesional, publicación en portales inmobiliarios nacionales e internacionales, difusión en redes sociales, elaboración de exposé detallado y, si procede, visitas virtuales y home staging.',
}

const cl_pflichten_verkaeufer: ClauseConfig = {
  id: 'pflichten_verkaeufer',
  title_de: 'Pflichten des Verkäufers',
  title_es: 'Obligaciones del vendedor',
  defaultText: 'OBLIGACIONES DEL VENDEDOR: El propietario se compromete a: facilitar el acceso al inmueble para visitas previa cita, aportar toda la documentación necesaria (nota simple, certificado energético, cédula de habitabilidad, último recibo de IBI, escritura de propiedad), comunicar cualquier carga o gravamen existente y no realizar ventas directas durante la vigencia del mandato.',
}

const cl_preisanpassung: ClauseConfig = {
  id: 'preisanpassung',
  title_de: 'Preisanpassung',
  title_es: 'Ajuste de precio',
  defaultText: 'AJUSTE DE PRECIO: Si transcurridos los primeros tres meses no se hubieran recibido ofertas razonables, las partes revisarán conjuntamente el precio de oferta. {agency_name} presentará un informe actualizado del mercado como base para la negociación.',
}

const cl_kaufangebote: ClauseConfig = {
  id: 'kaufangebote',
  title_de: 'Kaufangebote',
  title_es: 'Ofertas de compra',
  defaultText: 'OFERTAS: {agency_name} transmitirá al vendedor todas las ofertas de compra recibidas de forma fiel y completa. La decisión de aceptar, rechazar o contraofertar corresponde exclusivamente al propietario. {agency_name} asesorará sobre las condiciones de cada oferta.',
}

// ── Freelancer-Vertrag / Contrato de Colaboración Freelance ──

const cl_vertragsgegenstand_freelancer: ClauseConfig = {
  id: 'vertragsgegenstand_freelancer',
  title_de: 'Vertragsgegenstand',
  title_es: 'Objeto del contrato',
  defaultText: 'OBJETO: El presente contrato regula la relación de colaboración profesional entre el contratante (en adelante, "la Empresa") y el profesional autónomo (en adelante, "el Freelancer"). El Freelancer prestará los servicios profesionales descritos en el anexo de este contrato de forma independiente y sin relación laboral por cuenta ajena.',
}

const cl_leistungsumfang_freelancer: ClauseConfig = {
  id: 'leistungsumfang_freelancer',
  title_de: 'Leistungsumfang und Aufgaben',
  title_es: 'Alcance de los servicios y funciones',
  defaultText: 'SERVICIOS: El Freelancer se compromete a prestar los servicios profesionales detallados en el presente contrato con la diligencia y profesionalidad exigibles. Las tareas, entregables y plazos se definirán de mutuo acuerdo y podrán modificarse mediante addenda firmada por ambas partes.',
}

const cl_verguetung_freelancer: ClauseConfig = {
  id: 'verguetung_freelancer',
  title_de: 'Vergütung',
  title_es: 'Remuneración',
  defaultText: 'REMUNERACIÓN: El Freelancer percibirá la remuneración acordada entre las partes, que se abonará previa presentación de factura con los requisitos legales vigentes. El pago se realizará mediante transferencia bancaria en el plazo máximo de treinta (30) días desde la recepción de la factura. Los impuestos aplicables (IRPF, IVA/IGIC) serán repercutidos conforme a la normativa fiscal vigente.',
}

const cl_vertragslaufzeit_freelancer: ClauseConfig = {
  id: 'vertragslaufzeit_freelancer',
  title_de: 'Vertragslaufzeit',
  title_es: 'Duración del contrato',
  defaultText: 'DURACIÓN: El presente contrato entrará en vigor en la fecha de inicio indicada y tendrá la duración acordada entre las partes. Podrá prorrogarse por períodos iguales mediante acuerdo expreso por escrito. Cualquiera de las partes podrá resolver el contrato con un preaviso mínimo de treinta (30) días naturales.',
}

const cl_kuendigung_freelancer: ClauseConfig = {
  id: 'kuendigung_freelancer',
  title_de: 'Kündigung und Beendigung',
  title_es: 'Resolución y terminación',
  defaultText: 'RESOLUCIÓN: El contrato podrá resolverse por: (a) mutuo acuerdo de las partes; (b) incumplimiento grave de las obligaciones contractuales; (c) preaviso escrito con la antelación pactada; (d) imposibilidad sobrevenida de cumplimiento. En caso de resolución anticipada sin causa justificada, la parte incumplidora indemnizará a la otra por los daños y perjuicios causados.',
}

const cl_arbeitszeit_freelancer: ClauseConfig = {
  id: 'arbeitszeit_freelancer',
  title_de: 'Arbeitszeit und Verfügbarkeit',
  title_es: 'Jornada y disponibilidad',
  defaultText: 'JORNADA: El Freelancer organizará libremente su tiempo de trabajo, sin sujeción a horario fijo, siempre que se cumplan los plazos de entrega acordados. No obstante, se compromete a mantener una disponibilidad razonable para reuniones, consultas y coordinación con el equipo de la Empresa durante el horario comercial habitual.',
}

const cl_vertraulichkeit_freelancer: ClauseConfig = {
  id: 'vertraulichkeit_freelancer',
  title_de: 'Vertraulichkeit',
  title_es: 'Confidencialidad',
  defaultText: 'CONFIDENCIALIDAD: El Freelancer se obliga a mantener en estricta confidencialidad toda la información comercial, técnica, financiera y organizativa de la Empresa a la que tenga acceso durante la vigencia del contrato y durante un período de dos (2) años tras su finalización. Esta obligación incluye datos de clientes, estrategias comerciales, procesos internos y cualquier información no pública.',
}

const cl_geistiges_eigentum: ClauseConfig = {
  id: 'geistiges_eigentum',
  title_de: 'Geistiges Eigentum',
  title_es: 'Propiedad intelectual',
  defaultText: 'PROPIEDAD INTELECTUAL: Todos los trabajos, documentos, diseños, código fuente, materiales y creaciones realizados por el Freelancer en ejecución del presente contrato serán propiedad exclusiva de la Empresa desde su creación. El Freelancer cede expresamente todos los derechos de explotación, reproducción, distribución, comunicación pública y transformación sin limitación territorial ni temporal.',
}

const cl_wettbewerbsverbot: ClauseConfig = {
  id: 'wettbewerbsverbot',
  title_de: 'Wettbewerbsverbot',
  title_es: 'No competencia',
  defaultText: 'NO COMPETENCIA: Durante la vigencia del contrato, el Freelancer se abstendrá de prestar servicios directamente a competidores directos de la Empresa en el mismo sector y zona geográfica, salvo autorización expresa por escrito. Esta restricción no limita la actividad profesional general del Freelancer en otros sectores o para clientes no competidores.',
}

const cl_haftung_freelancer: ClauseConfig = {
  id: 'haftung_freelancer',
  title_de: 'Haftung',
  title_es: 'Responsabilidad',
  defaultText: 'RESPONSABILIDAD: El Freelancer responderá por los daños causados a la Empresa derivados de negligencia grave o dolo en la prestación de sus servicios. El Freelancer deberá contar con un seguro de responsabilidad civil profesional vigente durante toda la duración del contrato. La responsabilidad se limitará al importe total facturado en los últimos doce (12) meses.',
}

const cl_sozialversicherung_freelancer: ClauseConfig = {
  id: 'sozialversicherung_freelancer',
  title_de: 'Sozialversicherung und Steuern',
  title_es: 'Seguridad social e impuestos',
  defaultText: 'OBLIGACIONES FISCALES: El Freelancer actuará como trabajador autónomo, siendo responsable de su alta en el Régimen Especial de Trabajadores Autónomos (RETA), del cumplimiento de sus obligaciones fiscales (declaraciones trimestrales y anuales de IVA e IRPF) y de cualquier otra obligación derivada de su condición de profesional independiente. La Empresa no asumirá responsabilidad alguna por dichas obligaciones.',
}

const cl_salvatorische_klausel: ClauseConfig = {
  id: 'salvatorische_klausel',
  title_de: 'Salvatorische Klausel',
  title_es: 'Cláusula de salvaguarda',
  defaultText: 'SALVAGUARDA: Si alguna de las cláusulas del presente contrato fuese declarada nula o inaplicable, las demás conservarán su plena validez y eficacia. Las partes se comprometen a sustituir la cláusula nula por otra válida que refleje lo más fielmente posible la voluntad original de las partes.',
}

// ── Arbeitsvertrag / Contrato de Trabajo ──

const cl_vertragsparteien_arbeit: ClauseConfig = {
  id: 'vertragsparteien_arbeit',
  title_de: 'Vertragsparteien',
  title_es: 'Partes contratantes',
  defaultText: 'PARTES: El presente contrato de trabajo se celebra entre la empresa (en adelante, "el Empleador") y el trabajador (en adelante, "el Empleado"), cuyos datos personales constan en el encabezamiento. Ambas partes reconocen su capacidad legal para suscribir el presente contrato.',
}

const cl_taetigkeitsbeschreibung: ClauseConfig = {
  id: 'taetigkeitsbeschreibung',
  title_de: 'Tätigkeitsbeschreibung',
  title_es: 'Descripción del puesto',
  defaultText: 'PUESTO: El Empleado es contratado para desempeñar las funciones correspondientes al puesto indicado en los datos del contrato. Las tareas incluyen todas aquellas propias de la categoría profesional asignada, así como las que razonablemente le sean encomendadas por la dirección de la empresa dentro de su ámbito competencial.',
}

const cl_gehalt: ClauseConfig = {
  id: 'gehalt',
  title_de: 'Gehalt und Vergütung',
  title_es: 'Salario y retribución',
  defaultText: 'SALARIO: El Empleado percibirá la retribución bruta anual indicada en los datos del contrato, distribuida en las pagas acordadas (doce pagas ordinarias y, en su caso, dos pagas extraordinarias). El salario se abonará mediante transferencia bancaria dentro de los cinco primeros días del mes siguiente al devengo. Se aplicarán las retenciones fiscales y cotizaciones a la Seguridad Social conforme a la legislación vigente.',
}

const cl_arbeitszeit_arbeit: ClauseConfig = {
  id: 'arbeitszeit_arbeit',
  title_de: 'Arbeitszeit',
  title_es: 'Jornada laboral',
  defaultText: 'JORNADA: La jornada laboral será la indicada en los datos del contrato. La distribución horaria se ajustará al calendario laboral de la empresa y al convenio colectivo aplicable. Las horas extraordinarias se compensarán conforme a la legislación vigente y al convenio colectivo, pudiendo sustituirse por tiempo de descanso equivalente previo acuerdo.',
}

const cl_arbeitsort: ClauseConfig = {
  id: 'arbeitsort',
  title_de: 'Arbeitsort',
  title_es: 'Lugar de trabajo',
  defaultText: 'LUGAR DE TRABAJO: El Empleado prestará sus servicios en el centro de trabajo indicado por el Empleador, sin perjuicio de los desplazamientos que pudieran ser necesarios para el desempeño de sus funciones. Podrá acordarse la modalidad de teletrabajo conforme a la normativa vigente.',
}

const cl_probezeit: ClauseConfig = {
  id: 'probezeit',
  title_de: 'Probezeit',
  title_es: 'Período de prueba',
  defaultText: 'PERÍODO DE PRUEBA: Se establece un período de prueba conforme a lo indicado en los datos del contrato, durante el cual cualquiera de las partes podrá resolver la relación laboral sin necesidad de preaviso y sin derecho a indemnización, conforme al artículo 14 del Estatuto de los Trabajadores.',
}

const cl_urlaub: ClauseConfig = {
  id: 'urlaub',
  title_de: 'Urlaub',
  title_es: 'Vacaciones',
  defaultText: 'VACACIONES: El Empleado tendrá derecho a los días laborables de vacaciones anuales retribuidas indicados en los datos del contrato, con un mínimo de treinta días naturales conforme al Estatuto de los Trabajadores. El período de disfrute se fijará de común acuerdo respetando el convenio colectivo aplicable y las necesidades organizativas de la empresa.',
}

const cl_pflichten_arbeitnehmer: ClauseConfig = {
  id: 'pflichten_arbeitnehmer',
  title_de: 'Pflichten des Arbeitnehmers',
  title_es: 'Obligaciones del trabajador',
  defaultText: 'OBLIGACIONES: El Empleado se compromete a: (a) cumplir las órdenes e instrucciones del Empleador dentro del marco legal; (b) actuar con buena fe y diligencia profesional; (c) no concurrir con la actividad de la empresa; (d) contribuir a la mejora de la productividad; (e) observar las medidas de prevención de riesgos laborales establecidas.',
}

const cl_vertraulichkeit_arbeit: ClauseConfig = {
  id: 'vertraulichkeit_arbeit',
  title_de: 'Vertraulichkeit',
  title_es: 'Confidencialidad',
  defaultText: 'CONFIDENCIALIDAD: El Empleado se obliga a mantener en secreto toda información confidencial de la empresa a la que tenga acceso durante la relación laboral, incluyendo datos de clientes, estrategias comerciales, información financiera y procesos internos. Esta obligación subsistirá tras la extinción del contrato durante un período de dos (2) años.',
}

const cl_kuendigung_arbeit: ClauseConfig = {
  id: 'kuendigung_arbeit',
  title_de: 'Kündigung',
  title_es: 'Extinción del contrato',
  defaultText: 'EXTINCIÓN: El contrato podrá extinguirse por las causas previstas en el Estatuto de los Trabajadores. El Empleado que desee causar baja voluntaria deberá comunicarlo con un preaviso mínimo de quince (15) días. En caso de despido, se aplicarán las indemnizaciones y procedimientos establecidos por la legislación laboral vigente y el convenio colectivo aplicable.',
}

const cl_nebentaetigkeit: ClauseConfig = {
  id: 'nebentaetigkeit',
  title_de: 'Nebentätigkeit',
  title_es: 'Actividades complementarias',
  defaultText: 'ACTIVIDADES COMPLEMENTARIAS: El Empleado podrá realizar actividades profesionales fuera de su jornada laboral siempre que no concurran con la actividad de la empresa ni afecten al rendimiento laboral. Deberá comunicar previamente al Empleador cualquier actividad por cuenta propia o ajena que pudiera generar conflicto de intereses.',
}

const cl_arbeitsmittel: ClauseConfig = {
  id: 'arbeitsmittel',
  title_de: 'Arbeitsmittel',
  title_es: 'Medios de trabajo',
  defaultText: 'MEDIOS DE TRABAJO: El Empleador pondrá a disposición del Empleado los medios materiales y tecnológicos necesarios para el desempeño de sus funciones. Dichos medios son propiedad de la empresa y deberán ser devueltos al finalizar la relación laboral. El uso de los medios de trabajo se limitará a fines profesionales salvo autorización expresa.',
}

const cl_convenio_colectivo: ClauseConfig = {
  id: 'convenio_colectivo',
  title_de: 'Anwendbarer Tarifvertrag',
  title_es: 'Convenio colectivo aplicable',
  defaultText: 'CONVENIO: La relación laboral se regirá, en lo no previsto en este contrato, por el convenio colectivo aplicable al sector y territorio correspondiente, así como por el Estatuto de los Trabajadores y demás normativa laboral vigente.',
}

// ── Kooperationsvertrag / Acuerdo de Cooperación entre Agentes ──

const cl_kooperationsgegenstand: ClauseConfig = {
  id: 'kooperationsgegenstand',
  title_de: 'Kooperationsgegenstand',
  title_es: 'Objeto de la cooperación',
  defaultText: 'OBJETO: El presente acuerdo regula la cooperación entre dos agentes inmobiliarios independientes para la intermediación conjunta de un inmueble. El Agente Cedente (que ha captado el encargo) transfiere el mandato de intermediación al Agente Receptor (que operará en la zona del inmueble), quien se compromete a gestionar la venta o el alquiler del mismo.',
}

const cl_cedente: ClauseConfig = {
  id: 'cedente',
  title_de: 'Vermittelnder Agent (Cedente)',
  title_es: 'Agente cedente',
  defaultText: 'AGENTE CEDENTE: El agente cedente declara ser titular del mandato de intermediación otorgado por el propietario del inmueble y estar autorizado para transferir dicho encargo a un tercero. Se compromete a facilitar toda la documentación e información necesaria sobre el inmueble y el propietario.',
}

const cl_receptor: ClauseConfig = {
  id: 'receptor',
  title_de: 'Übernehmender Agent (Receptor)',
  title_es: 'Agente receptor',
  defaultText: 'AGENTE RECEPTOR: El agente receptor se compromete a gestionar la intermediación del inmueble con la misma diligencia y profesionalidad que aplica a sus propios encargos. Actuará en nombre propio o en nombre del agente cedente según se acuerde, respetando las instrucciones del propietario y las condiciones pactadas.',
}

const cl_kommission_aufteilung: ClauseConfig = {
  id: 'kommission_aufteilung',
  title_de: 'Provisionsaufteilung',
  title_es: 'Reparto de honorarios',
  defaultText: 'REPARTO DE HONORARIOS: La comisión total pactada con el propietario se repartirá entre ambos agentes conforme al porcentaje acordado en los datos de este contrato. El agente receptor abonará al agente cedente su parte de la comisión en un plazo máximo de quince (15) días naturales desde el cobro efectivo de los honorarios. El pago se realizará mediante transferencia bancaria previa emisión de factura.',
}

const cl_pflichten_cedente: ClauseConfig = {
  id: 'pflichten_cedente',
  title_de: 'Pflichten des vermittelnden Agenten',
  title_es: 'Obligaciones del agente cedente',
  defaultText: 'OBLIGACIONES DEL CEDENTE: El agente cedente se obliga a: (a) facilitar toda la documentación del inmueble y datos del propietario; (b) garantizar la vigencia del mandato de intermediación; (c) no interferir en la gestión del agente receptor; (d) comunicar cualquier cambio de circunstancias que afecte al encargo; (e) no ceder el mismo encargo a otros agentes simultáneamente.',
}

const cl_pflichten_receptor: ClauseConfig = {
  id: 'pflichten_receptor',
  title_de: 'Pflichten des übernehmenden Agenten',
  title_es: 'Obligaciones del agente receptor',
  defaultText: 'OBLIGACIONES DEL RECEPTOR: El agente receptor se obliga a: (a) realizar todas las gestiones necesarias para la venta o alquiler del inmueble; (b) informar periódicamente al agente cedente sobre el estado de las gestiones; (c) consultar con el agente cedente antes de aceptar ofertas; (d) respetar el precio mínimo acordado con el propietario; (e) abonar la comisión al cedente en el plazo pactado.',
}

const cl_exklusivitaet_kooperation: ClauseConfig = {
  id: 'exklusivitaet_kooperation',
  title_de: 'Exklusivität der Kooperation',
  title_es: 'Exclusividad de la cooperación',
  defaultText: 'EXCLUSIVIDAD: Durante la vigencia del presente acuerdo, el agente cedente se compromete a no ceder el mismo encargo a otros agentes en la misma zona geográfica. El agente receptor tendrá la exclusividad de la intermediación en su territorio de actuación durante el plazo acordado.',
}

const cl_haftung_kooperation: ClauseConfig = {
  id: 'haftung_kooperation',
  title_de: 'Haftung und Verantwortung',
  title_es: 'Responsabilidad',
  defaultText: 'RESPONSABILIDAD: Cada agente responde individualmente frente al propietario y frente a terceros por sus propias actuaciones profesionales. El agente receptor asume la responsabilidad principal de la gestión de intermediación una vez aceptado el encargo. Ningún agente responderá por los actos u omisiones del otro, salvo negligencia grave o dolo.',
}

const cl_laufzeit_kooperation: ClauseConfig = {
  id: 'laufzeit_kooperation',
  title_de: 'Laufzeit und Beendigung',
  title_es: 'Duración y terminación',
  defaultText: 'DURACIÓN: El presente acuerdo de cooperación tendrá la duración indicada en los datos del contrato. Podrá resolverse anticipadamente por mutuo acuerdo, por incumplimiento grave de cualquiera de las partes (con preaviso de 15 días), o por la finalización exitosa de la operación. En caso de resolución anticipada, el derecho a comisión del cedente subsistirá respecto a operaciones iniciadas durante la vigencia del acuerdo.',
}

const cl_vertraulichkeit_kooperation: ClauseConfig = {
  id: 'vertraulichkeit_kooperation',
  title_de: 'Vertraulichkeit',
  title_es: 'Confidencialidad',
  defaultText: 'CONFIDENCIALIDAD: Ambos agentes se obligan a mantener en estricta confidencialidad toda la información comercial, datos de clientes y condiciones económicas intercambiadas en el marco de esta cooperación. Esta obligación subsistirá durante dos (2) años tras la finalización del acuerdo.',
}

// ── Main config ──

export const CONTRACT_TYPE_CONFIG: Record<string, ContractTypeConfig> = {
  seller_broker: {
    id: 'seller_broker',
    label_de: 'Verkäufer-Maklervertrag',
    label_es: 'Contrato de mandato de venta',
    pdfTitle: 'CONTRATO DE MANDATO DE VENTA',
    clauses: [cl_verkaufsauftrag, cl_immobilienbewertung, cl_vermarktungsstrategie, cl_pflichten_verkaeufer, cl_preisanpassung, cl_kaufangebote, cl_laufzeit, cl_provision, cl_datenschutz, cl_widerrufsrecht, cl_gerichtsstand],
  },
  landlord_broker: {
    id: 'landlord_broker',
    label_de: 'Vermieter-Maklervertrag',
    label_es: 'Contrato de mandato de arrendamiento',
    pdfTitle: 'CONTRATO DE MANDATO DE ARRENDAMIENTO',
    clauses: [cl_vermietungsauftrag, cl_mietpreisvorstellung, cl_mieterauswahl, cl_vermarktung, cl_pflichten_vermieter, cl_mietvertragsabschluss, cl_laufzeit, cl_provision_vermietung, cl_datenschutz, cl_widerrufsrecht, cl_gerichtsstand],
  },
  buyer_search: {
    id: 'buyer_search',
    label_de: 'Käufer-Suchauftrag',
    label_es: 'Encargo de búsqueda para comprador',
    pdfTitle: 'ENCARGO DE BÚSQUEDA PARA COMPRADOR',
    clauses: [cl_suchprofil_kaeufer, cl_suchgebiet_kaeufer, cl_kaufbudget, cl_objektvorschlaege_kaeufer, cl_besichtigungen_kaeufer, cl_finanzierungsberatung, cl_laufzeit, cl_provision, cl_datenschutz, cl_gerichtsstand],
  },
  tenant_search: {
    id: 'tenant_search',
    label_de: 'Mieter-Suchauftrag',
    label_es: 'Encargo de búsqueda para inquilino',
    pdfTitle: 'ENCARGO DE BÚSQUEDA PARA INQUILINO',
    clauses: [cl_suchprofil_mieter, cl_suchgebiet_mieter, cl_mietbudget, cl_objektvorschlaege_mieter, cl_besichtigungen_mieter, cl_dokumentation_mieter, cl_laufzeit, cl_provision_vermietung, cl_datenschutz, cl_gerichtsstand],
  },
  purchase_contract: {
    id: 'purchase_contract',
    label_de: 'Kaufvertrag / Arras',
    label_es: 'Contrato de compraventa / Arras',
    pdfTitle: 'CONTRATO DE ARRAS',
    clauses: [cl_kaufgegenstand, cl_kaufpreis, cl_arras, cl_lasten_maengel, cl_uebergabetermin, cl_notarielle_beurkundung, cl_anwendbares_recht],
  },
  investor_search: {
    id: 'investor_search',
    label_de: 'Investorensuchauftrag',
    label_es: 'Encargo de búsqueda para inversor',
    pdfTitle: 'ENCARGO DE BÚSQUEDA PARA INVERSOR',
    clauses: [cl_anlageprofil, cl_investitionsvolumen, cl_renditeerwartung, cl_marktanalyse, cl_due_diligence, cl_exklusivitaet_investor, cl_laufzeit, cl_provision, cl_datenschutz, cl_gerichtsstand],
  },
  rental_contract: {
    id: 'rental_contract',
    label_de: 'Mietvertrag',
    label_es: 'Contrato de arrendamiento',
    pdfTitle: 'CONTRATO DE ARRENDAMIENTO',
    clauses: [cl_mietobjekt, cl_mietdauer, cl_miete_nebenkosten, cl_kaution, cl_hausordnung, cl_instandhaltung, cl_datenschutz, cl_kuendigung, cl_gerichtsstand],
  },
  commercial_search: {
    id: 'commercial_search',
    label_de: 'Gewerbemiet-Suchauftrag',
    label_es: 'Encargo de búsqueda comercial',
    pdfTitle: 'ENCARGO DE BÚSQUEDA DE ALQUILER COMERCIAL',
    clauses: [cl_suchprofil_gewerbe, cl_suchgebiet, cl_gewerbe_mietkonditionen, cl_objektvorschlaege, cl_besichtigungen_gewerbe, cl_vertraulichkeit_gewerbe, cl_laufzeit, cl_provision, cl_datenschutz, cl_gerichtsstand],
  },
  power_of_attorney: {
    id: 'power_of_attorney',
    label_de: 'Vollmacht / Poder Notarial',
    label_es: 'Poder notarial',
    pdfTitle: 'PODER NOTARIAL',
    clauses: [cl_vollmachtgeber, cl_bevollmaechtigter, cl_umfang_vollmacht, cl_gueltigkeit_vollmacht, cl_widerruf_vollmacht, cl_anwendbares_recht],
  },
  proof_contract: {
    id: 'proof_contract',
    label_de: 'Nachweisvertrag',
    label_es: 'Contrato de comprobación',
    pdfTitle: 'CONTRATO DE COMPROBACIÓN',
    clauses: [cl_leistung, cl_provision, cl_pflichten_auftraggeber, cl_datenschutz, cl_gerichtsstand],
  },
  brokerage_contract: {
    id: 'brokerage_contract',
    label_de: 'Vermittlungsvertrag',
    label_es: 'Contrato de intermediación',
    pdfTitle: 'CONTRATO DE INTERMEDIACIÓN',
    clauses: [cl_leistung, cl_laufzeit, cl_provision, cl_pflichten_auftraggeber, cl_datenschutz, cl_widerrufsrecht, cl_gerichtsstand],
  },
  rental_brokerage: {
    id: 'rental_brokerage',
    label_de: 'Maklervertrag Vermietung',
    label_es: 'Contrato de mandato de alquiler',
    pdfTitle: 'CONTRATO DE MANDATO DE ALQUILER',
    clauses: [cl_leistung, cl_laufzeit, cl_provision_vermietung, cl_pflichten_auftraggeber, cl_datenschutz, cl_widerrufsrecht, cl_gerichtsstand],
  },
  reservation: {
    id: 'reservation',
    label_de: 'Reservierungsvertrag',
    label_es: 'Acuerdo de reserva',
    pdfTitle: 'ACUERDO DE RESERVA',
    clauses: [cl_reservierungsgegenstand, cl_reservierungspreis, cl_gueltigkeit_reservierung, cl_rueckzahlungsbedingungen, cl_verbindlichkeit, cl_datenschutz, cl_gerichtsstand],
  },
  commission: {
    id: 'commission',
    label_de: 'Provisionsvereinbarung',
    label_es: 'Acuerdo de honorarios',
    pdfTitle: 'ACUERDO DE HONORARIOS',
    clauses: [cl_provisionshoehe, cl_faelligkeit, cl_zahlungsmodalitaeten, cl_provisionsanspruch, cl_doppeltaetigkeit, cl_aufwendungsersatz, cl_laufzeit, cl_datenschutz, cl_gerichtsstand],
  },
  expose_release: {
    id: 'expose_release',
    label_de: 'Exposé-Freigabe',
    label_es: 'Autorización de exposé',
    pdfTitle: 'AUTORIZACIÓN DE EXPOSÉ',
    clauses: [cl_freigabe_veroeffentlichung, cl_zulaessige_plattformen, cl_urheberrecht, cl_haftungsausschluss_angaben, cl_widerruf_freigabe],
  },
  withdrawal: {
    id: 'withdrawal',
    label_de: 'Widerrufsbelehrung',
    label_es: 'Instrucción de desistimiento',
    pdfTitle: 'INSTRUCCIÓN DE DESISTIMIENTO',
    clauses: [cl_widerrufsrecht_14, cl_widerrufsfrist, cl_ausuebung_widerrufsrecht, cl_widerrufsfolgen, cl_besondere_hinweise, cl_ausschluss_widerruf, cl_muster_widerrufsformular, cl_kontaktdaten_widerruf],
  },
  privacy: {
    id: 'privacy',
    label_de: 'Datenschutzerklärung / RGPD',
    label_es: 'Declaración de protección de datos / RGPD',
    pdfTitle: 'DECLARACIÓN DE PROTECCIÓN DE DATOS',
    clauses: [cl_verantwortlicher, cl_zwecke_verarbeitung, cl_rechtsgrundlagen, cl_datenkategorien, cl_empfaenger, cl_speicherdauer, cl_betroffenenrechte, cl_widerrufsrecht_einwilligung, cl_cookies_tracking, cl_datensicherheit, cl_beschwerderecht],
  },
  viewing_protocol: {
    id: 'viewing_protocol',
    label_de: 'Besichtigungsprotokoll',
    label_es: 'Protocolo de visita',
    pdfTitle: 'PROTOCOLO DE VISITA',
    clauses: [cl_objektdaten_besichtigung, cl_datum_uhrzeit, cl_anwesende_personen, cl_zustand_objekt, cl_vereinbarungen_naechste_schritte, cl_unterschriften_besichtigung],
  },
  handover_protocol: {
    id: 'handover_protocol',
    label_de: 'Übergabeprotokoll',
    label_es: 'Protocolo de entrega',
    pdfTitle: 'PROTOCOLO DE ENTREGA',
    clauses: [cl_objektdaten_uebergabe, cl_zaehlersstaende, cl_schluesseluebergabe, cl_zustand_raeume, cl_inventar, cl_unterschriften_uebergabe],
  },
  other: {
    id: 'other',
    label_de: 'AGB',
    label_es: 'Condiciones generales',
    pdfTitle: 'CONDICIONES GENERALES DE CONTRATACIÓN',
    clauses: [cl_geltungsbereich, cl_leistungen_agentur, cl_verguetung, cl_haftungsbeschraenkung, cl_datenschutz, cl_aenderungsvorbehalt, cl_gerichtsstand],
  },
  freelancer_contract: {
    id: 'freelancer_contract',
    label_de: 'Freelancer-Vertrag',
    label_es: 'Contrato de colaboración freelance',
    pdfTitle: 'CONTRATO DE COLABORACIÓN FREELANCE',
    clauses: [cl_vertragsgegenstand_freelancer, cl_leistungsumfang_freelancer, cl_verguetung_freelancer, cl_vertragslaufzeit_freelancer, cl_kuendigung_freelancer, cl_arbeitszeit_freelancer, cl_vertraulichkeit_freelancer, cl_geistiges_eigentum, cl_wettbewerbsverbot, cl_haftung_freelancer, cl_sozialversicherung_freelancer, cl_salvatorische_klausel, cl_datenschutz, cl_gerichtsstand],
  },
  employment_contract: {
    id: 'employment_contract',
    label_de: 'Arbeitsvertrag',
    label_es: 'Contrato de trabajo',
    pdfTitle: 'CONTRATO DE TRABAJO',
    clauses: [cl_vertragsparteien_arbeit, cl_taetigkeitsbeschreibung, cl_gehalt, cl_arbeitszeit_arbeit, cl_arbeitsort, cl_probezeit, cl_urlaub, cl_pflichten_arbeitnehmer, cl_vertraulichkeit_arbeit, cl_kuendigung_arbeit, cl_nebentaetigkeit, cl_arbeitsmittel, cl_convenio_colectivo, cl_datenschutz, cl_gerichtsstand],
  },
  cooperation_agreement: {
    id: 'cooperation_agreement',
    label_de: 'Kooperationsvertrag',
    label_es: 'Acuerdo de cooperación entre agentes',
    pdfTitle: 'ACUERDO DE COOPERACIÓN ENTRE AGENTES INMOBILIARIOS',
    clauses: [cl_kooperationsgegenstand, cl_cedente, cl_receptor, cl_kommission_aufteilung, cl_pflichten_cedente, cl_pflichten_receptor, cl_exklusivitaet_kooperation, cl_haftung_kooperation, cl_laufzeit_kooperation, cl_vertraulichkeit_kooperation, cl_datenschutz, cl_gerichtsstand],
  },
  document_authorization: {
    id: 'document_authorization',
    label_de: 'Vollmacht Dokumentenbeschaffung',
    label_es: 'Autorización de representación documental',
    pdfTitle: 'AUTORIZACIÓN DE REPRESENTACIÓN',
    clauses: [
      {
        id: 'autorizacion_objeto',
        title_de: 'Gegenstand der Vollmacht',
        title_es: 'Objeto de la autorización',
        defaultText: 'OBJETO: Por medio del presente documento, el/la abajo firmante, en calidad de propietario/a e interesado/a, AUTORIZA expresamente a {agency_name}, actuando como asesor inmobiliario, para que en su nombre y representación pueda realizar las gestiones documentales descritas en las siguientes cláusulas, relativas al inmueble sito en {property_address}.',
        required: true,
      },
      {
        id: 'autorizacion_nota_simple',
        title_de: 'Nota Simple beantragen',
        title_es: 'Solicitud de Nota Simple',
        defaultText: 'NOTA SIMPLE: Solicitar Notas Simples Informativas ante el Registro de la Propiedad correspondiente, así como solicitar y recoger certificados de dominio y cargas.',
      },
      {
        id: 'autorizacion_catastro',
        title_de: 'Katasterauszüge',
        title_es: 'Certificados catastrales',
        defaultText: 'CATASTRO: Solicitar certificados catastrales y consultar datos en la Sede Electrónica del Catastro, incluyendo certificados descriptivos y gráficos de la finca.',
      },
      {
        id: 'autorizacion_energia',
        title_de: 'Energieausweis & Bewohnbarkeitsbescheinigung',
        title_es: 'Certificado energético y cédula de habitabilidad',
        defaultText: 'CERTIFICADOS TÉCNICOS: Solicitar certificados de eficiencia energética y cédulas de habitabilidad ante los organismos competentes.',
      },
      {
        id: 'autorizacion_comunidad',
        title_de: 'Gemeinschaftsschulden',
        title_es: 'Certificado de deuda de la comunidad',
        defaultText: 'COMUNIDAD: Gestionar la obtención de certificados de deuda pendiente ante la comunidad de propietarios correspondiente.',
      },
      {
        id: 'autorizacion_urbanismo',
        title_de: 'Städtebauliche Bescheinigungen',
        title_es: 'Certificados urbanísticos',
        defaultText: 'URBANISMO: Solicitar certificados urbanísticos y de compatibilidad ante el Ayuntamiento correspondiente.',
      },
      {
        id: 'autorizacion_otros_documentos',
        title_de: 'Sonstige Dokumente',
        title_es: 'Documentación complementaria',
        defaultText: 'OTROS DOCUMENTOS: Solicitar cualquier otra documentación complementaria necesaria para la gestión inmobiliaria del inmueble del autorizante, así como firmar cuantos documentos sean necesarios para la correcta tramitación de las gestiones indicadas.',
      },
      {
        id: 'autorizacion_vigencia',
        title_de: 'Gültigkeit',
        title_es: 'Vigencia',
        defaultText: 'VIGENCIA: La presente autorización tendrá validez desde la fecha de su firma y durante un período de seis (6) meses, salvo revocación expresa y por escrito por parte del autorizante. El autorizante podrá revocar la presente autorización en cualquier momento mediante comunicación fehaciente al autorizado.',
        required: true,
      },
      {
        id: 'autorizacion_observaciones',
        title_de: 'Hinweise',
        title_es: 'Observaciones',
        defaultText: 'OBSERVACIONES: El presente documento de autorización no constituye un poder notarial y se limita exclusivamente a las gestiones documentales descritas. Se adjuntará copia del documento de identidad de ambas partes para su debida validez. Ambas partes declaran que los datos aquí consignados son veraces.',
        required: true,
      },
      cl_datenschutz,
    ],
  },
}
