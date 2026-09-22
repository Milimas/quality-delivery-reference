export async function fetchJson(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(5000) });
  return { status: response.status, body: await response.json() };
}
