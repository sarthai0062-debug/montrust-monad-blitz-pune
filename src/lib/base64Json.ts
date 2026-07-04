/** UTF-8 safe base64 for agent card JSON (btoa fails on em-dashes and unicode). */
export function encodeJsonToBase64(value: unknown): string {
  const json = JSON.stringify(value);
  if (typeof TextEncoder !== "undefined") {
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }
  return Buffer.from(json, "utf8").toString("base64");
}

export function buildDataUriJsonBase64(value: unknown): string {
  return `data:application/json;base64,${encodeJsonToBase64(value)}`;
}
