import { decodeContentType } from "@spore-sdk/core";

export const IMAGE_MIME_TYPE = ["image/png", "image/gif", "image/jpeg", "image/svg+xml", "image/webp", "image/avif"];

export function formatString(str: string, unit: number): string {
  if (str.length <= (unit * 2)) {
    return str;
  }
  const start: string = str.substring(0, unit);
  const end: string = str.substring(str.length - unit);
  return `${start}*****${end}`;
}

export function isImageMIMEType(contentType: string | undefined | null) {
  if (!contentType) {
    return false;
  }
  const { type, subtype } = decodeContentType(contentType);
  return IMAGE_MIME_TYPE.includes(`${type}/${subtype}` as any);
}