import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';

// A4 at 72 PPI
const A4_WIDTH = 595;
const A4_HEIGHT = 842;

/**
 * Convert an array of image URIs to a single PDF file.
 * Each image is stretched to fill a full A4 page (no white space).
 */
export async function imagesToPdf(imageUris: string[]): Promise<string> {
  const pages: string[] = [];

  for (const imgUri of imageUris) {
    const base64 = await FileSystem.readAsStringAsync(imgUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    pages.push(
      `<div style="page-break-after:always;width:${A4_WIDTH}px;height:${A4_HEIGHT}px;overflow:hidden"><img src="data:image/jpeg;base64,${base64}" style="width:${A4_WIDTH}px;height:${A4_HEIGHT}px"/></div>`,
    );
  }

  const html = [
    '<html><head><style>',
    `*{margin:0;padding:0}`,
    `@page{size:${A4_WIDTH}pt ${A4_HEIGHT}pt;margin:0}`,
    '</style></head><body>',
    pages.join(''),
    '</body></html>',
  ].join('');

  const { uri } = await Print.printToFileAsync({
    html,
    width: A4_WIDTH,
    height: A4_HEIGHT,
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  return uri;
}
