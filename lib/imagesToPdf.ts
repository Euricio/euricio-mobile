/**
 * Bild → PDF Konvertierung für die Makler-App.
 *
 * Das Backend akzeptiert nur PDF-Uploads (Bucket-Policy `property-documents`
 * ist auf `application/pdf` beschränkt). Damit ein Makler trotzdem ein Foto
 * vom iPhone hochladen kann, wird das Bild vor dem Upload stumm in ein
 * einseitiges PDF konvertiert.
 *
 * Wir nutzen pdf-lib — reines JavaScript, funktioniert ohne Native Build
 * (im Gegensatz zu jsPDF/canvas oder expo-print) und liefert deterministische
 * Ergebnisse. Das Bild wird bei Erhalt des Seitenverhältnisses auf A4
 * zentriert (mit weißen Rändern, falls nötig) — kein Stretching, damit
 * das Originaldokument visuell korrekt bleibt.
 *
 * Die gleiche Implementierung existiert in der Kunden-App
 * (`euricio-client/lib/imagesToPdf.ts`) — Änderungen bitte synchron halten.
 */
import { PDFDocument, type PDFImage } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';

// A4 in Points (1 pt = 1/72 inch)
const A4_W = 595;
const A4_H = 842;

type ImageFormat = 'jpeg' | 'png' | 'heic' | 'unknown';

/**
 * Format aus Magic Bytes erkennen — zuverlässiger als sich auf die vom
 * Client gemeldete MIME-Type zu verlassen (manche iOS-Quellen melden
 * `application/octet-stream` für JPEG).
 */
function detectFormat(bytes: Uint8Array): ImageFormat {
  if (bytes.length < 12) return 'unknown';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'png';
  }
  if (
    bytes[4] === 0x66 && // f
    bytes[5] === 0x74 && // t
    bytes[6] === 0x79 && // y
    bytes[7] === 0x70 // p
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (['heic', 'heix', 'mif1', 'msf1', 'heis', 'hevc'].includes(brand)) {
      return 'heic';
    }
  }
  return 'unknown';
}

export class UnsupportedImageError extends Error {
  code: 'heic' | 'unknown';
  constructor(code: 'heic' | 'unknown', message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Wandelt ein oder mehrere Bilder in ein A4-PDF um.
 * Gibt den Dateipfad des erzeugten PDFs im Cache-Directory zurück.
 *
 * Die Aspect-Ratio des Originalbilds bleibt erhalten — das Bild wird
 * proportional in die A4-Seite eingepasst und zentriert.
 *
 * Wirft `UnsupportedImageError` bei HEIC oder unbekanntem Format.
 */
export async function imagesToPdf(imageUris: string[]): Promise<string> {
  if (imageUris.length === 0) {
    throw new Error('Mindestens ein Bild wird benötigt.');
  }

  const doc = await PDFDocument.create();

  for (const imgUri of imageUris) {
    const base64 = await FileSystem.readAsStringAsync(imgUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Base64 → Uint8Array
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let j = 0; j < binaryStr.length; j++) {
      bytes[j] = binaryStr.charCodeAt(j);
    }

    const format = detectFormat(bytes);
    let image: PDFImage;
    if (format === 'jpeg') {
      image = await doc.embedJpg(bytes);
    } else if (format === 'png') {
      image = await doc.embedPng(bytes);
    } else if (format === 'heic') {
      throw new UnsupportedImageError(
        'heic',
        'HEIC-Bilder werden nicht unterstützt. Bitte in den iPhone-Einstellungen unter "Kamera → Formate" den Modus "Maximale Kompatibilität" wählen, dann das Foto neu aufnehmen.',
      );
    } else {
      throw new UnsupportedImageError(
        'unknown',
        'Unbekanntes Bildformat. Nur JPEG und PNG werden unterstützt.',
      );
    }

    // Proportional in A4 einpassen, zentrieren (weiße Ränder wenn nötig)
    const ratio = Math.min(A4_W / image.width, A4_H / image.height);
    const drawW = image.width * ratio;
    const drawH = image.height * ratio;
    const x = (A4_W - drawW) / 2;
    const y = (A4_H - drawH) / 2;

    const page = doc.addPage([A4_W, A4_H]);
    page.drawImage(image, { x, y, width: drawW, height: drawH });
  }

  const pdfBytes = await doc.save();

  // Uint8Array → Base64 (chunked, um Stack-Overflow bei großen PDFs zu vermeiden)
  let binaryStr = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < pdfBytes.length; i += CHUNK) {
    const chunk = pdfBytes.subarray(i, i + CHUNK);
    binaryStr += String.fromCharCode.apply(null, Array.from(chunk));
  }
  const pdfBase64 = btoa(binaryStr);

  const pdfPath = `${FileSystem.cacheDirectory}upload-${Date.now()}.pdf`;
  await FileSystem.writeAsStringAsync(pdfPath, pdfBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return pdfPath;
}

/**
 * Prüft anhand von MIME-Type und Dateiname, ob ein Asset vor dem Upload
 * in PDF umgewandelt werden muss.
 */
export function needsPdfConversion(
  mimeType: string | null | undefined,
  fileName: string | null | undefined,
): boolean {
  const t = (mimeType || '').toLowerCase();
  if (t.startsWith('image/')) return true;
  const ext = (fileName || '').toLowerCase().split('.').pop() || '';
  return ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp'].includes(ext);
}
