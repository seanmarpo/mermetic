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
 * Exports the given SVG element as a `.png` file download.
 * Renders the SVG onto an off-screen canvas at the specified scale.
 */
export async function exportPng(
  svgElement: SVGElement,
  options?: { scale?: number; backgroundColor?: string },
): Promise<void> {
  const scale = options?.scale ?? 2;
  const backgroundColor = options?.backgroundColor ?? "#ffffff";

  // Serialize the SVG to a string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);

  // Get the SVG's intrinsic dimensions from viewBox or width/height attributes,
  // avoiding getBoundingClientRect() which is affected by CSS transforms (zoom/pan).
  let width = 0;
  let height = 0;

  const viewBox = svgElement.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/);
    if (parts.length === 4) {
      width = parseFloat(parts[2]);
      height = parseFloat(parts[3]);
    }
  }

  if (width === 0 || height === 0) {
    const w = parseFloat(svgElement.getAttribute("width") || "0");
    const h = parseFloat(svgElement.getAttribute("height") || "0");
    if (w > 0 && h > 0) {
      width = w;
      height = h;
    }
  }

  if (width === 0 || height === 0) {
    width = 800;
    height = 600;
  }

  const scaledWidth = Math.ceil(width * scale);
  const scaledHeight = Math.ceil(height * scale);

  // Create a data URL from the SVG string
  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    // Load the SVG into an Image
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error("Failed to load SVG image for PNG export."));
      image.src = svgUrl;
    });

    // Draw the image onto a canvas
    const canvas = document.createElement("canvas");
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas 2D context.");
    }

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, scaledWidth, scaledHeight);

    // Draw the SVG image scaled
    ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

    // Convert canvas to PNG blob and trigger download
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create PNG blob from canvas."));
        }
      }, "image/png");
    });

    downloadBlob(pngBlob, "diagram.png");
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
