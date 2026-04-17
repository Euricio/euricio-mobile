import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Convert an array of image URIs to a single PDF file.
 * Uses expo-print to render an HTML page with images embedded as base64 data URIs.
 * Returns the file URI of the generated PDF.
 */
export async function imagesToPdf(imageUris: string[]): Promise<string> {
  // Read each image as base64 and build HTML
  const imageHtmlParts: string[] = [];

  for (const uri of imageUris) {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    imageHtmlParts.push(`
      <div style="page-break-after: always; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh;">
        <img src="data:image/jpeg;base64,${base64}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
      </div>
    `);
  }

  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page { margin: 0; }
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        ${imageHtmlParts.join('')}
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 }); // A4
  return uri;
}
