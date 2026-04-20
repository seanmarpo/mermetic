import mermaid from "mermaid";

let renderCounter = 0;

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export function createPreview(_container: HTMLElement): {
  render: (code: string) => Promise<void>;
  getSvgElement: () => SVGElement | null;
  element: HTMLElement;
} {
  const element = document.createElement("div");
  element.className = "preview-panel";

  const header = document.createElement("div");
  header.className = "preview-header";

  const headerLabel = document.createElement("span");
  headerLabel.className = "preview-header-label";
  headerLabel.textContent = "Preview";

  const zoomControls = document.createElement("div");
  zoomControls.className = "preview-zoom-controls";

  const zoomInBtn = createButton("+", "Zoom in");
  const zoomOutBtn = createButton("−", "Zoom out");
  const fitBtn = createButton("Fit", "Fit diagram to view");
  const resetBtn = createButton("100%", "Reset zoom to 100%");

  zoomControls.append(zoomInBtn, zoomOutBtn, fitBtn, resetBtn);
  header.append(headerLabel, zoomControls);

  const content = document.createElement("div");
  content.className = "preview-content";

  const transformWrapper = document.createElement("div");
  transformWrapper.className = "preview-transform-wrapper";
  content.appendChild(transformWrapper);

  element.append(header, content);

  const transform: Transform = { x: 0, y: 0, scale: 1 };

  function applyTransform(): void {
    transformWrapper.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
  }

  function zoomTo(newScale: number, centerX?: number, centerY?: number): void {
    const minScale = 0.1;
    const maxScale = 10;
    const clampedScale = Math.min(maxScale, Math.max(minScale, newScale));

    if (centerX !== undefined && centerY !== undefined) {
      const ratio = clampedScale / transform.scale;
      transform.x = centerX - ratio * (centerX - transform.x);
      transform.y = centerY - ratio * (centerY - transform.y);
    }

    transform.scale = clampedScale;
    applyTransform();
  }

  function fitToView(): void {
    const svg = getSvgElement();
    if (!svg) return;

    const contentRect = content.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();

    // Get the natural size of the SVG before any transforms
    const naturalWidth = svgRect.width / transform.scale;
    const naturalHeight = svgRect.height / transform.scale;

    if (naturalWidth === 0 || naturalHeight === 0) return;

    const padding = 40;
    const availWidth = contentRect.width - padding * 2;
    const availHeight = contentRect.height - padding * 2;

    const scaleX = availWidth / naturalWidth;
    const scaleY = availHeight / naturalHeight;
    const newScale = Math.min(scaleX, scaleY, 1);

    transform.scale = newScale;
    transform.x = (contentRect.width - naturalWidth * newScale) / 2;
    transform.y = (contentRect.height - naturalHeight * newScale) / 2;
    applyTransform();
  }

  function resetZoom(): void {
    transform.x = 0;
    transform.y = 0;
    transform.scale = 1;
    applyTransform();
  }

  // Zoom controls
  zoomInBtn.addEventListener("click", () => {
    const contentRect = content.getBoundingClientRect();
    const cx = contentRect.width / 2;
    const cy = contentRect.height / 2;
    zoomTo(transform.scale * 1.25, cx, cy);
  });

  zoomOutBtn.addEventListener("click", () => {
    const contentRect = content.getBoundingClientRect();
    const cx = contentRect.width / 2;
    const cy = contentRect.height / 2;
    zoomTo(transform.scale / 1.25, cx, cy);
  });

  fitBtn.addEventListener("click", fitToView);
  resetBtn.addEventListener("click", resetZoom);

  // Mouse wheel zoom
  content.addEventListener(
    "wheel",
    (e: WheelEvent) => {
      e.preventDefault();
      const rect = content.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      zoomTo(transform.scale * factor, mouseX, mouseY);
    },
    { passive: false },
  );

  // Mouse drag pan
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartTransformX = 0;
  let dragStartTransformY = 0;

  content.addEventListener("mousedown", (e: MouseEvent) => {
    if (e.button !== 0) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartTransformX = transform.x;
    dragStartTransformY = transform.y;
    content.style.cursor = "grabbing";
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    transform.x = dragStartTransformX + dx;
    transform.y = dragStartTransformY + dy;
    applyTransform();
  });

  window.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      content.style.cursor = "";
    }
  });

  // Touch pan and pinch zoom
  let lastTouchDistance = 0;
  let lastTouchCenterX = 0;
  let lastTouchCenterY = 0;
  let isTouching = false;

  content.addEventListener(
    "touchstart",
    (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isTouching = true;
        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
        dragStartTransformX = transform.x;
        dragStartTransformY = transform.y;
      } else if (e.touches.length === 2) {
        isTouching = false;
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
        const rect = content.getBoundingClientRect();
        lastTouchCenterX =
          (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        lastTouchCenterY =
          (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      }
      e.preventDefault();
    },
    { passive: false },
  );

  content.addEventListener(
    "touchmove",
    (e: TouchEvent) => {
      if (e.touches.length === 1 && isTouching) {
        const dx = e.touches[0].clientX - dragStartX;
        const dy = e.touches[0].clientY - dragStartY;
        transform.x = dragStartTransformX + dx;
        transform.y = dragStartTransformY + dy;
        applyTransform();
      } else if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (lastTouchDistance > 0) {
          const rect = content.getBoundingClientRect();
          const centerX =
            (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
          const centerY =
            (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
          const factor = distance / lastTouchDistance;

          // Pan with center movement
          transform.x += centerX - lastTouchCenterX;
          transform.y += centerY - lastTouchCenterY;

          zoomTo(transform.scale * factor, centerX, centerY);

          lastTouchCenterX = centerX;
          lastTouchCenterY = centerY;
        }

        lastTouchDistance = distance;
      }
      e.preventDefault();
    },
    { passive: false },
  );

  content.addEventListener("touchend", (e: TouchEvent) => {
    if (e.touches.length === 0) {
      isTouching = false;
      lastTouchDistance = 0;
    } else if (e.touches.length === 1) {
      // Went from pinch to single finger: reset drag start
      isTouching = true;
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
      dragStartTransformX = transform.x;
      dragStartTransformY = transform.y;
      lastTouchDistance = 0;
    }
  });

  // Set default cursor
  content.style.cursor = "grab";

  async function render(code: string): Promise<void> {
    if (!code.trim()) {
      transformWrapper.innerHTML =
        '<div class="preview-placeholder">Enter a Mermaid diagram in the editor</div>';
      return;
    }

    const id = `mermetic-diagram-${renderCounter++}`;

    try {
      // Remove previous temporary render containers
      const oldContainer = document.getElementById(id);
      if (oldContainer) oldContainer.remove();

      const { svg } = await mermaid.render(id, code);
      transformWrapper.innerHTML = svg;

      // Remove any error styling
      transformWrapper.classList.remove("preview-error");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      // Clean up any leftover element mermaid may have created
      const leftover = document.getElementById("d" + id);
      if (leftover) leftover.remove();

      transformWrapper.classList.add("preview-error");
      transformWrapper.innerHTML = `<div class="preview-error-message">
        <div class="preview-error-title">Diagram Error</div>
        <pre class="preview-error-detail">${escapeHtml(message)}</pre>
      </div>`;
    }
  }

  function getSvgElement(): SVGElement | null {
    return transformWrapper.querySelector("svg");
  }

  return { render, getSvgElement, element };
}

function createButton(text: string, title: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "preview-zoom-btn";
  btn.textContent = text;
  btn.title = title;
  btn.type = "button";
  btn.setAttribute("aria-label", title);
  return btn;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
