/**
 * Share link encoding/decoding.
 *
 * Diagram text is compressed with deflate-raw (via the browser's built-in
 * CompressionStream API), then base64url-encoded and placed in the URL
 * fragment. Because fragments are never sent to the server in HTTP requests,
 * the diagram content stays entirely client-side.
 *
 * Format: #v1.<base64url-encoded deflate-raw payload>
 *
 * The "v1." prefix allows us to evolve the encoding scheme in the future
 * without breaking old links.
 */

const SHARE_VERSION_PREFIX = "v1.";

// ── Base64url helpers (RFC 4648 §5, no padding) ──────────────────────

function uint8ToBase64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlToUint8(encoded: string): Uint8Array {
  // Restore standard base64 alphabet + padding
  let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (base64.length % 4)) % 4;
  base64 += "=".repeat(padLength);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ── Compression helpers (deflate-raw via CompressionStream) ──────────

async function compress(text: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const input = encoder.encode(text);
  const cs = new CompressionStream("deflate-raw");
  const writer = cs.writable.getWriter();
  void writer.write(input);
  void writer.close();

  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  // Concatenate chunks
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

async function decompress(data: Uint8Array): Promise<string> {
  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  const copy = new ArrayBuffer(data.byteLength);
  new Uint8Array(copy).set(data);
  void writer.write(copy);
  void writer.close();

  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  const decoder = new TextDecoder();
  return decoder.decode(result);
}

// ── Public API ───────────────────────────────────────────────────

/**
 * Encodes diagram code into a URL-safe fragment string (without the leading #).
 * Returns e.g. "v1.eJxLT..."
 */
export async function encodeShareFragment(code: string): Promise<string> {
  const compressed = await compress(code);
  return SHARE_VERSION_PREFIX + uint8ToBase64url(compressed);
}

/**
 * Decodes a share fragment (without the leading #) back into diagram code.
 * Throws if the fragment format is unrecognised.
 */
export async function decodeShareFragment(fragment: string): Promise<string> {
  if (!fragment.startsWith(SHARE_VERSION_PREFIX)) {
    throw new Error("Unsupported share link version.");
  }
  const encoded = fragment.slice(SHARE_VERSION_PREFIX.length);
  const compressed = base64urlToUint8(encoded);
  return decompress(compressed);
}

/**
 * Checks whether a URL hash looks like a share fragment.
 * Expects the raw hash value including the leading "#".
 */
export function isShareFragment(hash: string): boolean {
  return hash.startsWith("#" + SHARE_VERSION_PREFIX);
}

/**
 * Builds a full share URL for the current origin/path.
 */
export async function buildShareUrl(code: string): Promise<string> {
  const fragment = await encodeShareFragment(code);
  return `${window.location.origin}${window.location.pathname}#${fragment}`;
}

/**
 * Reads the current URL hash and decodes the diagram if it's a share link.
 * Returns null if the hash is not a share fragment.
 */
export async function loadFromShareUrl(): Promise<string | null> {
  const hash = window.location.hash;
  if (!isShareFragment(hash)) {
    return null;
  }
  // Strip the leading "#"
  const fragment = hash.slice(1);
  return decodeShareFragment(fragment);
}

/**
 * Removes the share fragment from the URL without triggering a page reload.
 * Uses replaceState so the back button isn't polluted.
 */
export function clearShareFragment(): void {
  if (window.location.hash) {
    history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  }
}
