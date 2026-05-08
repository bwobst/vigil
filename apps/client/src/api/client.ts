export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);

  if (!res.ok) {
    let message = res.statusText;
    try {
      const json = (await res.json()) as { message?: string | string[] };
      if (json.message) {
        message = Array.isArray(json.message) ? json.message.join("; ") : json.message;
      }
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204 || res.status === 202) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export function apiFetchJson<T>(path: string, method: string, data: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
