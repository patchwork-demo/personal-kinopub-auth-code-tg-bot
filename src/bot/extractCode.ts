/** Decode Gmail API base64url body segments. */
export function decodeGmailBody(data: string): string {
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64").toString("utf-8");
}

/**
 * First 6 consecutive digits inside a <strong>...</strong> block (nested tags stripped).
 */
export function extractSixDigitCodeFromHtml(html: string): string | null {
  const strongRe = /<strong[^>]*>([\s\S]*?)<\/strong>/gi;
  let m: RegExpExecArray | null;
  while ((m = strongRe.exec(html)) !== null) {
    const chunk = m[1];
    if (chunk === undefined) continue;
    const inner = chunk.replace(/<[^>]+>/g, "");
    const digit = inner.match(/\d{6}/);
    if (digit?.[0]) return digit[0];
  }
  return null;
}

/** Fallback when there is no HTML part. */
export function extractSixDigitCodeFromPlain(text: string): string | null {
  const m = text.match(/\b\d{6}\b/);
  return m ? m[0] : null;
}
