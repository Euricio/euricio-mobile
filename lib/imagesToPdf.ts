import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'react-native';

/**
 * Get the pixel dimensions of a local image URI.
 */
function getImageDimensions(
  uri: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error),
    );
  });
}

/**
 * Convert an array of image URIs to a single PDF file.
 * The PDF page matches the exact aspect ratio of the scanned images
 * so there is no extra white space.
 */
export async function imagesToPdf(imageUris: string[]): Promise<string> {
  const imageHtmlParts: string[] = [];

  // Determine PDF page dimensions from the first image's aspect ratio.
  // expo-print width/height are in points at 72 PPI.
  // Default: A4 portrait (595 x 842 pt)
  let pageW = 595;
  let pageH = 842;

  try {
    const dims = await getImageDimensions(imageUris[0]);
    if (dims.width > 0 && dims.height > 0) {
      // Keep width at 595pt (A4 width), scale height to match image ratio
      pageH = Math.round((dims.height / dims.width) * pageW);
      console.error(`[imagesToPdf] Image: ${dims.width}x${dims.height}, PDF page: ${pageW}x${pageH}`);
    }
  } catch (e) {
    console.error('[imagesToPdf] Could not read image dimensions, using A4:', e);
  }

  for (const imgUri of imageUris) {
    const base64 = await FileSystem.readAsStringAsync(imgUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Each image is a standalone page.
    // Use a simple <img> that fills the full page width; the browser
    // will scale the height proportionally, which matches our pageH.
    imageHtmlParts.push(
      `<img src="data:image/jpeg;base64,${base64}" style="width:${pageW}px;display:block;" />`,
    );
  }

  // Minimal HTML — no wrapper divs, no viewport tricks.
  // expo-print paginates based on the width/height we pass;
  // each <img> exactly fills one page when its width matches pageW.
  const html = `<html><head><style>*{margin:0;padding:0}@page{margin:0}</style></head><body>${imageHtmlParts.join('')}</body></html>`;

  const { uri } = await Print.printToFileAsync({
    html,
    width: pageW,
    height: pageH,
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  return uri;
}
