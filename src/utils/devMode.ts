export function isDevMode(url: URL): boolean {
  return url.searchParams.get('dev-mode') === 'true'
}
