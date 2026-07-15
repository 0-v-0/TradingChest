/**
 * Trigger a browser download for a URL (blob: or data:).
 * Creates a temporary <a> element, clicks it, then cleans up.
 */
export function downloadUrl(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
