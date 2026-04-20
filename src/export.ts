/**
 * Triggers a download of the given Blob with the specified filename.
 */
function downloadBlob(blob: Blob, filename: string): void {
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
  const svgString = svgElement.outerHTML;
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

  // Get the SVG's intrinsic dimensions
  const svgRect = svgElement.getBoundingClientRect();
  const width = svgRect.width || 800;
  const height = svgRect.height || 600;

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
