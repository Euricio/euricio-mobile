import { PDFDocument } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';

// A4 in points
const A4_W = 595;
const A4_H = 842;

/**
 * Convert an array of image URIs to a single PDF file.
 * Each image is stretched to fill a full A4 page with no white space.
 *
 * Uses pdf-lib which is a pure-JS PDF library that works in React Native
 * without any DOM/browser dependencies (unlike jsPDF or expo-print).
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

    // Embed JPEG image
    const image = await doc.embedJpg(bytes);

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
