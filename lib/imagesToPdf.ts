import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'react-native';

/**
 * Get the pixel dimensions of a local image URI.
 * Returns { width, height } in pixels.
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
 * Each page is sized to match the aspect ratio of its image so there
 * is no extra white space around the content.
 * Returns the file URI of the generated PDF.
 */
export async function imagesToPdf(imageUris: string[]): Promise<string> {
  // Read each image as base64, get its dimensions, and build HTML
  const imageHtmlParts: string[] = [];

  // We use the first image's aspect ratio to set the PDF page size.
  // (expo-print only supports a single page size for the whole document)
  // All scanned pages typically share the same dimensions.
  let pdfWidth = 595; // fallback A4
  let pdfHeight = 842;

  for (let i = 0; i < imageUris.length; i++) {
    const uri = imageUris[i];

    // Get actual image dimensions for the first image
    if (i === 0) {
      try {
        const dims = await getImageDimensions(uri);
        if (dims.width > 0 && dims.height > 0) {
          // Scale to a reasonable PDF width (595pt ≈ 210mm ≈ A4 width)
          // but keep the image's actual aspect ratio
          pdfWidth = 595;
          pdfHeight = Math.round((dims.height / dims.width) * 595);
        }
      } catch (e) {
        // Fallback to A4 if dimensions can't be read
        console.error('[imagesToPdf] Could not read image dimensions, using A4:', e);
      }
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    imageHtmlParts.push(`
      <div style="page-break-after: always; margin: 0; padding: 0; width: 100%; height: 100vh; overflow: hidden;">
        <img src="data:image/jpeg;base64,${base64}" style="width: 100%; height: 100%; display: block; object-fit: fill;" />
      </div>
    `);
  }

  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page { margin: 0; size: ${pdfWidth}pt ${pdfHeight}pt; }
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        ${imageHtmlParts.join('')}
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({
    html,
    width: pdfWidth,
    height: pdfHeight,
  });
  return uri;
}
