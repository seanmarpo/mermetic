/**
 * Triggers a download of the given Blob with the specified filename.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();

  // Clean up after a short delay to ensure the download starts
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(anchor);
  }, 100);
}

/**
 * Exports the given SVG element as an `.svg` file download.
 */
export function exportSvg(svgElement: SVGElement): void {
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgElement);
  if (!svgString.includes('xmlns="')) {
    svgString = svgString.replace(
      "<svg",
      '<svg xmlns="http://www.w3.org/2000/svg"',
    );
  }
  svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, "diagram.svg");
}

/**
 * Encodes a UTF-8 string as a base64 string.
 * Handles Unicode correctly via TextEncoder (unlike bare btoa).
 */
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Reads the intrinsic dimensions from an SVG element using its viewBox
 * or width/height attributes. Returns [width, height].
 * Falls back to [800, 600] if nothing usable is found.
 */
function getSvgDimensions(svgElement: SVGElement): [number, number] {
  let width = 0;
  let height = 0;

  // Prefer viewBox — it describes the SVG's coordinate-system extent.
  const viewBox = svgElement.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/);
    if (parts.length === 4) {
      width = parseFloat(parts[2]);
      height = parseFloat(parts[3]);
    }
  }

  // Fall back to explicit width/height attributes.
  if (width === 0 || height === 0) {
    const w = parseFloat(svgElement.getAttribute("width") || "0");
    const h = parseFloat(svgElement.getAttribute("height") || "0");
    if (w > 0 && h > 0) {
      width = w;
      height = h;
    }
  }

  // Last resort: hard-coded defaults.
  if (width === 0 || height === 0) {
    width = 800;
    height = 600;
  }

  return [width, height];
}

/**
 * Prepares an SVG element for off-screen rendering by cloning it and
 * ensuring it has explicit dimensions and the required XML namespace
 * declarations. Returns a self-contained SVG string suitable for
 * loading into an Image via a data-URL.
 */
function prepareSvgForImage(
  svgElement: SVGElement,
  width: number,
  height: number,
): string {
  // Deep-clone so we never mutate the live DOM.
  const svgClone = svgElement.cloneNode(true) as SVGElement;

  // Ensure required XML namespace declarations are present.
  // Without these the SVG may fail to render when loaded as an image.
  svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (!svgClone.getAttribute("xmlns:xlink")) {
    svgClone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  }

  // Set explicit width/height so the Image element knows how large the
  // SVG is (some browsers ignore viewBox when loading SVG-as-image).
  svgClone.setAttribute("width", String(width));
  svgClone.setAttribute("height", String(height));

  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgClone);
}

/**
 * Renders an SVG element to a PNG Blob at the specified scale.
 *
 * Uses a base64 data-URL (rather than a blob-URL) for the intermediate
 * Image source.  This improves compatibility in browsers that impose
 * stricter security policies on blob-loaded SVG content.
 */
export async function renderPngBlob(
  svgElement: SVGElement,
  options?: { scale?: number; backgroundColor?: string },
): Promise<Blob> {
  const scale = options?.scale ?? 2;
  const backgroundColor = options?.backgroundColor ?? "#ffffff";

  const [width, height] = getSvgDimensions(svgElement);
  const scaledWidth = Math.ceil(width * scale);
  const scaledHeight = Math.ceil(height * scale);

  // Build a self-contained SVG string and encode it as a data-URL.
  const svgString = prepareSvgForImage(svgElement, width, height);
  const dataUrl = "data:image/svg+xml;base64," + utf8ToBase64(svgString);

  // Load the SVG into an Image.
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Failed to load SVG image for PNG export."));
    image.src = dataUrl;
  });

  // Draw the image onto a canvas.
  const canvas = document.createElement("canvas");
  canvas.width = scaledWidth;
  canvas.height = scaledHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas 2D context.");
  }

  // Fill background.
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, scaledWidth, scaledHeight);

  // Draw the SVG image scaled.
  ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

  // Convert canvas to PNG blob.
  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create PNG blob from canvas."));
        }
      }, "image/png");
    } catch (err) {
      // Chrome throws a SecurityError for tainted canvases (e.g. when
      // the SVG contained <foreignObject> elements).
      reject(err);
    }
  });
}

/**
 * Exports the given SVG element as a `.png` file download.
 * Renders the SVG onto an off-screen canvas at the specified scale.
 */
export async function exportPng(
  svgElement: SVGElement,
  options?: { scale?: number; backgroundColor?: string },
): Promise<void> {
  const pngBlob = await renderPngBlob(svgElement, options);
  downloadBlob(pngBlob, "diagram.png");
}
