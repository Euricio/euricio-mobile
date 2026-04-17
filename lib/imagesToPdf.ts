import { jsPDF } from 'jspdf';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Convert an array of image URIs to a single PDF file.
 * Each image is stretched to fill a full A4 page with no white space.
 *
 * Uses jsPDF to build the PDF directly from base64 image data,
 * bypassing expo-print / WKWebView which cannot reliably control
 * page dimensions on iOS.
 */
export async function imagesToPdf(imageUris: string[]): Promise<string> {
  // A4 in points (jsPDF default unit 'pt')
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();  // 595.28
  const pageH = doc.internal.pageSize.getHeight(); // 841.89

  for (let i = 0; i < imageUris.length; i++) {
    if (i > 0) {
      doc.addPage('a4', 'portrait');
    }

    const base64 = await FileSystem.readAsStringAsync(imageUris[i], {
      encoding: FileSystem.EncodingType.Base64,
    });

    // addImage stretches the image to the given width/height — no white space
    doc.addImage(
      `data:image/jpeg;base64,${base64}`,
      'JPEG',
      0,   // x
      0,   // y
      pageW,
      pageH,
    );
  }

  // Get PDF as base64 and write to cache
  const pdfBase64 = doc.output('datauristring').split(',')[1];
  const pdfPath = `${FileSystem.cacheDirectory}scanned-${Date.now()}.pdf`;
  await FileSystem.writeAsStringAsync(pdfPath, pdfBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return pdfPath;
}
