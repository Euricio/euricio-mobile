import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';

// A4 at 72 PPI
const A4_W = 595;
const A4_H = 842;

/**
 * Convert an array of image URIs to a single PDF file.
 * Each image is stretched to fill a full A4 page with no white space.
 *
 * Uses CSS background-image on a fixed-size div instead of <img> elements.
 * This is more reliable in iOS WKWebView's print renderer because
 * background-size:100% 100% forces the image to fill the exact div
 * dimensions, and the div dimensions match the page size exactly.
 */
export async function imagesToPdf(imageUris: string[]): Promise<string> {
  const pages: string[] = [];

  for (const imgUri of imageUris) {
    const base64 = await FileSystem.readAsStringAsync(imgUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Each page is a div with background-image stretched to fill.
    // -webkit-print-color-adjust ensures backgrounds print.
    pages.push(
      `<div style="width:${A4_W}px;height:${A4_H}px;background:url(data:image/jpeg;base64,${base64}) no-repeat center/100% 100%;-webkit-print-color-adjust:exact;page-break-after:always"></div>`,
    );
  }

  const html = `<html><head><meta name="viewport" content="width=${A4_W}"><style>*{margin:0;padding:0}@page{margin:0}</style></head><body>${pages.join('')}</body></html>`;

  const { uri } = await Print.printToFileAsync({
    html,
    width: A4_W,
    height: A4_H,
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  return uri;
}
