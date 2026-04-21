import { PDFDocument, PDFImage } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';

// A4 in points
const A4_W = 595;
const A4_H = 842;

type ImageFormat = 'jpeg' | 'png' | 'heic' | 'unknown';

/**
 * Detect image format from magic bytes.
 * - JPEG: 0xFF 0xD8 0xFF (SOI marker)
 * - PNG:  0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
 * - HEIC: bytes 4..11 contain 'ftyp' + 'heic'/'heix'/'mif1'/'msf1'
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

/**
 * Convert an array of image URIs to a single PDF file.
 * Each image is stretched to fill a full A4 page with no white space.
 *
 * Uses pdf-lib which is a pure-JS PDF library that works in React Native
 * without any DOM/browser dependencies (unlike jsPDF or expo-print).
 *
 * Supports both JPEG and PNG input (auto-detected via magic bytes).
 * HEIC is rejected with a clear error message — expo-image-picker converts
 * HEIC to JPEG automatically on iOS, but file-picker or other sources may
 * still hand us HEIC.
 */
export async function imagesToPdf(imageUris: string[]): Promise<string> {
  const doc = await PDFDocument.create();

  for (const imgUri of imageUris) {
    const base64 = await FileSystem.readAsStringAsync(imgUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Decode base64 to Uint8Array
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let j = 0; j < binaryStr.length; j++) {
      bytes[j] = binaryStr.charCodeAt(j);
    }

    // Detect format and embed with the correct method
    const format = detectFormat(bytes);
    let image: PDFImage;
    if (format === 'jpeg') {
      image = await doc.embedJpg(bytes);
    } else if (format === 'png') {
      image = await doc.embedPng(bytes);
    } else if (format === 'heic') {
      throw new Error(
        'HEIC-Bilder werden nicht unterstützt. Bitte in der Kamera-Einstellung "Kompatibel" wählen oder das Bild als JPEG exportieren.',
      );
    } else {
      throw new Error(
        'Unbekanntes Bildformat. Nur JPEG und PNG werden unterstützt.',
      );
    }

    // Add a page with exact A4 dimensions and draw the image
    // stretched to fill the entire page
    const page = doc.addPage([A4_W, A4_H]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: A4_W,
      height: A4_H,
    });
  }

  // Save PDF to bytes, then write to cache as base64
  const pdfBytes = await doc.save();

  // Convert Uint8Array to base64
  let binaryStr = '';
  for (let i = 0; i < pdfBytes.length; i++) {
    binaryStr += String.fromCharCode(pdfBytes[i]);
  }
  const pdfBase64 = btoa(binaryStr);

  const pdfPath = `${FileSystem.cacheDirectory}scanned-${Date.now()}.pdf`;
  await FileSystem.writeAsStringAsync(pdfPath, pdfBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return pdfPath;
}
