export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export type Engine = 'python' | 'local'

export async function fetchWithFallback<T>(
  endpoint: string,
  options: RequestInit,
  localFallback: () => T
): Promise<{ data: T; engine: Engine }> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, options)

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const json = (await res.json()) as T
    return { data: json, engine: 'python' }
  } catch {
    const result = localFallback()
    return { data: result, engine: 'local' }
  }
}
