export function isHttpsOrHttpUrl(value: string): boolean {
  const v = value.trim();
  return /^https:\/\//i.test(v) || /^http:\/\//i.test(v);
}
